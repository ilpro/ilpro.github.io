'use strict';
const db = require('./db');
const STATUS = require('./status');
const ErrorHandler = require('./errorHandler');

const User = require('./user');

const Conversation = {

  async getParticipantsAndType(userId, conversationId) {
    try {
      if (!conversationId || !userId) {
        throw {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation.getParticipants: conversationId or userId is not specified"
        };
      }

      const getParticipantsRes = await this._getParticipantsAndType(conversationId);
      const participants = getParticipantsRes.participants;
      const conversationType = getParticipantsRes.conversationType;
      if (!participants) return getParticipantsRes;

      const userInParticipantsRes = await this._checkUserInParticipants(userId, getParticipantsRes.participants);
      const isUserInParticipants = userInParticipantsRes.isUserInParticipants;
      if (!isUserInParticipants) {
        return {
          success: false,
          status: STATUS.ACCESS_DENIED,
          message: "User tries to access closed conversation"
        };
      }

      return {success: true, status: STATUS.OK, conversationId, participants, conversationType, isUserInParticipants}
    } catch (err) {
      return ErrorHandler(err);
    }
  },

  /**
   * Get all participants of specified conversation id
   * @param conversationId
   * @returns {Promise}
   * @private
   */
  _getParticipantsAndType(conversationId) {
    return new Promise((res, rej) => {
      if (!conversationId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation._getParticipantsAndType: conversationId is not specified"
        });
      }

      db.query(
        'SELECT * FROM tbl_conversation_participants WHERE conversationId = ?;\
         SELECT \
           conv_type.type \
         FROM tbl_conversation AS conv\
         LEFT JOIN tbl_conversation_type AS conv_type ON conv.type = conv_type.id \
         WHERE conv.id = ? AND conv.enabled = 1',
        [conversationId, conversationId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation._getParticipantsAndType: " + err
            });
          }

          if (!rows[0].length || !rows[1].length) {
            return res({success: true, status: STATUS.NOT_FOUND, participants: null, conversationType: undefined});
          }

          return res({
            success: true,
            status: STATUS.OK,
            participants: rows[0].map(row => row.userId),
            conversationType: rows[1][0].type,
          });
        })
    })
  },

  /**
   * Check if participantas array includes user id
   * @param userId
   * @param participantsArr
   * @returns {Promise}
   * @private
   */
  _checkUserInParticipants(userId, participantsArr) {
    return new Promise((res, rej) => {
      const isUserInParticipants = participantsArr.includes(+userId);

      if (isUserInParticipants) {
        return res({success: true, status: STATUS.OK, isUserInParticipants})
      }

      return res({success: true, status: STATUS.NOT_FOUND, isUserInParticipants})
    })
  },

  /**
   * Create new conversation
   *
   * @param userId
   * @param receiversArr
   * @param conversationType
   *
   * @returns {Promise}
   *   {success, status, conversationId, conversationType, participants}
   */
  async create(userId, receiversArr, conversationType = 'chat') {
    try {
      if (!userId) {
        return {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation.create: userId is not specified"
        };
      }

      if(conversationType === 'chat' && (!receiversArr || !receiversArr.length)){
        return {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: 'Error in Conversation.create: conversationType is "chat" but there are no receivers'
        };
      }

      const conversationCreateRes = await this._createConversation(userId, conversationType);
      const conversationId = conversationCreateRes.conversationId;

      let participants = [userId];
      if (receiversArr && receiversArr.length > 0) {
        participants = participants.concat(receiversArr);
      }

      await this._insertParticipants(conversationId, participants);

      return {success: true, status: STATUS.OK, conversationId, conversationType, participants}
    } catch (err) {
      return ErrorHandler(err);
    }
  },

  _createConversation(userId, conversationType) {
    return new Promise((res, rej) => {
      if (!userId || !conversationType) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation._createConversation: userId or conversationType is not specified"
        })
      }

      let type; // chat type by default
      switch (conversationType) {
        case 'chat':
          type = 1;
          break;
        case 'event':
          type = 2;
          break;
        default:
          type = 1;
      }

      db.query('INSERT INTO tbl_conversation (type) VALUES(?)',
        [type],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Conversation.createConversation:\n" + err
          });

          return res({success: true, status: STATUS.OK, conversationId: rows.insertId});
        })
    });
  },

  _insertParticipants(conversationId, participants) {
    return new Promise((res, rej) => {
      if (!conversationId || !participants || !participants.length) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation._insertParticipants: userId or participants is not specified"
        })
      }

      const bulk = [];
      participants.forEach(participantId => bulk.push([+conversationId, +participantId]));

      db.query(
        'INSERT INTO tbl_conversation_participants (conversationId, userId) VALUES ?',
        [bulk],
        err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Conversation.insertParticipants:\n" + err
          });

          return res({success: true, status: STATUS.OK, conversationId, participants});
        });
    });
  },

  /**
   * Get conversations in which user takes part
   * Get the newest message for every conversation in passed array
   *
   * @param userId
   * @param conversationTypes
   * @param limit
   * @param offset
   *
   * @returns {Promise}
   *   {success, status, conversations}
   */
  getListByUserId({userId, conversationTypes = [], limit = 30, offset = 0}) {
    return new Promise((res, rej) => {
      if (!userId) {
        throw {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation.getByUserId: userId is not specified"
        }
      }

      let typeFilter = '';
      if (conversationTypes && Array.isArray(conversationTypes) && conversationTypes.length > 0) {
        typeFilter = ` AND conv_type.type IN (${db.escape(conversationTypes)})`;
      }

      db.query(
        'SET SESSION group_concat_max_len = 1000000;\
         SELECT\
           conv.id AS conversationId,\
           conv_type.type AS conversationType,\
           conv.updated,\
           conv_part.unreadCount AS totalUnread,\
           chat.messageId,\
           chat.senderId,\
           chat.messageText,\
           chat.messageTime,\
           chat.attachmentExists,\
           chat.type, \
           chat.link,\
           usr.userId,\
           usr.userNickname,\
           usr.userPhoto,\
           usr.userRole,\
           usr.userActive,\
           usr.userLastActive,\
           usr.userChatStatus,\
		   usr.userVerification,\
           (\
               SELECT \
                 CONCAT(\'[\', \
                   GROUP_CONCAT(\
                     CONCAT(\'{\
                       "userId":"\', usr_2.userId, \'",\
                       "userPhoto":"\', usr_2.userPhoto, \'",\
                       "userNickname":"\', usr_2.userNickname, \'",\
                       "userRemoved":"\', usr_2.userRemoved, \'",\
					   "userVerification":\', usr_2.userVerification, \'\
                     }\') SEPARATOR ","\
                   ), \'\
                 ]\')\
               FROM tbl_conversation_participants AS conv_part_2 \
               LEFT JOIN tbl_user AS usr_2 ON conv_part_2.userId = usr_2.userId\
               WHERE conv_part_2.conversationId = conv.id\
           ) AS participants \
         FROM tbl_conversation AS conv\
         LEFT JOIN tbl_conversation_participants AS conv_part\
           ON conv.id = conv_part.conversationId\
         LEFT JOIN tbl_conversation_type AS conv_type\
           ON conv.type = conv_type.id\
         LEFT JOIN\
           (\
             SELECT * FROM\
               (SELECT t1.*, t2.unreadCount FROM tbl_chat AS t1\
                LEFT JOIN tbl_conversation_participants AS t2\
                  ON t1.conversationId = t2.conversationId\
                WHERE t2.userId = ?\
                ORDER BY messageId DESC) AS t3\
             GROUP BY conversationId\
           ) AS chat\
           ON conv.id = chat.conversationId\
         LEFT JOIN tbl_user AS usr\
           ON chat.senderId = usr.userId\
         WHERE conv_part.userId = ? AND conv.enabled = 1 AND messageId > 0 '+ typeFilter +'\
         ORDER BY conv_part.unreadCount DESC, conv.updated DESC\
         LIMIT ? OFFSET ?;',
        [userId, userId, limit, offset],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.getListByUserId: " + err
            });
          }

          if (!rows[1].length) {
            return res({success: true, status: STATUS.NOT_FOUND, conversations: []});
          }

          return res({success: true, status: STATUS.OK, conversations: rows[1]});
        })
    })
  },

  /**
   * Update conversation time
   * @param conversationId
   *
   * @returns {Promise}
   *   {success, status, conversationId}
   */
  updateTime(conversationId) {
    return new Promise((res, rej) => {
      if (!conversationId || !(+conversationId)) {
        throw {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation.updateTime: conversationId is not specified or invalid"
        }
      }

      db.query(
        'UPDATE tbl_conversation SET updated = NOW() WHERE id = ?',
        [conversationId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.updateTime: " + err
            });
          }

          return res({success: true, status: STATUS.OK, conversationId});
        })
    })
  },

  /**
   * Add +1 to participant's unreadCount of specified conversation id
   * @param conversationId
   * @param participantsArr
   * @returns {Promise}
   */
  increaseParticipantsUnreadCount(conversationId, participantsArr) {
    return new Promise((res, rej) => {
      if (!conversationId || !(+conversationId)) {
        throw {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Conversation.increaseParticipantsUnreadCount: conversationId is not specified or invalid"
        }
      }

      db.query(
        'UPDATE tbl_conversation_participants SET unreadCount = unreadCount + 1 WHERE conversationId = ? AND userId IN (?)',
        [conversationId, participantsArr],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.increaseParticipantsUnreadCount: " + err
            });
          }

          return res({success: true, status: STATUS.OK, conversationId, receivers: participantsArr});
        })
    })
  },

  /**
   * Read all messages for all conversations where user takes part
   *
   * @param userId
   *
   * @returns {Promise}
   *   {success, status, userId}
   */
  readAll(userId) {
    return new Promise((res, rej) => {
      if (!userId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "hash is not specified or invalid"
        })
      }

      db.query(
        'UPDATE tbl_conversation_participants SET unreadCount = 0 WHERE userId = ?',
        [userId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.updateTime: " + err
            });
          }

          return res({success: true, status: STATUS.OK, userId});
        })
    })
  },

  /**
   * Check if user already has private conversation with another.
   * ONLY FOR CHECKING PRIVATE CHATS (participants number = 2)
   *
   * @param userId
   * @param receiverId
   *
   * @returns {Promise}
   *   {success, status, isConversationExists, conversationId}
   */
  checkPrivateConversationExists(userId, receiverId) {
    return new Promise((res, rej) => {
      if (!userId || !receiverId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "Hash or receiverId is not specified or invalid"
        })
      }

      db.query(
        'SELECT \
           conv.id AS conversationId\
         FROM tbl_conversation AS conv\
         JOIN tbl_conversation_participants AS conv_part\
           ON conv.id = conv_part.conversationId\
         WHERE conv.type = 1 AND conv_part.userId IN (?, ?)\
         GROUP BY conversationId\
         HAVING COUNT(conversationId) = 2',
        [userId, receiverId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.checkPrivateConversationExists: " + err
            });
          }

          if (!rows.length) {
            return res({success: true, status: STATUS.NOT_FOUND, isConversationExists: false, userId, receiverId});
          }

          return res({
            success: true,
            status: STATUS.OK,
            isConversationExists: true,
            conversationId: rows[0].conversationId,
            userId,
            receiverId
          });
        })
    })
  },

  async getInfoById(userId, conversationId) {
    try {
      if (!userId || !conversationId) {
        return {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "conversationId or hash is not specified"
        };
      }

      const typeAndReceiversRes = await this.getParticipantsAndType(userId, conversationId);

      const info = {conversationType: typeAndReceiversRes.conversationType};

      if (typeAndReceiversRes.conversationType === 'chat') {
        const receiverId = await typeAndReceiversRes.participants.find(participant => +participant !== +userId);
        const recipientInfo = await User.getUserInfoByIdPromise(receiverId);

        info.id = recipientInfo.userId;
        info.name = recipientInfo.userName;
        info.image = recipientInfo.userPhoto;
      }

      return {success: true, status: STATUS.OK, ...info};
    } catch (err) {
      return ErrorHandler(err);
    }
  },

  /**
   * Cascade deletion all records belong to specified conversation
   *
   * @param conversationId
   * @returns {Promise}
   *   {success, status}
   */
  delete(conversationId) {
    return new Promise((res, rej) => {
      if (!conversationId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "conversationId is not specified or invalid"
        })
      }

      db.query(
        'DELETE FROM tbl_conversation WHERE id = ?;\
         DELETE FROM tbl_conversation_participants WHERE conversationId = ?;\
         DELETE FROM tbl_events_conversations WHERE conversationId = ?;\
         DELETE FROM tbl_chat_attachment WHERE messageId IN (SELECT messageId FROM tbl_chat WHERE conversationId = ?);\
         DELETE FROM tbl_chat WHERE conversationId = ?;',
        [conversationId, conversationId, conversationId, conversationId, conversationId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.checkEventConversationExists: " + err
            });
          }

          if (!rows.length) {
            return res({success: true, status: STATUS.NOT_FOUND, isConversationExists: false, eventId});
          }

          return res({success: true, status: STATUS.OK});
        })
    })
  },

  /**
   * Enable conversation for show from admin panel
   * @param conversationId
   * @returns {Promise}
   */
  enable(conversationId){
    return new Promise((res, rej) => {
      if (!conversationId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "conversationId is not specified or invalid"
        })
      }

      db.query(
        'UPDATE tbl_conversation SET enabled = 1 WHERE id = ?',
        [conversationId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.enable: " + err
            });
          }

          return res({success: true, status: STATUS.OK, conversationId, enabled: true});
        })
    })
  },

  /**
   * Disable conversation for show from admin panel
   * @param conversationId
   * @returns {Promise}
   */
  disable(conversationId){
    return new Promise((res, rej) => {
      if (!conversationId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "conversationId is not specified or invalid"
        })
      }

      db.query(
        'UPDATE tbl_conversation SET enabled = 0 WHERE id = ?',
        [conversationId],
        (err, rows) => {
          if (err) {
            return rej(ErrorHandler({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Conversation.disable: " + err
            }));
          }

          return res({success: true, status: STATUS.OK, conversationId, enabled: false});
        })
    })
  },
};

module.exports = Conversation;

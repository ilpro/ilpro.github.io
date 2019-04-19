'use strict';
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const base64 = require('base-64');
const utf8 = require('utf8');
const emojiRegex = require('emoji-regex');
const regex = emojiRegex();

const db = require('./db');
const Helper = require('./helper');
const User = require('./user');
const Mailer = require('./mailer');
const Notifications = require('./notifications');
const Html_letters = require('./html_letters');

const Conversation = require('./conversation');
const STATUS = require('./status');
const ErrorHandler = require('./errorHandler');

const Chat = {

  /**
   * Get conversation messages by conversation Id
   * @param data
   *   {hash, userId, conversationId, limit, offset}
   * @returns {Promise<*>}
   */
  async getMessages(data) {
    try {
      if (!data.userId || !data.conversationId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'hash is invalid or not specified'
        }
      }

      const getConversationIdRes = await Conversation.getParticipantsAndType(data.userId, data.conversationId);

      // this conversation has no any participants or user is not in this conversation
      if (!getConversationIdRes.conversationId) {
        return getConversationIdRes;
      }

      const receivers = await getConversationIdRes.participants.filter(participant => +participant !== +data.userId);

      const getMessagesRes = await this._getMessagesFromDb(data);
      if (!getMessagesRes.messages.length) {
        return {
          success: true,
          status: STATUS.NOT_FOUND,
          messages: [],
          conversationId: data.conversationId,
          receivers
        };
      }

      const unreadReceiversCount = getMessagesRes.unreadReceiversCount;
      const messages = getMessagesRes.messages;
      const messageIds = messages.map(msg => +msg.messageId);

      const getAttachmentsRes = await this._getAttachments(messageIds);
      const attachments = getAttachmentsRes.attachments;

      const messagesWithAttachments = await messages.map(msg => {
        const msgAttachments = attachments.find(elem => +elem.messageId === msg.messageId);
        const attachment = msgAttachments ? msgAttachments.attachment : [];
        return {...msg, attachment};
      });

      return {
        success: true,
        status: STATUS.OK,
        messages: this.reformatOuterMessage(messagesWithAttachments),
        conversationId: data.conversationId,
        receivers,
        unreadReceiversCount
      };
    } catch (err) {
      return await ErrorHandler(err);
    }
  },

  /**
   * Get messages from DB by passed conversation ID\
   *
   * @param conversationId
   * @param userId
   * @param limit (optional)
   * @param offset (optional)
   *
   * @returns {Promise}
   *   {success, status, messages}
   * @private
   */
  _getMessagesFromDb({conversationId, userId, limit = 30, offset = 0}) {
    return new Promise((res, rej) => {
      if (!conversationId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat._getMessagesFromDb: conversationId is not specified"
        });
      }

      db.query(
        'SELECT MIN(unreadCount) AS receiversUnread\
         FROM tbl_conversation_participants \
         WHERE conversationId = ? AND userId != ?;\
         SELECT * FROM (\
           SELECT \
             tc.`messageId`,\
             tc.`messageText`,\
             tc.`messageTime`,\
             tc.`type`,\
             tc.`link`,\
             tc.`attachmentExists`,\
             tu.`userId`,\
             tu.`userNickname`,\
             tu.`useNickname`,\
             tu.`userPhoto`,\
             tu.`userName`,\
             tu.`userLastName`,\
             tu.`userRole`\
           FROM `tbl_chat` AS tc\
           LEFT JOIN `tbl_user` AS tu\
             ON tc.`senderId` = tu.`userId`\
           WHERE conversationId = ?\
           ORDER BY `messageTime` DESC\
           LIMIT ? OFFSET ?\
         ) AS firstSelect\
         ORDER BY firstSelect.messageTime ASC;',
        [conversationId, userId, conversationId, limit, offset],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Chat._getMessagesFromDb:\n" + err
            });
          }

          return res({
            success: true,
            status: STATUS.OK,
            unreadReceiversCount: rows[0][0].receiversUnread,
            messages: rows[1]
          });
        });
    })
  },

  /**
   * Get attachments for messages IDs array
   *
   * @param messagesArr
   *
   * @returns {Promise}
   *   {success: true, status: STATUS.OK, attachments}
   *
   * @private
   */
  _getAttachments(messagesArr) {
    return new Promise((res, rej) => {
      if (!messagesArr) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat._getAttachments: messagesArr is not specified"
        });
      }

      db.query(
        'SET SESSION group_concat_max_len = 1000000;\
         SELECT\
                 `messageId`,\
                  CONCAT(\'[\', \
                    GROUP_CONCAT(\
                      CONCAT(\'{\
                        "path":"\', `path`, \'", \
                        "attachmentId":"\', t_attach.`id`,\'", \
                        "type":"\', `type`, \'", \
                        "thumbPath":"\', `thumbPath`, \'"\
                      }\') SEPARATOR ","\
                    ), \'\
                  ]\') AS attachment\
               FROM `tbl_chat_attachment` AS t_attach\
               WHERE `messageId` IN (?)\
             GROUP BY `messageId`;',
        [messagesArr],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Chat._getAttachments: " + err
            });
          }
          const attachmentsRows = rows[1];

          // parse JSON attachments
          const attachments = attachmentsRows.map(attachmentObj => {
            const parsedAttachment =
              typeof attachmentObj.attachment === 'string' ? JSON.parse(attachmentObj.attachment) : [];

            return {...attachmentObj, attachment: parsedAttachment}
          });

          return res({success: true, status: STATUS.OK, attachments});
        }
      )
    });
  },

  /**
   * Send message - private or group
   *
   * @param data
   *   {hash, userId, conversationId, message, attachments, type, link}
   *
   * @returns {Promise<*>}
   */
  async saveMessage(data) {
    try {
      if (!data.userId || !data.conversationId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'hash or conversationId is invalid or not specified'
        }
      }

      const getConversationIdRes = await Conversation.getParticipantsAndType(data.userId, data.conversationId);
      // this conversation has no any participants or user is not in this conversation
      if (!getConversationIdRes.isUserInParticipants) return getConversationIdRes;

      const conversationType = getConversationIdRes.conversationType;
      const receivers = await getConversationIdRes.participants.filter(participant => +participant !== +data.userId);

      // validation
      let checkResult = {banned: true};
      if (conversationType === 'chat') {
        checkResult = await this._checkConditionsForPrivateChat(data.userId, receivers);
      } else {
        checkResult = {banned: false};
      }
      if(checkResult.banned) return checkResult;

      // insert message and update DB state
      await Conversation.updateTime(data.conversationId);
      if(receivers && receivers.length){
        await Conversation.increaseParticipantsUnreadCount(data.conversationId, receivers);
      }

      const messageIdRes = await this._insertMessageIntoDb(data);
      data.messageId = messageIdRes.messageId;

      const attachmentsRes = await this._saveChatAttachments(data.messageId, data.attachments);
      data.attachment = attachmentsRes.attachments;
      // current data = {hash, conversationId, userId, message, attachments, type, link, messageId, attachment}

      // for application
      const user = await User.getUserInfoByIdPromise(data.userId);
      const userName = user.userName;
      const userPhoto = user.userPhoto;

      return {
        conversationId: data.conversationId,
        conversationType,
        message: data.message,
        type: data.type,
        link: data.link,
        userId: data.userId,
        userName,
        userPhoto,
        receivers,
        messageId: data.messageId,
        attachment: data.attachment,
        success: true,
        status: STATUS.OK,
      };
    } catch (err) {
      return ErrorHandler(err)
    }
  },

  /**
   * Check sender/receiver statuses and other conditions
   *
   * @param senderId
   * @param receivers
   * @returns {Promise<*>}
   * @private
   */
  async _checkConditionsForPrivateChat(senderId, receivers) {
    try {
      if (!receivers || !receivers.length || !senderId) {
        throw {
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Chat._checkConditionsForPrivateChat: Message type is "chat" (1-to-1) but there are no receivers'
        }
      }

      const receiverId = receivers[0];

      const checkUserDeletedRes = await User.checkUserDeleted(senderId, receiverId);
      if (checkUserDeletedRes.banned) return checkUserDeletedRes;

      const checkUserSubscriptionRes = await User.checkUserSubscription(senderId, receiverId);
      if (checkUserSubscriptionRes.banned) return checkUserSubscriptionRes;

      const receiverBlackListCheckRes = await User.checkBlacklist(senderId, receiverId);
      if (receiverBlackListCheckRes.banned) return receiverBlackListCheckRes;

      const statusesCheckRes = await this._checkStatuses(senderId, receiverId);
      if (statusesCheckRes.banned) return statusesCheckRes;

      return {success: true, status: STATUS.OK, banned: false}
    } catch (err) {
      return ErrorHandler(err);
    }
  },

  /** Check user status - if receiver set to 'not disturb' cancel message sending and send back message for sender**/
  _checkStatuses(senderId, receiverId) {
    return new Promise((res, rej) => {
      if (!senderId || !receiverId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat.checkUserChatStatus: senderId or receiverId is not specified"
        })
      }

      db.query(
        'SELECT `userChatStatus` FROM `tbl_user` WHERE `userId` = ?;\
         SELECT `userChatStatus` FROM `tbl_user` WHERE  `userId` = ?;\
         SELECT * FROM `ctbl_userfavorite` WHERE `userId` = ? AND `profileId` = ?;',
        [senderId, receiverId, receiverId, senderId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Chat._checkUserChatStatus: " + err
            })
          }
          else {
            const senderStatus = +rows[0][0].userChatStatus;
            const receiverStatus = +rows[1][0].userChatStatus;
            const userInFavorites = rows[2].length > 0;

            // chat with support without restrictions
            if (senderId === 1 || receiverId === 1) {
              return res({success: true, status: STATUS.OK, banned: false});
            }

            // if two users ready to talk - send message
            if ((senderStatus === 1 && receiverStatus === 1) || (senderStatus === 2 && receiverStatus === 1)) {
              return res({success: true, status: STATUS.OK, banned: false});
            }

            // sender set "don't disturb status" for himself, cancel message sending
            if (+senderStatus === 3) {
              return res({
                success: true,
                status: STATUS.DO_NOT_DISTURB_SENDER,
                banned: true,
                message: 'Sorry, you can not send messages while you have the "Do not disturb" status'
              });
            }

            // receiver set "don't disturb status" for himself, cancel message sending from sender
            if (+receiverStatus === 3) {
              return res({
                success: true,
                status: STATUS.DO_NOT_DISTURB_RECEIVER,
                banned: true,
                message: 'Sorry, you can not send messages because receiver set status to "Do not disturb"'
              });
            }

            // if user in receiver's favorites - send message and receiver set status to "only favorites" - send message
            if (+receiverStatus === 2 && userInFavorites) {
              return res({success: true, status: STATUS.OK, banned: false});
            } else {
              return res({
                success: true,
                status: STATUS.ONLY_FAVORITES_RECEIVER,
                banned: true,
                message: 'Sorry, you can not send messages because receiver set status to "Only favorites" and you are not in hi favorite\'s list'
              });
            }
          }
        }
      );
    });
  },

  /** Insert message into DB **/
  _insertMessageIntoDb({conversationId, userId, message = '', attachments = [], type = 'text', link = ''}) {
    return new Promise((res, rej) => {
      if (!conversationId || !userId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat._insertMessageIntoDb: conversationId or senderId is not specified"
        });
      }

      const attachmentExists = attachments && attachments.length > 0 ? 1 : 0;

      db.query(
        'INSERT INTO `tbl_chat` \
         (conversationId, senderId, messageText, attachmentExists, type, link) \
         VALUES (?, ?, ?, ?, ?, ?);',
        [+conversationId, +userId, message, attachmentExists, type, link],
        (err, row) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Chat._insertMessageIntoDb: " + err
            });
          }

          return res({
            success: true,
            status: STATUS.OK,
            messageId: row.insertId
          });
        }
      );
    });
  },

  /** Save chat attachments into DB **/
  _saveChatAttachments(messageId, attachments) {
    return new Promise((res, rej) => {
      if (!messageId) {
        return rej({
          success: true,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat._insertMessageIntoDb: " + err
        });
      }

      if (!attachments || !attachments.length) {
        return res({success: true, status: STATUS.OK, attachments: []});
      }

      // bulk insert needs to be like nested arrays, so make it
      // var bulk = [
      //   ['mark', 'mark@gmail.com'],
      //   ['pete', 'pete@gmail.com']
      // ];
      const bulk = [];
      for (let i = 0; i < attachments.length; i++) {
        const type = attachments[i].thumbPath ? 'video' : 'photo';
        const thumbPath = attachments[i].thumbPath ? attachments[i].thumbPath : '';
        bulk.push([messageId, attachments[i].attachmentPath, type, thumbPath]);
      }

      const query = "INSERT INTO tbl_chat_attachment (messageId, path, type, thumbPath) VALUES ?";
      db.query(query, [bulk], err => {
        if (err) {
          return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Chat._saveChatAttachments - save attachments: " + err
          });
        }

        // get inserted attachments
        this._getAttachments([messageId])
          .then(getAttachmentsRes => {
            return res({success: true, status: STATUS.OK, attachments: getAttachmentsRes.attachments[0].attachment})
          })
          .catch(err => rej(err))
      });
    })
  },

  /**
   * User read messages when he opens the chat. Pass to method array with messages ID
   *
   * @param userId
   * @param conversationId
   * @returns {Promise}
   *   {success, status, conversationId, userId, totalUnread, receivers }
   */
  async userReadMessages(userId, conversationId) {
    try {
      if (!userId || !conversationId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'hash or conversation Id is invalid or not specified'
        }
      }

      const updateIntoDbResult = await new Promise((res, rej) => {
        db.query(
          'UPDATE tbl_conversation_participants SET unreadCount = 0 WHERE conversationId = ? AND userId = ?;\
           SELECT userId FROM tbl_conversation_participants  WHERE conversationId = ? AND userId != ?;\
           SELECT SUM(unreadCount) AS count FROM tbl_conversation_participants WHERE `userId` = ?;;',
          [conversationId, userId, conversationId, userId, userId],
          (err, rows) => {
            if (err) {
              return rej({
                success: false,
                status: STATUS.INTERNAL_ERROR,
                message: "Error in Chat.userReadMessages: " + err
              })
            }

            return res({
              totalUnread: rows[2][0].count,
              receivers: rows[1].map(receiver => {
                if (+receiver.userId !== +userId) return +receiver.userId
              })
            });
          });
      });

      return {
        success: true,
        status: STATUS.OK,
        conversationId,
        userId,
        totalUnread: updateIntoDbResult.totalUnread,
        receivers: updateIntoDbResult.receivers
      };
    } catch (err) {
      return ErrorHandler(err);
    }

  },

  /** Make all received messages read for user **/
  async userReadAllMessages({userId}) {
    try {
      if (!userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "Error in Chat.userReadAllMessages: userId is not specified or invalid"
        }
      }

      return await Conversation.readAll(userId);
    } catch (err) {
      return ErrorHandler(err);
    }
  },

  /** Send message to email **/
  sendUnreadMessageToEmail(messageId) {
    const self = this;
    // check if user read message
    // if no, send message to receiver
    db.query(
      "SELECT \
         tbl_msg.`senderId`,\
         tbl_msg.`receiverId`,\
         tbl_msg.`messageRead`,\
         tbl_msg.`messageText`,\
         tbl_sender.`userId` AS senderId,\
         tbl_sender.`userNickname` AS senderNickname,\
         tbl_sender.`useNickname` AS senderUseNickname,\
         tbl_sender.`userName` AS senderName,\
         tbl_sender.`userLastName` AS senderLastName,\
         tbl_sender.`userPhoto` AS senderPhoto,\
         tbl_receiver.`userNickname` AS receiverNickname,\
         tbl_receiver.`useNickname` AS receiverUseNickname,\
         tbl_receiver.`userName` AS receiverName,\
         tbl_receiver.`userEmail`, \
         tbl_receiver.`subscribeMessages` AS subscribeMessages,\
		     tbl_receiver.`userRole` \
       FROM `tbl_chat` AS tbl_msg\
       LEFT JOIN `tbl_user` AS tbl_sender\
         ON tbl_sender.`userId` = tbl_msg.`senderId`\
       LEFT JOIN `tbl_user` AS tbl_receiver\
         ON tbl_receiver.`userId` = tbl_msg.`receiverId`\
       WHERE `messageId` = ?;",
      [messageId],
      (err, rows) => {
        if (err) {
          console.log('Error occurs in messages.sendUnreadMessageToEmail', err)
        } else {
          // handle user name
          rows = self.reformatOuterMessage(rows, true);

          let result = rows[0];

          if (
            !result ||
            +result.messageRead === 1 ||
            !result.userEmail ||
            result.userEmail.length === 0 ||
            +result.subscribeMessages === 0
          ) {
            return
          }

          // send email
          var re = /^https?:/g;
          result.senderPhoto = (re.test(result.senderPhoto) ? result.senderPhoto : 'https://www.pickbride.com' + result.senderPhoto);

          var params = {
            receiverId: result.receiverId,
            receiverName: result.receiverName,
            senderId: result.senderId,
            senderName: result.senderName,
            senderPhoto: result.senderPhoto
          };

          Html_letters.getChatMessage(params, function (html) {
            var subject = "New chat message";

            if (result.userRole != 19) {
              Mailer.sendMessage({
                "to": result.userEmail,
                "subject": subject,
                "html": html
              }, false);
            }
          });
        }
      });
  },

  /**
   * Get last messages for every conversation in user's chat list
   *
   * @param data
   *   {hash, userId, [conversationType, offset, limit, search]}
   * @returns {Promise}
   *   {success, status, chatList}
   */
  async getChatList(data) {
    try {
      if (!data.userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'hash is invalid or not specified'
        }
      }
      const self = this;

      // params: {userId, [conversationTypes, limit, offset]}
      const chatListRes = await Conversation.getListByUserId(data);
      if (!chatListRes.conversations || !chatListRes.conversations.length) {
        return {success: true, status: STATUS.NOT_FOUND, message: 'User has no conversations', chatList: []};
      }

      const chatList = chatListRes.conversations.map(conv => {
        if (conv.userLastActive != "0000-00-00") conv.userLastActive = Helper.getDateTimeSince(conv.userLastActive);

        // replace sticker's codes with :smile: or :sticker: text
        conv.messageText = self.reformatOuterText(conv.messageText);
        conv = Helper.handleUserName(conv);

        // handle participants names
        conv.participants = JSON.parse(conv.participants);
        conv.participants = conv.participants.map(participant => {
          participant.userId = +participant.userId; //
          participant.userRemoved = +participant.userRemoved; //
          return Helper.handleUserName(participant);
        });
        return conv
      });

      return {success: true, status: STATUS.OK, chatList: chatList}
    } catch (err) {
      return ErrorHandler(err);
    }
  },

  /**
   * Search receivers in conversations by their ID or nickname
   *
   * @param userId
   * @param search
   * @param conversationTypes
   *
   * @returns {Promise}
   *   {success: boolean, status: string, chatList: Array}
   */
  async search({userId, search, conversationTypes}) {
    try {
      if (!userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: "Error in Chat.search: userId is not specified"
        };
      }

      if (!search || !search.trim()) {
        return {success: true, status: STATUS.NOT_FOUND, chatList: []}
      }

      const allConversationsRes = await this.getChatList({userId, limit: 9999, conversationTypes});
      if (!allConversationsRes.chatList.length) {
        return {success: true, status: STATUS.NOT_FOUND, chatList: []}
      }

      const chatListFilteredRes = await this._filterBySearch(allConversationsRes.chatList, userId, search);
      if (!chatListFilteredRes.chatList.length) {
        return {success: true, status: STATUS.NOT_FOUND, chatList: []}
      }

      return {success: true, status: STATUS.OK, chatList: chatListFilteredRes.chatList}
    } catch (err) {
      return ErrorHandler(err)
    }
  },

  /**
   * Filter chatList by search restriction
   *
   * @param userId
   * @param chatList
   * @param search
   *
   * @returns {Promise}
   *
   * @private
   */
  _filterBySearch(chatList, userId, search) {
    return new Promise((res, rej) => {
      if (!userId || !chatList || !chatList.length || !search) {
        throw {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat._filterBySearch: userId or chatList or search is not specified"
        };
      }

      const filtred = chatList.filter(conversation => {
        const receivers = conversation.participants.filter(participant => +participant !== +userId);
        return receivers.find(receiver => (receiver.userName.includes(search) || +receiver.userId === +search))
      });

      return res({success: true, status: STATUS.OK, chatList: filtred})
    })
  },

  async sendAdminMessage(recipientId) {
    try {
      if (!recipientId) {
        throw {
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: "Error in Chat.sendAdminMessage: recipientId is not specified"
        };
      }

      const senderId = 1;
      const receivers = [+recipientId];

      const createConversationRes = await Conversation.create(senderId, receivers);
      const conversationId = createConversationRes.conversationId;

      const dataToInsert = {
        conversationId,
        userId: senderId,
        message: 'Hi, welcome to Airybay! &amp;sm-0003; You are free to ask any questions in this chat 24/7. We will find the best and the fastest solution for any type of request. Chat, Date and Travel for free! &amp;sm-0002;&amp;sm-0025;'

      };

      await this._insertMessageIntoDb(dataToInsert);
      await Conversation.increaseParticipantsUnreadCount(conversationId, receivers)
    } catch (err) {
      return ErrorHandler(err)
    }
  },

  /** Upload chat attachment **/
  uploadChatAttachment(send, data) {
    const self = this;
    const imageFormats = {'jpg': true, 'png': true, 'jpeg': true};

    // change register
    data.file.name = data.file.name.toLowerCase();

    const time = (new Date()).getTime();
    const filenameSplited = data.file.name.split(".");
    const fileRes = filenameSplited[filenameSplited.length - 1];
    const fileName = data.userId + "_" + time + "." + fileRes;
    const filePath = "public/uploads/chat-attachment/" + fileName;

    fs.writeFile(filePath, data.file.data, function (err) {
      if (err) {
        console.log("Error occurs in Chat.uploadChatAttachment, fs.writeFile func", err);
      } else {
        const sendData = {
          attachmentPath: `/uploads/chat-attachment/${fileName}`,
        };

        // if video upload, save screen for it and send video and thumb paths
        if (!(fileRes in imageFormats)) {
          const thumbName = data.userId + "_" + time + ".jpg";

          ffmpeg(filePath).screenshots({
            folder: 'public/uploads/chat-attachment/',
            filename: thumbName,
            count: 1,
            timemarks: ["50%"] // number of seconds
          })
            .on('end', function (err) {
              if (err)
                send("Error occurs in Chat.uploadChatAttachment", err);
              else {
                sendData.thumbPath = `/uploads/chat-attachment/${thumbName}`;
                send(false, JSON.stringify(sendData));
              }
            });
        }

        // or send just image path without thumb
        else {
          send(false, JSON.stringify(sendData));
        }
      }
    });
  },

  /**** HELPER REFORMAT MESSAGES FUNC **/
  reformatOuterMessage(data, senderReceiverNames) {
    const self = this;
    for (let i = 0; i < data.length; i++) {
      if (senderReceiverNames) {
        data[i] = Helper.handleSenderAndReceiverName(data[i]);
      } else {
        data[i] = Helper.handleUserName(data[i]);
      }

      data[i].messageText = self.reformatOuterText(data[i].messageText);
    }

    return data;
  },

  reformatOuterText(messageText) {
    var match;
    var re = /\{b64\:([^}]+)\}/gi;
    while (match = re.exec(messageText)) {
      var bytes = base64.decode(match[1]);
      var smile = utf8.decode(bytes);
      messageText = messageText.replace(match[0], smile);
    }
    return messageText;
  },

  async getLastChatForAdmin() {
    try {

      return new Promise((res, rej) => {
        db.query(
          'SELECT \
			     chat.senderId, \
			     chat.conversationId, \
			     chat.messageText, \
           (\
               SELECT\
                 (GROUP_CONCAT(chat_part.userId))\
               FROM tbl_conversation_participants AS chat_part\
               WHERE chat_part.conversationId = chat.conversationId\
           ) AS participants,\
			     messageTime AS time \
			   FROM `tbl_chat` AS chat\
			   ORDER BY time DESC LIMIT 300',
          (err, rows) => {
            if (err) return rej(ErrorHandler({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: 'Error in Chat.getLastChatForAdmin: ' + err,
              lastMessages: []
            }));

            if(!rows.length) return rej(ErrorHandler({
              success: true,
              status: STATUS.NOT_FOUND,
              lastMessages: []
            }));

            const handledTime = rows.map(item => {
              item.time = Helper.getStringDateTime(item.time);
              return item
            });

            return res({success: true, status: STATUS.OK, lastMessages: handledTime});
          }
        );
      })
    } catch (err) {
      return ErrorHandler(err)
    }
  }
};

module.exports = Chat;
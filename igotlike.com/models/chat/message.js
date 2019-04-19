const db = require('../db');
const STATUS = require('../status');

const Attachments = require('./messageAttachmet')
const Conversation = require('../conversation');


const {
  isUserAuthor
} = require('./validators');

const ChatMessage = {

  /**
   * Delete message by id
   * Checks if message belongs to user
   * @param {number} userId 
   * @param {number} messageId 
   * @returns {Promise<object>} {success: boolean, messageId: string}
   */
  async delete(userId, messageId) {
    const isAuthor = await isUserAuthor(userId, messageId)
    if (!isAuthor) {
      return {
        success: false,
        status: STATUS.ACCESS_DENIED,
        message: `User ${userId} is not an author of the message #${messageId}`
      };
    }

    await this._deleteMessage(messageId)
    await Attachments.delete(messageId)

    return {
      success: true,
      status: STATUS.OK,
      messageId
    };
  },

  /**
   * Deletes message from DB by message ID
   * @param {number} messageId 
   * @returns {Promise<boolean>}
   */
  _deleteMessage(messageId) {
    return new Promise((res, rej) => {
      db.query('DELETE FROM tbl_chat WHERE messageId = ?',
        [messageId],
        (err, result) => {
          if (err) return rej(err)
          return res(result.length ? true : false)
        });
    })
  },

  /**
   * Updates current message
   * Deletes all previouse attachments, inserts new and returns their ids
   * 
   * @param {object} data
   * {
   *   conversationId: number
   *   userId: number
   *   messageId: number
   *   message: string
   *   attachments: array
   *   type: string
   *   link: string
   * } 
   * 
   * @returns {Promise<object>}
   * {
   *   success: boolean
   *   status: string
   *   messageId: number
   *   receivers: number[]
   * }
   */
  async update(data) {
    const {
      userId,
      messageId
    } = data

    const isAuthor = await isUserAuthor(userId, messageId);
    if (!isAuthor) {
      return {
        success: false,
        status: STATUS.ACCESS_DENIED,
        message: `User ${userId} is not an author of the message #${messageId}`
      };
    }

    const getConversationIdRes = await Conversation.getParticipantsAndType(data.userId, data.conversationId);
    const receivers = getConversationIdRes.participants.filter(participant => +participant !== +data.userId);

    await this._update(data)

    await Attachments.delete(messageId);
    await Attachments.save(messageId, data.attachments);

    return {
      ...data,
      receivers
    };
  },

  /**
   * Updates all fileds in message into DB, by message id
   * @param {object} data
   * {
   *   conversationId: number
   *   userId: number
   *   messageId: number
   *   message: string
   *   attachments: array
   *   type: string
   *   link: string
   * } 
   * 
   * @returns {Promise<boolean>}
   */
  _update({
    messageId,
    message,
    attachments,
    type,
    link
  }) {
    return new Promise((res, rej) => {
      const attachmentExists = (attachments && attachments.length) ? 1 : 0;

      db.query(
        'UPDATE tbl_chat \
         SET messageText = ?, attachmentExists = ?, type = ?, link = ?\
         WHERE messageId = ?;',
        [message, attachmentExists, type, link, messageId],
        (err) => {
          if (err) return rej(err)
          return res(true);
        }
      );
    });
  },
}

module.exports = ChatMessage
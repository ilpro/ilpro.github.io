const db = require('../db');
const config = require('../../config/config')

const {
  deleteFromDisk
} = require('../../utils/fileSystem')


const ChatMessageAttachments = {
  /**
   * Deletes message attachments from DB and from disk by message ID
   * @param {number} messageId 
   * @returns {Promise<boolean>}
   */
  delete(messageId) {
    return new Promise((res, rej) => {
      db.query(
        'SELECT path AS path FROM tbl_chat_attachment WHERE messageId = ?;\
         DELETE FROM tbl_chat_attachment WHERE messageId = ?;',
        [messageId, messageId],
        (err, result) => {
          if (err) return rej(err)
          return res(result[0].map(elem => '' + config.chatAttachmentsFolder + elem.path))
        })
    }).then(pathsArr => deleteFromDisk(pathsArr))
  },

  /** Save chat attachments into DB **/
  save(messageId, attachments) {
    return new Promise((res, rej) => {
      if (!attachments || !attachments.length) return res(true)

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
        if (err) return rej(err)
        return res(true)
      });
    })
  },

  get(messageId) {
    return new Promise((res, rej) => {

      db.query(
        'SELECT path, attachmentId, type, thumbPath FROM tbl_chat_attachment WHERE messageId = ?',
        [messageId],
        (err, result) => {
          if (err) return rej(err)
          return res(result)
        });
    });
  },
}

module.exports = ChatMessageAttachments
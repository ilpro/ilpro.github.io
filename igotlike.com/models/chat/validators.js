const db = require('../db');

module.exports = {

  /**
   * Checks if user is message sender
   * @param {number} userId 
   * @param {number} messageId 
   * @returns {Promise<boolean>}
   */
  isUserAuthor: (userId, messageId) => {
    return new Promise((res, rej) => {
      db.query('SELECT * FROM tbl_chat WHERE senderId = ? AND messageId = ?;', [userId, messageId],
        (err, result) => {
          if (err) return rej(err)
          return res(result.length ? true : false)
        });
    })
  }
}
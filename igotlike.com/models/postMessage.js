const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');

const PostMessage = {

  /**
   * Save post message into DB in promise
   *
   * @param postId
   * @param userId
   * @param message
   * @returns {Promise}
   */
  save(postId, userId, message) {
    return new Promise((res, rej) => {
      if (!userId || !postId) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Error in PostMessage.save: no userId or postId specified'
        });
      }
      if (!message || !message.length) {
        return res({success: true, status: STATUS.OK, message: 'No message text specified'});
      }

      db.query(
        'INSERT INTO tbl_user_post_message (postId, userId, text) VALUES (?,?,?);',
        [postId, userId, message],
        err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in PostMessage.save\n" + err
          });

          return res({success: true, status: STATUS.OK});
        });
    })
  },

  update(postId, userId, message){
    return new Promise((res, rej) => {
      if (!userId || !postId) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Error in PostMessage.save: no userId or postId specified'
        });
      }
      if (!message || !message.length) {
        return res({success: true, status: STATUS.OK, message: 'No message text specified'});
      }

      db.query(
        'UPDATE tbl_user_post_message SET text = ? WHERE postId = ? AND userId = ?;',
        [message, postId, userId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in PostMessage.update\n" + err
          });

          if(+rows.affectedRows === 0){
            return res({
              success: false,
              status: STATUS.NOT_FOUND,
              message: `Message for post ${postId} was not found or post was created by another user`
            });
          }

          return res({success: true, status: STATUS.OK});
        });
    })
  },

  deleteRelatedToPost(postId) {
    return new Promise((res, rej) => {
      db.query(
        'DELETE FROM tbl_user_post_message WHERE postId = ?;',
        [postId],
        err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in PostMessage.deleteRelatedToPost\n" + err
          });

          return res({success: true, status: STATUS.OK});
        });
    })
  }
};

module.exports = PostMessage;
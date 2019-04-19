const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');

const PostComplaint = {

  /**
   * Toggle add/remove complaint from specified post
   *
   * @param userId
   * @param postId
   *
   * @returns {Promise} which returns object:
   *   {success, action, postCreatorId}
   */
  update(userId, postId){
    return new Promise((res, rej) => {
      if (!userId || !postId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Error in PostComplaint.update: no userId or postId specified'
        });
      }

      db.query(
        'SELECT id FROM tbl_user_post_complaint WHERE postId = ? AND userId = ?;',
        [postId, userId],
        (err, rows) => {
          if (err) return rej("Error in PostComplaint.update #1:\n" + err);

          // if already has complaint, remove complaint
          if (rows.length > 0) {
            return db.query("DELETE FROM tbl_user_post_complaint WHERE `id` = ?;",
              [rows[0].id],
              err => {
                if (err) return rej("Error in PostComplaint.update #2:\n" + err);
                return res({success: true, postId, action: "remove"});
              });
          }

          // add complaint and get post author id
          db.query(
            'INSERT INTO tbl_user_post_complaint (postId, userId) VALUES (?, ?); \
             SELECT userId FROM tbl_user_post WHERE postId = ?',
            [postId, userId, postId],
            (err, postRow) => {
              if (err) return rej("Error in PostComplaint.update #3:\n" + err);
              return res({success: true, action: "add", postId, postCreatorId: postRow[1][0].userId});
            });
        });
    })
  },

  /**
   * Get all post complaints by post id,
   * Get number of complaint
   * Get info about all of users who had complaint post
   *
   * @param postId
   * @returns {Promise}
   */
  get(postId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT COUNT(*) AS complaintsTotal FROM tbl_user_post_complaint WHERE postId = ?;\
         SELECT \
           complaints.time, \
           user.userId,\
           user.userNickname,\
           user.userPhoto\
         FROM tbl_user_post_complaint AS complaints\
         LEFT JOIN tbl_user AS user ON complaints.userId = user.userId\
         WHERE postId = ?\
         ORDER BY time DESC;',
        [postId, postId],
        (err, rows) => {
          if (err) return rej("Error in PostComplaint.get:\n" + err);

          const complaintsTotal = rows[0][0].complaintsTotal;

          const users = rows[1];
          for(let i = 0; i < users.length; i++){
            users[i] = Helper.handleUserName(users[i])
          }
          return res({success: true, postId, complaintsTotal, users});
        });
    })
  },
};

module.exports = PostComplaint;
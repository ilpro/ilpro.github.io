const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');

const PostLike = {

  /**
   * Toggle add/remove like from specified post
   *
   * @param userId
   * @param postId
   *
   * @returns {Promise} which returns object:
   *   {success, action, postCreatorId}
   */
  update(userId, postId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT id FROM tbl_user_post_like WHERE postId = ? AND userId = ?;',
        [postId, userId],
        (err, rows) => {
          if (err) return rej("Error in PostLike.update #1:\n" + err);

          // if already liked, remove like
          if (rows.length > 0) {
            return db.query("DELETE FROM tbl_user_post_like WHERE `id` = ?;",
              [rows[0].id],
              err => {
                if (err) return rej("Error in PostLike.update #2:\n" + err);
                return res({success: true, postId, action: "remove"});
              });
          }

          // add like and get post author id
          db.query(
            'INSERT INTO tbl_user_post_like (postId, userId) VALUES (?, ?); \
             SELECT userId FROM tbl_user_post WHERE postId = ?',
            [postId, userId, postId],
            (err, postRow) => {
              if (err) return rej("Error in PostLike.update #3:\n" + err);
              return res({success: true, action: "add", postId, postCreatorId: postRow[1][0].userId});
            });
        });
    })
  },

  /**
   * Get all post likes by post id,
   * Get number of likes
   * Get info about all of users who liked post
   *
   * @param postId
   * @returns {Promise}
   */
  get(postId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT COUNT(*) AS likesTotal FROM tbl_user_post_like WHERE postId = ?;\
         SELECT \
           likes.time, \
           user.userId,\
           user.userNickname,\
           user.userPhoto,\
		   user.userVerification\
         FROM tbl_user_post_like AS likes\
         LEFT JOIN tbl_user AS user ON likes.userId = user.userId\
         WHERE postId = ?\
         ORDER BY time DESC;',
        [postId, postId],
        (err, rows) => {
          if (err) return rej("Error in PostLike.get:\n" + err);

          const likesTotal = rows[0][0].likesTotal;

          const users = rows[1];
          for(let i = 0; i < users.length; i++){
            users[i] = Helper.handleUserName(users[i])
          }
          return res({success: true, postId, likesTotal, users});
        });
    })
  },
};

module.exports = PostLike;
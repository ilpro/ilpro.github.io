const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');
const Hashtag = require('./hashtag');

const PostHashtag = {
  /**
   * Save hashtags into DB in promise
   *
   * @param postId
   * @param userId
   * @param message
   * @returns {Object} with hashtag ids
   */
  async save(postId, userId, message) {
    try {
      if (!userId || !postId) {
        throw {
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Error in PostHashtag.save: no userId or postId specified'
        };
      }
      if (!message || !message.length) {
        return {success: true, status: STATUS.OK, message: 'No message specified'};
      }

      // find hashtags
      const hashtagsArray = message.match(/(^|\s|\(|>)#((\w|[a-zA-Zа-яА-Я0-9])+)/g);
      if (!hashtagsArray || !hashtagsArray.length) {
        return {success: true, status: STATUS.OK, message: 'No hashtag specified'};
      }

      const getHashtagIdsResult = await Hashtag.save(hashtagsArray);
      await this._insert(postId, userId, getHashtagIdsResult.hashtags);

      return {success: true, status: STATUS.OK, hashtags: getHashtagIdsResult.hashtags};
    } catch (err) {
      throw err;
    }
  },

  /**
   * Link hashtags to specified post
   *
   * @param postId
   * @param userId
   * @param hashtags
   * @returns {Promise} which returns obj {success, status}
   * @private
   */
  _insert(postId, userId, hashtags){
    return new Promise((res, rej) => {
      if (!postId || !userId || !hashtags || !hashtags.length) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Error in PostHashtag._insert: no postId or userId or hashtags array specified'
        });
      }

      // bulk insert needs to be like nested arrays, so make it
      // var values = [
      //   ['mark', 'mark@gmail.com'],
      //   ['pete', 'pete@gmail.com']
      // ];
      const bulk = hashtags.map(hashtag => [postId, userId, hashtag.id]);

      db.query(
        'INSERT INTO tbl_user_post_hashtag (postId, userId, hashtagId) VALUES ?;',
        [bulk],
        err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in PostHashtag.save\n" + err
          });

          return res({success: true, status: STATUS.OK});
        });
    })
  },


  /**
   * Delete all hashtags related to received post id
   *
   * @param postId
   * @returns {Promise} which returns {success, status}
   */
  deleteRelatedToPost(postId) {
    return new Promise((res, rej) => {
      db.query(
        'DELETE FROM tbl_user_post_hashtag WHERE postId = ?;',
        [postId],
        err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in PostHashtag.deleteRelatedToPost\n" + err
          });

          return res({success: true, status: STATUS.OK});
        });
    })
  },
};

module.exports = PostHashtag;
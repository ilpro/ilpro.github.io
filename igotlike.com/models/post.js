const db = require('./db');

const Image = require('./image');
const Video = require('./video');
const User = require('./user');
const Favorites = require('./favorites');
const PostMessage = require('./postMessage');
const Hashtag = require('./hashtag');
const PostHashtag = require('./postHashtag');

const Helper = require('./helper');
const STATUS = require('./status');

const Post = {

  /**
   * Retrieve user's posts and his favorite users posts
   *
   * @param userId {Number}
   * @param limit {Number}
   * @param offset {Number}
   *
   * @returns {Promise.<*>} which returns object with posts or error
   *   { success, status, userId, userPhoto, userCity, userCountry, posts }
   */
  async getUserFeed(userId, limit = 30, offset = 0) {
    try {
      if (!userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Error in GetUserFeed: no userId specified'
        };
      }

      const self = this;
      const favoritesResult = await Favorites.getFollowingIds(userId);
      const postsResult = await self._getPosts(userId, [userId].concat(favoritesResult.favorites), limit, offset);
      const userAvatarResult = await User.getAvatar(userId);
      const userLivesIn = await User.getUserCityAndCountry(userId);
      const beautifiedPosts = await self._preparePostsToResponse(postsResult.posts);

      return {
        success: true,
        status: STATUS.OK,
        userId,
        userPhoto: userAvatarResult.avatarPath,
        userCity: userLivesIn.city,
        userCountry: userLivesIn.country,
        posts: beautifiedPosts,
        limit,
        offset,
      }
    } catch (err) {
      if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
        console.log(err);
        return {success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'};
      }
      return err;
    }
  },

  /**
   * Retrieve only users's posts
   *
   * @param userId {Number} - user which requested for posts
   * @param profileId {Number} - user which posts will be shown
   * @param limit {Number}
   * @param offset {Number}
   *
   * @returns {Promise.<*>} which returns object with posts or error
   *   { success, status, userId, userPhoto, userCity, userCountry, posts }
   */
  async getUserPosts(userId, profileId, limit = 30, offset = 0) {
    try {
      if (!userId || !profileId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'No userId or profileId specified. Request must includes object like {hash, profileId}'
        };
      }

      const self = this;
      // change getPosts() to another method if more options will be add to getUserFeed, like commercial etc
      const postsResult = await self._getPosts(userId, [profileId], limit, offset);
      const userAvatarResult = await User.getAvatar(profileId);
      const userLivesIn = await User.getUserCityAndCountry(profileId);
      const beautifiedPosts = await self._preparePostsToResponse(postsResult.posts);

      return {
        success: true,
        status: STATUS.OK,
        requesterId: +userId,
        userId: +profileId,
        userPhoto: userAvatarResult.avatarPath,
        userCity: userLivesIn.city,
        userCountry: userLivesIn.country,
        posts: beautifiedPosts,
        limit,
        offset
      }
    } catch (err) {
      if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
        console.log(err);
        return {success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'};
      }
      return err;
    }
  },

  _getFavorites(userId) {
    return new Promise((resolve, rej) => {
      db.query("SELECT `profileId` FROM `ctbl_userfavorite` WHERE `userId` = ?;",
        [userId],
        (err, rows) => {
          if (err) return rej("Error in Feed._getFavorites #1\n" + err);

          const userFavorites = rows.map(elem => elem.profileId);
          return resolve(userFavorites)
        });

    });
  },

  /**
   * Get posts sorted by time and filtered by specified user ids
   *
   * @param userIdForCheckHisLike {Number} - may be own userId or stranger profileId - from whom we want to get posts
   * @param authorsArray {Array} - ids of users, which posts we want to get
   *   [1,2,3]
   * @param limit {Number} - number of last posts we wants to get (30 by default)
   * @param offset {Number} - number of posts which will be omit from start (0 by default)
   *
   * @returns {Promise} which returns object:
   *   {success, status, posts: {...}
   *
   * @private
   */
  _getPosts(userIdForCheckHisLike, authorsArray, limit = 30, offset = 0) {
    return new Promise((res, rej) => {
      if(!userIdForCheckHisLike || !authorsArray || !authorsArray.length){
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in Post._getPosts: userId or profileId or authors is not specified"
        });
      }

      if(offset < 0) offset = 0;

      db.query(
        'SET SESSION group_concat_max_len = 100000;\
		SELECT \
           post.`postId`,\
           post.`time`,\
           text.`text`,\
           (SELECT GROUP_CONCAT(t1.`id` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photoId,\
           (SELECT GROUP_CONCAT(t1.`userImagePath` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photo,\
           (SELECT GROUP_CONCAT(t1.`userImageWidth` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photoWidth,\
           (SELECT GROUP_CONCAT(t1.`userImageHeight` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photoHeight,\
           (SELECT GROUP_CONCAT(t1.`id` SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS videoId,\
           (SELECT GROUP_CONCAT(t1.`path` SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS video,\
           (SELECT GROUP_CONCAT(t1.`thumbPath` SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS videoThumb,\
		   (SELECT GROUP_CONCAT(CONCAT(t1.`thumbWidth`, \'x\', t1.`thumbHeight`) SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS videoThumbDimension, \
           (\
             SELECT CONCAT(\'[\', GROUP_CONCAT(CONCAT(\'{"id":"\', hashtags.id, \'","hashtag":"\', hashtags.hashtag, \'"}\') SEPARATOR ","), \']\') AS hashtags\
             FROM tbl_user_post_hashtag AS postHashtags\
             LEFT JOIN tbl_hashtag AS hashtags \
               ON postHashtags.hashtagId = hashtags.id\
             WHERE postHashtags.`postId` = post.`postId` \
             GROUP BY postHashtags.`postId`\
           ) AS hashtags, \
           tu.`userId`,\
           tu.`userNickname`,\
           tu.`useNickname`,\
           tu.`userPhoto`,\
           tu.`userName`,\
           tu.`userLastName`,\
		   tu.`userVerification`,\
           COUNT(t2.`userId`) AS likes,\
           t3.`userId` AS userOwnLike, \
           COUNT(t4.`userId`) AS complaints,\
           t5.`userId` AS userOwnComplaint \
         FROM `tbl_user_post` AS post\
         LEFT JOIN `tbl_user_post_message` AS text ON text.`postId` = post.`postId`\
         LEFT JOIN `tbl_user_post_like` AS t2 ON t2.`postId` = post.`postId` \
         LEFT JOIN `tbl_user_post_like` AS t3 ON t3.`postId` = post.`postId` AND t3.`userId` = ? \
         LEFT JOIN `tbl_user_post_complaint` AS t4 ON t4.`postId` = post.`postId` \
         LEFT JOIN `tbl_user_post_complaint` AS t5 ON t5.`postId` = post.`postId` AND t5.`userId` = ? \
         LEFT JOIN `tbl_user` AS tu ON post.`userId` = tu.`userId` \
         WHERE post.`userId` IN (?)\
         GROUP BY post.`postId`\
         ORDER BY time DESC\
         LIMIT ? OFFSET ?;',
        [userIdForCheckHisLike, userIdForCheckHisLike, authorsArray, +limit, +offset],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Post._getPosts:\n" + err
          });

          return res({success: true, status: STATUS.OK, posts: rows[1]});
		  console.log(rows);
        });
    });
  },

  _preparePostsToResponse(posts) {
    return new Promise((res, rej) => {
      const len = posts.length;

      for (let i = 0; i < len; i++) {
        posts[i] = Helper.handleUserName(posts[i]);

        if (posts[i].time != "0000-00-00 00:00:00") {
          posts[i].time = Helper.getDateTimeSince(posts[i].time);
        } else {
          posts[i].time = "A long long time ago...";
        }
      }
      return res(posts);
    });
  },

  /**
   * Add new or update existing post
   *
   * @param data
   *   {userId, images, videos, message, ?postId}
   * @returns {Promise.<*>}
   *  return back to client object
   *  if success:
   *    {
   *      success: true,
   *      postId,
   *      user: {
   *        userId,
   *        userName,
   *        userPhoto,
   *        userLastActive,
   *        userBdate,
   *        age,
   *        isBotOnline
   *      },
   *      // if attachments or text was uploaded
   *      message,
   *      images: [
   *        {path, width, height},
   *        {path, width, height}
   *      ],
   *      videos: [
   *        {path, width, height},
   *        {path, width, height}
   *      ]
   *    }
   *  if error: {error}
   */
  async add(data) {
    try {
      if (!data.userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Error in Post.add: no userId specified'
        };
      }

      const self = this;

      // check if post new or updating existing
      const postId = +data.postId ? data.postId : await self._createNewPostAndGetId(data.userId);

      // if updating post - delete message and check for changes in photo/video attachments before
      await PostMessage.deleteRelatedToPost(data.postId);
      await PostHashtag.deleteRelatedToPost(data.postId);
      await Image.updateRelativeToPost(data.postId, data.images);
      await Video.updateRelativeToPost(data.postId, data.videos);

      // insert new post content
      const messageSaveResult = await PostMessage.save(postId, data.userId, data.message);
      const imageSaveResult = await Image.save(postId, data.userId, data.images);
      const videoSaveResult = await Video.save(postId, data.userId, data.videos);
      const hashtagsSaveResult = await PostHashtag.save(postId, data.userId, data.message);

      // get user info
      const user = await User.getUserInfoByIdPromise(data.userId);

      // prepare response object
      const responseData = {postId, user};
      if (data.message) responseData.text = data.message;
      if (data.images && data.images.length > 0) responseData.images = imageSaveResult.images;
      if (data.videos && data.videos.length > 0) responseData.videos = videoSaveResult.videos;
      if (hashtagsSaveResult.hashtags && hashtagsSaveResult.hashtags.length > 0) responseData.hashtags = hashtagsSaveResult.hashtags;

      return {success: true, status: STATUS.OK, ...responseData};
    } catch (err) {
      if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
        console.log(err);
        return {success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'};
      }
      return err;
    }
  },

  _createNewPostAndGetId(userId){
    return new Promise((res, rej) => {
      if (!userId) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Error in Post._createNewPostAndGetId: no userId specified'
        });
      }

      db.query("INSERT INTO tbl_user_post (userId) VALUES (?);", [userId], (err, rows) => {
        if (err) return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in Post._createNewPostAndGetId:\n" + err
        });

        return res(rows.insertId);
      });
    });
  },

  /**
   * Delete post section
   *
   * @param data - must be object like {hash, postId}
   * @returns {Promise.<*>}
   *   if success send back to client object {success: true, postId}
   *   if error {error}
   */
  async delete(data) {
    try {
      const self = this;

      if (!data.postId || !data.userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Error in Post.delete: no userId or postId specified'
        };
      }

      await self._checkIsUserAuthorOfPostAndDeletePostId(data.postId, data.userId);

      await PostMessage.deleteRelatedToPost(data.postId);
      await PostHashtag.deleteRelatedToPost(data.postId);
      await Image.deleteRelatedToPost(data.postId);
      await Video.deleteRelatedToPost(data.postId);

      return {success: true, postId: data.postId};
    } catch (err) {
      if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
        console.log(err);
        return {success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'};
      }
      return err;
    }
  },

  /**
   * Prevent deleting posts from non-authors
   * @param postId
   * @param userId
   * @returns {Promise}
   * @private
   */
  _checkIsUserAuthorOfPostAndDeletePostId(postId, userId){
    return new Promise((res, rej) => {
      db.query('DELETE FROM tbl_user_post WHERE postId = ? AND userId = ?',
        [postId, userId],
        (err, result) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Post._createNewPostAndGetId:\n" + err
          });

          if (+result.affectedRows === 0) return rej({
            success: false,
            status: STATUS.ACCESS_DENIED,
            message: `Error in Post._deletePostId: user ${userId} tries to delete post ${postId} which was created by another user`
          });

          return res({success: true, status: STATUS.OK});
        });
    });
  },

  /**
   * Delete images and videos from disk if user canceled post before publish it
   *
   * @param data - object like:
   *   {
   *     images: [path, path, path],
   *     videos: [thumbPath, path, thumbPath, path]
   *   }
   *
   * @returns {Promise.<*>}
   */
  async cleanAttachments(data){
    try {
      if (!data.userId) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Error in Post.cleanAttachments: no userId specified'
        };
      }

      if (data.images && data.images.length > 0) await Image.deleteFromDisk(data.images);
      if (data.videos && data.videos.length > 0) await Video.deleteFromDisk(data.videos);
      return {success: true, status: STATUS.OK};
    } catch (err) {
      if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
        console.log(err);
        return {success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'};
      }
      return err;
    }
  },

  /** Search posts by hashtag
   *
   * @param userId
   * @param hashtag
   * @param limit {Number}
   * @param offset {Number}
   *
   * @returns {Promise.<*>} which returns object:
   *   { success, status, userId, userPhoto, userCity, userCountry, posts }
   */
  async getByHashtag(userId, hashtag, limit = 30, offset = 0){
    try {
      if (!userId || !hashtag) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Post.getByHashtag error: no userId or hashtag provided. Request must includes object like {hash, hashtag}'
        };
      }

      const hashtagResult = await Hashtag.get(hashtag.toString());
      if(hashtagResult.status === STATUS.NOT_FOUND){
        return {success: true, status: STATUS.NOT_FOUND, message: `Hashtag ${hashtag} not found`}
      }

      const postsResult = await this._getPostsByHashtagId(+hashtagResult.hashtag.id, limit, offset);
      if(postsResult.status === STATUS.NOT_FOUND){
        return {success: true, status: STATUS.NOT_FOUND, message: `No posts found for hashtag ${hashtag}`}
      }

      const userAvatarResult = await User.getAvatar(userId);
      const userLivesIn = await User.getUserCityAndCountry(userId);
      const beautifiedPosts = await this._preparePostsToResponse(postsResult.posts);

      return {
        success: true,
        status: STATUS.OK,
        userId,
        userPhoto: userAvatarResult.avatarPath,
        userCity: userLivesIn.city,
        userCountry: userLivesIn.country,
        posts: beautifiedPosts,
        limit,
        offset
      };
    } catch (err) {
      if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
        console.log(err);
        return {success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'};
      }
      return err;
    }
  },

  /**
   * Get posts sorted by time (latest first) and filtered by hashtag id
   *
   * @param hashtagId {Number}
   * @param limit {Number} - number of last posts we wants to get (30 by default)
   * @param offset {Number} - number of posts which will be omit from start (0 by default)
   *
   * @returns {Promise} which returns object:
   *   {success, status, posts: {...}
   *
   * @private
   */
  _getPostsByHashtagId(hashtagId, limit = 30, offset = 0) {
    return new Promise((res, rej) => {
      if (!hashtagId || typeof hashtagId !== 'number') {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Post._getPostsByHashtagId error: no hashtag id number provided'
        });
      }

      db.query(
        'SELECT \
           post.`postId`,\
           post.`time`,\
           text.`text`,\
           (SELECT GROUP_CONCAT(t1.`id` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photoId,\
           (SELECT GROUP_CONCAT(t1.`userImagePath` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photo,\
           (SELECT GROUP_CONCAT(t1.`userImageWidth` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photoWidth,\
           (SELECT GROUP_CONCAT(t1.`userImageHeight` SEPARATOR \',\') FROM `tbl_user_image` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS photoHeight,\
           (SELECT GROUP_CONCAT(t1.`id` SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS videoId,\
           (SELECT GROUP_CONCAT(t1.`path` SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS video,\
           (SELECT GROUP_CONCAT(t1.`thumbPath` SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS videoThumb,\
		   (SELECT GROUP_CONCAT(CONCAT(t1.`thumbWidth`, \'x\', t1.`thumbHeight`) SEPARATOR \',\') FROM `tbl_user_video` AS t1 WHERE t1.`postId` = post.`postId` GROUP BY t1.`postId`) AS videoThumbDimension, \
           (\
             SELECT\
               CONCAT(\'[\', \
                 GROUP_CONCAT(\
                   CONCAT(\'{\
                     "id":"\', hashtags.id, \'",\
                     "hashtag":"\', hashtags.hashtag, \'"\
                   }\') SEPARATOR ","\
                 ), \'\
               ]\') AS hashtags\
             FROM tbl_user_post_hashtag AS postHashtags\
             LEFT JOIN tbl_hashtag AS hashtags \
               ON postHashtags.hashtagId = hashtags.id\
             WHERE postHashtags.`postId` = post.`postId` \
             GROUP BY postHashtags.`postId`\
           ) AS hashtags, \
           tu.`userId`,\
           tu.`userNickname`,\
           tu.`useNickname`,\
           tu.`userPhoto`,\
           tu.`userName`,\
           tu.`userLastName`,\
		   tu.`userVerification`,\
           COUNT(t2.`userId`) AS likes,\
           COUNT(t4.`userId`) AS complaints \
         FROM `tbl_user_post` AS post\
         LEFT JOIN `tbl_user_post_message` AS text ON text.`postId` = post.`postId`\
         LEFT JOIN `tbl_user_post_like` AS t2 ON t2.`postId` = post.`postId` \
         LEFT JOIN `tbl_user_post_complaint` AS t4 ON t4.`postId` = post.`postId` \
         LEFT JOIN `tbl_user_post_hashtag` AS postHashtag ON postHashtag.`postId` = post.`postId`\
         LEFT JOIN `tbl_user` AS tu ON post.`userId` = tu.`userId` \
         WHERE postHashtag.`hashtagId` = ?\
         GROUP BY post.`postId`\
         ORDER BY time DESC\
         LIMIT ? OFFSET ?;',
        [hashtagId, +limit, +offset],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Post._getPostsByHashtagId:\n" + err
          });

          if (rows.length === 0) return res({
            success: true,
            status: STATUS.NOT_FOUND,
            message: `No posts found for hashtagId #${hashtagId}`
          });

          return res({success: true, status: STATUS.OK, posts: rows});
        });
    });
  },
};

module.exports = Post;
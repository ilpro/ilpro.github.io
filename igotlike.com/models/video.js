const fs = require('fs');
const im = require('imagemagick');
const path = require('path');
const md5 = require('md5');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');

const SERVER_VIDEO_DIR = './public/uploads/video/';
const SITE_VIDEO_DIR = '/uploads/video/';

const Video = {

  /**
   * Upload video to server and return object in promise response with video path and preview image path
   *
   * @param data - input object with image and user info
   *   { userId, image: { name, data, ext}  }
   *
   * return response object with image link
   *   { success, status, name, path, thumbPath }
   */
  upload (data) {
    const self = this;

    return new Promise((res, rej) => {
      if(!data || !data.image || !data.image.ext ){
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Input parameters must be an object: { userId, image: { data, ext } }"
        });
      }

      const time = (new Date()).getTime();

      const user = data.userId ? data.userId : 'tmp_';
      const imageName = user + "_" + time + "." + data.image.ext;

      const videoPathOnServer = SERVER_VIDEO_DIR + imageName;
      const viewPath = SITE_VIDEO_DIR + imageName;

      // add video to server
      fs.writeFile(videoPathOnServer, data.image.data, err => {
        if (err) return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in Video.upload #1\n" + err
        });


        // make thumbnails for application
        self.getPreviewImage(videoPathOnServer, user, time)
          .then(thumbResult => {
            return res({
              success: true,
              status: STATUS.OK,
              name: imageName,
              path: viewPath,
              thumbPath: thumbResult.path
            });
          })
          .catch(err => rej(err));
      });
    })
  },

  /**
   * Make screenshot from some moment of video
   * Save this screenshot to server
   * Return path to screenshot
   *
   * @param pathToVideo - path to video on server's disk
   * @param user - userId ot tmp if userId not speceified
   * @param time - current time with which previously video was saved on the disk
   *
   * @returns {Promise} which returns path {String} to image.jpg
   */
  getPreviewImage(pathToVideo, user, time){
    return new Promise((res, rej) => {
      const thumbName = user + "_" + time + ".jpg";
      const thumbViewPath = SITE_VIDEO_DIR + thumbName;

      ffmpeg(pathToVideo).screenshots({
        folder: SERVER_VIDEO_DIR,
        filename: thumbName,
        count: 1,
        timemarks: ["50%"] // number of seconds
      })
        .on('end', err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Video.getPreviewImage: \n" + err
          });

          return res({success: true, status: STATUS.OK, path: thumbViewPath});
        });
    })
  },

  /**
   * Save image into DB
   * @param postId - must be defined and != 0
   * @param userId - must be defined and != 0
   * @param images - array with image objects:
   *   [
   *     {
   *       path,
   *       width,
   *       height
   *     },
   *     {
   *       path,
   *       width,
   *       height
   *     }
   *   ]
   *
   * @return {Promise}
   */
  save(postId, userId, videos) {
    return new Promise((res, rej) => {
      if (!userId || !postId) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Error in Video.save: no userId or postId specified'
        });
      }
      if (!videos || !videos.length) {
        return res({success: true, status: STATUS.OK, message: 'No videos specified'});
      }

      // bulk insert needs to be like nested arrays, so make it
      // var values = [
      //   ['mark', 'mark@gmail.com'],
      //   ['pete', 'pete@gmail.com']
      // ];
      const bulk = videos.map(video => [postId, userId, video.path, video.thumbPath]);

      im.identify("public" + bulk[0][3], function (err, features) {
        if(err) {
          return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: 'Error in Video.save: ' + err
          });
        }
        else {
          bulk[0].push(features.width);
		  bulk[0].push(features.height);
		  
		  db.query(
          'INSERT INTO tbl_user_video (postId, userId, path, thumbPath, thumbWidth, thumbHeight) VALUES ?;\
           SELECT \
             id,\
             path,\
             thumbPath, \
		     thumbWidth, \
		     thumbHeight \
           FROM tbl_user_video WHERE postId = ?',
          [bulk, postId],
          (err, rows) => {
            if (err) return rej({success: false, status: STATUS.INTERNAL_ERROR, message: "Error in Video.save\n" + err});
            return res({success: true, status: STATUS.OK, videos: rows[1]})
          });
        }	
      })
    })
  },

  /**
   * Deletes photos from DB and from hard drive
   *
   * @param postId
   * @param userId
   * @returns {Promise.<*>}
   */
  async deleteRelatedToPost(postId){
    const self = this;

    try {
      const getPathsResult = await self._deleteRelatedVideosAndGetTheirPath(postId);
      if (getPathsResult.success) await self.deleteFromDisk(getPathsResult.paths);
      return {success: true, status: STATUS.OK};
    } catch (err) {
      throw err;
    }
  },

  async updateRelativeToPost(postId, videos){
    try {
      const self = this;

      // check if videos specified and delete previous videos
      const currentPostVideoPathsResult = await self._deleteRelatedVideosAndGetTheirPath(postId);
      if (!currentPostVideoPathsResult.paths || !videos || !videos.length) {
        return {success: true, status: STATUS.OK, message: 'Current post has no videos'};
      }

      // get previous videos to delete them from disk
      const newPaths = videos.map(image => image.path);
      const videosToDelete = [];
      for (let i = 0; i < currentPostVideoPathsResult.paths.length; i++) {
        const path = currentPostVideoPathsResult.paths[i].path;
        const thumbPath = currentPostVideoPathsResult.paths[i].thumbPath;
        if (newPaths.indexOf(path) === -1) {
          videosToDelete.push({path, thumbPath})
        }
      }

      if (!videosToDelete || !videosToDelete.length) {
        return {success: true, status: STATUS.OK, message: 'No changes in current post`s images'};
      }
      await self.deleteFromDisk(videosToDelete);
      return {success: true, status: STATUS.OK};
    } catch (err) {
      throw err;
    }
  },

  /**
   * Delete photos from DB and get their paths
   *
   * @param postId
   * @param userId
   * @returns {Promise.<*>}
   */
  _deleteRelatedVideosAndGetTheirPath(postId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT path, thumbPath FROM tbl_user_video WHERE postId = ?;\
         DELETE FROM tbl_user_video WHERE postId = ?;',
        [postId, postId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Video._deleteRelatedVideosAndGetTheirPath: \n" + err
          });

          return res({success: true, status: STATUS.OK, paths: rows[0]});
        });
    })
  },

  /**
   * Delete photos from server (hard drive)
   *
   * @param postId
   * @param userId
   * @returns {Promise.<*>}
   */
  deleteFromDisk(imagesArray){
    return new Promise((res, rej) => {
      if (!imagesArray || !imagesArray.length) return res({success: true, status: STATUS.OK, message: 'No videos specified'});

      imagesArray.forEach(video => {
        fs.unlink('public' + video.path, err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Video.deleteFromDisk #1: \n" + err
          });

          fs.unlink('public' + video.thumbPath, err => {
            if (err) return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Video.deleteFromDisk #2: \n" + err
            });

            return res({success: true, status: STATUS.OK});
          });
        });
      })
    })
  },

  /**
   * Check video extension
   * @param fileExt - extension of incoming image
   * @returns {boolean}
   */
  isVideo(fileExt){
    const allowedFormats = {
      'mov': true,
      'mpeg4': true,
      'mp4': true,
      'avi': true,
      'wmv': true,
      'mpegps': true,
      'flv': true,
      '3gpp': true,
      'webm': true
    };

    if (fileExt in allowedFormats) {
      return true;
    } else {
      return false;
    }
  },
};

module.exports = Video;
const fs = require('fs');
const fse = require('fs-extra');
const im = require('imagemagick');
const path = require('path');

const db = require('./db');
const STATUS = require('./status');
const Video = require('./video');

const SERVER_IMAGE_DIR = './public/uploads/cabinet/';
const SITE_IMAGE_DIR = '/uploads/cabinet/';

const Image = {

  /**
   * Indentify if file has video or image extenstion
   * Otherwise return error
   *
   * @param file - file with name and row data
   *   { name, data }
   *
   * @returns {Object} which returns object with extension and file type property
   *   { name, data, ext }
   */
  identifyTypeAndGetExtension(file){
    if (!file || !file.name || !file.data) {
      return rej({
        success: false,
        status: STATUS.INVALID_INPUT_PARAMETERS,
        message: "Input parameters must be an object: { userId, image: { name, data } }"
      });
    }

    file.name = file.name.toLowerCase();
    const filename = file.name.split(".");
    file.ext = filename[filename.length - 1];

    const isImage = this.isImage(file.ext);
    const isVideo = Video.isVideo(file.ext);

    if (!isImage && !isVideo) {
      return {
        success: false,
        status: STATUS.INVALID_IMAGE_FORMAT,
        message: `Format ${file.ext} not allowed for image/video upload`
      };
    }

    if (isVideo) return {success: true, status: STATUS.OK, type: 'video', file};
    if (isImage) return {success: true, status: STATUS.OK, type: 'image', file};
  },

  /**
   * Upload image on server and return object in promise response with image link, width, height
   *
   * @param data - input object with image and user info
   *   { userId, image: { name, data, ext} }
   *
   * @returns {Promise} which returns object with image link
   *   { success, name, path, width, height }
   */
  upload (data) {
    return new Promise((res, rej) => {
      if (!data || !data.image || !data.image.ext) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Input parameters must be an object: { userId, image: { data, ext } }"
        });
      }

      const time = (new Date()).getTime();

      const user = data.userId ? data.userId : 'tmp_';
      const imageName = user + "_" + time + "." + data.image.ext;

      const imgPathOnServer = SERVER_IMAGE_DIR + imageName;
      const viewPath = SITE_IMAGE_DIR + imageName;

      const maxImageWidth = 600;
      const maxImageHeight = 600;

      // write image on server
      fs.writeFile(imgPathOnServer, data.image.data, err => {
        if (err) return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in Image.upload #1\n" + err
        });

        // check image sizes
        im.identify(imgPathOnServer, (err, features) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Image.upload #2\n" + err
          });

          // send unchanged picture back if it already small
          if (features.width < maxImageWidth && features.height < maxImageHeight) {
            return res({
              success: true,
              status: STATUS.OK,
              name: imageName,
              path: viewPath,
              width: features.width,
              height: features.height
            });
          }

          // resize image if large
          const opt = {
            srcPath: imgPathOnServer,
            dstPath: imgPathOnServer
          };

          if ((maxImageWidth / maxImageHeight) > (features.width / features.height)) {
            opt.height = maxImageHeight;
          } else {
            opt.width = maxImageWidth;
          }

          im.resize(opt, (err, stdout, stderr) => {
            if (err) return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in Image.upload #3\n" + err
            });

            im.identify(imgPathOnServer, (err, featuresResized) => {
              if (err) return rej({
                success: false,
                status: STATUS.INTERNAL_ERROR,
                message: "Error in Image.upload #4\n" + err
              });

              return res({
                success: true,
                status: STATUS.OK,
                name: imageName,
                path: viewPath,
                width: featuresResized.width,
                height: featuresResized.height
              })
            });
          });
        });
      });
    })
  },

  /**
   * Resize uploaded image, save resized image on server and return object in promise response with resized image link
   * method used only by mobile application
   *
   * @param data - input object with image and user info
   *   { imgUrl, width, height, x, y }
   *
   * return response object with image link
   *   { success, viewPath }
   */
  crop (data) {
    return new Promise((res, rej) => {
      const maxImageWidth = 300;
      const maxImageHeight = 300;

      const srcPath = './public' + data.imgUrl;
      const pathinfo = path.parse(data.imgUrl);
      const dstPath = SERVER_IMAGE_DIR + pathinfo.name + '_thumb' + pathinfo.ext;
      const viewPath = SITE_IMAGE_DIR + pathinfo.name + '_thumb' + pathinfo.ext;

      im.convert([srcPath, '-crop', data.width + "x" + data.height + "+" + data.x + "+" + data.y, dstPath], (err, stdout) => {
        if (err) return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in Image.crop #1\n" + err
        });

        // send unchanged picture back if it already small
        if (data.width < maxImageWidth && data.height < maxImageHeight) {
          return res({success: true, status: STATUS.OK, path: viewPath});
        }

        // resize image if large
        im.convert([dstPath, '-resize', '300x300', dstPath], (err, stdout) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Image.crop #2\n" + err
          });
          return res({success: true, status: STATUS.OK, path: viewPath, width: data.width, height: data.height});
        });
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
  save(postId, userId, images) {
    return new Promise((res, rej) => {
      if (!userId || !postId) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Error in Image.save: no userId or postId specified'
        });
      }
      if (!images || !images.length) {
        return res({success: true, status: STATUS.OK, message: 'No images specified'});
      }

      // bulk insert needs to be like nested arrays, so make it
      // var values = [
      //   ['mark', 'mark@gmail.com'],
      //   ['pete', 'pete@gmail.com']
      // ];
      const bulk = images.map(image => [postId, userId, image.path, image.width, image.height]);

      db.query(
        'INSERT INTO tbl_user_image (postId, userId, userImagePath, userImageWidth, userImageHeight) VALUES ?;\
         SELECT \
           id,\
           userImagePath AS path,\
           userImageWidth AS width,\
           userImageHeight AS height\
         FROM tbl_user_image WHERE postId = ?',
        [bulk, postId],
        (err, rows) => {
          if (err) return rej({success: false, status: STATUS.INTERNAL_ERROR, message: "Error in Image.save\n" + err});
          return res({success: true, status: STATUS.OK, images: rows[1]})
        });
    })
  },

  /**
   * Deletes photos from DB and from hard drive
   *
   * @param postId
   * @returns {Promise.<*>}
   */
  async deleteRelatedToPost(postId){
    const self = this;

    try {
      const getPathsResult = await self._deleteRelatedPhotosAndGetTheirPath(postId);
      if (getPathsResult.success) await self.deleteFromDisk(getPathsResult.paths);
      return {success: true, status: STATUS.OK};
    } catch (err) {
      throw err;
    }
  },

  async updateRelativeToPost(postId, images){
    try {
      const self = this;

      // check if images specified and delete previous images
      const currentPostImagePathsResult = await self._deleteRelatedPhotosAndGetTheirPath(postId);
      if (!currentPostImagePathsResult.paths || !images || !images.length) {
        return {success: true, status: STATUS.OK, message: 'Current post has no images'};
      }

      // get previous images to delete them from disk
      const newPaths = images.map(image => image.path);
      const imagesToDelete = [];
      for (let i = 0; i < currentPostImagePathsResult.paths.length; i++) {
        const path = currentPostImagePathsResult.paths[i].path;
        if (newPaths.indexOf(path) === -1) {
          imagesToDelete.push({path})
        }
      }

      if (!imagesToDelete || !imagesToDelete.length) {
        return {success: true, status: STATUS.OK, message: 'No changes in current post`s images'};
      }
      await self.deleteFromDisk(imagesToDelete);
      return {success: true, status: STATUS.OK};
    } catch (err) {
      throw err;
    }
  },

  /**
   * Delete photos from DB and get their paths
   *
   * @param postId
   * @returns {Promise.<*>}
   */
  _deleteRelatedPhotosAndGetTheirPath(postId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT userImagePath AS path FROM tbl_user_image WHERE postId = ?;\
         DELETE FROM tbl_user_image WHERE postId = ?;',
        [postId, postId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Image._getRelatedPhotosPath: \n" + err
          });

          return res({success: true, status: STATUS.OK, paths: rows[0]});
        });
    })
  },

  /**
   * Delete photos from server (hard drive)
   *
   * @param imagesArray: [ {path}, {path} ]
   * @returns {Promise.<*>}
   */
  deleteFromDisk(imagesArray){
    return new Promise((res, rej) => {
      if (!imagesArray || !imagesArray.length) return res({
        success: true,
        status: STATUS.OK,
        message: 'No images specified'
      });

      imagesArray.forEach(image => {
        if(!image.path || image.path.indexOf('guestAva.png') !== -1) return;

        fs.unlink('public' + image.path, err => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Image.deleteFromDisk: \n" + err
          });
        });
      });

      return res({success: true, status: STATUS.OK});
    })
  },

  /**
   * Check image extension
   * @param fileExt - extension of incoming image
   * @returns {boolean}
   */
  isImage(fileExt){
    const allowedFormats = {jpg: true, png: true, jpeg: true};

    if (fileExt in allowedFormats) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Copy image from received path to new image named oldImageName + "_copy"
   *
   * @param targetPath - path of existing image
   *
   * @returns {Promise} which returns path of copied image or error
   *    success: {success, status, path}
   *    error: {success, status, message}
   */
  copy(targetPath){
    return new Promise((res, rej) => {
      const pathInfo = path.parse(targetPath);
      const fromPath = SERVER_IMAGE_DIR + pathInfo.base;
      const time = (new Date()).getTime();
      const toPath = SERVER_IMAGE_DIR + pathInfo.name + '_copy_' + time + pathInfo.ext;

      fse.copy(fromPath, toPath, err => {
        if (err)  {
          return rej({success: false, status: STATUS.INTERNAL_ERROR, message: 'Error occurs in Image.copy: \n' + err})
        }

        const viewPath = SITE_IMAGE_DIR + pathInfo.name + '_copy_' + time + pathInfo.ext;
        return res({success: true, status: STATUS.OK, path: viewPath})
      })
    })
  },
};

module.exports = Image;
var message = new Message();

var Feed = function (socket) {
  this.socket = socket;
  this.userId = false;
  this.userPhoto = false;
  this.imageAttachments = [];
  this.videoAttachments = [];
  this.selectedPostId = false;
  this.editPostId = false;
  this.savePostInProgress = false;
}

Feed.prototype.init = function () {
  var self = this;

  console.log('inited');
  self.initSocketHandlers();
  self.initEventHandlers();
  self.initAttachments();
};

/**
 * Event handlers like "click"
 */
Feed.prototype.initEventHandlers = function () {
  var self = this;

  // show write post modal
  $(".writepost-container .input").click(function () {
    self.openWriteModal();
  });

  // hide write post modal and clear all content, delete uploaded photo from disk
  $(".writepost-container .btn-close").click(function () {
    self.closeWriteModal();

    // IMPORTANT!! During changing this check u may loose your previously saved post content
    if (!self.editPostId) {
      var reqData = {hash: userHash, images: self.imageAttachments, videos: self.videoAttachments};
      self.socket.emit('cleanPostAttachments', JSON.stringify(reqData));
    }

    self.cleanPostInput();
  });

  // show/hide likes container and get full likers list
  $(document).on("click", ".post-container .arrow-holder", function () {
    if (!$(this).closest('.post-footer').find('.liked-list').hasClass('users-received')) {
      var postId = $(this).closest('.post-container').attr('data-postid');
      self.socket.emit('getPostLikes', JSON.stringify({postId: postId}))
    }

    $(this).find(".arrow-more").toggleClass("rotated");
    $(this).closest(".post-footer").find(".liked-list").toggleClass("opened");
  });

  // Add/Update post
  $(document).on('click', '.writepost-container .post', function () {
    var postText = message.correctMessageBeforeSend($('.writepost-container .input').html());

    if (self.savePostInProgress) return;

    // check if text or attachments exist
    if (!self.checkConditionsBeforeSend(postText)) {
      return;
    }

    var reqData = {hash: userHash};
    if (postText) reqData.message = postText;
    if (self.imageAttachments.length > 0) reqData.images = self.imageAttachments;
    if (self.videoAttachments.length > 0) reqData.videos = self.videoAttachments;
    if (self.editPostId) reqData.postId = self.editPostId;

    self.socket.emit('addPost', JSON.stringify(reqData));
  });

  // add/remove like from post
  $(document).on('click', ".like-toggle", function (e) {
    e.preventDefault();
    var $postContainer = $(this).closest('.post-container');
    var postId = +$postContainer.attr('data-postid');
    dataSocket.emit('updatePostLike', JSON.stringify({hash: userHash, postId: postId}));

    var $likesContainer = $postContainer.find('.likes-total');
    var likesCount = +$likesContainer.html();
    if ($(this).hasClass('active')) {
      if (likesCount > 0) $likesContainer.html(likesCount - 1);
    } else {
      $likesContainer.html(likesCount + 1);
    }

    $(this).toggleClass('active');
  });

  // show delete/edit post menu
  $(document).on('click', ".settings-dots.delete-my", function (e) {
    e.preventDefault();
    // prevent open menu for stranger posts
    if (+$(this).closest('.single-photo').attr('data-profileid') !== +userInfo.userId) {
      return;
    }
    self.selectedPostId = +$(this).closest('.single-photo').attr('data-postid');
    $(".popup-post-wrapper, .popup-post-modal, .post-control").show();
  });

  // delete post button clicked
  $(document).on('click', ".post-delete", function (e) {
    e.preventDefault();
    var postId = +$(this).closest('.post-container').attr('data-postid');
    dataSocket.emit('deletePost', JSON.stringify({hash: userHash, postId: postId}));
  });

  // edit post button clicked
  $(document).on('click', ".post-edit", function (e) {
    e.preventDefault();
    var $container = $(this).closest('.post-container');
    self.editPostId = $container.attr('data-postid');
    self.preparePostForUpdate($container)
  });

  // remove attachment from write post modal when editing post
  $(document).on('click', ".picture-box .close-cross", function (e) {
    e.preventDefault();

    var $imageBox = $(this).closest('.picture-box');
    var type = $imageBox.find('video').length ? 'video' : 'image';

    if (type === 'image') {
      var src = $imageBox.find('img').attr('src');
      var imageIndex = self.imageAttachments.findIndex(function (elem) {
        return elem.path === src
      });
      // remove image from self.imageAttachments
      self.imageAttachments.splice(imageIndex, 1);
    }

    if (type === 'video') {
      var src = $imageBox.find('video source').attr('src');
      var videoIndex = self.videoAttachments.findIndex(function (elem) {
        return elem.path === src
      });
      // remove image from self.imageAttachments
      self.videoAttachments.splice(videoIndex, 1);
    }
    $imageBox.remove();
  });

  // check for hashtags in text
  $(".writepost-container .input").on("keyup", function () {
    var text = $(this).text();
    var replaced = self.correctTextBeforeShow(text);

    $(".writepost-container .input").html(replaced);
    self.cursorToTheEnd($(this)[0]);  // move focus cursor to the end of text
  });
};

/**
 * Socket handlers listeners
 */
Feed.prototype.initSocketHandlers = function () {
  var self = this;

  // add post
  self.socket.off('addPost').on('addPost', function (data) {
    const parsedData = JSON.parse(data);

    self.savePostInProgress = false;

    if (!parsedData.success) return showAlertModal(parsedData.message);

    $('.post-container[data-postid="' + parsedData.postId + '"]').remove();

    var postHtml = self.postTemplate(parsedData);
    $("#posts").prepend(postHtml);
    self.closeWriteModal();
    self.cleanPostInput();
  });

  // delete post
  self.socket.off('deletePost').on('deletePost', function (data) {
    const parsedData = JSON.parse(data);

    if (!parsedData.success) return showAlertModal(parsedData.message);

    $('.post-container[data-postid="' + parsedData.postId + '"]').remove();
    self.cleanPostInput();
  });

  // like post
  self.socket.off('updatePostLike').on('updatePostLike', function (data) {
    const parsedData = JSON.parse(data);
    if (!parsedData.success) return showAlertModal(parsedData.message);

    if (parsedData.action === 'add') {
      $('.like-toggle', '.post-container[data-postid="' + parsedData.postId + '"]').addClass('active')
    } else {
      $('.like-toggle', '.post-container[data-postid="' + parsedData.postId + '"]').removeClass('active')
    }
  });

  self.socket.off('getPostLikes').on('getPostLikes', function (data) {
    const parsedData = JSON.parse(data);
    if (!parsedData.success) return showAlertModal(parsedData.message);
    self.insertUsersWhoLikedPost(parsedData)
  });
};

Feed.prototype.insertUsersWhoLikedPost = function (data) {
  var html = '';
  for (var i = 0; i < data.users.length; i++) {
    var user = data.users[i];
    html +=
      '<div class="liked-item"> \
        ' + svgObj.heartBlack + '\
       <a href="#">\
         <div class="user-avatar-holder-wrap">\
           <figure class="user-avatar-holder">\
             <img src="' + user.userPhoto + '">\
           </figure>\
         </div>\
         <p>' + user.userName + '</p>\
       </a>\
     </div>';
  }

  $('.liked-list', '.post-container[data-postid="' + data.postId + '"]').html(html).addClass('users-received');
};

/**
 * Post attachment section
 */
Feed.prototype.initAttachments = function () {
  var self = this;

  $('#add-attachment').ajaxUpload({
    url: "/feed/upload-image",
    name: "image",
    onSubmit: function () {
      var loaderHtml = self.imageContainer();
      $('#attachments').prepend(loaderHtml).show();
      return true;
    },
    onComplete: function (res) {
      var resObj = JSON.parse(res).img;
      if (!resObj.success) return showAlertModal(resObj.message);

      var imageObj = {path: resObj.path};

      // if obj has screenshot - it is a video file
      if (resObj.thumbPath) {
        imageObj.thumbPath = resObj.thumbPath;
        // prepare attachment for send to server
        self.videoAttachments.push(imageObj);


        var attachmentHtml = self.videoContainer(imageObj);
        $('.loader.empty').remove();
        $('#attachments').prepend(attachmentHtml).show();
      } else {
        imageObj.width = resObj.width;
        imageObj.height = resObj.height;

        // image file
        // prepare attachment for send to server
        self.imageAttachments.push(imageObj);

        var attrObj = {
          src: imageObj.path,
          'data-image-width': imageObj.width,
          'data-image-height': imageObj.height,
        };
        $('.loader.empty').removeClass('empty').find('img').attr(attrObj);
      }
    }
  });
};

Feed.prototype.preparePostForUpdate = function ($post) {
  var self = this;

  // add text
  var text = $post.find('.post-body .post-text').html();
  $('.writepost-container .input').html(text);

  // add images
  var $postImages = $post.find('.post-body img');
  $postImages.each(function () {
    var imageObj = {};
    imageObj.path = $(this).attr('src');
    imageObj.width = $(this).attr('data-image-width');
    imageObj.height = $(this).attr('data-image-height');
    self.imageAttachments.push(imageObj);
    $('#attachments').prepend(self.imageContainer(imageObj.path))
  });

  // add videos
  var $postVideos = $post.find('.post-body video');
  $postVideos.each(function () {
    var imageObj = {};
    imageObj.path = $(this).find('source').attr('src');
    imageObj.thumbPath = $(this).attr('data-thumb-path');
    self.videoAttachments.push(imageObj);
    $('#attachments').prepend(self.videoContainer(imageObj))
  });


  // open write modal window
  $(".writepost-container").addClass("opened");
};

Feed.prototype.imageContainer = function (source, identifier) {
  var id = identifier ? 'data-image-id="' + identifier + '"' : '';

  var src = '/img/loader.gif';
  var empty = 'empty';
  if (source) {
    src = source;
    empty = '';
  }

  var imageBox =
    '<div class="picture-box loader ' + empty + '">\
       <div class="close-cross">' + svgObj.closeCross + '</div>\
       <img src="' + src + '" ' + id + '>\
     </div>';

  return imageBox;
};

Feed.prototype.videoContainer = function (video) {
  var filePath = video.path;
  var fileNameSplitted = filePath.split(".");
  var fileExt = fileNameSplitted[fileNameSplitted.length - 1];

  var videoBox =
    '<div class="picture-box loader">\
       <div class="close-cross">' + svgObj.closeCross + '</div>\
       <video style="width:300px; height: 200px; max-width:100%;" controls="" data-thumb-path="' + video.thumbPath + '">\
         <source src="' + filePath + '" type="video/' + fileExt + '">\
       </video>\
     </div>';

  return videoBox;
};

Feed.prototype.postTemplate = function (postObj) {
  var self = this;
  var message = '<div class="post-text">' + self.correctTextBeforeShow(postObj.text) + '</div>';

  var time = postObj.time == 'online' ? 'Just now' : postObj.time;

  var images = '';
  if (postObj.images && postObj.images.length > 0) {
    for (var i = 0; i < postObj.images.length; i++) {
      images +=
        '<img class="profile-img" \
              src="' + postObj.images[i].path + '" \
              data-image-id="' + postObj.images[i].id + '" \
              data-image-width="' + postObj.images[i].width + '" \
              data-image-height="' + postObj.images[i].height + '" \
         >';
    }
  }

  var videos = '';
  if (postObj.videos && postObj.videos.length > 0) {
    for (var x = 0; x < postObj.videos.length; x++) {
      var video = postObj.videos[x];
      var filePath = video.path;
      var fileNameSplitted = filePath.split(".");
      var fileExt = fileNameSplitted[fileNameSplitted.length - 1];

      videos +=
        '<video style="width:300px; height: 200px; max-width:100%;" controls="" \
                data-video-id="' + video.id + '" \
                data-thumb-path="' + video.thumbPath + '">\
           <source src="' + filePath + '" type="video/' + fileExt + '">\
         </video>'
    }
  }

  var postHtml =
    '<div class="post-container"\
          data-profileid="' + postObj.user.userId + '"\
          data-postId="' + postObj.postId + '"\
          >\
       <div class="post-header">\
         <div class="user-avatar-holder-wrap">\
           <figure class="user-avatar-holder">\
             <img src="' + postObj.user.userPhoto + '">\
           </figure>\
         </div>\
         <div class="user-info">\
           <p class="nickname">\
             <a href="/profile/' + postObj.user.userId + '">\
               ' + postObj.user.userName + '\
             </a>\
           </p>\
           <p class="time">' + time + '</p>\
         </div>\
         <div class="post-info-wrap">\
           ' + svgObj.verticalDots + '\
           <div class="post-actions">\
             <p class="post-edit">Edit</p>\
             <p class="post-delete">Delete</p>\
             <p class="post-make-main">Make main</p>\
           </div>\
         </div>\
       </div>\
       <div class="post-body">\
         ' + message + '\
         ' + videos + '\
         ' + images + '\
       </div>\
       <div class="post-footer">\
         <div class="post-footer-top">\
           <div class="like">\
             ' + svgObj.heartBlack + '\
             <span class="likes-total">0</span>\
           </div>\
           <div class="arrow-holder">\
             ' + svgObj.arrow + '\
           </div>\
         </div>\
         <hr>\
         <div class="liked-list"></div>\
         <div class="post-footer-bottom">\
           <div class="like like-toggle">\
             ' + svgObj.heartWhite + ' \
           </div>\
           <div class="share" style="display: none;">\
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 15">\
               <path d="M18 7l-7-7v4C4 5 1 10 0 15c2.5-3.5 6-5.1 11-5.1V14z" opacity=".54"/>\
             </svg>\
             <span>Share</span>\
           </div>\
         </div>\
       </div>';

  return postHtml;
};

/** Helper functions
 *
 */

Feed.prototype.openWriteModal = function () {
  $(".writepost-container").addClass("opened");
};

Feed.prototype.closeWriteModal = function () {
  $(".writepost-container").removeClass("opened");
};


Feed.prototype.checkConditionsBeforeSend = function (text) {
  var self = this;
  var textWithoutSpace = text.replace(/ /g, "");

  // if there is no message or user not logged in - exit
  if ((textWithoutSpace.length === 0 && self.imageAttachments.length === 0 && self.videoAttachments.length === 0) || !userHash) {
    return false;
  }

  return true;
};

Feed.prototype.correctTextBeforeShow = function (text) {
  if (!text || text.trim().length === 0) {
    return ''
  }

  var hashTagsMatch = text.match(/(^|\s|\(|>)#((\w|[a-zA-Zа-яА-Я0-9])+)/g);
  if (hashTagsMatch !== null) {
    for (var i = 0; i < hashTagsMatch.length; i++) {
      var link =
        '<a class="tag" \
            href="/posts/hashtags/'+ hashTagsMatch[i].substring(1) +'" \
            style="font-weight: bold; cursor: pointer"\
            >\
            ' + hashTagsMatch[i] + '\
        </a>';

      text = text.replace(hashTagsMatch[i], link);
    }
  }

  return text
};
Feed.prototype.correctHashTagsOnEdit = function (text) {
  var hashTagsLinkMatch = text.match(/<a class="htl".*?tag=(.*?)".*?<\/a>/im);
  while (hashTagsLinkMatch !== null) {
    if (hashTagsLinkMatch !== null) {
      text = text.replace(hashTagsLinkMatch[0], '#' + hashTagsLinkMatch[1]);
    }
    hashTagsLinkMatch = text.match(/<a class="htl".*?tag=(.*?)".*?<\/a>/im);
  }

  return text
};

/**
 * Clear all content, delete uploaded photo from disk
 */
Feed.prototype.cleanPostInput = function () {
  var self = this;

  self.imageAttachments = [];
  self.videoAttachments = [];
  self.editPostId = false;
  $('.writepost-container .input').empty();
  $('.picture-box.loader', '#attachments').remove();
};

Feed.prototype.cursorToTheEnd = function (htmlElement) {
  var range, selection;

  range = document.createRange();//Create a range (a range is a like the selection but invisible)
  range.selectNodeContents(htmlElement);//Select the entire contents of the element with the range
  range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
  selection = window.getSelection();//get the selection object (allows you to change selection)
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection
};
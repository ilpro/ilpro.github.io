var message = new Message();

var PageFeed = {
  userHash: false,
  userPhoto: false,
  imageAttachments: [],
  videoAttachments: [],
  selectedPostId: false,
  socket: {},

  init() {
    var self = this;

    self.userHash = userHash;
    self.socket = dataSocket;

    self.initSocketHandlers();
    self.initEventHandlers();
    self.initAttachments();
  },


  /**
   * Event handlers listeners like "click"
   */
  initEventHandlers: function () {
    var self = this;

    $(document).on('click', '.writepost__input', self.showAddPostModal);

    $(document).on('click', '.writepost .cancel-post', function (e) {
      self.hideAddPostModal(e);
      $('.writepost__input').one('focusin', self.showAddPostModal);
    });

    // Add new Post
    $(document).on('click', '.writepost .save-post', function () {
      var postText = message.correctMessageBeforeSend($('.writepost__input').html());

      // check if text or attachments exist
      if (!self.checkConditionsBeforeSend(postText)) {
        return;
      }

      var reqData = {hash: userHash};
      if (postText) reqData.message = postText;
      if (self.imageAttachments.length > 0) reqData.images = self.imageAttachments;

      self.socket.emit('addPost', JSON.stringify(reqData));
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

    // hide delete/edit post menu
    $(".popup-post-bg").on("click", function (e) {
      e.preventDefault();
      self.selectedPostId = false;
      $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();
    });

    // delete post button clicked
    $(document).on('click', ".popup-post-modal .post-delete-option", function (e) {
      e.preventDefault();
      $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();
      dataSocket.emit('deletePost', JSON.stringify({hash: self.userHash, postId: self.selectedPostId}));
    });
  },


  /**
   * Socket handlers listeners
   */
  initSocketHandlers: function () {
    var self = this;

    // add post
    self.socket.on('addPost', function (data) {
      const parsedData = JSON.parse(data);

      console.log(parsedData);
      if (!parsedData.success) return alert(parsedData.error);

      var postHtml = self.postTemplate(parsedData);
      $(".photos-wrapper").prepend(postHtml);
      self.hideAddPostModal();
      self.cleanPostInput()
    });

    // delete post
    self.socket.on('deletePost', function (data) {
      const parsedData = JSON.parse(data);

      if (!parsedData.success) return alert(parsedData.error);

      $('.photos-wrapper .single-photo[data-postid="' + parsedData.postId + '"]').remove();
      self.hideAddPostModal();
      self.cleanPostInput();
    });
  },


  /**
   * Post attachment section
   */
  initAttachments: function () {
    var $attachmentBtn = $('#attachment');
    var self = this;

    $attachmentBtn.ajaxUpload({
      url: "/feed/upload-image",
      name: "image",
      onSubmit: function () {
        var loaderHtml =
          '<div class="picture-box loader empty">\
             <div class="close-cross">\
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12">\
                 <path fill="#FFF" d="M3.4 0l2.2 2.6c.6.7 1 1.3 1.5 2h.1c.5-.7 1-1.3 1.5-2L10.8 0h3L8.6 5.8 14 12h-3.2L8.6 9.3C8 8.6 7.5 7.9 7 7.2h-.1c-.5.7-1 1.4-1.6 2.1L3.1 12H0l5.4-6.1L.3 0h3.1z"></path>\
               </svg>\
             </div>\
             <img src="/img/loader.gif">\
           </div>';
        $('#attachments').prepend(loaderHtml).show();
        return true;
      },
      onComplete: function (res) {
        var resObj = JSON.parse(res).img;
        var imageObj = {
          path: resObj.path,
          width: resObj.width,
          height: resObj.height,
        };

        // if obj has screenshot - it is a video file
        if (imageObj.thumbPath) {
          // prepare attachment for send to server
          self.videoAttachments.push(imageObj);

          // find file resolution
          var fileNameSplited = imageObj.path.split(".");
          var fileRes = fileNameSplited[fileNameSplited.length - 1].toLowerCase();

          $('.loader.empty').remove();

          var attachmentHtml =
            '<video style="width:300px; height: 200px; max-width:100%;" controls="">\
               <source src="' + imageObj.path + '" type="video/' + fileRes + '">\
             </video>';

          $('#attachments').prepend(attachmentHtml).show();
        } else {
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
  },

  postTemplate: function (postObj) {

    var message = postObj.message ? '<div class="post-text">' + postObj.message + '</div>' : '';

    var images = '';
    if (postObj.images && postObj.images.length > 0) {
      for (var i = 0; i < postObj.images.length; i++) {
        images += '<img class="profile-img" src="' + postObj.images[i].path + '" alt="photo">';
      }
    }

    var postHtml =
      '<div class="single-photo" \
            data-profileid="' + postObj.user.userId + '"\
            data-postid="' + postObj.postId + '">\
         <a href="/profile/' + postObj.user.userId + '" class="main-info">\
           <div class="avatar-holder">\
             <div class="user-avatar" title="Your photo">\
               <img src="' + postObj.user.userPhoto + '" alt="user" style="max-width: 100%;">\
             </div>\
           </div>\
           <div class="info-holder">\
             <div class="main-info-row">\
               <div class="name">' + postObj.user.userName + '</div>\
             </div>\
             <div class="settings-dots delete-my">\
               <div class="settings-dot"></div>\
               <div class="settings-dot"></div>\
               <div class="settings-dot"></div>\
             </div>\
             <div class="publish-date">Just now</div>\
           </div>\
         </a>\
         ' + message + '\
         ' + images + '\
         <div class="photo-info">\
           <div class="like ">\
             ' + svgObj.heartFull() + '\
             <div class="like-amount">0</div>\
           </div>\
           <div class="likes-wrap">\
             <div class="likes-arrow tt"></div>\
           </div>\
         </div>\
         <div class="who-likes">\
           <div style="text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">No likes yet</div>\
         </div>\
         <div class="photo-options">\
           <div class="like ">\
             ' + svgObj.heart() + '\
             Like\
           </div>\
         </div>\
       </div>';

    return postHtml;
  },

  /** Helper functions
   *
   */
  showAddPostModal: function () {
    $('.writepost').addClass('focused');
    $('.writepost__input').animate({
      'min-height': '100px'
    }, 300);
    $('.writepost .controls').animate({
      height: $('.writepost .controls').get(0).scrollHeight,
      opacity: 1
    }, 300, function () {
      $(this).height('auto');
    });
  },

  hideAddPostModal: function () {
    $('.writepost').removeClass('focused');
    $('.writepost .controls').css('height', $('.writepost .controls').get(0).scrollHeight);
    $('.writepost__input').animate({
      'min-height': '39px'
    }, 300).blur();
    $('.writepost .controls').animate({
      height: 0,
      opacity: 0
    }, 300);
    $('.writepost__input').html('');

    // hack for mobiles
    setTimeout(function () {
      $('.writepost .controls').css({height: 0, opacity: 0});
    }, 300)
  },

  checkConditionsBeforeSend: function (text) {
    var self = this;
    var textWithoutSpace = text.replace(/ /g, "");

    // if there is no message or user not logged in - exit
    if ((textWithoutSpace.length === 0 && self.imageAttachments.length === 0 && self.videoAttachments.length === 0) || !self.userHash) {
      return false;
    }

    return true;
  },

  correctPostTextBeforeShow: function (text) {
    var hashTagsMatch = text.match(/#[a-zA-Zа-яА-Я0-9]+[^+#,=\s]/img);
    if (hashTagsMatch !== null) {
      for (var i = 0; i < hashTagsMatch.length; i++) {
        text = text.replace(hashTagsMatch[i], '<a class="htl" target="_blank" href="/hashtag-search/' + hashTagsMatch[i].substr(1) + '"><s>#</s><b>' + hashTagsMatch[i].substr(1) + '</b></a>');
      }
    }

    return text
  },

  correctHashTagsOnEdit: function (text) {
    var hashTagsLinkMatch = text.match(/<a class="htl".*?tag=(.*?)".*?<\/a>/im);
    while (hashTagsLinkMatch !== null) {
      if (hashTagsLinkMatch !== null) {
        text = text.replace(hashTagsLinkMatch[0], '#' + hashTagsLinkMatch[1]);
      }
      hashTagsLinkMatch = text.match(/<a class="htl".*?tag=(.*?)".*?<\/a>/im);
    }

    return text
  },

  cleanPostInput: function () {
    var self = this;
    self.imageAttachments = [];
    self.videoAttachments = [];
    $('.writepost__input').empty();
    $('.picture-box.loader').remove();
  },
};

PageFeed.init();


// $('.writepost .save-post').off('click').on('click', function () {
//   var postImgArray = [];
//   var postWidthArray = [];
//   var postHeightArray = [];
//   var postVideo;
//   var postData = {
//     postSocialsArray: []
//   };
//   var postText = $('.writepost__input').html();
//   var postTags = correctPostTextBeforeSend(postText).hashTags;
//   postText = correctPostTextBeforeSend(postText).text;
//
//   if (postText.length > 0) {
//     postData.status = postText;
//   }
//   $('.picture-box img').each(
//     function (index) {
//       postImgArray.push($(this).attr('src'));
//       postWidthArray.push($(this).attr('data-width'));
//       postHeightArray.push($(this).attr('data-height'));
//     }
//   );
//   if (postImgArray.length > 0) {
//     postData.imgArr = postImgArray;
//   }
//   postVideo = $('.picture-box video source').attr('src');
//   if (postVideo) {
//     postData.postVideo = postVideo;
//   }
//   $(".writepost").find('.soc-block input[type="checkbox"]').each(function () {
//     if ($(this).is(':checked')) {
//       if (!(!(postImgArray.length > 0 || postVideo) && $(this).attr("name") === 'instagram')) {
//         postData.postSocialsArray.push($(this).attr("name"))
//       }
//     }
//   });
//   if (postImgArray.length > 0 || postText.length > 0 || postVideo) {
//     dataSocket.emit('addRibbonPost', JSON.stringify({
//       hash: userHash,
//       ribbonText: postText,
//       ribbonHashTags: postTags,
//       ribbonVideo: postVideo,
//       photo: postImgArray.join(),
//       photoWidth: postWidthArray.join(),
//       photoHeight: postHeightArray.join(),
//       ribbonId: currentPost
//     }));
//     if (postData.postSocialsArray.length > 0) {
//       postData.shareType = 'post';
//       dataSocket.emit('shareSocialPost', JSON.stringify({hash: userHash, postData: postData}));
//     }
//     currentPost = false
//   }
// });

// /**
//  * Created by Creator on 10.07.2017.
//  */
// var currentPost = false;
// var currentLikeObj = false;
// var currentImage = false;
// var attachments = [];
//
// var videoFormats = {
//   'mov': true,
//   'mpeg4': true,
//   'mp4': true,
//   'avi': true,
//   'wmv': true,
//   'mpegps': true,
//   'flv': true,
//   '3gpp': true,
//   'webm': true
// };
//
// var imageFormats = {
//   'jpg': true,
//   'png': true,
//   'jpeg': true
// };
//
// $(".photos-wrapper").on("click", ".single-photo[data-ribbonid] .photo-options .like", function () {
//   currentLikeObj = $(this).closest('.single-photo');
//   dataSocket.emit('updateUserPostLike', JSON.stringify({
//     hash: getCookie("hash"),
//     profileId: currentLikeObj.data("profileid"),
//     ribbonId: currentLikeObj.data("ribbonid")
//   }));
//   dataSocket.emit('getUserPostLike', JSON.stringify({
//     hash: userHash,
//     profileId: currentLikeObj.data("profileid"),
//     ribbonId: currentLikeObj.data("ribbonid")
//   }));
// });
// $(".photos-wrapper").on("click", ".single-photo[data-postid] .photo-options .like", function () {
//   currentLikeObj = $(this).closest('.single-photo');
//   dataSocket.emit('updateUserNewsPostLike', JSON.stringify({
//     hash: getCookie("hash"),
//     postId: currentLikeObj.data("postid")
//   }));
//   dataSocket.emit('getUserNewsPostLike', JSON.stringify({hash: userHash, postId: currentLikeObj.data("postid")}));
// });
// dataSocket.on('updateUserPostLike', function (data) {
//   updateUserPostLike(data)
// });
// dataSocket.on('updateUserNewsPostLike', function (data) {
//   updateUserPostLike(data)
// });
// function updateUserPostLike(data) {
//   var n = parseInt(currentLikeObj.find(".like-amount").html().match(/\d+/gi)[0]);
//
//   if (data.action == "add") {
//     n += 1;
//     currentLikeObj.find(".like").addClass("active");
//   }
//   else if (data.action == "remove") {
//     n -= 1;
//     currentLikeObj.find(".like").removeClass("active");
//   }
//
//   currentLikeObj.find(".like-amount").text(n);
// }
//
// $('.photos-wrapper').on('click', '.single-photo[data-ribbonid] .likes-wrap', function (e) {
//   e.preventDefault();
//   var data = currentLikeObjGrabber($(this));
//   dataSocket.emit('getUserPostLike', JSON.stringify({
//     hash: userHash,
//     profileId: data.profileId,
//     ribbonId: data.ribbonId
//   }));
// });
//
// $('.photos-wrapper').on('click', '.single-photo[data-postid] .likes-wrap', function (e) {
//   e.preventDefault();
//   var data = currentLikeObjGrabber($(this));
//   dataSocket.emit('getUserNewsPostLike', JSON.stringify({hash: userHash, postId: data.postId}));
// });
//
// function correctPostTextBeforeSend(text) {
//   var hashTags = [];
//
//   // replace chrome div wrapping with new line
//   var divMatches = text.match(/<div[^>]*>(.*?)<\/div[^>]*>/i);
//   while (divMatches != null) {
//     if (divMatches != null) {
//       text = text.replace(divMatches[0], '\n' + divMatches[1]);
//     }
//     divMatches = text.match(/<div[^>]*>(.*?)<\/div[^>]*>/i);
//   }
//
//   // replace firefox br with new line
//   var brMatches = text.match(/<\/?br>/g);
//   if (brMatches != null) {
//     for (var i = 0; i < brMatches.length; i++) {
//       text = text.replace(brMatches[0], '\n');
//     }
//   }
//
//   // check if text has bug &nbsp
//   var whitespaceBugCheck = text.match(/&nbsp;/g);
//   if (whitespaceBugCheck != null) {
//     text = stringReplaceAll(text, '&nbsp;', ' ');
//   }
//
//   // replace all tags
//   var tagMatches = text.match(/<[^>]*>/g);
//   if (tagMatches != null) {
//     for (var i = 0; i < tagMatches.length; i++) {
//       text = text.replace(tagMatches[i], ' ');
//     }
//   }
//
//   var manyWhitespaces = text.match(/  /i);
//   while (manyWhitespaces != null) {
//     if (manyWhitespaces != null) {
//       text = stringReplaceAll(text, '  ', ' ');
//     }
//     manyWhitespaces = text.match(/  /i);
//   }
//
//   // correct chrome many new line
//   var nLineMultiple = text.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);
//
//   while (nLineMultiple != null) {
//     if (nLineMultiple != null) {
//       text = text.replace(nLineMultiple[0], '\n');
//     }
//     nLineMultiple = text.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);
//   }
//
//   var hashTagsMatch = text.match(/#[a-zA-Zа-яА-Я0-9]+[^+#,=\s]/img);
//   if (hashTagsMatch !== null) {
//     for (var i = 0; i < hashTagsMatch.length; i++) {
//       hashTags.push(hashTagsMatch[i]);
//     }
//   }
//
//   return {
//     text: text,
//     hashTags: hashTags
//   }
// }
//
// function currentLikeObjGrabber($current) {
//   var returnobj = {};
//   currentLikeObj = $current.parents('.single-photo');
//   var $target = $current.find('.likes-arrow');
//   var $text = currentLikeObj.find('.who-likes');
//   var textState = $text.css('display');
//   $target.toggleClass('rotated-arrow');
//   $text.css('display', (textState == 'block') ? 'none' : 'block');
//   if (currentLikeObj.attr('data-ribbonid')) {
//     returnobj.profileId = currentLikeObj.data("profileid");
//     returnobj.ribbonId = currentLikeObj.data("ribbonid");
//   } else if (currentLikeObj.attr('data-postid')) {
//     returnobj.postId = currentLikeObj.data("postid");
//   }
//
//   return returnobj
// }
//
// dataSocket.removeEventListener('getUserPostLike').on('getUserPostLike', function (data) {
//   insertLikesPerson(data)
// });
// dataSocket.removeEventListener('getUserNewsPostLike').on('getUserNewsPostLike', function (data) {
//   var socArr = ['fblikes', 'vklikes', 'glikes', 'oklikes', 'mslikes'];
//   var socNames = ['Facebook', 'Вконтакте', 'Google plus', 'Одноклассники', 'Emoment'];
//   var socImages = ['feed-news-fb.svg', 'feed-news-vk.svg', 'feed-news-gplus.svg', 'feed-news-ok.svg', 'feed-news-emo.svg'];
//   var socLinks = ['//fb.com', '//vk.com', '//plus.google.com', '//ok.ru', '//airybay.com'];
//   data.socData = [];
//
//   socArr.forEach(function (item, index) {
//     data.socData[index] = {
//       name: socNames[index],
//       image: socImages[index],
//       value: currentLikeObj.data(item),
//       link: socLinks[index]
//     };
//   });
//
//   insertLikesPerson(data)
// });
//
// function insertLikesPerson(data) {
//   var html = "";
//   var isLiked = false;
//
//   if (data.socData) {
//     for (var k = 0; k < data.socData.length; k++) {
//       if (+data.socData[k].value > 0) {
//         html += htmlLikeSocials(data.socData[k]);
//       }
//     }
//   }
//
//   for (var i = 0; i < data.likes.length; i++) {
//     if (data.likes[i].my)
//       isLiked = true;
//     html += htmlLikePerson(data.likes[i]);
//   }
//   if (!html) {
//     html = '<div style="text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">Поки що нікому не сподобалось</div>'
//   }
//   currentLikeObj.find('.who-likes').html(html);
// }
//
// // html елемент списка лайков
// function htmlLikePerson(row) {
//   return '<a href="/profile/' + row.userId + '"><div class="like-person ' + ((row.my) ? "my" : "") + '">\
// 				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="-1 0 20 16">\
// 					<path fill="#d3494e" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
// 					4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
// 					3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
// 				</svg>\
// 				<figure class="like-person-avatar" title="">\
// 					<img src="' + row.userPhoto + '" alt="user" class="" style="max-width: 100%;">\
// 				</figure>\
// 				<div class="name-status-holder flexcol">\
// 					<div class="user-nickname">' + row.userName + '</div>\
// 					<!--<div class="user-online-status">' + ((row.userLastActive != "online") ? row.userLastActive : lang.lOnlineStatus) + '</div>-->\
// 				</div>\
// 				<svg class="user-favour svg-ico ' + ((row.inFavorite) ? 'active' : '') + '" data-userid="' + row.userId + '" xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">\
// 					<!--<path fill="#B4B4B4" d="M7.8,2.1c0-0.5,0.2-0.7,0.7-0.7c0,0,0.7-0.1,0.7,0.7c0,0.7-0.6,0.5-0.6,0.8C9,3.9,9.8,7.3,11.3,8 \
// 						c1.5,1.1,3.6-0.6,4.4-1.2c-0.2-0.7-0.1-1,0.1-1.2c0.2-0.2,0.6-0.2,0.8,0C17,5.7,17.1,6.2,17,6.4c-0.1,0.2-0.5,0.5-1,0.5 \
// 						c0,0-2.1,5.3-2.3,6c0,0.2-0.2,0.4-0.5,0.4H3.9c-0.2,0-0.4-0.1-0.5-0.4l-2.3-6C0.5,6.9,0.3,6.8,0,6.4c-0.1-0.4,0.1-0.7,0.4-0.8 \
// 						c0.1-0.1,0.6-0.2,0.8,0c0.4,0.2,0.4,0.6,0.1,1.1c0.8,0.7,3,2.1,4.1,1.5c1.2-0.5,2.8-4.7,2.9-5.2C8.3,2.6,7.9,2.7,7.8,2.1z \
// 						M13.5,13.6v1.1H3.5v-1.1H13.5z"/>-->\
// 				</svg>\
// 			</div></a>';
// }
//
// function htmlLikeSocials(row) {
//   return '<a href="' + row.link + '" target="_blank"><div class="like-person">\
//                 <span style="width: 20px;height: 19px; text-align: center; font-size: 15px;">' + row.value + '</span>\
// 				<figure class="like-person-avatar" title="">\
// 					<img src="/img/' + row.image + '" alt="user" class="" style="max-width: 100%;">\
// 				</figure>\
// 				<div class="name-status-holder flexcol">\
// 					<div class="user-nickname">' + row.name + '</div>\
// 				</div>\
// 				<svg class="user-favour svg-ico" data-userid="0" xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">\
// 				</svg>\
// 			</div></a>';
// }
//
//

//
//
// // $emailAttachmentBtn.upload({
// //   beforeSend: onBeforeSend,
// //   action: "/profile/post-attachment",
// //   postKey: "file",
// //   maxSize: 52428800, // 50mb
// //   postData: {type: "general", hash: userHash},
// //   label: ''
// // });
// //
// // function onBeforeSend(formData, file) {
// //   var fileName = file.name.toLowerCase();
// //   var fileNameSplitted = fileName.split(".");
// //   var fileEx = fileNameSplitted[fileNameSplitted.length - 1];
// //   var vid = '';
// //
// //   if (fileEx in videoFormats) {
// //     $(".picture-box .close-cross").trigger('touchstart');
// //     $('.pictures-holder .template').hide();
// //     vid = 'video';
// //   }
// //
// //   if (fileEx in videoFormats || fileEx in imageFormats) {
// //     var loaderHtml =
// //       '<div class="picture-box loader ' + vid + '">\
// //                        <div class="close-cross">\
// //                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12">\
// //                            <path fill="#FFF" d="M3.4 0l2.2 2.6c.6.7 1 1.3 1.5 2h.1c.5-.7 1-1.3 1.5-2L10.8 0h3L8.6 5.8 14 12h-3.2L8.6 9.3C8 8.6 7.5 7.9 7 7.2h-.1c-.5.7-1 1.4-1.6 2.1L3.1 12H0l5.4-6.1L.3 0h3.1z"></path>\
// //                          </svg>\
// //                        </div>\
// //                        <img src="/img/loader-bw.gif" data-width="0" data-height="0">\
// //                      </div>';
// //
// //     $('.pictures-holder').prepend(loaderHtml);
// //
// //     return formData;
// //   } else {
// //     return false
// //   }
// // };
// //
// // $emailAttachmentBtn.on("filecomplete", function (obj, file, res) {
// //   res = JSON.parse(res);
// //   // find file extension
// //   var filePath = res.frontPath;
// //   var fileNameSplitted = filePath.split(".");
// //   var fileEx = fileNameSplitted[fileNameSplitted.length - 1];
// //
// //   if (fileEx in imageFormats) {
// //     if ($('.picture-box.video').length !== 0) {
// //       $('.picture-box.loader:not(.video)').remove();
// //       dataSocket.emit('deleteRibbonImage', JSON.stringify({path: filePath}));
// //     } else {
// //       $('.picture-box.loader:first-of-type').removeClass('loader').find('img').attr('src', filePath).attr('data-width', res.width).attr('data-height', res.height);
// //     }
// //   }
// //
// //   // if it is video file - replace whole html
// //   if (fileEx in videoFormats) {
// //     var attachmentHtml =
// //       '<video class="vid" style="height: 100%; max-width:100%;" controls="">\
// //          <source src="' + filePath + '" type="video/' + fileEx + '">\
// //                         </video>';
// //
// //     $('.picture-box.loader').removeClass('loader').find('img').replaceWith(attachmentHtml);
// //   }
// // });
//
//
// $('.pictures-holder').on('click', '.close-cross', function (e) {
//   e.preventDefault();
//   if ($('.pictures-holder .picture-box').length === 1) {
//     $('.pictures-holder .template').show();
//   }
//   var src = $(this).parent('.picture-box').find('img').attr('src');
//
//   if (!src) {
//     src = $(this).parent('.picture-box').find('source').attr('src');
//   }
//   $(this).parent('.picture-box').animate({
//     width: 0,
//     height: 0,
//     opacity: 0
//   }, 200, function () {
//     this.remove();
//     dataSocket.emit('deleteRibbonImage', JSON.stringify({path: src}));
//   })
// });
//

//
//
// dataSocket.off('addRibbonPost').on('addRibbonPost', function (data) {
//   var data = JSON.parse(data);
//   if (data.result === 'success') {
//     var postData = {};
//     var postImgArray = [];
//     var postWidthArray = [];
//     var postHeightArray = [];
//     var ribbonVideo = $('.picture-box video source').attr('src');
//
//     $('.picture-box img').each(
//       function (index) {
//         postImgArray.push($(this).attr('src'));
//         postWidthArray.push($(this).attr('data-width'));
//         postHeightArray.push($(this).attr('data-height'));
//       }
//     );
//
//     postData.ribbonDate = 'online';
//     postData.ribbonVideo = ribbonVideo ? ribbonVideo : null;
//     postData.photo = postImgArray.join().length > 0 ? postImgArray.join() : null;
//     postData.photoWidth = postWidthArray.join().length > 0 ? postWidthArray.join() : null;
//     postData.photoHeight = postHeightArray.join().length > 0 ? postHeightArray.join() : null;
//     postData.mylike = null;
//     postData.claim = null;
//     postData.ribbonId = data.ribbonId;
//     postData.userId = data.userId;
//     postData.like = 0;
//     postData.ribbonText = correctPostTextBeforeSend($('.writepost__input').html()).text;
//     postData.userPhoto = $('.header-profile-info .user-avatar img').attr('src');
//     postData.userName = $('.header-profile-info .header-profile-name .nickname').text();
//
//     if (data.status === 'add') {
//       $(".photos-wrapper").prepend(ribbonData(postData));
//     } else if (data.status === 'update') {
//       $('.photos-wrapper .single-photo[data-ribbonid="' + data.ribbonId + '"]').replaceWith(ribbonData(postData));
//     }
//
//     $('.pictures-holder').find('.picture-box').remove();
//     $('.pictures-holder .template').show();
//
//     hideFullWritepost();
//   }
// });
//
// // POST

//
// dataSocket.on('deleteRibbonPost', function () {
//   postData.obj.animate({
//     width: 0,
//     height: 0,
//     opacity: 0
//   }, 200, function () {
//     this.remove();
//   });
// });
//

//

//
// // add/remove post claim
// $(".claim-post-modal .claim-user").on("click", function (e) {
//   e.preventDefault();
//   dataSocket.emit('claimRibbonPost', JSON.stringify({hash: userHash, ribbonId: postData.ribbonId}));
// });
//
// dataSocket.on('claimRibbonPost', function (data) {
//   postData.claim = !postData.claim;
//   postData.obj.data("claim", postData.claim);
//   $(".claim-post-modal .claim-user").toggle();
// });
//
// $(".claim-post-bg").on("click", function (e) {
//   e.preventDefault();
//   $(".claim-post-modal-wrapper, .claim-post-modal, .claim-post-popup").hide();
// });
//
//
// //share
// var recentImage = '';
// $(".photos-wrapper").on("click", ".share", function (e) {
//   e.preventDefault();
//   recentImage = $(this).parents(".single-photo");
//   $(".share-post-wrapper").find(".share-btn").off().on("click", function (e) {
//     e.preventDefault();
//     var postData = {
//       postSocialsArray: []
//     };
//     $(".share-post-wrapper, .share-post-modal, .post-share").hide();
//     var hasImages = recentImage.find(".profile-img").length > 0;
//     var hasVideo = recentImage.find('video source').attr('src');
//     var hasLink = recentImage.find('.post-content').attr('href');
//
//     var postText = recentImage.find(".post-text").text();
//     if (postText.length > 0 && !hasLink) {
//       postText = correctHashTagsOnEdit(postText);
//       postText = correctPostTextBeforeSend(postText).text;
//       postData.status = postText;
//     } else if (hasLink) {
//       postText = recentImage.find("h3.title").contents().filter(function () {
//         return this.nodeType == 3;
//       }).text();
//
//       postText = correctHashTagsOnEdit(postText);
//       postText = correctPostTextBeforeSend(postText).text;
//       if ((postText.length + hasLink.length + 4) < 280) {
//         postData.status = postText + "... " + hasLink;
//       } else {
//         postData.status = postText.slice(0, (280 - hasLink.length - 4)) + "... " + hasLink;
//       }
//     }
//     if (hasVideo) {
//       postData.postVideo = hasVideo;
//     }
//     if (hasImages) {
//       var imgArr = [];
//       recentImage.find(".profile-img").each(function (index, img) {
//         imgArr.push($(img).attr("src"));
//       });
//       postData.imgArr = imgArr;
//     }
//     postData.shareType = hasLink ? 'news' : 'post';
//     $(".share-post-wrapper").find('.menu-item.share-item:not(.no-active) input[type="checkbox"]').each(function () {
//       if ($(this).is(':checked')) {
//         if (!(!(hasImages || hasVideo) && $(this).attr("name") === 'instagram')) {
//           postData.postSocialsArray.push($(this).attr("name"))
//         }
//       }
//     });
//     if (postData.postSocialsArray.length > 0) {
//       dataSocket.emit('shareSocialPost', JSON.stringify({hash: userHash, postData: postData}));
//     }
//   });
//   $(".share-post-wrapper, .share-post-modal, .post-share").toggle();
// });
// $(".share-post-bg").on("click", function (e) {
//   e.preventDefault();
//   $(".share-post-wrapper, .share-post-modal, .post-share").hide();
// });
//
//
// dataSocket.off('facebookSharePost').on('facebookSharePost', function (data) {
//   data = JSON.parse(data);
//   if (data.error) {
//     window.location.href = data.error;
//   } else {
//     showNotify("success", 'Поширено в Facebook');
//   }
// });
// dataSocket.off('twitterSharePost').on('twitterSharePost', function (data) {
//   data = JSON.parse(data);
//   if (data.error) {
//     window.location.href = data.error;
//   } else if (data.vid_error) {
//     showNotify("danger", 'Формат не підтримується Twitter або файл більше 15мб');
//   } else {
//     showNotify("success", 'Поширено в Twitter');
//   }
// });
// dataSocket.off('instagramSharePost').on('instagramSharePost', function (data) {
//   data = JSON.parse(data);
//   if (data.message === "error") {
//     openPromotionPopup("pages/instagram-login.html", "Instagram");
//   } else if (data.message === "success") {
//     showNotify("success", 'Поширено в Instagram');
//   }
// });
//
// dataSocket.off('checkInstagramLoginData').on('checkInstagramLoginData', function (data) {
//   data = JSON.parse(data);
//   if (data.message === "finalized") {
//     showNotify("success", 'Loged into Instagram');
//   }
// });
//
// dataSocket.emit('checkSocialKeys', JSON.stringify({hash: userHash, keysList: ['all']}));
// dataSocket.off('checkSocialKeys').on('checkSocialKeys', function (data) {
//   data = JSON.parse(data);
//   var checkActions = {
//     'facebook': 'fb',
//     'twitter': 'twit',
//     'instagram': 'inst'
//   };
//   for (var i in data.status) {
//     if (data.status[i] === 'success') {
//       $(".share-post-wrapper").find("." + checkActions[i] + "-share").removeClass("no-active");
//     }
//   }
// });
//
// $('.post-type').change(function (event) {
//   if ($(this).val() === 'Стрiчка')
//     $('.hide-for-ribbon').addClass('hidden');
//   if ($(this).val() === 'Маркет')
//     $('.hide-for-ribbon').removeClass('hidden');
// });
//
//
// $("#croppic-modal").on('click', function (e) {
//   e.preventDefault();
// });
//
// $(".make-main-option").on("click", function () {
//   $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();
//   $(".claim-post-modal-wrapper, .claim-post-modal, .claim-post-popup").hide();
//
//
//   // https://github.com/acornejo/jquery-cropbox
//   var croppicContainerPreloadOptions = {
//     uploadUrl: '/profile/upload-image',
//     cropUrl: '/profile/cropimage',
//     loadPicture: currentImage,
//     enableMousescroll: true,
//     doubleZoomControls: true,
//     rotateControls: false,
//     loaderHtml: '<div class="loader bubblingG"><span id="bubblingG_1"></span><span id="bubblingG_2"></span><span id="bubblingG_3"></span></div> ',
//     onReset: function () {
//       $(".modal-wrapper").hide();
//     },
//     onAfterImgCrop: function (result) {
//       $(".modal-wrapper").hide();
//       $(".user-avatar img").attr("src", result.url);
//     },
//     onError: function (errormessage) {
//       console.log('onError:' + errormessage);
//     }
//   }
//   var cropContainerPreload = new Croppic('croppic-modal', croppicContainerPreloadOptions);
//   $(".modal-wrapper").show();
// });
//
// function ribbonData(data) {
//   var active = '', protoRow = '', pubTime, imageGalleryWidth, imageGalleryHeight, imageGalleryNumber = '';
//   var date = data.ribbonDate;
//   data.ribbonText = correctPostTextBeforeShow(data.ribbonText);
//
//   if (data.photo != null) {
//     var photo = data.photo.split(',');
//     // var photoWidth = data.photoWidth.split(',');
//     // var photoHeight = data.photoHeight.split(',');
//     if (photo.length > 2) {
//       imageGalleryWidth = 'w30';
//       imageGalleryHeight = 'h150';
//     } else if (photo.length === 2) {
//       imageGalleryWidth = 'w45';
//       imageGalleryHeight = 'h200';
//     } else if (photo.length === 1) {
//       imageGalleryWidth = 'w90';
//       imageGalleryHeight = 'h300';
//     }
//
//     for (var i = 0; i < photo.length; i++) {
//       if (photo.length > 1) {
//         imageGalleryNumber = 'data-number="' + (i + 1) + '"'
//       }
//       protoRow += '<img class="profile-img ' + imageGalleryWidth + ' ' + imageGalleryHeight + '" ' + imageGalleryNumber + ' src="' + photo[i] + '" alt="photo" >'
//     }
//     // for (var i = 0; i < photo.length; i++) {
//     //   if (photo.length > 1) {
//     //     imageGalleryNumber = 'data-number="' + (i + 1) + '"'
//     //   }
//     //   protoRow += '<img class="profile-img ' + imageGalleryWidth + ' ' + imageGalleryHeight + '" ' + imageGalleryNumber + ' src="' + photo[i] + '" data-width="' + photoWidth[i] + '" data-height="' + photoHeight[i] + '" alt="photo" >'
//     // }
//   } else if (data.ribbonVideo != null) {
//     var filePath = data.ribbonVideo;
//     var fileNameSplitted = filePath.split(".");
//     var fileEx = fileNameSplitted[fileNameSplitted.length - 1];
//     var videoThumb = data.ribbonVideoThumb;
//
//     protoRow =
//       '<video class="vid" data-thumb="' + videoThumb + '" style="width:100%;" controls="">\
//                <source src="' + filePath + '" type="video/' + fileEx + '">\
//              </video>';
//   }
//   if (data.mylike != null) {
//     active = 'active'
//   }
//   if (data.claim != null) {
//     data.claim = 1
//   } else {
//     data.claim = 0
//   }
//   if (!/offline/.test(date) && !/online/.test(date)) {
//     pubTime = data.ribbonDate
//   } else if (/online/.test(date)) {
//     pubTime = 'Just now'
//   } else {
//     pubTime = 'Far far far...'
//   }
//   return '<div class="single-photo" data-profileid="' + data.userId + '" data-ribbonid="' + data.ribbonId + '" data-claim="' + data.claim + '" data-avatar="' + (data.photo != null) + '">\
//                 <a href="/profile/' + data.userId + '" class="main-info">\
//                     <div class="avatar-holder">\
//                         <div class="user-avatar" title="">\
//                             <img src="' + data.userPhoto + '" alt="user" style="max-width: 100%;">\
//                         </div>\
//                     </div>\
//                     <div class="info-holder">\
//                         <div class="main-info-row">\
//                             <div class="name">' + data.userName + '</div>\
//                         </div>\
//                         <div class="settings-dots delete-my">\
//                             <div class="settings-dot"></div>\
//                             <div class="settings-dot"></div>\
//                             <div class="settings-dot"></div>\
//                         </div>\
//                         <div class="publish-date">' + pubTime + '</div>\
//                     </div>\
//                 </a>\
//                 <div class="post-text">' + data.ribbonText + '</div>'
//     + protoRow +
//     '<div class="photo-info">\
//          <div class="like ' + active + '">\
//                         <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 17 16">\
//                             <path fill="#313133" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
//                         4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
//                         3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
//                         </svg>\
//                         <div class="like-amount">' + data.like + '</div>\
//                     </div>\
//                     <div class="likes-wrap">\
//                         <div class="likes-arrow tt"></div>\
//                     </div>\
//                 </div>\
//                 <div class="who-likes">\
//                     <div style="text-align: center; padding: 5px; border-bottom: 1px solid #ccc;">No one liked yet</div>\
//                     <!--like-person-->\
//                 </div>\
//                 <div class="photo-options">\
//                     <div class="like ' + active + '">\
//                         <svg xmlns="http://www.w3.org/2000/svg" width="30" height="29" viewBox="-1 0 20 16">\
//                             <path fill="none" stroke="#313133" stroke-miterlimit="10" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
//                         4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
//                         3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
//                         </svg>\
//                         Like\
//                     </div>\
//                 </div>\
//             </div>';
// }
//
// function correctPostTextBeforeShow(text) {
//   var hashTagsMatch = text.match(/#[a-zA-Zа-яА-Я0-9]+[^+#,=\s]/img);
//   if (hashTagsMatch !== null) {
//     for (var i = 0; i < hashTagsMatch.length; i++) {
//       text = text.replace(hashTagsMatch[i], '<a class="htl" target="_blank" href="/hashtag-search/' + hashTagsMatch[i].substr(1) + '"><s>#</s><b>' + hashTagsMatch[i].substr(1) + '</b></a>');
//     }
//   }
//
//   return text
// }
//
// function correctHashTagsOnEdit(text) {
//   var hashTagsLinkMatch = text.match(/<a class="htl".*?tag=(.*?)".*?<\/a>/im);
//   while (hashTagsLinkMatch !== null) {
//     if (hashTagsLinkMatch !== null) {
//       text = text.replace(hashTagsLinkMatch[0], '#' + hashTagsLinkMatch[1]);
//     }
//     hashTagsLinkMatch = text.match(/<a class="htl".*?tag=(.*?)".*?<\/a>/im);
//   }
//
//   return text
// }
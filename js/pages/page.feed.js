/**
 * Created by Creator on 10.07.2017.
 */
var pageFeed = {
  socket: {},
  userHash: false,
  recentImage: false,
  recentNews: false,
  currentPost: {
    ribbonId: false
  },
  videoFormats: {
    'mov': true,
    'mpeg4': true,
    'mp4': true,
    'avi': true,
    'wmv': true,
    'mpegps': true,
    'flv': true,
    '3gpp': true,
    'webm': true
  },

  imageFormats: {
    'jpg': true,
    'png': true,
    'jpeg': true
  },

  init: function (socket) {
    var self = this;

    self.userHash = user.hash;


    self.socket = socket;

    self.initSocketHandlers();
    self.initHandlers();
    $(".writepost .user-avatar img").attr('src', $("#authorized-user .user-avatar img").attr('src'));
  },
  oneFeedInit: function (data) {
    var self = this;
    self.socket = data.socket;
    self.userHash = user.hash;
    $('.writepost').remove();

    self.socket.emit('getOnePost', JSON.stringify({hash: self.userHash, ribbonId: data.postId}));
    self.socket.on('getOnePost', function (data) {
      data = JSON.parse(data);

      var myRibbonHTML = '';

      for (var i = 0; i < data.length; i++) {
        if (data[i].type === 'post') {
          myRibbonHTML += self.ribbonData(data[i])
        } else if (data[i].type === 'news' && data[i].newsImg.match(/\.png|\.jpe?g/i)) {
          myRibbonHTML += self.postNewsData(data[i])
        }
      }

      $(".feed .feed-wrapper").html(myRibbonHTML);

      var $mainHandlersTarget = $(".feed-wrapper");
      $mainHandlersTarget.off('click');
      self.initFeedGallery($mainHandlersTarget);

      // self.postOptionsInit();
      self.initMyPostDelete($mainHandlersTarget);
      $(".option.edit-my").remove();
      self.initIdPostClaim($mainHandlersTarget);
      self.initPostShare($mainHandlersTarget);
      self.initSocialLoginCheck();
      self.initDetailedLikesInfo($mainHandlersTarget);


      $(".feed .feed-wrapper .post").each(function () {
        fadeMenu($(this).find('.settings-dots'), $(this).find('.post-menu'));
      });

      // клик по лайку
      $(".feed").off("click").on("click", ".post[data-ribbonid] .postaction .like", function () {
        self.recentImage = $(this).parents(".post");
        var data = {
          hash: user.hash,
          profileId: self.recentImage.data("userid"),
          ribbonId: self.recentImage.data("ribbonid")
        };
        self.socket.emit('updateUserPostLike', JSON.stringify(data));
        self.socket.emit('getUserPostLike', JSON.stringify(data));
      })
    });

  },
  hashTagSearchInit: function (data) {
    var self = this;
    self.socket = data.socket;
    self.userHash = user.hash;
    $('.writepost').remove();

    self.socket.emit('getPostsByHashTag', JSON.stringify({hash: self.userHash, tagName: data.tagName}));
    self.socket.on('getPostsByHashTag', function (data) {
      data = JSON.parse(data);

      var myRibbonHTML = '';

      for (var i = 0; i < data.length; i++) {
        myRibbonHTML += self.ribbonData(data[i])
      }

      $(".feed .feed-wrapper").html(myRibbonHTML);

      var $mainHandlersTarget = $(".feed-wrapper");
      $mainHandlersTarget.off('click');
      self.initFeedGallery($mainHandlersTarget);

      // self.postOptionsInit();
      self.initMyPostDelete($mainHandlersTarget);
      $(".option.edit-my").remove();
      self.initIdPostClaim($mainHandlersTarget);
      self.initPostShare($mainHandlersTarget);
      self.initSocialLoginCheck();
      self.initDetailedLikesInfo($mainHandlersTarget);


      $(".feed .feed-wrapper .post").each(function () {
        fadeMenu($(this).find('.settings-dots'), $(this).find('.post-menu'));
      });

      // клик по лайку
      $(".feed").off("click").on("click", ".post[data-ribbonid] .postaction .like", function () {
        self.recentImage = $(this).parents(".post");
        var data = {
          hash: user.hash,
          profileId: self.recentImage.data("userid"),
          ribbonId: self.recentImage.data("ribbonid")
        };
        self.socket.emit('updateUserPostLike', JSON.stringify(data));
        self.socket.emit('getUserPostLike', JSON.stringify(data));
      });
    });

  },

  initSocketHandlers () {
    var self = this;

    self.socket.emit('getMyRibbon', JSON.stringify({hash: self.userHash}));

    self.socket.on('myRibbon', function (data) {
      data = JSON.parse(data);

      var myRibbonHTML = '';

      for (var i = 0; i < data.length; i++) {
        if (data[i].type === 'post') {
          myRibbonHTML += self.ribbonData(data[i])
        } else if (data[i].type === 'news' && data[i].newsImg.match(/\.png|\.jpe?g/i)) {
          myRibbonHTML += self.postNewsData(data[i])
        }
      }

      $(".feed .feed-wrapper").html(myRibbonHTML);

      var $mainHandlersTarget = $(".feed-wrapper");
      $mainHandlersTarget.off('click');
      self.initFeedGallery($mainHandlersTarget);

      // self.postOptionsInit();
      self.initMyPostDelete($mainHandlersTarget);
      self.initMyPostEdit($mainHandlersTarget);
      self.initPostImageToAvatar($mainHandlersTarget);
      self.initIdPostClaim($mainHandlersTarget);
      self.initPostShare($mainHandlersTarget);
      self.initSocialLoginCheck();
      self.initDetailedLikesInfo($mainHandlersTarget);


      $(".feed .feed-wrapper .post").each(function () {
        fadeMenu($(this).find('.settings-dots'), $(this).find('.post-menu'));
      })
    });

    self.socket.off('deleteRibbonImage').on('deleteRibbonImage', function (data) {
      showNotify('success', 'Файл видалено')
    });

    self.socket.off('addRibbonPost').on('addRibbonPost', function (data) {
      var data = JSON.parse(data);
      if (data.result === 'success') {
        var postData = {};
        var postImgArray = [];
        var postWidthArray = [];
        var postHeightArray = [];
        var ribbonVideo = $('.picture-box video source').attr('src');
        var ribbonVideoThumb = $('.picture-box video').attr('data-thumb');

        $('.picture-box img').each(
          function (index) {
            postImgArray.push($(this).attr('src'));
            postWidthArray.push($(this).attr('data-width'));
            postHeightArray.push($(this).attr('data-height'));
          }
        );


        postData.ribbonDate = 'online';
        postData.ribbonVideo = ribbonVideo ? ribbonVideo : null;
        postData.ribbonVideoThumb = ribbonVideoThumb ? ribbonVideoThumb : null;
        postData.ribbonDogLinks = data.postData.dogLinksArr ? data.postData.dogLinksArr.join() : null;
        postData.ribbonPhoto = postImgArray.join().length > 0 ? postImgArray.join() : null;
        postData.ribbonPhotoWidth = postWidthArray.join().length > 0 ? postWidthArray.join() : null;
        postData.ribbonPhotoHeight = postHeightArray.join().length > 0 ? postHeightArray.join() : null;
        postData.mylike = null;
        postData.claim = null;
        postData.ribbonId = data.ribbonId;
        postData.userId = data.userId;
        postData.like = 0;
        postData.ribbonText = self.correctPostTextBeforeSend($('.writepost__input').html()).text;
        postData.userPhoto = $('#authorized-user .user-avatar img').attr('src');
        postData.userName = $('#authorized-user .profile-name').text().substr(1);

        if (data.status === 'add') {
          $(".feed-wrapper").prepend(pageFeed.ribbonData(postData));
          showNotify(data.result, 'Додано');
          fadeMenu($(".feed-wrapper .post:first-of-type").find('.settings-dots'), $(".feed-wrapper .post:first-of-type").find('.post-menu'));
        } else if (data.status === 'update') {
          $('.feed-wrapper .post[data-ribbonid="' + data.ribbonId + '"]').replaceWith(pageFeed.ribbonData(postData));
          showNotify(data.result, 'Відредаговано');
          fadeMenu($('.post[data-ribbonid="' + data.ribbonId + '"]').find('.settings-dots'), $('.post[data-ribbonid="' + data.ribbonId + '"]').find('.post-menu'));
        }


        $('.pictures-holder').find('.picture-box').remove();
        $('.pictures-holder .template').show();
        $('.writepost__input').html('');
        $('.writepost .cancel-post').click();
      } else if (data.result === 'error') {
        showNotify(data.result, 'Помилка додавання');
      }
    });

    SOCKET.off('updateUserNewsPostLike').on('updateUserNewsPostLike', function (data) {
      var $targetImage = self.recentNews;
      var n = parseInt($targetImage.find(".postinfo .likes").text());

      if (data.action == "add") {
        n += 1;
      }
      else if (data.action == "remove") {
        n -= 1;
      }
      $targetImage.find(".postinfo .likes").text(n);
      $targetImage.find(".postinfo .like, .postaction .like").toggleClass("active");
    });

  },
  initHandlers() {
    var self = this;

    // клик по лайку
    $(".feed").off("click").on("click", ".post[data-ribbonid] .postaction .like", function () {
      self.recentImage = $(this).parents(".post");
      var data = {
        hash: user.hash,
        profileId: self.recentImage.data("userid"),
        ribbonId: self.recentImage.data("ribbonid")
      };
      self.socket.emit('updateUserPostLike', JSON.stringify(data));
      self.socket.emit('getUserPostLike', JSON.stringify(data));
    }).on("click", ".post[data-postid] .postaction .like", function () {
      self.recentNews = $(this).parents(".post");
      var data = {
        hash: user.hash,
        postId: $(this).parents(".post").data("postid")
      };
      self.socket.emit('updateUserNewsPostLike', JSON.stringify(data));
      self.socket.emit('getUserNewsPostLike', JSON.stringify(data));
    });

    // show instagram login modal
    $('.insta-login').click(function (){
      if($(this)[0].hasAttribute("data-show-modal")){
        openPromotionPopup("pages/instagram-login.html", "Instagram");
      }
    });

    self.initWritePostHandlers();
    self.initPostPhotoUpload();
    self.initPosthotoDelete();
    self.initSavePost();
  },
  initFeedGallery: function ($wrapper) {
    var self = this;
    var $zoomBody = $("#zoomBody");
    var profileId;
    $zoomBody.off('click');

    // клик по фото
    $wrapper.on('click', '.post[data-ribbonid] .postcontent__media img', function () {
      var ribbonId = $(this).parents(".single-photo").data("ribbonid");
      profileId = $(this).parents(".single-photo").data("userid");
      self.recentImage = $(this).parents(".post");
      updateLikeList(ribbonId);

      $zoomBody.find(".big-img-like-wrapper").data("imageid", ribbonId);

      var source = $(this).attr("src");
      var position = $(this).attr("data-number");
      var totalImages = self.recentImage.find(".postcontent__media img").length;

      $zoomBody.find(".img-control-wrapper img").attr("src", source);

      if (position) {
        $zoomBody.find(".photo-number").show();
        $zoomBody.find(".prev").show();
        $zoomBody.find(".next").show();
        $zoomBody.find(".current-photo-number").html(position);
      } else {
        $zoomBody.find(".photo-number").hide();
        $zoomBody.find(".prev").hide();
        $zoomBody.find(".next").hide();
      }

      $zoomBody.find(".total-photos").html(totalImages);

      showFlipModal(".flipper.img-zoom-flip");
    });


    // предыдущее фото
    $zoomBody.on('click', ".prev", function () {
      var $currentImage = $zoomBody.find(".img-control-wrapper img");
      var currentImageLink = $currentImage.attr("src");
      var $galleryImg = self.recentImage.find("img[src='" + currentImageLink + "']");
      var $prevTarget = $galleryImg.prev();
      if ($prevTarget.length == 0)
        $prevTarget = $galleryImg.parent(".postcontent__media").find(".postimg").last();

      var ribbonId = self.recentImage.data("ribbonid");
      //updateLikeList(ribbonId);
      $zoomBody.find(".big-img-like-wrapper").data("imageid", ribbonId);

      $currentImage.attr("src", $prevTarget.attr("src"));
      $zoomBody.find(".current-photo-number").html($prevTarget.data("number"));
      setTimeout(resizeModal(".flipper.img-zoom-flip"), 100);
    });
    // следующее фото
    $zoomBody.on('click', ".next", function () {
      var $currentImage = $zoomBody.find(".img-control-wrapper img");
      var currentImageLink = $currentImage.attr("src");
      var $galleryImg = self.recentImage.find("img[src='" + currentImageLink + "']");
      var $nextTarget = $galleryImg.next();

      if ($nextTarget.length == 0)
        $nextTarget = $galleryImg.parent(".postcontent__media").find(".postimg").first();

      var ribbonId = self.recentImage.data("ribbonid");
      //updateLikeList(ribbonId);
      $zoomBody.find(".big-img-like-wrapper").data("imageid", ribbonId);

      $currentImage.attr("src", $nextTarget.attr("src"));
      $zoomBody.find(".current-photo-number").html($nextTarget.data("number"));
      setTimeout(resizeModal(".flipper.img-zoom-flip"), 100);
    });


    ///////////////////////////////
    //			ЛАЙКИ			 //
    ///////////////////////////////
    //TODO REWRITE FOR TRIGGERING EVENT postlike

    // получить список лайков при открытии галереи
    function updateLikeList(ribbonId) {
      $zoomBody.find(".like-person").remove();
      SOCKET.emit('getUserPostLike', JSON.stringify({hash: user.hash, profileId: profileId, ribbonId: ribbonId}));
    }

    SOCKET.off('getUserPostLike').on('getUserPostLike', function (data) {
      var html = "";
      var isLiked = false;

      data.likes.forEach(function (row) {
        if (row.my)
          isLiked = true;
        html += self.htmlLikePerson(row);
      });
      if (html) {
        $zoomBody.find(".img-like-info").append(html);

      }

      if (isLiked) {
        $zoomBody.find(".big-img-liked").addClass("is-liked");
        $zoomBody.find(".like-heart").removeClass("empty");
      }
      else {
        $zoomBody.find(".big-img-liked").removeClass("is-liked");
        $zoomBody.find(".like-heart").addClass("empty");
      }

      $zoomBody.find(".img-like-info .likes-amount").text(data.likes.length);
    });

    // клик по лайку
    $zoomBody.on('click', ".big-img-like-wrapper, .total-image-likes", function () {
      $zoomBody.find(".big-img-liked").toggleClass("is-liked");
      $zoomBody.find(".like-heart").toggleClass("empty");
      var s_data = {
        hash: user.hash,
        profileId: profileId,
        ribbonId: $zoomBody.find(".big-img-like-wrapper").data("imageid")
      };
      SOCKET.emit('updateUserPostLike', JSON.stringify(s_data));
      SOCKET.emit('getUserPostLike', JSON.stringify(s_data));
    });

    SOCKET.off('updateUserPostLike').on('updateUserPostLike', function (data) {
      var $targetImage = self.recentImage;
      var n = parseInt($targetImage.find(".postinfo .likes").text());

      if (data.action == "add") {
        var html = self.htmlLikePerson(data.item);
        $zoomBody.find(".total-image-likes").after(html);//to gallery
        $targetImage.find('.who-likes').append(html);//to detailed tile preview
        n += 1;
      }
      else if (data.action == "remove") {
        $zoomBody.find(".like-person.my").remove();//from gallery
        $targetImage.find(".like-person.my").remove();//from detailed tile preview
        n -= 1;
      }

      $zoomBody.find(".img-like-info .likes-amount").text(n);//to gallery
      $targetImage.find(".postinfo .likes").text(n);//to detailed tile preview
      $targetImage.find(".postinfo .like, .postaction .like").toggleClass("active");
    });
  },
  updateHeartOpacity: function (o) {
    var self = this;
    var $zoomBody = $("#zoomBody");

    var heartHeight = $zoomBody.find(".big-img-like-wrapper").height();
    var heartWidth = $zoomBody.find(".big-img-like-wrapper").width();
    var heartOffset = $zoomBody.find(".big-img-like-wrapper").offset();
    var t = [heartWidth, heartHeight],
      r = [heartOffset.left, heartOffset.top];
    r[0] += t[0] / 2;
    r[1] += t[1] / 2;
    var a = Math.sqrt((r[0] - o.pageX) * (r[0] - o.pageX) + (r[1] - o.pageY) * (r[1] - o.pageY)), i = 150, p = 0;
    i > a && (p = .3 + (1 - a / i));
    p = Math.min(1, Math.max(0, p));
    $zoomBody.find(".big-img-like-wrapper").css("opacity", p);
  },
  ribbonData: function (data) {
    var self = this;

    var active = '', protoRow = '', pubTime, imageGalleryWidth, imageGalleryHeight, imageGalleryNumber = '',
      settingsMenu = '', toAvatar = '';
    var date = data.ribbonDate;
    data.ribbonText = self.correctPostTextBeforeShow(data);
    if (data.ribbonPhoto != null) {
      var ribbonPhoto = data.ribbonPhoto.split(',');
      var ribbonPhotoWidth = data.ribbonPhotoWidth.split(',');
      var ribbonPhotoHeight = data.ribbonPhotoHeight.split(',');
      if (ribbonPhoto.length > 2) {
        imageGalleryWidth = 'w30';
        imageGalleryHeight = 'h150';
      } else if (ribbonPhoto.length === 2) {
        imageGalleryWidth = 'w45';
        imageGalleryHeight = 'h200';
      } else if (ribbonPhoto.length === 1) {
        imageGalleryWidth = 'w90';
        imageGalleryHeight = 'h300';
      }
      for (var i = 0; i < ribbonPhoto.length; i++) {
        if (ribbonPhoto.length > 1) {
          imageGalleryNumber = 'data-number="' + (i + 1) + '"'
        }
        protoRow += '<img src="' + ribbonPhoto[i] + '"  class="postimg ' + imageGalleryWidth + ' ' + imageGalleryHeight + '" ' + imageGalleryNumber + ' data-width="' + ribbonPhotoWidth[i] + '" data-height="' + ribbonPhotoHeight[i] + '">'
      }
      toAvatar = '<li class="option to-main-photo"><div>Зробити аватаркою</div></li>';
    } else if (data.ribbonVideo != null) {
      var filePath = data.ribbonVideo;
      var fileNameSplitted = filePath.split(".");
      var fileEx = fileNameSplitted[fileNameSplitted.length - 1];

      protoRow =
        '<video class="vid" data-thumb="' + data.ribbonVideoThumb + '" style="height: 300px; max-width:90%;" controls="">\
                   <source src="' + filePath + '" type="video/' + fileEx + '">\
                 </video>';
    }
    if (data.mylike != null) {
      active = 'active'
    }
    if (data.claim != null) {
      data.claim = 1
    } else {
      data.claim = 0
    }
    if (!/offline/.test(date) && !/online/.test(date)) {
      pubTime = data.ribbonDate
    } else if (/online/.test(date)) {
      pubTime = 'Щойно'
    } else {
      pubTime = 'Дуже давно'
    }
    if (user.info.userId === data.userId) {
      settingsMenu = '<ul class="post-menu">' +
        '<li class="option edit-my"><div>Редагувати</div></li>' +
        '<li class="option delete-my"><div>Видалити</div></li>' +
        toAvatar +
        '</ul>';
    } else {
      settingsMenu = '<ul class="post-menu">' +
        '<li class="option claim-other"><div>Поскаржитись</div></li>' +
        toAvatar +
        '</ul>'
    }
    return '<div class="post single-photo" data-ribbonid="' + data.ribbonId + '" data-claim="' + data.claim + '" data-userid="' + data.userId + '">\
                    <a href="/#page=profile&id=' + data.userId + '" class="postheader">\
                            <div class="user-avatar" title="">\
                                <img src="' + data.userPhoto + '" alt="user" style="max-width: 100%;">\
                            </div>\
                        <div class="postheader__name">@' + data.userName + '</div>\
                    <span class="postheader__time">' + pubTime + '</span>\
							<div class="settings-dots">\
								<div class="settings-dot"></div>\
								<div class="settings-dot"></div>\
								<div class="settings-dot"></div>\
							</div>'
      + settingsMenu +
      '</a>\
      <div class="postcontent">\
          <div class="postcontent__text">' + data.ribbonText + '</div>\
                        <div class="postcontent__media">' + protoRow + '</div>\
                    </div>\
                    <div class="postinfo">\
                <div class="like ' + active + '">\
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 17 16">\
									<path fill="#313133" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
								4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
								3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
								</svg>\
								<div class="likes">'
      + data.like +
      '</div> вподобань\
  </div>\
  <div class="likes-wrap">\
      <div class="likes-arrow tt"></div>\
      </div>\
</div>\
<div class="who-likes">\
  <div style="text-align: center; padding: 5px;">Поки що нікому не сподобалось</div>\
</div>\
<div class="postaction">\
  <div class="postaction__like">\
                  <div class="like ' + active + '">\
								<svg xmlns="http://www.w3.org/2000/svg" width="30" height="29" viewBox="-1 0 20 16">\
									<path fill="none" stroke="#313133" stroke-miterlimit="10" stroke-width="1.5" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
								4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
								3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
								</svg>\
								Подобається\
					</div>\
					</div>\
					<div class="share">\
            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="26"\
        viewBox="0 0 17.151 14.559">\
            <path d="M.662,9.493c-.011.03-.021.056-.032.086-.035.084-.067.168-.1.254-.071.19-.136.381-.19.572a7.773,7.773,0,0,0-.3,3.013l.17,1.142.618-.974a8.978,8.978,0,0,1,8.615-4.02v3.868l2.091-1.8,1.068-.92.654-.563L17,6.926l.153-.149-.011-.415L9.441,0V3.907h0c-.17,0-.335,0-.507.01A9.268,9.268,0,0,0,1.075,8.634Z"\
        fill="none" stroke="#313133" stroke-miterlimit="10" stroke-width="0.8"/>\
            </svg>\
            Поширити\
            </div>\
                </div>\
            </div>';
  },
  postNewsData: function (data) {
    var active = '',
      pubTime,
      feedImg = data.feedImageBig != '' ? data.feedImageBig : data.feedImage,
      date = data.newsTimePublic;

    if (data.mylike != null) {
      active = 'active'
    }
    if (!/offline/.test(date) && !/online/.test(date)) {
      pubTime = data.newsTimePublic
    } else if (/online/.test(date)) {
      pubTime = 'Щойно'
    } else {
      pubTime = 'Дуже давно'
    }
    return '<div class="post single-photo news" ' +
      'data-postid="' + data.urlId + '" ' +
      'data-fblikes="' + ((data.fbLikes > 0) ? data.fbLikes : 0) + '" ' +
      'data-vklikes="' + ((data.vklikes > 0) ? data.vklikes : 0) + '" ' +
      'data-glikes="' + ((data.gLikes > 0) ? data.gLikes : 0) + '" ' +
      'data-oklikes="' + ((data.okLikes > 0) ? data.okLikes : 0) + '" ' +
      'data-mslikes="' + ((data.msLikes > 0) ? data.msLikes : 0) + '" >\
                    <div class="postheader">\
                            <div class="user-avatar" title="">\
                                <img src="/media/feeds/' + feedImg + '" alt="user" style="max-width: 100%;">\
                            </div>\
                        <div class="postheader__name">' + data.feedTitle + '</div>\
                        <span class="postheader__time">' + pubTime + '</span>\
                    </div>\
                    <a style="display: block" href="' + data.newsUrl + '" target="_blank" class="postcontent">\
                        <div class="postcontent__media">\
                            <img src="' + data.newsImg + '"  class="postimg" style="max-width: 100%;min-width: 100%;">\
                        </div>\
                        <div class="postcontent__text">' + data.newsHeader + '\
                            <br> <span class="url-content">' + data.feedTitle + '</span>\
                        </div>\
                    </a>\
                    <div class="postinfo">\
                <div class="like ' + active + '">\
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 17 16">\
									<path fill="#313133" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
								4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
								3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
								</svg>\
								<div class="likes">'
      + data.totalLikes +
      '</div>\
      <div class="likes-wrap">\
<div class="likes-arrow tt"></div>\
</div>\
  </div>' +
      '<!--<div class="social-block tooltip-viewed">\
          <svg class="ico-post" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14">\
              <path fill="#313133" d="M10,0c6,0,10,7,10,7s-4,7-10,7S0,7,0,7S4,0,10,0L10,0z M10,11.9c2.7,0,4.9-2.2,4.9-4.9S12.7,2.1,10,2.1 \
          S5.1,4.3,5.1,7S7.3,11.9,10,11.9z M12.2,7c0,1.2-1,2.2-2.2,2.2c-1.2,0-2.2-1-2.2-2.2c0-1.2,1-2.2,2.2-2.2C11.2,4.8,12.2,5.8,12.2,7z"></path> \
          </svg> \
          <div class="text3-icons-news visit-val">' + data.newsVisits + '</div> \
                    <div class="tooltip round-corners box-shadow">переглядів всего</div> \
                </div>\
                <div class="social-block tooltip-online"> \
            <svg class="ico-post" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14">\
                <g style="fill: #313133;">\
                    <path d="M13.1,3.3c0,0.9-0.3,1.8-0.7,2.6C12.2,6.3,12,6.7,11.7,7c-0.1,0.1-0.1,0.1-0.1,0.2c-0.1,0.2-0.1,0.4-0.1,0.6 \
                    c0,0.1,0,0.2-0.1,0.2c-0.8,0.8-2.2,0.8-2.9,0c-0.1-0.1-0.1-0.1,0-0.2c0.1-0.3,0-0.6-0.2-0.9C7.5,6,7,4.9,6.9,3.7 \
                    c-0.1-0.7,0-1.4,0.3-2c0.4-0.9,1.1-1.4,2-1.6c1-0.2,1.9-0.1,2.7,0.5c0.6,0.4,1,1.1,1.1,1.8C13.1,2.7,13.1,3,13.1,3.3z"></path>\
                    <path d="M15.8,11.4c-0.1-0.4-0.4-0.7-0.7-1c-0.7-0.6-1.5-1-2.4-1.4c0,0-0.1,0.1-0.1,0.1c-0.7,0.7-1.6,1.1-2.6,1.1 \
                    c-1,0-2-0.4-2.6-1.1c0,0,0,0,0-0.1C7.1,9.1,6.8,9.2,6.6,9.3C6,9.6,5.4,9.9,4.9,10.4c-0.3,0.3-0.6,0.6-0.7,1c-0.1,0.2,0,0.5,0,0.7 \
                    c0,0.3,0.1,0.6,0.3,0.8C4.7,13,4.8,13.2,5,13.3c0.8,0.4,1.6,0.5,2.4,0.6C8.2,14,8.9,14,9.6,14c1.2,0,2.4,0,3.6-0.2 \
                    c0.6-0.1,1.2-0.2,1.8-0.5c0.4-0.2,0.7-0.4,0.8-0.9C15.8,12.1,15.8,11.7,15.8,11.4z"></path>\
                </g>\
            </svg>\
            <div class="text3-icons-news online-val">' + data.newsOnline + '</div> \
            <div class="tooltip round-corners box-shadow">користувачів online</div> \
        </div>-->\
    </div>\
     <div class="who-likes">\
            <div style="text-align: center; padding: 5px;">Поки що нікому не сподобалось</div>\
        </div>\
    <div class="postaction">\
        <div class="postaction__like">\
                        <div class="like ' + active + '">\
								<svg xmlns="http://www.w3.org/2000/svg" width="30" height="29" viewBox="-1 0 20 16">\
									<path fill="none" stroke="#313133" stroke-miterlimit="10" stroke-width="1.5" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
								4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
								3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
								</svg>\
								Подобається\
					</div>\
					</div>\
							<div class="share">\
                            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="26"\
                        viewBox="0 0 17.151 14.559">\
                            <path d="M.662,9.493c-.011.03-.021.056-.032.086-.035.084-.067.168-.1.254-.071.19-.136.381-.19.572a7.773,7.773,0,0,0-.3,3.013l.17,1.142.618-.974a8.978,8.978,0,0,1,8.615-4.02v3.868l2.091-1.8,1.068-.92.654-.563L17,6.926l.153-.149-.011-.415L9.441,0V3.907h0c-.17,0-.335,0-.507.01A9.268,9.268,0,0,0,1.075,8.634Z"\
                        fill="none" stroke="#313133" stroke-miterlimit="10" stroke-width="0.8"/>\
                            </svg>\
                        Поширити\
                        </div>\
                </div>\
            </div>';
  },
  initPostPhotoUpload: function () {
    var self = this;
    var $emailAttachmentBtn = $('.pictures-holder .template');

    // redirect click on email attachment
    $emailAttachmentBtn.on('click', function () {
      $('.fs-upload-target').click();
    });

    $emailAttachmentBtn.upload({
      beforeSend: onBeforeSend,
      action: "/profile/postAttachment",
      postKey: "file",
      maxSize: 52428800, // 50mb
      postData: {type: "general", hash: user.hash},
      label: ''
    });

    function onBeforeSend(formData, file) {
      var fileName = file.name.toLowerCase();
      var fileNameSplitted = fileName.split(".");
      var fileEx = fileNameSplitted[fileNameSplitted.length - 1];
      var vid = '';

      if (fileEx in self.videoFormats) {
        $(".picture-box .close-cross").click();
        $('.pictures-holder .template').hide();
        vid = 'video';
      }

      if (fileEx in self.videoFormats || fileEx in self.imageFormats) {
        var loaderHtml =
          '<div class="picture-box loader ' + vid + '">\
                       <div class="close-cross">\
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12">\
                           <path fill="#FFF" d="M3.4 0l2.2 2.6c.6.7 1 1.3 1.5 2h.1c.5-.7 1-1.3 1.5-2L10.8 0h3L8.6 5.8 14 12h-3.2L8.6 9.3C8 8.6 7.5 7.9 7 7.2h-.1c-.5.7-1 1.4-1.6 2.1L3.1 12H0l5.4-6.1L.3 0h3.1z"></path>\
                         </svg>\
                       </div>\
                       <img src="/img/loader-bw.gif" data-width="0" data-height="0">\
                     </div>';

        $('.pictures-holder').prepend(loaderHtml);

        return formData;
      } else {
        return false
      }
    };

    $emailAttachmentBtn.on("filecomplete", function (obj, file, res) {
      res = JSON.parse(res);
      // find file extension
      var filePath = res.frontPath;
      var fileNameSplitted = filePath.split(".");
      var fileEx = fileNameSplitted[fileNameSplitted.length - 1];

      if (fileEx in self.imageFormats) {
        if ($('.picture-box.video').length !== 0) {
          $('.picture-box.loader:not(.video)').remove();
          SOCKET.emit('deleteRibbonImage', JSON.stringify({path: filePath}));
        } else {
          $('.picture-box.loader').removeClass('loader').find('img').attr('src', filePath).attr('data-width', res.width).attr('data-height', res.height);
        }
      }

      // if it is video file - replace whole html
      if (fileEx in self.videoFormats) {
        var attachmentHtml =
          '<video class="vid"  data-thumb="' + res.thumbPath + '"  style="height: 100%; max-width:100%;" controls="">\
                       <source src="' + filePath + '" type="video/' + fileEx + '">\
                        </video>';

        $('.picture-box.loader').removeClass('loader').find('img').replaceWith(attachmentHtml);
      }
    });
  },
  initPosthotoDelete: function () {
    $('.pictures-holder').off('click').on('click', '.close-cross', function () {
      if ($('.pictures-holder .picture-box').length === 1) {
        $('.pictures-holder .template').show();
      }
      var src = $(this).parent('.picture-box').find('img').attr('src');

      if (!src) {
        src = $(this).parent('.picture-box').find('source').attr('src');
      }
      if (src) {
        $(this).parent('.picture-box').animate({
          width: 0,
          height: 0,
          opacity: 0
        }, 200, function () {
          this.remove();
          SOCKET.emit('deleteRibbonImage', JSON.stringify({path: src}));
        });
      }
    });
  },
  initWritePostHandlers: function () {
    function showFullWritepost() {
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
    }

    function hideFullWritepost() {
      $('.writepost').removeClass('focused');
      $('.writepost .controls').css('height', $('.writepost .controls').get(0).scrollHeight);
      $('.writepost__input').animate({
        'min-height': '39px'
      }, 300).blur();
      $('.writepost .controls').animate({
        height: 0,
        opacity: 0
      }, 300);
    }

    $('.writepost__input').one('focusin', showFullWritepost);

    $('.writepost .cancel-post').off('click').on('click', function () {
      hideFullWritepost();
      $('.writepost__input').one('focusin', showFullWritepost);
    });
  },
  initSavePost: function () {
    var self = this;
    $('.writepost .save-post').off('click').on('click', function () {
      var postImgArray = [];
      var postWidthArray = [];
      var postHeightArray = [];
      var postVideo;
      var postVideoThumb;
      var postData = {
        postSocialsArray: []
      };
      var postText = $('.writepost__input').html();
      var postTags = self.correctPostTextBeforeSend(postText).hashTags;
      postText = self.correctPostTextBeforeSend(postText).text;

      if (postText.length > 0) {
        postData.status = postText;
      }
      $('.picture-box img').each(
        function (index) {
          postImgArray.push($(this).attr('src'));
          postWidthArray.push($(this).attr('data-width'));
          postHeightArray.push($(this).attr('data-height'));
        }
      );
      if (postImgArray.length > 0) {
        postData.imgArr = postImgArray;
      }
      postVideo = $('.picture-box video source').attr('src');
      if (postVideo) {
        postData.postVideo = postVideo;
        postVideoThumb = $('.picture-box video').attr('data-thumb');
      }
      $(".writepost").find('.soc-block input[type="checkbox"]').each(function () {
        if ($(this).is(':checked')) {
          if (!(!(postImgArray.length > 0 || postVideo) && $(this).attr("name") === 'instagram')) {
            postData.postSocialsArray.push($(this).attr("name"))
          }
        }
      });
      if (postImgArray.length > 0 || postText.length > 0 || postVideo) {
        SOCKET.emit('addRibbonPost', JSON.stringify({
          hash: user.hash,
          ribbonText: postText,
          ribbonHashTags: postTags,
          ribbonVideo: postVideo,
          ribbonVideoThumb: postVideoThumb,
          ribbonPhoto: postImgArray.join(),
          ribbonPhotoWidth: postWidthArray.join(),
          ribbonPhotoHeight: postHeightArray.join(),
          ribbonId: self.currentPost.ribbonId
        }));
        if (postData.postSocialsArray.length > 0) {
          postData.shareType = 'post';
          SOCKET.emit('shareSocialPost', JSON.stringify({hash: user.hash, postData: postData}));
        }
        self.currentPost.ribbonId = false
      }
    });
  },
  correctPostTextBeforeSend: function (text) {
    var hashTags = [];

    // replace chrome div wrapping with new line
    var divMatches = text.match(/<div[^>]*>(.*?)<\/div[^>]*>/i);
    while (divMatches != null) {
      if (divMatches != null) {
        text = text.replace(divMatches[0], '\n' + divMatches[1]);
      }
      divMatches = text.match(/<div[^>]*>(.*?)<\/div[^>]*>/i);
    }

    // replace firefox br with new line
    var brMatches = text.match(/<\/?br>/g);
    if (brMatches != null) {
      for (var i = 0; i < brMatches.length; i++) {
        text = text.replace(brMatches[0], '\n');
      }
    }

    // check if text has bug &nbsp
    var whitespaceBugCheck = text.match(/&nbsp;/g);
    if (whitespaceBugCheck != null) {
      text = stringReplaceAll(text, '&nbsp;', ' ');
    }

    // replace all tags
    var tagMatches = text.match(/<[^>]*>/g);
    if (tagMatches != null) {
      for (var i = 0; i < tagMatches.length; i++) {
        text = text.replace(tagMatches[i], ' ');
      }
    }

    var manyWhitespaces = text.match(/  /i);
    while (manyWhitespaces != null) {
      if (manyWhitespaces != null) {
        text = stringReplaceAll(text, '  ', ' ');
      }
      manyWhitespaces = text.match(/  /i);
    }

    // correct chrome many new line
    var nLineMultiple = text.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);

    while (nLineMultiple != null) {
      if (nLineMultiple != null) {
        text = text.replace(nLineMultiple[0], '\n');
      }
      nLineMultiple = text.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);
    }

    var hashTagsMatch = text.match(/#[a-zA-Zа-яА-Я0-9]+[^+#,=\s]/img);
    if (hashTagsMatch !== null) {
      for (var i = 0; i < hashTagsMatch.length; i++) {
        hashTags.push(hashTagsMatch[i]);
      }
    }

    return {
      text: text,
      hashTags: hashTags
    }
  },
  correctPostTextBeforeShow: function (data) {
    var text = data.ribbonText;

    if (data.ribbonDogLinks !== null) {
      var dogLinksArr = data.ribbonDogLinks ? data.ribbonDogLinks.split(',') : [];

      for (var i = 0; i < dogLinksArr.length; i++) {
        var replace = '@' + dogLinksArr[i];
        var re = new RegExp(replace, "mi");

        text = text.replace(re, '<a class="dnl" target="_blank" href="/usernick/' + dogLinksArr[i] + '"><s>@</s><b>' + dogLinksArr[i] + '</b></a>')
      }
    }


    var hashTagsMatch = text.match(/#[a-zA-Zа-яА-Я0-9]+[^+#,=\s]/img);
    if (hashTagsMatch !== null) {
      for (var i = 0; i < hashTagsMatch.length; i++) {
        text = text.replace(hashTagsMatch[i], '<a class="htl" target="_blank" href="/#page=hashtag-search&tag=' + hashTagsMatch[i].substr(1) + '"><s>#</s><b>' + hashTagsMatch[i].substr(1) + '</b></a>');
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
  correctDogNicksOnEdit: function (text) {

    var dogNickLinkMatch = text.match(/<a class="dnl".*?usernick\/(.*?)".*?<\/a>/im);
    while (dogNickLinkMatch !== null) {
      if (dogNickLinkMatch !== null) {
        text = text.replace(dogNickLinkMatch[0], '@' + dogNickLinkMatch[1]);
      }
      dogNickLinkMatch = text.match(/<a class="dnl".*?usernick\/(.*?)".*?<\/a>/im);
    }

    return text
  },
  initMyPostDelete: function ($target) {
    $target.on('click', '.delete-my', function (e) {
      e.preventDefault();
      var rId = $(e.target).parents('.post').data('ribbonid');
      var uId = $(e.target).parents('.post').data('userid');
      $(this).parents('.post').animate({
        width: 0,
        height: 0,
        opacity: 0
      }, 200, function () {
        this.remove();
        SOCKET.emit('deleteRibbonPost', JSON.stringify({hash: user.hash, userId: uId, ribbonId: rId}));
      });
    });
    SOCKET.off('deleteRibbonPost').on('deleteRibbonPost', function (data) {
      var data = JSON.parse(data);
      if (data.result === 'success') {
        showNotify('success', 'Видалено')
      }
    })
  },
  initMyPostEdit: function ($target) {
    var self = this;

    $target.on('click', '.edit-my', function (e) {
      e.preventDefault();
      var postImg = [];
      var postWidth = [];
      var postHeight = [];
      var picHtml = '';
      var postVideo = $(e.target).parents('.post').find('.postcontent__media video source').attr('src');
      self.currentPost.ribbonId = $(e.target).parents('.post').data('ribbonid');
      var postText = $(e.target).parents('.post').find('.postcontent__text').html();
      postText = self.correctHashTagsOnEdit(postText);
      postText = self.correctDogNicksOnEdit(postText);
      $(e.target).parents('.post').find('.postcontent__media .postimg').each(function (index) {
        postImg.push($(this).attr('src'));
        postWidth.push($(this).attr('data-width'));
        postHeight.push($(this).attr('data-height'));
      });

      postImg.forEach(function (src, index) {
        picHtml +=
          '<div class="picture-box">\
             <div class="close-cross">\
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12">\
                 <path fill="#FFF" d="M3.4 0l2.2 2.6c.6.7 1 1.3 1.5 2h.1c.5-.7 1-1.3 1.5-2L10.8 0h3L8.6 5.8 14 12h-3.2L8.6 9.3C8 8.6 7.5 7.9 7 7.2h-.1c-.5.7-1 1.4-1.6 2.1L3.1 12H0l5.4-6.1L.3 0h3.1z"></path>\
               </svg>\
             </div>\
             <img src="' + src + '" data-width="' + postWidth[index] + '" data-height="' + postHeight[index] + '">\
                     </div>';
      });

      if (postVideo) {
        var thumb = $(e.target).parents('.post').find('.postcontent__media video').attr('data-thumb');
        var fileNameSplitted = postVideo.split(".");
        var fileEx = fileNameSplitted[fileNameSplitted.length - 1];
        picHtml =
          '<div class="picture-box">\
             <div class="close-cross">\
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12">\
                 <path fill="#FFF" d="M3.4 0l2.2 2.6c.6.7 1 1.3 1.5 2h.1c.5-.7 1-1.3 1.5-2L10.8 0h3L8.6 5.8 14 12h-3.2L8.6 9.3C8 8.6 7.5 7.9 7 7.2h-.1c-.5.7-1 1.4-1.6 2.1L3.1 12H0l5.4-6.1L.3 0h3.1z"></path>\
               </svg>\
             </div>\
              <video class="vid" data-thumb="' + thumb + '" style="height: 100%; max-width:100%;" controls="">\
                            <source src="' + postVideo + '" type="video/' + fileEx + '">\
                        </video>\
                    </div>';
        $('.pictures-holder .template').hide();
      }

      $('.writepost__input').html(postText);
      $('.pictures-holder').find('.picture-box').remove();
      $('.pictures-holder').prepend(picHtml);
      postImg = [];
      postWidth = [];
      postHeight = [];
      picHtml = '';
      $('.writepost__input').focus();
    });
  },
  initIdPostClaim: function ($target) {
    $target.on('click', '.claim-other', function (e) {
      e.preventDefault();
      SOCKET.emit('claimRibbonPost', JSON.stringify({
        hash: user.hash,
        ribbonId: $(e.target).parents('.post').data('ribbonid')
      }));
    });
    SOCKET.off('claimRibbonPost').on('claimRibbonPost', function (data) {
      var data = JSON.parse(data);
      if (data.action === 'add') {
        $('.post[data-ribbonid="' + data.ribbonId + '"]').data('claim', 1);
        showNotify('success', 'Скаргу надіслано');
      } else if (data.action === 'remove') {
        $('.post[data-ribbonid="' + data.ribbonId + '"]').data('claim', 0);
        showNotify('success', 'Скаргу відкликано');
      }
    })
  },
  initPostShare: function ($target) {
    var self = this;
    SOCKET.off('facebookSharePost').on('facebookSharePost', function (data) {
      data = JSON.parse(data);
      if (data.error) {
        window.location.href = data.error;
      } else {
        showNotify("success", 'Поширено в Facebook');
      }
    });
    SOCKET.off('twitterSharePost').on('twitterSharePost', function (data) {
      data = JSON.parse(data);
      if (data.error) {
        window.location.href = data.error;
      } else if (data.vid_error) {
        showNotify("danger", 'Формат не підтримується Twitter або файл більше 15мб');
      } else {
        showNotify("success", 'Поширено в Twitter');
      }
    });
    SOCKET.off('instagramSharePost').on('instagramSharePost', function (data) {
      data = JSON.parse(data);
      if (data.message === "error") {
        openPromotionPopup("pages/instagram-login.html", "Instagram");
      } else if (data.message === "success") {
        showNotify("success", 'Поширено в Instagram');
      }
    });

    SOCKET.off('checkInstagramLoginData').on('checkInstagramLoginData', function (data) {
      data = JSON.parse(data);
      if (data.message === "finalized") {
        showNotify("success", 'Loged into Instagram');

        $('.insta-login').each(function (){
          $(this)[0].removeAttribute('data-show-modal');
        });
        $('.inst-share').removeClass('no-active');
      }
    });

    $target.on("click", ".share", function () {
      self.recentImage = $(this).parents(".post");
      $(".flipper.share-post").find(".share-btn").off("click").on("click", function () {
        var postData = {
          postSocialsArray: []
        };
        hideFlipModal(".flipper.share-post");
        var hasImages = self.recentImage.find(".postcontent__media img").length > 0;
        var hasVideo = self.recentImage.find('.postcontent__media video source').attr('src');
        var hasLink = self.recentImage.find('.postcontent').attr('href');

        var postText = self.recentImage.find(".postcontent__text").contents().filter(function () {
          return this.nodeType == 3;
        }).text();
        if (postText.length > 0 && !hasLink) {
          postText = self.correctHashTagsOnEdit(postText);
          postText = self.correctDogNicksOnEdit(postText);
          postText = self.correctPostTextBeforeSend(postText).text;
          postData.status = postText;
        } else if (postText.length > 0 && hasLink) {
          postText = self.correctHashTagsOnEdit(postText);
          postText = self.correctDogNicksOnEdit(postText);
          postText = self.correctPostTextBeforeSend(postText).text;
          if ((postText.length + hasLink.length + 4) < 280) {
            postData.status = postText + "... " + hasLink;
          } else {
            postData.status = postText.slice(0, (280 - hasLink.length - 4)) + "... " + hasLink;
          }
        }
        if (hasVideo) {
          postData.postVideo = hasVideo;
        }
        if (hasImages) {
          var imgArr = [];
          self.recentImage.find(".postcontent__media img").each(function (index, img) {
            imgArr.push($(img).attr("src"));
          });
          postData.imgArr = imgArr;
        }
        postData.shareType = hasLink ? 'news' : 'post';
        $(".flipper.share-post").find('.menu-item.share-item:not(.no-active) input[type="checkbox"]').each(function () {
          if ($(this).is(':checked')) {
            if (!(!(hasImages || hasVideo) && $(this).attr("name") === 'instagram')) {
              postData.postSocialsArray.push($(this).attr("name"))
            }
          }
        });
        if (postData.postSocialsArray.length > 0) {
          SOCKET.emit('shareSocialPost', JSON.stringify({hash: user.hash, postData: postData}));
        }
      });
      showFlipModal(".flipper.share-post");
    });
  },
  initSocialLoginCheck: function () {
    var self = this;

    SOCKET.emit('checkSocialKeys', JSON.stringify({hash: user.hash, keysList: ['all']}));
    SOCKET.off('checkSocialKeys').on('checkSocialKeys', function (data) {
      data = JSON.parse(data);
      if (data.status.instagram === 'error') {
        $('.insta-login').each(function (){
          $(this).attr('data-show-modal', true);
        });
      } else {
        $('.insta-login').each(function (){
          $(this)[0].removeAttribute('data-show-modal');
        });

        $('.inst-share').removeClass('no-active');
      }
      var checkActions = {
        'facebook': 'fb',
        'twitter': 'twit',
        'instagram': 'inst'
      };
      for (var i in data.status) {
        if (data.status[i] === 'success') {
          $(".flipper.share-post").find("." + checkActions[i] + "-share").removeClass("no-active");
        }
      }
    });
  },
  initDetailedLikesInfo($target){
    var self = this;
    var currentLikeObj;

    $target.on('click', '.single-photo[data-ribbonid] .likes-wrap', function (e) {
      e.preventDefault();
      var data = currentLikeObjGrabber($(this));
      SOCKET.emit('getUserPostLike', JSON.stringify({
        hash: user.hash,
        profileId: data.profileId,
        ribbonId: data.ribbonId
      }));
    });

    $target.on('click', '.single-photo[data-postid] .likes-wrap', function (e) {
      e.preventDefault();
      var data = currentLikeObjGrabber($(this));
      SOCKET.emit('getUserNewsPostLike', JSON.stringify({hash: user.hash, postId: data.postId}));
    });

    function currentLikeObjGrabber($current) {
      var returnobj = {};
      currentLikeObj = $current.parents('.single-photo');
      var $target = $current.find('.likes-arrow');
      var $text = currentLikeObj.find('.who-likes');
      var textState = $text.css('display');
      $target.toggleClass('rotated-arrow');
      $text.css('display', (textState == 'block') ? 'none' : 'block');
      if (currentLikeObj.attr('data-ribbonid')) {
        returnobj.profileId = currentLikeObj.data("profileid");
        returnobj.ribbonId = currentLikeObj.data("ribbonid");
      } else if (currentLikeObj.attr('data-postid')) {
        returnobj.postId = currentLikeObj.data("postid");
      }

      return returnobj
    }

    SOCKET.on('getUserPostLike', function (data) {
      insertLikesPerson(data)
    });
    SOCKET.on('getUserNewsPostLike', function (data) {
      var socArr = ['fblikes', 'vklikes', 'glikes', 'oklikes', 'mslikes'];
      var socNames = ['Facebook', 'Вконтакте', 'Google plus', 'Одноклассники', 'Emoment'];
      var socImages = ['feed-news-fb.svg', 'feed-news-vk.svg', 'feed-news-gplus.svg', 'feed-news-ok.svg', 'feed-news-emo.svg'];
      var socLinks = ['//fb.com', '//vk.com', '//plus.google.com', '//ok.ru', '//emoment.com'];
      data.socData = [];

      socArr.forEach(function (item, index) {
        data.socData[index] = {
          name: socNames[index],
          image: socImages[index],
          value: currentLikeObj.data(item),
          link: socLinks[index]
        };
      });
      insertLikesPerson(data)
    });

    function insertLikesPerson(data) {
      var html = "";
      var isLiked = false;

      if (data.socData) {
        for (var k = 0; k < data.socData.length; k++) {
          if (+data.socData[k].value > 0) {
            html += self.htmlLikeSocials(data.socData[k]);
          }
        }
      }

      for (var i = 0; i < data.likes.length; i++) {
        if (data.likes[i].my)
          isLiked = true;
        html += self.htmlLikePerson(data.likes[i]);
      }
      if (html) {
        currentLikeObj.find('.who-likes').html(html);
      }
    }
  },
  initPostImageToAvatar($target){
    var $content = $target;

    // ОБРЕЗАТЬ ИЗОБРАЖЕНИЕ
    var jcropX = 0;
    var jcropY = 0;
    var jcropX2 = 200;
    var jcropY2 = 200;

    function cropevent(c) {
      if (parseInt(c.w) > 0) {
        if (c.x < 0) jcropX = 0; else jcropX = Math.floor(c.x);
        if (c.y < 0) jcropY = 0; else jcropY = Math.floor(c.y);
        if (c.x2 < 0) jcropX2 = 0; else jcropX2 = Math.floor(c.x2);
        if (c.y2 < 0) jcropY2 = 0; else jcropY2 = Math.floor(c.y2);
      }
    }

    var $cropBody = $("#cropBody");
    var cropImgSrc = '';
    $content.on("click", ".post .to-main-photo", function (e) {
      e.preventDefault();
      var $target = $(this).parents(".single-photo").find(".postimg:first-of-type");
      cropImgSrc = $target.attr("src");
      if (!$target.parent().hasClass("add-photo")) {
        $cropBody.find("img").attr("src", cropImgSrc);
        showFlipModal(".flipper.avatar-crop-flip");

        var jcropApi = $.Jcrop($cropBody.find("img"), {
          bgColor: 'white',
          bgOpacity: 0.3,
          aspectRatio: 1,
          minSize: [300, 300],
          setSelect: [0, 0, 300, 300],
          onChange: cropevent,
          onSelect: cropevent
        });

        $("body").one("click", ".page-shadow-hover, .form-close.clickable, .crop-image-save", function () {
          $cropBody.prepend('<img src="' + cropImgSrc + '" alt="image" class="crop-image">');
          jcropApi.destroy();
          hideFlipModal(".flipper.avatar-crop-flip");
        });
      }
    });

    $content.on("click", ".crop-image-save", function () {
      SOCKET.emit('cropUserImage', {
        "hash": user.hash,
        "path": $cropBody.find(".crop-image").attr("src"),
        "x": jcropX,
        "y": jcropY,
        "width": (jcropX2 - jcropX),
        "height": (jcropY2 - jcropY)
      });
      return false;
    });

    SOCKET.removeEventListener('cropUserImage');
    SOCKET.on('cropUserImage', function (data) {
      $(".avatar .profile-img, #authorized-user .user-avatar img").attr("src", data.image);
    });

  },

  htmlLikePerson(row) {
    return '<a href="/profile/' + row.userId + '"><div class="like-person ' + ((row.my) ? "my" : "") + '">\
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="-1 0 20 16">\
					<path fill="#d3494e" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
					4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
					3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
				</svg>\
				<figure class="like-person-avatar" title="">\
					<img src="' + row.userPhoto + '" alt="user" class="" style="max-width: 100%;">\
				</figure>\
				<div class="name-status-holder flexcol">\
					<div class="user-nickname">@' + row.userName + '</div>\
					<!--<div class="user-online-status">' + ((row.userLastActive != "online") ? row.userLastActive : lang.lOnlineStatus) + '</div>-->\
				</div>\
				<svg class="user-favour svg-ico ' + ((row.inFavorite) ? 'active' : '') + '" data-userid="' + row.userId + '" xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">\
					<!--<path fill="#B4B4B4" d="M7.8,2.1c0-0.5,0.2-0.7,0.7-0.7c0,0,0.7-0.1,0.7,0.7c0,0.7-0.6,0.5-0.6,0.8C9,3.9,9.8,7.3,11.3,8 \
						c1.5,1.1,3.6-0.6,4.4-1.2c-0.2-0.7-0.1-1,0.1-1.2c0.2-0.2,0.6-0.2,0.8,0C17,5.7,17.1,6.2,17,6.4c-0.1,0.2-0.5,0.5-1,0.5 \
						c0,0-2.1,5.3-2.3,6c0,0.2-0.2,0.4-0.5,0.4H3.9c-0.2,0-0.4-0.1-0.5-0.4l-2.3-6C0.5,6.9,0.3,6.8,0,6.4c-0.1-0.4,0.1-0.7,0.4-0.8 \
						c0.1-0.1,0.6-0.2,0.8,0c0.4,0.2,0.4,0.6,0.1,1.1c0.8,0.7,3,2.1,4.1,1.5c1.2-0.5,2.8-4.7,2.9-5.2C8.3,2.6,7.9,2.7,7.8,2.1z \
						M13.5,13.6v1.1H3.5v-1.1H13.5z"/>-->\
				</svg>\
			</div></a>';
  },

  htmlLikeSocials(row) {
    return '<a href="' + row.link + '" target="_blank"><div class="like-person">\
                <span style="width: 20px;height: 19px; text-align: center; font-size: 15px;">' + row.value + '</span>\
				<figure class="like-person-avatar" title="">\
					<img src="/img/' + row.image + '" alt="user" class="" style="max-width: 100%;">\
				</figure>\
				<div class="name-status-holder flexcol">\
					<div class="user-nickname">@' + row.name + '</div>\
				</div>\
				<svg class="user-favour svg-ico" data-userid="0" xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">\
				</svg>\
			</div></a>';
  }
};

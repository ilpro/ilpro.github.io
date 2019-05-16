'use strict';
function StickersAndEmoji(socket) {
  this.socket = socket;

  // stickers and emoji
  this.allStickers = false;
  this.favoritePacks = [];
  this.favorites = false;
  this.stickers = {};
  this.stickersImg = {};
  this.gifts = {};
  this.container = {}; // jQuery wrapper for stickers and emoji
  this.activePackId = false; // visible pack of stickers
}

StickersAndEmoji.prototype.init = function (options) {
  var self = this;
  var hash = user.hash ? user.hash : false;

  self.container = options.container;
  self.initSocketHandlers();
  self.initEventHandlers();
  self.socket.emit('getUserStickers', JSON.stringify({hash: hash}));
};

/** Socket handlers for stickers and emoji **/
StickersAndEmoji.prototype.initSocketHandlers = function () {
  var self = this;

  // insert stickers when received
  self.socket.off('userStickers', insertStickers).on('userStickers', insertStickers);
  function insertStickers(data) {
    data = JSON.parse(data);

    var $container = $(self.container);

    // smiles images for decode text in input
    self.stickersImg = data.stickers.images;

    if (data.favoritePacks) {
      self.favoritePacks = data.favoritePacks;
    }

    if (data.favorites) {
      self.favorites = data.favorites;
    }

    // pass stickers and smiles into handler
    self.stickers = self.createSticker(data.stickers.pack, data.stickers.smiles, self.favoritePacks);

    // insert into HTML
    $container.empty().append(self.stickers);
  }

  /** Insert sticker favorites **/
  self.socket.off('stickersFavorites').on('stickersFavorites', function (data) {
    self.favorites = JSON.parse(data);

    if ($('#favorites-set').length > 0) {
      self.insertFavorites(data);
    } else {
      self.socket.emit('getUserStickers', JSON.stringify({hash: user.hash}));
    }
  });

  /** Insert gifts into variable **/
  self.socket.off('giftsAll').on('giftsAll', function (data) {
    self.gifts = JSON.parse(data);
    $(document).trigger('giftsReceived');
  });
};

/** Event handlers for stickers and emoji **/
StickersAndEmoji.prototype.initEventHandlers = function () {
  var self = this;

  // change sticker set
  $(document).off("click", ".sticker-set-btn").on("click", ".sticker-set-btn", function (e) {
    e.preventDefault();
    stickersAndEmoji.changeSet($(this));
  });
};


StickersAndEmoji.prototype.createSticker = function (stickersData, smilesData, favorites) {
  var self = this;
  var pack = '';
  var buttons = '';

  // favorites and smiles containers
  if (self.favorites) {
    buttons += self.createFavoritesBtn('active');
    pack += self.createFavoritesContainer('active');
    buttons += self.createSmilesButton();
    pack += self.createSmilesContainer(smilesData);
  } else {
    buttons += self.createSmilesButton('active');
    pack += self.createSmilesContainer(smilesData, 'active');
  }

  self.favoritePacks.forEach(function (value, i, arr) {
    if (+value in stickersData) {
      var stickerObj = stickersData[+value];
      buttons += '<button class="btn-clear sticker-set-btn" title="' + lang.lStickChosePack + '"  data-sticker-set="sticker-set-' + value + '"><img src="https://emosmile.com' + stickerObj.mainSticker + '" ></button>';
      pack += '<div id="sticker-set-' + value + '" class="sticker-container" style="display: none;">';

      $.each(stickerObj.stickers, function (i, item) {
        pack +=
          '<figure class="sticker send-smile"> \
               <img src="https://emosmile.com' + item.stickerImg + '" data-sticker="&s-' + item.stickerId + ';" alt="smile"> \
         </figure>';
      });
      pack += '</div>';
    }
  });

  var stickerBox =
    '<div class="sticker-wrapper"> \
         <div class="sticker-set-btn-container"> \
            ' + buttons + '\
       </div>\
        ' + pack + '\
     </div>';

  return stickerBox;
};

/** Add favorites button function **/
StickersAndEmoji.prototype.createFavoritesBtn = function (active) {
  active = active ? 'active' : '';

  var favoritesImg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27">\
       <g fill="#CDCDCD">\
         <path d="M23.1 4C17.8-1.3 9.2-1.3 4 3.9-1.3 9.2-1.3 17.7 4 23c5.3 5.3 13.8 5.3 19.1 0 5.2-5.2 5.2-13.8\
           0-19zm-1.5 17.6C17.1 26 9.9 26 5.4 21.6 1 17.1 1 9.9 5.4 5.4 9.9 1 17.1 1 21.6 5.4c4.4 4.5 4.4 11.7 0 16.2z"/>\
         <path d="M20.2 13.4h-6.1V6.2c0-.7-.5-1.2-1.1-1.2-.6 0-1.1.5-1.1 1.1v8.4c0 .6.5 1.1 1.1 1.1h7.2c.6 0 1.1-.5 1.1-1.1 0-.6-.5-1.1-1.1-1.1zm0 0"/>\
       </g>\
     </svg>';

  return '<button class="btn-clear sticker-set-btn  active" title="' + lang.lStickLastUsedStickers + '"  data-sticker-set="favorites-set">' +
    favoritesImg + '</button>';
};

/** Add favorites container **/
StickersAndEmoji.prototype.createFavoritesContainer = function (active) {
  var self = this;
  var favoriteStickers = '';
  var favoriteSmiles = '';
  active = active ? 'style="display: block;"' : '';

  $.each(self.favorites, function (i, item) {
    if (item.type === 'sticker') {
      favoriteStickers +=
        '<figure class="sticker send-smile" style="margin-right: 1px;"> \
           <img src="https://emosmile.com' + item.img + '" data-sticker="' + item.imgCode + '" alt="smile"> \
        </figure>';
    } else {
      favoriteSmiles +=
        '<i class="sprite-smile send-smile st-sm-' + item.imgCode + '" data-smile="&amp;sm-' + item.imgCode + '"></i>';
    }
  });

  var favoritesHtml =
    '<div id="favorites-set" class="sticker-container" ' + active + '>\
       <div class="recent-smiles-wrapper">\
         ' + favoriteSmiles + '\
       </div>\
       <div class="recent-smiles-stickers-divider"></div>\
       <div class="recent-stickers-wrapper">\
         ' + favoriteStickers + '\
       </div>\
     </div>';

  return favoritesHtml;
};

/** Add smiles button **/
StickersAndEmoji.prototype.createSmilesButton = function (active) {
  active = active ? 'active' : '';

  var smilesImg =
    '<svg width="27" height="27" viewBox="0 0 27 27"> \
        <path opacity=".4" fill="#4E4E4E" d="M22.82 4.18c-5.14-5.14-13.5-5.14-18.64 0-5.14 5.14-5.14 13.5 0 18.64 5.14 5.14 13.5 5.14 18.64 0 5.14-5.14 5.14-13.5 0-18.64zm-1.438 17.202c-4.345 4.347-11.418 4.348-15.764 0-4.348-4.346-4.347-11.42 0-15.766 4.346-4.345 11.418-4.346 15.765.002 4.346 4.345 4.346 11.42 0 15.764zM8.584 9.932c0-.85.69-1.54 1.54-1.54.85 0 1.54.69 1.54 1.54 0 .853-.69 1.542-1.54 1.542-.85 0-1.54-.69-1.54-1.54zm6.985 0c0-.85.69-1.54 1.54-1.54.85 0 1.54.69 1.54 1.54 0 .853-.688 1.542-1.54 1.542-.85 0-1.54-.69-1.54-1.54zm3.64 6.31c-.954 2.208-3.19 3.635-5.695 3.635-2.56 0-4.81-1.433-5.73-3.653-.16-.38.02-.816.402-.974.093-.04.19-.057.285-.057.293 0 .57.173.69.46.69 1.66 2.397 2.735 4.353 2.735 1.91 0 3.61-1.075 4.33-2.736.16-.38.6-.553.978-.39.378.164.552.603.388.98zm0 0"/>\
    </svg>';
  return '<button class="btn-clear sticker-set-btn ' + active + '" title="' + lang.lStickChoseSmilesPack + '"  data-sticker-set="smile-set-1">' +
    smilesImg + '</button>';
};

/** Add smiles container to stickers container **/
StickersAndEmoji.prototype.createSmilesContainer = function (smilesData, active) {
  var smiles = '';
  active = active ? 'style="display: block;"' : '';

  $.each(smilesData, function (k, value) {
    smiles +=
      '<i class="sprite-smile send-smile st-sm-' + k + '" \
            data-smile="&sm-' + value.smileId + ';" \
            data-smile-text="' + value.smileText + '" \
            title="' + value.smileText + '">\
         </i>';
  });

  return '<div id="smile-set-1" class="sticker-container" ' + active + '>' + smiles + '</div>';
};

/** Handle stickers on send **/
StickersAndEmoji.prototype.sendSticker = function ($clickedSticker, $textField, $sendBtn) {
  var self = this;
  var img,
    imgCode,
    type;

  // if this is reply comment - select "reply comment message" buttons in variables
  if ($clickedSticker.closest("#comment-container").find('.reply-field').length > 0) {
    $textField = $clickedSticker.closest("#comment-container").find('.reply-field');
    $sendBtn = $clickedSticker.closest("#comment-container").find('.comments__reply-btn');
  }

  // or if edit field opens now, select "reply comment message" buttons in variables
  if ($clickedSticker.closest("#comment-container").find('.edit-comment.Open').length > 0) {
    $textField = $clickedSticker.closest("#comment-container").find('.edit-field');
    $sendBtn = ''; // sending only by click on "save" button
  }

  // if sending a sticker
  if ($clickedSticker.hasClass('sticker')) {
    imgCode = $clickedSticker.find('img').attr('data-sticker');
    $textField.html(imgCode);
    $sendBtn.click();
    $textField.focus();
    type = 'sticker';
    img = getStickerImg($clickedSticker);
  }
  // if sending a smile
  else {
    imgCode = $clickedSticker.attr('data-smile').substring(4, 8);
    var smileImg = '<div class="sprite-smile-16 st-sm-16-' + imgCode + '" contenteditable="false"></div>';
    $textField.html($textField.html() + smileImg);
    cursorToTheEnd($textField[0]);  // move focus cursor to the end of text
    type = 'smile';
    img = 0;
  }

  self.updateStickersFavorites({imgCode: imgCode, img: img, type: type});

  // helper function
  function getStickerImg($sticker) {
    var imgSrc = $sticker.find('img').attr('src');
    var index = imgSrc.indexOf('/media/sticker/');

    return imgSrc.substring(index);
  }
};

/** Change sticker set **/
StickersAndEmoji.prototype.changeSet = function ($clickedSet) {
  if ($clickedSet.hasClass("active")) return;

  $clickedSet.parent().children().removeClass("active").filter($clickedSet).addClass("active");

  var stickerSet = $clickedSet.attr("data-sticker-set");

  $clickedSet.closest(".sticker-wrapper").find(".sticker-container").not("#" + stickerSet).fadeOut(0);
  $("#" + stickerSet).fadeIn(0);
};

/** Get sticker favorites **/
StickersAndEmoji.prototype.insertFavorites = function () {
  var self = this;
  var favoriteStickers = '';
  var favoriteSmiles = '';

  $.each(self.favorites, function (i, item) {
    if (item.type === 'sticker') {
      favoriteStickers +=
        '<figure class="sticker send-smile" style="margin-right: 1px;"> \
           <img src="https://emosmile.com' + item.img + '" data-sticker="' + item.imgCode + '" alt="smile"> \
        </figure>';
    } else {
      favoriteSmiles +=
        '<i class="sprite-smile send-smile st-sm-' + item.imgCode + '" data-smile="&amp;sm-' + item.imgCode + '"></i>';
    }
  });

  $('.recent-smiles-wrapper', '#favorites-set').html(favoriteSmiles);
  $('.recent-stickers-wrapper', '#favorites-set').html(favoriteStickers);
};

/** Update favorites on server **/
StickersAndEmoji.prototype.updateStickersFavorites = function (obj) {
  var self = this;

  var sendData = {
    hash: user.info.hash,
    imgCode: obj.imgCode,
    img: obj.img,
    type: obj.type
  };

  //  request: updateStickersFavorites, no response
  // sticker favorites will be updates when user send message
  self.socket.emit('updateStickersFavorites', JSON.stringify(sendData));
};


/** Stickers for settings page **/
StickersAndEmoji.prototype.allStickersInit = function (sendData) {
  var self = this;

  if (!self.allStickers) {
    self.socket.emit('getAllStickers', JSON.stringify(sendData));

    self.socket.on('stickersAll', function (data) {
      data = JSON.parse(data);
      self.allStickers = data.pack;

      // insert favorites into array
      console.log(data.favorites);
      if(data.favorites) {
        if(typeof data.favorites === "string"){
          self.favoritePacks = data.favorites.split(',');
        } else {
          self.favoritePacks = data.favorites
        }
        self.insertUserStickerPacks();
      }

      self.insertAllStickerPacks();
    });
  } else {
    self.insertAllStickerPacks();
    self.insertUserStickerPacks();
  }
};

StickersAndEmoji.prototype.insertAllStickerPacks = function () {
  var self = this;
  var allStickersHtml = '';

  for (var item in self.allStickers) {
    var pack = self.allStickers[item];
    var active = '';

    // active class for stations which in favorites
    if (self.favoritePacks.includes('' + item)) {
      active = 'active';
    }

    var packHtml =
      '<div class="preview-place ' + active + '" data-pack-id="' + item + '" data-pack-name="' + pack.packName + '">\
              <div class="top-add">\
                  <div class="sticker-choose-title">' + pack.packName + '</div>\
              </div>\
               <div class="img-holder">\
                 <img src="https://emosmile.com' + pack.mainSticker + '" alt="smile">\
			         <div class="add-hover">' +
				      lang.lStickPackAdd +
				     '</div>\
				    </div>\
				  <div class="bottom-add">\
				    <div class="sticker-choose-title">' + lang.lStickPackPreview + '</div>\
				  </div>\
				</div>';
    allStickersHtml += packHtml;
  }

  $('#stickers-list').html(allStickersHtml);
};

StickersAndEmoji.prototype.insertUserStickerPacks = function () {
  var self = this;

  // insert user's sticker packs from favorites
  self.favoritePacks.forEach(function (favoritePack, i, arr) {
    for (var pack in self.allStickers) {
      if (+favoritePack === +pack) {
        var $emptyWindow = $(".sticker-place.empty", "#user-stickers ");
        var stickerTemplate =
          '<div class="top-add">\
              <div class="sticker-choose-title">' + self.allStickers[pack].packName + '</div>\
            </div>\
            <div class="img-holder">\
             <img src="https://emosmile.com' + self.allStickers[pack].mainSticker + '" alt="smile">\
			 <div class="remove-sticker-pack">\
			 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14">\
         <path fill="gray" d="M15 14h-3L7.6 8.3l-5 5.7H0l6-7L.2 0h3l4.4 5.6L12.2 0H15L9 7"></path>\
       </svg>\
			 </div>\
			</div>\
			<div class="bottom-add">\
				<div class="sticker-choose-title">' + lang.lStickPackPreview + '</div>\
			</div>';

        $emptyWindow.first().html(stickerTemplate).removeClass("empty").attr('data-pack-id', +pack);
      }
    }
  });
};


/** CORRECTLY REMOVE CHANNEL TO FAVORITES **/
StickersAndEmoji.prototype.removePackFromFavorite = function (packId) {
  var self = this;
  packId = +packId;

  var indexToRemove = self.favoritePacks.indexOf(packId);
  self.favoritePacks.splice(indexToRemove, 1);
  self.updateFavoriteStickerPacks();
};

StickersAndEmoji.prototype.getStickersFavorites = function () {
  var self = this;

  var userObj = user.info;
  if (!!userBots.selectedBot) {
    userObj = userBots.selectedBot;
  }

  // var favoritePacksStr = stickersAndEmoji.favoritePacks.join(',');
  self.socket.emit('getStickersFavorites', JSON.stringify({hash: userObj.hash}));
};

StickersAndEmoji.prototype.addStickerPackToFavorite = function (packId) {
  var self = this;
  packId = +packId;

  // if channel already exists in favorites
  if (packId in self.favoritePacks) return;

  if (self.favoritePacks.length < 6) {
    self.favoritePacks.push(packId);
  } else {
    self.favoritePacks.shift(); // delete first element of favorite array
    self.favoritePacks.push(packId);
  }
  self.updateFavoriteStickerPacks();
};

/** UPDATE FAVORITE CHANNELS **/
StickersAndEmoji.prototype.updateFavoriteStickerPacks = function () {
  var self = this;
  // clean up empty slots in favorites array
  for (var i = 0; i < self.favoritePacks.length; i++) {
    if (!self.favoritePacks[i]) {
      self.favoritePacks.splice(i, 1);
    }
  }

  // insert favorite in cookie even if no user's favorites
  // var favoritePacksStr = stickersAndEmoji.favoritePacks.join(',');
  self.socket.emit('updateFavoriteStickerPacks', JSON.stringify({
    hash: user.hash,
    packs: self.favoritePacks
  }));
};


/** GIFTS **/
StickersAndEmoji.prototype.getAllGifts = function () {
  var self = this;
  self.socket.emit('getAllGifts', JSON.stringify({hash: user.hash}));
};
'use strict';

function StickersAndEmoji(socket) {
  this.socket = socket;

  // stickers and emoji
  this.allStickers = false;
  this.favoritePacks = [];
  this.purchasedPacks = {};
  this.stickerPackPrice = 0;
  this.favorites = false;
  this.stickers = {};
  this.stickersImg = {};
  this.gifts = {};
  this.container = {}; // jQuery wrapper for stickers and emoji
  this.activePackId = false; // visible pack of stickers
  this.isStickersExists = false;
}

StickersAndEmoji.prototype.init = function(options) {
  var self = this;

  self.socket = options.socket;
  self.userHash = options.userHash;
  self.container = options.container;
  self.initSocketHandlers();
  self.initEventHandlers();
  self.socket.emit('getUserStickers', JSON.stringify({hash: self.userHash}));
};

/** Socket handlers for stickers and emoji **/
StickersAndEmoji.prototype.initSocketHandlers = function() {
  var self = this;

  // insert stickers when received
  self.socket.off('userStickers', insertStickers).on('userStickers', insertStickers);
  function insertStickers(data){
    data = JSON.parse(data);

    var $container = $(self.container);

    // smiles images for decode text in input
    self.stickersImg = data.stickers.images;

    if(data.favoritePacks) {
      self.favoritePacks = data.favoritePacks;
    }
    if(data.favorites) {
      self.favorites = data.favorites;
    }

    // pass stickers and smiles into handler
    self.stickers = self.createSticker(data.stickers.pack, data.stickers.smiles, self.favoritePacks);

    // insert into HTML
    $container.empty().append(self.stickers);

    // check that stickers already received
    self.isStickersExists = true;

    // start click handler for stickers
    touchRowSliderInit();
  }

  /** Insert sticker favorites **/
  self.socket.off('stickersFavorites').on('stickersFavorites', function(data) {
    self.favorites = JSON.parse(data);

    if($('#favorites-set').length > 0){
      self.insertFavorites(data);
    } else {
      self.socket.emit('getUserStickers', JSON.stringify({hash: self.userHash}));
    }
  });
};

/** Event handlers for stickers and emoji **/
StickersAndEmoji.prototype.initEventHandlers = function() {
  var self = this;


};

StickersAndEmoji.prototype.createSticker = function(stickersData, smilesData, favorites) {
  var self = this;
  var pack = '';
  var buttons = '';

  // favorites and smiles containers
  if(self.favorites){
    buttons += self.createFavoritesBtn('active');
    pack += self.createFavoritesContainer('active');
    buttons += self.createSmilesButton();
    pack += self.createSmilesContainer(smilesData);
  } else {
    buttons += self.createSmilesButton('active');
    pack += self.createSmilesContainer(smilesData, 'active');
  }

  self.favoritePacks.forEach(function (value, i, arr){
    if(+value in stickersData){
      var stickerObj = stickersData[+value];
      buttons += '<div class="sticker-set-btn" title="Choose sticker pack"  data-sticker-set="sticker-set-' + value + '"><img src="https://emosmile.com' + stickerObj.mainSticker + '" ></div>';
      pack += '<div id="sticker-set-' + value + '" class="sticker-container">';

      $.each(stickerObj.stickers, function(i, item) {
        pack +=
          '<figure class="sticker send-smile"> \
               <img src="https://emosmile.com' + item.stickerImg + '" data-sticker="&s-' + item.stickerId + ';" alt="smile" > \
           </figure>';
      });
      pack += '</div>';
    }
  });

  var stickerBox =
  '<div class="close-smiles-wide-button"></div>\
     ' + pack + '\
     <div class="sticker-pack-set-wrap">\
       <div class="sticker-set-btn-container"> \
         ' + buttons + '\
       </div>\
     </div>';

  return stickerBox;
};

/** Add favorites button function **/
StickersAndEmoji.prototype.createFavoritesBtn = function(active) {
  active = active ? 'active' : '';

  var favoritesImg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27">\
       <g opacity=".4" fill="#4E4E4E">\
         <path d="M23.1 4C17.8-1.3 9.2-1.3 4 3.9-1.3 9.2-1.3 17.7 4 23c5.3 5.3 13.8 5.3 19.1 0 5.2-5.2 5.2-13.8\
               0-19zm-1.5 17.6C17.1 26 9.9 26 5.4 21.6 1 17.1 1 9.9 5.4 5.4 9.9 1 17.1 1 21.6 5.4c4.4 4.5 4.4 11.7 0 16.2z"/>\
         <path d="M20.2 13.4h-6.1V6.2c0-.7-.5-1.2-1.1-1.2-.6 0-1.1.5-1.1 1.1v8.4c0 .6.5 1.1 1.1 1.1h7.2c.6 0 1.1-.5 1.1-1.1 0-.6-.5-1.1-1.1-1.1zm0 0"/>\
       </g>\
     </svg>';

  return '<div \
                class="sticker-set-btn ' + active + '" \
                title="Favorite smiles & stickers"  \
                data-sticker-set="favorites-set">\
             ' + favoritesImg + '\
            </div>';
};

/** Add favorites container **/
StickersAndEmoji.prototype.createFavoritesContainer = function(active) {
  var self = this;
  var favoriteStickers = '';
  var favoriteSmiles = '';
  active = active ? 'active' : '';

  $.each(self.favorites, function(i, item) {
    if(item.type === 'sticker') {
      favoriteStickers +=
        '<figure class="sticker send-smile" style="margin-right: 1px;"> \
           <img src="https://emosmile.com' + item.img + '" data-sticker="' + item.imgCode + '" alt="smile" > \
        </figure>';
    } else {
      favoriteSmiles +=
        '<i class="sprite-smile send-smile st-sm-' + item.imgCode + '" data-smile="&amp;sm-' + item.imgCode + '" onclick="sendSm(event)"></i>';
    }
  }); 

  var favoritesHtml =
    '<div id="favorites-set" class="sticker-container '+ active +'">\
       <div class="recent-smiles-wrapper">\
         '+ favoriteSmiles +'\
       </div>\
       <div class="recent-smiles-stickers-divider"></div>\
       <div class="recent-stickers-wrapper">\
         '+ favoriteStickers +'\
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

  return '<div \
                class="sticker-set-btn ' + active + '" \
                title="Choose smiles pack"  \
                data-sticker-set="smile-set-1">\
             ' + smilesImg + '\
            </div>';
};

/** Add smiles container to stickers container **/
StickersAndEmoji.prototype.createSmilesContainer = function(smilesData, active) {
  var smiles = '';
  active = active ? 'active' : '';

  $.each(smilesData, function(k, value) {
    smiles +=
      '<i class="sprite-smile send-smile st-sm-' + k + '" \
            data-smile="&sm-' + value.smileId + ';" \
            data-smile-text="' + value.smileText + '" \
            title="' + value.smileText + '" \
            onclick="sendSm(event)">\
         </i>';
  });

  return '<div id="smile-set-1" class="sticker-container ' + active + '">' + smiles + '</div>';
};

/** Handle stickers on send **/
StickersAndEmoji.prototype.sendSticker = function($clickedSticker, $textField, $sendBtn) {
  var self = this;
  var img,
    imgCode,
    type;

  // if this is reply comment - select "reply comment message" buttons in variables
  if($clickedSticker.closest("#comment-container").find('.reply-field').length > 0) {
    $textField = $clickedSticker.closest("#comment-container").find('.reply-field');
    $sendBtn = $clickedSticker.closest("#comment-container").find('.comments__reply-btn');
  }

  // or if edit field opens now, select "reply comment message" buttons in variables
  if($clickedSticker.closest("#comment-container").find('.edit-comment.Open').length > 0) { 
    $textField = $clickedSticker.closest("#comment-container").find('.edit-field');
    $sendBtn = ''; // sending only by click on "save" button
  }

  // if sending a sticker
  if($clickedSticker.hasClass('sticker')) {
    imgCode = $clickedSticker.find('img').attr('data-sticker');
    $textField.html(imgCode);
    $sendBtn.trigger("touchstart");
    $textField.focus();
    type = 'sticker';
    img = getStickerImg($clickedSticker);
  }
  // if sending a smile
  else {
    imgCode = $clickedSticker.attr('data-smile').substring(4, 8);
    var smileImg = '<div class="sprite-smile-23 st-sm-23-' + imgCode + '" contenteditable="false"></div>';
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

/** Get sticker favorites **/
StickersAndEmoji.prototype.insertFavorites = function() {
  var self = this;
  var favoriteStickers = '';
  var favoriteSmiles = '';

  $.each(self.favorites, function(i, item) {
    if(item.type === 'sticker') {
      favoriteStickers +=
        '<figure class="sticker send-smile" style="margin-right: 1px;"> \
           <img src="https://emosmile.com' + item.img + '" data-sticker="' + item.imgCode + '" alt="smile"> \
        </figure>';
    } else {
      favoriteSmiles +=
        '<i class="sprite-smile send-smile st-sm-' + item.imgCode + '" data-smile="&amp;sm-' + item.imgCode + '" onclick="sendSm(event)"></i>';
    }
  });

  $('.recent-smiles-wrapper','#favorites-set').html(favoriteSmiles);
  $('.recent-stickers-wrapper','#favorites-set').html(favoriteStickers);
};

/** Update favorites on server **/
StickersAndEmoji.prototype.updateStickersFavorites = function(obj) {
  var self = this;

  var sendData = {
    hash: self.userHash,
    imgCode: obj.imgCode,
    img: obj.img,
    type: obj.type
  };

  //  request: updateStickersFavorites, no response
  // stiker favrotites will be updates when user send message
  self.socket.emit('updateStickersFavorites', JSON.stringify(sendData));
};

StickersAndEmoji.prototype.getStickersFavorites = function (){
  var self = this;

  // var favoritePacksStr = stickersAndEmoji.favoritePacks.join(',');
  self.socket.emit('getStickersFavorites', JSON.stringify({hash:  self.userHash}));
};

/** Instead of instant sending sticker to server, this func add sticker to message body, as is it was an emoji **/
StickersAndEmoji.prototype.sendEmailSticker = function ($clickedSticker, $textField, $sendBtn){
  var self = this;

  var img;
  var imgCode;
  var type;

  // if sending a sticker
  if($clickedSticker.hasClass('sticker')) {
    imgCode = $clickedSticker.find('img').attr('data-sticker');
    $textField.html($textField.html() + $clickedSticker.html());
    type = 'sticker';
    img = getStickerImg($clickedSticker);
  } 
  // if sending a smile
  else {
    imgCode = $clickedSticker.attr('data-smile').substring(4, 8);
    var smileImg = '<div class="sprite-smile-23 st-sm-23-' + imgCode + '" contenteditable="false"></div>';
    $textField.html($textField.html() + smileImg);
    type = 'smile';
    img = 0;
  }
  
  cursorToTheEnd($textField[0]);  // move focus cursor to the end of text

  // helper function
  function getStickerImg($sticker) {
    var imgSrc = $sticker.find('img').attr('src');
    var index = imgSrc.indexOf('/media/sticker/');

    return imgSrc.substring(index);
  }
};


/** Stickers for settings page **/
StickersAndEmoji.prototype.allStickersInit = function(sendData) {
  var self = this;

  if(!self.allStickers) {
    self.socket.emit('getAllStickers', JSON.stringify(sendData));

    self.socket.on('stickersAll', function(data) {
      data = JSON.parse(data);
      self.allStickers = data.pack;
      self.stickerPackPrice = data.stickerPackPrice;

      // insert favorites into array
      if(data.favorites) {
        if(typeof data.favorites === "string"){
          self.favoritePacks = data.favorites.split(',');
        } else {
          self.favoritePacks = data.favorites
        }
        self.insertFavoriteStickerPacks();
      }

      // insert purchased packs into object
      if(data.purchasedPacks) {
        for(var i = 0; i < data.purchasedPacks.length; i++){
          self.purchasedPacks[data.purchasedPacks[i].stickerPackId] = true;
        }

        self.insertPurchasedPacks();
      }

      self.insertAllStickerPacks();
    });
  } else {
    self.insertAllStickerPacks();
    self.insertFavoriteStickerPacks();
    self.insertPurchasedPacks();
  }
};

StickersAndEmoji.prototype.insertAllStickerPacks = function() {
  var self = this;
  var allStickersHtml = '';

  for(var item in self.allStickers) {
    var pack = self.allStickers[item];

    // check if pack already purchased
    if(item in self.purchasedPacks){
      continue
    }

    var packHtml ='<div class="pack-row" data-pack-id="' + item + '" data-pack-name="' + pack.packName + '" data-pack-price="'+ self.stickerPackPrice +'">\
           <div class="pack-preview">\
             <img src="https://emosmile.com' + pack.mainSticker + '" alt="sticker pack">\
           </div>\
           <div class="controls">\
             <div class="preview-button">Preview</div>\
             <div class="install-button buy-button"><div class="price-ico"></div>'+ self.stickerPackPrice +'</div>\
           </div>\
         </div>';

    allStickersHtml += packHtml;
  }

  $('#purchased-stickers').append(allStickersHtml);
};

StickersAndEmoji.prototype.insertFavoriteStickerPacks = function() {
  var self = this;

  // insert user's sticker packs from favorites
  self.favoritePacks.forEach(function(favoritePack, i, arr) {
    for(var pack in self.allStickers) {
      if(+favoritePack === +pack) {
        var $emptyWindow = $('.sticker-place.empty', '#user-stickers').first();
        var stickerTemplate =
          '<div class="top-add">\
              <div class="sticker-choose-title">'+ self.allStickers[pack].packName +'</div>\
            </div>\
            <div class="img-holder">\
             <img src="https://emosmile.com' + self.allStickers[pack].mainSticker + '" alt="sticker" alt="smile">\
			 <div class="remove-sticker-pack">\
			 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14">\
         <path fill="gray" d="M15 14h-3L7.6 8.3l-5 5.7H0l6-7L.2 0h3l4.4 5.6L12.2 0H15L9 7"></path>\
       </svg>\
			 </div>\
			</div>\
			<div class="bottom-add">\
				<div class="sticker-choose-title">Preview</div>\
			</div>';

        $emptyWindow.removeClass("empty").attr('data-pack-id', +pack);
        $emptyWindow.html(stickerTemplate);
      }
    }
  });
};

StickersAndEmoji.prototype.insertPurchasedPacks = function (){
  var self = this;
  var allPurchasedStickers = '';

  // insert bought sticker packs
  for(var item in self.allStickers){
    var pack = self.allStickers[item];

    // pass sticker pack in favorites
    for(var y = 0; y < self.favoritePacks.length; y++){
      if(+self.favoritePacks[y] === +item){
        continue;
      }
    }

    if(item in self.purchasedPacks){
      var packHtml =
        '<div class="pack-row" data-pack-id="' + item + '" data-pack-name="' + pack.packName + '">\
           <div class="pack-preview">\
             <img src="https://emosmile.com' + pack.mainSticker + '" alt="sticker">\
           </div>\
           <div class="controls">\
             <div class="preview-button">Preview</div>\
             <div class="install-button">install</div>\
           </div>\
         </div>';

      allPurchasedStickers += packHtml;
    }
  }

  $('#purchased-stickers').append(allPurchasedStickers);
};

/** CORRECTLY REMOVE CHANNEL TO FAVORITES **/
StickersAndEmoji.prototype.removePackFromFavorite = function(packId) {
  var self = this;

  var indexToRemove = self.favoritePacks.indexOf(packId + '');
  self.favoritePacks.splice(indexToRemove, 1);
  self.updateFavoriteStickerPacks();
};


StickersAndEmoji.prototype.getStickersFavorites = function (){
  var self = this;

  var hash = userHash;

  if(typeof userBots != 'undefined'){
    if(userBots.selectedBot) {
      hash = userBots.selectedBot.hash;
    }
  }

  // var favoritePacksStr = stickersAndEmoji.favoritePacks.join(',');
  self.socket.emit('getStickersFavorites', JSON.stringify({hash: hash}));
};

StickersAndEmoji.prototype.addStickerPackToFavorite = function() {
  var self = this;

  self.favoritePacks = [];
  var $userStickers = $('.sticker-place[data-pack-id]', '#user-stickers');
  $userStickers.each(function (){
    self.favoritePacks.push($(this).attr('data-pack-id'));
  });

  self.updateFavoriteStickerPacks();
};

/** UPDATE FAVORITE CHANNELS **/
StickersAndEmoji.prototype.updateFavoriteStickerPacks = function() {
  var self = this;
  // clean up empty slots in favorites array
  for(var i = 0; i < self.favoritePacks.length; i++) {
    if(!self.favoritePacks[i]) {
      self.favoritePacks.splice(i, 1);
    }
  }
  
  self.socket.emit('updateFavoriteStickerPacks', JSON.stringify({
    hash: userHash,
    packs: self.favoritePacks
  }));
};


/** GIFTS **/
StickersAndEmoji.prototype.getAllGifts = function (){
  var self = this;
  self.socket.emit('getAllGifts', JSON.stringify({hash: userHash}));
};
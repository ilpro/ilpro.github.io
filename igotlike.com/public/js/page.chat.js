'use strict';
var stickersAndEmoji = new StickersAndEmoji();
var user = new User();
var message = new Message();
var chat = new Chat(dataSocket);
var chatList = new ChatList(dataSocket);

/** Start  page chat **/
var pageChat = {
  userHash: false,
  userId: false,
  socket: {},
  cost: {
    emoji: 3,
    sticker: 5,
    symbol: 1,
  },
  firstMessageId: false,
  isFirstLoad: true,

  init: function init(params) {
    var self = this;

    self.socket = params.socket;
    self.userHash = params.userHash;
    self.userId = $('.page-chat').attr('data-user-id');

    $('#chat-header').show();

    // get stickers  and smiles packs before comments will load to correctly display stickers in html
    // request: sticker, response: stickers
    stickersAndEmoji.init({
      container: '.smiles-wrapper',
      socket: self.socket,
      insert: true,
      userId: self.userId,
      userHash: self.userHash
    });

    // check if page has hash in url query and show chat with specified user or message list
    $(window).on('hashchange', self.route.bind(pageChat));
    $(window).trigger("hashchange");

    // insert chat message or increase notification count
    self.socket.on('chatMessage', function (data) {
      data = JSON.parse(data);

      // check if messages list opens - update list and update total messages count
      if ($('.page-messages-list:visible').length) {
        notifications.changeChatCount(+1);
        chatList.getLastChatUsers();
      }
      // check if chat with specified user opens, check this recipient ID, if it differ, change notifications count
      else {
        if (self.isChatOpensWithCurrentRecipient(data.senderId, data.recipientId)) {
          chat.insertMessage(data);
          stickersAndEmoji.getStickersFavorites();
        } else {
          notifications.changeChatCount(+1);
        }
      }
    });

    // update user info
    self.socket.on('userInfoById', function (data) {
      self.updateRecipientInfo(JSON.parse(data));
    });
  },

  /** Checks if current chat open with received recipientId **/
  isChatOpensWithCurrentRecipient: function (senderId, recipientId) {
    var self = this;

    if ((senderId == chat.recipientId && recipientId == +self.userId ||
      senderId == +self.userId && recipientId == chat.recipientId)) {
      return true;
    } else {
      return false;
    }
  },

  /** Check if page has hash in url query and show chat with specified user or message list **/
  route: function () {
    var self = this;

    // check if stickers exists
    if (!stickersAndEmoji.isStickersExists) {
      setTimeout(function () {
        self.route();
      }, 100);
      return;
    }

    var chatUserId = urlHash.getState('id') ? urlHash.getState('id') : false;

    if (chatUserId) {
      $('.page-messages-list, .read-all-btn').hide();
      $('.page-chat, .block-status-btn').show();
      $('.messages-wrapper').empty();

      self.getUserInfoById(chatUserId);
      chat.init(chatUserId);
    } else {
      $('.page-chat, .block-status-btn').hide();
      $('.user-search').val('');
      // close smiles tab
      if ($('.open-chat-smiles-ico').hasClass("opened")) {
        $(".smiles-wrapper, .close-chat-smiles-ico, .open-chat-smiles-ico").toggleClass("opened");
      }

      $('.page-messages-list, .read-all-btn').show();
      $('.header-profile-info','.header-mobile').hide();

      // self.getUserInfoById(self.userId);
      chatList.init();
    }
  },

  getUserInfoById: function (id){
    var self = this;
    self.socket.emit('getUserInfoById', JSON.stringify({userId: id}));
  },

  updateRecipientInfo: function (recipientObj) {
    var self = this;
    var recipientPhoto = user.getPhoto(recipientObj.userPhoto, recipientObj.userName);

    var $header = $('.header-profile-info');

    $('.user-avatar', $header).html(recipientPhoto);
    $('.recipient-id', $header).html('ID:' + recipientObj.userId);
    $('.nickname', $header).html(recipientObj.userName);
    $('.recipient-residence .user-city', $header).html(recipientObj.userCity);
    $('.recipient-residence .user-country', $header).html(recipientObj.userCountry);

    if (recipientObj.age) {
      $('.recipient-age', $header).html(recipientObj.age + ' years, ');
    }

    $('.header-profile-info','.header-mobile').show();
  }
};

var params = {
  userHash: userHash,
  socket: dataSocket
};

pageChat.init(params);
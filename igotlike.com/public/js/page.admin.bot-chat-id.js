'use strict';
var stickersAndEmoji = new StickersAndEmoji();
var user = new User();
var message = new Message();
var botChat = new BotChat(dataSocket);
var botChatList = new BotChatList(dataSocket);

/** Start  page chat **/
var params = {
  userHash: userHash,
  socket: dataSocket
};

var pageBotChat = {
  userHash: false,
  userId: false,
  botId: false,
  botHash: false,
  socket: {},
  firstMessageId: false,
  isFirstLoad: true,

  init: function init(params) {
    var self = this;

    self.socket = params.socket;
    self.botHash = $('.page-chat').attr('data-bot-hash');
    self.userId = $('.page-chat').attr('data-user-id');

    // for bots
    self.botId = $('.page-chat').attr('data-bot-id');
    self.socket.emit('bindBotToAdmin', JSON.stringify({adminId: self.userId, botId: self.botId}));

    // get bot info like city, character etc
    self.getBotInfoById();

    // get stickers  and smiles packs before comments will load to correctly display stickers in html
    // request: sticker, response: stickers
    stickersAndEmoji.init({userHash: self.botHash, container: '.smiles-wrapper', socket: self.socket, insert: true});

    // check if page has hash in url query and show chat with specified user or message list
    $(window).on('hashchange', self.route.bind(pageBotChat));
    $(window).trigger("hashchange");
    
    // insert chat message or increase notification count
    self.socket.on('chatMessage', function (data) {
      data = JSON.parse(data);

        //play sound for all incoming messages
        var notifSound = new Audio('/media/sound/notification.mp3');
        notifSound.play();

      // check if messages list opens - update list and update total messages count
      if ($('.page-messages-list:visible').length) {
        botChatList.getLastChatUsers();
      }
      // check if chat with specified user opens, check this recipient ID, if it differ, change notifications count
      else {
        if(self.isChatOpensWithCurrentRecipient(data.senderId, data.recipientId)){
          botChat.insertMessage(data);
          stickersAndEmoji.getStickersFavorites();
        } else {
          notifications.changeChatCount(+1);
        }
      }
    });

    $('body').addClass('page-bot-chat');
  },

  /** Checks if current chat open with received recipientId **/
  isChatOpensWithCurrentRecipient: function (senderId, recipientId){
    var self = this;

    if((senderId == botChat.recipientId && recipientId == +self.botId ||
      senderId == +self.botId && recipientId == botChat.recipientId)){
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
      $('.page-messages-list').hide();
      $('.page-chat').show();
      $('.messages-wrapper').empty();
      // chat.recipientId = chatUserId;
      botChat.init(chatUserId);
    } else {
      $('.page-chat').hide();

      // close smiles tab
      if ($('.open-chat-smiles-ico').hasClass("opened")) {
        $(".smiles-wrapper, .close-chat-smiles-ico, .open-chat-smiles-ico").toggleClass("opened");
      }

      $('.page-messages-list').show();
      // chat.recipientId = false;
      botChatList.init();
    }
  },

  getBotInfoById: function(){
    var self = this;

    self.socket.emit('getBotInfo', JSON.stringify({botId: self.botId}));
    self.socket.on('botInfo', function (data){
      data = JSON.parse(data);
      self.insertBotInfo(data);
    });
  },

  insertBotInfo: function(data){
    var self = this;
    var botObj = data[0];
    var botName = botObj.userName;
    
    var userInfoHtml =
      '<div class="page-head chat">\
         <div class="clickable-areas">\
           <a href="/bot-chat" class="back-to-list-button">\
             ' + svgObj.backToChatArrow() + '\
           </a>\
         </div>\
       </div>\
      <a href="https://m.pickbride.com/profile/'+ botObj.userId +'" class="bot-info">' +
        '<div style="text-align: center"><b>'+ botName +'</b></div>\
           <div class="bot-info__block">\
             <h3 class="bot-info__subheader">About myself:</h3>\
             <p>' + botObj.userAboutMyself +'</p>\
           </div>\
           <div class="bot-info__block">\
             <h3>Character:</h3>\
             <p>' + botObj.userCharacter +'</p>\
           </div>\
           <div class="bot-info__block">\
             <h3>Hobbies</h3>\
             <p>'+ botObj.userHobbies +'</p>\
           </div>\
           <div class="bot-info__block">\
             <h3>Interests</h3>\
             <p>'+ botObj.userInterest +'</p>\
           </div>\
        </a>\
      <div class="bot-info-toggle" style="display: none">\
        <svg class="bot-arrow-svg rotated" xmlns="http://www.w3.org/2000/svg" width="15" height="12" viewBox="0 0 21 17">\
          <path fill="none" stroke="#FFF" stroke-width="2" stroke-miterlimit="10" d="M2.2 8.5l18.8.1-18.8-.1z"></path>\
          <path fill="#FFF" d="M8.8 17l1.3-1.6-7.2-6.9 7.3-6.9L8.9 0 0 8.5"></path>\
        </svg>\
      </div>';

    $('.center-content').html(userInfoHtml);
  },
};

pageBotChat.init(params);
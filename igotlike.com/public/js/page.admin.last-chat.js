'use strict';
/** Start  page chat **/
var user = new User();
var message = new Message();
var stickersAndEmoji = new StickersAndEmoji(dataSocket);

var pageLastMessages = {
  socket: dataSocket,
  usersContainer: '.messages-wrapper',
  userId: $('.page-chat').attr('data-user-id'),
  botsArr: [],

  init: function () {
    var self = this;

    self.socket = dataSocket;
    self.initSocketHandlers();
    stickersAndEmoji.init({userHash: getCookie('hash'), container: '.smiles-wrapper', socket: self.socket, insert: true});

    self.getLastMessages();
  },


  /** Get last messages **/
  getLastMessages: function (timer) {
    var self = this;

    // check if stickers exists
    if (!stickersAndEmoji.isStickersExists) {
      setTimeout(function () {
        self.getLastMessages(timer);
      }, 100);
      return;
    }

    self.socket.emit('getLastChatMessages', JSON.stringify({hash: userHash}));
    
    if (timer) {
      setTimeout(function () {
        self.getLastMessages(timer);
      }, timer);
    }
  },

  /** Socket listeners **/
  initSocketHandlers: function () {
    var self = this;
    self.socket.on('lastChatMessages', function (data) {
      data = JSON.parse(data);
      self.insertMessages(data);
    })
  },

  /** Insert users into HTML **/
  insertMessages: function (data) {
    var self = this;
    var allHtml = '';

    for (var i = 0; i < data.length; i++) {
      allHtml += self.getChatUserTemplate(data[i]);
    }

    $('.page-messages-list').html(allHtml).show();
  },

  getChatUserTemplate: function (userObj) {
    var self = this;

    if(!userObj.receiverId || !userObj.senderId) return;

    var senderName = userObj.senderName;
    var senderPhoto = userObj.senderPhoto;

    var receiverName = userObj.receiverName;
    var receiverPhoto = userObj.receiverPhoto;

    var text = message.parseMessage(userObj.messageText);

    var date = new Date(userObj.messageTime);
    var month = ["января","февраля","марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    var html =
      '<div class="user-box">\
         <div class="msg-time">' + date.getDate() + ' ' + month[date.getMonth()] + ', в ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '</div>\
         <div class="flex-row">\
           <a class="flex-row-sub" href="/profile/' + userObj.senderId + '">\
             <div class="avatar-holder">\
               <div class="user-avatar" title="">\
                 <img src="'+ senderPhoto +'" alt="user" style="max-height: 100%;">\
               </div>\
             </div>\
             <div class="id-box">\
               <div class="id">' + userObj.senderId + '</div>\
             </div>\
             <div class="name">' + senderName + '</div>\
           </a>\
           <span class="user-arrow">\
             <svg class="play-btn-svg" xmlns="http://www.w3.org/2000/svg" width="23" height="35" viewBox="0 0 23.1 34.86">\
               <path d="M2.6 34.86C1.1 34.86 0 34 0 32.82V2.04C0 .86 1.1 0 2.6 0c.74 0 1.4.22 1.85.6l17.83 14.8c.54.47.82 1.08.82 1.76 0 .8-.42 1.67-1.14 2.28l-17.5 14.8c-.47.4-1.12.62-1.86.62zM2 32.73c.1.05.3.13.6.13s.5-.08.55-.13l17.5-14.8c.32-.27.45-.58.45-.77 0-.08-.02-.15-.1-.23L3.15 2.13C3.1 2.1 2.9 2 2.6 2c-.3 0-.5.08-.6.13v30.6z" fill="#000">\
               </path>\
             </svg>\
           </span>\
           <a class="flex-row-sub" href="/profile/' + userObj.receiverId + '">\
             <div class="avatar-holder">\
               <div class="user-avatar" title="">\
                 <img src="'+ receiverPhoto +'" alt="user" style="max-height: 100%;">\
               </div>\
             </div>\
             <div class="id-box">\
               <div class="id">' + userObj.receiverId + '</div>\
             </div>\
             <div class="name">' + receiverName + '</div>\
           </a>\
          </div>\
          <div class="info-holder" style="width: 100%">\
            <div class="last-text">' + text + '</div>\
          </div>\
          <div class="separator-line"></div>\
        </div>';

    return html;
  }
};

pageLastMessages.init();
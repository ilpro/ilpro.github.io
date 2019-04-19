'use strict';

function BotChatList(socket) {
  this.socket = socket;
  this.isFirstLoad = true;
  this.userId = false;
  this.usersContainer = '';
};

BotChatList.prototype.init = function() {
  var self = this;

  self.userId = pageBotChat.userId;
  self.usersContainer = '.messages-wrapper';

  // get last chat users after stickers has come
  self.getLastChatUsers();

  $('.center-content .bot-info').hide();

  if(self.isFirstLoad) {
    self.isFirstLoad = false;
    self.initSocketHandlers();
    self.initEventHandlers();
  }

  // clear header from user info
  $('.to-profile-link').remove();
};

/** Socket listeners **/
BotChatList.prototype.initSocketHandlers = function() {
  var self = this;

  // insert chat messages
  self.socket.on('lastChattedUsers', function(data) {
    data = JSON.parse(data);
    self.insertBotChatList(data);
  });

  // insert found users
  self.socket.on('searchUsersInChat', function (data) {
    data = JSON.parse(data);
    self.insertChatList(data);
  });

  self.socket.on('userReadAllChatMessages', function (data) {
    self.getLastChatUsers();
  });
};

/** Event listeners **/
BotChatList.prototype.initEventHandlers = function() {
  var self = this;

  $(document).on('change','.user-search', function () {
    var searchStr = $(this).val();
    $('.page-messages-list').html('Loading...');
    self.getLastChatUsers(searchStr);
  });

  $(document).on('click','.user-search-cancel', function () {
    $('.user-search').val('');
    $('.page-messages-list').html('Loading...');
    self.getLastChatUsers();
  });

  $(document).on('click','.read-all-btn', function () {
    self.readAllMessages();
  });
};

/** User reads all unread messages **/
BotChatList.prototype.readAllMessages = function (){
  var self = this;
  self.socket.emit('readAllChatMessages', JSON.stringify({hash: pageBotChat.botHash}));
};

/** Request for last chat users **/
BotChatList.prototype.getLastChatUsers = function(search) {
  // request getLastChattedUsers, response: lastChattedUsers
  this.socket.emit('getLastChattedUsers', JSON.stringify({hash: pageBotChat.botHash, search: search}));
};

/** Search for any user **/
BotChatList.prototype.searchUser = function (search) {
  // request searchUsersInChat, response: searchUsersInChat
  this.socket.emit('searchUsersInChat', JSON.stringify({hash: pageBotChat.botHash, search: search}));
};


/** Insert users into HTML **/
BotChatList.prototype.insertBotChatList = function(data) {
  var self = this;
  var allHtml = '';

  for(var i = 0; i < data.length; i++) {
    if(!data[i].userId) continue;
    allHtml += self.getChatUserTemplate(data[i]);
  }

  $('.no-messages').hide();
  $('.page-messages-list').html(allHtml);
};

BotChatList.prototype.getChatUserTemplate = function(userObj) {
  var self = this;

  var photo = user.getPhoto(userObj.userPhoto, userObj.userName);
  var online = user.getOnline(userObj);
  var text = message.parseMessage(userObj.messageText);

  var onlineClass = 'offline';
  if(online === 'online') {
    onlineClass = 'online';
  }

  var unread = '';
  if(userObj.totalUnread > 0) {
    unread = '<div class="number unreaded">' + userObj.totalUnread + '</div>';
  } else {
    if(userObj.messageRead === 1) {
      unread = '<div class="message-state readed"></div>'
    } else {
      unread = '<div class="message-state sended"></div>';
    }
  }

  // check if user ready to talk only with favorites
  var chatStatus = '';
  switch (+userObj.userChatStatus){
    case 1:
      chatStatus = svgObj.msgAllow();
      break;
    case 2:
      chatStatus = svgObj.yellowHeart();
      break;
    case 3:
      chatStatus = svgObj.msgNotAllow();
      break;
  }


  var html =
    '<a href="#id=' + userObj.userId + '" class="main-info">\
         <div class="avatar-holder">\
           <div class="user-avatar" title="">\
             ' + photo + '\
           </div>\
         </div>\
         <div class="info-holder">\
           <div class="main-info-row">\
             <div class="id-box">\
               <div class="id">id:' + userObj.userId + '</div>\
             </div>\
             <div class="name">' + userObj.userName + '</div>\
             <div class="time">\
               <!--<div class="online-status ' + onlineClass + '">' + online + '</div>-->\
             </div>\
           </div>\
           <div class="last-text">\
             ' + text + '\
           </div>\
           <div class="unreaded-messages-count">\
             ' + unread + '\
           </div>\
         </div>\
         '+ chatStatus +'\
       </a>';

  return html;
};
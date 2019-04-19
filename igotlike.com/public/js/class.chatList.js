'use strict';

function ChatList(socket) {
  this.socket = socket;
  this.isFirstLoad = true;
  this.userId = false;
  this.usersContainer = '';
};

ChatList.prototype.init = function () {
  var self = this;

  self.userId = pageChat.userId;
  self.usersContainer = '.messages-wrapper';

  // get cached messages from storage and insert them into DOM
  var lastChattedCache = localStorage.getItem('lastChatFor' + self.userId);
  $('.page-messages-list').html(lastChattedCache);

  self.getLastChatUsers();

  if (self.isFirstLoad) {
    self.isFirstLoad = false;
    self.initSocketHandlers();
    self.initEventHandlers();
  }

  // clear header from user info
  $('.page-head.chat').empty();
};

/** Socket listeners **/
ChatList.prototype.initSocketHandlers = function () {
  var self = this;

  // insert chat messages
  self.socket.on('lastChattedUsers', function (data) {
    data = JSON.parse(data);
    self.insertChatList(data);
  });

  // insert found users
  self.socket.on('searchUsersInChat', function (data) {
    data = JSON.parse(data);
    self.insertFoundUsers(data);
  });

  self.socket.on('userReadAllChatMessages', function (data) {
    self.getLastChatUsers();
    notifications.getAllNotificationsCount();
  });
};

/** Event listeners **/
ChatList.prototype.initEventHandlers = function() {
  var self = this;

  $(document).on('change', '.user-search', function () {
    var searchStr = $(this).val();
    $('.page-messages-list').html('Loading...');
    self.searchUser(searchStr);
  });

  $(document).on('click','.user-search-cancel', function () {
    $('.user-search').val('');
    $('.page-messages-list').html('Loading...');
    self.getLastChatUsers();
  });

  $(document).on('click', '.read-all-btn', function () {
    self.readAllMessages();
  });
};

/** User reads all unread messages **/
ChatList.prototype.readAllMessages = function () {
  var self = this;
  self.socket.emit('readAllChatMessages', JSON.stringify({hash: userHash}));
};

/** Request for last chat users **/
ChatList.prototype.getLastChatUsers = function () {
  // request getLastChattedUsers, response: lastChattedUsers
  this.socket.emit('getLastChattedUsers', JSON.stringify({hash: userHash}));
};

/** Search for any user **/
ChatList.prototype.searchUser = function (search) {
  // request searchUsersInChat, response: searchUsersInChat
  this.socket.emit('searchUsersInChat', JSON.stringify({hash: userHash, search: search}));
};


/** Insert users into HTML **/
ChatList.prototype.insertChatList = function (data) {
  var self = this;
  var allHtml = '';

  for (var i = 0; i < data.length; i++) {
    if (!data[i].userId) continue;
    allHtml += self.getChatUserTemplate(data[i]);
  }

  $('.no-messages').hide();
  $('.page-messages-list').html(allHtml);

  // cache messages
  localStorage.setItem('lastChatFor' + self.userId, allHtml);
};

ChatList.prototype.getChatUserTemplate = function (userObj) {
  var self = this;

  var photo = user.getPhoto(userObj.userPhoto, userObj.userName);
  var online = user.getOnline(userObj);
  var text = '';

    // parse message text to insert stickers/smiles, highlight reference
    if (userObj.type === 'text'){
        text = message.parseMessage(userObj.messageText);
    } else if (userObj.type === 'sticker'){
        text = '<img src="' + userObj.link + '" alt="smile" contenteditable="false">';
    } else {
        text = message.parseMessage(userObj.messageText);
    }

  var onlineClass = 'offline';
  if (online === 'online') {
    onlineClass = 'online';
  }

  var unread = '';
  if (userObj.totalUnread > 0) {
    unread = '<div class="number unreaded">' + userObj.totalUnread + '</div>';
  } else {
    if (userObj.messageRead === 1) {
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
    '<a href="#id=' + userObj.userId + '" data-user-id="'+ userObj.userId +'" class="main-info">\
         <div class="avatar-holder">\
           <div class="user-avatar" title="">\
             ' + photo + '\
           </div>\
         </div>\
         <div class="info-holder">\
           <div class="main-info-row">\
             <div class="name">@' + userObj.userName + '</div>\
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

ChatList.prototype.insertFoundUsers = function (data) {
  var self = this;
  var allHtml = '';

  for (var i = 0; i < data.length; i++) {
    if (!data[i].userId) continue;
    allHtml += self.getChatUserTemplate(data[i]);
  }

  $('.no-messages').hide();
  $('.page-messages-list').html(allHtml);
};

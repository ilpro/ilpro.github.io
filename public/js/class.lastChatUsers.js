'use strict';
function LastChatUsers(socket) {
  this.socket = socket;
  this.userHash = userHash; // user hash which contains ID
  this.container = $('#chats'); // jQuery wrapper for all last chatted users in sidebar
  this.conversationsArr = []; // all users who have chat with current user
  this.isUsersReady = false; // bool, true means that all of the sidebar users received and inserted
}

/** Init  **/
LastChatUsers.prototype.init = function () {
  this.initSocketHandlers();
  this.getUsers();
};

/** Socket handlers**/
LastChatUsers.prototype.initSocketHandlers = function () {
  var self = this;

  // insert unread messages
  self.socket.off('getChatList').on('getChatList', function (data) {
    data = JSON.parse(data);
    if(!data.success) showAlertModal(data.message);
    self.insertLastChatUsers(data.chatList, data.eventConversationImage);
  });

  self.socket.off('searchUsersInChat').on('searchUsersInChat', function (data) {
    data = JSON.parse(data);
    if(!data.success) showAlertModal(data.message);
    self.insertLastChatUsers(data.chatList, data.eventConversationImage);
  });

  self.socket.on('userReadAllChatMessages', function (data) {
    self.getUsers();
    notifications.getUnreadMessagesCount();
  });
};

/** Get user chat list **/
LastChatUsers.prototype.getUsers = function (search, filter) {
  var self = this;

  // wait until users will be inserted
  self.isUsersReady = false;
  var req = {hash: self.userHash};
  if(filter) req.conversationTypes = filter;

  if(search) {
    req.search = search;
    self.socket.emit('searchUsersInChat', JSON.stringify(req));
  } else {
    self.socket.emit('getChatList', JSON.stringify(req));
  }
};

/** Insert last chatted users and unread messages count **/
LastChatUsers.prototype.insertLastChatUsers = function (data, eventChatImage) {
  var self = this;
  var lastChatUsersHtml = '';
  var totalUnreadMsgCount = 0;

  self.conversationsArr = data;

  // loop over each user and insert userBox into html
  for (var i = 0; i < self.conversationsArr.length; i++) {
    var userObj = self.conversationsArr[i];

    var date = new Date(userObj.messageTime);
    userObj.date = formatTime.chat(userObj.messageTime);

    userObj.messageText = message.replaceCodesWithText(userObj.messageText, false);

    if(userObj.conversationType === 'chat'){
      var receiver = userObj.participants.find(participant => +participant.userId !== +userInfo.userId);
      if(!receiver) console.log(userObj.conversationId);
      userObj.userId = receiver.userId;
      userObj.userName = receiver.userName;
      userObj.userPhoto = receiver.userPhoto;
    } else if (userObj.conversationType === 'event'){
      userObj.userName = userObj.eventName;
      userObj.userPhoto = eventChatImage;
    }

    // add active class for userbox with user chat opened now and insert user name and photo into the top of chat
    userObj.current = '';
    if (+userObj.conversationId === +pageChat.conversationId) {
      userObj.current = 'current';
      // pageChat.insertRecipientInfo(userObj);
    }

    totalUnreadMsgCount += +userObj.totalUnread;
    lastChatUsersHtml += self.userBoxTemplate(userObj);
  }

  // insert messages into html
  self.container.empty().append(lastChatUsersHtml);

  // set total unread message count
  notifications.insertTotalUnreadMessagesCount({chatCount: totalUnreadMsgCount});

  // checking that say that function can insert total unread messages count after page first load
  self.isUsersReady = true;
};

/** Create userbox if user doesn't exist **/
LastChatUsers.prototype.createUserBox = function (userObj) {
  var self = this;

  $('.chat-sidebar-user.current').removeClass('current');

  // check if user already exists in last chatted users sidebar
  for (var i = 0; i < self.conversationsArr.length; i++) {
    if (+self.conversationsArr[i].userId === +userObj.userId) {
      // highlight current active user box
      $('.chat-sidebar-user[data-user-id="' + userObj.userId + '"]').addClass('current');
      return
    }
  }
  // check if user not exists in array, but already was added into HTML
  if($('[data-user-id="'+ userObj.userId +'"]','#chats').length > 0){
    $('[data-user-id="'+ userObj.userId +'"]','#chats').addClass('current');
    return;
  }

  var date = new Date();
  userObj.date = formatTime.chat(date.getTime());
  userObj.messageText = '';
  userObj.userBoxActive = true;
  userObj.current = 'current';

  // insert in last chat users side bar
  self.container.prepend(self.userBoxTemplate(userObj));
};

LastChatUsers.prototype.userBoxTemplate = function (userObj) {
  // check if unread messages from this user exists and set css class
  var unreadCountElem = '';
  if (userObj.totalUnread > 0) {
    unreadCountElem = '<div class="indicator-count">' + userObj.totalUnread + '</div>';
  }

  var photo = '';
  if(userObj.conversationType === 'chat'){
    photo = '<img src="' + userObj.userPhoto + '">';
  } else if (userObj.conversationType === 'event'){
    photo = userObj.userPhoto;
  }

  return '<a href="#conversationId=' + userObj.conversationId + '" \
             class="chat-sidebar-user ' + userObj.current + '"\
             data-conversation-id="' + userObj.conversationId + '" \
             data-conversation-type="' + userObj.conversationType + '" \
			       data-msg-time="' + userObj.date  + '">\
             <figure class="user-avatar-holder">\
               '+ photo +'\
             </figure>\
            <div class="userlist-info">\
              <div class="row align-items-center m-0 mb-1">\
                <p class="username">' + userObj.userName + '</p>\
              </div>\
              <p class="pre-msg">' + userObj.messageText + '</p>\
              ' + unreadCountElem + '\
              <div class="msg-date">' + userObj.date + '</div>\
            </div>\
          </a>';
};

/** Push user box to top of the user's bar when new message arrives **/
LastChatUsers.prototype.moveUpUserBox = function (msg) {
  var self = this;
  var $userBox = $('.chat-sidebar-user[data-conversation-id="' + msg.conversationId + '"]');

  // increase message count
  if (+msg.conversationId !== +pageChat.conversationId) {
    var num = $userBox.find('.indicator-count').text() || 0;
    var unreadCountElem = '<div class="indicator-count">' + ((+num) + 1) + '</div>';
    $userBox.find('.indicator-count').remove();
    $userBox.find('.pre-msg').after(unreadCountElem);
  }

  // check if current first user box ID already from user is chatting now
  var firstUserBoxId = $('.chat-sidebar-user', self.container).first().attr('data-conversation-id');
  if ( msg.conversationId === +firstUserBoxId) {
    return;
  }

  // If user new (not in last chat users sidebar), reinit last chat users to get all of them
  if (!self.isConversationExistsInLastChatSidebar( msg.conversationId )) {
    return self.getUsers();
  }

  // replace user box on top in user's sidebar
  $userBox = $userBox.clone();
  $('.chat-sidebar-user[data-conversation-id="' + msg.conversationId + '"]', self.container).remove();
  self.container.prepend($userBox);
};

/**
 * Check if user exists in last chat users sidebar.
 * If user new, reinit last chat users to get all of them
 * **/
LastChatUsers.prototype.isConversationExistsInLastChatSidebar = function (conversationId) {
  var self = this;

  for (var y = 0; y < self.conversationsArr.length; y++) {
    if (self.conversationsArr[y].conversationId === conversationId) {
      return true;
    }
  }
  return false;
};

/** Wait until users loads **/
LastChatUsers.prototype.waitForUsers = function (callbackFunc) {
  var self = this;

  if (!self.isUsersReady) {
    setTimeout(function () {
      self.waitForUsers(callbackFunc);
    }, 100);
    return;
  } else {
    callbackFunc;
  }
};
'use strict';


function LastChatUsers(socket) {
  this.socket = socket;
  this.isFirstLoad = true;
  this.userHash = ''; // user hash which contains ID
  this.container = {}; // jQuery wrapper for all last chatted users in sidebar
  this.usersArr = []; // all users who have chat with current user
  this.isUsersReady = false; // bool, true means that all of the sidebar users received and inserted
  this.page = ''; // "messages" or "messages-admin" page
}

/** Init  **/
LastChatUsers.prototype.init = function(options) {
  var self = this;

  self.page = options.page ?  options.page : 'messages';

  // if first initializing of lastChattedUsers, load them
  if(self.isFirstLoad) {
    self.isFirstLoad = false;
    self.userHash = options.userHash;
    self.container = options.container;

    self.initSocketHandlers();

    // request getLastChattedUsers, response: lastChattedUsers
    self.getUsers();
  } else {
    // insert users
    self.insertLastChatUsers();
  }
};


/** Get user chat list **/
LastChatUsers.prototype.getUsers = function() {
  var self = this;
  
  // wait until users will be inserted
  self.isUsersReady = false;
  
  var userObj = user.info;
  if(!!userBots.selectedBot) {
    userObj = userBots.selectedBot;
  }

  // request getLastChattedUsers, response: lastChattedUsers
  self.socket.emit('getLastChattedUsers', JSON.stringify({hash: userObj.hash}));
};

/** Socket handlers**/
LastChatUsers.prototype.initSocketHandlers = function() {
  var self = this;

  // insert unread messages
  self.socket.on('lastChattedUsers', function(data) {
    // save users
    self.usersArr = JSON.parse(data);

    // insert users
    self.insertLastChatUsers();
  });
};


/** Insert last chatted users and unread messages count **/
LastChatUsers.prototype.insertLastChatUsers = function() {
  var self = this;
  var lastChatUsersHtml = '';
  var totalUnreadMsgCount = 0;
  var $container = $(self.container);

  // loop over each user and insert userBox into html
  for(var i = 0; i < self.usersArr.length; i++) {
    var userObj = self.usersArr[i];

    if(!userObj.userId) continue;

    var userName = userObj.userName; // user name
    var userPhoto = user.getPhoto(userObj.userPhoto, userName); // photo
    var date = new Date(userObj.messageTime); // date
    var online = user.getOnline(userObj); // online

    // add active class for userbox with user chat opened now and insert user name and photo into the top of chat
    var active = '';
    if(userObj.userId == pageMessages.recipientId) {
      active = 'active';
      pageMessages.insertRecipientInfo(userObj);
    }

    // check if unread messages from this user exists and set css class
    var hasUnreadMessages = '', unreadCount = 'data-amount="0"';
    if(userObj.totalUnread > 0) {
      hasUnreadMessages = 'has-messages';
      unreadCount = 'data-amount="' + userObj.totalUnread + '"';
      totalUnreadMsgCount += userObj.totalUnread;
    }

    // check if user has another user in favorites and add highlighted star
    var inFavorites = '';
    if(userObj.favorite) {
      inFavorites = 'active';
    }

    // creating html with user
    var userBoxHtml =
      '<a href="#page='+ self.page +'&chatId=' + userObj.userId + '" class="message-person ' + hasUnreadMessages + ' ' + active + '" ' + unreadCount + ' \
				       data-user-id="' + userObj.userId + '" \
				       data-user-nickName="' + userObj.userNickname + '" \
				       data-user-name="' + userObj.userName + '" \
				       data-user-lastName="' + userObj.userLastName + '" \
				       data-msg-time="' + date + '">\
					 <figure class="message-person-avatar" title="' + userName + '">\
						 ' + userPhoto + '\
					 </figure>\
					 <div class="name-status-holder flexcol">\
						 <div class="user-nickname">@' + userName + '</div>\
						 <!--<div class="user-online-status ' + online + '">' + userObj.userLastActive + '</div>-->\
					 </div>\
						 <svg class="user-favour svg-ico ' + inFavorites + '" xmlns="http://www.w3.org/2000/svg" width="25" height="21" viewBox="0 1 19 19">\
    <g fill="#E8168B">\
        <path d="M3.67 1.27c.3-.3.3-.76 0-1.05-.3-.3-.76-.3-1.05 0-3.25 3.24-3.25 8.52 0 11.76.14.15.33.22.52.22.2\
    0 .4-.07.53-.22.3-.3.3-.76 0-1.05-2.66-2.66-2.66-7 0-9.66zm0 0M14.38.22c-.3-.3-.76-.3-1.05 0-.3.3-.3.76 0\
    1.05 1.3 1.3 2 3 2 4.83 0 1.82-.7 3.54-2 4.83-.3.3-.3.76 0 1.05.14.15.33.22.52.22.2 0 .4-.07.53-.22\
    1.57-1.57 2.44-3.66 2.44-5.88s-.87-4.3-2.44-5.88zm0 0"></path>\
    <path d="M4.62 9.97c.15.15.34.22.53.22.2 0 .38-.08.53-.22.3-.3.3-.77 0-1.06-1.56-1.55-1.56-4.08 0-5.64.3-.3.3-.76\
    0-1.05-.3-.3-.77-.3-1.06 0-2.13 2.13-2.13 5.6 0 7.74zm0 0M11.32 9.97c.14.15.33.22.52.22.2 0 .4-.08.53-.22\
    1.04-1.04 1.6-2.42 1.6-3.88s-.56-2.84-1.6-3.87c-.3-.3-.76-.3-1.05 0-.3.3-.3.76 0 1.05.75.75 1.17 1.76 1.17\
    2.82s-.43 2.07-1.18 2.82c-.3.3-.3.76 0 1.05zm0 0M8.5 8c1.04 0 1.9-.85 1.9-1.9 0-1.04-.86-1.9-1.9-1.9s-1.9.85-1.9 1.9c0\
    1.05.85 1.9 1.9 1.9zm0 0M9.2 9.05c-.1-.3-.38-.52-.7-.52-.32 0-.6.2-.7.52l-3.24 9.97c-.13.4.08.82.48.94.07.03.15.04.23.04.3\
    0 .6-.2.7-.52l.4-1.2h4.26l.4 1.2c.12.4.54.6.93.48.4-.12.6-.54.48-.94L9.2 9.05zm-.7 2.64l.62\
    1.92H7.87l.63-1.92zm-1.65 5.08l.54-1.67h2.2l.54 1.68h-3.3zm0 0"></path>\
    <title role="tooltip">Підписка</title>\
    </g>\
    </svg>\
					 </a>';

    lastChatUsersHtml += userBoxHtml;
  }

  $container.empty().append(lastChatUsersHtml);

  // set total unread message count
  // notifications.insertTotalUnreadMessagesCount(totalUnreadMsgCount);

  // checking that say that function can insert total unread messages count after page first load
  self.isUsersReady = true;
};

/** Create userbox if user doesn't exist **/
LastChatUsers.prototype.createUserBox = function(userObj) {
  var self = this;
  var $container = $(self.container);

  //console.log(userObj);

  $('.message-person.active').removeClass('active');

  // check if user already exists in last chatted users sidebar
  for(var i = 0; i < self.usersArr.length; i++) {
    if(+self.usersArr[i].userId === +userObj.userId) {
      // highlight current active user box
      $('.message-person[data-user-id="' + userObj.userId + '"]', $container).addClass('active');
      return
    }
  }

  // user name
  var userName = userObj.userName;

  // photo
  var userPhoto = user.getPhoto(userObj.userPhoto, userName);

  // if user online
  var online = '';
  if(userObj.userLastActive === 'online') {
    online = 'online';
  }

  // check if user has another user in favorites and add highlighted star
  var inFavorites = '';
  if(userObj.favorite) {
    inFavorites = 'active';
  }

  // creating html with user
  var userBoxHtml =
    '<div class="message-person active" \
                   data-user-id="' + userObj.userId + '" \
				       data-user-nickName="' + userObj.userNickname + '" \
				       data-user-name="' + userObj.userName + '" \
				       data-user-lastName="' + userObj.userLastName + '"\
				       data-msg-time="never">\
					 <figure class="message-person-avatar" title="' + userName + '">\
						 ' + userPhoto + '\
					 </figure>\
					 <div class="name-status-holder flexcol">\
						 <div class="user-nickname">@' + userName + '</div>\
						 <div class="user-online-status ' + online + '">' + userObj.userLastActive + '</div>\
					 </div>\
						 <svg class="user-favour svg-ico ' + inFavorites + '" xmlns="http://www.w3.org/2000/svg" width="25" height="21" viewBox="0 1 19 19">\
    <g fill="#E8168B">\
        <path d="M3.67 1.27c.3-.3.3-.76 0-1.05-.3-.3-.76-.3-1.05 0-3.25 3.24-3.25 8.52 0 11.76.14.15.33.22.52.22.2\
    0 .4-.07.53-.22.3-.3.3-.76 0-1.05-2.66-2.66-2.66-7 0-9.66zm0 0M14.38.22c-.3-.3-.76-.3-1.05 0-.3.3-.3.76 0\
    1.05 1.3 1.3 2 3 2 4.83 0 1.82-.7 3.54-2 4.83-.3.3-.3.76 0 1.05.14.15.33.22.52.22.2 0 .4-.07.53-.22\
    1.57-1.57 2.44-3.66 2.44-5.88s-.87-4.3-2.44-5.88zm0 0"></path>\
    <path d="M4.62 9.97c.15.15.34.22.53.22.2 0 .38-.08.53-.22.3-.3.3-.77 0-1.06-1.56-1.55-1.56-4.08 0-5.64.3-.3.3-.76\
    0-1.05-.3-.3-.77-.3-1.06 0-2.13 2.13-2.13 5.6 0 7.74zm0 0M11.32 9.97c.14.15.33.22.52.22.2 0 .4-.08.53-.22\
    1.04-1.04 1.6-2.42 1.6-3.88s-.56-2.84-1.6-3.87c-.3-.3-.76-.3-1.05 0-.3.3-.3.76 0 1.05.75.75 1.17 1.76 1.17\
    2.82s-.43 2.07-1.18 2.82c-.3.3-.3.76 0 1.05zm0 0M8.5 8c1.04 0 1.9-.85 1.9-1.9 0-1.04-.86-1.9-1.9-1.9s-1.9.85-1.9 1.9c0\
    1.05.85 1.9 1.9 1.9zm0 0M9.2 9.05c-.1-.3-.38-.52-.7-.52-.32 0-.6.2-.7.52l-3.24 9.97c-.13.4.08.82.48.94.07.03.15.04.23.04.3\
    0 .6-.2.7-.52l.4-1.2h4.26l.4 1.2c.12.4.54.6.93.48.4-.12.6-.54.48-.94L9.2 9.05zm-.7 2.64l.62\
    1.92H7.87l.63-1.92zm-1.65 5.08l.54-1.67h2.2l.54 1.68h-3.3zm0 0"></path>\
    <title role="tooltip">Підписка</title>\
    </g>\
    </svg>\
					 </div>';

  // insert in last chat users side bar
  $container.prepend(userBoxHtml);
};

/** Push user box to top of the user's bar when new message arrives **/
LastChatUsers.prototype.moveUpUserBox = function(data) {
  var self = this;

  var messages = data.messages;
  var recipientId = data.recipientId;
  var msgDate;
  var $container = $(self.container);

  // get first user box message user Id
  var userId = $('.message-person', $container).first().attr('data-user-id');

  // get first user box message time
  var firstMessageDate = $('.message-person', $container).first().attr('data-msg-time');

  // check if user never chat to this recipient, if so, get last chatted users again
  if(firstMessageDate === 'never') {
    self.getUsers();
    return;
  }

  // make user highlighted
  $('.message-person.active').removeClass('active');
  $('.message-person[data-user-id="' + recipientId + '"]').addClass('active');

  firstMessageDate = new Date(firstMessageDate);

  // check received messages for newest time
  for(var i = 0; i < messages.length; i++) {
    msgDate = new Date(messages[i].messageTime);

    // if newest time detected, move this user box up and update its time
    if(msgDate > firstMessageDate) {

      // check if user exists in last chat users sidebar.
      // If user new, reinit last chat users to get all of them
      if(!self.isUserExistsInLastChatSidebar(recipientId)) {
        self.getUsers();

        // get fans and favorites
        user.getFansAndFavorites(self.userHash);
        return;
      }

      var $userBox = $('.message-person[data-user-id="' + recipientId + '"]', $container).clone();
      $('.message-person[data-user-id="' + recipientId + '"]', $container).remove();
      $userBox.attr('data-msg-time', msgDate);
      $container.prepend($userBox);
      return;
    }
  };
};

/** Check if user not write to current user yet **/
LastChatUsers.prototype.isUserExistsInLastChatSidebar = function(userId) {
  var self = this;

  // check if user exists in last chat users sidebar. If user new, reinit last chat users to get all of them
  for(var y = 0; y < self.usersArr.length; y++) {
    if(self.usersArr[y].userId === userId) {
      return true;
    }
  }

  return false;
};

/** Wait until users loads **/
LastChatUsers.prototype.waitForUsers = function(callbackFunc, context, params) {
  var self = this;

  if(!self.isUsersReady) {
    setTimeout(function() {
      self.waitForUsers(callbackFunc, context, params);
    }, 100);
  } else {
    callbackFunc.call(context, params);
  }
};


/** Destroy */
LastChatUsers.prototype.destroy = function() {
  var self = this;
  self.isFirstLoad = true;
};

'use strict';
function Notifications(socket) {
  this.socket = socket;
  this.userHash = ''; // user hash which contains ID
  this.totalMsgBox = {}; // jQuery wrapper for all last chatted users in sidebar
}

Notifications.prototype.init = function(options) {
  var self = this;

  self.userHash = options.userHash;
  self.totalMsgBox = options.totalMsgBox;

  self.initSocketHandlers();
  self.getUnreadChatMessagesCount(self.userHash);
};

/** Insert total unread message count after first load **/
Notifications.prototype.getUnreadChatMessagesCount = function(hash) {
  var self = this;

  // request: getUnreadChatMessagesCount, response: unreadChatMessagesCount
  user.launchAfterUserInfoReceived(() => {
    if(hash)
		self.socket.emit('getUnreadChatMessagesCount', JSON.stringify({hash: hash}));
  });
};


/** Socket listeners **/
Notifications.prototype.initSocketHandlers = function() { 
  var self = this;

  self.socket.off('updateNotificationCount').on('updateNotificationCount', function(data) {
	  data = JSON.parse(data);
	  self.updateNotificationCount(data.count);
  });
  
  // request: getUnreadChatMessagesCount, response: unreadChatMessagesCount
  self.socket.off('unreadChatMessagesCount').on('unreadChatMessagesCount', function(data) {
    data = JSON.parse(data);
    if(data.userId == user.info.userId){
      self.updateMessagesCount(data.unreadCount);
    }
  });

  // make request to get increased total unread chat messages count
  self.socket.off('privateChatMessages').on('privateChatMessages', insertNotifications);
  function insertNotifications(data) {
    data = JSON.parse(data);

    // exit if messages has arrives from user with chat is open now
    if($('.page.private-messages').length > 0 && data.recipientId == pageMessages.recipientId) {
      return;
    }

    // or update unread messages count
    if(data.userId == user.info.userId){
      self.getUnreadChatMessagesCount(user.info.hash);
    }
  }
};

/** Insert total unread message count after first load **/
// insertTotalUnreadMessagesCount rename to updateMessagesCount
Notifications.prototype.updateMessagesCount = function(number) {
  var self = this;

  if(+number > 0) {
    $(self.totalMsgBox).addClass('has-messages').attr('data-amount', +number);
  } else {
    $(self.totalMsgBox).removeClass('has-messages').attr('data-amount', 0);
  }
};


Notifications.prototype.updateNotificationCount = function(number) {
	if(+number > 0)
		$(".menu-item[data-menu=notifications]").addClass('has-messages').attr('data-amount', number);
	else
		$(".menu-item[data-menu=notifications]").removeClass('has-messages').attr('data-amount', 0);
}
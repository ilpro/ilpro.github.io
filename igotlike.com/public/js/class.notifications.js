'use strict';
function Notifications(socket) {
  this.socket = socket;
  this.userHash = ''; // user hash which contains ID

  this.count = 0;
  this.chatTotal = 0;
}

Notifications.prototype.init = function(userHash) {
  var self = this;
  self.userHash = userHash;

  self.getAllNotificationsCount();
  self.initSocketHandlers();
};

/** Socket listeners **/
Notifications.prototype.initSocketHandlers = function() {
  var self = this;

  self.socket.on('updateNotificationCount', function (data) {
    data = JSON.parse(data);

    self.count = +data.count;
    self.chatTotal = +data.unreadChatCount;

    self.updateNotificationCount();
  });

  // increase chat messages count
  self.socket.on('chatMessage', function () {
    if(location.pathname.indexOf('chat') === -1) {
      self.changeChatCount(+1);
    }
  });
};

Notifications.prototype.getAllNotificationsCount = function() {
  var self = this;
  self.socket.emit('getNotificationsCount', JSON.stringify({hash: userHash}));
};


/** Increase\decrease chat count **/
Notifications.prototype.changeChatCount = function (num) {
  var self = this;

  self.chatTotal += num;
  if(self.chatTotal < 0) {
    self.chatTotal = 0;
  }

  self.updateNotificationCount();
};

/** Insert all types of notifications into HTML **/
Notifications.prototype.updateNotificationCount = function() {
  var self = this;
  var total = self.chatTotal + self.count;

  // unread chat messages count
  if(self.chatTotal > 0){
    $('.number', '#messages-count').html(self.chatTotal).addClass('unreaded');
  } else {
    $('.number', '#messages-count').removeClass('unreaded');
  }

  // unread chat messages count
  if(self.count > 0){
    $('.number', '#notifications-count').html(self.count).addClass('unreaded');
  } else {
    $('.number', '#notifications-count').removeClass('unreaded');
  }

  // sum of all notifications
  if(total > 0){
    $('#total-notifications-count').show().text(total);
  } else {
    $('#total-notifications-count').hide();
  }
};
'use strict';
function Notifications(socket) {
  this.socket = socket;
  this.userHash = ''; // user hash which contains ID
  this.chatTotalSelector = {};
  this.chatTotal = 0;
  this.notifTotal = 0;
  this.notifMsgData = {};
  this.notificationSoundEnable = false;
}

Notifications.prototype.init = function (options) {
  var self = this;

  self.userHash = userHash;
  self.chatTotalSelector = $('#chat-total');

  self.initSocketHandlers();
  self.initEventHandlers();
  self.initNotifSound();
};

/** Socket listeners **/
Notifications.prototype.initSocketHandlers = function () {
  var self = this;

  // update count of notifications
  self.socket.on('getUserAuthInfo', function (data) {
    data = JSON.parse(data);

    if (data.unreadNotificationCount > 0)
      $(".sidebar-item.notifications .indicator-count").show().text(data.unreadNotificationCount);

    self.notifTotal = data.unreadNotificationCount;
    self.chatTotal = +data.unreadChatCount;

    self.insertTotalUnreadMessagesCount();
    self.updateTabNotif();
  });

  self.socket.on('updateNotificationCount', function (data) {
    data = JSON.parse(data);

    if (data.count > 0)
      $(".sidebar-item.notifications .indicator-count").show().text(data.count);
    else
      $(".sidebar-item.notifications .indicator-count").hide();

    self.notifTotal = data.count;
    self.updateTabNotif();
  });

  // increase chat messages count
  self.socket.on('sendChatMessage', function (data) {
    self.notifMsgData = JSON.parse(data);
    if (+realUserId !== +self.notifMsgData.userId) {
      self.socket.emit('getUserInfoForMsgNotifications', JSON.stringify({userId: self.notifMsgData.userId}));
      self.notifMsgData.pageLink = '/chat#id=' + self.notifMsgData.userId;
      if (location.pathname.indexOf('chat') === -1) {
        self.changeChatCount(+1);
      }
    }
  });

  self.socket.on('getUserInfoForMsgNotifications', function (data) {
    if (!$.isEmptyObject(self.notifMsgData)) {
      if (!self.notifMsgData.played) {
        data = JSON.parse(data);
        var msgData = self.notifMsgData;

        msgData.message = message.parseMessage(msgData.message);
        showChatNotify(data.userPhoto, msgData.name, msgData.message, msgData.pageLink);
        if (self.notificationSoundEnable) {
          var notifSound = new Audio('/sound/notification.mp3');
          notifSound.play();
          self.notifMsgData.played = true
        }
      }
    }
  });
};

/** Event listeners **/
Notifications.prototype.initEventHandlers = function () {
  var self = this;

  $('#notification-sound').on('click', '.sound-enable', function () {
    self.notificationSoundEnable = true;
    setCookie("notifSound", 'enabled', {"path": "/", "expires": 31536000});
    $('#notification-sound').addClass('active')
  });

  $('#notification-sound').on('click', '.sound-disable', function () {
    self.notificationSoundEnable = false;
    setCookie("notifSound", 'disabled', {"path": "/", "expires": 31536000});
    $('#notification-sound').removeClass('active')
  });
};

/** Notification sound start init **/
Notifications.prototype.initNotifSound = function () {
  var self = this;
  var soundCookie = getCookie('notifSound');

  if(!soundCookie){
    $('#notification-sound').addClass('active');
    self.notificationSoundEnable = true;
    setCookie("notifSound", 'enabled', {"path": "/", "expires": 31536000});
  }

  if(soundCookie === 'enabled'){
    self.notificationSoundEnable = true;
    $('#notification-sound').addClass('active');
  }


  if(soundCookie === 'disabled'){
    self.notificationSoundEnable = false;
    $('#notification-sound').removeClass('active')
  }
};

/** Notification sound start init **/
Notifications.prototype.updateTabNotif = function () {
  var self = this;
  var allNotifTotal = self.chatTotal + self.notifTotal;
  var newTabTitle;
  var currentTabText = document.title;

  newTabTitle = currentTabText.match(/\(?\d*\)?(.*)/im);

  if (allNotifTotal === 0) {
    document.title = newTabTitle[1];
  } else {
    document.title = "(" + allNotifTotal + ") " + newTabTitle[1];
  }

};

/** Increase chat count **/
Notifications.prototype.changeChatCount = function (num) {
  var self = this;

  self.chatTotal += num;
  if (self.chatTotal < 0) {
    self.chatTotal = 0;
  }
  self.updateTabNotif();
  self.insertTotalUnreadMessagesCount();
};

/** Insert total unread message count after first load **/
Notifications.prototype.insertTotalUnreadMessagesCount = function () {
  var self = this;

  if (self.chatTotal > 0) {
    self.chatTotalSelector.html(+self.chatTotal).show();
  } else {
    self.chatTotalSelector.html(0).hide()
  }
};
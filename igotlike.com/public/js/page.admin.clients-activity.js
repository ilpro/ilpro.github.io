'use strict';
/** Start  page chat **/
var user = new User();

var pageClientsActivity = {
  socket: dataSocket,
  chat: false,
  favorites: false,
  photoLikes: false,
  allActivitiesSortedByTime: [],

  /** Start **/
  init: function () {
    var self = this;

    self.getAllActivity();
    // self.socket.emit('getClientsActivity');
    self.initSocketHandlers();
  },

  /** Requests **/
  getAllActivity: function () {
    var self = this;
    self.socket.emit('getLastChatMessages', JSON.stringify({hash: userHash}));
    self.socket.emit('getLastFavorites', JSON.stringify({hash: userHash}));
    self.socket.emit('getLastPhotoLikes', JSON.stringify({hash: userHash}));
  },

  /** Socket listeners **/
  initSocketHandlers: function () {
    var self = this;

    self.socket.on('lastChatMessages', function (data) {
      data = JSON.parse(data);
      self.chat = self.addTypeToActivities(data, 'chat');
      self.insertActivity();
    });
    self.socket.on('lastFavorites', function (data) {
      data = JSON.parse(data);
      self.favorites = self.addTypeToActivities(data, 'favorite');
      self.insertActivity();
    });
    self.socket.on('lastPhotoLikes', function (data) {
      data = JSON.parse(data);
      self.photoLikes = self.addTypeToActivities(data, 'photoLike');
      self.insertActivity();
    });
  },

  /** Add type property to objects like type: chat or type: favorites **/
  addTypeToActivities: function (arr, typeStr) {
    var self = this;
    var modifiedArr = arr;

    for (var i = 0; i < modifiedArr.length; i++) {
      modifiedArr[i].type = typeStr;
    }

    return modifiedArr;
  },

  /** Check if all types of activities already recieved from server **/
  insertActivity: function () {
    var self = this;

    if (
      self.chat &&
      self.favorites &&
      self.photoLikes
    ) {
      self.sortDataByTime();
      self.insertActionsIntoHtml();
    }
  },

  /** Sort recieved data by time **/
  sortDataByTime: function () {
    var self = this;
    var allActivitiesArr = self.chat.concat(self.favorites, self.photoLikes);

    // sort array by time
    allActivitiesArr.sort(function (a, b) {
      return new Date(b.messageTime) - new Date(a.messageTime);
    });

    self.allActivitiesSortedByTime = allActivitiesArr;
  },

  /** Insert bots into HTML **/
  insertActionsIntoHtml: function () {
    var self = this;
    var allHtml = '<p class="title">users activity</p><div class="divider"></div>';

    for (var i = 0; i < self.allActivitiesSortedByTime.length; i++) {
      allHtml += self.getActionTemplate(self.allActivitiesSortedByTime[i]);
    }

    $('.events-block').html(allHtml).show();
  },


  getActionTemplate: function (actionObj) {
    var self = this;

    if (!actionObj.receiverId || !actionObj.senderId) return;

    var senderName = actionObj.senderName;
    var senderPhoto = actionObj.senderPhoto;

    var receiverName = actionObj.receiverName;
    var receiverPhoto = actionObj.receiverPhoto;

    var date = new Date(actionObj.messageTime);
    var month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    var typeHtml = '';
    if (actionObj.type == 'chat') {
      typeHtml = '<div class="event-text">Has send message</div>' + svgObj.usersActivityChat();
    }
    if (actionObj.type == 'favorite') {
      typeHtml = '<div class="event-text">Has add to favorites</div>' + svgObj.usersActivityFavorite();
    }
    if (actionObj.type == 'photoLike') {
      typeHtml = '<div class="event-text">Has like photo</div>' + svgObj.usersActivityPhotoLike();
    }

    var html =
      '<div class="event">\
         <div class="user1-nick">' + senderName + '</div>\
         <div class="time">' + date.getDate() + ' ' + month[date.getMonth()] + ', в ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '</div>\
         <div class="event-picture">\
           <div class="user1-ava">\
             <img src="' + senderPhoto + '" alt="user" style="max-width: 100%;">\
           </div>\
           ' + typeHtml + '\
           <div class="user2-ava">\
             <img src="' + receiverPhoto + '" alt="user" style="max-width: 100%;">\
           </div>\
         </div>\
         <div class="user2-nick">' + receiverName + '</div>\
       </div>\
       <div class="divider"></div>';

    return html;
  }
};

pageClientsActivity.init();
'use strict';
/** Start  page chat **/
var user = new User();
var message = new Message();

var pageBots = {
  socket: dataSocket,
  usersContainer: '.messages-wrapper',
  userId: $('.page-chat').attr('data-user-id'),
  botsArr: [],

  init: function () {
    var self = this;
    
    self.initSocketHandlers();
    self.initEventHandlers();

    // interval for get bots
    self.getBots(10000);

    // clear header from user info
    $('.page-head.chat').html('<div class="page-name">Chat</div>');

    $('body').addClass('page-bot-chat');
  },


  /** Get bots **/
  getBots: function (timer) {
    var self = this;

    // get last chat users after stickers has come
    self.socket.emit('getChatUserBots', JSON.stringify({hash: userHash}));

    if (timer) {
      setTimeout(function () {
        self.getBots(timer);
      }, timer);
    }
  },


  /** Socket listeners **/
  initSocketHandlers: function () {
    var self = this;

    // insert chat messages
    self.socket.on('chatUserBots', function (data) {
      self.botsArr = JSON.parse(data);
      self.insertBots();
    });
  },

  initEventHandlers: function() {
    var self = this;

    $(document).on('click', '.page-messages-list', function (e) {
      if ($(e.target).closest('.online-switcher').length > 0) {
        e.preventDefault();
        $(e.target).closest('.online-switcher').toggleClass('on');
        self.socket.emit('toggleBotOnline', JSON.stringify({botId: $(e.target).closest('.main-info').attr('data-bot-id')}))
      }
    });

    $('.randomize-online').click(function (e) {
      self.randomizeOnline();
    })
  },

  /** Insert bots into HTML **/
  insertBots: function () {
    var self = this;
    var allHtml = '';

    for (var i = 0; i < self.botsArr.length; i++) {
      allHtml += self.getChatUserTemplate(self.botsArr[i]);
    }

    $('.page-messages-list').html(allHtml).show();
  },


  getChatUserTemplate: function (userObj) {
    var self = this;

    var photo = user.getPhoto(userObj.userPhoto, userObj.userName);
    var online = user.getOnline(userObj);

    var onlineClass = 'offline';
    if (online === 'online' || userObj.isBotOnline == 1) {
      onlineClass = 'online';
    }

    var onlineStatus = '<div class="online-switcher"></div>';
    if (userObj.isBotOnline == 1) {
      onlineStatus = '<div class="online-switcher on"></div>';
    }

    var unread = '';
    if (userObj.unreadCount > 0) {
      unread = '<div class="number unreaded">' + userObj.unreadCount + '</div>';
    }

    var html =
      '<a href="/bot-chat/' + userObj.userId + '" data-bot-id="' + userObj.userId + '" class="main-info">\
         <div class="avatar-holder">\
           <div class="user-avatar" title="">\
             ' + photo + '\
           </div>\
         </div>\
         <div class="info-holder">\
           <div class="main-info-row">\
             <div class="id-box">\
               <div class="id">id:' + userObj.userId + '</div>\
               <div class="city" style="text-transform: capitalize">' + userObj.userCity + ', ' + userObj.userCountry +'</div>\
             </div>\
             <div class="name">' + userObj.userName + '</div>\
             ' + onlineStatus + '\
             <div class="time">\
               <div class="online-status' + onlineClass + '">' + online + '</div>\
             </div>\
             <div class="unreaded-messages-count">\
             ' + unread + '\
             </div>\
           </div>\
         </div>\
       </a>';

    return html;
  },


  /** randimize bots online **/
  randomizeOnline: function(){
    var self = this;
    
    var botsNumToRandomize = $('.bots-to-randomize').val();
    var totalBots = self.botsArr.length;
    var randomBotsArr = [];
    var selectedBotsCounter = 0;
    
    if (!botsNumToRandomize || botsNumToRandomize == 0) {
      alert('Пожалуйста, введите число ботов');
      return;
    }
    
    if (botsNumToRandomize > totalBots) {
      botsNumToRandomize = totalBots;
    }
    
    while (selectedBotsCounter < +botsNumToRandomize) {
      var rand = Math.floor((Math.random() * totalBots));
      var botId = self.botsArr[rand].userId;
    
      if (botId in randomBotsArr) {
        continue;
      }
    
      selectedBotsCounter++;
      randomBotsArr.push(botId);
    }

    var sendData = {
      hash: userHash,
      userRole: 100,
      botsIdsArr: randomBotsArr
    };
    self.socket.emit('setBotsOnline', JSON.stringify(sendData));
  }
};

pageBots.init();
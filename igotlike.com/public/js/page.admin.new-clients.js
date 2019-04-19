'use strict';
/** Start  page chat **/
var user = new User();
var message = new Message();

var pageBots = {
  socket: dataSocket,
  usersContainer: '.messages-wrapper',
  userId: $('.page-chat').attr('data-user-id'),
  users: [],

  init: function () {
    var self = this;

    self.socket.emit('getNewClients', JSON.stringify({hash: userHash}));
    self.initSocketHandlers();
    self.initEventHandlers();

    $('body').addClass('page-new-clients');
  },

  /** Socket listeners **/
  initSocketHandlers: function () {
    var self = this;

    // insert chat messages
    self.socket.on('clients', function (data) {
      self.users = JSON.parse(data);
      self.insertUsers();
    });
  },

  initEventHandlers: function() {
    var self = this;
  },

  /** Insert bots into HTML **/
  insertUsers: function () {
    var self = this;
    var allHtml = '';

    for (var i = 0; i < self.users.length; i++) {
      allHtml += self.getChatUserTemplate(self.users[i]);
    }

    $('.page-messages-list').html(allHtml).show();
  },


  getChatUserTemplate: function (userObj) {
    var self = this;

    var name = user.getName(userObj);
    var photo = user.getPhoto(userObj.userPhoto, name);
    var online = user.getOnline(userObj);
    var residence = userObj.userResidence ? userObj.userResidence : '';

    var onlineClass = 'offline';
    if (online === 'online') {
      onlineClass = 'online';
    }

    var html =
      '<a href="/profile/' + userObj.userId + '" data-bot-id="' + userObj.userId + '" class="main-info">\
         <div class="avatar-holder">\
           <div class="user-avatar" title="">\
             ' + photo + '\
           </div>\
         </div>\
         <div class="info-holder">\
           <div class="main-info-row">\
             <div class="id-box">\
               <div class="id">id:' + userObj.userId + '</div>\
               <div class="city">' + residence + '</div>\
             </div>\
             <div class="name">' + name + '</div>\
             <div class="time">\
               <!--<div class="online-status' + onlineClass + '">' + online + '</div>-->\
             </div>\
           </div>\
           <div>Cash: '+ userObj.userCash +'</div>\
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

    //
    // ///
    // $('.main-info').each(function (i) {
    //   var rand = Math.random();
    //
    //   if (rand > 0.5) {
    //     $(this).find('.online-switcher').click();
    //   }
    // })
  }
};

pageBots.init();
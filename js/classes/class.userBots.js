'use strict';
function UserBots(socket) {
  this.socket = socket;
  this.isFirstLoad = true;
  this.container = {}; // jQuery wrapper for all bots elements
  this.infoContainer = {}; // jQuery wrapper for bot info
  this.botsObj = {}; // all bots params will be there
  this.commentsBotsObj = {}; // all bots for comments will be there
  this.selectedBot = false; // if user selects bot, his params will be there
  this.requstForBotsAlreadySend = false; // variable to prevent multiple requests if messaging for bots exists
};


/** Check if user admin or author of the passed message **/
UserBots.prototype.init = function (options) {
  var self = this;

  if (self.isFirstLoad) {
    self.isFirstLoad = false;

    // define bots wrapper
    self.container = $(options.container);
    self.infoContainer = $(options.infoContainer);

    // get list of all models
    self.getBots();

    self.eventListenersInit();
    self.socketHandlersInit();
  } else {
    // insert bots into HTML
    self.insertBots(self.botsObj);
  }
};

/** Check if user admin or author of the passed message **/
UserBots.prototype.getBots = function () {
  var self = this;
  // if no user info yet, wait for it
  if (!user.info.userId) {
    setTimeout(function () {
      self.getBots();
    }, 100);
    return;
  }

  var sendData = {
    hash: user.info.hash,
    userRole: user.info.userRole
  };

  // request: getUserBots; response: userBots
  self.socket.emit('getUserBots', JSON.stringify(sendData));
};

/** Insert user bots **/
UserBots.prototype.insertBots = function (botsObj) {
  var self = this;

  var allBotsHtml = '';

  for (var bot in botsObj) {
    var currentUser = false;
    var botName = user.getName(botsObj[bot]);
    var photo = user.getPhoto(botsObj[bot].userPhoto, botName);
    var online = '',
      checkedOnline = '',
      unreadMessagesExist = '',
      active = '';

    // check where active user
    if (botsObj[bot].userId == user.info.userId) {
      // insert user description
      self.insertBotInfo(botsObj[bot]);
      currentUser = true;
      active = 'active';
    }

    // check if unread messages exist
    if (botsObj[bot].unreadCount > 0) unreadMessagesExist = 'has';

    // if bot online
    online = '';
    if (botsObj[bot].userLastActive === 'online') {
      online = 'online';
    }
    // if bot online from checkbox state
    if (+botsObj[bot].isBotOnline === 1) {
      online = 'online';
      checkedOnline = 'checked';
    }

    var botHtml =
      '<div class="favour-user ' + active + '" data-bot-id="' + botsObj[bot].userId + '" title="' + botName + '">\
				   <div class="favour-avatar">\
				     ' + photo + '\
				   </div>\
				  <div class="favour-nickname ' + online + '"></div>\
				  <div class="unreaded-messages ' + unreadMessagesExist + '">' + botsObj[bot].unreadCount + '</div>\
				  <div class="checkbox-container">\
					<input name="user ' + botsObj[bot].userId + '" ' + checkedOnline + ' type="checkbox" id="' + botsObj[bot].userId + '">\
					<label for="' + botsObj[bot].userId + '"><i class="check-img"></i></label>\
				  </div>\
				</div>';

    // push user box at first place
    if (currentUser) {
      allBotsHtml = botHtml + allBotsHtml;
    } else {
      allBotsHtml += botHtml;
    }
  }

  self.container.empty().append(allBotsHtml).show();
};

/** Check if user admin or author of the passed message **/
UserBots.prototype.getCommentsBots = function () {
  var self = this;

  var sendData = {
    hash: user.info.hash,
    userRole: user.info.userRole
  };

  // request: getCommentsBots; response: commentsBots
  self.socket.emit('getCommentsBots', JSON.stringify(sendData));

  // insert user bots
  self.socket.on('commentsBots', function (data) {
    data = JSON.parse(data);

    // insert bots obj into variable and add user info
    self.commentsBotsObj = data;
    self.commentsBotsObj[user.info.userId] = user.info;

    // insert bots into HTML
    self.insertCommentsBots(self.commentsBotsObj);
  });
};

/** Show user bots on chat page **/
UserBots.prototype.insertCommentsBots = function (botsObj) {
  var html = '';

  for (var elem in botsObj) {
    var bot = botsObj[elem];
    html += '<div class="user-bot-item" data-bot-id="' + bot.userId + '"><img src="' + bot.userPhoto + '" data-hash="' + bot.hash + '" title="' + bot.userName + ' ' + bot.userLastName + '"></div>';
  }

  html = '<div id="bot-container" class="fade user-bot bot-container round-corners clearfix">' + html + '</div>';

  $(".user-bot", '#chat-container').remove();
  $('#chat-container').append(html);

  // Dropdown function call for BOTS
  fadeMenu($('.comments__send-box .user-avatar', '#chat-container'), $(".fade", '#chat-container'));
};

UserBots.prototype.eventListenersInit = function () {
  var self = this;


  // change user to bot and load all it info
  $(document).on('click', '.favour-users-block .favour-user .favour-avatar', function (e) {
    $('.favour-user').removeClass('active');
    $(this).closest('.favour-user').addClass('active');

    // select bot
    userBots.selectBot($(this).closest('.favour-user'));

    // close previous user chat
    urlHash.removeState('chatId');

    // update all page info
    pageMessages.update();
  });

  // set bot online\offline
  $(document).on('click', '.favour-users-block .checkbox-container input', function (e) {
    self.toggleBotOnline($(this));
  });
};

/** Handle socket event which act with bots **/
UserBots.prototype.socketHandlersInit = function () {
  var self = this;

  // insert user bots
  self.socket.on('userBots', function (data) {
    data = JSON.parse(data);

    // insert bots obj into variable and add user info
    self.botsObj = data;
    self.botsObj[user.info.userId] = user.info;

    // insert bots into HTML
    self.insertBots(self.botsObj);
  });

  // check if new messages exist for bots
  self.socket.on('botsUnreadMessagesCount', function (data) {
    data = JSON.parse(data);
    self.updateBotsUnreadMessages(data);
  });
};

/** Get unread messages for bots **/
UserBots.prototype.getBotsUnreadMessagesCount = function () {
  var self = this;

  if (!self.requstForBotsAlreadySend) {
    self.requstForBotsAlreadySend = true;

    self.socket.emit('getBotsUnreadMessagesCount');

    setTimeout(function () {
      self.requstForBotsAlreadySend = false;
    }, 1000);
  }
};

/** Check if bots have new messages **/
UserBots.prototype.updateBotsUnreadMessages = function (unreadMessagesCount) {
  var self = this;

  for (var i = 0; i < unreadMessagesCount.length; i++) {
    if (unreadMessagesCount[i].unreadCount === null) {
      unreadMessagesCount[i].unreadCount = 0;
    }

    var id = unreadMessagesCount[i].userId;
    var newCount = +unreadMessagesCount[i].unreadCount;
    var $messagesCounter = $('.favour-user[data-bot-id="' + id + '"] .unreaded-messages', self.container);

    // if messages count for bot changes, set new count
    if (newCount != +$messagesCounter.html()) {
      if (!newCount) {
        $messagesCounter.removeClass('has').html('0');
      } else {
        $messagesCounter.addClass('has').html(newCount);
      }
    }
  }
};

/** Handle user bot description info from object and insert it into html **/
UserBots.prototype.insertBotInfo = function (botObj) {
  var self = this;

  var
    id = botObj['userId'],
    name = user.getName(botObj),
    age = (!!botObj['userBdate'] && botObj['userBdate'] !== '0000-00-00') ? user.getAge(botObj['userBdate']) + ',' : '',
    country = !!botObj['userResidence'] ? botObj['userResidence'] + ', ' : '',
    marital = !!botObj['userMaritalStatus'] ? botObj['userMaritalStatus'] + ', ' : '',
    status = !!botObj['userStatus'] ? 'status: ' + botObj['userStatus'] + ', ' : '',
    goal = botObj['userDatingGoal'] ? 'goal: ' + botObj['userDatingGoal'] + ', ' : '',
    character = botObj['userCharacter'] ? 'character: ' + botObj['userCharacter'] + ', ' : '',
    interests = botObj['userInterest'] ? 'interests: ' + botObj['userInterest'] + ', ' : '',
    aboutMe = botObj['userAboutMyself'] ? 'about me: ' + botObj['userAboutMyself'] + ', ' : '',
    aboutPartner = botObj['userAboutPartner'] ? 'I am looking for: ' + botObj['userAboutPartner'] + ', ' : '',
    gender = botObj['userGender'] ? 'gender: ' + botObj['userGender'] + ', ' : '',
    eyes = botObj['userEyes'] ? 'eyes: ' + botObj['userEyes'] + ', ' : '',
    hair = botObj['userHair'] ? 'hair: ' + botObj['userHair'] + ', ' : '',
    body = botObj['userBody'] ? 'body: ' + botObj['userBody'] + ', ' : '',
    weight = botObj['userWeight'] ? 'weight: ' + botObj['userWeight'] + ', ' : '',
    height = botObj['userHeight'] ? 'height: ' + botObj['userHeight'] + ', ' : '',
    occupation = botObj['userOccupation'] ? 'occupation: ' + botObj['userOccupation'] + ', ' : '',
    children = botObj['userChildren'] ? 'children: ' + botObj['userChildren'] + ', ' : '',
    smoke = botObj['userSmoke'] ? 'smoke: ' + botObj['userSmoke'] + ', ' : '',
    drink = botObj['userDrink'] ? 'drink: ' + botObj['userDrink'] + ', ' : '',
    favoriteColor = botObj['userFavoriteColor'] ? 'favorite color: ' + botObj['userFavoriteColor'] + ', ' : '',
    beenAbroad = botObj['userBeenAbroad'] ? 'been abroad: ' + botObj['userBeenAbroad'] : '',
    html = '';

  var infoString =
    ', ' +
    age +
    country +
    marital +
    status +
    goal +
    character +
    interests +
    aboutMe +
    aboutPartner +
    gender +
    eyes +
    hair +
    body +
    weight +
    height +
    occupation +
    children +
    smoke +
    drink +
    favoriteColor +
    beenAbroad;

  var title = name + ',' + infoString;

  html =
    '<a href="/profile/' + id + '" class="nickname">' + name + '</a>' +
    '<div class="other-info">' +
    infoString +
    '</div>';

  // insert info into html
  self.infoContainer.empty().append(html).show().attr('title', title);
};

/** Select bot by click on bot box **/
UserBots.prototype.selectBot = function ($botBox) {
  var self = this;
  var botId = $botBox.attr('data-bot-id');

  self.selectedBot = self.botsObj[botId];

  // update user or bot description info in html
  self.insertBotInfo(self.botsObj[botId]);

  // bind bot to admin ID
  self.socket.emit('bindBotToAdmin', JSON.stringify({adminId: user.info.userId, botId: botId}));
};

/** Set bot online\offline **/
UserBots.prototype.toggleBotOnline = function ($clickedTarget) {
  var self = this;

  var $botBox = $clickedTarget.closest('.favour-user');
  var botId = $botBox.attr('data-bot-id');

  // toggle state
  $botBox.find('.checkbox-container input').toggle();
  $botBox.find('.favour-nickname').toggleClass('online');

  // request: toggleBotOnline; no response
  self.socket.emit('toggleBotOnline', JSON.stringify({userId: botId}));
};

/** Destroy **/
UserBots.prototype.destroy = function () {
  var self = this;

  self.isFirstLoad = true;
  self.selectedBot = false;
};
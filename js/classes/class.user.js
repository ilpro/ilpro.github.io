'use strict';
function User(socket) {
  this.socket = socket;
  this.hash = false;
  this.info = {};
};

/** Init **/
User.prototype.init = function () {
  var self = this;

  self.initSocketListeners();

  if (self.hash) {
    self.getUserInfo();
  }
};

/** Get user info by hash or user ID**/
User.prototype.initSocketListeners = function () {
  var self = this;

  self.socket.on('userInfo', function (data) {
    data = JSON.parse(data);
    if (data.success) {
      self.insertLoginInfo(data);
      notifications.updateNotificationCount(data.countUnreadNotify);
      // if(data.userId == 8) {
      // alert("Вы заблокированы администрацией!!!");
      // auth.logout();
      // }
      // // onesignal notifications
      // OneSignal.push(["sendTags", {userId: data.userId}]);
    }
    else {
      auth.logout();
      window.location.href = "/";
    }
  });
};

/** Get user info by hash or user ID**/
User.prototype.insertLoginInfo = function (response) {
  // insert info into user
  this.info = response;
  this.hash = response.hash;

  var $userBox = $('#authorized-user'),
    name,
    photo;

  // name
  name = this.getName(this.info);
  $userBox.find('.profile-name').html('@' + name);

  // photo
  photo = this.getPhoto(this.info.userPhoto, name);
  $userBox.find('.user-avatar').html(photo);

  $('#balance-total').text((+this.info.userBalance).toFixed(2));

  // show html container with user info and hide login button
  $userBox.show();
  $('#login').hide();
  $(".side-menu .hidden").show();
  if (+response.userRole === 100) {
    $(".side-menu .special").show();
  }

  if (response.search)
    setCookie("search", response.search, { "path": "/", "expires": 31536000 });

  // hash change to update page info
  // $( window ).trigger( "hashchange" )
};

/** Get user info by hash or user ID**/
User.prototype.getUserInfo = function () {
  var self = this;

  // request: getUserInfo, response: userInfo
  self.socket.emit('getUserInfo', JSON.stringify({ hash: self.hash }))
};

/** Get user info by hash or user ID**/
User.prototype.getUserInfoById = function (userId) {
  var self = this;

  // request: getUserInfoById, response: userInfoById
  self.socket.emit('getUserInfoById', JSON.stringify({ userId: userId }));
};

/** Get user info by hash or user ID**/
User.prototype.getUserInfoById = function (userId) {
  var self = this;

  // request: getUserInfoById, response: userInfoById
  self.socket.emit('getUserInfoById', JSON.stringify({ userId: userId }));
};

/** Check if user admin or author of the passed message **/
User.prototype.getFansAndFavorites = function (userHash) {
  var self = this;

  // request: getUserFansAndFavorites, response: userFansAndFavorites
  self.socket.emit('getUserFansAndFavorites', JSON.stringify({ hash: userHash }));
};

/** Wait until user info will be received **/
User.prototype.launchAfterUserInfoReceived = function (f, params, context) {
  var self = this;

  if (self.hash && !self.info.userId) {
    setTimeout(() => self.launchAfterUserInfoReceived(f, params, context), 50)
  } else {
    if (params) {
      if (context) {
        f.call(context, params);
      } else {
        f(params);
      }
    } else {
      f();
    }
  }
};

/** Get user name from nick or name \ lastname **/
User.prototype.getName = function (userData, fullName) {
  // if((userData.useNickname == 1 && userData.userNickname.length > 0) || userData.userName.length == 0) {
  //   return userData.userNickname;
  // }
  // else {
  // if(fullName)
  // 	return userData.userName + " " + userData.userLastName;
  // else
  // 	return userData.userName;
  // }
  return userData.userNickname;
};

/** Get user photo **/
User.prototype.getPhoto = function (userPhoto, userName) {
  return '<img src="' + userPhoto + '" alt="' + userName + '" style="max-width: 100%;">';
};

/** Get user photo **/
User.prototype.getAge = function (userBirthDate) {
  var self = this,
    bDate,
    ageDifMs,
    ageDate;

  bDate = new Date(userBirthDate);
  bDate = bDate.getTime();
  ageDifMs = +Date.now() - +bDate;
  ageDate = new Date(ageDifMs); // miliseconds from epoch

  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/** Get Online **/
User.prototype.getOnline = function (userObj) {
  if (+userObj.isBotOnline || userObj.userLastActive === 'online') {
    return 'online';
  } else {
    return userObj.userLastActive;
  }
};

/** Check if user admin or author of the passed message **/
User.prototype.isAuthorOrAdmin = function (userId) {
  var self = this;

  if ((self.hash && self.info.userId == userId && self.info.userRole >= 10) || self.info.userRole == 100) {
    return true;
  }

  return false;
};


/** Add another user to favorites**/
User.prototype.addOrRemoveFromFavorites = function (userId) {
  var self = this;

  var sendData = {
    hash: user.info.hash,
    profileId: userId
  };

  self.socket.emit('addUserFavorite', JSON.stringify(sendData));
};






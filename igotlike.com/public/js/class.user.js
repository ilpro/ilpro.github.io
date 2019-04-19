'use strict';
function User () {

};

/** Get user name from nick or name \ lastname **/
User.prototype.getName = function(userData) {
	return userData.userNickname;
};

/** Get user photo **/
User.prototype.getPhoto = function(userPhoto, userName) {
  var self = this;

  // if user change default guest avatar to custom uploaded photo
  if(userPhoto.length > 0) {
    // if photo refers to internal resource
    if(userPhoto.indexOf('http') !== -1) {
      return '<img src="' + userPhoto + '" alt="user" style="max-width: 100%;">';
    }

    if(userPhoto.indexOf('uploads') !== -1) {
      return '<img src="https://m.airybay.com' + userPhoto + '" alt="user" style="max-width: 100%;">';
    }

    return '<img src="https://m.airybay.com' + userPhoto + '" alt="user" style="max-width: 100%;">';
  }
  // or set default guest photo
  else {
    return '<img src="https://m.airybay.com/img/guestAva.png" alt="' + userName + '" style="max-width: 100%;">';
  }
};

/** Get user photo **/
User.prototype.getAge = function(userBirthDate) {
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
User.prototype.getOnline = function(userObj) {
  if(+userObj.isBotOnline || userObj.userLastActive === 'online') {
    return 'online';
  } else {
    return userObj.userLastActive;
  }
};

/** Check if user admin or author of the passed message **/
User.prototype.isAuthorOrAdmin = function(userId) {
  var self = this;

  if((self.hash && self.info.userId == userId && self.info.userRole >= 10) || self.info.userRole == 100) {
    return true;
  }

  return false;
};

'use strict';
function User(socket) {
	this.socket = socket;
};

/** Get user photo **/
User.prototype.getPhoto = function (userPhoto, userName){
	// if user change default guest avatar to custom uploaded photo
	if(userPhoto.length > 0){
		return '<img src="' + userPhoto + '" alt="user" style="max-width: 100%;">';
	} 
	// or set default guest photo
	else {
		return '<img src="/img/avatar_template.png" alt="' + userName + '" style="max-width: 100%;">';
	}
};

/** Get Online **/
User.prototype.getOnline = function (userObj){
	if(+userObj.isBotOnline || userObj.userLastActive === 'online'){
		return 'online';
	}	else {
		return userObj.userLastActive;
	}
};

/** Check if user admin or author of the passed message **/
User.prototype.isAuthorOrAdmin = function (userId){
	if ((userHash && userInfo.userId == userId && userInfo.userRole >= 10) || userInfo.userRole == 100) {
		return true;
	}
	
	return false;
};


/** Add another user to favorites**/
User.prototype.addOrRemoveFromFavorites = function (userId){
	this.socket.emit('addUserFavorite', JSON.stringify({hash: userHash, profileId: userId}));
};


/** Wait until user info will be received **/
User.prototype.launchAfterUserInfoReceived = function(f, params, context) {
	var self = this;

	if(userHash && !userInfo) {
		setTimeout(function (){
			self.launchAfterUserInfoReceived(f, params, context)
		}, 50)
	} else {
		if(params) {
			if(context) {
				f.call(context, params);
			} else {
				f(params);
			}
		} else {
			f();
		}
	}
};



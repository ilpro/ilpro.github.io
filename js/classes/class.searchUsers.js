'use strict';
function SearchUser(socket){
	this.socket = socket;
	this.page = '';
};

SearchUser.prototype.init = function (params){
	this.page = params.page || 'messages';
};

/** Check if user admin or author of the passed message **/
/** Handle user input in search field and looking for users in DB **/
SearchUser.prototype.search = function (searchStr){
	var self = this;
	var foundCount = 0;

	// if string is empty, show all last chatted users
	if(!searchStr) {
		lastChatUsers.getUsers();
		return;
	}

	// search for already existed users in last chat users section
	for(var i = 0; i < lastChatUsers.usersArr.length; i++){
		var userObj = lastChatUsers.usersArr[i];

		// if user has searched letters in nick, name or last name, show him
		if(checkUserForSearchedStr(userObj, searchStr)){
			// look for previously searched global users and delete them
			$('.message-person[data-searhed="true"]','.private-message-users').remove();

			$('.message-person[data-user-id="'+ userObj.userId +'"]','.private-message-users').show();
			foundCount++;
		}
		// or hide
		else {
			$('.message-person[data-user-id="'+ userObj.userId +'"]','.private-message-users').hide();
		}
	}

	// if nothing found, get users from DB
	if(foundCount === 0) {
		// request: searchForUsers, response: foundedUsers
		self.searchRequest(searchStr);
	}

	function checkUserForSearchedStr(user, str){
		var letters = str.toLowerCase();

		if((user.userNickname).toLowerCase().indexOf(letters) >= 0) {
			return true;
		}

		if((user.userName).toLowerCase().indexOf(letters) >= 0) {
			return true;
		}

		if((user.userLastName).toLowerCase().indexOf(letters) >= 0) {
			return true;
		}

		return false
	}
};

/** Check if user admin or author of the passed message **/
SearchUser.prototype.searchRequest = function (searchStr){
	var self = this;

	// request: searchForUsers, response: foundUsers
	self.socket.emit('searchForUsers', JSON.stringify({searchStr: searchStr}));
};


/** Insert last chatted users and unread messages count **/
SearchUser.prototype.insertFoundUsers = function (foundUsers) {
	var self = this;
	var searchedUsers = '';

	// loop over each user and insert userBox into html
	for (var i = 0; i < foundUsers.length; i++) {
		// user name
		var userName = user.getName(foundUsers[i]);

		// photo
		var userPhoto = user.getPhoto(foundUsers[i].userPhoto, userName);

		// add active class for userbox with user chat opened now and insert user name and photo into the top of chat
		var active = '';
		if (foundUsers[i].userId == self.recipientId) {
			active = 'active';
			self.insertRecipientInfo(userName, userPhoto);
		}

		// creating html with user 
		var userBoxHtml =
			'<a href="#page='+ self.page +'&chatId='+ foundUsers[i].userId +'" class="message-person '+ active + '" data-user-id="' + foundUsers[i].userId + '" data-searhed="true">\
					 <figure class="message-person-avatar" title="' + userName + '">\
						 ' + userPhoto + '\
					 </figure>\
					 <div class="name-status-holder flexcol">\
						 <div class="user-nickname">@' + userName + '</div>\
						 <div class="user-online-status">'+ foundUsers[i].userLastActive +'</div>\
					 </div>\
						 <svg class="user-favour svg-ico " data-userid="5" xmlns="http://www.w3.org/2000/svg" width="17" height="14" viewBox="0 0 17 14">\
							<path fill="#E8168B" d="M7.8,1.1c0-0.5,0.2-0.7,0.7-0.7c0,0,0.7-0.1,0.7,0.7c0,0.7-0.6,0.5-0.6,0.8C9,2.9,9.8,6.3,11.3,7 \
							c1.5,1.1,3.6-0.6,4.4-1.2c-0.2-0.7-0.1-1,0.1-1.2c0.2-0.2,0.6-0.2,0.8,0C17,4.7,17.1,5.2,17,5.4c-0.1,0.2-0.5,0.5-1,0.5 \
							c0,0-2.1,5.3-2.3,6c0,0.2-0.2,0.4-0.5,0.4H3.9c-0.2,0-0.4-0.1-0.5-0.4l-2.3-6C0.5,5.9,0.3,5.8,0,5.4c-0.1-0.4,0.1-0.7,0.4-0.8 \
							c0.1-0.1,0.6-0.2,0.8,0c0.4,0.2,0.4,0.6,0.1,1.1c0.8,0.7,3,2.1,4.1,1.5c1.2-0.5,2.8-4.7,2.9-5.2C8.3,1.6,7.9,1.7,7.8,1.1z \
							M13.5,12.6v1.1H3.5v-1.1H13.5z"></path>\
						 </svg>\
					 </a>';

		searchedUsers += userBoxHtml;
	}

	$('.private-message-users').empty().append(searchedUsers);
};


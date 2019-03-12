'use strict';
function SearchUser(socket) {
  this.socket = socket;
};


/** Check if user admin or author of the passed message **/
/** Handle user input in search field and looking for users in DB **/
SearchUser.prototype.search = function(searchStr) {
  var self = this;
  var foundCount = 0;

  // if string is empty, show all last chatted users
  if(!searchStr) {
    lastChatUsers.getUsers();
    return;
  }

  // search for already existed users in last chat users section
  for(var i = 0; i < lastChatUsers.usersArr.length; i++) {
    var userObj = lastChatUsers.usersArr[i];

    // if user has searched letters in nick, name or last name, show him
    if(checkUserForSearchedStr(userObj, searchStr)) {
      // look for previously searched global users and delete them
      $('.message-person[data-searhed="true"]', '.private-message-users').remove();

      $('.message-person[data-user-id="' + userObj.userId + '"]', '.private-message-users').show();
      foundCount++;
    }
    // or hide
    else {
      $('.message-person[data-user-id="' + userObj.userId + '"]', '.private-message-users').hide();
    }
  }

  // if nothing found, get users from DB
  if(foundCount === 0) {
    // request: searchForUsers, response: foundedUsers
    self.searchRequest(searchStr);
  }

  function checkUserForSearchedStr(user, str) {
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
SearchUser.prototype.searchRequest = function(searchStr) {
  var self = this;

  // request: searchForUsers, response: foundUsers
  self.socket.emit('searchForUsers', JSON.stringify({searchStr: searchStr}));
};


/** Insert last chatted users and unread messages count **/
SearchUser.prototype.insertFoundUsers = function(foundUsers) {
  var self = this;

  // loop over each user and insert userBox into html
  for(var i = 0; i < foundUsers.length; i++) {
    // user name
    var userName = user.getName(foundUsers[i]);

    // photo
    var userPhoto = user.getPhoto(foundUsers[i].userPhoto, userName);

    // add active class for userbox with user chat opened now and insert user name and photo into the top of chat
    var active = '';
    if(foundUsers[i].userId == self.recipientId) {
      active = 'active';
      self.insertRecipientInfo(userName, userPhoto);
    }

    // creating html with user
    var userBoxHtml =
      '<a href="#id=' + foundUsers[i].userId + '" class="message-person ' + active + '" data-user-id="' + foundUsers[i].userId + '" data-searhed="true">\
					 <figure class="message-person-avatar" title="' + userName + '">\
						 ' + userPhoto + '\
					 </figure>\
					 <div class="name-status-holder flexcol">\
						 <div class="user-nickname">' + userName + '</div>\
						 <!--<div class="user-online-status">online</div>-->\
					 </div>\
						 <svg class="user-favour svg-ico " data-userid="5" xmlns="http://www.w3.org/2000/svg" width="17" height="14" viewBox="0 0 17 14">\
							 	<path fill="#E8168B" d="M1.34 6.76l3.02 2.97c6.14-6.05 4.1-4.2 7.1-7.02 1.22-1.54 3.74-.67 3.74 1.32 0 .5-.17.95-.46 \
									1.3-.6.6-5.26 5.34-6.05 6.1l-.84-.8 6.03-6.14c.58-1-.85-1.92-1.54-1.02l-7.17 7.1 3.54 3.5 \
									7.37-7.5c.56-.7.9-1.58.9-2.54 0-3.3-3.73-5.14-6.35-3.27l-6.33 6.4L2.34 5.2c-1.27-1.34-.26-3.62 1.6-3.62.5 0 1.2.2 \
									1.6.74l-.84.9c-.36-.35-.6-.43-.78-.43-.74 0-1.16.86-.7 1.44l1.35 1.33L7.5 2.55C6.9.9 5.42-.07 3.7 0 .2.2-1.3 4.6 1.33 6.77z"/>\
						 </svg>\
					 </a>';

    $('.private-message-users').empty().append(userBoxHtml);
  }
};


SearchUser.prototype.searchById = function(searchStr) {
  var self = this;
  // var foundCount = 0;

  // if string is empty, get last emails
  if(!searchStr) {
    pageMessagesList.getLastEmails();
    return;
  }

  // check if user already exists in user list
  $('.single-email').each(function(i, elem) {
    if($(this).attr('data-user-id').indexOf(searchStr) == 0) {
      // // look for previously searched global users and delete them
      // $('.message-person[data-searhed="true"]','.private-message-users').remove();
      $(this).show();
    } else {
      $(this).hide();
    }
  });
  
  self.searchByIdRequest(searchStr);

  // // if nothing found, get users from DB
  // if(foundCount === 0) {
  //   // request: searchForUsers, response: foundedUsers
  //   self.searchRequest(searchStr);
  // }
  //
  // function checkUserForSearchedStr(user, str) {
  //   var letters = str.toLowerCase();
  //
  //   if((user.userNickname).toLowerCase().indexOf(letters) >= 0) {
  //     return true;
  //   }
  //
  //   if((user.userName).toLowerCase().indexOf(letters) >= 0) {
  //     return true;
  //   }
  //
  //   if((user.userLastName).toLowerCase().indexOf(letters) >= 0) {
  //     return true;
  //   }
  //
  //   return false
  // }
};

/** Check if user admin or author of the passed message **/
SearchUser.prototype.searchByIdRequest = function(searchStr) {
  var self = this;

  // request: searchForUsersById, response: foundUsersById
  self.socket.emit('searchForUsersById', JSON.stringify({searchStr: searchStr}));
};
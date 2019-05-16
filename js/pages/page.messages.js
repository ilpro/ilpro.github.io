'use strict';

/** Page **/
var pageMessages = {
  socket: {},
  userId: false, // self user ID
  recipientId: false, // user Id for open chat with
  lastMessageFromUserId: false, // user Id of last message in chat
  firstMessageId: false, // first message ID in chat to load more messages on scroll
  isFirstLoad: true, // if page was opened at first time

  /** Init **/
  init: function (params) {
    var self = this;

    self.socket = params.socket;
    self.userId = user.info.userId;

    // get stickers  and smiles packs before comments will load to correctly display stickers in html
    // request: sticker, response: stickers
    stickersAndEmoji.init({container: '.sticker-lift', socket: self.socket});

    lastChatUsers.init({userHash: user.info.hash, container: '.private-message-users'});
    searchUser.init({page: false});

    // handlers
    self.initSocketHandlers();
    self.initHandlers();

    // insert saved text
    self.insertMessageTextFromCookie();

    $(window).trigger("hashchange");
  },

  /** Load  chat after hashchange **/
  loadChat: function () {
    var self = this;
    var page = urlHash.getState('page');
    var userId = user.info.userId;

    // clear variables if  chat page changed
    self.destroy();

    // check if page has messages or defaults variables
    if (page === 'messages') {
      // get profile ID user chat with and clear chat messages to load new
      self.recipientId = urlHash.getState('chatId');

      // check if recipient selected
      if (self.recipientId) {

        self.clearChat();
        setTimeout(function () {
          $('.chat-body-smiles').show()
        }, 50);

        // timer waits for chat page DOM load
        setTimeout(function () {
          // get user info for user, that now is open
          user.getUserInfoById(self.recipientId);

          // get chat messages
          // request: getPrivateChatMessages, response: privateChatMessages
          message.getPrivateMessages(userId, self.recipientId);

          // focus in input field
          self.focus();
        }, 100)
      } else {
        $('.chat-body-smiles').hide();
      }
    }
  },

  /** Init handlers for listen events like "click" etc **/
  initHandlers: function () {
    var self = this;

    $(window).off('hashchange', self.loadChat).on('hashchange', self.loadChat.bind(self));

    // send message to another user
    $(document).off('click', '#private-chat-send-button').on('click', '#private-chat-send-button', function (e) {
      var $clickedBtn = $(e.target);
      var userObj = user.info;

      // user cannot write to himself
      if (!+self.recipientId || self.recipientId == userObj.userId) return;

      // check if user doesn't fill all of the fields for dating in settings page
      // if (urlHash.getState('page') === 'messages' && !self.isUserDatingSettingsReady()) {
      //   showFlipModal('.flipper.public-notify');
      //   $(".public-notify-discard, .public-notify-settings").off("click").on('click', function () {
      //     hideFlipModal('.flipper.public-notify');
      //   });
      //   return;
      // }
      
      // immediately add in chat message, then replace it after server request
      self.addPreviewHtmlMessage(userObj);
      message.sendPrivateMessage($clickedBtn, userObj.hash, self.recipientId);
      setTimeout(function () {
        stickersAndEmoji.getStickersFavorites();
      }, 300);
    });

    // handle enter press in send message field
    $(document).off("keydown", ".send-box").on("keydown", ".send-box", function (e) {
      // if user pressed  enter, send message
      // set cookie for 5 min
      setTimeout(function (){
        setCookie( "messageText", $('#private-messages-input-box').text(), {"path": "/", "expires": 300} );
      }, 50);
      
      if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
        $('#private-chat-send-button').click();
      }
    });

    // delete message
    $(document).off('click', '.delete-button').on('click', '.delete-button', function (e) {
      var $clickedBtn = $(e.target);
      self.deleteMessage($clickedBtn);
    });

    // load more previous messages when user scroll top
    $(document).off('wheel', '.chat').on('wheel', '.chat', function (e) {
      // if chat was scrolled up to the end, check first message id
      if ($(this).scrollTop() <= 100 && self.firstMessageId !== false) {
        // request: loadPreviousMessages; response: previousMessages
        message.loadMoreMessages(user.info.userId, self.recipientId, self.firstMessageId);

        // delete first message ID until it will be inserted again when response comes from server
        self.firstMessageId = false;
      }
    });

    // handle search field input
    $(document).off('keyup change', '#searchfield').on('keyup change', '#searchfield', function () {
      var searchStr = $(this).html().trim();
      searchUser.search(searchStr);
    });

    /* Stickers handlers */
    // open/close stickers
    $(document).off('click', '.open-chat-smiles-ico.clickable').on('click', '.open-chat-smiles-ico.clickable', function (e) {
      $('.chat-smiles, .cam-fans-favour-block, .chat-body').toggleClass('opened');
    });

    // send sticker
    $(document).off("click", ".send-smile").on("click", ".send-smile", function (e) {
      var $sticker = $(this);
      var $textField = $('#private-messages-input-box');
      var $sendBtn = $('#private-chat-send-button');
      stickersAndEmoji.sendSticker($sticker, $textField, $sendBtn);
    });

    // add or remove user to/from favorites
    $(document).off('click', '.private-message-users .user-favour').on('click', '.private-message-users .user-favour', function (e) {
      var userId = $(this).closest('.message-person').attr('data-user-id');
      user.addOrRemoveFromFavorites(userId);
      $(this).toggleClass('active');
    });

    // handle logout
    $(document).on('userLogout', function () {
      self.isFirstLoad = true;
    });

    // click on searched user loads all last chatted users
    $(document).off('click', '.message-person[data-searhed="true"]').on('click', '.message-person[data-searhed="true"]', function () {
      lastChatUsers.getUsers();
    });
  },

  isUserDatingSettingsReady(){
    if (user.info.userBdate !== "0000-00-00" &&
      user.info.userDatingShow === 1 &&
      user.info.userGender.length > 0 &&
      (user.info.userPhoto.length > 0 && user.info.userPhoto.indexOf('guestAva.png') === -1)
    ) {
      return true;
    }
    return false;
  },


  /** Socket handlers **/
  initSocketHandlers: function () {
    var self = this;

    // insert chat messages
    self.socket.off('privateChatMessages').on('privateChatMessages', function (data) {
      data = JSON.parse(data);
      
      // check if user in same chat or increase message count and exit
      if (data.recipientId != self.recipientId) {
        lastChatUsers.getUsers();
        return;
      }

      self.insertMessages(data.messages);
    });

    // insert chat user info if he not exists in last chatted users
    self.socket.off('userInfoById').on('userInfoById', function (data) {
      data = JSON.parse(data);

      // insert info about recipient
      self.insertRecipientInfo(data);

      // insert user box with if it not exists in last chatted users
      lastChatUsers.waitForUsers(lastChatUsers.createUserBox, lastChatUsers, data);
    });

    // if message doesn't send
    self.socket.off('messageError').on('messageError', function () {
      $('.delete-button', '.chat-single-block[data-message-id="false"]').addClass('error');
    });

    // insert more messages (previous)
    self.socket.off('moreMessages').on('moreMessages', function (data) {
      data = JSON.parse(data);
      self.insertMessages(data, true);
    });

    // if user see unread messages, check them as "read"
    self.socket.off('userReadMessages').on('userReadMessages', function (data) {
      data = JSON.parse(data);
      self.makeMessagesRead(data);
    });

    // insert founded users
    self.socket.off('foundUsers').on('foundUsers', function (data) {
      data = JSON.parse(data);
      searchUser.insertFoundUsers(data);
    });

    self.socket.on('disconnect', () => {
      self.recipientId = false;
      self.lastMessageFromUserId = false;
      self.firstMessageId = false;
    });
  },

  insertMessageTextFromCookie: function () {
    var text = getCookie("messageText") ? getCookie("messageText") : false;
    if(text){
      setTimeout(function (){
        $('#private-messages-input-box').html(text);
        cursorToTheEnd($('#private-messages-input-box')[0]);  // move focus cursor to the end of text
      }, 500);

    }
  },

  /**  Immediately Add preview message in HTML **/
  addPreviewHtmlMessage: function (userObj) {
    var self = this;

    var messageHtml;

    // prepare variables to insert
    var date = new Date();
    var userName = user.getName(userObj);
    var userPhoto = user.getPhoto(userObj.userPhoto, userName);

    // parse message text to insert stickers/smiles, highlight reference
    var msgText = $('#private-messages-input-box').html();

    msgText = message.parseMessages(message.htmlEscape(message.correctMessageBeforeSend(msgText)));

    // check if last message was from this user
    if (self.lastMessageFromUserId == user.info.userId) {
      messageHtml =
        '<li class="chat-single-block co-message" data-message-id="false">\
						 <div class="user-data-wrapper">\
						 <figure class="user-avatar" title="">\
								 ' + userPhoto + '\
               </figure>\
               <div class="user-message flexcol">\
                 <div class="nick-message">\
                     <div class="message-text">\
                       ' + msgText + '\
                     </div>\
                 </div>\
                 <div class="delete-button"></div>\
               </div>\
             </div>\
           </li>';
    } else {
      // full html message
      messageHtml =
        '<li class="chat-single-block main-message" data-message-id="false">\
						 <div class="user-data-wrapper">\
							 <figure class="user-avatar" title="">\
								 ' + userPhoto + '\
               </figure>\
               <div class="user-message flexcol">\
                 <div class="nick-message">\
                   <div class="nick-time-holder">\
                     <a class="user-nickname" href="/#page=profile&id=' + userObj.userId + '" target="_blank">@' + userName + '</a>\
                     <time class="comment-time" title="Comment time">' + date.getHours() + ':' + date.getMinutes() + '</time>\
                   </div>\
                     <div class="message-text">\
                       ' + msgText + '\
                     </div>\
                 </div>\
                 <div class="delete-button"></div>\
               </div>\
             </div>\
           </li>';
    }

    $('.chat-body > .chat').append(messageHtml);

    // update chat by scrolling down
    setTimeout(function () {
      self.scrollDown($('.chat-body > .chat'));
    }, 50);
  },

  /** Insert messages into html when response from server handled **/
  insertMessages: function (messagesObj, isMoreMessagesLoaded) {
    var self = this;
    var messages = messagesObj;
    var allMessagesHtml = '';

    // check if messages exists
    if (messages.length === 0) return;

    // save first message id
    self.firstMessageId = messages[0].messageId;

    // delete message preview
    $('.chat-single-block[data-message-id="false"]').remove();

    messages.forEach(function (msg, i, arr) {
      var messageHtml;

      if ($('.chat-single-block[data-message-id="' + msg.messageId + '"]').length > 0) {
        return;
      }

      messageHtml = self.getMessageTemplate(msg);
      allMessagesHtml += messageHtml;
    });

    // check if this new messages or user scrolled up and load more previous messages
    if (isMoreMessagesLoaded) {
      var currentHeight = $('.chat').prop("scrollHeight");
      $('.chat').prepend(allMessagesHtml);
      $('.chat').scrollTop($('.chat').prop("scrollHeight") - currentHeight);

      setTimeout(function () {
        $('.chat-single-block.filled-bg').removeClass('filled-bg');
      }, 50)
    } else {
      $('.chat').append(allMessagesHtml);
      // Scroll after stickers each load
      onImgLoad($('.message-text img[alt="sticker-msg"]'), function () {
        self.scrollDown($('.messages-wrapper'));
      });

      // update chat by scrolling down
      setTimeout(function () {
        self.scrollDown($('.chat'));
        // remove background color for new messages
        $('.chat-single-block.filled-bg').removeClass('filled-bg');
      }, 50);
    }

    // Load Lazy Chat Stickers in messages
    msgStickresLazyLoad();

    // make message read
    self.decreaseUnreadMessageCount(messages);
  },

  /** HTML template for user own messages **/
  getMessageTemplate(msg){
    var self = this;

    var html;

    // prepare variables to insert
    var date = message.formatDate(msg.messageTime);
    var handledMessageText = '';
    var userName = msg.userName;
    var userPhoto = user.getPhoto(msg.userPhoto, userName);

    // delete button - check if user registered and has author or admin privileges
    var deleteBtn = '';

    if (msg.type === 'text'){
      handledMessageText = message.parseMessages(msg.messageText);
    } else if (msg.type === 'sticker'){
      handledMessageText = '<img data-src="' + msg.link + '" alt="sticker-msg" contenteditable="false">';
    } else {
      handledMessageText = message.parseMessages(msg.messageText);
    }

    if (msg.userId === self.userId && user.isAuthorOrAdmin(msg.userId)) {
      if (msg.messageRead) {
        deleteBtn = '<div class="delete-button readed"></div>';
      } else {
        deleteBtn = '<div class="delete-button sended"></div>';
      }
    } else {
      deleteBtn = '<div class="delete-button"></div>';
    }

    // highlight new messages from another user
    var highLightMessage = msg.userId != self.userId ? 'filled-bg' : '';

    // check if one of user send two or more messages in a row
    if (self.isMessageFromSameUser(msg.userId)) {
      html =
        '<li class="chat-single-block co-message ' + highLightMessage + '" data-message-id="' + msg.messageId + '">\
             <div class="user-data-wrapper">\
             <figure class="user-avatar" title="">\
                 ' + userPhoto + '\
               </figure>\
               <div class="user-message flexcol">\
                 <div class="nick-message">\
                     <div class="message-text">\
                       ' + handledMessageText + '\
                     </div>\
                 </div>\
                 ' + deleteBtn + '\
               </div>\
             </div>\
           </li>';
    } else {
      // full html message
      html =
        '<li class="chat-single-block main-message ' + highLightMessage + '"  data-message-id="' + msg.messageId + '">\
             <div class="user-data-wrapper">\
               <figure class="user-avatar" title="">\
                 ' + userPhoto + '\
               </figure>\
               <div class="user-message flexcol">\
                 <div class="nick-message">\
                   <div class="nick-time-holder">\
                     <a class="user-nickname" href="/#page=profile&id=' + msg.userId + '" target="_blank">@' + userName + '</a>\
                     <time class="comment-time" title="Comment time">' + date.day + lang.lCommAtText + date.time + '</time>\
                   </div>\
                     <div class="message-text">\
                       ' + handledMessageText + '\
                     </div>\
                 </div>\
                 ' + deleteBtn + '\
               </div>\
             </div>\
           </li>';
    }

    return html;
  },

  /** Delete message from chat and DB **/
  deleteMessage: function ($clickedBtn) {
    var self = this;

    var $msgBox = $clickedBtn.closest('.chat-single-block');
    var msgId = $msgBox.attr('data-message-id');
    $msgBox.remove();

    message.deletePrivateMessage(msgId);
  },

  /** When recipient reads user messages, add change class for delete button **/
  makeMessagesRead: function (readMessages) {
    var self = this;
    for (var i = 0; i < readMessages.length; i++) {
      var id = readMessages[i].messageId;
      $('.chat-single-block[data-message-id="' + id + '"]').find('.delete-button').addClass('readed')
    }
  },

  /** Decrease unread messages number **/
  decreaseUnreadMessageCount: function (messagesArr) {
    var self = this;
    var messageIds = [];
    var userObj = user.info;

    // make array with message Ids
    for (var i = 0; i < messagesArr.length; i++) {
      if (messagesArr[i].userId != userObj.userId && messagesArr[i].messageRead == 0) {
        messageIds.push(messagesArr[i].messageId);
      }
    }

    // exit if there are no unread messages
    if (messageIds.length === 0) return;

    // emit to server and get back last chat users and messages
    message.userReadMessages(userObj.hash, messageIds);
  },

  /** Insert recipient name in top of chat **/
  insertRecipientInfo: function (data) {
    var self = this;
    console.log(data);
    // user name
    var userName = data.userName;

    // photo
    var userPhoto = user.getPhoto(data.userPhoto, userName);

    // online
    var online = user.getOnline(data);
    $('.user-nickname', '.chat-user-title').empty().html('@'+userName);
    $('.user-avatar', '.chat-user-title').empty().append(userPhoto);
    $('.chat-user-title .nick-photo-wrapper').attr('href', '/#page=profile&id=' + data.userId);

    if (online === 'online') {
      $('.online-status', '.chat-user-title').addClass('online');
    } else {
      $('.online-status', '.chat-user-title').removeClass('online');
    }

    $('.online-status', '.chat-user-title').html(online)
  },

  /** Update all chat info with deleting previous html elements **/
  update: function () {
    var self = this;

    // get user chat list
    $('.private-message-users').empty();
    // $('#messages-menu').removeClass(' messages').attr('data-amount', 0);

    $('.chat').empty();
    self.clearChat();
    lastChatUsers.getUsers();
  },

  destroy: function () {
    var self = this;

    // self.isFirstLoad = true;
    self.recipientId = false;
    self.lastMessageFromUserId = false;
    self.firstMessageId = false;
    $('.private-messages-title, .chat-body-smiles').hide();

    lastChatUsers.destroy();
  },

  /** Delete all text in input area **/
  clearChat: function () {
    $('.chat').add('#searchfield').add('#private-messages-input-box').empty('');
    $('.message-person[data-searhed="true"]').add('.message-person[data-msg-time="never"]').remove();
  },

  /** Check if previous message was from the same user **/
  isMessageFromSameUser: function (userId) {
    var self = this;

    // if this is first load or last message was not from this user, return false
    if (!self.lastMessageFromUserId || self.lastMessageFromUserId != userId) {
      self.lastMessageFromUserId = userId;
      return false;
    }
    // if last message was from the same user, return true
    else {
      self.lastMessageFromUserId = userId;
      return true;
    }
  },

  /** Scroll down to the latest message in the chat **/
  scrollDown: function ($chatContainer) {
    $chatContainer.scrollTop($chatContainer.prop("scrollHeight"));
  },

  /** Focus in the end of input text area **/
  focus: function () {
    $('#private-messages-input-box').focus();
  },
};

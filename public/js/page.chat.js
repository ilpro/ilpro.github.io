'use strict';
var user = new User(dataSocket);
var lastChatUsers = new LastChatUsers(dataSocket);
var searchUser = new SearchUser(dataSocket);
var message = new Message(dataSocket);

var pageChat = {
  socket: {},
  conversationId: false,
  conversationType: false,
  lastMessageFromUserId: false, // user Id of last message in chat
  firstMessageId: false, // first message ID in chat to load more messages on scroll
  cost: {},
  player: false,
  recipientStream: false,
  stickersSrc: {},

  attachments: [],
  videoFormats: {
    'mov': true,
    'mpeg4': true,
    'mp4': true,
    'avi': true,
    'wmv': true,
    'mpegps': true,
    'flv': true,
    '3gpp': true,
    'webm': true
  },
  imageFormats: {
    'jpg': true,
    'png': true,
    'jpeg': true
  },

  userPhoto: false,
  userName: false,

  timestampForClearCache: 86400000, // 24 hours

  init: function () {
    var self = this;

    self.socket = dataSocket;

    self.initSocketHandlers();
    self.initHandlers();
    self.initAttachments();
    self.initStickers();

    lastChatUsers.init();

    // get translator languages from cookie
    self.getTranslatorCookie();

    // hash change handler
    $(window).on('hashchange', function (e) {
      // get profile ID user chat with and clear chat messages to load new
      self.clearChat();
      self.conversationId = +urlHash.getState('conversationId');
      var receiverId = +urlHash.getState('id');

      if(!self.conversationId && !receiverId){
        return $('.main-chat-footer, .main-chat-header').hide();
      }

      if((!self.conversationId && receiverId) && (userInfo.userId !== receiverId)){
        return self.checkConversationExists(receiverId)
      }

      return self.insertConversationInfo();
    });

    $(window).trigger("hashchange");
  },

  checkConversationExists(receiverId){
    var self = this;
    self.socket.emit('checkPrivateConversationExists', JSON.stringify({hash: userHash, receiverId: receiverId}));
  },

  insertConversationInfo(){
    var self = this;
    $('.main-chat-footer, .main-chat-header').show();

    // get user info for user, that now is open
    // self.getCachedRecipientInfo(self.recipientId);
    self.getConversationInfoById(userHash, self.conversationId);

    // highlight selected user
    $('.chat-sidebar-user')
      .removeClass('current')
      .filter('[data-conversation-id="' + self.conversationId + '"]')
      .addClass('current');

    user.launchAfterUserInfoReceived(function () {
      if (self.conversationId) {
        $('.connect-status').html('Updating...');
        $('#chat-container').html(svgObj.chatLoader);
        message.getChatMessages(userHash, self.conversationId);
      }
    });

    // focus in input field
    self.focus();
  },

  _createConversation(hash, receivers){
    this.socket.emit('createConversation', JSON.stringify({hash, receivers}));
  },

  getConversationInfoById(hash, conversationId){
    this.socket.emit('getConversationInfoById', JSON.stringify({hash, conversationId}));
  },

  /** Init handlers for listen events like "click" etc **/
  initHandlers: function () {
    var self = this;

    // send message to another user
    $('#send-message').click(function (e) {
      var $textField = $('#chat-input');

      var rowText = $textField.html();
      var messageText = message.correctMessageBeforeSend(rowText);
      if (!self.checkConditionsBeforeSend(messageText)) {
        return;
      }

      // immediately add in chat message, then replace it after server request
      self.addPreviewHtmlMessage();
      message.sendMessage(messageText, userHash, self.conversationId, self.attachments);

      // clear chat
      $textField.html('');
      $('[data-text-field="main"]').html('');
      $('[data-text-field="secondary"]').html('');

      // clear attachments
      $('#attachments').empty().hide();
      self.attachments.length = 0;

      // close translator
      $('.translator-window .close').click();
      self.scrollDown();

      // focus
      $('[data-text-field="main"]').focus();

      // update favorite stickers
      setTimeout(function () {
        self.getStickersFavorites();
      }, 300);

      // send google analytics if this is user first message
      self.sendGoogleEvent();
    });

    // handle enter press in send message field or calculate symbols
    $(document).on("keyup", ".main-chat-footer", function (e) {
      var $textField = $('#chat-input');
      var rowText = $textField.html();
      var correctedText = message.correctMessageBeforeSend(rowText);
      var cost = message.calcChatCost(correctedText);

      // if user pressed  enter, send message
      if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
        $('#send-message').click();
      }
    });

    // filter chats
    $('.chat-filter').on('change', function (){
      var $inputs = $('.chat-filter:checked');
      var filter = [];

      $.each($inputs, function (key, val){
        filter.push($(val).attr('data-filter'))
      });

      lastChatUsers.getUsers(null, filter)
    });

    // draggable & resizable translation-window
    $(function () {
      $(".video-translation").draggable({
        scroll: false,
        containment: "body",
        snap: ".translation-place",
        snapMode: "inner"
      });
      $(".video-translation").resizable({aspectRatio: 4 / 3});
    });

    // load more previous messages when user scroll top
    $('#chat-container').on('wheel', function (e) {
      // if chat was scrolled up to the end, check first message id
      if ($(this).scrollTop() <= 100 && self.firstMessageId !== false) {
        // request: loadPreviousMessages; response: previousMessages
        message.loadMoreMessages(userHash, self.conversationId, self.firstMessageId);

        // delete first message ID until it will be inserted again when response comes from server
        self.firstMessageId = false;
      }
    });

    // change user to bot and load all it info
    $('.favour-users-block').on('click', '.favour-user', function (e) {
      $('.favour-user').removeClass('active');
      $(this).addClass('active');

      // select bot
      userBots.selectBot($(this));

      // update all chat info with deleting previous html elements
      self.update();
    });

    // handle search field input
    $('#searchfield').off('keyup change').on('keyup change', function () {
      var searchStr = $(this).html();
      searchUser.search(searchStr);
    });

    /* Stickers handlers */
    // open/close stickers
    $('.open-chat-smiles-ico.clickable').click(function (e) {
      $('.chat-smiles').toggleClass('opened');
    });

    // change sticker set
    $(document).off("click", ".sticker-nav-item").on("click", ".sticker-nav-item", function (e) {
      e.preventDefault();
      self.changeStickerSet($(this));
    });

    // send sticker or emoji
    $(document).on("click", ".send-smile", function (e) {
      var $sticker = $(this);
      var $textField = $('#chat-input');
      var $sendBtn = $('#send-message');

      self.sendSticker($sticker, $textField, $sendBtn);
      message.calcChatCost(message.correctMessageBeforeSend($textField.html()));

      // send google event if this first user's message
      self.sendGoogleEvent();
    });

    // add or remove user to/from favorites
    $('.private-message-users').on('click', '.user-favour', function (e) {
      var userId = $(this).closest('.chat-sidebar-user').attr('data-user-id');
      user.addOrRemoveFromFavorites(userId);
      $(this).toggleClass('active');
    });

    // Read all messages
    $(document).on('click', '#read-all', function () {
      self.socket.emit('readAllChatMessages', JSON.stringify({hash: userHash}));
    });

    // hide chat status modal
    $(".ok-btn").on("click", function () {
      hideFlipModal();
    });

    // close "add to favorites" modal
    $('.btn-cancel, .close', '#modal-favorites').on('click', function () {
      $('#modal-favorites').removeClass('active');
    });

    // // add user to favorites from modal window
    // $('.btn-add', '#modal-favorites').on('click', function () {
    //   self.socket.emit('addUserFavorite', JSON.stringify({hash: userHash, profileId: self.recipientId}));
    //   hideFlipModal();
    // });

    //show & hide stikers
    $('.smile-holder').click(function () {
      $('.sticker-container-holder').toggleClass('hide');
      $('.sticker-nav').toggleClass('hide');
      if ($(".camgirl-holder").length)
        $('.camgirl-holder-wrap').toggleClass('show');
      else
        $('.camgirl-holder-wrap').removeClass('show');
    });

    //show & hide current translation
    $(".main-chat-header .cam-status").click(function () {
      if ($(".translation-holder").hasClass("active")) {
        self.player.disconnect();
        self.player = false;
        var swfReady = false;
        $(".translation-holder").removeClass("active");
      }
      else {
        $(".translation-holder").addClass("active");
      }
    });

    //show translator
    $(".translator-activator").click(function () {
      $('.translator-activator, .bottom-chat, .attach-holder, .smile-holder, .main-chat-body').addClass('hide');
      $('.translator-window, .btn-translate').addClass('active');

      // copy whole html to translate window
      $('[data-text-field="translate-from"]').html($('[data-text-field="main"]').text());

      // change ID of elem
      $('[data-text-field="main"]').removeAttr('id');
      $('[data-text-field="secondary"]').attr('id', 'chat-input');
      $('[data-text-field="main"]').focus();
    });

    //turn off translator
    $(".translator-window .close").click(function () {
      $('.translator-activator, .bottom-chat, .attach-holder, .smile-holder, .main-chat-body').removeClass('hide');
      $('.translator-window, .btn-translate').removeClass('active');

      // copy whole html to main text field
      if ($('[data-text-field="secondary"]').html().length > 0) {
        $('[data-text-field="main"]').html($('[data-text-field="secondary"]').html());
      }

      // change ID
      $('[data-text-field="secondary"]').removeAttr('id');
      $('[data-text-field="main"]').attr('id', 'chat-input');
      $('[data-text-field="main"]').focus();

      // clear translator field
      $('[data-text-field="secondary"]').html('');
    });

    // redirect click on email attachment
    $(document).on('click', '#attachment', function () {
      $('.fs-upload-target').click();
    });

    // remove uploaded attachment
    $(document).on('click', '#attachments .close', function () {
      var $box = $(this).closest('.msg-holder.loader');
      var src = $box.find('img').attr('src');

      for (var i = 0; i < self.attachments.length; i++) {
        if (self.attachments[i].indexOf(src) != -1) {
          self.attachments.splice(i, 1);
          break;
        }
      }
      $box.remove();

      // recalc chat cost
      message.calcChatCost(message.correctMessageBeforeSend($('#chat-input').html()))
    });

    // search user by name or ID
    $(document).on('change', '#user-search', function () {
      var searchStr = $(this).val();
      $('.page-messages-list').html('Loading...');
      lastChatUsers.getUsers(searchStr);
    });

    // remove any text from search by user name or id
    $(document).on('click', '#user-search-cancel', function () {
      $('#user-search').val('');
      $('.page-messages-list').html('Loading...');
      lastChatUsers.getUsers();
    });

    // translator open/close
    $('.translator-button').click(function () {
      $('.translator-wrapper').addClass('translate-active');
      $('.enter-text-field, .open-chat-smiles-ico, .add-item-to-message-ico').addClass('hide');

      // copy whole html to translate window
      $('[data-text-field="translate-from"]').html($('[data-text-field="main"]').text());

      // change ID of elem
      $('[data-text-field="main"]').removeAttr('id');
      $('[data-text-field="secondary"]').attr('id', 'chat-input');
      $('[data-text-field="translate-from"]').focus();
    });
    $('.translator-close').click(function () {
      $('.translator-wrapper').removeClass('translate-active');
      $('.enter-text-field, .open-chat-smiles-ico, .add-item-to-message-ico').removeClass('hide');

      // copy whole html to main text field
      if ($('[data-text-field="secondary"]').html().length > 0) {
        $('[data-text-field="main"]').html($('[data-text-field="secondary"]').html());
      }

      // change ID
      $('[data-text-field="secondary"]').removeAttr('id');
      $('[data-text-field="main"]').attr('id', 'chat-input');
      $('[data-text-field="main"]').focus();
    });

    // translate message
    $('#translate').on('click', function () {
      var from = $('#translate-from option:selected').val();
      var to = $('#translate-to option:selected').val();

      var $textField = $('[data-text-field="translate-from"]');
      var rowText = $textField.html();

      self.socket.emit('translateChat', JSON.stringify({from: from, to: to, text: rowText}));
      $('[data-text-field="translate-from"]').focus();

      // set translator cookie
      self.setTranslatorCookie(from, to);
    });

    // replace languages
    $(document).on('click', '#translate-reverse', function () {
      var langFrom = $('#translate-from option:selected').val();
      var langTo = $('#translate-to option:selected').val();

      $('#translate-from option').prop('selected', false);
      $('#translate-to option').prop('selected', false);

      $('#translate-from option[value="' + langTo + '"]').prop('selected', true);
      $('#translate-to option[value="' + langFrom + '"]').prop('selected', true);
    });

    $(".chosen-translate").chosen({width: "100px"});

    // // add\remove from favorites
    // $("#to-favorites").click(function () {
    //   dataSocket.emit('addUserFavorite', JSON.stringify({hash: userHash, profileId: self.recipientId}));
    //   $(this).toggleClass("active");
    // });

    // // add/remove from blacklist
    // $('#block-unblock').click(function (){
    //   self.socket.emit('toggleUserBlackList', JSON.stringify({hash: userHash, profileId: self.recipientId}));
    // });

    setInterval(function () {
      self.socket.emit('getClientsOnline', JSON.stringify({hash: userHash}));
    }, 30000);
  },

  /** Socket handlers **/
  initSocketHandlers: function () {
    var self = this;

    // insert chat messages on first load chat with this recipient id
    self.socket.on('getChatMessages', function (data) {
      data = JSON.parse(data);
      if(!data.success) return showAlertModal(data.message);
      self.insertMessagesBulk(data);
    });

    // insert chat message
    self.socket.on('sendChatMessage', function (data) {
      data = JSON.parse(data);

      lastChatUsers.moveUpUserBox(data);

      if (data.conversationId === self.conversationId) {
        self.insertMessage(data);
      } else {
        notifications.changeChatCount(+1);
      }
    });

    self.socket.on('checkPrivateConversationExists', function (data) {
      data = JSON.parse(data);
      if(!data.success) return showAlertModal(data.message);

      if(data.isConversationExists){
        self.conversationId = data.conversationId;
        self.insertConversationInfo();
        urlHash.pushState({conversationId: self.conversationId});
      } else {
        if(data.receiverId !== userInfo.userId){
          self._createConversation(userHash, [data.receiverId])
        }
      }
    });

    // insert chat messages on first load chat with this recipient id
    self.socket.on('createConversation', function (data) {
      data = JSON.parse(data);
      if(!data.success) return showAlertModal(data.message);
      self.conversationId = data.conversationId;
      self.insertConversationInfo();
      lastChatUsers.getUsers();
      urlHash.pushState({conversationId: self.conversationId});
    });

    // insert chat user info if he not exists in last chatted users
    self.socket.on('getConversationInfoById', function (data) {
      data = JSON.parse(data);

      // lastChatUsers.waitForUsers(lastChatUsers.createUserBox(data));
      $('#chat-loader').remove();
      self.insertRecipientInfo(data);
    });

    // if user see unread messages, check them as "read"
    self.socket.on('userReadMessages', function (data) {
      data = JSON.parse(data);
      if (self.conversationId === data.conversationId) {
        $('.msg-line').not('.flex-row-reverse').addClass('watched');
        $('#chat-total').html(data.totalUnread);
        notifications.chatTotal = data.totalUnread;
        if(data.totalUnread === 0){
          $('#chat-total').removeClass('messages')
        }
      }
    });

    // if user hasn't permissions
    self.socket.on('chatMessageError', function (data) {
      data = JSON.parse(data);

      $('#chat-container .msg-line[data-message-id="false"]').addClass('not');

      // user not active or banned or has no permission to write
      if (data.type === 'PERMISSION') {
        showAlertModal("Sorry, you have no permission to write this user or you are banned");
      }

      // user set dont write status
      if (data.type === 'USER_STATUS_3') {
        var html =
          '<p>You are unable to write while having <span>dont write me</span>\
             <svg style="display: inline; margin-right: 0; height: 20px;" xmlns="http://www.w3.org/2000/svg" width="16.239" height="16.239" viewBox="0 0 16.239 16.239"><circle cx="8.119" cy="8.119" r="8.119" fill="red"></circle> \
             <rect x="3.057" y="6.484" width="10.125" height="3.271" fill="#fff"></rect> \
           </svg>\
           status. <br> Choose \
           <span>ready to talk</span>\
           <svg style="display: inline; margin-right: 0; height: 20px;" xmlns="http://www.w3.org/2000/svg" width="16.225" height="16.225" viewBox="0 0 16.225 16.225"> \
             <circle cx="8.112" cy="8.112" r="8.112" fill="#39b54a"></circle> \
             <path d="M7.567,14a1.287,1.287,0,0,1-1.082-.59L2.518,7.241,4.681,5.85,7.48,10.2,11.5,2.894l2.254,1.239-5.059,9.2A1.285,1.285,0,0,1,7.611,14Z" fill="#fff"></path> \
           </svg>\
           in order to join conversation. \
         </p>';
        showAlertModal(html);
      }

      // receiver set 'dont write status'
      if (data.type === 'RECEIVER_STATUS_3') {
        var html =
          '<p>The user has <span>dont write me</span>\
            <svg style="display: inline; margin-right: 0; height: 20px;" xmlns="http://www.w3.org/2000/svg" width="16.239" height="16.239" viewBox="0 0 16.239 16.239">\
              <circle cx="8.119" cy="8.119" r="8.119" fill="red"></circle>\
              <rect x="3.057" y="6.484" width="10.125" height="3.271" fill="#fff"></rect>\
            </svg>\
            status. <br> Try again later.\
          </p>';
        showAlertModal(html);
      }

      // receiver set status "only favorites" and user not in receiver's favorites
      if (data.type === 'USER_STATUS_2' || data.type === 'RECEIVER_STATUS_2') {
        $('figure', '#modal-favorites').html($('.user-avatar-holder', '.main-chat-header').html());
        $('.name', '#modal-favorites').html($('.nickname', '.main-chat-header').html());
        $('#modal-favorites').addClass('active');
      }

      // user blocked by receiver
      if (data.type === 'USER_IN_BLACKLIST') {
        showAlertModal('Can not send message. You were blocked by a user.');
      }
    });

    self.socket.on('translatedChat', function (data) {
      var text = JSON.parse(data);
      text = message.htmlEscapeBack(text);
      $('[data-text-field="secondary"]').html(text);

      // recalculate message price
      var $textField = $('#chat-input');
      var rowText = $textField.html();
      var correctedText = message.correctMessageBeforeSend(rowText);
      message.calcChatCost(correctedText);
    });

    // if admin/model: insert recipient goal
    dataSocket.on('getUserAuthInfo', function (data) {
      data = JSON.parse(data);
      if (data.user.userRole >= 19) {
        $('#recipient-goal').show();
      }
    });

    // if admin/model: insert recipient goal
    dataSocket.on('addUserBlacklist', function (data) {
      data = JSON.parse(data);
      if(data.action === 'add'){
        $('#block-unblock').addClass('active');
      } else {
        $('#block-unblock').removeClass('active');
      }
    });

    // get stickers
    // insert stickers when received
    self.socket.off('userStickers', self.insertStickers).on('userStickers', function (data) {
      self.insertStickers(data);
    });

    /** Insert sticker favorites **/
    self.socket.off('stickersFavorites').on('stickersFavorites', function (data) {
      self.favorites = JSON.parse(data);

      if ($('#favorites-set').length > 0) {
        self.insertFavorites(data);
      } else {
        self.socket.emit('getUserStickers', JSON.stringify({hash: userHash}));
      }
    });
  },

  /** Check message and user before send to server **/
  checkConditionsBeforeSend: function (text) {
    var self = this;
    var textWithoutSpace = text.replace(/ /g, "");

    // if there is no message or user not logged in - exit
    if ((textWithoutSpace.length === 0 && self.attachments.length === 0) || !userHash) {
      return false;
    }
    return true
  },

  // insert recipient name and photo
  setCachedRecipientInfo: function (recipientId, recipientName, recipientPhoto) {
    var self = this;
    var recipients = localStorage.getItem('recipientsInfo');
    var currentTimestamp = new Date().getTime();

    if (!recipients) {
      recipients = {updatedAt: currentTimestamp};
    } else {
      recipients = JSON.parse(recipients);

      // clear old cache
      if(recipients.updatedAt < (currentTimestamp - self.timestampForClearCache)){
        recipients = {updatedAt: currentTimestamp};
      }
    }

    // check if recipientsInfo.recipientId object exists in storage
    recipients['recipientId-' + recipientId] = {
      name: recipientName,
      photo: recipientPhoto
    };

    return localStorage.setItem('recipientsInfo', JSON.stringify(recipients));
  },

  // get  messages from local storage before they will updates from DB
  getCachedRecipientInfo: function (recipientId) {
    var self = this;
    // get cached messages from storage and insert them into DOM
    var recipients = localStorage.getItem('recipientsInfo');

    if (!recipients) return;

    recipients = JSON.parse(recipients);

    if (recipients['recipientId-' + recipientId]) {
      $('.user-info', '.main-chat-header').attr('href', '/profile/' + recipientId);
      $('.nickname', '.main-chat-header').empty().html(recipients['recipientId-' + recipientId].name);
      $('.user-avatar-holder', '.main-chat-header').empty().append(recipients['recipientId-' + recipientId].photo);
    }
  },

  /**  Immediately Add preview message in HTML **/
  addPreviewHtmlMessage: function (error) {
    var self = this;

    // prepare to insert + 2 hours
    var dt = new Date().getTime();
    var msgText = $('#chat-input').html();
    msgText = message.parseMessage(message.htmlEscape(message.correctMessageBeforeSend(msgText)));

    // prepare variables to insert
    var msg = {
      date: formatTime.chat(dt),
      userId: userInfo.userId,
      messageId: false,
      userPhoto: userInfo.userPhoto,
      handledMessageText: msgText
    };

    $('#chat-container').append(self.messageTemplateFull(msg, true));

    // update chat by scrolling down
    setTimeout(function () {
      self.scrollDown();
    }, 50);
  },

  /** Insert messages into html when response from server handled **/
  insertMessagesBulk: function (data, isMoreMessagesLoaded) {
    var self = this;
    var allMessagesHtml = '';
    var conversationId = +data.conversationId;
    var messages = data.messages;
    var receivers = data.receivers;

    $('#chat-loader').remove();

    if (conversationId !== self.conversationId || messages.length === 0) return;

    $('#refill-form, #refill-novice').removeClass('active');
    $('.tutorial').remove();

    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      var messageHtml;
      msg.receiverId = receivers[0];

      // prepare variables to insert
      msg.date = formatTime.chat(msg.messageTime);

      // parse message text to insert stickers/smiles, highlight reference
      if (msg.type === 'text') {
        msg.handledMessageText = message.parseMessage(msg.messageText);
      } else if (msg.type === 'sticker') {
        msg.handledMessageText = '<img src="' + msg.link + '" alt="smile" contenteditable="false">';
      } else {
        msg.handledMessageText = message.parseMessage(msg.messageText);
      }

      allMessagesHtml += self.messageTemplateFull(msg);
    }

    // check if this new messages or user scrolled up and load more previous messages
    if (isMoreMessagesLoaded) {
      var currentHeight = $('#chat-container').prop("scrollHeight");
      $('#chat-container').prepend(allMessagesHtml);
      $('#chat-container').scrollTop($('#chat-container').prop("scrollHeight") - currentHeight);

      setTimeout(function () {
        $('.chat-single-block.filled-bg').removeClass('filled-bg');
      }, 50)
    } else {
      $('#chat-container').empty().append(allMessagesHtml);
      // self.setCachedChat(userInfo.userId, self.recipientId, allMessagesHtml);

      // update chat by scrolling down
      setTimeout(function () {
        self.scrollDown();
        // remove background color for new messages
        $('.chat-single-block.filled-bg').removeClass('filled-bg');
      }, 50);
    }

    // make message read
    self.decreaseUnreadMessageCount(messages);
  },

  /** Insert messages into html when response from server handled **/
  insertMessage: function (data) {
    var self = this;
    var msg = data;
    var messageHtml = '';

    // delete message preview
    $('#chat-container .msg-line[data-message-id="false"]').remove();

    // prepare to insert
    var dt = new Date().getTime();
    msg.date = formatTime.chat(dt);

    // parse message text to insert stickers/smiles, highlight reference
    msg.handledMessageText = message.parseMessage(msg.message);
    messageHtml = self.messageTemplateFull(msg);

    // insert message html
    $('#chat-container').append(messageHtml);

    // update chat by scrolling down
    setTimeout(function () {
      self.scrollDown();
      // remove background color for new messages
      $('.chat-single-block.filled-bg').removeClass('filled-bg');
    }, 50);

    // make message read
    if (+data.userId != userInfo.userId) {
      message.userReadMessages(userHash, self.conversationId);
    }
  },

  messageTemplateFull: function (msg, preview) {
    var self = this;

    var attachments = '';
    if (msg.attachment && msg.attachment.length > 0) {
      attachments = self.getAttachmentHtml(msg);
    }

    var reversedMsg = '';

    // check if message is mine
    if(+msg.userId === +userInfo.userId){
      reversedMsg = 'flex-row-reverse';
    }

    var messageHtml =
      '<div class="row msg-line ' + reversedMsg + ' " data-message-id="' + msg.messageId + '">\
         <figure class="user-avatar-holder">\
           <a href="/profile/'+ msg.userId +'"><img src="' + msg.userPhoto + '"></a>\
         </figure>\
         <div class="msg-holder">\
           ' + msg.handledMessageText + '\
           <div class="date">' + msg.date +'</div>\
           ' + attachments + '\
         </div>\
      </div>';

    return messageHtml;
  },

  /** Decrease unread messages number **/
  decreaseUnreadMessageCount: function () {
    message.userReadMessages(userHash, this.conversationId);
    var number = +$('.chat-sidebar-user[data-conversation-id="' + this.conversationId + '"] .indicator-count').html();
    $('.chat-sidebar-user[data-conversation-id="' + this.conversationId + '"]').find('.indicator-count').remove();
  },

  /** Insert recipient name in top of chat **/
  insertRecipientInfo: function (data) {
    var self = this;

    // var userPhoto = user.getPhoto(data.userPhoto, data.userName);
    // var online = user.getOnline(data);

    var link = '/profile/' + data.id;
    if(data.conversationType === 'event'){
      link = '/events/';
    }
    $('.user-info', '.main-chat-header').attr('href', link);
    $('.nickname', '.main-chat-header').empty().html(data.name);
    $('.user-avatar-holder', '.main-chat-header').empty().append('<img src="' + data.image + '">');

    // if (data.inFavorites) {
    //   $('.fav-status', '.main-chat-header').addClass('active');
    // } else {
    //   $('.fav-status', '.main-chat-header').removeClass('active');
    // }
    //
    // if (data.inBlackList) {
    //   $('#block-unblock').addClass('active');
    // } else {
    //   $('#block-unblock').removeClass('active');
    // }
    //
    // if (online === 'online') {
    //   $('.connect-status', '.main-chat-header').addClass('online')
    // } else {
    //   $('.connect-status', '.main-chat-header').removeClass('online')
    // }
    //
    // $('.connect-status', '.main-chat-header').html(online);

    // self.setCachedRecipientInfo(data.userId, data.userName, userPhoto);
  },

  /** Update all chat info with deleting previous html elements **/
  update: function () {
    var self = this;

    // get user chat list
    $('.private-message-users').empty();
    $('#chat-total').removeClass(' messages').attr('data-amount', 0);

    // get private messages for this bot and this opened chat ID
    $('#chat-container').empty();
    self.clearChat();

    if (+$('#balance-amount').html() >= 10) {
      $('#refill-novice, #refill-form').removeClass('active');
    }

    // get user chat list
    lastChatUsers.getUsers();

    $(window).trigger("hashchange");
  },

  /** Delete all text in input area **/
  clearChat: function () {
    $('#chat-container').add('#searchfield').add('#chat-input').empty('');
    $('.chat-sidebar-user[data-searhed="true"]').remove();
    $('[data-goal-id]', '#recipient-goal').hide();
  },

  /** photo/video attachment **/
  initAttachments: function () {
    var self = this;

    var $emailAttachmentBtn = $('.fs-upload-target');

    $emailAttachmentBtn.upload({
      beforeSend: onBeforeSend,
      action: "/chat/attachment",
      postKey: "file",
      maxSize: 52428800, // 50mb
      // maxSize: 1024000, // 1mb
      postData: {type: "general", hash: userHash},
      label: ''
    });

    function onBeforeSend(formData, file) {
      var fileName = file.name.toLowerCase();
      var fileNameSplited = fileName.split(".");
      var fileRes = fileNameSplited[fileNameSplited.length - 1];

      if (fileRes in self.videoFormats || fileRes in self.imageFormats) {
        $('#attachments').prepend('<div class="msg-holder loader empty"><div class="close"></div><img src="/img/loader.gif"></div>').show();
        return formData;
      } else {
        return false
      }
    };

    $emailAttachmentBtn.on("filecomplete", function (obj, file, res) {
      var filePathsObj = JSON.parse(res);
      var filePath = filePathsObj.attachmentPath;

      // prepare attachment for send to server
      self.attachments.push(filePathsObj);

      // if obj has screenshot - it is a video file
      if (filePathsObj.thumbPath) {
        // find file resolution
        var fileNameSplited = filePath.split(".");
        var fileRes = fileNameSplited[fileNameSplited.length - 1];

        $('.loader.empty').remove();

        var attachmentHtml =
          '<video style="width:300px; height: 200px; max-width:100%;" controls="">\
             <source src="' + filePath + '" type="video/' + fileRes + '">\
           </video>';

        $('#attachments').prepend(attachmentHtml).show();
      }
      // or image file
      else {
        $('.loader.empty').removeClass('empty').find('img').attr('src', filePath);
      }

      // recalc chat cost
      message.calcChatCost(message.correctMessageBeforeSend($('#chat-input').html()));

      self.scrollDown(200);
    });
  },

  /** Get Html for attachment **/
  getAttachmentHtml: function (msg) {
    var self = this;

    var attachmentsArr = msg.attachment;
    var attachmentsHtml = '';
    var multiplier = self.recipientStream ? 2 : 1;
    var photoPrice = (self.cost.buyPhoto ? self.cost.buyPhoto : 50) * multiplier;
    var videoPrice = (self.cost.buyVideo ? self.cost.buyVideo : 50) * multiplier;

    attachmentsArr.forEach(function (attachment, i, arr) {
      var attachmentHtml = '';
      var type = attachment.type;
      var price = attachment.type === 'photo' ? photoPrice : videoPrice;

      if (!!attachment.path) {
        var fileNameSplited = attachment.path.split(".");
        var fileRes = fileNameSplited[fileNameSplited.length - 1];

        if (attachment.type === 'video') {
          attachmentHtml =
            '<video class="msg-holder" data-attachment-id="' + attachment.attachmentId + '" style="width:300px; height: 200px; max-width:100%;" controls="">\
               <source src="' + attachment.path + '" type="video/' + fileRes + '">\
             </video>';
        }

        if (attachment.type === 'photo') {
          attachmentHtml =
            '<div class="msg-holder" data-attachment-id="' + attachment.attachmentId + '">\
               <img src="' + attachment.path + '">\
             </div>';
        }
      } else {
        if (userInfo.userRefill) {
          attachmentHtml =
            '<div class="purchase-holder"\
                  data-attachment-id="' + attachment.attachmentId + '"\
                  data-attachment-type="' + attachment.type + '">\
              <button class="purchase">\
                <p class="price">' + price + '</p>\
                ' + svgObj.payLock + '\
                <p class="title">Buy</p>\
              </button>\
             </div>';
        } else {
          attachmentHtml =
            '<div class="msg-holder">\
               <img src="/img/access_foto.png" class="buy-btn-img-video refill-novice-toggle">\
             </div>';
        }
      }

      attachmentsHtml += attachmentHtml;
    });

    return attachmentsHtml;
  },

  /** Scroll down to the latest message in the chat **/
  scrollDown: function (timer) {
    var $chatContainer = $('#chat-container');

    setTimeout(function () {
      $chatContainer.scrollTop($chatContainer.prop("scrollHeight"));
    }, timer);
  },

  /** Focus in the end of input text area **/
  focus: function () {
    $('#chat-input').focus();
  },

  cursorToTheEnd: function (htmlElement) {
    var range, selection;

    range = document.createRange();//Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(htmlElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    selection = window.getSelection();//get the selection object (allows you to change selection)
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
  },

  sendGoogleEvent: function () {
    // // check cookie
    // var firstTimeChat = getCookie("firstTimeChatMessageSend");
    //
    // // if user already send message earlier, exit
    // if (!firstTimeChat) {
    //   // send google event
    //   ga('send', 'event', 'chat', 'snd_msg');
    //
    //   // set cookie for 1 year
    //   setCookie("firstTimeChatMessageSend", true, {"path": "/chat", "expires": 31536000});
    // }
  },

  setTranslatorCookie: function (from, to) {
    setCookie("translator", JSON.stringify({fromLang: from, toLang: to}), {"path": "/", "expires": 31536000});
  },

  getTranslatorCookie: function (data) {
    var translatorCookie = getCookie('translator');
    if (!translatorCookie) {
      return;
    }

    translatorCookie = JSON.parse(translatorCookie);

    $('option:selected', '#translate-from').removeAttr('selected');
    $('[value="' + translatorCookie.fromLang + '"]', '#translate-from').attr('selected', true);

    $('option:selected', '#translate-to').removeAttr('selected');
    $('[value="' + translatorCookie.toLang + '"]', '#translate-to').attr('selected', true);
  },

  /**
   * Stickers section
   */
  initStickers(){
    var self = this;
    self.socket.emit('getUserStickers', JSON.stringify({hash: userHash}));
  },

  changeStickerSet: function ($clickedSet) {
    if ($clickedSet.hasClass("active")) return;

    $clickedSet.parent().children().removeClass("active").filter($clickedSet).addClass("active");

    var stickerSet = $clickedSet.attr("data-sticker-set");

    if (stickerSet === 'recent') {
      $('#stickers .sticker-container').hide();
      $('#smiles .sticker-container').hide();
      $('#sticker-set-recent').show();
      $('#smiles-set-recent').show();
    } else if (stickerSet === 'smiles') {
      $('#smiles .sticker-container').hide();
      $('#smiles-set-smiles').show();
    } else {
      $('#stickers .sticker-container').hide();
      $('#sticker-set-' + stickerSet).show()
    }
  },

  insertStickers: function (data) {
    var self = this;
    data = JSON.parse(data);

    $('#stickers').empty();
    $('#smiles').empty();
    $('.remove-before-update','.sticker-nav').remove();

    // smiles images for decode text in input
    self.stickersSrc = data.stickers.images;

    var isRecentExists = !!data.favorites;

    // insert smiles and stickers
    if (isRecentExists) self._insertRecentStickersAndSmiles(data.favorites);
    self._insertSmilesAndStickers(data.stickers.pack, data.favoritePacks, data.stickers.smiles);

    // show active set button
    if (isRecentExists) {
      $('#set-recent').addClass('active');
    } else {
      $('#set-smiles').addClass('active');
    }
  },

  _insertRecentStickersAndSmiles: function (favorites) {
    var smilesHtml = '';
    var stickersHtml = '';
    favorites.forEach(function (item) {
      if (item.type === 'smile') {
        smilesHtml += '<i class="sprite-smile send-smile st-sm-' + item.imgCode + '" data-smile="&amp;sm-' + item.imgCode + '"></i>'
      } else {
        stickersHtml +=
          '<figure class="sticker-holder sticker send-smile col-3 p-0">\
             <img src="https://emosmile.com' + item.img + '" data-sticker="' + item.imgCode + '">\
           </figure>';
      }
    });

    var favoritesSmilesContainer = '<div id="smiles-set-recent" class="sticker-container row flex-wrap m-0">' + smilesHtml + '</div>';
    var favoritesStickersContainer = '<div id="sticker-set-recent" class="sticker-container row flex-wrap m-0">' + stickersHtml + '</div>';

    $('#smiles').append(favoritesSmilesContainer);
    $('#stickers').append(favoritesStickersContainer);
  },

  _insertSmilesAndStickers: function (stickersData, favoritePacks, smilesData) {
    var buttons = '';
    var packs = '';
    var maxLength = 3;

    // create sticker packs html
    for (var i = 0; i < maxLength; i++) {
      var value = favoritePacks[i];
      if (+value in stickersData) {
        var stickerObj = stickersData[+value];

        buttons +=
          '<div data-sticker-set="' + value + ' " class="sticker-nav-item remove-before-update">\
             <img src="https://emosmile.com' + stickerObj.mainSticker + '" >\
           </div>';

        var packStickers = '';
        $.each(stickerObj.stickers, function (i, item) {
          packStickers +=
            '<figure class="sticker-holder sticker send-smile col-3 p-0">\
               <img src="https://emosmile.com' + item.stickerImg + '" data-sticker="&s-' + item.stickerId + ';"> \
             </figure>';
        });

        packs += '<div id="sticker-set-' + value + '" class="sticker-container row flex-wrap m-0" style="display: none;">' + packStickers + '</div>';
      }
    }

    // create smiles pack html
    var smilesHtml = '';
    $.each(smilesData, function (k, value) {
      smilesHtml +=
        '<i class="sprite-smile send-smile st-sm-' + k + '" \
            data-smile="&sm-' + value.smileId + ';" \
            data-smile-text="' + value.smileText + '" \
            title="' + value.smileText + '">\
         </i>';
    });

    var smiles = '<div id="smiles-set-smiles" class="sticker-container row flex-wrap m-0" style="display: none">' + smilesHtml + '</div>';

    // insert into DOM
    $('.sticker-nav-holder .sticker-nav').append(buttons);
    $('#stickers').append(packs);
    $('#smiles').append(smiles);
  },

  sendSticker: function ($clickedSticker, $textField, $sendBtn) {
    var self = this;
    var img,
      imgCode,
      type;

    // if sending a sticker
    if ($clickedSticker.hasClass('sticker')) {
      imgCode = $clickedSticker.find('img').attr('data-sticker');
      $textField.html(imgCode);
      $sendBtn.click();
      $textField.focus();
      type = 'sticker';
      img = getStickerImg($clickedSticker);
    }
    // if sending a smile
    else {
      imgCode = $clickedSticker.attr('data-smile').substring(4, 8);
      var smileImg = '<div class="sprite-smile-16 st-sm-16-' + imgCode + '" contenteditable="false"></div>';
      $textField.html($textField.html() + smileImg);
      self.cursorToTheEnd($textField[0]);  // move focus cursor to the end of text
      type = 'smile';
      img = 0;
    }

    self.updateStickersFavorites({imgCode: imgCode, img: img, type: type});

    // helper function
    function getStickerImg($sticker) {
      var imgSrc = $sticker.find('img').attr('src');
      var index = imgSrc.indexOf('/media/sticker/');

      return imgSrc.substring(index);
    }
  },

  updateStickersFavorites: function (obj) {
    var self = this;

    var sendData = {
      hash: userHash,
      imgCode: obj.imgCode,
      img: obj.img,
      type: obj.type
    };

    // request: updateStickersFavorites, no response
    // sticker favorites will be update when user send message
    self.socket.emit('updateStickersFavorites', JSON.stringify(sendData));
  },

  getStickersFavorites: function () {
    var self = this;
    self.socket.emit('getStickersFavorites', JSON.stringify({hash: userHash}));
  },


  insertFavorites: function () {
    var self = this;
    var favoriteStickers = '';
    var favoriteSmiles = '';

    $.each(self.favorites, function (i, item) {
      if (item.type === 'sticker') {
        favoriteStickers +=
          '<figure class="sticker send-smile" style="margin-right: 1px;"> \
             <img src="https://emosmile.com' + item.img + '" data-sticker="' + item.imgCode + '" alt="smile"> \
           </figure>';
      } else {
        favoriteSmiles +=
          '<i class="sprite-smile send-smile st-sm-' + item.imgCode + '" data-smile="&amp;sm-' + item.imgCode + '"></i>';
      }
    });

    $('#smiles-set-recent').html(favoriteSmiles);
    $('#sticker-set-recent').html(favoriteStickers);
  },
};

// launch page when document ready
$(function () {
  pageChat.init(dataSocket);
});
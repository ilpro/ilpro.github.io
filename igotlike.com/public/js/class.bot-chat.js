'use strict';

function BotChat(socket) {
  this.socket = socket;
  this.isFirstLoad = true;
  this.isMessagesRead = false;
  this.userId = false;
  this.botId = false;
  this.botHash = false;
  this.recipientId = false;
  this.messagesContainer = '';

  this.attachments = [];
  this.videoFormats = {
    'mov': true,
    'mpeg4': true,
    'mp4': true,
    'avi': true,
    'wmv': true,
    'mpegps': true,
    'flv': true,
    '3gpp': true,
    'webm': true
  };
  this.imageFormats = {
    'jpg': true,
    'png': true,
    'jpeg': true
  };
};

BotChat.prototype.init = function (recipientId) {
  var self = this;

  // recipient ID comes from pageBotChat function
  self.userId = +pageBotChat.userId;
  self.botId = +pageBotChat.botId;
  self.botHash = pageBotChat.botHash;
  self.recipientId = +recipientId;
  self.messagesContainer = '.messages-wrapper';

  self.getPrivateMessages();
  self.getRecipientInfo();
  $('.center-content .bot-info-toggle').show();

  self.emailAttachmentInit();

  if (self.isFirstLoad) {
    self.isFirstLoad = false;
    self.initSocketHandlers();
    self.initEventHandlers();
    // set timer to update recipient info
    self.getRecipientInfo(60000);
  }
};

/** Get chat messages **/
BotChat.prototype.getPrivateMessages = function () {
  var self = this;

  self.getCachedChat(self.botId, self.recipientId);

  // request: getPrivateChatMessages, response: privateChatMessages
  self.socket.emit('getPrivateChatMessages', JSON.stringify({
    userId: self.userId,
    recipientId: self.recipientId,
    botId: self.botId
  }))
};

BotChat.prototype.getCachedChat = function (userId, recipientId){
  var self = this;
  // get cached messages from storage and insert them into DOM
  var allChat = localStorage.getItem('chat');

  if(!allChat) return;

  allChat = JSON.parse(allChat);

  if(allChat['userId-' + userId] && allChat['userId-' + userId]['recipientId-' + recipientId]){
    var chat = allChat['userId-' + userId]['recipientId-' + recipientId];
    $('.messages-wrapper').html(chat);
    self.scrollDown(0);
  }
};

// insert  messages from local starage before they will updates from DB
BotChat.prototype.setCachedChat = function (userId, recipientId, messagesHtml){
  var cachedChat = localStorage.getItem('chat');

  if(!cachedChat){
    cachedChat = {};
  } else {
    cachedChat = JSON.parse(cachedChat);
  }

  // check if chat.userId object exists in storage
  if(!cachedChat['userId-' + userId]){
    cachedChat['userId-' + userId] = {};
  }

  cachedChat['userId-' + userId]['recipientId-' + recipientId] = messagesHtml;

  return localStorage.setItem('chat', JSON.stringify(cachedChat));
};

/** Socket listeners **/
BotChat.prototype.initSocketHandlers = function () {
  var self = this;

  // insert chat messages on first load chat with this recipient id
  self.socket.on('privateChatMessages', function (data) {
    data = JSON.parse(data);
    self.insertMessagesBulk(data.messages);
  });

  // insert more messages (previous)
  self.socket.on('moreChatMessages', function (data) {
    data = JSON.parse(data);
    self.insertMessagesBulk(data, true);
  });

  // if user see unread messages, check them as "read"
  self.socket.on('userReadMessages', function (data) {
    data = JSON.parse(data);
    if(self.recipientId === data.recipientId){
      $('.message-row .message-state').addClass('readed')
    }
  });

  // update recipient info like online and his nickname
  self.socket.on('userInfoById', function (data) {
    data = JSON.parse(data);
    self.updateRecipientInfo(data)
  });

  // if user hasn't permissions
  self.socket.on('chatMessageError', function (data) {
    data = JSON.parse(data);
    $('.message-state', '.message-row').last().removeClass('sended').addClass('error');

    if(data.type === 'USER_STATUS_3'){
      $('#modal-user').addClass('active');
    }

    if(data.type === 'RECEIVER_STATUS_3'){
      $('#modal-receiver').addClass('active');
    }
  });

  self.socket.on('translatedChat', function (data) {
    var text = JSON.parse(data);
    text = message.htmlEscapeBack(text);
    $('[data-text-field="secondary"]').html(text);
  });

  // insert chat attachment
  self.socket.on('buyChatAttachment', function (data) {
    data = JSON.parse(data);
    if (+data.result) {
      var $payHover = $('.pay-hover[data-attachment-id="' + +data.attachmentId + '"]');
      var $container = $payHover.parent();
      var html = '';

      // find file resolution
      var fileNameSplited = data.path.split(".");
      var fileRes = fileNameSplited[fileNameSplited.length - 1];

      if (data.type === 'photo') {
        html =
          '<div class="picture-box" data-attachment-id="' + data.attachmentId + '">\
             <img src="' + data.path + '">\
           </div>';
      } else if (data.type === 'video') {
        html =
          '<video data-attachment-id="' + data.attachmentId + '" style="width:300px; height: 200px; max-width:100%;" controls="">\
             <source src="' + data.path + '" type="video/' + fileRes + '">\
           </video>';
      }

      $payHover.remove();
      $container.append(html);
    }
  });
};

/** Insert messages into html when response from server handled **/
BotChat.prototype.insertMessagesBulk = function (messagesObj, isMoreMessagesLoaded) {
  var self = this;

  var messages = messagesObj;
  var allMessagesHtml = '';
  var loadMoreButton = messages.length >= 30 ? '<div class="load-more">Load more</div>' : '';

  // check if messages exists
  if (messages.length === 0) return;

  // save first message id
  self.firstMessageId = messages[0].messageId;

  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    var messageHtml;

    if (!msg.userId || !pageBotChat.isChatOpensWithCurrentRecipient(msg.userId, msg.receiverId)) continue;

    msg.date = message.formatDate(msg.messageTime);
    msg.stickerClass = '';

    // parse message text to insert stickers/smiles, highlight reference
    if (msg.type === 'text') {
      msg.handledMessageText = message.parseMessage(msg.messageText);
    } else if (msg.type === 'sticker') {
      msg.handledMessageText = message.parseMessage(msg.messageText);
    } else {
      msg.handledMessageText = message.parseMessage(msg.messageText);
    }

    if (msg.handledMessageText.indexOf('alt="sticker-msg"') !== -1) {
      msg.stickerClass = 'sticker-message';
    }

    if (+self.botId === +msg.userId) {
      messageHtml = self.getMessageTemplateUser(msg);
    } else {
      messageHtml = self.getMessageTemplateRecipient(msg);
    }

    allMessagesHtml += messageHtml;
  }

  // check if this new messages or user scrolled up and load more previous messages
  if (isMoreMessagesLoaded) {
    var currentHeight = $('.messages-wrapper').prop("scrollHeight");
    $(".load-more").remove();
    $('.messages-wrapper').prepend(allMessagesHtml);
    $('.messages-wrapper').prepend(loadMoreButton);
    $('.messages-wrapper').scrollTop($('.messages-wrapper').prop("scrollHeight") - currentHeight);
  } else {
    $('.messages-wrapper').html(allMessagesHtml);
    $('.messages-wrapper').prepend(loadMoreButton);

    self.setCachedChat(self.botId, self.recipientId, allMessagesHtml);

    // update chat by scrolling down
    self.scrollDown(100);
  }

  // Load Lazy Chat Stickers in messages
  self.msgStickresLazyLoad();

  // emit to server
  self.userReadMessages();
};

/** Insert messages into html when response from server handled **/
BotChat.prototype.insertMessage = function (data) {
  var self = this;
  var msg = data;
  var messageHtml = '';

  // delete message preview
  $('.message-row[data-message-id="false"]').remove();

  // prepare to insert
  var dt = new Date();
  msg.date = message.formatDate(dt.toUTCString());
  msg.stickerClass = '';

  // parse message text to insert stickers/smiles, highlight reference
  if (msg.type === 'text') {
    msg.handledMessageText = message.parseMessage(msg.message);
  } else if (msg.type === 'sticker') {
    msg.handledMessageText = message.parseMessage(msg.message);
  } else {
    msg.handledMessageText = message.parseMessage(msg.message);
  }

  if (msg.handledMessageText.indexOf('alt="sticker-msg"') !== -1) {
    msg.stickerClass = 'sticker-message';
  }

  if (+self.botId === +msg.senderId) {
    messageHtml = self.getMessageTemplateUser(msg);
  } else {
    messageHtml = self.getMessageTemplateRecipient(msg);
  }

  $('.page-chat > .messages-wrapper').append(messageHtml);

  self.scrollDown(100);
  self.msgStickresLazyLoad();

  // make message read
  if (+msg.senderId != +self.botId) {
    self.userReadMessages();
  }
};

BotChat.prototype.getMessageTemplateUser = function (msg) {
  var self = this;

  var msgRead = 'sended';
  if (msg.messageRead == 1) {
    msgRead = 'readed';
  }

  var attachments = '';
  if (msg.attachment && msg.attachment.length > 0) {
    var imagesHtml = self.getAttachmentHtml(msg);
    attachments = '<div class="pictures-holder">' + imagesHtml + '</div>';
  }

  var html =
    '<div class="message-row right ' + msg.stickerClass + '" data-message-id="' + msg.messageId + '">\
         <div class="empty-fill"></div>\
         <div class="message-wrap">\
           ' + svgObj.msgTailRight() + '\
           <div class="message-text">\
             ' + msg.handledMessageText + '\
             ' + attachments + '\
             <div class="message-controls">\
               <div class="message-time">' + msg.date.time + '</div>\
               <div class="message-state ' + msgRead + '"></div>\
             </div>\
           </div>\
         </div>\
       </div>';

  return html;
};

BotChat.prototype.getMessageTemplateRecipient = function (msg) {
  var self = this;


  var attachments = '';
  if (msg.attachment) {
    var imagesHtml = self.getAttachmentHtml(msg);
    attachments = '<div class="pictures-holder">' + imagesHtml + '</div>';
  }

  var html =
    '<div class="message-row left ' + msg.stickerClass + '" data-message-id="' + msg.messageId + '">\
     <div class="message-wrap">\
     ' + svgObj.msgTailLeft() + '\
           <div class="message-text">\
             ' + msg.handledMessageText + '\
             ' + attachments + '\
                <div class="message-controls">\
                <div class="message-time">' + msg.date.time + '</div>\
                </div>\
           </div>\
         </div>\
         <div class="empty-fill"></div>\
       </div>';

  return html;
};

BotChat.prototype.initEventHandlers = function () {
  var self = this;

  // send message to another user
  $(document).on('click', '.send-message-button', function (e) {
    var $clickedBtn = $(e.target);

    // user cannot write to himself
    if (self.recipientId == self.botId) return;
    self.sendPrivateMessage($clickedBtn, self.botHash, self.recipientId);

    // clear chat
    $('[data-text-field="main"]').html('');
    $('[data-text-field="secondary"]').html('');
    $('[data-text-field="translate-from"]').html('');
    $('.message-price', '.send-box').html(0);

    // clear attachments
    $('#attachments').empty().hide();
    self.attachments.length = 0;

    // close smiles
    $('.smiles-wrapper').removeClass('opened');
    $('.open-chat-smiles-ico').removeClass('opened');
    $('.close-chat-smiles-ico').addClass('opened');
  });

  // load more previous messages when user scroll top
  $(document).on('click', '.load-more', function (e) {
    e.preventDefault();
    if (self.firstMessageId !== false) {
      self.socket.emit('loadMoreChatMessages', JSON.stringify({
        userId: self.botId,
        recipientId: self.recipientId,
        botId: self.botId,
        firstMessageId: self.firstMessageId
      }));
      self.firstMessageId = false;
    }
  });

  // send sticker
  $(document).on("click", ".sticker.send-smile", function (e) {
    var $sticker = $(this);
    var $textField = $('#message-field');
    var $sendBtn = $('.send-message-button');
    stickersAndEmoji.sendSticker($sticker, $textField, $sendBtn);
  });

  // remove uploaded attachment
  $(document).on('touchstart', '#attachments .close-cross', function () {
    var $box = $(this).closest('.picture-box.loader');
    var src = $box.find('img').attr('src');

    for (var i = 0; i < self.attachments.length; i++) {
      if (self.attachments[i].indexOf(src) != -1) {
        self.attachments.splice(i, 1);
        break;
      }
    }

    $box.remove();
    $('#attachments').hide();
  });

  // Buy attachment
  $(document).on("click", ".pay-hover", function (e) {
    var attachmentId = $(this).attr('data-attachment-id');
    self.socket.emit('buyChatAttachment', JSON.stringify({
      hash: self.botHash,
      profileId: self.recipientId,
      attachmentId: attachmentId
    }));
  });

  $(document).on('click', '.read-all-btn', function () {
    // self.readAllMessages();
  });

  $(window).resize(function () {
    self.scrollDown(100);
  });

  $(window).on('orientationchange', function () {
    self.scrollDown(100);
  });

  // remove variables when chat closed
  $(window).on('hashchange', self.destroy.bind(self));

  // toggle bot info
  $(document).on('click', '.bot-info-toggle', function () {
    $('.bot-info').toggle();
    $('.bot-arrow-svg').toggleClass('rotated');
  });

  // close modal with message error
  $(document).on('click', '.modal-keeper.active', function () {
    $('.modal-keeper').removeClass('active');
  });

  $("#message-field").on("paste", function () {
    setTimeout(function () {
      var msgPasteText = $("#message-field").html();
      msgPasteText = message.correctMessageBeforeSend(msgPasteText);
      msgPasteText = message.htmlEscape(msgPasteText);
      msgPasteText = message.parseMessage(msgPasteText);
      $("#message-field").html(msgPasteText)
    }, 100);
  });

  // translate message
  $(document).on('click', '#translate', function () {
    var from = $('#translate-from option:selected').val();
    var to = $('#translate-to option:selected').val();

    var $textField = $('[data-text-field="translate-from"]');
    var rowText = $textField.html();

    self.socket.emit('translateChat', JSON.stringify({from: from, to: to, text: rowText}));
    $('[data-text-field="translate-from"]').focus();
  });

  //show translator
  $(document).on('click', '.translator-activator', function () {
    $('.translator-close, .translate-button, .enter-text-field.only-smile, .translator-wrapper').addClass('translate-active');
    $('.translator-activator').addClass('translator-activator-hide');
    $('.enter-text-field.enter-text-field-default').addClass('enter-text-field-default-hide');

    // copy whole html to translate window
    $('[data-text-field="translate-from"]').html($('[data-text-field="main"]').text());

    // change ID of elem
    $('[data-text-field="main"]').removeAttr('id');
    $('[data-text-field="secondary"]').attr('id', 'message-field');
    $('[data-text-field="translate-from"]').focus();
  });
  $(document).on('click', '.translator-close', function () {
    $('.translator-close, .translate-button, .enter-text-field.only-smile, .translator-wrapper').removeClass('translate-active');
    $('.translator-activator').removeClass('translator-activator-hide');
    $('.enter-text-field.enter-text-field-default').removeClass('enter-text-field-default-hide');

    // copy whole html to main text field
    if ($('[data-text-field="secondary"]').html().length > 0) {
      $('[data-text-field="main"]').html($('[data-text-field="secondary"]').html());
    }

    // change ID
    $('[data-text-field="secondary"]').removeAttr('id');
    $('[data-text-field="main"]').attr('id', 'message-field');
    $('[data-text-field="main"]').focus();
  });

  // replace languages
  $(document).on('click', '.translate-reverse', function () {
    var langFrom = $('#translate-from option:selected').val();
    var langTo = $('#translate-to option:selected').val();

    $('#translate-from option').prop('selected', false);
    $('#translate-to option').prop('selected', false);

    $('#translate-from option[value="' + langTo + '"]').prop('selected', true);
    $('#translate-to option[value="' + langFrom + '"]').prop('selected', true);
  });

  // mark message to delete
  $(document).on('click', '.messages-wrapper .message-row', function () {
    $(this).find('.message-text').toggleClass('ready-to-delete');
  });

  // delete messages
  $(document).on('click', '.delete-panel .btn-delete', function () {
    var $messagesToDelete = $('.message-text.ready-to-delete', '.message-row ').closest('.message-row');
    var idToDelete = [];

    $messagesToDelete.each(function () {
      idToDelete.push(+$(this).attr('data-message-id'));
      $(this).remove();
    });

    // remove message class mark
    $('.message-text.ready-to-delete', '.message-row ').removeClass('ready-to-delete');

    if (idToDelete.length === 0) {
      return;
    }

    self.socket.emit('deleteChatMessages', JSON.stringify(idToDelete));
  });

  // remove delete mark from messages
  $(document).on('click', '.delete-panel .btn-cancel', function () {
    $('.message-row .message-text').removeClass('ready-to-delete');
  });
};

/** Get chat messages **/
BotChat.prototype.destroy = function () {
  var self = this;

  var chatUserId = urlHash.getState('id') ? urlHash.getState('id') : false;

  if (!chatUserId) {
    self.isMessagesRead = false;
    self.recipientId = chatUserId;
  }
};

/**  Immediately Add preview message in HTML **/
BotChat.prototype.addPreviewHtmlMessage = function (error) {
  var self = this;
  var messageHtml;
  var err = error ? 'error' : '';

  var dt = new Date();
  var date = message.formatDate(dt.toUTCString());

  var text = $('#message-field').html();
  var handledMessageText = message.parseMessage(message.htmlEscape(message.correctMessageBeforeSend(text)));

  var stickerClass = '';
  if (handledMessageText.indexOf('alt="sticker-msg"') !== -1) {
    stickerClass = 'sticker-message';
  }

  var attachments = '';
  if (self.attachments.length > 0) {
    var imagesHtml = '';

    self.attachments.forEach(function (attach, i, arr) {
      imagesHtml += '<div class="picture-box"><img src="' + attach.attachmentPath + '"></div>';
    });

    attachments = '<div class="pictures-holder">' + imagesHtml + '</div>';
  }

  messageHtml =
    '<div class="message-row right ' + stickerClass + '" data-message-id="false" style="opacity: 0">\
         <div class="empty-fill"></div>\
         <div class="message-wrap">\
           ' + svgObj.msgTailRight() + '\
           <div class="message-text">\
             ' + handledMessageText + '\
             ' + attachments + '\
             <div class="message-controls">\
               <div class="message-time">' + date.time + '</div>\
               <div class="message-state ' + err + '"></div>\
             </div>\
           </div>\
         </div>\
       </div>';

  $('.page-chat > .messages-wrapper').append(messageHtml);
  self.scrollDown(100);
  setTimeout(function () {
    $('.message-row').css('opacity', 1);
  }, 100);
};

/** Send private chat message **/
BotChat.prototype.sendPrivateMessage = function ($clickedBtn, senderHash, receiverId) {
  var self = this;
  var messageType = '';
  var stickerLink = '';
  var $textField = $('#message-field');
  var messageText = $textField.html();

  // if message exists and user logged in
  if ((messageText.length > 0 || self.attachments.length > 0) && self.botHash) {

    // validate message and check it for bugs
    messageText = message.correctMessageBeforeSend(messageText);

    var checkStResult = self.checkStickers(messageText);
    if (checkStResult.hasSticker) {
      messageType = 'sticker';
      stickerLink = checkStResult.stickerLink
    } else {
      messageType = 'text';
    }

    // immediately add in chat message, then replace it after server request
    self.addPreviewHtmlMessage();

    var sendData = {
      hash: senderHash,
      receiverId: receiverId,
      message: message.htmlEscape(messageText),
      attachments: self.attachments,
      type: messageType,
      link: stickerLink
    };

    self.socket.emit('sendChatMessage', JSON.stringify(sendData));
    $textField.html('');
    $('.smiles-wrapper').removeClass('opened');
    $('.open-chat-smiles-ico').removeClass('opened');
    $('.close-chat-smiles-ico').addClass('opened');
  }
};

BotChat.prototype.checkStickers = function (parsedMsgTxt) {
  // check if message has stickers inside it
  var stickerLink = [];
  var msgTemplate = parsedMsgTxt;

  var stickerMatches = msgTemplate.match(/&s-([0-9]+);/im);

  while (stickerMatches != null && stickersAndEmoji.stickersImg[stickerMatches[1]] != undefined) {
    if (stickerMatches != null && stickersAndEmoji.stickersImg[stickerMatches[1]] != undefined) {
      stickerLink.push('https://emosmile.com' + stickersAndEmoji.stickersImg[stickerMatches[1]].stickerImg);
      msgTemplate = msgTemplate.replace(stickerMatches[0], '')
    }
    stickerMatches = msgTemplate.match(/&s-([0-9]+);/im);
  }

  stickerMatches = parsedMsgTxt.match(/&s-([0-9]+);/im);

  return {
    hasSticker: stickerMatches != null,
    stickerLink: stickerLink.length > 0 ? stickerLink.join(',') : ''
  }
};

/** Set unread message flag to read **/
BotChat.prototype.userReadMessages = function () {
  var self = this;
  var sendData = {hash: self.botHash, recipientId: self.recipientId};

  // make this messages read by user
  self.socket.emit('userReadMessages', JSON.stringify(sendData));
};

/** Check chat recipient online **/
BotChat.prototype.getRecipientInfo = function (timer) {
  var self = this;

  if (timer) {
    setTimeout(function () {
      // request: getUserInfoById, response: userInfoById
      self.socket.emit('getUserInfoById', JSON.stringify({userId: self.recipientId}));
      self.getRecipientInfo(timer);
    }, timer);
  } else {
    self.socket.emit('getUserInfoById', JSON.stringify({userId: self.recipientId}));
  }
};

BotChat.prototype.updateRecipientInfo = function (recipientObj) {
  var self = this;

  var $header = $('.page-head.chat');
  var onlineHtml = '';

  var recipientPhoto = user.getPhoto(recipientObj.userPhoto, recipientObj.userName);
  var recipientOnline = user.getOnline(recipientObj);

  if (recipientOnline === 'online') {
    onlineHtml = '<!--<div class="online-status online">online</div>-->';
  } else {
    onlineHtml = '<!--<div class="online-status offline">' + recipientObj.userLastActive + '</div>-->';
  }

  var userInfoHtml =
    '<div class="avatar-holder">\
       <div class="user-avatar" title="">\
         ' + recipientPhoto + '\
     </div>\
   </div>\
   <div class="nickname">' + recipientObj.userName + '</div>\
   ' + onlineHtml + '\
   <div class="clickable-areas">\
    <a href="/bot-chat/' + self.botId + '" class="back-to-list-button">\
    ' + svgObj.backToChatArrow() + '\
    </a>\
    <a href="/profile/' + self.recipientId + '" class="to-profile-link"></a>\
    </div>';

  $header.html(userInfoHtml);
};

/** When recipient reads user messages, add change class for delete button **/
BotChat.prototype.makeMessagesRead = function (readMessages) {
  var self = this;
  for (var i = 0; i < readMessages.length; i++) {
    var id = readMessages[i].messageId;
    $('.message-row[data-message-id="' + id + '"]').find('.message-state').addClass('readed')
  }
};

BotChat.prototype.formatDate = function (date) {
  var newsDate = new Date(date),
    todayDate = new Date();
  var day1 = newsDate.getDate(),
    day2 = todayDate.getDate();
  var month1 = newsDate.getMonth(),
    month2 = todayDate.getMonth();
  var month = parseInt(newsDate.getMonth()) + 1;
  var day = parseInt(newsDate.getDate());
  var year = newsDate.getFullYear();
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  var dayFull = (day1 == day2 && month1 == month2) ? "Today" : day + "." + month + "." + newsDate.getFullYear();
  var hours = parseInt(newsDate.getHours()) < 10 ? '0' + newsDate.getHours() : newsDate.getHours();
  var minute = parseInt(newsDate.getMinutes()) < 10 ? '0' + newsDate.getMinutes() : newsDate.getMinutes();
  var time = hours + ":" + minute;
  return {date: day, mouth: month, year: year, day: dayFull, time: time};
};

/** MOVE CURSOR TO THE END OF THE CARET **/
BotChat.prototype.cursorToTheEnd = function (htmlElement) {
  var range, selection;

  range = document.createRange();//Create a range (a range is a like the selection but invisible)
  range.selectNodeContents(htmlElement);//Select the entire contents of the element with the range
  range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
  selection = window.getSelection();//get the selection object (allows you to change selection)
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection
};

/** Scroll down to the latest message in the chat **/
BotChat.prototype.scrollDown = function (timer) {
  setTimeout(function () {
    $('.messages-wrapper').scrollTop($('.messages-wrapper').prop("scrollHeight"));
  }, timer);
};

/***Load Lazy BotChat Stickers in messages  ***/
BotChat.prototype.msgStickresLazyLoad = function () {
  var $targetForLazy = $("img[data-src]");
  var linksListForLazy = [];
  var downloadingImage = [];

  $targetForLazy.each(function () {
    linksListForLazy.push($(this).attr("data-src"));
  });

  for (var i = 0; i < $targetForLazy.length; i++) {
    downloadingImage[i] = new Image();
    downloadingImage[i].src = linksListForLazy[i];

    downloadingImage[i].onload = function () {
      $targetForLazy[i].src = downloadingImage[i].src;
    }(i);
  }

};

/*** Trigger a callback when the selected images are loaded ***/
BotChat.prototype.onImgLoad = function (selector, callback) {
  $(selector).each(function () {
    if (this.complete || /*for IE 10-*/ $(this).height() > 0) {
      callback.apply(this);
    }
    else {
      $(this).on('load', function () {
        callback.apply(this);
      });
    }
  });
};

/** Email attachment photo **/
BotChat.prototype.emailAttachmentInit = function () {
  var $emailAttachmentBtn = $('#email-attachment');

  $emailAttachmentBtn.ajaxUpload({
    url: "/chat/attachment",
    name: "file",
    onSubmit: function () {
      var loaderHtml =
        '<div class="picture-box loader empty">\
           <div class="close-cross">\
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12">\
               <path fill="#FFF" d="M3.4 0l2.2 2.6c.6.7 1 1.3 1.5 2h.1c.5-.7 1-1.3 1.5-2L10.8 0h3L8.6 5.8 14 12h-3.2L8.6 9.3C8 8.6 7.5 7.9 7 7.2h-.1c-.5.7-1 1.4-1.6 2.1L3.1 12H0l5.4-6.1L.3 0h3.1z"></path>\
             </svg>\
           </div>\
           <img src="/img/loader.gif">\
         </div>';
      $('#attachments').prepend(loaderHtml).show();
      return true;
    },
    onComplete: function (res) {
      var filePathsObj = JSON.parse(res);
      var filePath = filePathsObj.attachmentPath;

      // prepare attachment for send to server
      botChat.attachments.push(filePathsObj);

      // if obj has screenshot - it is a video file
      if (filePathsObj.thumbPath) {
        // find file resolution
        var fileNameSplited = filePath.split(".");
        var fileRes = fileNameSplited[fileNameSplited.length - 1].toLowerCase();

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

      botChat.scrollDown(200);
    }
  });
};

/** Get Html for attachment **/
BotChat.prototype.getAttachmentHtml = function (msg) {
  var self = this;

  var attachmentsArr = msg.attachment;
  var attachmentsHtml = '';
  var price = 0;

  attachmentsArr.forEach(function (attachment, i, arr) {
    var attachmentHtml = '';
    var type = attachment.type;
    var price = 0;

    if (!!attachment.path) {
      var fileNameSplited = attachment.path.split(".");
      var fileRes = fileNameSplited[fileNameSplited.length - 1];

      if (attachment.type === 'video') {
        attachmentHtml =
          '<video data-attachment-id="' + attachment.attachmentId + '" style="width:300px; height: 200px; max-width:100%;" controls="">\
             <source src="' + attachment.path + '" type="video/' + fileRes + '">\
           </video>';
      }

      if (attachment.type === 'photo') {
        attachmentHtml =
          '<div class="picture-box" data-attachment-id="' + attachment.attachmentId + '">\
             <img src="' + attachment.path + '">\
           </div>';
      }
    } else {
      attachmentHtml =
        '<div class="pay-hover" \
              data-attachment-id="' + attachment.attachmentId + '" \
              data-attachment-type="' + attachment.type + '">\
           <img class="structure-img" src="https://www.pickbride.com/img/pay-bg.jpg" alt="photo">\
             <div class="pay-content">\
               <div class="price-holder">\
                 <div class="coin-img"></div>\
                   <div class="price-amount">' + price + '</div>\
                 </div>\
               <div class="buy-button">Buy</div>\
             </div>\
           </div>';
    }

    attachmentsHtml += attachmentHtml;
  });

  return attachmentsHtml;
};
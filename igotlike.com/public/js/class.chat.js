'use strict';

function Chat(socket) {
  this.socket = socket;
  this.isFirstLoad = true;
  this.userId = false;
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

Chat.prototype.init = function (recipientId) {
  var self = this;

  // recipient ID comes from pageChat function
  self.userId = +pageChat.userId;
  self.recipientId = +recipientId;
  self.messagesContainer = '.messages-wrapper';

  self.getPrivateMessages();
  self.emailAttachmentInit();

  if (self.isFirstLoad) {
    self.isFirstLoad = false;
    self.initSocketHandlers();
    self.initEventHandlers();

    // site support chat for free!
    if (self.recipientId === 1) {
      $('.message-price', '.send-message-button').html(0)
    }
  }
};

Chat.prototype.initEventHandlers = function () {
  var self = this;

  // send message to another user
  $(document).on('click', '.send-message-button', function (e) {
    var $textField = $('#message-field');
    var rowText = $textField.html();
    var messageText = message.correctMessageBeforeSend(rowText);

    if (!self.checkConditionsBeforeSend(messageText)) {
      return;
    }

    // immediately add in chat message, then replace it after server request
    self.addPreviewHtmlMessage();
    self.sendPrivateMessage(messageText, userHash, self.recipientId);

    // clear chat
    $textField.html('');
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

  // handle enter press in send message field
  $(document).on("keyup", "#message-field", function (e) {
    var $textField = $('#message-field');
    var rowText = $textField.html();
    var correctedText = message.correctMessageBeforeSend(rowText);

    // if user pressed  enter, send message
    if (e.keyCode == 13 && !e.shiftKey) {
      e.preventDefault();

      $('.send-message-button').click();
    }
  });

  // load more previous messages when user scroll top
  $(document).on('touchstart', '.load-more', function (e) {
    e.preventDefault();
    if (self.firstMessageId !== false) {
      self.socket.emit('loadMoreChatMessages', JSON.stringify({
        userId: self.userId,
        recipientId: self.recipientId,
        firstMessageId: self.firstMessageId
      }));
      self.firstMessageId = false;
    }
  });

  // send sticker
  $(document).on("touchstart", ".sticker.send-smile", function (e) {
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

  $(window).resize(function () {
    self.scrollDown(100);
  });

  $(window).on('orientationchange', function () {
    self.scrollDown(100);
  });

  // remove variables when chat closed
  $(window).on('hashchange', self.destroy.bind(self));

  // add/remove from blacklist
  $(document).on('touchstart', '#blacklist-toggle', function () {
    self.socket.emit('addUserBlacklist', JSON.stringify({hash: userHash, profileId: self.recipientId}));
  });

  // close modal with message error
  $(document).on('touchstart', '.modal-keeper.active', function () {
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
  $(document).on('touchstart', '#translate', function () {
    var from = $('#translate-from option:selected').val();
    var to = $('#translate-to option:selected').val();

    var $textField = $('[data-text-field="translate-from"]');
    var rowText = $textField.html();

    self.socket.emit('translateChat', JSON.stringify({from: from, to: to, text: rowText}));
    $('[data-text-field="translate-from"]').focus();
  });

  // open translator
  $(document).on('touchstart', '.translator-activator', function () {
    $('.translator-close, .translate-button, .translator-wrapper').addClass('translate-active');
    $('.translator-activator').addClass('translator-activator-hide');
    $('.enter-text-field.enter-text-field-default').addClass('enter-text-field-default-hide');
    $('.open-chat-smiles-ico, .item-attach-wrapper').addClass('hidden');

    // copy whole html to translate window
    $('[data-text-field="translate-from"]').html($('[data-text-field="main"]').text());

    // change ID of elem
    $('[data-text-field="main"]').removeAttr('id');
    $('[data-text-field="secondary"]').attr('id', 'message-field');
    $('[data-text-field="translate-from"]').focus();
  });

  // close translator
  $(document).on('touchstart', '.translator-close', function () {
    $('.translator-close, .translate-button, .translator-wrapper').removeClass('translate-active');
    $('.translator-activator').removeClass('translator-activator-hide');
    $('.enter-text-field.enter-text-field-default').removeClass('enter-text-field-default-hide');
    $('.open-chat-smiles-ico, .item-attach-wrapper').removeClass('hidden');

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
  $(document).on('touchstart', '.translate-reverse', function () {
    var langFrom = $('#translate-from option:selected').val();
    var langTo = $('#translate-to option:selected').val();

    $('#translate-from option').prop('selected', false);
    $('#translate-to option').prop('selected', false);

    $('#translate-from option[value="' + langTo + '"]').prop('selected', true);
    $('#translate-to option[value="' + langFrom + '"]').prop('selected', true);
  });
};

/** Socket listeners **/
Chat.prototype.initSocketHandlers = function () {
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

  // if user hasn't permissions
  self.socket.on('chatMessageError', function (data) {
    data = JSON.parse(data);
    $('.message-state', '.message-row').last().removeClass('sended').addClass('error');

    // user not active or banned or has no permission to write
    if (data.type === 'PERMISSION') {
      $('#modal-user-no-permission').addClass('active');
    }

    // user set 'dont write status'
    if(data.type === 'USER_STATUS_3'){
      $('#modal-user').addClass('active');
    }

    // receiver set 'dont write status'
    if(data.type === 'RECEIVER_STATUS_3'){
      $('#modal-receiver').addClass('active');
    }

    // user blocked by receiver
    if(data.type === 'USER_IN_BLACKLIST'){
      $('#modal-banned').addClass('active');
    }
  });

  // added/removed from blacklist status
  self.socket.on('addUserBlacklist', function (data) {
    data = JSON.parse(data);

    $('#blacklist-toggle').show().removeClass('block unblock');

    if(data.action === 'add'){
      $('#blacklist-toggle').addClass('unblock');
    } else {
      $('#blacklist-toggle').addClass('block');
    }
  });

  self.socket.on('translatedChat', function (data) {
    var text = JSON.parse(data);
    text = message.htmlEscapeBack(text);
    $('[data-text-field="secondary"]').html(text);
  });
};

/** Get chat messages **/
Chat.prototype.getPrivateMessages = function () {
  var self = this;

  this.getCachedChat(self.userId, self.recipientId);
  // request: getPrivateChatMessages, response: privateChatMessages
  this.socket.emit('getPrivateChatMessages', JSON.stringify({userId: self.userId, recipientId: self.recipientId}))
};

Chat.prototype.getCachedChat = function (userId, recipientId){
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
Chat.prototype.setCachedChat = function (userId, recipientId, messagesHtml){
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

/** Insert messages into html when response from server handled **/
Chat.prototype.insertMessagesBulk = function (messagesObj, isMoreMessagesLoaded) {
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

    if (!msg.userId || !pageChat.isChatOpensWithCurrentRecipient(msg.userId, msg.receiverId)) continue;

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

    if (+self.userId === +msg.userId) {
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

    self.setCachedChat(self.userId, self.recipientId, allMessagesHtml);

    // update chat by scrolling down
    self.scrollDown(100);
  }

  // Load Lazy Chat Stickers in messages
  self.msgStickresLazyLoad();

  // emit to server
  self.userReadMessages();
};

/** Insert messages into html when response from server handled **/
Chat.prototype.insertMessage = function (data) {
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

  if (+self.userId === +msg.senderId) {
    messageHtml = self.getMessageTemplateUser(msg);
  } else {
    messageHtml = self.getMessageTemplateRecipient(msg);
  }

  $('.page-chat > .messages-wrapper').append(messageHtml);

  self.scrollDown(100);
  self.msgStickresLazyLoad();

  // make message read
  if (+msg.senderId != +self.userId) {
    self.userReadMessages();
  }
};

Chat.prototype.getMessageTemplateUser = function (msg) {
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

Chat.prototype.getMessageTemplateRecipient = function (msg) {
  var self = this;

  var attachments = '';
  if (msg.attachment && msg.attachment.length > 0) {
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


/** Check message and user before send to server **/
Chat.prototype.checkConditionsBeforeSend = function (text) {
  var self = this;
  var textWithoutSpace = text.replace(/ /g, "");

  // if there is no message or user not logged in - exit
  if ((textWithoutSpace.length === 0 && self.attachments.length === 0) || !userHash) {
    return false;
  }

  // user cannot write to himself
  if (self.recipientId == self.userId) return false;

  return true;
};

/** Get chat messages **/
Chat.prototype.destroy = function () {
  var self = this;

  var chatUserId = urlHash.getState('id') ? urlHash.getState('id') : false;

  if (!chatUserId) {
    self.recipientId = chatUserId;
  }
};

/**  Immediately Add preview message in HTML **/
Chat.prototype.addPreviewHtmlMessage = function (error) {
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
Chat.prototype.sendPrivateMessage = function (messageText, senderHash, receiverId) {
  var self = this;
  var messageType = '';
  var stickerLink = '';

  var checkStResult = self.checkStickers(messageText);

  if (checkStResult.hasSticker) {
    messageType = 'sticker';
    stickerLink = checkStResult.stickerLink
  } else {
    messageType = 'text';
  }

  var sendData = {
    hash: senderHash,
    receiverId: receiverId,
    message: message.htmlEscape(messageText),
    attachments: self.attachments,
    type: messageType,
    link: stickerLink
  };

  self.socket.emit('sendChatMessage', JSON.stringify(sendData));
};

Chat.prototype.checkStickers = function (parsedMsgTxt) {
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
Chat.prototype.userReadMessages = function () {
  var self = this;
  var sendData = {hash: userHash, recipientId: self.recipientId};

  // make this messages read by user
  self.socket.emit('userReadMessages', JSON.stringify(sendData));
};

Chat.prototype.formatDate = function (date) {
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
Chat.prototype.cursorToTheEnd = function (htmlElement) {
  var range, selection;

  range = document.createRange();//Create a range (a range is a like the selection but invisible)
  range.selectNodeContents(htmlElement);//Select the entire contents of the element with the range
  range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
  selection = window.getSelection();//get the selection object (allows you to change selection)
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection
};

/** Scroll down to the latest message in the chat **/
Chat.prototype.scrollDown = function (timer) {
  setTimeout(function () {
    $('.messages-wrapper').scrollTop($('.messages-wrapper').prop("scrollHeight"));
  }, timer);
};

/***Load Lazy Chat Stickers in messages  ***/
Chat.prototype.msgStickresLazyLoad = function () {
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
Chat.prototype.onImgLoad = function (selector, callback) {
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
Chat.prototype.emailAttachmentInit = function () {
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
      chat.attachments.push(filePathsObj);

      // if obj has screenshot - it is a video file
      if(filePathsObj.thumbPath) {
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
    }
  });
};

/** Get Html for attachment **/
Chat.prototype.getAttachmentHtml = function (msg) {
  var self = this;

  var attachmentsArr = msg.attachment;
  var attachmentsHtml = '';

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
'use strict';
function Message(socket) {
  this.socket = socket;
}


/** Get private chat message **/
Message.prototype.getChatMessages = function (hash, conversationId) {
  var self = this;
  self.socket.emit('getChatMessages', JSON.stringify({hash: hash, conversationId: conversationId}));
};


/** Get chunk of private chat previous messages **/
Message.prototype.loadMoreMessages = function (userHash, recipientId, firstMessageId) {
  var self = this;

  var sendData = {
    hash: userHash,
    receivers: [recipientId],
    firstMessageId: firstMessageId,
    conversationType: 'chat'
  };

  // request: loadPreviousMessages; response: previousMessages
  self.socket.emit('loadMoreMessages', JSON.stringify(sendData));
};

/** Send private chat message **/
Message.prototype.sendMessage = function (messageText, senderHash, conversationId, attachments) {
  var self = this;
  var messageType = '';
  var stickerLink = '';

  var checkStResult = self.checkStickers(messageText);

  if(checkStResult.hasSticker) {
    messageType = 'sticker';
    stickerLink = checkStResult.stickerLink
  } else {
    messageType = 'text';
  }

  var sendData = {
    hash: senderHash,
    message: self.htmlEscape(messageText),
    attachments: attachments,
    type: messageType,
    link: stickerLink,
    conversationId: conversationId
  };

  self.socket.emit('sendChatMessage', JSON.stringify(sendData));
};

Message.prototype.checkStickers = function (parsedMsgTxt) {
  // check if message has stickers inside it
  var stickerLink = [];
  var msgTemplate = parsedMsgTxt;

  var stickerMatches = msgTemplate.match(/&s-([0-9]+);/im);

  while (stickerMatches != null && pageChat.stickersSrc[stickerMatches[1]] != undefined) {
    if (stickerMatches != null && pageChat.stickersSrc[stickerMatches[1]] != undefined) {
      stickerLink.push('https://emosmile.com' + pageChat.stickersSrc[stickerMatches[1]].stickerImg);
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

/** Calculate chat symbols, decoding smiles **/
Message.prototype.calcChatCost = function (correctedText) {
  var cost, textWithoutSpace;
  var symbolCost = pageChat.cost.symbol;
  var emojiCost = pageChat.cost.emoji;
  var stickerCost = pageChat.cost.sticker;
  var recipientStream = pageChat.recipientStream;
  var attachmentsArr = pageChat.attachments;
  var sendPhotoCost = pageChat.cost.sendPhoto;
  var sendVideoCost = pageChat.cost.sendVideo;

  // site support chat for free!
  if (pageChat.recipientId == 1 || userInfo.userRole >= 19) {
    cost = 0;
  } else {

    if (correctedText.match(/&s-([0-9]+);/im) != null) {
      cost = stickerCost;
    } else {
      // calc text & smiles cost
      var smilesMathces = correctedText.match(/&sm-([0-9]+);/g);
      var textWithoutSmiles = correctedText;
      if (smilesMathces != null) {
        for (var i = 0; i < smilesMathces.length; i++) {
          textWithoutSmiles = textWithoutSmiles.replace(smilesMathces[i], '');
        }
      }

      smilesMathces = smilesMathces === null ? 0 : smilesMathces.length;

      // counts number of symbols without spaces
      textWithoutSpace = textWithoutSmiles.replace(/ /g, "");
      textWithoutSpace = textWithoutSpace.replace(/\n/g, "");

      // calculate attachments photo and video cost
      var attachmentsCost = 0;
      for(var j = 0; j < attachmentsArr.length; j++){
        var attach = attachmentsArr[j];

        if(attach['thumbPath']){
          attachmentsCost += sendVideoCost;
        } else {
          attachmentsCost += sendPhotoCost;
        }
      }

      // total cost
      cost = (symbolCost * textWithoutSpace.length) + (smilesMathces * emojiCost) + attachmentsCost;

      if(recipientStream){
        cost = cost * 2;
      }
    }
  }

  $('.message-price', '#send-message').html(cost);
  return cost;
};

/** Send email  message **/
Message.prototype.sendEmailMessage = function (messageText, senderHash, receiverId, attachments) {
  var self = this;

  var messageType = '';
  var stickerLink = '';

  var checkStResult = self.checkStickers(messageText);

  if(checkStResult.hasSticker) {
    messageType = 'sticker';
    stickerLink = checkStResult.stickerLink
  } else {
    messageType = 'text';
  }

  var sendData = {
    hash: senderHash,
    receiverId: receiverId,
    message: message.htmlEscape(messageText),
    attachments: attachments,
    type: messageType,
    link: stickerLink
  };

  self.socket.emit('sendEmailMessage', JSON.stringify(sendData));
};


/** Delete private chat message **/
Message.prototype.deletePrivateMessage = function (msgId) {
  var self = this;
  self.socket.emit('deletePrivateMessage', JSON.stringify({hash: userHash, messageId: msgId}));
};

/** Set unread message flag to read **/
Message.prototype.userReadMessages = function (userHash, conversationId) {
  var self = this;
  self.socket.emit('userReadMessages', JSON.stringify({hash: userHash, conversationId: conversationId}));
};

/** Validate and correct message before send to server
 * * version 4.5
 * **/
Message.prototype.correctMessageBeforeSend = function (messageText) {

  // console.log(' ---------correct before send---------------');
  var self = this;

  // check if message has bug &nbsp
  var whitespaceBugCheck = messageText.match(/&nbsp;/g);

  // console.log(' check if message has bug &nbsp'); console.log(whitespaceBugCheck);
  // console.log(' message before correction'); console.log(messageText);

  // replace smiles inside to basecodes
  if (whitespaceBugCheck != null) {
    messageText = self.stringReplaceAll(messageText, '&nbsp;', ' ');
  }
  // console.log(' message after correction'); console.log(messageText);

  // check if message has smiles inside it
  var smilesMatches = messageText.match(/<div[^>]*st-sm-16-([0-9]+)[^>]*><\/div[^>]*>/im);

  // console.log('check if message has smiles inside it');console.log(smilesMatches);
  // console.log(' message before correction');console.log(messageText);

  while (smilesMatches != null) {
    // replace smiles inside to basecodes
    if (smilesMatches != null) {
      var smileHtmlCode = smilesMatches[0],
        smileBaseCode = '&amp;sm-' + smilesMatches[1] + ';';
      messageText = self.stringReplaceAll(messageText, smileHtmlCode, smileBaseCode);
    }
    // Recheck if message has smiles inside it
    smilesMatches = messageText.match(/<div[^>]*st-sm-16-([0-9]+)[^>]*><\/div[^>]*>/im);
  }
  // console.log(' message after correction');console.log(messageText);

  // check if message has stickers inside it
  var stickerMatches = messageText.match(/data-sticker="&amp;s-([0-9]+);"/im);

  // console.log('check if message has stickers inside it');console.log(stickerMatches);
  // console.log(' message before correction');console.log(messageText);

  while (stickerMatches != null) {
    // replace stickers inside to basecodes
    if (stickerMatches != null) {
      var stickerHtmlCode = '<img src="https://emosmile.com' + pageChat.stickersSrc[stickerMatches[1]].stickerImg + '" data-sticker="&amp;s-' + stickerMatches[1] + ';" alt="smile">',
        stickerBaseCode = '&amp;s-' + stickerMatches[1] + ';';
      messageText = self.stringReplaceAll(messageText, stickerHtmlCode, stickerBaseCode);
    }
    stickerMatches = messageText.match(/data-sticker="&amp;s-([0-9]+);"/im);
  }
  // console.log(' message after correction');console.log(messageText);

  // check if message has '&amp;' inside it (prevent double htmlEscape)
  var ampMatches = messageText.match(/&amp;/g);

  // console.log('check if message has "&amp;" inside it (prevent double htmlEscape)');console.log(ampMatches);
  // console.log(' message before correction');console.log(messageText);

  // replace amp before htmlEscape
  if (ampMatches != null) {
    var ampHtmlCode = '&amp;',
      ampBeforeEscapeCode = '&';
    messageText = self.stringReplaceAll(messageText, ampHtmlCode, ampBeforeEscapeCode);
  }

  // replace chrome div wrapping with new line
  var divMatches = messageText.match(/<div[^>]*>(.*?)<\/div[^>]*>/i);
  while (divMatches != null) {
    if (divMatches != null) {
      messageText = messageText.replace(divMatches[0], '\n' + divMatches[1]);
    }
    divMatches = messageText.match(/<div[^>]*>(.*?)<\/div[^>]*>/i);
  }

  // replace firefox br with new line
  var brMatches = messageText.match(/<\/?br>/g);
    if (brMatches != null) {
    for (var i = 0; i < brMatches.length; i++) {
      messageText = messageText.replace(brMatches[i], '\n');
    }
  }

  // replace all tags
  var tagMatches = messageText.match(/<[^>]*>/g);
  if (tagMatches != null) {
    for (var i = 0; i < tagMatches.length; i++) {
      messageText = messageText.replace(tagMatches[i], ' ');
    }
  }
  var manyWhitespaces = messageText.match(/  /i);
  while (manyWhitespaces != null) {
    if (manyWhitespaces != null) {
      messageText = self.stringReplaceAll(messageText, '  ', ' ');
    }
    manyWhitespaces = messageText.match(/  /i);
  }
  // console.log(' message after correction');console.log(messageText);
  // console.log("many whitespases while.fin")
  // correct chrome many new line
  var nLineMultiple = messageText.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);


  while (nLineMultiple != null) {
    if (nLineMultiple != null) {
      messageText = messageText.replace(nLineMultiple[0], '\n');
    }
    nLineMultiple = messageText.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);
  }
  messageText = messageText.trim();
  // console.log(' message after correction');console.log(messageText);
  // console.log(' ---------correct before send end---------------');
  return messageText;
};

/** parse message text to insert stickers/smiles, remove references...
 * version 4.0
 * **/
Message.prototype.parseMessage = function (msgText) {
  var self = this;

  if (typeof msgText === 'undefined'){
    console.log('Message.parseMessage js non-block error',new Error().stack);
    msgText = '';
  }

  var parsedMsgTxt = msgText;

  // check if message has stickers inside it
  var stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+);/im);
  // console.log('check if message has stickers inside it');console.log(stickerMatches);
  // console.log(' message before correction');console.log(parsedMsgTxt);
  while (stickerMatches != null && pageChat.stickersSrc[stickerMatches[1]] != undefined) {
    if (stickerMatches != null && pageChat.stickersSrc[stickerMatches[1]] != undefined) {

      var stickerHtmlCode = '<img src="https://emosmile.com' + pageChat.stickersSrc[stickerMatches[1]].stickerImg + '" alt="smile" contenteditable="false">',
        stickerBaseCode = '&amp;s-' + stickerMatches[1] + ';';
      parsedMsgTxt = message.stringReplaceAll(parsedMsgTxt, stickerBaseCode, stickerHtmlCode);
    }
    stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+);/im);
  }

  // check if message has smiles inside it
  var smilesMathces = parsedMsgTxt.match(/&amp;sm-([0-9]+);/im);

  while (smilesMathces != null) {
    if (smilesMathces != null) {
      var smileBaseCode = '&amp;sm-' + smilesMathces[1] + ';',
        smileHtmlCode = '<div class="sprite-smile-16 st-sm-16-' + smilesMathces[1] + '" title="smile" contenteditable="false"></div>';
      parsedMsgTxt = message.stringReplaceAll(parsedMsgTxt, smileBaseCode, smileHtmlCode);
    }
    smilesMathces = parsedMsgTxt.match(/&amp;sm-([0-9]+);/im);
  }

  /*replace all special symbols referring to html*/
  parsedMsgTxt = self.htmlEscapeBack(parsedMsgTxt);

  // wrap all links
  var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  parsedMsgTxt = parsedMsgTxt.replace(urlRegex, function(url) { return '<a href="' + url + '">' + url + '</a>'; });

  //Legacy support
  var manyWhitespaces = parsedMsgTxt.match(/  /i);
  while (manyWhitespaces != null) {
    if (manyWhitespaces != null) {
      parsedMsgTxt = self.stringReplaceAll(parsedMsgTxt, '  ', ' ');
    }
    manyWhitespaces = parsedMsgTxt.match(/  /i);
  }

  // correct chrome many new line
  var nLineMultiple = parsedMsgTxt.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);

  while (nLineMultiple != null) {
    if (nLineMultiple != null) {
      parsedMsgTxt = parsedMsgTxt.replace(nLineMultiple[0], '\n');
    }
    nLineMultiple = parsedMsgTxt.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);
  }

  return parsedMsgTxt; // returns message text with codes instead of html tags
};


/** Replace All occurrences in string at one time **/
Message.prototype.stringReplaceAll = function (string, find, replace) {
  var self = this;
  return string.replace(new RegExp(self.escapeRegExp(find), 'g'), replace);
};

Message.prototype.escapeRegExp = function (str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

Message.prototype.htmlEscape = function (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

Message.prototype.htmlEscapeBack = function (str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
};

//
Message.prototype.formatDate = function (date) {
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
Message.prototype.cursorToTheEnd = function (htmlElement) {
  var range, selection;

  range = document.createRange();//Create a range (a range is a like the selection but invisible)
  range.selectNodeContents(htmlElement);//Select the entire contents of the element with the range
  range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
  selection = window.getSelection();//get the selection object (allows you to change selection)
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection
};

Message.prototype.replaceCodesWithText = function(msgText, isAttachmentExist) {
  if (!msgText) return '';

  let parsedMsgTxt = msgText;

  // check if message has stickers inside it
  const stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+)/im);
  if (stickerMatches != null) {
    parsedMsgTxt = parsedMsgTxt.replace('&amp;s-' + stickerMatches[1], ':sticker:');
  }

  // check if message has smiles inside it
  let smilesMatch = parsedMsgTxt.match(/&amp;sm-([0-9]+)/im);
  while (smilesMatch != null) {
    const smileBaseCode = '&amp;sm-' + smilesMatch[1],
      smileHtmlCode = ':smile:';
    parsedMsgTxt = this.stringReplaceAll(parsedMsgTxt, smileBaseCode, smileHtmlCode);
    smilesMatch = parsedMsgTxt.match(/&amp;sm-([0-9]+)/im);
  }

  //replace photo
  if ((!msgText || msgText.length === 0) && isAttachmentExist) {
    parsedMsgTxt = ':image:'
  }

  /*replace all special symbols referring to html*/
  return this.htmlEscapeBack(parsedMsgTxt);
};
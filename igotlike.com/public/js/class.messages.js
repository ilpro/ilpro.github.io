'use strict';

var Message = function () {

};

/** parse message text to insert stickers/smiles, highlight references...
 * version 4.0
 * **/
Message.prototype.parseMessage = function (msgText) {
  var self = this;

  if (typeof msgText === 'undefined') {
    // console.log('Message.parseMessage js non-block error', new Error().stack);
    msgText = '';
  }

  var parsedMsgTxt = msgText;

  // check if message has stickers inside it
  var stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+);/im);
  // console.log('check if message has stickers inside it');console.log(stickerMatches);
  // console.log(' message before correction');console.log(parsedMsgTxt);
  while (stickerMatches != null && stickersAndEmoji.stickersImg[stickerMatches[1]] != undefined) {
    if (stickerMatches != null && stickersAndEmoji.stickersImg[stickerMatches[1]] != undefined) {

      var stickerHtmlCode = '<img src="https://emosmile.com' + stickersAndEmoji.stickersImg[stickerMatches[1]].stickerImg + '" alt="smile" contenteditable="false">',
        stickerBaseCode = '&amp;s-' + stickerMatches[1] + ';';
      parsedMsgTxt = message.stringReplaceAll(parsedMsgTxt, stickerBaseCode, stickerHtmlCode);
    }
    stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+);/im);
  }
  // console.log(' message after correction');console.log(parsedMsgTxt);

  // check if message has smiles inside it
  var smilesMathces = parsedMsgTxt.match(/&amp;sm-([0-9]+);/im);
  while (smilesMathces != null) {
    if (smilesMathces != null) {
      var smileBaseCode = '&amp;sm-' + smilesMathces[1] + ';',
        smileHtmlCode = '<div class="sprite-smile-23 st-sm-23-' + smilesMathces[1] + '" title="smile" contenteditable="false"></div>';
      parsedMsgTxt = message.stringReplaceAll(parsedMsgTxt, smileBaseCode, smileHtmlCode);
    }
    smilesMathces = parsedMsgTxt.match(/&amp;sm-([0-9]+);/im);
  }

  /*replace all special symbols referring to html*/
  parsedMsgTxt = self.htmlEscapeBack(parsedMsgTxt);

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
    nLineMultiple = parsedMsgTxt.match(/( *\n[\p{Z}\p{C}]]*\n *)+/mi);
  }

  // console.log(' ---------parse end---------------');
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

/** Validate and correct message before send to server
 * * version 4.1
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
  var smilesMatches = messageText.match(/<div[^>]*st-sm-23-([0-9]+)[^>]*><\/div[^>]*>/im);

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
    smilesMatches = messageText.match(/<div[^>]*st-sm-23-([0-9]+)[^>]*><\/div[^>]*>/im);
  }
  // console.log(' message after correction');console.log(messageText);

  // check if message has stickers inside it
  var stickerMatches = messageText.match(/data-sticker="&amp;s-([0-9]+);"/im);

  // console.log('check if message has stickers inside it');console.log(stickerMatches);
  // console.log(' message before correction');console.log(messageText);

  while (stickerMatches != null) {
    // replace stickers inside to basecodes
    if (stickerMatches != null) {
      var stickerHtmlCode = '<img src="https://emosmile.com' + stickersAndEmoji.stickersImg[stickerMatches[1]].stickerImg + '" data-sticker="&amp;s-' + stickerMatches[1] + ';" alt="smile">',
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

  // replace msg time when copy multiple
  var timeMatches = messageText.match(/<div class="message-time"[^>]*>.*?<\/div[^>]*>/i);
  while (timeMatches != null) {
    if (timeMatches != null) {
      messageText = messageText.replace(timeMatches[0], '');
    }
    timeMatches = messageText.match(/<div class="message-time"[^>]*>.*?<\/div[^>]*>/i);
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
      messageText = messageText.replace(brMatches[0], '\n');
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
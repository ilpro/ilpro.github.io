'use strict';
function Message(socket){
	this.socket = socket;
}

/** Get private chat message **/
Message.prototype.getPrivateMessages = function (userId, recipientId, botId){
	var self = this;
	// request: getPrivateChatMessages, response: privateChatMessages
	self.socket.emit('getPrivateChatMessages', JSON.stringify({userId: userId, recipientId: recipientId, botId: botId}))
};

/** Get chunk of private chat previous messages **/
Message.prototype.loadMoreMessages = function (userId, recipientId, firstMessageId){
	var self = this;
	
	var sendData = {
		userId: userId,
		recipientId: recipientId, 
		firstMessageId: firstMessageId
	};
	
	// request: loadPreviousMessages; response: previousMessages
	self.socket.emit('loadMoreMessages', JSON.stringify(sendData));
};

/** Send private chat message **/
Message.prototype.sendPrivateMessage = function ($clickedBtn, senderHash, receiverId){
	var self = this;
	var $textField = $('#private-messages-input-box');
	var messageText = $textField.html();
	var messageType = '';
	var stickerLink = '';

	// if comment exists and user logged in
	if (messageText.length >= 1 && user.hash && receiverId != 0) {
		// validate message and check it for bugs
		var checkStResult = self.checkStickers(messageText);
		messageText = self.correctMessageBeforeSend(messageText);

		if(checkStResult.hasSticker) {
			messageType = 'sticker';
			stickerLink = checkStResult.stickerLink
		} else {
			messageType = 'text';
		}

		var sendData = {
			hash: senderHash,
			receiverId: receiverId,
			message: self.htmlEscape(messageText),
			type: messageType,
			link: stickerLink
		};

		self.socket.emit('sendMessage', JSON.stringify(sendData));
		$textField.html('');
	}
};

/** Delete private chat message **/
Message.prototype.deletePrivateMessage = function (msgId){
	var self = this;
	self.socket.emit('deletePrivateMessage', JSON.stringify({hash: user.hash, messageId: msgId}));
};

/** Set unread message flag to read **/
Message.prototype.userReadMessages = function (userHash, messageIds){
	var self = this;
	var sendData = {hash: userHash, messageIds: messageIds};
	
	// make this messages read by user
	self.socket.emit('userReadMessages', JSON.stringify(sendData));
};

/** Validate and correct message before send to server
 * * version 4.5
 * **/
Message.prototype.correctMessageBeforeSend = function (messageText) {
	var self = this;

    // console.log(' ---------correct before send---------------');
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

	while (smilesMatches != null) {
		// console.log('check if message has smiles inside it');console.log(smilesMatches);
		// console.log(' message before correction');console.log(messageText);

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
	// console.log("smile while.fin");

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
    // console.log("stickers while.fin");

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
    var divMatches = messageText.match(/<div[^>]*>(.*?)<\/div[^>]*>/im);
    while (divMatches != null) {
        if (divMatches != null) {
            messageText = messageText.replace(divMatches[0], '\n' + divMatches[1]);
        }
        divMatches = messageText.match(/<div[^>]*>(.*?)<\/div[^>]*>/im);
    }
    // console.log(' message after correction');console.log(messageText);
	// console.log("div chrome while.fin");


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

    // console.log("many whitespases while.fin")
    // correct chrome many new line
    var nLineMultiple = messageText.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);

    while (nLineMultiple != null) {
        if (nLineMultiple != null) {
            messageText = messageText.replace(nLineMultiple[0], '\n');
        }
        nLineMultiple = messageText.match(/( *\n[\p{Z}\p{C}]*\n *)+/mi);
    }
    // console.log("div chrome while2.fin");
    messageText = messageText.trim();
    // console.log(' message after correction');console.log(messageText);
    // console.log(' ---------correct before send end---------------');

	return messageText;
};

Message.prototype.checkStickers = function (parsedMsgTxt) {
	// check if message has stickers inside it
	var stickerLink = '';
	var stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+);/im);
	if (stickerMatches != null && stickersAndEmoji.stickersImg[stickerMatches[1]] != undefined) {
		stickerLink = 'https://emosmile.com' + stickersAndEmoji.stickersImg[stickerMatches[1]].stickerImg;
	}

	return {
		hasSticker: stickerMatches != null,
		stickerLink: stickerLink
	}
};


/** parse message text to insert stickers/smiles, highlight references...
 * version 3.5
 * **/
Message.prototype.parseMessages = function(msgText,linkReplace) {
	var self = this;

    linkReplace = typeof linkReplace !== 'undefined' ? linkReplace : true;

    var parsedMsgTxt = msgText;
	
	//is site
	var references = parsedMsgTxt.match(/http:/g);
	var secureReferences = parsedMsgTxt.match(/https:/g);

	//specified site
	var hasYoutube = parsedMsgTxt.match(/youtu/g);
	var hasYoutubeNotVideo = parsedMsgTxt.match(/channel|playlist|feed/g);

	//is image
	var imageJpgReferences = parsedMsgTxt.match(/.jpg/g);
	var imagePngReferences = parsedMsgTxt.match(/.png/g);

	//is internal source (stickers/smiles)
	var hasHttpSmileCode = parsedMsgTxt.match(/="smile"/g);
	var hasInternalSource = parsedMsgTxt.match(/src=/g);

	var hasInternalHreference = parsedMsgTxt.match(/href=/g);

	//group conditions
	var linkIsSite = !!(references != null || secureReferences != null);
	var linkIsImage = !!(imageJpgReferences != null || imagePngReferences != null);
	var internalSource = !!(hasInternalSource != null || hasInternalHreference != null || hasHttpSmileCode != null);

	// check if message has stickers inside it
	var stickerMatches = parsedMsgTxt.match(/&amp;s-([0-9]+);/im);
	if (stickerMatches != null && stickersAndEmoji.stickersImg[stickerMatches[1]] != undefined) {
		parsedMsgTxt = parsedMsgTxt.replace('&amp;s-' + stickerMatches[1] + ';', '<img data-src="https://emosmile.com' + stickersAndEmoji.stickersImg[stickerMatches[1]].stickerImg + '" alt="sticker-msg" contenteditable="false">');
	}

	// check if message has smiles inside it
	var smilesMathces = parsedMsgTxt.match(/&amp;sm-([0-9]+);/im);

	while (smilesMathces != null){
		if (smilesMathces != null) {
			var smileBaseCode = '&amp;sm-' + smilesMathces[1] + ';',
				smileHtmlCode = '<div class="sprite-smile-16 st-sm-16-' + smilesMathces[1] + '" title="smile" contenteditable="false"></div>';
			parsedMsgTxt = message.stringReplaceAll(parsedMsgTxt, smileBaseCode, smileHtmlCode);
		}
		smilesMathces = parsedMsgTxt.match(/&amp;sm-([0-9]+);/im);
	}


	/*replace all special symbols referring to html*/
	parsedMsgTxt = self.htmlEscapeBack(parsedMsgTxt);

	if (linkIsSite && !internalSource && linkReplace) {
		//split msg to words
		var msgArr = parsedMsgTxt.split(' ');
		//find link in words
		for (var i = 0; i < msgArr.length; i++) {
			if (msgArr[i].match(/http:/g) || msgArr[i].match(/https:/g)) {
				var siteLink = msgArr[i];
			}
		}

		//make link html construction
		var siteHtmlLink = '<a href="' + siteLink + '" style="color: blue" target="_blank">' + siteLink + '</a>';

		//replace link to html construction
		parsedMsgTxt = parsedMsgTxt.replace(siteLink, siteHtmlLink);
		
		//add img below message if it is
		if (linkIsImage) {
			parsedMsgTxt = parsedMsgTxt + '<img class="converted-img" src="' + siteLink + '" >';
		}

		/*add video boxes*/
		if ((hasYoutube != null) && (hasYoutubeNotVideo == null)) {

			//split link type https://youtu.be/005pVcFF-pk
			var youtubeCodeShare = siteLink.split('/');

			//split link type https://www.youtube.com/watch?v=005pVcFF-pk
			var youtubeCodeLink = youtubeCodeShare[youtubeCodeShare.length - 1].split('?v=');

			//split link type https://www.youtube.com/watch?v=005pVcFF-pk?t=14m51s
			var youtubeCodeTime = youtubeCodeLink[youtubeCodeLink.length - 1].split('?');
			parsedMsgTxt = parsedMsgTxt + '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + youtubeCodeTime[0] + '" frameborder="0" allowfullscreen contenteditable="false"></iframe>'
		}
	}

    if(linkIsSite && !internalSource && !linkReplace){
        //split msg to words
        var msgArr = parsedMsgTxt.split(' ');
        //find link in words
        for(var i = 0; i < msgArr.length; i++) {
            if(msgArr[i].match(/http:/g) || msgArr[i].match(/https:/g)) {
                var siteLink = msgArr[i];
            }
        }
        //make link html construction
        var siteHtmlLink = '<div style="display:inline-block;color:blue">' + siteLink + '</div>';

        //replace link to html construction
        parsedMsgTxt = parsedMsgTxt.replace(siteLink, siteHtmlLink);
    }

	var scriptMathces = parsedMsgTxt.match(/<script[^>]*>(.*?)<\/script[^>]*>|<javascript[^>]*>(.*?)<\/javascript[^>]*>/gi);
	if (scriptMathces != null) {
		var scriptBaseCode = scriptMathces[0],
			scriptHtmlCode = self.htmlEscape(scriptMathces[0]);
		parsedMsgTxt = message.stringReplaceAll(parsedMsgTxt, scriptBaseCode, scriptHtmlCode);
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
		.replace(/&quot;/g,'"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g,  '<')
		.replace(/&gt;/g,  '>')
		.replace(/&nbsp;/g, ' ');
};

//
Message.prototype.formatDate = function(date) {
	var newsDate = new Date(date),
		todayDate = new Date();
	var day1 = newsDate.getDate(),
		day2 = todayDate.getDate();
	var month1 = newsDate.getMonth(),
		month2 = todayDate.getMonth();
	var month = parseInt(newsDate.getMonth()) + 1;
	var day = parseInt(newsDate.getDate());
	month = month < 10 ? '0' + month : month;
	day = day < 10 ? '0' + day : day;
	var dayFull = (day1 == day2 && month1 == month2) ? "Сегодня" : day + "." + month + "." + newsDate.getFullYear();
	var hours = parseInt(newsDate.getHours()) < 10 ? '0' + newsDate.getHours() : newsDate.getHours();
	var minute = parseInt(newsDate.getMinutes()) < 10 ? '0' + newsDate.getMinutes() : newsDate.getMinutes();
	var time = hours + ":" + minute;
	return {day: dayFull, time: time};
};


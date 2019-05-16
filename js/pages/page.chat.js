'use strict';
/**
 * Created by Creator on 16.03.2017.
 */

function Chat(socket) {
  this.socket = socket;
  this.showBots = false;
  this.userId = false;
  this.userRole = false;
  this.messages = false;
  this.comments = false;
  this.userMessages = false;
  this.userComments = false;
};

/*** GLOBAL VARIABLE ***/
var smileID;

/** Init **/
Chat.prototype.init = function() {
  var self = this;
  
  // request: sticker, response: stickers
  stickersAndEmoji.init({container: '.sticker-lift', socket: self.socket});

  // if user logged in, show interface
  if(user.info.hash) {
    self.showAuthorizedInterface();

    // get user bots and get unread messages for bots every 10 sek
    if(user.info.userRole >= 50) {
      userBots.getCommentsBots();
    }
  } else {
    self.showUnAuthorizedInterface();
  }

  // handlers
  self.initSocketHandlers(); // init socket "on" handlers
  self.initHandlers(); // init common handlers like "click"

  // self.insertStickersAndSmiles(); // insert stickers and AFTER that INSERT MESSAGES IN CHAT
  waitForStickers();

  // check for new comments every 30 sek
  setInterval(function() {
    self.getCommentsForMainChat();
  }, 30000);

  function waitForStickers() {
    if($.isEmptyObject(stickersAndEmoji.stickers)) {
      setTimeout(waitForStickers, 200)
    } else {
      self.getMainChat({regionId: 1});  // request: getMainChat, response: mainChat
      self.getCommentsForMainChat();  // request: getCommentsForMainChat, response: commentsForMainChat
    }
  }
};

/** Show login container **/
Chat.prototype.showAuthorizedInterface = function() {
  var self = this;

  $('.comments__login', '#chat-container').hide();

  self.userId = user.info.userId;
  self.userRole = user.info.userRole;
  $('.comments__send-box .user-avatar > img', '#chat-container').attr('src', user.info.userPhoto);
  $('.comments__send-box .user-info', '#chat-container').html(user.getName(user.info));
  $('.comments__send-box', '#chat-container').show();
  $(".comments-container").addClass("sticker-opened");

  cutImg('#chat-container .comments__send-box .user-avatar > img'); // resize avatars

  $('.comments__send-box', '#chat-container').show();

  if($('.chat__wrapper').hasClass('opened'))
    $('.user-message', '#chat-container').focus();

  if($('.comment-delete-btn', '#chat-container').length > 0)
    $('.comment-delete-btn', '#chat-container').show();
};

Chat.prototype.showUnAuthorizedInterface = function() {
  if($('.comment-delete-btn', '#chat-container').length > 0) $('.comment-delete-btn', '#chat-container').hide();

  $('.comments__send-box', '#chat-container').hide();
  $('.comments__login', '#chat-container').show();
  $(".comments-container").removeClass("sticker-opened");
};

/** Get chat messages by this region or local chat ID **/
Chat.prototype.getMainChat = function(params) {
  var self = this;
  // request: getMainChat, response: mainChat
  self.socket.emit('getMainChat', JSON.stringify(params));
};

/** Get first 30 comments from comments **/
Chat.prototype.getCommentsForMainChat = function(params) {
  var self = this;
  // request: getCommentsForMainChat, response: commentsForMainChat
  if(params) {
    self.socket.emit('getCommentsForMainChat', JSON.stringify(params));
  } else {
    self.socket.emit('getCommentsForMainChat');
  }
};

/** Socket handlers **/
Chat.prototype.initSocketHandlers = function() {
  var self = this;

  // handle chat messages
  self.socket.off('mainChat').on('mainChat', function(data) {
    data = JSON.parse(data);

    // check if this general chat (not got by user id), then check if comments exists
    if(data.chat && !data.userId) {
      self.messages = data.chat;
      if(self.comments) {
        self.insertMessages(self.messages, self.comments)
      }
    }
  });

  // handle comments to insert into chat
  self.socket.off('commentsForMainChat').on('commentsForMainChat', function(data) {
    data = JSON.parse(data);

    // check if this general chat (not got by user id), then check if comments exists
    if(data.comments) {
      if(data.userId) {
        self.insertCommentsOnProfilePage(data.comments);
      } else {
        self.comments = data.comments;
        if(self.messages) {
          self.insertMessages(self.messages, self.comments)
        }
      }
    }
  });

  // handle login
  self.socket.on('authLogin', function() {
    self.showAuthorizedInterface();
  });

  // handle logout
  $(document).on('userLogout', function() {
    self.showUnAuthorizedInterface();
  });

  // delete message by Id from chat
  self.socket.off('deleteChatMessage').on('deleteChatMessage', function(messageId) {
    $('#chat-container').find('.comment[data-messageId=' + messageId + ']').remove();
  });
};

/** Insert messages **/
Chat.prototype.insertMessages = function(messages, comments) {
  var self = this;
  var $chatContainer = $('#chat-container');

  // remove loading animation
  $chatContainer.find('.comments-load-img').remove();
  $chatContainer.find('.comments-empty-text').remove();

  // merging chat messages and comments, sort by time
  var combinedArr = self.mergeMessagesAndComments(messages, comments);
  self.constructMessages(combinedArr); // insert messages
};

/** Construct chat **/
Chat.prototype.constructMessages = function(messagesAndComments) {
  var self = this;
  var message = '';
  var messageExists;
  var length = messagesAndComments.length;

  for(var i = 0; i < length; i++) {
    var messageObj = messagesAndComments[i];

    // if this key is a message, get message template
    if(typeof messageObj.messageId != 'undefined') {
      messageExists = $('#chat-container').find('.comment[data-messageId=' + messageObj.messageId + ']').length;
      message = self.messageTemplate(messageObj)
    }

    // if this key is a comment, get comment template
    if(typeof messageObj.commentId != 'undefined') {
      messageExists = $('#chat-container').find('.comment[data-messageId=' + messageObj.commentId + ']').length;
      message = self.commentTemplate(messageObj)
    }

    // if message not already in chat, insert it
    if(messageExists == 0) {
      $('.comments-box', '#chat-container').append(message);

      /***Load Lazy Chat Stickers in messages  ***/
      msgStickresLazyLoad();

      /***Scroll after stickers each load  ***/
      onImgLoad($('.msg img[alt="sticker-msg"]'), function() {
        self.scrollDown($('.messages-wrapper'));
      });

      setTimeout(function() {
        self.scrollDown();// update chat by scrolling down
      }, 50);

      var icoLink = '/assets/img/favicons/Blue-white.ico';
      self.faviconPulse(250, 500, icoLink);//favicon blinks

      // if((smileID !== '') && (i == (length - 1))) fireSmile(smileID);//launch smile

      self.highlightChatBtn(); // chat button blinks
      setTimeout(function() {
        $('#chat-toggle').removeClass('new-msg')
      }, 2000); // remove higlightning
    }
  }

  cutImg("#chat-container .user-avatar > img"); // resize avatar
};

/** Chat message HTML template **/
Chat.prototype.commentTemplate = function(commentObj) {
  var self = this;
  var comment = '';
  var date = message.formatDate(commentObj.commentTime);

  // parse message text to insert stickers/smiles, highlight reference
  var handledMessageText = message.parseMessages(commentObj.commentText, "isNewsComment");

  // get user name and photo
  var userName = user.getName(commentObj);
  var userPhoto = commentObj.userPhoto != '' ? '<img src="' + commentObj.userPhoto + '" alt="user">' : '';

  // get date
  var dayDateText = date.day;
  var connectionDateWord = lang.lCommAtText;

  // get url
  var url = commentObj.url;

  comment =
    '<div class="comment appear" data-messageid="' + commentObj.commentId + '">\
       <div class="relative-comment-box" >\
         <a class="donor" href="http://content.mediastealer.com/?contentUrl=' + url + '" target="_blank">\
           <span class="donor-header">' + commentObj.urlDescription + '</span>\
         </a>\
         <div class="message-box comment">\
           <div class="comment-user clearfix">\
             <figure class="user-avatar float-left">\
               ' + userPhoto + '\
             </figure>\
             <div class="user-info float-left">\
               ' + userName + '\
             </div>\
             <div class="achievement-rating top-rating">\
               <time class="comment-time" title="' + lang.lCommTime + '">' + dayDateText + connectionDateWord + date.time + '</time>\
             </div>\
             <div class="comment-message">\
               <div class="msg">' + handledMessageText + '</div>\
             </div>\
           </div>\
         </div>\
       </div>\
     </div>';

  return comment;
};

/** Chat message HTML template **/
Chat.prototype.messageTemplate = function(commentObj) {
  var self = this;
  var msg = '';

  var date = message.formatDate(commentObj.messageTime);
  var rating = 0;

  // parse message text to insert stickers/smiles, highlight reference
  var handledMessageText = message.parseMessages(commentObj.messageText);

  // get user name and photo
  var userName = user.getName(commentObj);
  var userPhoto = commentObj.userPhoto != '' ? '<img src="' + commentObj.userPhoto + '" alt="user">' : '';

  var rateText = lang.lChatLikeTitle;
  var deleteComment = '';

  // check if user has admin privileges
  if(user.info.hash && self.userRole > 50) {
    var deleteText = lang.lCommDeleteText;
    var deleteDesc = lang.lCommDeleteDesc;
    deleteComment =
      '<button class="btn-clear comment-delete-btn" title="' + deleteDesc + '">' + deleteText + '</button>';
  }

  var dayDateText = date.day;
  var connectionDateWord = lang.lCommAtText;
  //var replyTitle = (commentObj.userId == self.userId) ? '' : 'Кликните, что бы ответить пользователю';

  msg =
    '<div class="comment appear" data-messageId="' + commentObj.messageId + '" data-userId="' + commentObj.userId + '">\
                        <div class="comment-body">\
                            <div class="comment-user clearfix">\
                                <figure class="user-avatar float-left" >\
                                    ' + userPhoto + '\
                                </figure>\
                                <a href="/#page=profile&id=' + commentObj.userId + '" class="user-info float-left">\
                                    <span>' + userName + '</span>\
                                </a>\
                                <div class="achievement-rating top-rating">\
                                        <time class="comment-time" title="' + lang.lCommTime + '">' + dayDateText + connectionDateWord + date.time + '</time>\
                                </div>\
                                <div class="comment-message">\
                                    <div class="msg">' + handledMessageText + '</div>\
                                    <div class="achievement-rating bottom-rating">\
                                        ' + deleteComment + '\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                     </div>';

  return msg;
};

/** Making one object from comments and chat messages, sorted by time **/
Chat.prototype.mergeMessagesAndComments = function(messages, comments) {
  var mergedArr = messages.concat(comments);

  // sorting two united arrays by messageTime for chat messages and commentTime for comments
  mergedArr.sort(function(a, b) {
    var firstMsgTime, secondMsgTime;

    if(typeof a['messageTime'] != 'undefined') {
      firstMsgTime = new Date(a['messageTime']);
    } else {
      firstMsgTime = new Date(a['commentTime']);
    }

    if(typeof b['commentTime'] != 'undefined') {
      secondMsgTime = new Date(b['commentTime']);
    } else {
      secondMsgTime = new Date(b['messageTime']);
    }

    return firstMsgTime - secondMsgTime
  });

  mergedArr = mergedArr.splice(30, mergedArr.length);
  return mergedArr; // return sorted array
};

/** Chat button blinks for 2 sek when new message comes **/
Chat.prototype.highlightChatBtn = function() {
  $('#chat-toggle').addClass('new-message'); // highlight chat button
  setTimeout(function() {
    $('#chat-toggle').removeClass('new-message');
  }, 700);
};


/*** INIT OF AUTH COMMON HANDLERS **/
Chat.prototype.initHandlers = function() {
  var self = this;

  // remove selected bot if page changed
  $(window).on('hashchange', destroyChatBots);
  function destroyChatBots(){
    var page =  urlHash.getState('page');

    // clear variables like selected bot if admin chat page changed
    if(page !== 'chat') {
      userBots.destroy();
      $(window).off('hashchange', destroyChatBots);
    }
  }

  $(".comments__sticker-btn").click(function() {
    $(".comments-container").toggleClass('sticker-opened');
  });

  // handle enter press in send message field
  $('#chat-container').on("keydown", ".user-message", function(e) {
    // if user pressed  enter, send message
    if(e.keyCode == 13 && !e.shiftKey) {
      e.preventDefault();
      $(e.target).closest(".message-control").find(".comments__send-btn").click();
      return;
    }
  });

  // send message
  $('#chat-container').on("click", ".comments__send-btn", function() {
    self.sendMessage();
  });

  // delete message
  $('#chat-container').on("click", ".comment-delete-btn", function(e) {
    self.deleteMessage(e)
  });


  // send sticker
  $(document).on("click", ".send-smile", function(e) {
    var $sticker = $(this);
    var $textField = $('.user-message', "#chat-container");
    var $sendBtn = $('.comments__send-btn', '#private-chat-send-button');
    stickersAndEmoji.sendSticker($sticker, $textField, $sendBtn);
  });

  // handle click on login button in chat
  $('#chat-container').on('click', '.comments__login', function(e) {
    $('#login').click();
  });

  // attach overlay to button position
  $(".chat-btn-overlay").click(function() {
    var $sourceButton = $("#chat-toggle");
    $sourceButton.click();

    setTimeout(function() {
      var topOffset = $sourceButton.css("margin-top");
      $(".chat-btn-overlay").css("margin-top", topOffset);
      self.scrollDown();
      $('.user-message', '#chat-container').focus();
    }, 250);

    setTimeout(self.scrollDown, 300);
  });

  // Disable window scroll while chat scrolls (similar to sticker scroll)
  $(document).on('mousewheel DOMMouseScroll', ".comments-box", function(e) {
    disableWindowScroll(e, $(this));
  });

  // select user bot
  $('#chat-container').on("click", ".user-bot-item", '.user-bot', function() {
    var $botImg = $(this).find('img');

    // select bot
    userBots.selectBot($(this));

    $(".user-bot-item.active").removeClass("active");
    $(this).addClass("active");

    var $commentsBox = $(".comments__send-box", '#chat-container');

    $commentsBox.find(".user-avatar img").attr("src", $botImg.attr("src"));
    $commentsBox.find(".user-info span").first().html($botImg.attr("title"));
    $('.user-message', '#chat-container').focus();
  });
};


/** Delete message **/
Chat.prototype.deleteMessage = function(e) {
  var self = this;
  var messageId = $(e.target).closest('.comment').attr('data-messageId');
  var hash = getCookie('hash');
  var regionId = 1;

  var sendData = {
    messageId: messageId,
    regionId: regionId,
    hash: hash
  };
  self.socket.emit('deleteChatMessage', JSON.stringify(sendData));
  $(e.target).closest('.comment').remove();
};

/** Send message **/
Chat.prototype.sendMessage = function() {
  var self = this;
  var $textField = $('.user-message', '#chat-container');
  var commentText = $textField.html();
  var userObj = user.info;

  // check if user write from bot
  if(!!userBots.selectedBot) {
    userObj = userBots.selectedBot;
  }

  // if comment exists and user logged in
  if(commentText.length > 1 && !!user.info.hash) {
    var hash = userObj.hash;

    // check if message has bug &nbsp
    var whitespaceBugCheck = commentText.match(/&nbsp;/g);

    // console.log(' check if message has bug &nbsp'); console.log(whitespaceBugCheck);
    // console.log(' message before correction'); console.log(messageText);

    // replace smiles inside to basecodes
    if (whitespaceBugCheck != null) {
      commentText = stringReplaceAll(commentText, '&nbsp;', ' ');
    }
    // console.log(' message after correction'); console.log(messageText);

    // check if message has smiles inside it
    var smilesMatches = commentText.match(/st-sm-16-([0-9]+)"/im);

    while (smilesMatches != null) {
      // console.log('check if message has smiles inside it');console.log(smilesMatches);
      // console.log(' message before correction');console.log(messageText);

      // replace smiles inside to basecodes
      if (smilesMatches != null) {
        var smileHtmlCode = '<div class="sprite-smile-16 st-sm-16-' + smilesMatches[1] + '" contenteditable="false"></div>',
            smileBaseCode = '&amp;sm-' + smilesMatches[1] + ';';
        commentText = stringReplaceAll(commentText, smileHtmlCode, smileBaseCode);
      }

      // Recheck if message has smiles inside it
      smilesMatches = commentText.match(/st-sm-16-([0-9]+)"/im);
    }
    // console.log(' message after correction');console.log(messageText);

    // check if message has '&amp;' inside it (prevent double htmlEscape)
    var ampMatches = commentText.match(/&amp;/g);

    // console.log('check if message has "&amp;" inside it (prevent double htmlEscape)');console.log(ampMatches);
    // console.log(' message before correction');console.log(messageText);

    // replace amp before htmlEscape
    if (ampMatches != null) {
      var ampHtmlCode = '&amp;',
          ampBeforeEscapeCode = '&';
      commentText = stringReplaceAll(commentText, ampHtmlCode, ampBeforeEscapeCode);
    }

    // console.log(' message after correction');console.log(messageText);


    var sendData = {
      message: htmlEscape(commentText),
      hash: hash,
      parentMessage: 0,
      regionId: 1
    };
    self.socket.emit('postChatMessage', JSON.stringify(sendData));
    $textField.html('');
  }
};

/** Scroll down to the latest message in the chat **/
Chat.prototype.scrollDown = function() {
  var $msgBox = $('.comments-box', '#chat-container');
  $msgBox.scrollTop($msgBox.prop("scrollHeight"));
};

Chat.prototype.faviconPulse = function(pulseFrequency, pulseTime, icoLink) {
  var $favicon = $("#favicon"),
    inter,
    href = $favicon.attr('href');

  if(icoLink) {
    inter = setInterval(function() {
      if($favicon.attr('href') == href) {
        $favicon.attr('href', icoLink);
      } else {
        $favicon.attr('href', href);
      }
    }, (pulseFrequency ? pulseFrequency : 500));
  }
  setTimeout(function() {
    clearInterval(inter);
    $favicon.attr('href', href);
  }, (pulseTime ? pulseTime : 1100))
};

Chat.prototype.insertCommentsOnProfilePage = function (commentsArr){
  var self = this;
  var allCommentsHtml = '';

  commentsArr.forEach(function (commentObj, i, arr){
    allCommentsHtml += self.commentTemplate(commentObj);
  });

  $('.comments-box','#chat-container').html(allCommentsHtml);
  msgStickresLazyLoad();
};
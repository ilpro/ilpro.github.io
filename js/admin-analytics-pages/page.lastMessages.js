/** Created by alex on 24.04.2017 **/
'use strict';

var pageLastMessages = {
  socket: {},

  init(socket) {
    var self = this;
    self.socket = socket;

    self.socket.emit('getLastMessages');
    self.scrollDown();
    self.initSocketHandlers();
  },

  initSocketHandlers() {
    var self = this;

    self.socket.on('lastMessages', function (data) {
      data = JSON.parse(data);
      self.insertMessages(data);
    })
  },

  insertMessages(msgArr) {
    var self = this;
    var allMsg = '';

    for (var i = 0; i < msgArr.length; i++) {
      var msgObj = msgArr[i];
      var senderName = msgObj.senderUseNickname ? msgObj.senderNickname : msgObj.senderName;
      var receiverName = msgObj.useNickname ? msgObj.userNickname : msgObj.userName;
      var photo = (msgObj.senderPhoto.indexOf('uploads') !== -1 || msgObj.senderPhoto.indexOf('media/ava') !== -1) ? 'https://www.emoment.com' + msgObj.senderPhoto : msgObj.senderPhoto;

      var date = new Date(msgObj.messageTime);

      var month = lang.lLastMsgMonths;
      var day = lang.lLastMsgDays;

      var msg =
        '<div class="comments-box">\
           <div class="comment appear" data-userid="' + msgObj.senderId + '">\
             <div class="comment-body">\
               <div class="comment-user clearfix">\
                 <figure class="user-avatar float-left">\
                   <img src="' + photo + '" alt="user" style="max-height: 100%;">\
                 </figure>\
                 <a href="/#page=profile&id='+ msgObj.senderId +'" class="user-info float-left">' +
                   lang.lLastMsgFrom +
                   '<span>' + senderName + '</span>\
                   <br>' +
                   lang.lLastMsgTo +
                   '<span>' + receiverName + '</span>\
                 </a>\
                 <div class="achievement-rating top-rating">\
                   <time class="comment-time" title="Время комментария">' + date.getDate() + ' ' + month[date.getMonth()] + ', ' + day[date.getDay()] + ', в ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '</time>\
                 </div>\
                 <div class="comment-message">\
                   <div class="msg">' + msgObj.messageText + '</div>\
                 </div>\
               </div>\
             </div>\
           </div>\
         </div>';

      allMsg += msg;
    }

    $('.comments-load-container').html(allMsg);
    self.scrollDown();
  },

  /** Scroll down to the latest message in the chat **/
  scrollDown: function () {
    $('.comments-container ').scrollTop($('.comments-container ').prop("scrollHeight"));
  },
};
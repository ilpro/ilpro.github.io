/** Created by alex on 29.04.2017 **/
'use strict';

/** Socket **/
var SOCKET = io.connect('https://www.emoment.com');
// var SOCKET = io.connect('http://148.251.52.170:5000');

/** Class definitions **/
var auth = new Auth(SOCKET);
var user = new User(SOCKET);
var message = new Message(SOCKET);
var lastChatUsers = new LastChatUsers(SOCKET);
var userBots = new UserBots(SOCKET);
var stickersAndEmoji = new StickersAndEmoji(SOCKET);
var searchUser = new SearchUser(SOCKET);
var notifications = new Notifications(SOCKET);

user.hash = getCookie("hash") ? getCookie("hash") : false;

/** Socket connection **/
SOCKET.on('connect', function (){
  console.log('connected!');
  if(user.hash ){
    SOCKET.emit('updateAuthClient', {hash: user.hash });
  }

  auth.init();
  user.init();
  adminAnalyticRouter.init();
});


SOCKET.on('disconnect', function () {
  console.log('socket closed');
});


var adminAnalyticRouter = {
  socket: {},
  currentPage: false,

  init() {
    var self = this;

    // hash change handler
    $(window).on('hashchange', function () {
      var page = urlHash.getState('page');
      
      if (page) {
        $('.classic-tab').removeClass('active');

        if (page === 'analytics') {
          var filter = urlHash.getState('filter');

          if (filter) {
            $('.classic-tab[data-type="' + filter + '"]').addClass('active');
          } else {
            urlHash.pushState({filter: 'register'});
          }

          $("#page").load("pages/" + lang.lName + "/admin-analytics.html", function() {
            pageAnalytics.init(SOCKET);
          });
        }
        if (page === 'last-messages') {
          urlHash.removeState('filter');
          $('.classic-tab[data-type="last-messages"]').addClass('active');

          $("#page").load("pages/" + lang.lName + "/admin-last-messages.html", function () {
            pageLastMessages.init(SOCKET);
          });
        }
        if (page === 'bot-chat') {
          urlHash.removeState('filter');
          $('.classic-tab[data-type="bot-chat"]').addClass('active');
          if (self.currentPage === page) {
            return;
          }

          $("#page").load("pages/" + lang.lName + "/messages.html", function () {
            user.launchAfterUserInfoReceived(pageMessages.init, {socket: SOCKET}, pageMessages);
          });
        }
      } else {
        urlHash.pushState({page: 'analytics'})
      }

      self.currentPage = page;
    });
    $(window).trigger("hashchange");

    /*** Login and logout **/
    if(user.hash){
      $('.classic-tab[data-type="bot-chat"]').show();
    }

    SOCKET.on('authLogin', function () {
      $('.classic-tab[data-type="bot-chat"]').show();

      if (self.currentPage === 'bot-chat') {
        $("#page").load("pages/" + lang.lName + "/messages.html", () => {
          user.launchAfterUserInfoReceived(pageMessages.init, {socket: SOCKET}, pageMessages);
        });
      }
    });

    $(document).on('userLogout', function () {
      $('.classic-tab[data-type="bot-chat"]').hide();
      urlHash.pushState({page: 'last-messages'});
    });
  }
};

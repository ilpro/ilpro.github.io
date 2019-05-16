'use strict';

/** Socket **/
// var SOCKET = io.connect('localhost:3001');
var SOCKET = io.connect('https://emoment.com')

/** Global variables **/
let isFirstLoad = true;

/** Class definitions **/
const auth = new Auth(SOCKET);
const user = new User(SOCKET);
const usersOnline = new UsersOnline(SOCKET);
const message = new Message(SOCKET);
const lastChatUsers = new LastChatUsers(SOCKET);
const userBots = new UserBots(SOCKET);
const stickersAndEmoji = new StickersAndEmoji(SOCKET);
const searchUser = new SearchUser(SOCKET);
const notifications = new Notifications(SOCKET);
const radio = new Radio(SOCKET);
const chat = new Chat(SOCKET);

user.hash = getCookie("hash") ? getCookie("hash") : false;

/** Socket connection **/
SOCKET.on('connect', () => {
  console.log('socket connected');

  // define user ID and write it on server
  if (user.hash) {
    SOCKET.emit('updateAuthClient', { hash: user.hash });
  }

  // get user info and insert it into header
  user.init();

  // authorization listeners init
  auth.init();

  // init notifications for load messages count
  notifications.init({
    totalMsgBox: "#messages-menu",
    userHash: user.hash
  });

  // init radio in header
  user.launchAfterUserInfoReceived(function () {
    radio.init();
  });

  $(document).trigger('hashchange');
});


SOCKET.on('disconnect', () => {
  console.log('socket closed');

  route.previousPage = false;
  route.currentPage = false;
});
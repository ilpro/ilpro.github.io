'use strict';
const socketClient = require('socket.io-client')('https://www.airybay.com', {reconnect: true});

const STATUS = require('./status');
const Redis = require('./redis');
const Helper = require('./helper');
const Auth = require('./auth');
const User = require('./user');
const SearchUser = require('./searchUser');
const Notifications = require('./notifications');
const Translate = require('./translate');
const PopularPlaces = require('./popularPlaces');
const Chat = require('./chat');
const ChatMessage = require('./chat/message');
const Conversation = require('./conversation');
const Stickers = require('./stickers');
const stickers = new Stickers();
const Image = require('./image');
const Video = require('./video');
const Post = require('./post');
const Favorites = require('./favorites');
const PostLike = require('./postLike');
const PostComplaint = require('./postComplaint');
const Hashtag = require('./hashtag');
const Location = require('./location');
const Cash = require('./cash');
const ErrorHandler = require('./errorHandler');

const authClient = {};

module.exports = function (io, socket) {
  function sendOnce(err, type, data) {
    if (err)
      console.log(err);
    else
      socket.emit(type, data);
  }

  function sendAll(err, type, data) {
    if (err)
      console.log(err);
    else
      io.sockets.emit(type, data);
  }

  // send response to specified client
  function sendTo(err, data, type, userId) {
    if (err) {
      console.log(err);
    }
    else {
      // if (authClient[userId] != undefined) {
      //   io.to(authClient[userId].soc).emit(type, data);
      // }
      if (authClient[userId] != undefined) {
        for (var sockeId in authClient[userId]) {
          io.to(sockeId).emit(type, data);
        }
      }
    }
  }

  /** Socket handlers **/
  // Auth client
  socket.on('updateAuthClient', data => {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (!data.hash) return;

    let userId = Helper.getIdByHash(data.hash);

    if (!(userId in authClient)) {
      authClient[userId] = {};
    }
    authClient[userId][socket.id] = true;

    /* db.query("SELECT `userLanguage` FROM `tbl_user` WHERE `userId` = ?;", [userId], function (err, rows) {
     if (err)
     console.log("Error in app.use #1\n" + err);
     else {
     if(rows.length > 0 && rows[0].userLanguage == "ru") {
     global.langParam = "paramRu";
     global.lang = langRu;
     }
     else {
     global.langParam = "paramUa";
     global.lang = langUa;
     }
     }
     }); */
  });

  socket.on('disconnect', () => {
    var socketId = socket.id;

    for (var userObj in authClient) {
      if (socketId in authClient[userObj]) {
        delete authClient[userObj][socketId];
        break;
      }
    }
  });

  socket.on('getResidence', function (data) {
    User.getResidence(function (data) {
      sendOnce(null, 'getResidence', JSON.stringify(data));
    });
  });

  // получение информации из Редиса
  socket.on('getCache', function (key) {
    cache.get(key, function (err, result) {
      if (err) {
        console.log('redis error:' + err);
      } else {
        sendOnce(null, key, result);
      }
    });
  });

  // Авторизация
  socket.on('userLogin', function (data) {
    data = JSON.parse(data);
    Auth.userLogin(sendOnce, data);
  });

  socket.on('userRegister', function (data) {
    data = JSON.parse(data);
    Auth.userRegister(sendOnce, data);
  });

  socket.on('isUserExist', function (data) {
    data = JSON.parse(data);
    Auth.isUserExist(sendOnce, data);
  });
  
  socket.on('userResetPassword', function (data) {
    data = JSON.parse(data);
    Auth.userResetPassword(sendOnce, data);
  });
  
  socket.on('userChangePassword', function (data) {
    data = JSON.parse(data);
    Auth.userChangePassword(sendOnce, data);
  });

  socket.on('cropUploadImage', data => {
    data = JSON.parse(data);
    Image.crop(data)
      .then(img => {
        sendOnce(null, "cropUploadImage", img.path)
      })
      .catch(err => console.log(err.message));
  });

  socket.on('updateAvatar', data => {
    data = JSON.parse(data);
    const userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    if (!userId) {
      return sendOnce(null, 'updateAvatar', JSON.stringify({
        success: false,
        status: STATUS.INVALID_INPUT_PARAMETERS,
        message: 'No hash provided'
      }));
    }

    Image.crop(data)
      .then(img => User.updateAvatar(userId, img.path))
      .then(result => sendOnce(null, "updateAvatar", JSON.stringify(result)))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return sendOnce(null, "updateAvatar", JSON.stringify({success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'}));
        }
        return sendOnce(null, "updateAvatar", JSON.stringify(err));
      });
  });

  socket.on('updateAvatarAndCreatePost', data => {
    data = JSON.parse(data);
    const userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    if (!userId) {
      return sendOnce(null, 'updateAvatarAndCreatePost', JSON.stringify({
        success: false,
        status: STATUS.INVALID_INPUT_PARAMETERS,
        message: 'No hash provided'
      }));
    }

    Image.crop(data)
      .then(cropPhotoResult => Post.add({userId, images: [cropPhotoResult]}))
      .then(addPostResult => User.updateAvatar(userId, addPostResult.images[0].path))
      .then(result => sendOnce(null, "updateAvatarAndCreatePost", JSON.stringify(result)))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return sendOnce(null, "updateAvatarAndCreatePost", JSON.stringify({success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'}));
        }
        return sendOnce(null, "updateAvatarAndCreatePost", JSON.stringify(err));
      });
  });

  socket.on('userRegisterFull', function (data) {
    data = JSON.parse(data);
    Auth.userRegisterFull(sendOnce, data);
  });

  socket.on('authTokenLogin', function (data) {
    data = JSON.parse(data);
    data.ip = socket.request.connection.remoteAddress.replace("::ffff:", "");
    Auth.authTokenLogin(sendOnce, data);
  });

  socket.on('authTokenLoginNew', function (data) {
    data = JSON.parse(data);
    data.ip = socket.request.connection.remoteAddress.replace("::ffff:", "");
    Auth.authTokenLoginNew(sendOnce, data);
  });

  // Пользователь
  socket.on('getUserOnline', function (data) {
    var online = (io.sockets.connected[authClient[data.userId]]) ? true : false;
    sendOnce(null, 'getUserOnline', {online: online});
  });

  socket.on('getUserAuthInfo', function (data) {
    data = JSON.parse(data);

    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.getUserAuthInfo(sendOnce, data);
    }
  });

  socket.on('getUserInfoById', function (data) {
    data = JSON.parse(data);
    if (data.userId) {
      User.getUserInfoById(sendOnce, data);
    }
  });
  
  socket.on('searchUserByNick', function (data) {
    data = JSON.parse(data);
	if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
		User.searchUserByNick(sendOnce, data);
  });

  // Travellers page
  socket.on('getPreviewUser', function (data) {
    // User.getPreviewUser(sendOnce, JSON.parse(data));
    SearchUser.getPreviewTraveller(sendOnce, JSON.parse(data));
  });

  socket.on('searchUser', function (data) {
    // User.searchUser(sendOnce, JSON.parse(data));
    SearchUser.searchTraveller(sendOnce, JSON.parse(data));
  });
  
  socket.on('searchUserDating', function (data) {
    // User.searchUser(sendOnce, JSON.parse(data));
    SearchUser.searchTravellerDating(sendOnce, JSON.parse(data));
  });
  
  socket.on('swipeLike', function (data) {
	  data = JSON.parse(data);
	  Favorites.addOrRemove(data.userId, data.profileId)
      .then(result => {
		if (result.action === 'add') {
          sendOnce(null, 'swipeLike', JSON.stringify({success:true}));
		  Notifications.addNotifications(sendTo, {
            senderId: data.userId,
            receiverId: result.profileId,
            type: "UserFavorite",
            typeId: result.profileId
          });
		}
      })
      .catch(err => console.log(err));
  });
  
  socket.on('swipeDislike', function (data) {
    User.addUserToViewed(sendOnce, JSON.parse(data));
  });

  socket.on('searchFriends', function (data) {
    data = JSON.parse(data);
    User.searchFriends(sendOnce, data);
  });

  socket.on('deleteUserImage', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.deleteUserImage(sendOnce, data);
    }
  });

  socket.on('updateUserParam', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.updateUserParam(sendOnce, data);
    }
  });

  socket.on('updateRequiredData', function (data) {
    data = JSON.parse(data);

    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.updateRequiredData(sendOnce, data);
    }
  });
  
  socket.on('updateVerificationData', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
      User.updateVerificationData(sendOnce, data);
  });

  socket.on('fastCropUserImage', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.fastCropUserImage(sendOnce, data);
    }
  });

  socket.on('getSocialContacts', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.getSocialContacts(sendOnce, data);
    }
  });

  socket.on('updateUserSocialContacts', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateUserSocialContacts(sendOnce, data);
    }
  });

  // Profile for android app
  socket.on('getUserInfo', function (data) {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    if (userId && data.profileId) {
      User.updateActiveTime(userId);

      // если это мой профиль
      if (userId == data.profileId) {
        User.getUserFullInfo(function (data) {
          if (data)
            sendOnce(null, "getUserInfo", JSON.stringify(data));
        }, {userId: userId, profileId: userId});
      }
      else {
        User.getUserFullInfo(function (data) {
          if (data)
            sendOnce(null, "getUserInfo", JSON.stringify(data));
        }, {userId: data.profileId, profileId: userId});
      }
    }
  });
  
  socket.on('getSettingsData', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
		User.getSettingsData(function (data) {
		  sendOnce(null, "getSettingsData", JSON.stringify(data));
		}, data);
  });
  
  socket.on('updateUserPassword', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
      User.updateUserPassword(sendOnce, data);
  });
  
  socket.on('deleteMyself', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
      User.deleteMyself(sendOnce, data);
  });

  socket.on('getProfileEdit', function (data) {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    User.getUserEditInfo(function (data) {
      sendOnce(null, "getProfileEdit", JSON.stringify(data));
    }, {userId});
  });

  socket.on('cropUserImage', function (data) {
    data = JSON.parse(data);
    data.userId = Helper.getIdByHash(data.hash);
    if (!data.userId) return;

    User.cropUserImage2(sendOnce, data);
  });

  // for mobile app
  socket.on('getFollowingInfo', function (data) {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);
    if (!userId) return;

    User.updateActiveTime(userId);
    Favorites.getFollowingInfo(userId, data.profileId)
      .then(data => sendOnce(null, "getFollowingInfo", JSON.stringify(data)))
      .catch(err => {
          if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
            console.log(err);
            return sendOnce(null, "getFollowingInfo", JSON.stringify({success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'}));
          }
          return sendOnce(null, "getFollowingInfo", JSON.stringify(err));
      })
  });
  
  // for mobile app
  socket.on('getUserFavorite', function (data) {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);
    if (!userId) return;

    User.updateActiveTime(userId);
    Favorites.getFavorites(userId)
      .then(favorites => sendOnce(null, "getUserFavorite", JSON.stringify(favorites)))
      .catch(err => console.log(err))
  });

  // for mobile app
  socket.on('getUserFans', function (data) {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);
    if (!userId) return;

    User.updateActiveTime(userId);
    Favorites.getFans(userId)
      .then(fans => sendOnce(null, "getUserFans", JSON.stringify(fans)))
      .catch(err => console.log(err))
  });


  // Blacklist
  socket.on('addUserBlacklist', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      if (data.userId != data.profileId)
        User.addUserBlacklist(sendOnce, data, sendTo);
    }
  });

  socket.on('checkBlacklistByProfileId', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
        User.checkBlacklistByProfileId(sendOnce, data);
    }
  });

  // Claim
  socket.on('addUserClaim', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      if (data.userId != data.profileId)
        User.addUserClaim(sendOnce, data, sendTo);
    }
  });

  // Photo Blacklist
  socket.on('addImageBlacklist', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.addImageBlacklist(sendOnce, data, sendTo);
    }
  });

  // Photo claim
  socket.on('addImageClaim', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      User.addImageClaim(sendOnce, data, sendTo);
    }
  });

  // Notifications
  socket.on('getSocketNotifications', function (data) {
    data = JSON.parse(data);

    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      Notifications.getNotifications(function (data) {
        sendOnce(null, "socketNotifications", JSON.stringify({notifications: data.rows}));
      }, data);
    }
  });

  socket.on('getNotificationsCount', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
      Notifications.getNotificationsCount(sendOnce, data);
  });

  socket.on('readAllNotifications', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
      Notifications.readAllNotifications(data);
  });

  socket.on('updateNotificationCount', function (data) {
    data = JSON.parse(data);
    sendTo(null, JSON.stringify({count: data.count}), "updateNotificationCount", data.receiverId);
  });

  socket.on('newNotification', function (data) {
    data = JSON.parse(data);
    sendTo(null, data.data, "newNotification", data.receiverId);
  });

  // Chat
  socket.on('checkPrivateConversationExists', data => {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    Conversation.checkPrivateConversationExists(userId, data.receiverId)
      .then(res => sendOnce(null, 'checkPrivateConversationExists', JSON.stringify(res)))
      .catch(err => sendOnce(null, 'checkPrivateConversationExists', JSON.stringify(err)));
  });

  socket.on('createConversation', data => {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    Conversation.create(userId, data.receivers, data.conversationType)
      .then(createRes => sendOnce(null, 'createConversation', JSON.stringify(createRes)))
      .catch(err => sendOnce(null, 'createConversation', JSON.stringify(err)));
  });

  socket.on('getChatMessages', data => {
    data = JSON.parse(data);
    data.userId = Helper.getIdByHash(data.hash);

    Chat.getMessages(data)
      .then(messagesRes => sendOnce(null, 'getChatMessages', JSON.stringify(messagesRes)))
      .catch(err => sendOnce(null, 'getChatMessages', JSON.stringify(err)));
  });

  socket.on('getChatList', data =>  {
    data = JSON.parse(data);
    data.userId = Helper.getIdByHash(data.hash);

    Chat.getChatList(data)
      .then(lastChatRes => sendOnce(null, 'getChatList', JSON.stringify(lastChatRes)))
      .catch(err => sendOnce(null, 'getChatList', JSON.stringify(err)))
  });

  socket.on('sendChatMessage', data =>  {
    data = JSON.parse(data);

    // if event has already handled by another server
    if (data.handled) {
      const stringified = JSON.stringify(data);
      sendTo(null, stringified, 'sendChatMessage', data.userId);
      return data.receiversOnline.forEach(receiver => {
        sendTo(null, stringified, 'sendChatMessage', receiver)
      });
    }

    data.userId = Helper.getIdByHash(data.hash);

    User.updateActiveTime(data.userId);

    Chat.saveMessage(data)
      .then(saveRes => User.filterUsersOnline(saveRes))
      .then(saveRes => {
        sendOnce(null, 'sendChatMessage', JSON.stringify(saveRes));
        if(saveRes.banned) return;
        socketClient.emit('sendChatMessage', JSON.stringify({...saveRes, handled: true}));

        // send message to receivers
        saveRes.receiversOnline.forEach(receiver => {
          sendTo(null, JSON.stringify(saveRes), 'sendChatMessage', receiver);
        });

        const conversationType = saveRes.conversationType;
        const notificationType = conversationType === 'chat' ? 'chatMessage' : 'eventMessage';
        saveRes.receivers.forEach(receiver => {
          if(notificationType === 'eventMessage') return;
          Notifications.sendPushMessage({
            conversationId: saveRes.conversationId,
            conversationType,
            notificationType,
            userId: saveRes.userId,
            receiverId: receiver,
            msgText: saveRes.message,
          });
        })

        // ->  set timer to check if user read this message
        // setTimeout(() => self.sendUnreadMessageToEmail(sendData.messageId), 5000);
      })
      .catch(err => sendOnce(null, 'sendChatMessage', JSON.stringify(err)));
  });

  socket.on('userReadMessages', data =>  {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    // if event has already handled by another server
    if (data.handled) {
      const stringified = JSON.stringify({conversationId: data.conversationId});
      sendTo(null, stringified, 'userReadMessages', data.userId);
      return data.receiversOnline.forEach(receiver => {
        sendTo(null, stringified, 'userReadMessages', receiver)
      });
    }

    Chat.userReadMessages(userId, data.conversationId)
      .then(readResult => User.filterUsersOnline(readResult))
      .then(readResult => {
        sendOnce(null, 'userReadMessages', JSON.stringify(readResult));

        const conversationId = readResult.conversationId;
        const receiversOnline = readResult.receiversOnline;
        socketClient.emit('userReadMessages', JSON.stringify({conversationId, receiversOnline, handled: true}));

        receiversOnline.forEach(receiver => sendTo(null, JSON.stringify({conversationId}), 'userReadMessages', receiver));
      })
      .catch(err => sendOnce(null, 'userReadMessages', JSON.stringify(err)))
  });

  socket.on('readAllChatMessages', data => {
    data = JSON.parse(data);
    data.userId = Helper.getIdByHash(data.hash);

    Chat.userReadAllMessages(data)
      .then(result => sendOnce(null, 'readAllChatMessages', JSON.stringify(result)))
      .catch(err => sendOnce(null, 'readAllChatMessages', JSON.stringify(err)))
  });

  socket.on('searchUsersInChat', data => {
    data = JSON.parse(data);
    data.userId = Helper.getIdByHash(data.hash);

    Chat.search(data)
      .then(result => sendOnce(null, 'searchUsersInChat', JSON.stringify(result)))
      .catch(err => sendOnce(null, 'searchUsersInChat', JSON.stringify(err)))
  });

  socket.on('updateChatMessage', data => {
    data = JSON.parse(data);

    // if event has already handled by another server
    if (data.handled) {
      const stringified = JSON.stringify(data);
      sendTo(null, stringified, 'updateChatMessage', data.userId);
      return data.receiversOnline.forEach(receiver => {
        sendTo(null, stringified, 'updateChatMessage', receiver)
      });
    }

    data.userId = Helper.getIdByHash(data.hash);

    User.updateActiveTime(data.userId);

    ChatMessage.update(data)
      .then(saveRes => User.filterUsersOnline(saveRes))
      .then(saveRes => {
        sendOnce(null, 'updateChatMessage', JSON.stringify(saveRes));
        socketClient.emit('updateChatMessage', JSON.stringify({
          ...saveRes,
          handled: true
        }));

        // send message to receivers
        saveRes.receiversOnline.forEach(receiver => {
          sendTo(null, JSON.stringify(saveRes), 'updateChatMessage', receiver);
        });
      })
      .catch(err => sendOnce(null, 'updateChatMessage', JSON.stringify(ErrorHandler(err))));
  });

  socket.on('deleteChatMessage', async data => {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    await ChatMessage.delete(userId, data.messageId)
      .then(result => sendOnce(null, 'deleteChatMessage', JSON.stringify(result)))
      .catch(err => sendOnce(null, 'deleteChatMessage', JSON.stringify(ErrorHandler(err))))
  });

  socket.on('getConversationInfoById', data => {
    data = JSON.parse(data);
    const userId = Helper.getIdByHash(data.hash);

    Conversation.getInfoById(userId, data.conversationId)
      .then(result => sendOnce(null, 'getConversationInfoById', JSON.stringify(result)))
      .catch(err => sendOnce(null, 'getConversationInfoById', JSON.stringify(err)))
  });

  // Translate
  socket.on('translateChat', function (data) {
    data = JSON.parse(data);
    Translate.translateChat(sendOnce, data);
  });

  // Media storage
  socket.on('getUserMediaFiles', function (data) {
    data = JSON.parse(data);

    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      MediaFiles.getAllByUserId(sendOnce, data);
    }
  });

  // Change chat status
  socket.on('changeUserChatStatus', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.changeUserChatStatus(sendOnce, data);
    }
  });

  // Stickers
  socket.on('getAllStickers', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      stickers.getAll(sendOnce, data)
    }
  });

  socket.on('getUserStickers', function (data) {
    data = JSON.parse(data);
    stickers.getUserStickers(sendOnce, data);
  });

  socket.on('getAllGifts', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      stickers.getAllGifts(sendOnce, data);
    }
  });

  socket.on('updateFavoriteStickerPacks', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      stickers.updateFavoriteStickerPacks(sendOnce, data);
    }
  });

  socket.on('getStickersFavorites', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      stickers.getStickersFavorites(sendOnce, data);
    }
  });

  socket.on('updateStickersFavorites', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      stickers.updateStickersFavorites(sendOnce, data);
    }
  });

  socket.on('buyStickerPack', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
      stickers.buyStickerPack(sendOnce, data);
  });

  // POSTS (FEED)
  socket.on('getUserFeed', data => {
    data = JSON.parse(data);
    const userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    Post.getUserFeed(userId, data.limit, data.offset)
      .then(userFeed => sendOnce(null, 'getUserFeed', JSON.stringify(userFeed)))
      .catch(err => sendOnce(null, 'getUserFeed', JSON.stringify(err)))
  });

  socket.on('getUserPosts', data => {
    data = JSON.parse(data);
    const userId = data.hash ? +Helper.getIdByHash(data.hash) : 0;

    Post.getUserPosts(userId, data.profileId, data.limit, data.offset)
      .then(userFeed => sendOnce(null, 'getUserPosts', JSON.stringify(userFeed)))
      .catch(err => sendOnce(null, 'getUserPosts', JSON.stringify(err)))
  });

  socket.on('addPost', data => {
    data = JSON.parse(data);
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    Post.add(data)
      .then(postData => sendOnce(null, 'addPost', JSON.stringify(postData)))
      .catch(err => sendOnce(null, 'addPost', JSON.stringify(err)));
  });

  socket.on('deletePost', data => {
    data = JSON.parse(data);
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    Post.delete(data)
      .then(postData => sendOnce(null, 'deletePost', JSON.stringify(postData)))
      .catch(err => sendOnce(null, 'deletePost', JSON.stringify(err)))
  });

  socket.on('cleanPostAttachments', data => {
    data = JSON.parse(data);
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    Post.cleanAttachments(data)
      .then(result => sendOnce(null, 'cleanPostAttachments', JSON.stringify(result)))
      .catch(err => sendOnce(null, 'cleanPostAttachments', JSON.stringify(err)))
  });

  // posts hashtags
  socket.on('searchHashtags', function (data) {
    data = JSON.parse(data);

    Hashtag.search(data.hashtag)
      .then(postData => sendOnce(null, 'searchHashtags', JSON.stringify(postData)))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return sendOnce(null, "searchHashtags", JSON.stringify({success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'}));
        }
        return sendOnce(null, "searchHashtags", JSON.stringify(err));
      });
  });

  socket.on('searchPostsByHashtag', function (data) {
    data = JSON.parse(data);
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    Post.getByHashtag(data.userId, data.hashtag, data.limit, data.offset)
      .then(postData => sendOnce(null, 'searchPostsByHashtag', JSON.stringify(postData)))
      .catch(err => sendOnce(null, 'searchPostsByHashtag', JSON.stringify(err)));
  });

  // post likes
  socket.on('updatePostLike', data => {
    data = JSON.parse(data);
    const userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    PostLike.update(userId, data.postId)
      .then(result => {
        sendOnce(null, 'updatePostLike', JSON.stringify(result));

        // notify post author that his post was liked
        if (result.action === 'add' && result.postCreatorId) {
          Notifications.addNotifications(sendTo, {
            senderId: userId,
            receiverId: result.postCreatorId,
            type: "PostLike",
            typeId: data.postId
          });
        }
      })
      .catch(err => sendOnce(null, 'postLikes', JSON.stringify(err)));
  });

  socket.on('getPostLikes', data => {
    data = JSON.parse(data);

    PostLike.get(data.postId)
      .then(result => sendOnce(null, 'getPostLikes', JSON.stringify(result)))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return sendOnce(null, "updatePostComplaint", JSON.stringify({success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'}));
        }
        return sendOnce(null, "updatePostComplaint", JSON.stringify(err));
      });
  });

  socket.on('getPostComplaints', data => {
    data = JSON.parse(data);

    PostComplaint.get(data.postId)
      .then(result => sendOnce(null, 'getPostComplaints', JSON.stringify(result)))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return sendOnce(null, "getPostComplaints", JSON.stringify({success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error'}));
        }
        return sendOnce(null, "getPostLikes", JSON.stringify(err));
      });
  });

  // Favorites
  socket.on('addUserFavorite', data => {
    data = JSON.parse(data);
    const userId = data.hash ? Helper.getIdByHash(data.hash) : false;
    if (!userId || +userId === +data.profileId) return;

    Favorites.addOrRemove(userId, data.profileId)
      .then(result => {
        sendOnce(null, 'addUserFavorite', JSON.stringify(result));

        // notify profile he was added to users's favorites
		if (result.action === 'add') {
          Notifications.addNotifications(sendTo, {
            senderId: userId,
            receiverId: result.profileId,
            type: "UserFavorite",
            typeId: result.profileId
          });
		}
      })
      .catch(err => console.log(err));
  });

  //
  // socket.on('deleteRibbonImage', function (data) {
  //   data = JSON.parse(data);
  //   feed.deleteRibbonImage(sendOnce, data);
  // });
  //
  // socket.on('updateUserPostLike', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     feed.updateUserPostLike(sendOnce, data, sendTo);
  //   }
  // });
  //
  // socket.on('getUserPostLike', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     feed.getUserPostLike(sendOnce, data);
  //   }
  // });
  //
  // socket.on('updateUserNewsPostLike', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     feed.updateUserNewsPostLike(sendOnce, data, sendTo);
  //   }
  // });
  //
  // socket.on('getUserNewsPostLike', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     feed.getUserNewsPostLike(sendOnce, data);
  //   }
  // });
  //
  // socket.on('claimRibbonPost', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     feed.claimRibbonPost(sendOnce, data);
  //   }
  // });
  //
  // //Ribbon Share
  // socket.on('shareSocialPost', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     share.shareSocialPost(sendOnce, data);
  //   }
  // });
  //
  // //Settings social
  // socket.on('checkSocialKeys', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     share.checkSocialKeys(sendOnce, data);
  //   }
  // });
  // socket.on('clearSocialKeys', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     share.clearSocialKeys(sendOnce, data);
  //   }
  // });
  // socket.on('checkInstagramLoginData', function (data) {
  //   data = JSON.parse(data);
  //   if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
  //     share.checkInstagramLoginData(sendOnce, data, sendTo);
  //   }
  // });

  // Google API
  socket.on('addPlaceToVisit', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.addPlaceToVisit(sendOnce, data);
    }
  });

  socket.on('removePlaceToVisit', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.removePlaceToVisit(sendOnce, data);
    }
  });

  socket.on('getPlacesToVisit', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.getPlacesToVisit(sendOnce, data);
    }
  });

  // User city
  socket.on('addUserRegion', function (data) {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.addUserRegion(sendOnce, data);
    }
  });

  // Popular places
  socket.on('getPopularPlaces', () => PopularPlaces.getPlaces(sendOnce));

  socket.on('addPopularPlace', data => {
    data = JSON.parse(data);
    PopularPlaces.addPlace(sendOnce, data);
  });

  socket.on('removePopularPlace', data => {
    data = JSON.parse(data);
    PopularPlaces.removePlace(data);
  });
  
  // Locator
  socket.on('updateUserLatLng', function (data) {
	data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      Location.updateUserLatLng(sendOnce, data);
    }
  });
  
  socket.on('getObjectInZone', function (data) {
	data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      Location.getObjectInZone(sendOnce, data);
    }
  });
  
  socket.on('getFollowingInZone', function (data) {
	data = JSON.parse(data);
    Location.getFollowingInZone(sendOnce, data);
  });
  
  socket.on('getAllMapObject', function (data) {
	data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.updateActiveTime(data.userId);
      Location.getAllMapObject(sendOnce, data);
    }
  });

  // Admin
  socket.on('deleteUser', data => {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.deleteUser(sendOnce, data);
    }
  });
  
  socket.on('adminUpdateUserParam', data => {
    data = JSON.parse(data);
    if (data.hash && (data.userId = Helper.getIdByHash(data.hash))) {
      User.adminUpdateUserParam(sendOnce, data);
    }
  });

  socket.on('getAllUsers', data => {
    const reqData = JSON.parse(data);

    if (reqData.hash && (reqData.userId = Helper.getIdByHash(reqData.hash))) {
      User.getUserRole(reqData.userId, userRole => {
        if (userRole == 100) {
          User.getAll(reqData, data => {
            data.userRole = userRole;
            sendOnce(null, "getAllUsers", JSON.stringify(data));
          });
        }
      });
    }
  });
  
  socket.on('getPopularUsers', data => {
    data = JSON.parse(data);
	if (data.hash && (data.userId = Helper.getIdByHash(data.hash)))
		Redis.getPopularUsers(data, function(res){
			sendOnce(null, "getPopularUsers", JSON.stringify(res));
		});
  });
  
  socket.on('getMonetizationStatus', data => {
	  sendOnce(null, "getMonetizationStatus", JSON.stringify({monetizationOff: Cash.monetizationOff}));
  });
};

/** Socket client for desktop site **/
socketClient.on('connect', function () {
  console.log('Connect socket client to https://airybay.com');
});
socketClient.on('disconnect', function () {
  console.log('Disconnect socket client to https://airybay.com');
});

const request = require('request');
const async = require('async');
const fs = require('fs');
const im = require('imagemagick');
const md5 = require('md5');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const db = require('./db');
const Helper = require('./helper');

const ErrorHandler = require('./errorHandler');

const STATUS = require('./status');
const Image = require('./image');
const Cash = require('./cash');

module.exports = {
  // Update user active time
  updateActiveTime: function (userId) {
    db.query("UPDATE `tbl_user` SET `userLastActive` = NOW() WHERE `userId` = ?;", [userId], function (err, rows) {
      if (err)
        console.log("Error in User.updateActiveTime #1\n" + err);
    });
  },

  // Get User info for mainmenu(auth.js)
  getUserAuthInfo: function (send, data) {
    db.query('SELECT \
				t.`userId`, \
				t.`userPhoto`, \
				t.`userEmail`, \
				t.`userNickname`, \
				t.`userBdate`, \
				CONVERT(t.`userBdate`, CHAR) AS userBdate2, \
				t.`userGenderId`, \
				t.`userCash`, \
				t.`userSearchSettings` AS search, \
				t.`userRole`,\
				t.`userSearchShow`,\
				t.`userCity`,\
				t.`subscriptionEndDate`, \
				t.`userRemoved`, \
				t1.`' + global.langParam + '` AS userResidence,\
				t2.`' + global.langParam + '` AS userGender,\
				t3.`' + global.langParam + '` AS userCountry,\
				(SELECT GROUP_CONCAT(CONCAT(t3.`id`, ":", t3.`place`) SEPARATOR ", ") FROM ctbl_user_want_to_visit AS t3 WHERE t3.userId = t.userId  GROUP BY t3.userId) AS userWantToVisit \
      FROM `tbl_user` AS t \
			LEFT JOIN `tbl_param_city` AS t1 ON t1.`paramId` = t.`userResidenceId`\
			LEFT JOIN `tbl_param_gender` AS t2 ON t2.`paramId` = t.`userGenderId`\
			LEFT JOIN `tbl_param_country` AS t3 ON t3.`paramId` = t.`userCountryId`\
			WHERE t.`userId` = ?;', [data.userId, data.userId],
      function (err, rows) {
        if (err)
          console.log("Error in User.getUserAuthInfo #1\n" + err);
        else if (rows.length > 0) {
          var user = Helper.handleUserName(rows[0]);
          user.hash = Helper.getHashById(user.userId);

          // Возраст
          user.age = false;
          if (user.userBdate != "0000-00-00")
            user.age = Helper.getAge(new Date(user.userBdate));

          user.userBdate = user.userBdate2;
          user.userBdate2 = undefined;

          user.success = true;

          send(null, 'getUserAuthInfo', JSON.stringify(user));
        }
        else
          send(null, 'getUserAuthInfo', JSON.stringify({success: false}));
      });
  },

  /** Get user info by ID  (info about another user) **/
  getUserInfoById: function (send, data) {
    db.query('SELECT\
				user.`userId`,\
				user.`userName`,\
				user.`userLastName`,\
				user.`userNickname`,\
				user.`useNickname`,\
				user.`userPhoto`,\
				user.`userLastActive`,\
				user.`userBdate`,\
				user.`isBotOnline`,\
				user.`userCity`,\
				country.`paramEn` AS userCountry\
			FROM `tbl_user` AS user \
			LEFT JOIN `tbl_param_country` AS country ON country.`paramId` = user.`userCountryId`\
			WHERE `userId` = ?;', [data.userId],
      function (err, rows) {
        if (err)
          console.log("Error in User.getUserInfoById #1\n" + err);
        else if(rows.length) {
          // check if user online
          if (rows[0].isBotOnline == 1)
            rows[0].userLastActive = "online";
          else
            rows[0].userLastActive = Helper.getDateTimeSince(rows[0].userLastActive);

          rows[0] = Helper.handleUserName(rows[0]);
          rows[0].age = Helper.getAge(new Date(rows[0].userBdate));

          send(null, 'userInfoById', JSON.stringify(rows[0]));
        }
      });
  },

  /** Get user info by ID  (info about another user) **/
  getUserInfoByIdPromise (userId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT\
				   user.`userId`,\
				   user.`userName`,\
				   user.`userLastName`,\
				   user.`userNickname`,\
				   user.`useNickname`,\
				   user.`userPhoto`,\
				   user.`userBdate`,\
				   user.`userCity`,\
				   country.`paramEn` AS userCountry\
			   FROM `tbl_user` AS user \
			   LEFT JOIN `tbl_param_country` AS country ON country.`paramId` = user.`userCountryId`\
			   WHERE `userId` = ?;',
        [userId],
        (err, rows) => {
          if (err) {
            return rej("Error in User.getUserInfoByIdPromise: \n" + err);
          }
          rows[0] = Helper.handleUserName(rows[0]);
          rows[0].age = Helper.getAge(new Date(rows[0].userBdate));
          res(rows[0]);
        });
    })
  },

  getUserChatInfo: function (send, data) {
    db.query("SELECT `userId`,\
				`userPhoto`, \
				`userNickname`, \
				`userLastActive`, \
				`isBotOnline` \
			FROM `tbl_user` \
			WHERE `userId` = ?;", [data.userId],
      function (err, rows) {
        if (err)
          console.log("Error in User.getUserChatInfo\n" + err);
        else {
          var usr = rows[0];

          // check if user online
          if (usr.isBotOnline == 1)
            usr.userLastActive = "online";
          else
            usr.userLastActive = Helper.getDateTimeSince(usr.userLastActive);

          send({user: usr});
        }
      });
  },

  searchUserByNick: function (send, data) {
    db.query("SELECT\
			t.`userId`,\
			t.`userNickname`,\
			t.`userPhoto`,\
			t.`userActive`,\
			t.`userVerification`,\
			t2.`id` AS 'favorite'\
		FROM `tbl_user` AS t\
		LEFT JOIN `ctbl_userfavorite` AS t2 ON t2.`profileId` = t.`userId` AND t2.userId = " + data.userId + "\
		WHERE\
		`userNickname` LIKE '" + data.nickname + "%' AND\
		`userActive` = 1 AND\
		`userApproved` = 1\
		LIMIT 15;",
	function (err, rows) {
		if (err)
			console.log("Error in User.searchUserByNick #1\n" + err);
		else {
			for (var i = 0; i < rows.length; i++)
				rows[i] = Helper.handleUserName(rows[i]);

			send(null, 'searchUserByNick', JSON.stringify(rows));
		}
	});
  },

  searchFriends: function (send, data) {
    var uId = Helper.getIdByHash(data.hash);
    db.query('SELECT\
				t.`userId`,\
				t.`userName`,\
				t.`userLastName`,\
				t.`userNickname`,\
				t.`useNickname`,\
				t.`userPhoto`,\
				t.`userLastActive`,\
				t.`userVisits`,\
				t1.`profileId` AS favorite\
			FROM `tbl_user` AS t\
			LEFT JOIN `ctbl_userfavorite` AS t1 ON t1.`profileId` = t.`userId` AND t1.`userId` = ?\
			WHERE `userNickname` LIKE \'%' + data.searchValue + '%\' \
			LIMIT 30;\
			SELECT MAX(`userVisits`) AS max FROM `tbl_user`;', [uId],
      function (err, rows) {
        if (err)
          console.log("Error in User.searchFriends \n" + err);
        else {
          if (rows[0].length > 0) {
            for (var i = 0; i < rows[0].length; i++) {
              rows[0][i].userLastActive = Helper.getDateTimeSince(rows[0][i].userLastActive);
              rows[0][i] = Helper.handleUserName(rows[0][i]);
              rows[0][i].stars = Math.floor(rows[0][i].userVisits / rows[1][0].max * 5);
            }

            send(null, 'searchFriendsResult', JSON.stringify(rows[0]));
          } else {
            send(null, 'searchFriendsResult', JSON.stringify({result: false}));
          }

        }
      });
  },

  getUserRole: function (userId, callback) {
    db.query("SELECT `userRole` FROM `tbl_user` WHERE `userId` = ?;",
      [userId], (err, rows) => {
        if (err)
          callback(0);
        else
          callback(rows[0].userRole);
      });
  },

  getUserFullInfo: function (send, req) {
    async.waterfall([
      function (callback) {
        db.query("SELECT \
				tu.`userId`, \
				tu.`userNickname`, \
				tu.`userEmail`, \
				tu.`userLanguage`, \
				tu.`userPhoto`, \
				tu.`userBdate`, \
				tu.`userCash`, \
				tu.`userPayFor`, \
				tu.`userStatus`, \
				t1.`" + global.langParam + "` AS 'userResidence', \
				t2.`" + global.langParam + "` AS 'userGender', \
				t3.`" + global.langParam + "` AS 'userEyes', \
				t4.`" + global.langParam + "` AS 'userHair', \
				t5.`" + global.langParam + "` AS 'userBody', \
				tu.`userWeight`, \
				tu.`userHeight`, \
				t6.`" + global.langParam + "` AS 'userReligion', \
				t7.`" + global.langParam + "` AS 'userEducation', \
				tu.`userOccupation`, \
				t8.`" + global.langParam + "` AS 'userMaritalStatus', \
				tu.`userChildren`, \
				t9.`" + global.langParam + "` AS 'userSmoke', \
				t10.`" + global.langParam + "` AS 'userDrink', \
				(SELECT GROUP_CONCAT(tph.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_hobbie` AS tuh LEFT JOIN `tbl_param_hobbie` AS tph ON tph.`paramId` = tuh.`paramId` WHERE tuh.`userId` = tu.`userId` GROUP BY tuh.`userId`) AS 'userHobbies', \
				(SELECT GROUP_CONCAT(tpc.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_color` AS tuc LEFT JOIN `tbl_param_color` AS tpc ON tpc.`paramId` = tuc.`paramId` WHERE tuc.`userId` = tu.`userId` GROUP BY tuc.`userId`) AS 'userFavoriteColor', \
				(SELECT GROUP_CONCAT(tps.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_sport` AS tus LEFT JOIN `tbl_param_sport` AS tps ON tps.`paramId` = tus.`paramId` WHERE tus.`userId` = tu.`userId` GROUP BY tus.`userId`) AS 'userSport', \
				(SELECT GROUP_CONCAT(tpc2.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_country` AS tuc2 LEFT JOIN `tbl_param_country` AS tpc2 ON tpc2.`paramId` = tuc2.`paramId` WHERE tuc2.`userId` = tu.`userId` GROUP BY tuc2.`userId`) AS 'userBeenAbroad', \
				(SELECT GROUP_CONCAT(tpc3.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_character` AS tuc3 LEFT JOIN `tbl_param_character` AS tpc3 ON tpc3.`paramId` = tuc3.`paramId` WHERE tuc3.`userId` = tu.`userId` GROUP BY tuc3.`userId`) AS 'userCharacter', \
				(SELECT GROUP_CONCAT(tpi.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_interest` AS tui LEFT JOIN `tbl_param_interest` AS tpi ON tpi.`paramId` = tui.`paramId` WHERE tui.`userId` = tu.`userId` GROUP BY tui.`userId`) AS 'userInterest', \
				(SELECT GROUP_CONCAT(CONCAT(tuwv.`id`, ':', tuwv.`place`) SEPARATOR ', ') FROM `ctbl_user_want_to_visit` AS tuwv WHERE tuwv.`userId` = tu.`userId`  GROUP BY tuwv.`userId`) AS 'userWantToVisit', \
				tu.`userAboutMyself`, \
				tu.`userAboutPartner`, \
				tu.`userPublicProfile`, \
				tu.`userWantToDate`, \
				tu.`userRole`, \
				tu.`userActive`, \
				tu.`userConfirm`, \
				tu.`userLastActive`, \
				tu.`userVisits`, \
				tu.`isBotOnline`, \
				tu.`showMyComments`, \
				tu.`userPayFor`, \
				tu.`userCity`, \
				tu.`userLocationLat`, \
				tu.`userLocationLng`, \
				tu.`userShowInMap`, \
				tu.`userVerification`, \
				t_country.`paramEn` AS userCountry \
			FROM `tbl_user` AS tu\
			LEFT JOIN `tbl_param_city` AS t1 ON t1.`paramId` = tu.`userResidenceId`\
			LEFT JOIN `tbl_param_gender` AS t2 ON t2.`paramId` = tu.`userGenderId`\
			LEFT JOIN `tbl_param_eyes` AS t3 ON t3.`paramId` = tu.`userEyesId`\
			LEFT JOIN `tbl_param_hair` AS t4 ON t4.`paramId` = tu.`userHairId`\
			LEFT JOIN `tbl_param_body` AS t5 ON t5.`paramId` = tu.`userBodyId`\
			LEFT JOIN `tbl_param_religion` AS t6 ON t6.`paramId` = tu.`userReligionId`\
			LEFT JOIN `tbl_param_education` AS t7 ON t7.`paramId` = tu.`userEducationId`\
			LEFT JOIN `tbl_param_marital_status` AS t8 ON t8.`paramId` = tu.`userMaritalStatusId`\
			LEFT JOIN `tbl_param_smoke` AS t9 ON t9.`paramId` = tu.`userSmokeId`\
			LEFT JOIN `tbl_param_drink` AS t10 ON t10.`paramId` = tu.`userDrinkId` \
			LEFT JOIN `tbl_param_country` AS t_country ON t_country.paramId = tu.userCountryId\
			WHERE `userId` = ?;", [req.userId],
          function (err, rows) {
            if (rows.length > 0) {
              var res = {"user": rows[0]};

              if (res.user.userBdate != "0000-00-00") {
                var dateObj = new Date(res.user.userBdate);
                res.user.userBdateText = Helper.getStringDate(res.user.userBdate);
                res.user.userBdate = [dateObj.getDate(), (dateObj.getMonth() + 1), dateObj.getFullYear()];
                res.user.age = Helper.getAge(dateObj);
              }
              else {
                res.user.userBdate = [0, 0, 0];
                res.user.userBdateText = "";
              }

              if (res.user.isBotOnline == 1)
                res.user.userLastActive = "online";
              else
                res.user.userLastActive = Helper.getDateTimeSince(res.user.userLastActive);

              if(!res.user.userWantToVisit)
				  res.user.userWantToVisit = "";
			  
			  res.user = Helper.handleUserName(res.user);


              if (req.userId == req.profileId) {
                db.query("SELECT t2.`userId`, t2.`userNickname`, t2.`userPhoto` FROM `ctbl_userfavorite` AS t LEFT JOIN `tbl_user` AS t2 ON t2.`userId` = t.`profileId` WHERE t.`userId` = ?;", [req.userId], function (err, rows3) {
                  res.favorite = [];
                  if (rows3.length > 0)
                    res.favorite = rows3;
                  callback(err, res);
                });
              }
              else if (req.profileId) {
                db.query("SELECT `id` FROM `ctbl_userfavorite` WHERE `userId` = ? AND `profileId` = ?;\
							SELECT `id` FROM `cbl_userblacklist` WHERE `userId` = ? AND `profileId` = ?;\
							SELECT GROUP_CONCAT(`claimId`) AS 'claim' FROM `ctbl_userclaim` WHERE `userId` = ? AND `profileId` = ?;", [req.profileId, req.userId, req.profileId, req.userId, req.profileId, req.userId], function (err, rows2) {
                  res.user.inFavorite = rows2[0].length;
                  res.user.inBlacklist = rows2[1].length;
                  if (rows2[2][0].claim)
                    res.user.claim = rows2[2][0].claim.split(",");
                  else
                    res.user.claim = [];

                  callback(err, res);
                });
              }
              else
                callback(err, res);
            }
            else
              callback("User is not found");
          });
      },
      function (res, callback) {
        db.query("SELECT \
						t.`id`, \
						t.`userImagePath` AS path, \
						t.`userImageWidth` AS width, \
						t.`userImageHeight` AS height, \
						t.`date` AS imageTime, \
						COUNT(t2.`userId`) AS 'like', \
						t3.`id` AS 'mylike', \
						t4.`id` AS 'blacklist', \
						t5.`id` AS 'claim' \
					FROM `tbl_user_image` AS t \
					LEFT JOIN `ctbl_userimagelike` AS t2 ON t2.`imageId` = t.`id` \
					LEFT JOIN `ctbl_userimagelike` AS t3 ON t3.`imageId` = t.`id` AND t3.`userId` = ? \
					LEFT JOIN `ctbl_userimageblacklist` AS t4 ON t4.`imageId` = t.`id` AND t4.`userId` = ? \
					LEFT JOIN `ctbl_userimageclaim` AS t5 ON t5.`imageId` = t.`id` AND t5.`userId` = ? \
					WHERE t.`userId` = ? \
					GROUP BY t.`id`;",
          [req.profileId, req.profileId, req.profileId, req.userId],
          function (err, rows) {
            for (var i = 0; i < rows.length; i++)
              rows[i].imageTime = Helper.getDateTimeSince(rows[i].imageTime);
            res.imagesGeneral = rows;

            callback(err, res);
          });
      },
      function (res, callback) {
        db.query("SELECT * FROM tbl_places_popular;",
          function (err, rows) {
            res.popularPlaces = rows;
            callback(err, res);
          });
      },
      function (res, callback) {
        db.query("SELECT MAX(`userVisits`) AS max FROM `tbl_user`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_country`;",
          [req.profileId],
          function (err, rows) {
            if (err)
              console.log(err);
            else {
              res.user.stars = Math.floor(res.user.userVisits / rows[0][0].max * 5);
              res.country = rows[1];
              callback(err, res);
            }
          });
      },
      function (res, callback) {
        db.query(
          'SELECT COUNT(*) AS fansTotal FROM `ctbl_userfavorite` WHERE profileId = ?; \
           SELECT COUNT(*) AS favoritesTotal FROM `ctbl_userfavorite` WHERE userId = ?;',
          [req.userId, req.userId],
          function (err, rows) {
            if (err){
              console.log(err);
            } else {
              res.user.fansTotal = rows[0][0].fansTotal;
              res.user.favoritesTotal = rows[1][0].favoritesTotal;
            }
            callback(err, res);
          });
      },
      function (res, callback) {
        db.query(
          "SELECT \
             id, \
             userImagePath AS path, \
             userImageWidth AS width, \
             userImageHeight AS height \
           FROM `tbl_user_image` WHERE userId = ? \
           ORDER BY date DESC",
          [req.userId],
          function (err, rows) {
            if (!err) {
              res.user.lastImages = rows;
            }
            callback(err, res);
          });
      },
    ], function (err, res) {
      if (err) {
        console.log(err);
        send(false);
      }
      else
        send(res);
    });
  },

  getUserEditInfo: function (send, req) {
    async.waterfall([
      function (callback) {
        db.query("SELECT \
						tu.`userId`, \
						tu.`userNickname`, \
						tu.`userLastName`, \
						tu.`userName`, \
						tu.`userNickname`, \
						tu.`userEmail`, \
						tu.`userRole`, \
						tu.`userActive`, \
						tu.`userLanguage`, \
						tu.`userPhoto`, \
						tu.`userBdate`, \
						tu.`userPhone`, \
						tu.`useViber`, \
						tu.`useTelegram`, \
						tu.`useWhatsApp`, \
						tu.`userUrlFacebook`, \
						tu.`userUrlInstagram`, \
						tu.`userUrlTwitter`, \
						tu.`userUrlGogglePlus`, \
						tu.`userCash`, \
						tu.`userStatus`, \
						tu.`userResidenceId`, \
						tu.`userGenderId`, \
						tu.`userEyesId`, \
						tu.`userHairId`, \
						tu.`userBodyId`, \
						tu.`userWeight`, \
						tu.`userHeight`, \
						tu.`userReligionId`, \
						tu.`userEducationId`, \
						tu.`userOccupation`, \
						tu.`userMaritalStatusId`, \
						tu.`userChildren`, \
						tu.`userSmokeId`, \
						tu.`userDrinkId`, \
						(SELECT GROUP_CONCAT(tph.`paramId`) FROM `ctbl_user_hobbie` AS tuh LEFT JOIN `tbl_param_hobbie` AS tph ON tph.`paramId` = tuh.`paramId` WHERE tuh.`userId` = tu.`userId` GROUP BY tuh.`userId`) AS 'userHobbiesId', \
						(SELECT GROUP_CONCAT(tpc.`paramId`) FROM `ctbl_user_color` AS tuc LEFT JOIN `tbl_param_color` AS tpc ON tpc.`paramId` = tuc.`paramId` WHERE tuc.`userId` = tu.`userId` GROUP BY tuc.`userId`) AS 'userFavoriteColorId', \
						(SELECT GROUP_CONCAT(tps.`paramId`) FROM `ctbl_user_sport` AS tus LEFT JOIN `tbl_param_sport` AS tps ON tps.`paramId` = tus.`paramId` WHERE tus.`userId` = tu.`userId` GROUP BY tus.`userId`) AS 'userSportId', \
						(SELECT GROUP_CONCAT(tpc2.`paramId`) FROM `ctbl_user_country` AS tuc2 LEFT JOIN `tbl_param_country` AS tpc2 ON tpc2.`paramId` = tuc2.`paramId` WHERE tuc2.`userId` = tu.`userId` GROUP BY tuc2.`userId`) AS 'userBeenAbroadId', \
						(SELECT GROUP_CONCAT(tpc3.`paramId`) FROM `ctbl_user_character` AS tuc3 LEFT JOIN `tbl_param_character` AS tpc3 ON tpc3.`paramId` = tuc3.`paramId` WHERE tuc3.`userId` = tu.`userId` GROUP BY tuc3.`userId`) AS 'userCharacterId', \
						(SELECT GROUP_CONCAT(tpi.`paramId`) FROM `ctbl_user_interest` AS tui LEFT JOIN `tbl_param_interest` AS tpi ON tpi.`paramId` = tui.`paramId` WHERE tui.`userId` = tu.`userId` GROUP BY tui.`userId`) AS 'userInterestId', \
						(SELECT GROUP_CONCAT(tuwv.`place` SEPARATOR ', ') FROM `ctbl_user_want_to_visit` AS tuwv WHERE tuwv.`userId` = tu.`userId`  GROUP BY tuwv.`userId`) AS 'userWantToVisit', \
						tu.`userAboutMyself`, \
						tu.`userAboutPartner`, \
						tu.`userPublicProfile`, \
						tu.`userWantToDate`, \
						tu.`userRole`, \
						tu.`userActive`, \
						tu.`userConfirm`, \
						tu.`userLastActive`, \
						tu.`userVisits`, \
						tu.`isBotOnline`, \
						tu.`showMyComments`, \
						tu.`userPayFor`, \
						tu.`userCity`, \
						t_country.`paramEn` AS userCountry \
					FROM `tbl_user` AS tu\
					LEFT JOIN tbl_param_country AS t_country\
					 ON t_country.paramId = tu.userCountryId\
					WHERE `userId` = ?;", [req.userId],
          function (err, rows) {
            if (rows.length > 0) {
              var res = {"user": rows[0]};

              if (res.user.userBdate != "0000-00-00") {
                var dateObj = new Date(res.user.userBdate);
                res.user.userBdateText = Helper.getStringDate(res.user.userBdate);
                res.user.userBdate = [dateObj.getDate(), (dateObj.getMonth() + 1), dateObj.getFullYear()];
                res.user.age = Helper.getAge(dateObj);
              }
              else {
                res.user.userBdate = [0, 0, 0];
                res.user.userBdateText = "";
              }

              if (res.user.userCharacterId)
                res.user.userCharacterId = res.user.userCharacterId.split(",");
              else
                res.user.userCharacterId = [];

              if (res.user.userHobbiesId)
                res.user.userHobbiesId = res.user.userHobbiesId.split(",");
              else
                res.user.userHobbiesId = [];

              if (res.user.userInterestId)
                res.user.userInterestId = res.user.userInterestId.split(",");
              else
                res.user.userInterestId = [];

              if (res.user.userFavoriteColorId)
                res.user.userFavoriteColorId = res.user.userFavoriteColorId.split(",");
              else
                res.user.userFavoriteColorId = [];

              if (res.user.userSportId)
                res.user.userSportId = res.user.userSportId.split(",");
              else
                res.user.userSportId = [];

              if (res.user.userBeenAbroadId)
                res.user.userBeenAbroadId = res.user.userBeenAbroadId.split(",");
              else
                res.user.userBeenAbroadId = [];

              callback(err, res);
            }
            else
              callback("User is not found");
          });
      },
      function (res, callback) {
        db.query("SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_body`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_character`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_color`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_country`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_education`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_eyes`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_gender`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_hair`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_hobbie`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_interest`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_marital_status`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_religion`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_sport`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_city`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_drink`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_smoke`;",
          function (err, rows) {
            if (err)
              console.log(err);
            else {
              res.body = rows[0];
              res.character = rows[1];
              res.color = rows[2];
              res.country = rows[3];
              res.education = rows[4];
              res.eyes = rows[5];
              res.gender = rows[6];
              res.hair = rows[7];
              res.hobbie = rows[8];
              res.interest = rows[9];
              res.marital_status = rows[10];
              res.religion = rows[11];
              res.sport = rows[12];
              res.city = rows[13];
              res.drink = rows[14];
              res.smoke = rows[15];

              callback(err, res);
            }
          });
      },
      function (res, callback) {
        db.query("SELECT \
						t.`id`, \
						t.`userImagePath` AS path, \
						t.`userImageWidth` AS width, \
						t.`userImageHeight` AS height, \
						t.`date` AS imageTime \
					FROM `tbl_user_image` AS t \
					WHERE t.`userId` = ? \
					GROUP BY t.`id`;", [req.userId],
          function (err, rows) {
            const imgPathFull = res.user.userPhoto.replace('_thumb', '');
            for (var i = 0; i < rows.length; i++) {
              rows[i].imageTime = Helper.getDateTimeSince(rows[i].imageTime);

              if (rows[i].path === imgPathFull) {
                rows[i].main = true;
              }
            }
            res.imagesGeneral = rows;

            callback(err, res);
          });
      },
    ], function (err, res) {
      if (err) {
        console.log(err);
        send(false);
      }
      else
        send(res);
    });
  },

  getUserSettings: function (send, req) {
    async.waterfall([
      function (callback) {
        db.query("SELECT \
						tu.`userId`, \
						tu.`userLanguage`, \
						tu.`userPhoto`, \
						tu.`userBdate`, \
						tu.`userResidenceId`, \
						tu.`userGenderId`, \
						tu.`userPublicProfile`, \
						tu.`userWantToDate`, \
						tu.`showMyComments` \
					FROM `tbl_user` AS tu\
					WHERE `userId` = ?;", [req.userId],
          function (err, rows) {
            if (rows.length > 0) {
              var res = {"user": rows[0]};

              if (res.user.userBdate != "0000-00-00") {
                var dateObj = new Date(res.user.userBdate);
                res.user.userBdateText = Helper.getStringDate(res.user.userBdate);
                res.user.userBdate = [dateObj.getDate(), (dateObj.getMonth() + 1), dateObj.getFullYear()];
                res.user.age = Helper.getAge(dateObj);
              }
              else {
                res.user.userBdate = [0, 0, 0];
                res.user.userBdateText = "";
              }

              callback(err, res);
            }
            else
              callback("User is not found");
          });
      },
      function (res, callback) {
        db.query("SELECT t.`id`, t.`userImagePath` AS path FROM `tbl_user_image` AS t WHERE t.`userId` = ?;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_city`;\
					SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_gender`;", [req.userId],
          function (err, rows) {
            if (err)
              console.log(err);
            else {
              res.imagesGeneral = rows[0];
              res.city = rows[1];
              res.gender = rows[2];
            }
            callback(err, res);
          });
      }
    ], function (err, res) {
      if (err) {
        console.log(err);
        send(false);
      }
      else
        send(res);
    });
  },
  
  getSettingsData: function (send, data) {
    db.query("SELECT \
      (SELECT GROUP_CONCAT(CONCAT(tuwv.`id`, ':', tuwv.`place`) SEPARATOR ', ') FROM `ctbl_user_want_to_visit` AS tuwv WHERE tuwv.`userId` = tu.`userId`  GROUP BY tuwv.`userId`) AS 'userWantToVisit', \
      tu.`userEmail`, \
	  tu.`userPayFor`, \
      tu.`userSearchSettings`, \
      tu.`subscribeMessages`, \
      tu.`subscribeUserFavorite`, \
      tu.`subscribePostLike`, \
      tu.`subscribePushPrivateChatMessages`, \
      tu.`subscribePushPostLike`, \
      tu.`subscribePushUserFavorite`, \
      tu.`subscribeEmailPrivateChatMessages`, \
      tu.`subscribeEmailEventChatMessages`, \
      tu.`subscribeEmailEvent`, \
      tu.`subscribeEmailPostLike`, \
      tu.`subscribeEmailUserFavorite`, \
      tu.`subscriptionEndDate`, \
      tu.`userCity`, \
	  tu.`userVerification`, \
	  tu.`userShowInMap`, \
      t_country.`paramEn` AS userCountry \
    FROM `tbl_user` AS tu \
    LEFT JOIN `tbl_param_country` AS t_country ON t_country.paramId = tu.userCountryId \
    WHERE `userId` = ?;\
    SELECT * FROM tbl_places_popular;",
      [data.userId],
      (err, rows) => {
        if (err)
          console.log("Error in User.getSettingsData #1\n" + err);
        else {
          const userInfo = rows[0];
          const popularPlaces = rows[1];
          const res = {settings: {}};

          // first query check
          if (userInfo.length) {
            res.settings = (userInfo[0].userSearchSettings) ? JSON.parse(userInfo[0].userSearchSettings) : {
              gender: [],
              ageFrom: 0,
              ageTo: 50,
              place: []
            };
            res.settings.userEmail = userInfo[0].userEmail;
            res.settings.payFor = userInfo[0].userPayFor;
            res.settings.subscribeMessages = userInfo[0].subscribeMessages;
            res.settings.subscribeUserFavorite = userInfo[0].subscribeUserFavorite;
            res.settings.subscribePostLike = userInfo[0].subscribePostLike;

            res.settings.subscribePushPrivateChatMessages = userInfo[0].subscribePushPrivateChatMessages;
            res.settings.subscribePushPostLike = userInfo[0].subscribePushPostLike;
            res.settings.subscribePushUserFavorite = userInfo[0].subscribePushUserFavorite;

            res.settings.subscribeEmailPrivateChatMessages = userInfo[0].subscribeEmailPrivateChatMessages;
            res.settings.subscribeEmailEventChatMessages = userInfo[0].subscribeEmailEventChatMessages;
            res.settings.subscribeEmailEvent = userInfo[0].subscribeEmailEvent;
            res.settings.subscribeEmailPostLike = userInfo[0].subscribeEmailPostLike;
            res.settings.subscribeEmailUserFavorite = userInfo[0].subscribeEmailUserFavorite;
			res.settings.userVerification = userInfo[0].userVerification;

            res.settings.subscriptionActive = Cash.monetizationOff ? true : Helper.checkSubscriptionActive(userInfo[0].subscriptionEndDate);
            
              res.settings.userWantToVisit = userInfo[0].userWantToVisit;

            res.settings.monetizationOff = Cash.monetizationOff;
			
			res.settings.userShowInMap = userInfo[0].userShowInMap;
          }

          // second query check
          if (popularPlaces.length) {
            res.popularPlaces = popularPlaces;
          }

          send(res);
        }
      });
  },
  
  updateUserPassword: function (send, data) {
    db.query("SELECT `userPass` FROM `tbl_user` WHERE `userId` = ?;", [data.userId], function (err, rows) {
      if (err)
        console.log("Error in User.updateUserPassword #1\n" + err);
      else {
        var result = {error: false};

        if (data.newPass.length < 4)
          result = {field: "new_password", error: "The password must be at least 4 characters long."};
        else if (md5(data.oldPass) != rows[0].userPass)
          result = {field: "old_password", error: "The old password is incorrect."};
        else {
          db.query("UPDATE `tbl_user` SET `userPass` = ? WHERE `userId` = ?; ", [md5(data.newPass), data.userId], function (err, rows) {
            if (err)
              console.log("Error in User.updateUserPassword #1\n" + err);
            else {
              send(null, "updateUserPassword", JSON.stringify(result));
            }
          });
        }

        if (result.error)
          send(null, "updateUserPassword", JSON.stringify(result));
      }
    });
  },
  
  deleteMyself: function (send, data) {
    db.query("SELECT `userEmail`, `userNickname`, `userActive`, `userConfirm` FROM `tbl_user` WHERE `userId` = ?;", [data.userId],
      function (err, rows) {
        if (err)
          send(null, "deleteUser", JSON.stringify({success: false}));
        else {
          if (rows.length == 0) {
            send(null, "deleteUser", JSON.stringify({success: false, comment: "Пшел нахУй!!!"}));
            return null;
          }

          rows[0]['userEmail'] = "deleted_" + rows[0]['userEmail'].replace("deleted_", "");
		  rows[0]['userNickname'] = "deleted_" + rows[0]['userNickname'].replace("deleted_", "");
		  var sql = "UPDATE `tbl_user` SET `userEmail` = '" + rows[0]['userEmail'] + "', `userNickname` = '" + rows[0]['userNickname'] + "', `userActive` = 0, `userRemoved` = 1 WHERE `tbl_user`.`userId` = {id};\
DELETE FROM `cbl_stickerpack_favorite` WHERE `userId` = {id};\
DELETE FROM `cbl_sticker_favorite` WHERE `userId` = {id};\
DELETE FROM `cbl_userblacklist` WHERE `userId` = {id};\
DELETE FROM `cbl_userblock` WHERE `userId` = {id};\
DELETE FROM `ctbl_userclaim` WHERE `userId` = {id} OR `profileId` = {id};\
DELETE FROM `ctbl_userfavorite` WHERE `userId` = {id} OR `profileId` = {id};\
DELETE FROM `ctbl_userimageblacklist` WHERE `userId` = {id};\
DELETE FROM `ctbl_userimageclaim` WHERE `userId` = {id};\
DELETE FROM `ctbl_userimagelike` WHERE `userId` = {id} OR `profileId` = {id};\
DELETE FROM `ctbl_uservisits` WHERE `userId` = {id} OR `profileId` = {id};\
DELETE FROM `ctbl_user_character` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_color` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_country` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_hobbie` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_interest` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_social_contacts` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_sport` WHERE `userId` = {id};\
DELETE FROM `ctbl_user_want_to_visit` WHERE `userId` = {id};\
DELETE FROM `tbl_chat_attachment` WHERE messageId IN (SELECT messageId FROM `tbl_chat` WHERE `senderId` = {id});\
DELETE FROM `tbl_chat` WHERE `senderId` = {id};\
DELETE tbl_conversation FROM tbl_conversation\
LEFT JOIN tbl_conversation_participants ON tbl_conversation.id = tbl_conversation_participants.conversationId\
WHERE tbl_conversation.type = 1 AND tbl_conversation_participants.userId = {id};\
DELETE FROM `tbl_conversation_participants` WHERE `userId` = {id};\
DELETE FROM `tbl_notifications` WHERE `senderId` = {id} OR `receiverId` = {id};\
DELETE FROM `tbl_user_image` WHERE `userId` = {id};\
DELETE FROM `tbl_user_post` WHERE `userId` = {id};\
DELETE FROM `tbl_user_post_like` WHERE `userId` = {id};\
DELETE FROM `tbl_user_post_message` WHERE `userId` = {id};".replace(/\{id\}/g, data.userId);

          db.query(sql, function (err, rows) {
            if (err)
              send(null, "deleteUser", JSON.stringify({success: false}));
            else
              send(null, "userLogout");
          });
          // send(null, "userLogout");
        }
      });
  },

  // User edit
  uploadImage: function (send, data) {
    var _self = this;

    var time = (new Date()).getTime();
    var filename = data.image.name.split(".");
    var imagename = data.userId + "_" + time + "." + filename[1];

    var imgPath = "./public/uploads/cabinet/" + imagename;

    fs.writeFile(imgPath, data.image.data, function (err) {
      if (err)
        console.log("Error in User.uploadImage #1\n" + err);
      else {
        im.identify(imgPath, function (err, features) {
          if (err)
            console.log("Error in User.uploadImage #2\n" + err);
          else if (features.width > 800 || features.height > 800) {
            // обрезаем изображение
            if (features.width > features.height) {
              var opt = {
                srcPath: imgPath,
                dstPath: imgPath,
                width: 800
              }
            }
            else {
              var opt = {
                srcPath: imgPath,
                dstPath: imgPath,
                height: 800
              }
            }
            im.resize(opt, function (err, stdout, stderr) {
              if (err)
                console.log("Error in User.uploadImage #3\n" + err);
              else {
                im.identify(imgPath, function (err, features) {
                  if (err)
                    console.log("Error in User.uploadImage #4\n" + err);
                  else
                    _self.saveImage(send, {
                      userId: data.userId,
                      name: imagename,
                      width: features.width,
                      height: features.height
                    });
                });
              }
            });
          }
          else
            _self.saveImage(send, {
              userId: data.userId,
              name: imagename,
              width: features.width,
              height: features.height
            });
        });
      }
    });
  },

  saveImage: function (send, data) {
    // add ribbon post first
    db.query("INSERT INTO tbl_user_post (userId) VALUES (?)", [data.userId], (err, res) => {
      if (err) {
        return console.log("Error in User.saveImage - add ribbon post\n" + err);
      }
      const postId = res.insertId;

      // then save image
      const imgPath = "/uploads/cabinet/" + data.name;
      db.query(
        "INSERT INTO `tbl_user_image` \
           (`postId`, `userId`, `userImagePath`, `userImageWidth`, `userImageHeight`) \
           VALUES (?, ?, ?, ?, ?)",
        [postId, data.userId, imgPath, data.width, data.height],
        (err, res2) => {
          if (err)
            console.log("Error in User.saveImage - insert photo\n" + err);
          else
            send(false, {imageId: res2.insertId, image: imgPath, width: data.width, height: data.height, postId});
        });
    });
  },

  getUserImage: function (send, data) {
    db.query("SELECT \
				 t.`userImagePath` AS imagePath,\
				 t.`id` AS imageId,\
				 t.`userImageWidth`,\
				 t.`userImageHeight`,\
				 t.`date` AS imageTime,\
				 tu.`userId`,\
				 tu.`userNickname` AS userName,\
				 tu.`userLastName`,\
			 COUNT(t2.`userId`) AS 'like'\
			 FROM `tbl_user_image` AS t\
			 LEFT JOIN `ctbl_userimagelike` AS t2 ON t2.`imageId` = t.`id` \
			 LEFT JOIN `tbl_user` AS tu ON t.`userId` = tu.`userId`\
			 WHERE t.`id` = ?;", [data.imageId],
      function (err, rows) {
        if (err)
          console.log("Error in User.getUserImage #1\n" + err);
        else if (rows.length) {
          if (rows[0].imageTime != "0000-00-00 00:00:00")
            rows[0].imageTime = Helper.getStringDateTime(rows[0].imageTime);
          else
            rows[0].imageTime = "Дуже давно";

          send({row: rows[0]});
        } else
          send(false);
      });
  },

  deleteUserImage: function (send, data) {
    db.query("SELECT `id`, `userImagePath` FROM `tbl_user_image` WHERE `userId` = ? AND `id` = ?;\
		SELECT `userPhoto` FROM `tbl_user` WHERE `userId` = ?", [data.userId, data.imageId, data.userId],
	function (err, rows) {
		if (!err && rows && rows[0].length && rows[1].length) {
			db.query("DELETE FROM `tbl_user_image` WHERE `id` = ?;", [rows[0][0].id], function (err, res) {
				if (!err && rows[1][0].userPhoto.replace("_thumb", "") != rows[0][0].userImagePath)
					fs.unlink('./public' + rows[0][0].userImagePath);
			});
		}
	});
	  
	send(null, 'deleteUserImage', JSON.stringify({success: true, imageId: data.imageId}));
  },

  fastCropUserImage: function (send, data) {
    var srcPath = './public' + data.imgUrl;

    im.identify(srcPath, function (err, features) {
      if (err)
        console.log("Error in User.fastCropUserImage #1\n" + err);
      else {
        var pathinfo = path.parse(data.imgUrl);
        var dstPath = './public/uploads/cabinet/' + pathinfo.name + '_thumb' + pathinfo.ext;
        var imgPath = '/uploads/cabinet/' + pathinfo.name + '_thumb' + pathinfo.ext;

        if (features.width > features.height) {
          data.x = Math.floor((features.width - features.height) / 2);
          data.y = 0;
          features.width = features.height;
        }
        else {
          data.x = Math.floor((features.height - features.width) / 2);
          data.y = 0;
          features.height = features.width;
        }

        im.convert([srcPath, '-crop', features.width + "x" + features.height + "+" + data.x + "+" + data.y, dstPath], function (err, stdout) {
          if (err)
            console.log("Error in User.fastCropUserImage#2\n" + err);
          else {
            if (features.width > 300) {
              im.convert([dstPath, '-resize', '300x300', dstPath], function (err, stdout) {
                if (err)
                  console.log("Error in User.fastCropUserImage#3\n" + err);
              });
            }

            db.query("UPDATE `tbl_user` SET `userPhoto` = ? WHERE `userId` = ?;", [imgPath, data.userId], function (err, rows) {
              if (err)
                console.log("Error in User.fastCropUserImage#4\n" + err);
              else
                send(null, 'fastCropUserImage', JSON.stringify({"image": imgPath}));
            });
          }
        });
      }
    });
  },

  cropUserImage: function (res, data) {
    var srcPath = './public' + data.imgUrl;

    var pathinfo = path.parse(data.imgUrl);
    var dstPath = './public/uploads/cabinet/' + pathinfo.name + '_thumb' + pathinfo.ext;
    var imgPath = '/uploads/cabinet/' + pathinfo.name + '_thumb' + pathinfo.ext;

    data.imgW = Math.floor(data.imgW);
    data.imgH = Math.floor(data.imgH);

    im.convert([srcPath, '-resize', data.imgW + 'x' + data.imgH, dstPath], function (err, stdout) {
      if (err)
        console.log("Error in User.cropUserImage #1\n" + err);
      else {
        im.convert([dstPath, '-crop', data.cropW + "x" + data.cropH + "+" + data.imgX1 + "+" + data.imgY1, dstPath], function (err, stdout) {
          if (err)
            console.log("Error in User.cropUserImage #2\n" + err);
          else {
            if (data.width > 300 || data.height > 300) {
              im.convert([dstPath, '-resize', '300x300', dstPath], function (err, stdout) {
                if (err)
                  console.log("Error in User.cropUserImage #3\n" + err);
              });
            }

            db.query("UPDATE `tbl_user` SET `userPhoto` = ? WHERE `userId` = ?;",
              [imgPath, data.userId],
              function (err, rows) {
                if (err)
                  console.log("Error in User.cropUserImage #4\n" + err);
                else
                  res.send(JSON.stringify({status: 'success', url: imgPath}));
              });
          }
        });
      }
    });
  },

  cropUserImage2: function (send, data) {
    var srcPath = './public' + data.imgUrl;

    var pathinfo = path.parse(data.imgUrl);
    var dstPath = './public/uploads/cabinet/' + pathinfo.name + '_thumb' + pathinfo.ext;
    var imgPath = '/uploads/cabinet/' + pathinfo.name + '_thumb' + pathinfo.ext;

    im.convert([srcPath, '-crop', data.width + "x" + data.height + "+" + data.x + "+" + data.y, dstPath], function (err, stdout) {
      if (err)
        console.log("Error in User.cropUserImage2 #1\n" + err);
      else {
        if (data.width > 300 || data.height > 300) {
          im.convert([dstPath, '-resize', '300x300', dstPath], function (err, stdout) {
            if (err)
              console.log("Error in Photo.cropUserImage2 #2\n" + err);
          });
        }

        db.query("UPDATE `tbl_user` SET `userPhoto` = ? WHERE `userId` = ?;",
          [imgPath, data.userId],
          function (err, rows) {
            if (err)
              console.log("Error in Photo.cropUserImage2 #3\n" + err);
            else
              send(null, 'cropUserImage', JSON.stringify({"image": imgPath}));
          });
      }
    });
  },

  updateUserParam: function (send, data) {
    var sql, sql2;

    // определяем запрос на обновление
    if (typeof(data.value) == "object") {
      var table;

      if (data.key == "userHobbiesId")
        table = "ctbl_user_hobbie";
      else if (data.key == "userFavoriteColorId")
        table = "ctbl_user_color";
      else if (data.key == "userSportId")
        table = "ctbl_user_sport";
      else if (data.key == "userBeenAbroadId")
        table = "ctbl_user_country";
      else if (data.key == "userInterestId")
        table = "ctbl_user_interest";
      else if (data.key == "userCharacterId")
        table = "ctbl_user_character";

      sql = "DELETE FROM `" + table + "` WHERE `userId` = " + data.userId + ";\n";
      if (data.value)
        for (var i = 0; i < data.value.length; i++)
          sql += "INSERT INTO `" + table + "` (`userId`, `paramId`) VALUES (" + data.userId + ", " + db.escape(data.value[i]) + ");\n"
    }
    else {
      if (data.key == "userPass") {
        if (data.value)
          data.value = md5(data.value);
        else
          return false;
      }
	  else if(data.key == "userSearchSettings") {
		  data.value = JSON.parse(data.value);
		  data.value.place = [];
		  data.value = JSON.stringify(data.value);
	  }

      sql = "UPDATE `tbl_user` SET " + db.escapeId(data.key) + " = " + db.escape(data.value) + " WHERE `userId` = " + data.userId + ";"

      if (data.key == "userNickname") {
        sql2 = sql;
        sql = "SELECT `userId` FROM `tbl_user` WHERE `userId` != " + data.userId + " AND `userNickname` LIKE " + db.escape(data.value);
      }
      if (data.key == "userEmail") {
        var myRe = /^[-0-9A-z_\.]{1,20}@[-0-9A-z_^\.]{1,20}\.[A-z]{2,4}$/i;
        if (!myRe.test(data.value)) {
          send(null, "updateUserParam", JSON.stringify({success: false, error: "Wrong E-mail format."}));
          return false;
        }
        else {
          sql2 = sql;
          sql = "SELECT `userId` FROM `tbl_user` WHERE `userId` != " + data.userId + " AND `userEmail` LIKE " + db.escape(data.value);
        }
      }
    }

    db.query(sql, function (err, rows) {
      if (err) {
        console.log("Error in User.updateUserParam #1\n" + err);
        send(null, "updateUserParam", JSON.stringify({success: false}));
      }
      else {
        if (data.key == "userNickname") {
          if (rows.length > 0)
            send(null, "updateUserParam", JSON.stringify({success: false, error: "This nickname already used!"}));
          else {
            db.query(sql2, function (err, res) {
              if (err) {
                console.log("Error in User.updateUserParam #2\n" + err);
                send(null, "updateUserParam", JSON.stringify({success: false}));
              }
              else
                send(null, "updateUserParam", JSON.stringify({success: true}));
            });
          }
        }
        else if (data.key == "userEmail") {
          if (rows.length && data.value != "")
            send(null, "updateUserParam", JSON.stringify({success: false, error: "This email already used!"}));
          else {
            db.query(sql2, function (err, res) {
              if (err) {
                console.log("Error in User.updateUserParam #3\n" + err);
                send(null, "updateUserParam", JSON.stringify({success: false}));
              }
              else
                send(null, "updateUserParam", JSON.stringify({success: true}));
            });
          }
        }
        else
          send(null, "updateUserParam", JSON.stringify({success: true}));
      }
    });
  },

  updateRequiredData: function (send, data) {
    var result = {"error": false, "success": false};

    if (data.step == 1) {
      data.day = parseInt(data.day);
      data.mounth = parseInt(data.mounth);
      data.year = parseInt(data.year);

      var myRe = /^[-0-9A-z_\.]{1,20}@[-0-9A-z_^\.]{1,20}\.[A-z]{2,4}$/i;
      if (!myRe.test(data.email))
        result.error = {"field": "userEmail", "text": "Wrong E-mail format."};
      else if (data.pass && data.pass.length < 4)
        result.error = {"field": "userPass", "text": "The password must be at least 4 characters long.."};
      else if (data.pass && data.pass != data.passRepeat)
        result.error = {"field": "userPassRepeat", "text": "Passwords must match."};
      else if (!data.gender)
        result.error = {"field": "userGenderId", "text": "Choose your sex: Male \\ Female"};
      else if (data.day < 1 || data.day > 31 || data.mounth < 1 || data.mounth > 12 || data.year < 1918 || data.year > 2018)
        result.error = {"field": "userBdate", "text": "Enter your birth date: DD\\MM\\YEAR"};

      if (result.error == false) {
        db.query("SELECT `userId` FROM `tbl_user` WHERE `userEmail` = ? AND `userId` != ?;", [data.email, data.userId], function (err, rows) {
          if (err)
            console.log("Error in User.updateRequiredData #1\n" + err);
          else if (rows.length > 0) {
            result.error = {"field": "userEmail", "text": "This E-mail is already registered."};
            send(null, 'updateRequiredData', JSON.stringify(result));
          }
          else {
            var bDate = data.year + "-" + data.mounth + "-" + data.day;

            var sql = "";
            var arr = [];
            if (data.pass) {
              sql = "UPDATE `tbl_user` SET `userEmail` = ? WHERE `userId` = ?;\
							UPDATE `tbl_user` SET `userPass` = ? WHERE `userId` = ?;\
							UPDATE `tbl_user` SET `userGenderId` = ? WHERE `userId` = ?;\
							UPDATE `tbl_user` SET `userBdate` = ? WHERE `userId` = ?;";

              arr = [data.email, data.userId, md5(data.pass), data.userId, data.gender, data.userId, bDate, data.userId];
            }
            else {
              sql = "UPDATE `tbl_user` SET `userEmail` = ? WHERE `userId` = ?;\
							UPDATE `tbl_user` SET `userGenderId` = ? WHERE `userId` = ?;\
							UPDATE `tbl_user` SET `userBdate` = ? WHERE `userId` = ?;"

              arr = [data.email, data.userId, data.gender, data.userId, bDate, data.userId];
            }

            db.query(sql, arr, function (err, res) {
              if (err)
                console.log("Error in User.updateRequiredData #2\n" + err);
              else {
                result.success = true;
                send(null, "updateRequiredData", JSON.stringify(result));
              }
            });
          }
        });
      } else
        send(null, 'updateRequiredData', JSON.stringify(result));
    }
    else if (data.step == 2) {
      var myRe = /^[-0-9A-z_\.]+$/i;
      if (!myRe.test(data.nickname))
        result.error = {
          "field": "userNickname",
          "text": "Nick must be unique without spaces and may consist of latin letters, numbers, and characters as: dot, dash, underscore. For example: User_234"
        };

      if (result.error == false) {
        db.query("SELECT `userId` FROM `tbl_user` WHERE `userNickname` = ? AND `userId` != ?;\
		SELECT `userPhoto` FROM `tbl_user` WHERE `userId` = ?;", [data.nickname, data.userId, data.userId], function (err, rows) {
          if (err)
            console.log("Error in User.updateRequiredData #3\n" + err);
          else {
            if (rows[0].length > 0) {
              send(null, "updateRequiredData", JSON.stringify({
                success: false,
                error: {"field": "userNickname", "text": "This nickname already used!"}
              }));
            }
            else if (rows[1][0].userPhoto == "") {
              send(null, "updateRequiredData", JSON.stringify({
                success: false,
                error: {"field": "userPhoto", "text": "Please provide your photo"}
              }));
            }
            else {
              db.query("UPDATE `tbl_user` SET `userNickname` = ? WHERE `userId` = ?;", [data.nickname, data.userId], function (err, res) {
                if (err)
                  console.log("Error in User.updateRequiredData #4\n" + err);
                else {
                  result.success = true;
                  send(null, "updateRequiredData", JSON.stringify(result));
                }
              });
            }
          }
        });
      }
      else
        send(null, 'updateRequiredData', JSON.stringify(result));
    }
    else if (data.step === 3) {
      db.query(
        "SELECT `userCity` \
        FROM `tbl_user` \
        WHERE `userId` = ?;\
        SELECT * FROM `ctbl_user_want_to_visit` WHERE `userId` = ?", [data.userId, data.userId],
        (err, rows) => {
          if (err)
            console.log("Error in User.updateRequiredData #5\n" + err);
          else {
            if (rows[1].length === 0) {
              result.error = {
                "field": "place-visit",
                "text": "Please select place you want to visit"
              };
            }
            else if (!(rows[0][0].userCity)) {
              result.error = {
                "field": "i-live-in",
                "text": "Please add city in which you live"
              };
            }
            else
              result.success = true;

            send(null, 'updateRequiredData', JSON.stringify(result));
          }
        });
    }
    else if (data.step === 4) {
      data.searchSettings.ageFrom = parseInt(data.searchSettings.ageFrom);
      data.searchSettings.ageTo = parseInt(data.searchSettings.ageTo);

      if (!data.searchSettings.gender.length)
        result.error = {"field": "searchGender", "text": "Whom do you want to find: female / male"};
      else if (!data.searchSettings.ageTo || !data.searchSettings.ageFrom)
        result.error = {"field": "searchAge", "text": "Choose age of your partner search"};
      else {
        if(!data.searchSettings.place)
			data.searchSettings.place = [];
        /* if(data.searchSettings.ageFrom < 18)
			console.log("updateRequiredData searchSettings = " . JSON.stringify(data.searchSettings)); */
		db.query("UPDATE `tbl_user` SET `userSearchSettings` = ?, `userActive` = 1 WHERE `userId` = ?;", [JSON.stringify(data.searchSettings), data.userId], function (err, res) {
          if (err)
            console.log("Error in User.updateRequiredData #6\n" + err);
          else {
            result.success = true;
            result.search = data.searchSettings;
            send(null, "updateRequiredData", JSON.stringify(result));
          }
        });
      }
    }
  },
  
  updateVerificationData: function (send, data) {
	var result = {"error": [], "success": false};
	
	var myRe = /^\+[0-9]{2}\s[0-9]{10}$/i;
	var myRe2 = /^[0-9]*$/i;
	if (data.userAddress.length < 2)
		result.error.push({"field": "userAddress", "text": "Address is required."});
	if (data.userCity.length < 2)
		result.error.push({"field": "userCity", "text": "City is required."});
	if (data.userCountry.length < 2)
		result.error.push({"field": "userCountry", "text": "Country is required."});
	if (!myRe.test(data.userPhone))
		result.error.push({"field": "userPhone", "text": "Wrong Phone format."});
	if (data.userPostalCode.length < 2)
		result.error.push({"field": "userPostalCode", "text": "Postal code is required."});
	else if (!myRe2.test(data.userPostalCode))
		result.error.push({"field": "userPostalCode", "text": "Postal code must be a number."});
	if (!myRe2.test(data.userSSN))
		result.error.push({"field": "userSSN", "text": "SSN must be a number."});
	if (data.userVerificationPhoto1.length < 2)
		result.error.push({"field": "userVerificationPhoto1", "text": "Upload Photo passport."});
	if (data.userVerificationPhoto2 == undefined || data.userVerificationPhoto2.length < 2)
		result.error.push({"field": "userVerificationPhoto2", "text": "Upload Copy passport."});
	if (!data.bDay || !data.bMounth || !data.bYear)
		result.error.push({"field": "bDate", "text": "Set birth date."});
	else if (data.bDay < 1 || data.bDay > 31)
		result.error.push({"field": "bDate", "text": "Set correctly date of birth."});
	else if (data.bMounth < 1 || data.bMounth > 12)
		result.error.push({"field": "bDate", "text": "Set correctly month of birth."});
	else if (data.bYear < 1940 || data.bYear > 2010)
		result.error.push({"field": "bDate", "text": "Set correctly year of birth."});
	
	if(result.error.length == 0) {
		data.userBdate = data.bYear + "-" + data.bMounth + "-" + data.bDay;
		
		const time = (new Date()).getTime();
	
		var imgName =  data.userId + "_" + time + ".png";
		var path = './public/uploads/cabinet/';
		var pathSite = '/uploads/cabinet/';
		
		/* var base64Data = data.userVerificationPhoto2.replace(/^data:image\/png;base64,/, "");
		fs.writeFile(path + imgName, base64Data, 'base64', function(err) {
			if(err)
			  console.log("Error in User.updateVerificationData #1\n" + err);
		    else {
				im.convert([path + imgName, "-flop", path + imgName], function(err, stdout){
					if(err)
						console.log("Error in User.updateVerificationData #2\n" + err);
				});
			}
		});
		
		data.userVerificationPhoto2 = pathSite + imgName; */
		
		db.query("UPDATE `tbl_user` SET `userAddress` = ?, `userCity` = ?, `userPhone` = ?, `userPostalCode` = ?, \
			`userSSN` = ?, `userVerificationPhoto1` = ?, `userVerificationPhoto2` = ?, `userBdate` = ?, `userVerification` = 1 WHERE `userId` = ?", 
			[data.userAddress, data.userCity, data.userPhone, data.userPostalCode, data.userSSN, 
			data.userVerificationPhoto1, data.userVerificationPhoto2, data.userBdate, data.userId], 
		function(err, res){
			if (err) {
				console.log("Error in User.updateVerificationData #1\n" + err);
				send(null, 'updateVerificationData', JSON.stringify(result));
			}
			else {
				result.success = true;
				send(null, 'updateVerificationData', JSON.stringify(result));
			}
		});
	}
	else
		send(null, 'updateVerificationData', JSON.stringify(result));
  }, 

  addUserClaim: function (send, data, sendTo) {
    var sql = "DELETE FROM `ctbl_userclaim` WHERE `userId` = " + data.userId + ";\n";
    for (var i = 0; i < data.claimId.length; i++)
      sql += "INSERT INTO `ctbl_userclaim` (`userId`, `profileId`, `claimId`) VALUES (" + data.userId + ", " + db.escape(data.profileId) + ", " + db.escape(data.claimId[i]) + ");\n";

    db.query(sql, function (err, rows) {
      if (err)
        console.log("Error in User.addUserClaim #1\n" + err);
      else
        send(null, 'addUserClaim', JSON.stringify({result: "success"}));
    });
  },

  // Add/remove photo blacklist
  addImageBlacklist: function (send, data, sendTo) {
    db.query("SELECT * FROM `ctbl_userimageblacklist` WHERE `userId` = ? AND `imageId` = ?;", [data.userId, data.imageId], function (err, rows) {
      if (err)
        console.log("Error in User.addImageBlacklist #1\n" + err);
      else {
        if (rows.length > 0) {
          db.query("DELETE FROM `ctbl_userimageblacklist` WHERE `userId` = ? AND `imageId` = ?;", [data.userId, data.imageId], function (err, rows) {
            if (err)
              console.log("Error in User.addImageBlacklist #2\n" + err);
          });
          send(null, 'addImageBlacklist', JSON.stringify({action: "remove"}));
        }
        else {
          db.query("INSERT INTO `ctbl_userimageblacklist` (`userId`, `imageId`) VALUES (?, ?);", [data.userId, data.imageId], function (err, rows) {
            if (err)
              console.log("Error in User.addImageBlacklist #3\n" + err);
          });
          send(null, 'addImageBlacklist', JSON.stringify({action: "add"}));
        }
      }
    });
  },

  // Add/remove photo claim
  addImageClaim: function (send, data, sendTo) {
    db.query("SELECT * FROM `ctbl_userimageclaim` WHERE `userId` = ? AND `imageId` = ?;", [data.userId, data.imageId], function (err, rows) {
      if (err)
        console.log("Error in User.addImageClaim #1\n" + err);
      else {
        if (rows.length > 0) {
          db.query("DELETE FROM `ctbl_userimageclaim` WHERE `userId` = ? AND `imageId` = ?;", [data.userId, data.imageId], function (err, rows) {
            if (err)
              console.log("Error in User.addImageClaim #2\n" + err);
          });
          send(null, 'addImageClaim', JSON.stringify({action: "remove"}));
        }
        else {
          db.query("INSERT INTO `ctbl_userimageclaim` (`userId`, `imageId`) VALUES (?, ?);", [data.userId, data.imageId], function (err, rows) {
            if (err)
              console.log("Error in User.addImageClaim #3\n" + err);
          });
          send(null, 'addImageClaim', JSON.stringify({action: "add"}));
        }
      }
    });
  },

  getResidence: function (callback) {
    db.query("SELECT `paramId`, `" + global.langParam + "` AS paramName FROM `tbl_param_city` ORDER BY `paramOrder` DESC, `" + global.langParam + "` ASC", function (err, rows) {
      if (err)
        console.log("Error in User.getResidence\n" + err);
      else
        callback(rows);
    });
  },

  /** get all bots for messages page **/
  getUserBots: function (send, data) {
    let userId = Helper.getIdByHash(data.hash);
    let userRole = data.role;

    if (!userId) return;

    // check for rights
    db.query('SELECT `userRole` FROM `tbl_user` WHERE `userId` = ?;', [userId], function (err, rows) {
      if (err)
        console.log("Error occurs in User.getUserBots, check role func", err);
      else {
        if (rows[userRole] < 50) {
          console.log('not enough rights to get bots');
          return;
        }

        /** this request was too hard **/
        // 'SELECT \
        //		tu.`userId`,\
        //		tu.`userNickname`,\
        //		tu.`useNickname`,\
        //		tu.`userPhoto`,\
        //		tu.`userName`,\
        //		tu.`userLastName`,\
        //		tu.`userLastActive` AS userLastActiveRaw,\
        //		tu.`isBotOnline`,\
        //		tc.`' + global.langParam + '` AS userResidence,\
        //			SUM(tm.`messageRead` = 0) AS unreadCount,\
        //			( SELECT `messageTime` \
        //				FROM `tbl_messages` \
        //				WHERE (`tbl_messages`.`senderId` = tu.`userId` OR `tbl_messages`.`receiverId` = tu.`userId`) \
        //				ORDER BY `messageTime` DESC \
        //			 LIMIT 1\
        //			) AS lastMsg\
        //		FROM `tbl_user` AS tu\
        //		LEFT JOIN `tbl_messages` AS tm ON tu.`userId` =	tm.`receiverId`\
        //	 LEFT JOIN `tbl_param_city` AS tc ON tc.`paramId` = tu.`userResidenceId` \
        //		WHERE tu.`userRole` = 3 AND `userActive` = 1\
        //		GROUP BY tu.`userId`\
        //		ORDER BY lastMsg DESC\
        //		LIMIT 30;'
        /** **/

        db.query('SELECT \
						tu.`userId`,\
						tu.`userNickname`,\
						tu.`useNickname`,\
						tu.`userPhoto`,\
						tu.`userName`,\
						tu.`userLastName`,\
						tu.`userLastActive` AS userLastActiveRaw,\
						tu.`isBotOnline`,\
						tc.`' + global.langParam + '` AS userResidence,\
						SUM(tm.`messageRead` = 0) AS unreadCount\
					FROM `tbl_user` AS tu\
					LEFT JOIN `tbl_messages` AS tm ON tu.`userId` =	tm.`receiverId`\
					LEFT JOIN `tbl_param_city` AS tc ON tc.`paramId` = tu.`userResidenceId` \
					WHERE tu.`userRole` = 3 AND `userActive` = 1\
					GROUP BY tu.`userId`\
					ORDER BY unreadCount DESC, userLastActiveRaw DESC;',
          function (err, rows) {
            if (err) {
              console.log(err, "occurs in User.getUserBots");
            }
            else {
              // push every bot into object as param named on it ID
              for (var i = 0; i < rows.length; i++) {
                // get hash
                rows[i].hash = Helper.getHashById(rows[i].userId);

                // check if user online
                if (rows[i].userLastActiveRaw != "0000-00-00") {
                  rows[i].userLastActive = Helper.getDateTimeSince(rows[i].userLastActiveRaw);
                }
              }

              send(null, 'userBots', JSON.stringify(rows));
            }
          });
      }
    });
  },

  /** get bot info by id **/
  getBotInfo: function (send, data) {
    db.query("SELECT \
				tu.`userId`,\
				tu.`userNickname`,\
				tu.`useNickname`,\
				tu.`userPhoto`,\
				tu.`userName`,\
				tu.`userLastName`,\
				tu.`userBdate`,\
				tu.`userStatus`,\
				t1.`" + global.langParam + "` AS 'userResidence',\
				t2.`" + global.langParam + "` AS 'userGender',\
				t3.`" + global.langParam + "` AS 'userEyes',\
				t4.`" + global.langParam + "` AS 'userHair',\
				t5.`" + global.langParam + "` AS 'userBody',\
				tu.`userWeight`,\
				tu.`userHeight`,\
				t6.`" + global.langParam + "` AS 'userReligion',\
				t7.`" + global.langParam + "` AS 'userEducation',\
				tu.`userOccupation`,\
				t8.`" + global.langParam + "` AS 'userMaritalStatus',\
				tu.`userChildren`,\
				t9.`" + global.langParam + "` AS 'userSmoke',\
				t10.`" + global.langParam + "` AS 'userDrink',\
				(SELECT GROUP_CONCAT(tph.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_hobbie` AS tuh LEFT JOIN `tbl_param_hobbie` AS tph ON tph.`paramId` = tuh.`paramId` WHERE tuh.`userId` = tu.`userId` GROUP BY tuh.`userId`) AS 'userHobbies',\
				(SELECT GROUP_CONCAT(tpc.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_color` AS tuc LEFT JOIN `tbl_param_color` AS tpc ON tpc.`paramId` = tuc.`paramId` WHERE tuc.`userId` = tu.`userId` GROUP BY tuc.`userId`) AS 'userFavoriteColor',\
				(SELECT GROUP_CONCAT(tps.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_sport` AS tus LEFT JOIN `tbl_param_sport` AS tps ON tps.`paramId` = tus.`paramId` WHERE tus.`userId` = tu.`userId` GROUP BY tus.`userId`) AS 'userSport',\
				(SELECT GROUP_CONCAT(tpc2.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_country` AS tuc2 LEFT JOIN `tbl_param_country` AS tpc2 ON tpc2.`paramId` = tuc2.`paramId` WHERE tuc2.`userId` = tu.`userId` GROUP BY tuc2.`userId`) AS 'userBeenAbroad',\
				(SELECT GROUP_CONCAT(tpc3.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_character` AS tuc3 LEFT JOIN `tbl_param_character` AS tpc3 ON tpc3.`paramId` = tuc3.`paramId` WHERE tuc3.`userId` = tu.`userId` GROUP BY tuc3.`userId`) AS 'userCharacter',\
				(SELECT GROUP_CONCAT(tpi.`" + global.langParam + "` SEPARATOR ', ') FROM `ctbl_user_interest` AS tui LEFT JOIN `tbl_param_interest` AS tpi ON tpi.`paramId` = tui.`paramId` WHERE tui.`userId` = tu.`userId` GROUP BY tui.`userId`) AS 'userInterest',\
				tu.`userAboutMyself`,\
				tu.`userAboutPartner`,\
				tu.`userRole`,\
				tu.`userRegister`,\
				tu.`userLastActive` AS userLastActiveRaw,\
				tu.`isBotOnline`\
			FROM `tbl_user` AS tu\
			LEFT JOIN `tbl_param_city` AS t1 ON t1.`paramId` = tu.`userResidenceId`\
			LEFT JOIN `tbl_param_gender` AS t2 ON t2.`paramId` = tu.`userGenderId`\
			LEFT JOIN `tbl_param_eyes` AS t3 ON t3.`paramId` = tu.`userEyesId`\
			LEFT JOIN `tbl_param_hair` AS t4 ON t4.`paramId` = tu.`userHairId`\
			LEFT JOIN `tbl_param_body` AS t5 ON t5.`paramId` = tu.`userBodyId`\
			LEFT JOIN `tbl_param_religion` AS t6 ON t6.`paramId` = tu.`userReligionId`\
			LEFT JOIN `tbl_param_education` AS t7 ON t7.`paramId` = tu.`userEducationId`\
			LEFT JOIN `tbl_param_marital_status` AS t8 ON t8.`paramId` = tu.`userMaritalStatusId`\
			LEFT JOIN `tbl_param_smoke` AS t9 ON t9.`paramId` = tu.`userSmokeId`\
			LEFT JOIN `tbl_param_drink` AS t10 ON t10.`paramId` = tu.`userDrinkId`\
			WHERE tu.`userId` = ?;", [data.botId],
      function (err, rows) {
        if (err) {
          console.log("Error occurs in User.getBotInfo", err);
        }
        else {

          // get hash
          rows.hash = Helper.getHashById(rows.userId);

          // check if user online
          if (rows.userLastActiveRaw != "0000-00-00") {
            rows.userLastActive = Helper.getDateTimeSince(rows.userLastActiveRaw);
          }


          send(null, 'botInfo', JSON.stringify(rows));
        }
      });
  },

  /** Switch online for 1 bot **/
  toggleBotOnline: function (botId) {
    db.query(
      'UPDATE `tbl_user`		SET `isBotOnline` = !`isBotOnline`		WHERE userId = ?;',
      [botId],
      function (err, rows) {
        if (err) {
          console.log(err, "occurs in User.toggleBotOnline");
        }
      });
  },

  /** Set received bot IDs as online **/
  setBotsOnline: function (sendOnce, data) {
    const self = this;
    let botsIdsQuery = data.botsIdsArr.join(',');

    db.query(
      'UPDATE `tbl_user` SET `isBotOnline` = 0		WHERE `userRole` = 3 AND `userActive` = 1;',
      function (err, rows) {
        if (err) {
          console.log("Error occurs in User.setBotsOnline, first query", err);
        } else {
          db.query(
            'UPDATE `tbl_user` SET `isBotOnline` = 1 WHERE `userRole` = 3 AND `userActive` = 1 AND `userId` IN (' + botsIdsQuery + ');',
            function (err, rows) {
              if (err) {
                console.log("Error occurs in User.setBotsOnline, second query", err);
              } else {
                self.getUserBots(sendOnce, data);
              }
            });
        }
      });
  },

  /** Get users, who wants to date **/
  getDatingUsers: function (send) {
    const self = this;

    db.query("SELECT \
					tu.`userId`,\
					tu.`userNickname`,\
					tu.`useNickname`,\
					tu.`userName`,\
					tu.`userLastName`,\
					tu.`userLastActive` AS userLastActiveRaw,\
					tu.`userPhoto`,\
					tc.`" + global.langParam + "` AS 'userResidence',\
					tg.`" + global.langParam + "` AS 'userGender',\
					tu.`userBdate`,\
					tu.`userRegister`\
			FROM `tbl_user` AS tu\
			LEFT JOIN `tbl_param_city` AS tc ON tc.`paramId` = tu.`userResidenceId`\
			LEFT JOIN `tbl_param_gender` AS tg ON tg.`paramId` = tu.`userGenderId`\
			WHERE \
					tu.`userActive` = 1 AND \
					tu.`userSearchShow` = 1 AND \
					tu.`userRole` = 1 AND\
					tu.`userResidenceId` > 0 AND \
					tu.`userGenderId` > 0 AND\
					tu.`userBdate`!= '0000-00-00' AND\
					tu.`userPhoto` != '/img/guestAva.png'\
			ORDER BY tu.`userRegister` DESC;",
      function (err, rows) {
        if (err) {
          console.log("Error occurs in User.getDatingUsers", err);
        } else {
          // push every bot into object as param named on it ID
          for (var i = 0; i < rows.length; i++) {
            // get hash
            rows[i].hash = Helper.getHashById(rows[i].userId);

            // check if user online
            if (rows[i].userLastActiveRaw != "0000-00-00") {
              rows[i].userLastActive = Helper.getDateTimeSince(rows[i].userLastActiveRaw);
            }
          }

          send(null, 'datingUsers', JSON.stringify(rows));
        }
      });
  },

  getUsersOnline: function (send, globalCallback, incomingParams) {
    db.query('SELECT\
				tu.`userId`,\
				tu.`userNickname`,\
				tu.`userPhoto`,\
				tu.`userBdate`,\
				(YEAR(CURRENT_DATE)-YEAR(`userBdate`)) - (RIGHT(CURRENT_DATE,5)<RIGHT(`userBdate`,5)) AS userAge,\
				tu.`userStatus`,\
				t1.`' + global.langParam + '` AS userResidence, \
				t2.`' + global.langParam + '` AS userGender, \
				t3.`' + global.langParam + '` AS userEyes, \
				t4.`' + global.langParam + '` AS userHair, \
				t5.`' + global.langParam + '` AS userBody, \
				tu.`userWeight`,\
				tu.`userHeight`,\
				t6.`' + global.langParam + '` AS userReligion, \
				t7.`' + global.langParam + '` AS userEducation, \
				tu.`userOccupation`,\
				t8.`' + global.langParam + '` AS userMaritalStatus, \
				tu.`userChildren`,\
				t9.`' + global.langParam + '` AS userSmoke, \
				t10.`' + global.langParam + '` AS userDrink, \
				(SELECT GROUP_CONCAT(tph.`' + global.langParam + '` SEPARATOR \', \') FROM `ctbl_user_hobbie` AS tuh LEFT JOIN `tbl_param_hobbie` AS tph ON tph.`paramId` = tuh.`paramId` WHERE tuh.`userId` = tu.`userId` GROUP BY tuh.`userId`) AS userHobbies, \
				(SELECT GROUP_CONCAT(tpc.`' + global.langParam + '` SEPARATOR \', \') FROM `ctbl_user_color` AS tuc LEFT JOIN `tbl_param_color` AS tpc ON tpc.`paramId` = tuc.`paramId` WHERE tuc.`userId` = tu.`userId` GROUP BY tuc.`userId`) AS userFavoriteColor, \
				(SELECT GROUP_CONCAT(tps.`' + global.langParam + '` SEPARATOR \', \') FROM `ctbl_user_sport` AS tus LEFT JOIN `tbl_param_sport` AS tps ON tps.`paramId` = tus.`paramId` WHERE tus.`userId` = tu.`userId` GROUP BY tus.`userId`) AS userSport, \
				(SELECT GROUP_CONCAT(tpc2.`' + global.langParam + '` SEPARATOR \', \') FROM `ctbl_user_country` AS tuc2 LEFT JOIN `tbl_param_country` AS tpc2 ON tpc2.`paramId` = tuc2.`paramId` WHERE tuc2.`userId` = tu.`userId` GROUP BY tuc2.`userId`) AS userBeenAbroad, \
				(SELECT GROUP_CONCAT(tpc3.`' + global.langParam + '` SEPARATOR \', \') FROM `ctbl_user_character` AS tuc3 LEFT JOIN `tbl_param_character` AS tpc3 ON tpc3.`paramId` = tuc3.`paramId` WHERE tuc3.`userId` = tu.`userId` GROUP BY tuc3.`userId`) AS userCharacter, \
				(SELECT GROUP_CONCAT(tpi.`' + global.langParam + '` SEPARATOR \', \') FROM `ctbl_user_interest` AS tui LEFT JOIN `tbl_param_interest` AS tpi ON tpi.`paramId` = tui.`paramId` WHERE tui.`userId` = tu.`userId` GROUP BY tui.`userId`) AS userInterest, \
				tu.`userAboutMyself`,\
				tu.`userAboutPartner`,\
				tu.`userRole`,\
				tu.`userRegister`,\
				tu.`userLastActive`,\
				tu.`isBotOnline`,\
				tu.`userLastActive`,\
				tu.`userVisits`,\
				tu.`userSearchSettings`,\
				(SELECT MAX(`userVisits`) FROM `tbl_user`) AS maxVisits\
			FROM `tbl_user` AS tu\
			LEFT JOIN `tbl_param_city` AS t1 ON t1.`paramId` = tu.`userResidenceId` \
			LEFT JOIN `tbl_param_gender` AS t2 ON t2.`paramId` = tu.`userGenderId`\
			LEFT JOIN `tbl_param_eyes` AS t3 ON t3.`paramId` = tu.`userEyesId`\
			LEFT JOIN `tbl_param_hair` AS t4 ON t4.`paramId` = tu.`userHairId`\
			LEFT JOIN `tbl_param_body` AS t5 ON t5.`paramId` = tu.`userBodyId`\
			LEFT JOIN `tbl_param_religion` AS t6 ON t6.`paramId` = tu.`userReligionId`\
			LEFT JOIN `tbl_param_education` AS t7 ON t7.`paramId` = tu.`userEducationId`\
			LEFT JOIN `tbl_param_marital_status` AS t8 ON t8.`paramId` = tu.`userMaritalStatusId`\
			LEFT JOIN `tbl_param_smoke` AS t9 ON t9.`paramId` = tu.`userSmokeId`\
			LEFT JOIN `tbl_param_drink` AS t10 ON t10.`paramId` = tu.`userDrinkId` \
			WHERE tu.`userSearchShow` = 1 AND tu.`userRole` = 1 AND tu.`userGenderId` = 1\
			ORDER BY tu.`userRegister` DESC, tu.`userRole` ASC\
			LIMIT 15;',
      function (err, rows) {
        if (err)
          console.log("Error in User.getUsersOnline", err);
        else {
          // handle params
          for (var i = 0; i < rows.length; i++) {
            rows[i].stars = Math.floor(rows[i].userVisits / rows[i].maxVisits * 5);

            rows[i].userBdate = Helper.getStringDate(rows[i].userBdate);

            if (rows[i].userCharacter)
              rows[i].userCharacter = rows[i].userCharacter.split(",").join(", ");
            else
              rows[i].userCharacter = [];

            if (rows[i].userHobbies)
              rows[i].userHobbies = rows[i].userHobbies.split(",").join(", ");
            else
              rows[i].userHobbies = [];

            if (rows[i].userInterest)
              rows[i].userInterest = rows[i].userInterest.split(",").join(", ");
            else
              rows[i].userInterest = [];

            if (rows[i].userFavoriteColor)
              rows[i].userFavoriteColor = rows[i].userFavoriteColor.split(",").join(", ");
            else
              rows[i].userFavoriteColor = [];

            if (rows[i].userSport)
              rows[i].userSport = rows[i].userSport.split(",").join(", ");
            else
              rows[i].userSport = [];

            if (rows[i].userBeenAbroad)
              rows[i].userBeenAbroad = rows[i].userBeenAbroad.split(",").join(", ");
            else
              rows[i].userBeenAbroad = [];

            // if user online
            if (rows[i].isBotOnline)
              rows[i].userLastActive = 'online';
            else
              rows[i].userLastActive = Helper.getDateTimeSince(rows[i].userLastActive);
          }

          if (globalCallback) {
            incomingParams.usersOnline = rows;
            globalCallback(incomingParams);
          } else {
            send(null, 'usersOnline', JSON.stringify(rows));
          }
        }
      });
  },

  checkUserBanned: function (userId, callback) {
    db.query('SELECT `userActive` FROM `tbl_user` WHERE `userId` = ?', [userId], function (err, rows) {
      if (err) {
        console.log("Error occurs in User.checkUserBanned", err);
      } else {
        if (rows[0].userActive == 1) {
          callback(false); // user not banned
        } else {
          callback(true); // user banned
        }
      }
    });
  },

  getSocialContacts: function (send, data) {
    let id = typeof data.profileId === 'string' ? +data.profileId : data.userId;

    db.query("SELECT\
				t.`socialEmail`,\
				t2.`userId`,\
				t.`fbLink`,\
				t.`instaLink`,\
				t.`twitLink`,\
				t.`gpLink`,\
				t.`phoneNumber`,\
				t.`hasTelegram`,\
				t.`hasViber`,\
				t.`hasWhatsapp`\
			FROM `tbl_user` AS t2\
			LEFT JOIN `ctbl_user_social_contacts` AS t ON t.`userId` = t2.`userId`\
			WHERE t2.`userId` = ?;", [id],
      function (err, res) {
        if (err) {
          console.log("Error in Profile.getSocialContacts", err);
        }
        else {
          send(null, "getSocialContacts", JSON.stringify(res[0]));
        }
      })
  },

  updateUserSocialContacts: function (send, data) {
    db.query("SELECT * FROM `ctbl_user_social_contacts` WHERE `userId` = ?;", [data.userId], function (err, res) {
      if (err) {
        console.log("Error in Profile.updateUserSocialContacts #1", err);
      }
      if (res.length > 0) {
        db.query("UPDATE `ctbl_user_social_contacts` SET " + data.key + " = '" + data.value + "' WHERE `userId` = " + data.userId + ";", function (err, res) {
          if (err) {
            console.log("Error in Profile.updateUserSocialContacts #2", err);
          }
          else {
            send(null, "updateUserSocialContacts", JSON.stringify({message: 'success'}));
          }
        })
      } else {
        db.query("INSERT INTO `ctbl_user_social_contacts` (`userId`, `" + data.key + "`) VALUES ( ? , '" + data.value + "' );", [data.userId], function (err, res) {
          if (err) {
            console.log("Error in Profile.updateUserSocialContacts #3", data, err);
          }
          else {
            send(null, "updateUserSocialContacts", JSON.stringify({message: 'success'}));
          }
        })
      }
    })
  },

  addUserBlacklist: function (send, {userId, profileId}, sendTo) {
    if (!userId || !profileId) {
      return;
    }

    db.query("SELECT * FROM `cbl_userblacklist` WHERE `userId` = ? AND `profileId` = ?;", [userId, profileId], function (err, rows) {
      if (err)
        console.log("Error in User.addUserBlacklist #1\n" + err);
      else {
        if (rows.length > 0) {
          db.query("DELETE FROM `cbl_userblacklist` WHERE `userId` = ? AND `profileId` = ?;", [userId, profileId], function (err, rows) {
            if (err)
              console.log("Error in User.addUserBlacklist #2\n" + err);
          });
          send(null, 'addUserBlacklist', JSON.stringify({action: "remove"}));
        }
        else {
          db.query("INSERT INTO `cbl_userblacklist` (`userId`, `profileId`) VALUES (?, ?);", [userId, profileId], function (err, rows) {
            if (err)
              console.log("Error in User.addUserBlacklist #3\n" + err);
          });
          send(null, 'addUserBlacklist', JSON.stringify({action: "add"}));
        }
      }
    });
  },

  checkBlacklist: function (userId, profileId) {
    return new Promise((res, rej) => {
      if (!userId || !profileId) {
        return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in User.checkBlacklist: userId or profileId is not specified"
        })
      }

      db.query(
        'SELECT `id` FROM `cbl_userblacklist` WHERE `userId` = ? AND `profileId` = ?;',
        [profileId, userId],
        (err, rows) => {
          if(err){
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in User.checkBlacklist: " + err
            })
          }
          if (rows.length > 0) {
            return res({
              success: true,
              status: STATUS.OK,
              banned: true,
              message: 'Sorry, receiver added you to black list'
            })
          }
          return res({
            success: true,
            status: STATUS.OK,
            banned: false,
          })
        })
    })
  },

  checkBlacklistByProfileId: function (send, data) {
    db.query('SELECT `id` FROM `cbl_userblacklist` WHERE `userId` = ? AND `profileId` = ?;',
      [data.userId, data.profileId],
      function (err, rows) {
      if (err) {
        console.log('Occurs in User.checkBlacklistByProfileId', err);
      } else {
        const sendData = {profileInBlacklist: rows.length > 0};
        send(null, 'checkBlacklistByProfileId', JSON.stringify(sendData));
      }
    })
  },

  // Add place user want to visit
  addPlaceToVisit(send, data){
    const self = this;

    // remove space after comma
    const formattedPlace = data.place.toLowerCase().replace(/\s*,\s*/g, ",");

    db.query('SELECT * FROM `ctbl_user_want_to_visit` WHERE `userId` = ? AND `place` = ?;',
      [data.userId, formattedPlace],
      (err, rows) => {
        if (err) {
          console.log("Error in User.addPlaceToVisit - select all func\n" + err);
        }
        else {
          // if country already exists - return it id
          if (rows.length > 0) {
            return
          }
          // or insert country for user and return it id
          db.query('INSERT INTO ctbl_user_want_to_visit (userId, place) VALUES (?, ?);',
            [data.userId, formattedPlace],
            (err, rows) => {
              if (err) {
                console.log("Error in User.addCountryToVisit - insert func\n" + err);
              }
              else {
                self.getPlacesToVisit(send, data)
              }
            });
        }
      });
  },

  // Get all desired by user places
  getPlacesToVisit(send, data){
    db.query('SELECT * FROM ctbl_user_want_to_visit WHERE `userId` = ?;', [data.userId],
      (err, rows) => {
        if (err) {
          console.log("Error in User.getCountriesToVisit\n" + err);
        }
        else {
          send(null, 'userPlacesToVisit', JSON.stringify(rows));
        }
      });
  },

  // delete desired places
  removePlaceToVisit(send, data){
    const self = this;

    db.query('DELETE FROM `ctbl_user_want_to_visit` WHERE `userId` = ? AND `id` = ?;',
      [data.userId, data.recordId],
      (err, rows) => {
        if (err) {
          console.log("Error in User.removePlaceToVisit - select all func\n" + err);
        }
      });
  },

  addUserRegion(send, userRegionData){
    const self = this;

    self.getCountryId(userRegionData)
      .then(userRegionDataWithCountryId => self.addUserCityAndCountry(userRegionDataWithCountryId))
      .then(() => self.getUserCityAndCountry(userRegionData.userId))
      .then(cityAndCountry => {
        send(null, 'userRegion', JSON.stringify(cityAndCountry));
      })
      .catch(err => ErrorHandler(err));
  },

  // Get country ID by country name in english
  getCountryId(userRegionData) {
    return new Promise((res, rej) => {
      db.query('SELECT paramId FROM `tbl_param_country` WHERE paramEn LIKE ?',
        [`%${userRegionData.countryName}%`],
        (err, rows) => {
          if (err) {
            return rej({code: 1, message: `occurs in User.getCountryId: ${err}`});
          }

          if (!rows[0]) {
            console.log('Undefined country detected! countryName: ', userRegionData.countryName)
          }
          userRegionData.countryId = (rows.length) ? rows[0].paramId : 0;
          return res(userRegionData);
        });
    });
  },

  addUserCityAndCountry(data){
    return new Promise((res, rej) => {
      db.query('UPDATE tbl_user SET userCity = ?, userCountryId = ?  WHERE userId = ?',
        [data.city.toLowerCase(), data.countryId, data.userId],
        (err) => {
          if (err) {
            return rej({code: 1, message: `occurs in User.addUserCityAndCountry: ${err}`});
          }
          else {
            return res();
          }
        })
    });
  },

  // get city and country where user lives
  getUserCityAndCountry(userId){
    return new Promise((res, rej) => {
      db.query(
        'SELECT \
           t_user.userCity AS city, \
           t_country.paramEn AS country\
          FROM tbl_user AS t_user\
          LEFT JOIN tbl_param_country AS t_country\
            ON t_country.paramId = t_user.userCountryId\
          WHERE `userId` = ?;',
        [userId],
        (err, rows) => {
          if (err) return rej({code: 1, message: `occurs in User.getUserCityAndCountry: ${err}`});
          return res(rows[0]);
        });
    });
  },

  // get new users, who wants to date
  getNewClients (send, data) {
    const self = this;

    const userId = Helper.getIdByHash(data.hash);
    if (!userId) return;

    self.getUserRole(userId, userRole => {
      if (userRole < 30) {
        console.log('Not enough rights to get models, User.getClients getUserRole func');
        return
      }

      db.query("SELECT\
		tu.`userId`,\
		tu.`userNickname`,\
		tu.`useNickname`,\
		tu.`userName`,\
		tu.`userLastName`,\
		tu.`userLastActive` AS userLastActiveRaw,\
		tu.`userPhoto`,\
		tu.`userCash`,\
		tu.`userCity`,\
		tc.`paramEn` AS 'userCountry',\
		tg.`paramEn` AS 'userGender',\
		tu.`userBdate`,\
		tu.`userRegister`\
	FROM `tbl_user` AS tu\
	LEFT JOIN `tbl_param_country` AS tc ON tc.`paramId` = tu.`userCountryId`\
	LEFT JOIN `tbl_param_gender` AS tg ON tg.`paramId` = tu.`userGenderId`\
	WHERE\
		tu.`userActive` = 1 AND\
		tu.`userRole` = 1\
	ORDER BY tu.`userId` DESC\
	LIMIT 60;",
        (err, rows) => {
          if (err) {
            console.log("Error occurs in User.getClients", err);
          } else {
            // push every bot into object as param named on it ID
            for (var i = 0; i < rows.length; i++) {
              // get hash
              rows[i].hash = Helper.getHashById(rows[i].userId);

              // check if user online
              if (rows[i].userLastActiveRaw != "0000-00-00") {
                rows[i].userLastActive = Helper.getDateTimeSince(rows[i].userLastActiveRaw);
              }
            }

            send(null, 'clients', JSON.stringify(rows));
          }
        });
    })
  },

  getLastFavorites(send, data) {
    var self = this;

    var userId = Helper.getIdByHash(data.hash);
    if (!userId) return;

    self.getUserRole(userId, userRole => {
      if (userRole < 30) {
        console.log('Not enough rights to get models, Chat.getLastMessages getUserRole func');
        return
      }

      db.query(
        'SELECT \
           tf.`userId` AS _userId,\
           tf.`profileId` AS _profileId,\
           tf.`date` AS messageTime,\
           tu_sender.`userId` AS senderId,\
           tu_sender.`userNickname` AS senderNickname,\
           tu_sender.`useNickname` AS senderUseNickname,\
           tu_sender.`userPhoto` AS senderPhoto,\
           tu_sender.`userName` AS senderName,\
           tu_sender.`userLastName` AS senderLastName,\
           tu_receiver.`userId` AS receiverId,\
           tu_receiver.`userNickname` AS receiverNickname,\
           tu_receiver.`useNickname` AS receiverUseNickname,\
           tu_receiver.`userPhoto` AS receiverPhoto,\
           tu_receiver.`userName` AS receiverName,\
           tu_receiver.`userLastName` receiverLastName\
        FROM `ctbl_userfavorite` AS tf \
        LEFT JOIN `tbl_user` AS tu_sender\
          ON tf.`userId` = tu_sender.`userId`\
        LEFT JOIN `tbl_user` AS tu_receiver\
          ON tf.`profileId` = tu_receiver.`userId`\
      ORDER BY `date` DESC\
      LIMIT 30',
        function (err, rows) {
          if (err)
            console.log("Error in User.getLastFavorites", err);
          else {
            send(null, 'lastFavorites', JSON.stringify(rows));
          }
        });
    })
  },

  getLastPhotoLikes (send, data) {
    var self = this;

    var userId = Helper.getIdByHash(data.hash);
    if (!userId) return;

    self.getUserRole(userId, userRole => {
      if (userRole < 30) {
        console.log('Not enough rights to get models, Chat.getLastMessages getUserRole func');
        return
      }
      db.query(
        'SELECT \
           tp.`userId` AS _userId,\
           tp.`profileId` AS _profileId,\
           tp.`time` AS messageTime,\
           tu_sender.`userId` AS senderId,\
           tu_sender.`userNickname` AS senderNickname,\
           tu_sender.`useNickname` AS senderUseNickname,\
           tu_sender.`userPhoto` AS senderPhoto,\
           tu_sender.`userName` AS senderName,\
           tu_sender.`userLastName` AS senderLastName,\
           tu_receiver.`userId` AS receiverId,\
           tu_receiver.`userNickname` AS receiverNickname,\
           tu_receiver.`useNickname` AS receiverUseNickname,\
           tu_receiver.`userPhoto` AS receiverPhoto,\
           tu_receiver.`userName` AS receiverName,\
           tu_receiver.`userLastName` receiverLastName\
        FROM `ctbl_userimagelike` AS tp \
        LEFT JOIN `tbl_user` AS tu_sender\
          ON tp.`userId` = tu_sender.`userId`\
        LEFT JOIN `tbl_user` AS tu_receiver\
          ON tp.`profileId` = tu_receiver.`userId`\
      ORDER BY `time` DESC\
      LIMIT 30',
        function (err, rows) {
          if (err)
            console.log("Error in Photo.getLastPhotoLikes", err);
          else {
            for (var i = rows.length - 1; i >= 0; i--) {
              if (rows[i].messageTime === '0000-00-00 00:00:00') {
                rows.splice(i, 1);
              }
            }
            send(null, 'lastPhotoLikes', JSON.stringify(rows));
          }
        });
    })
  },

  getAll (data, send) {
    const limit = 100;
    const offset = (data.page - 1) * limit;

    db.query('SELECT \
			user.`userId`,\
			user.`userNickname`,\
			user.`useNickname`,\
			user.`userName`,\
			user.`userLastName`,\
			user.`userPhoto`,\
			user.`userBdate`,\
			user.`userGenderId`,\
			user.`userLastActive`,\
			user.`userRegister`,\
			user.`userActive`,\
			user.`userApproved`,\
			user.`userCity`,\
			user.`userInFeed`,\
			country.`' + global.langParam + '` AS userCountry,\
			chat.chatCount, \
			(SELECT GROUP_CONCAT(CONCAT(uwtv.`id`, ":", uwtv.`place`) SEPARATOR ", ") FROM ctbl_user_want_to_visit AS uwtv WHERE uwtv.userId = user.userId  GROUP BY uwtv.userId) AS userWantToVisit \
		FROM `tbl_user` AS user\
		LEFT JOIN (SELECT `senderId`, COUNT(*) AS chatCount FROM `tbl_chat` GROUP BY `senderId`) AS chat \
		ON chat.`senderId` = user.`userId`\
		LEFT JOIN `tbl_param_country` AS country \
		ON country.`paramId` = user.`userCountryId`\
		WHERE user.`userRole` = 1 AND user.`userActive` = 1\
		ORDER BY user.`userId` DESC\
		LIMIT ?, ?;', [offset, limit],
      (err, rows) => {
        if (err)
          console.log("Error in User.getAll #1\n" + err);
        else {
          for (let i = 0; i < rows.length; i++) {
            if (rows[i].userBdate != "0000-00-00")
              rows[i].userAge = Helper.getAge(rows[i].userBdate);

            if (rows[i].userLastActive != "0000-00-00")
              rows[i].userLastActive = Helper.getDateTimeSince(rows[i].userLastActive);

            var dateObj = new Date(rows[i].userRegister);
            rows[i].userRegister = dateObj.getDate() + "." + (dateObj.getMonth() + 1) + "." + dateObj.getFullYear();

            rows[i] = Helper.handleUserName(rows[i]);
            rows[i].userNickname = rows[i].userName;
          }
          send({users: rows});
        }
      });
  },

  deleteUser (send, data) {
    const id = data.idToDelete;

    this.getUserRole(data.userId, userRole => {
      if (userRole < 100) {
        return send(null, "deleteUser", {success: false});
      }

      const sql =
        `DELETE FROM cbl_stickerpack_favorite WHERE userId = ${id};
         DELETE FROM cbl_sticker_favorite WHERE userId = ${id};
         DELETE FROM cbl_userblacklist WHERE userId = ${id};
         DELETE FROM cbl_userblacklist WHERE profileId = ${id};
         DELETE FROM ctbl_userclaim WHERE userId = ${id};
         DELETE FROM ctbl_userclaim WHERE profileId = ${id};
         DELETE FROM ctbl_userfavorite WHERE userId = ${id};
         DELETE FROM ctbl_userfavorite WHERE profileId = ${id};
         DELETE FROM ctbl_userimageblacklist WHERE userId = ${id};
         DELETE FROM ctbl_userimageclaim WHERE userId = ${id};
         DELETE FROM ctbl_userimagelike WHERE userId = ${id};
         DELETE FROM ctbl_userimagelike WHERE profileId = ${id};
         DELETE FROM ctbl_uservisits WHERE userId = ${id};
         DELETE FROM ctbl_uservisits WHERE profileId = ${id};
         DELETE FROM ctbl_user_character WHERE userId = ${id};
         DELETE FROM ctbl_user_color WHERE userId = ${id};
         DELETE FROM ctbl_user_country WHERE userId = ${id};
         DELETE FROM ctbl_user_hobbie WHERE userId = ${id};
         DELETE FROM ctbl_user_interest WHERE userId = ${id};
         DELETE FROM ctbl_user_social_contacts WHERE userId = ${id};
         DELETE FROM ctbl_user_sport WHERE userId = ${id};
         DELETE FROM ctbl_user_want_to_visit WHERE userId = ${id};
         DELETE FROM tbl_chat_attachment WHERE messageId IN (SELECT messageId FROM tbl_chat WHERE senderId = ${id});
         DELETE FROM tbl_chat WHERE senderId = ${id};
         DELETE FROM tbl_conversation_participants WHERE userId = ${id};
         DELETE FROM tbl_notifications WHERE senderId = ${id};
         DELETE FROM tbl_notifications WHERE receiverId = ${id};
         DELETE FROM tbl_user WHERE userId = ${id};
         DELETE FROM tbl_user_image WHERE userId = ${id};
         DELETE FROM tbl_user_video WHERE userId = ${id};
         DELETE FROM tbl_user_post WHERE userId = ${id};
         DELETE FROM tbl_user_post_like WHERE userId = ${id};
         DELETE FROM tbl_user_post_message WHERE userId = ${id}`;

      db.query(sql, (err, rows) => {
        if (err){
          console.log(err);
          send(null, "deleteUser", {success: false, clientId: id});
        } else {
          send(null, "deleteUser", {success: true, clientId: id});
        }
      });
    });
  },
  
  adminUpdateUserParam (send, data) {
    this.getUserRole(data.userId, userRole => {
      if (userRole < 100) {
        return send(null, "adminUpdateUserParam", JSON.stringify({success: false}));
      }

      if(data.key == "userSearchSettings") {
		  data.value = JSON.parse(data.value);
		  data.value.place = [];
		  data.value = JSON.stringify(data.value);
	  }
	  
	  db.query('UPDATE tbl_user SET ?? = ? WHERE userId = ?;',
        [data.key, data.value, data.profileId],
        (err, rows) => {
          if (err)
            send(null, "adminUpdateUserParam", JSON.stringify({success: false, profileId: data.profileId}));
          else
            send(null, "adminUpdateUserParam", JSON.stringify({success: true, profileId: data.profileId}));
        });
    });
  },

  getPhoto(userId) {
    return new Promise((res, rej) => {
      db.query("SELECT `userPhoto` FROM `tbl_user` WHERE `userId` = ?;",
        [userId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in User.getPhoto:\n" + err
          });
          return res({
            success: true,
            status: STATUS.OK,
            photo: rows[0].userPhoto
          });
        });
    });
  },

  getAvatar(userId) {
    return new Promise((res, rej) => {
      db.query(
        "SELECT `userPhoto` FROM `tbl_user` WHERE `userId` = ?;",
        [userId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in User.getPhoto:\n" + err
          });
          return res({
            success: true,
            status: STATUS.OK,
            avatarPath: ((rows.length) ? rows[0].userPhoto : "")
          });
        });
    });
  },

  async updateAvatar(userId, imgPath) {
    try {
      if (!userId && !imgPath) {
        throw {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'updateAvatar: No image path or user id'
        };
      }

      const self = this;

      // first get current avatar path before changes and updating
      const oldAvatarResult = await self.getAvatar(userId);

      // clone image object to save differently from post images
      // to prevent avatar deletion when user deletes post
      const newAvatarResult = await Image.copy(imgPath);

      // update avatar in db
      await self._saveAvatar(userId, newAvatarResult.path);

      // delete old avatar image form disk
      await Image.deleteFromDisk([{path: oldAvatarResult.avatarPath}]);

      // send result
      return {success: true, status: STATUS.OK, image: {path: newAvatarResult.path}}
    } catch (err){
      throw err;
    }
  },

  _saveAvatar(userId, imgPath){
    return new Promise((res, rej) => {
      if (!imgPath) return rej({
        success: false,
        status: STATUS.INVALID_INPUT_PARAMETERS,
        message: 'No path and no image id'
      });


      return db.query("UPDATE `tbl_user` SET `userPhoto` = ? WHERE `userId` = ?;",
        [imgPath, userId],
        err => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in User._saveAvatar #1: \n" + err
            });
          }
          return res({success: true, status: STATUS.OK, image: {path: imgPath}});
        });
    });
  },

  filterUsersOnline(data){
    return new Promise((res, rej) => {
      if (!data.receivers || !data.receivers.length) return res({...data, receiversOnline: []});

      return db.query("SELECT userId FROM tbl_user WHERE userLastActive > (NOW() - INTERVAL 10 MINUTE) AND userId IN (?)",
        [data.receivers],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: "Error in User.filterUsersOnline: \n" + err
            });
          }

          data.receiversOnline = rows.length ? rows.map(user => user.userId) : [];
          return res(data);
        });
    });
  },

  checkUserSubscription(userId, receiverId){
    return new Promise((res, rej) => {
      if (!userId || !receiverId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: 'User.getByPostId error: no user or receiver id provided'
        });
      }

      if(Cash.monetizationOff){
        return res({success: true, status: STATUS.OK, isSubscriptionActive: true, banned: false});
      }

      if(+receiverId === 1){
        return res({success: true, status: STATUS.OK, isSubscriptionActive: true, banned: false});
      }

      // add like and get post author id
      db.query('SELECT subscriptionEndDate FROM tbl_user WHERE userId = ? ',
        [userId],
        (err, rows) => {
        if (err) return rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: "Error in User.checkUserSubscription: " + err
        });

        if(!rows.length){
          return rej({
            success: true,
            status: STATUS.NOT_FOUND,
            isSubscriptionActive: false,
            message: `User ${userId} was not found`
          });
        }

        if(!Helper.checkSubscriptionActive(rows[0].subscriptionEndDate)){
          return res({
            success: true,
            status: STATUS.SUBSCRIPTION_NEEDED,
            isSubscriptionActive: false,
            message: `User ${userId} doesn't have subscription or his subscription has ended`,
            banned: true
          });
        }

        return res({success: true, status: STATUS.OK, isSubscriptionActive: true, banned: false});
      });
    })
  },

  checkUserDeleted(userId, receiverId){
    return new Promise((res, rej) => {
      if (!userId || !receiverId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          message: 'User.checkUserDeleted error: no user or receiver id provided'
        });
      }

      db.query(
        'SELECT userRemoved FROM tbl_user WHERE userId = ?; \
         SELECT userRemoved FROM tbl_user WHERE userId = ?;',
        [userId, receiverId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in User.checkUserRemoved: " + err
          });

          if(+rows[0][0].userRemoved === 1){
            return res({
              success: true,
              status: STATUS.USER_DELETED,
              message: `User ${userId} has been deleted`,
              banned: true
            });
          }

          if(+rows[1][0].userRemoved === 1){
            return res({
              success: true,
              status: STATUS.USER_DELETED,
              message: `Receiver ${receiverId} has been deleted`,
              banned: true
            });
          }

          return res({success: true, status: STATUS.OK, banned: false});
        });
    })
  },
  
  getUserInfoFromLanding(userId, send){
	db.query('SELECT t.`userId`, t.`userPhoto`, t.`userNickname`, t.`userAboutMyself`, t.`userBdate` FROM `tbl_user` AS t WHERE t.`userId` = ?;\
	SELECT `userImagePath` FROM `tbl_user_image` WHERE `userId` = ?;\
	SELECT `place` FROM `ctbl_user_want_to_visit` WHERE `userId` = ?;', 
	  [userId, userId, userId], 
	function (err, rows) {
        if (err) {
			console.log("Error in User.getUserInfoFromLanding #1\n" + err);
			send(false);
		}
        else if (rows[0].length > 0) {
			rows[0][0].userNickname = "@" + rows[0][0].userNickname;
			rows[0][0].age = Helper.getAge(new Date(rows[0][0].userBdate));
			rows[0][0].photos = rows[1];
			for(var i=0; i<rows[2].length; i++)
				rows[2][i].place = rows[2][i].place.charAt(0).toUpperCase() + rows[2][i].place.slice(1);
			rows[0][0].want_to_visit = rows[2];
			
			send(rows[0][0]);
		}
		else
			send(false);
	})
  }, 
  
  addUserToViewed(send, data){
	db.query('INSERT INTO ctbl_userviewed (userId, profileId) VALUES (?, ?);', [data.userId, data.profileId], (err, rows) => {
		if (err)
			console.log("Error in User.addUserToViewed - insert func\n" + err);
		else
			send(null, 'swipeDislike', JSON.stringify({success:true}));
	});
  }
};
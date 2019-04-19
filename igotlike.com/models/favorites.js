const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');

const Favorites = {
  addOrRemove (userId, profileId) {
    return new Promise((res, rej) => {
      db.query(
        "SELECT * FROM `ctbl_userfavorite` WHERE `userId` = ? AND `profileId` = ?;\
         SELECT `userActive` FROM `tbl_user` WHERE `userId` = ?;",
        [userId, profileId, userId],
        (err, rows) => {
          if (err) return rej("Error in Favorites.addUserFavorite #1:\n" + err);

          // check user not banned
          if (!+rows[1][0].userActive) {
            return res({
              success: false,
              status: STATUS.USER_INACTIVE,
              message: `Favorite add or remove operation declined: user ${userId} is inactive (banned)`
            });
          }

          // remove from favorites
          if (rows[0].length > 0) {
            return db.query("DELETE FROM `ctbl_userfavorite` WHERE `userId` = ? AND `profileId` = ?;", [userId, profileId],
              err => {
                if (err) return rej("Error in Favorites.addUserFavorite #2:\n" + err);
                return res({success: true, action: "remove", profileId: profileId});
              });
          }

          // add to favorites
          return db.query("INSERT INTO `ctbl_userfavorite` (`userId`, `profileId`) VALUES (?, ?);",
            [userId, profileId],
            err => {
              if (err) return rej("Error in Favorites.addUserFavorite #3:\n" + err);
              return res({success: true, action: "add", profileId: profileId})
            });
        });
    });
  },

  getFollowingIds(userId) {
    return new Promise((res, rej) => {
      db.query("SELECT t.`profileId` FROM `ctbl_userfavorite` AS t LEFT JOIN `tbl_user` AS t2 ON t2.`userId` = t.`profileId` WHERE t.`userId` = ? AND t2.`userRemoved` = 0;",
        [userId],
        (err, rows) => {
          if (err) return rej("Error in Favorites.getFollowingIds: \n" + err);

          const favorites = rows.map(elem => elem.profileId);
          return res({success: true, status: STATUS.OK, favorites})
        });
    });
  },


  getFollowingInfo(userId, profileId){
    return new Promise((res, rej) => {
      if (!userId || !profileId) {
        return {
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'getFollowingInfo error: no userId or profileId specified'
        }
      }

      db.query(
        "SELECT \
           t.`userPhoto`, \
           t.`userNickname`, \
           t.`userBdate`, \
           t.`userGenderId`, \
		   t.`userVerification`, \
           t2.`paramEn` AS 'userCountry', \
           t.`userCity` \
		     FROM `tbl_user` AS t \
		     LEFT JOIN `tbl_param_country` AS t2 ON t2.`paramId` = t.`userCountryId`\
		     WHERE t.`userId` = ?;\
		 SELECT\
			usr.`userId`,\
			usr.`userNickname`,\
			usr.`userPhoto`,\
			usr.`userVerification`, \
			inFav.`profileId` AS inFavorite\
			 FROM `ctbl_userfavorite` AS fav\
			 LEFT JOIN `tbl_user` AS usr ON usr.`userId` = fav.`profileId`\
			 LEFT JOIN `ctbl_userfavorite` AS inFav ON inFav.`profileId` = fav.`profileId` AND inFav.`userId` = ?\
			 WHERE fav.`userId` = ? AND usr.`userRemoved` = 0\
			 ORDER BY fav.`id` DESC;\
		 SELECT\
			usr.`userId`,\
			usr.`userNickname`,\
			usr.`userPhoto`,\
			usr.`userVerification`, \
			inFans.`profileId` AS inFavorite\
			 FROM `ctbl_userfavorite` AS fans\
			 LEFT JOIN `tbl_user` AS usr ON usr.`userId` = fans.`userId`\
			 LEFT JOIN `ctbl_userfavorite` AS inFans ON inFans.`profileId` = fans.`userId` AND inFans.`userId` = ?\
			 WHERE fans.`profileId` = ? AND usr.`userRemoved` = 0\
			 ORDER BY fans.`id` DESC;",
        [profileId, userId, profileId, userId, profileId],
        (err, rows) => {
          if (err) return rej("Error in Favorites.geFollowing: \n" + err);

          // handle user row
          let user = rows[0][0];
          user = Helper.handleUserName(user);
          if (user.userBdate != "0000-00-00") {
            user.age = Helper.getAge(user.userBdate);
            var dateObj = new Date(user.userBdate);
            user.userBdate = [dateObj.getDate(), (dateObj.getMonth() + 1), dateObj.getFullYear()];
          } else {
            user.userBdate = "";
          }

          user.userCity = (user.userCity) ? user.userCity.charAt(0).toUpperCase() + user.userCity.slice(1) : "";
          user.userCountry = (user.userCountry) ? user.userCountry.charAt(0).toUpperCase() + user.userCountry.slice(1) : "";

          // handle favorites rows
          const favorites = rows[1];
          for (let i = 0; i < favorites.length; i++) {
            favorites[i] = Helper.handleUserName(favorites[i]);
          }

          // handle fans rows
          const fans = rows[2];
          for (let j = 0; j < fans.length; j++) {
            fans[j] = Helper.handleUserName(fans[j]);
          }

          return res({success: true, status: STATUS.OK, user, favorites, fans});
        });
    })
  },

  /**
   * Methods for mobile app
   */
  getFavorites(userId){
    return new Promise((res, rej) => {
      db.query("SELECT\
				t2.`userId`,\
				t2.`userNickname`,\
				t2.`userPhoto`,\
				(YEAR(CURRENT_DATE)-YEAR(t2.`userBdate`)) - (RIGHT(CURRENT_DATE,5)<RIGHT(t2.`userBdate`,5)) AS userAge,\
				t2.`userStatus`,\
				t2.`userVisits`,\
				t2.`userLastActive`,\
				t2.`isBotOnline`\
			FROM `ctbl_userfavorite` AS t\
			LEFT JOIN `tbl_user` AS t2 ON t2.`userId` = t.`profileId`\
			WHERE t.`userId` = ? AND t2.`userRemoved` = 0\
			ORDER BY t.`id` DESC;\
		SELECT MAX(`userVisits`) AS max FROM `tbl_user`;", [userId],
        function (err, rows) {
          if (err) return rej("Error in Favorites.getFavorites: \n" + err);

          for (let i = 0; i < rows[0].length; i++) {
            rows[0][i].stars = Math.floor(rows[0][i].userVisits / rows[1][0].max * 5);

            if (rows[0][i].isBotOnline)
              rows[0][i].userLastActive = "online";
            else
              rows[0][i].userLastActive = Helper.getDateTimeSince(rows[0][i].userLastActive);

            rows[0][i] = Helper.handleUserName(rows[0][i]);
          }

          return res({users: rows[0]});
        });
    })
  },

  getFans(userId){
    return new Promise((res, rej) => {
      db.query("SELECT\
				t2.`userId`,\
				t2.`userNickname`,\
				t2.`userPhoto`,\
				(YEAR(CURRENT_DATE)-YEAR(t2.`userBdate`)) - (RIGHT(CURRENT_DATE,5)<RIGHT(t2.`userBdate`,5)) AS userAge,\
				t2.`userStatus`,\
				t2.`userVisits`,\
				t2.`userLastActive`,\
				t2.`isBotOnline`,\
				t3.`profileId` AS favorite\
			FROM `ctbl_userfavorite` AS t\
			LEFT JOIN `tbl_user` AS t2 ON t2.`userId` = t.`userId`\
			LEFT JOIN `ctbl_userfavorite` AS t3 ON t3.`profileId` = t.`userId` AND t3.`userId` = ?\
			WHERE t.`profileId` = ? AND t2.`userRemoved` = 0\
			ORDER BY t.`id` DESC;\
			SELECT MAX(`userVisits`) AS max FROM `tbl_user`;", [userId, userId],
        function (err, rows) {
          if (err) return rej("Error in Favorites.getFans: \n" + err);

          for (let i = 0; i < rows[0].length; i++) {

            rows[0][i].stars = Math.floor(rows[0][i].userVisits / rows[1][0].max * 5);

            if (rows[0][i].isBotOnline)
              rows[0][i].userLastActive = "online";
            else
              rows[0][i].userLastActive = Helper.getDateTimeSince(rows[0][i].userLastActive);

            rows[0][i] = Helper.handleUserName(rows[0][i]);
          }

          return res({users: rows[0]});
        });
    });
  },
};

module.exports = Favorites;
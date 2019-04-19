const db = require('./db');
const Helper = require('./helper');
const ErrorHandler = require('./errorHandler');
const STATUS = require('./status');

module.exports = {
  searchTraveller(sendOnce, data) {
    const self = this;
    // prepare incoming data
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;
    data.offset = data.offset ? data.offset : 0;

    self._getSearchTravellerSettings(data.userId, data)
      .then(data => self._getProfilesByAgeAndGender(data))
      // .then(data => self._getUserPlaces(data.userId, data))
      // .then(data => self._filterProfilesByPlaces(data))
      .then(data => self._filterSingleProfileByOffset(data))
      .then(data => self._getProfilePhotos(data.user.userId, data))
      .then(data => self._getProfileFavorites(data.userId, data.user.userId, data))
      .then(data => self._cleanUpData(data))
      .then(data => sendOnce(null, "searchUser", JSON.stringify(data)))
      .catch(err => sendOnce(null, 'searchUser', JSON.stringify(ErrorHandler(err))));
  },
  
  searchTravellerDating(sendOnce, data) {
    const self = this;
    // prepare incoming data
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;
    data.offset = data.offset ? data.offset : 0;

    self._getSearchTravellerSettings(data.userId, data)
      .then(data => self._getProfilesByAgeAndGenderDating(data))
      // .then(data => self._getUserPlaces(data.userId, data))
      // .then(data => self._filterProfilesByPlaces(data))
	  .then(data => self._saveAllProfiles(data))
      .then(data => self._filterSingleProfileByOffset(data))
      .then(data => self._getProfilePhotos(data.user.userId, data))
      .then(data => self._getProfileFavorites(data.userId, data.user.userId, data))
      .then(data => self._cleanUpData(data))
      .then(data => sendOnce(null, "searchUserDating", JSON.stringify(data)))
      .catch(err => sendOnce(null, 'searchUserDating', JSON.stringify(ErrorHandler(err))));
  },

  _getSearchTravellerSettings(userId, data) {
    return new Promise((res, rej) => {

      db.query("SELECT userSearchSettings FROM tbl_user WHERE userId = ?;",
        [userId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: 'Error occurs in SearchUser._getSearchTravellerSettings: ' + err
            });
          }

          if (!rows[0] || !rows[0].userSearchSettings || !rows[0].userSearchSettings.length) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: `Error occurs in SearchUser._getSearchTravellerSettings: searchSettings for user ${userId} is undefined`
            })
          }
          const {gender, place, ageFrom, ageTo, orientation} = JSON.parse(rows[0].userSearchSettings);

          // data must be first argument because settings.offset must overwrite data.offset
          return res({gender, place, ageFrom, ageTo, orientation, ...data});
        });
    });
  },

  // get all profiles matches selected age range and gender
  _getProfilesByAgeAndGender(data) {
    return new Promise((res, rej) => {
      const {userId, ageFrom, ageTo} = data;
      const gender = (data.gender && data.gender.length > 0) ? data.gender : [1, 2];

      db.query(
        'SELECT\
           t.userId,\
           t.userPhoto,\
           t.userNickname,\
           (YEAR(CURRENT_DATE) - YEAR(t.userBdate)) - (RIGHT(CURRENT_DATE, 5) < RIGHT(t.userBdate, 5)) AS userAge,\
           t.userRole,\
           t.userSearchShow,\
           t.userStatus,\
           t.userActive,\
           t.userCity,\
           t.userGenderId,\
           t2.paramEn AS userCountry, \
           t.userPayFor,\
		   t.userVerification,\
           (\
             SELECT GROUP_CONCAT(CONCAT(tuwv.id, ":", tuwv.place) SEPARATOR ", ")\
             FROM ctbl_user_want_to_visit AS tuwv\
             WHERE tuwv.userId = t.userId\
             GROUP BY tuwv.userId\
           ) AS userWantToVisit \
         FROM tbl_user AS t\
           LEFT JOIN tbl_param_country AS t2\
             ON t2.paramId = t.userCountryId\
         WHERE\
           userSearchShow = 1 AND \
           userApproved = 1 AND \
           userActive = 1 AND \
           userId != ? AND \
           userGenderId IN (?) \
         HAVING userAge >= ? AND userAge <= ?\
         ORDER BY userId DESC;',
        [userId, gender, ageFrom, ageTo],
        function (err, rows) {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: `Error occurs in SearchUser._getProfilesByAgeAndGender: ${err}`
            });
          }

          // pass rows further if exists
          if (rows.length > 0) {
            data._profiles = rows;
            return res(data);
          }

          // return false if empty result
          return rej({success: true, status: STATUS.NOT_FOUND, message: `users not found`, user: false});
        });
    });
  },

  // get all profiles matches selected age range and gender
  _getProfilesByAgeAndGenderDating(data) {
    return new Promise((res, rej) => {
      const {userId, ageFrom, ageTo} = data;
      const gender = (data.gender && data.gender.length > 0) ? data.gender : [1, 2];

      db.query(
        'SELECT\
           t.userId,\
           t.userPhoto,\
           t.userNickname,\
           (YEAR(CURRENT_DATE) - YEAR(t.userBdate)) - (RIGHT(CURRENT_DATE, 5) < RIGHT(t.userBdate, 5)) AS userAge,\
           t.userRole,\
           t.userSearchShow,\
           t.userStatus,\
           t.userActive,\
           t.userCity,\
           t.userGenderId,\
           t2.paramEn AS userCountry, \
           t.userPayFor,\
		   t.userVerification,\
           (\
             SELECT GROUP_CONCAT(CONCAT(tuwv.id, ":", tuwv.place) SEPARATOR ", ")\
             FROM ctbl_user_want_to_visit AS tuwv\
             WHERE tuwv.userId = t.userId\
             GROUP BY tuwv.userId\
           ) AS userWantToVisit, \
		   (SELECT GROUP_CONCAT(`userImagePath` SEPARATOR ",") FROM tbl_user_image AS ti WHERE ti.userId = t.userId LIMIT 0, 3) AS images, \
		   (SELECT COUNT(userId) FROM ctbl_userfavorite AS tf WHERE tf.userId = ? AND tf.profileId = t.userId) AS favorite \
         FROM tbl_user AS t\
           LEFT JOIN tbl_param_country AS t2\
             ON t2.paramId = t.userCountryId\
         WHERE\
           userSearchShow = 1 AND \
           userApproved = 1 AND \
           userActive = 1 AND \
           userId != ? AND \
		   userId NOT IN (SELECT `profileId` FROM `ctbl_userviewed` WHERE `userId` = ?) AND \
		   userId NOT IN (SELECT `profileId` FROM `ctbl_userfavorite` WHERE `userId` = ?) AND \
           userGenderId IN (?) \
         HAVING userAge >= ? AND userAge <= ?\
         ORDER BY userId DESC;',
        [userId, userId, userId, userId, gender, ageFrom, ageTo],
        function (err, rows) {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: `Error occurs in SearchUser._getProfilesByAgeAndGenderDating: ${err}`
            });
          }

          // pass rows further if exists
          if (rows.length > 0) {
            data._profiles = rows;
            return res(data);
          }

          // return false if empty result
          return rej({success: true, status: STATUS.NOT_FOUND, message: `users not found`, user: false});
        });
    });
  },
  
  // get places user wants to visit and place where he lives
  _getUserPlaces(userId, data) {
    return new Promise((res, rej) => {
      if (!userId) return res(data);

      db.query(
        'SELECT GROUP_CONCAT(CONCAT(tuwv.id, ":",  tuwv.place) SEPARATOR ", ") AS userWantsToVisit FROM ctbl_user_want_to_visit AS tuwv WHERE tuwv.userId = ?;\
         SELECT \
           t.userCity, \
           t_country.paramEn AS userCountry\
         FROM tbl_user AS t \
         LEFT JOIN tbl_param_country AS t_country ON t_country.paramId = t.userCountryId \
         WHERE userId = ?;',
        [userId, userId],
        function (err, rows) {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: `Error occurs in SearchUser._getUserPlaces: ${err}`
            });
          } else {
            // return error if user not found
            if (!rows[0].length && !rows[1].length) {
              return rej({
                success: true,
                status: STATUS.NOT_FOUND,
                message: `user ID:${userId} not found`,
                user: false
              });
            }

            if (rows[0].length) data._userWantsToVisit = rows[0][0].userWantsToVisit;

            if (rows[1].length) {
              data._userCity = rows[1][0].userCity;
              data._userCountry = rows[1][0].userCountry;
            }

            return res(data);
          }
        });
    });
  },

  // if "LivesIn" or "wants to visit" selected, filter profiles array by user's places he wants to visit
  _filterProfilesByPlaces(data) {
    const self = this;
    return new Promise((res, rej) => {
      // exit if user not selected any of places filters
      if (!data.userId || !data.place.length || !data._userWantsToVisit) return res(data);

      /**
       userWantToVisit.split(", ").forEach(function(row, i){
		    var item = row.split(":");
		    data-id=item[0];
        place-name=item[1];
		  })
       */
      const userPlacesArr = data._userWantsToVisit.split(', ');
      const userWantToVisit = userPlacesArr.map(row => row.split(':')[1]);

      // example if user search city: ['new york,united states']
      // example if user search country: ['united states,united states']
      // in any cases, we need to get first string for every array element
      const userWantToVisitPlaces = userWantToVisit.map(userPlaces => userPlaces.split(',')[0]);
      const searchStrangerWantsToVisitTheSameCity = data.place.includes(1);
      const searchStrangerLivesInCityIWantToVisit = data.place.includes(2);

      // loop over profiles array, search for profiles which city and country matches user's interests
      const filteredProfiles = data._profiles.filter(profile => {
        // check if profile lives in city user wants to visit
        if (searchStrangerLivesInCityIWantToVisit && profile.userCity) {
          for (let i = 0; i < userWantToVisitPlaces.length; i++) {
            if (userWantToVisitPlaces[i] === profile.userCity || userWantToVisitPlaces[i] === profile.userCountry) {
              return true;
            }
          }
        }

        // check if profile lives in the city\country user wants to visit
        if (searchStrangerWantsToVisitTheSameCity && profile.userWantToVisit) {
          for (let i = 0; i < userWantToVisitPlaces.length; i++) {
            if (profile.userWantToVisit.match(userWantToVisitPlaces[i])) return true;
          }
        }
      });

      // if profiles filtered by all this parameters exists, replace data._profiles with filtered array
      if (filteredProfiles.length > 0) {
        data._profiles = filteredProfiles;
        return res(data);
      }

      // return empty array and message if nobody found
      return rej({success: true, status: STATUS.NOT_FOUND, message: `Sorry, nobody found`, user: false});
    });
  },

  _saveAllProfiles(data) {
    return new Promise((res, rej) => {
      if(data.count) {
          data.profiles = data._profiles.splice(data.offset, data.count);
          for(var i=0; i<data.profiles.length; i++) {
            data.profiles[i] = Helper.handleUserName(data.profiles[i]);  
            if(data.profiles[i].images)
              data.profiles[i].images = data.profiles[i].images.split(",");
            else
              data.profiles[i].images = [];

			data.profiles[i].images = data.profiles[i].images.map(function(path) {
              return {path:path};
            });
          }
      }
        
      return res(data);
    })
  },
  
  // get only one profile from _filteredProfiles array
  // if offset exist (clicked "next" or "previous" button on frontend) consider it
  _filterSingleProfileByOffset(data) {
    return new Promise((res, rej) => {
      // sort profiles array by ID descending
      data._profiles.sort((a, b) => {
        return +b.userId - +a.userId;
      });

      // fix offset
      if (data.offset > (data._profiles.length - 1)) {
        data.offset = 0;
      }

      if (data.offset < (-(data._profiles.length - 1))) {
        data.offset = 0;
      }

      // get profile with offset if exists
      const profileOffset = data._profiles.splice(data.offset, 1);
      data.user = Helper.handleUserName(profileOffset[0]);
	  data.user.images = undefined;

      return res(data);
    })
  },

  // get profile photos
  _getProfilePhotos(profileId, data) {
    return new Promise((res, rej) => {
      db.query(
        'SELECT userImagePath AS path FROM tbl_user_image WHERE userId = ? LIMIT 0, 3;',
        [profileId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: `Error occurs in SearchUser._getProfilePhotos: ${err}`
            });
          }

          data.images = rows;
          return res(data);
        });
    });
  },

  // check if user or profile in favorites with each other
  _getProfileFavorites(userId, profileId, data) {
    return new Promise((res, rej) => {
      if (!userId) return res(data);

      db.query(
        'SELECT userId FROM ctbl_userfavorite WHERE userId = ? AND profileId = ?;',
        [userId, profileId],
        (err, rows) => {
          if (err) {
            return rej({
              success: false,
              status: STATUS.INTERNAL_ERROR,
              message: `Error occurs in SearchUser._getProfileFavorites: ${err}`
            });
          }

          data.user.favorite = rows.length;
          return res(data);
        });
    });
  },

  // if profile id specified on travellers page, get profile info
  getPreviewTraveller(sendOnce, data) {
    const self = this;
    data.userId = data.hash ? Helper.getIdByHash(data.hash) : false;

    self._getProfileInfoById(data.profileId, data)
      .then(data => self._getProfilePhotos(data.user.userId, data))
      .then(data => self._getProfileFavorites(data.userId, data.user.userId, data))
      .then(data => sendOnce(null, "searchUser", JSON.stringify(data)))
      .catch(err => ErrorHandler(err, sendOnce));
  },

  // get profile info by id
  _getProfileInfoById(profileId, data) {
    return new Promise((res, rej) => {
      db.query(
        'SELECT \
						t.userId,\
						t.userPhoto,\
						t.userNickname,\
						(YEAR(CURRENT_DATE)-YEAR(t.userBdate)) - (RIGHT(CURRENT_DATE,5)<RIGHT(t.userBdate,5)) AS userAge,\
						t.userStatus,\
						t.userPayFor,\
						t.userCity,\
						t2.paramEn AS userCountry,\
						(SELECT GROUP_CONCAT(CONCAT(tuwv.id, ":", tuwv.place) SEPARATOR ", ") FROM ctbl_user_want_to_visit AS tuwv WHERE tuwv.userId = t.userId  GROUP BY tuwv.userId) AS userWantToVisit \
					FROM tbl_user AS t\
					LEFT JOIN tbl_param_country AS t2 ON t2.paramId = t.userCountryId\
					WHERE \
					  t.userSearchShow = 1 AND \
            t.userApproved = 1 AND \
            t.userActive = 1 AND \
						t.userId = ? \
					LIMIT 0, 1;',
        [profileId],
        function (err, rows) {
          if (err) {
            return rej({code: 1, message: `occurs in SearchUser._getProfileInfoById: ${err}`});
          }

          // pass user further if exists
          if (rows.length > 0) {
            data.user = rows[0];
            return res(data);
          }

          // return false if empty result
          return rej({
            code: 2,
            socketEvent: 'searchUser',
            sendData: {success: true, message: `users not found`, user: false}
          });
        });
    });
  },

  // clean up working properties
  _cleanUpData(data) {
    return new Promise((res, rej) => {
      delete data.hash;
      delete data._userWantsToVisit;
      delete data._profiles;

      res(data);
    });
  },
};
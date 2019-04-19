const db = require('../models/db');
const Helper = require('../models/helper');
const User = require('../models/user');

module.exports = {
	authenticate: (req, res, next) => {
		let userId;

		// get profile hash for photo upload for models account
    if(req.cookies.editProfileHash){
      req.params.editProfileHash = Helper.getIdByHash(req.cookies.editProfileHash);
    }
		
		if(req.cookies.hash && (userId = Helper.getIdByHash(req.cookies.hash))) {
			db.query("SELECT \
					t_user.*, \
					CAST(t_user.`userBdate` as CHAR(10)) AS bDate, \
					t_country.paramEn AS userCountry,\
					(SELECT GROUP_CONCAT(CONCAT(tuwv.`id`, ':', tuwv.`place`) SEPARATOR ', ') FROM `ctbl_user_want_to_visit` AS tuwv WHERE tuwv.`userId` = t_user.`userId`  GROUP BY tuwv.`userId`) AS 'userWantToVisit' \
				FROM `tbl_user` AS t_user \
				LEFT JOIN tbl_param_country AS t_country ON t_user.userCountryId = t_country.paramId\
				WHERE `userId` = ?;\
				SELECT * FROM tbl_places_popular;",
				[userId],
			function(err, rows){
				if(err || rows[0].length == 0) {
					console.log("Error authenticate userId = " + userId + "\n");
					return res.redirect('/login');
				}
				else {
					const user = rows[0][0];

					User.updateActiveTime(user.userId);
					
					req.params.userId = user.userId;
					req.params.userRole = user.userRole;

					res.locals.userId = user.userId;
					res.locals.userEmail = user.userEmail;
					res.locals.userPass = user.userPass;
					res.locals.userBdate = user.userBdate;
					res.locals.bDate = user.bDate.split("-");
					res.locals.userGenderId = user.userGenderId;
					res.locals.userNickname = user.userNickname;
					res.locals.userPhoto = user.userPhoto;
					res.locals.userCity = user.userCity;
					res.locals.userCountry = user.userCountry;
					res.locals.userWantToVisit = user.userWantToVisit;
					res.locals.userSearchSettings = user.userSearchSettings;

					if (user.userBdate != "0000-00-00"){
						res.locals.userAge = Helper.getAge(new Date(user.userBdate));
					}

          const popularPlaces = rows[1];
					res.locals.popularPlaces = popularPlaces;

					next();
				}
			});
		}
		else {
			if(req.path == "/")
				res.render('landing', {page: 'landing'});
			else
				return res
					.cookie('requestedPage', req.path, {maxAge: (86400 * 1000)})
					.redirect('/login');
		}
	}
};
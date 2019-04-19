const io = require('socket.io');
const http = require('http');
const request = require('request');
const md5 = require('md5');
const path = require('path');
const windows1251 = require('windows-1251');
const fs = require("fs");
const im = require('imagemagick');

const db = require('./db');
const Helper = require('./helper');
const Mailer = require('./mailer');
const Html_letters = require('./html_letters');
const User = require('./user');
const Favorites = require('./favorites');
const Post = require('./post');
const Image = require('./image');
const Chat = require('./chat');

module.exports = {
	userLogin: function (send, data) {
		db.query("SELECT `userId`, `userConfirm`, `userSearchSettings` FROM `tbl_user` WHERE `userEmail` LIKE ? AND `userPass` = ?;", [data.email, md5(data.pass)], function (err, rows) {
			if (err)
				console.log('Error in Auth.userLogin #1\n' + err);
			else {
				if (rows[0]) {
					// if(rows[0].userConfirm == 1)
					var result = {
						"success": true,
						"hash": Helper.getHashById(rows[0].userId),
						"search": rows[0].userSearchSettings
					}
					/* else
						var result = {"success":false, "error":"Your E-mail has not been confirmed. To confirm, click on the link sent to you in the E-mail to the email address specified during registration!"}; */
				}
				else
					var result = { "success": false, "error": "Wrong login or password!" };

				send(null, 'userLogin', JSON.stringify(result));
			}
		});
	},

	passportLogin: function (send, data) {
		db.query("SELECT * FROM `tbl_user` WHERE `" + data.network + "Id` = " + data.id + ";", function (err, rows) {
			if (err)
				console.log('Error in Auth.passportLogin #3\n' + err);
			else if (rows.length > 0) {
				var user = rows[0];

				if (!user[data.network + "Id"] || !user[data.network + "AccessToken"] || !user[data.network + "RefreshToken"])
					db.query("UPDATE `tbl_user` SET `" + data.network + "Id` = ?, `" + data.network + "AccessToken` = ?, `" + data.network + "RefreshToken` = ?, `" + data.network + "` = ? WHERE `userId` = ?;", [data.id, data.accessToken, data.refreshToken, data.stringData, user.userId]);

				if (data.returnData) {
					if (user.userBdate && user.userBdate != "0000-00-00")
						var age = Helper.getAge(new Date(user.userBdate));
					else
						var age = false;

					send({
						userId: user.userId,
						userNickname: user.userNickname,
						userPhoto: user.userPhoto,
						userAge: age,
						userRole: user.userRole,
						hash: Helper.getHashById(user.userId),
						success: true
					});
				}
				else
					send(Helper.getHashById(user.userId), "login");
			}
			else {
				db.query("INSERT INTO `tbl_user` \
				(`userEmail`, `userPhoto`, `userName`, `userLastName`, `userBdate`, `userGenderId`, `" + data.network + "Id`, `" + data.network + "AccessToken`, `" + data.network + "RefreshToken`, `" + data.network + "`, `registeredFrom`) VALUES \
				(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'app', 'igotlike')",
					[((data.verified) ? data.email : ""), data.photo, data.first_name, data.last_name, data.birthday, data.gender, data.id, data.accessToken, data.refreshToken, data.stringData],
					function (err, res) {
						if (err)
							console.log('Error in Auth.passportLogin #4\n' + err);
						else {
							if (data.returnData) {
								if (data.birthday && data.birthday != "0000-00-00")
									var age = Helper.getAge(new Date(data.birthday));
								else
									var age = false;

								send({
									userId: res.insertId,
									userEmail: ((data.verified) ? data.email : ""),
									userNickname: data.first_name,
									userPhoto: data.photo,
									userAge: age,
									userRole: 1,
									hash: Helper.getHashById(res.insertId),
									search: "",
									success: true
								});

								// follow by id1
								Favorites.addOrRemove(res.insertId, 1);

								// send admin chat message
								Chat.sendAdminMessage(res.insertId);
							}
							else
								send(Helper.getHashById(res.insertId), "register");
						}
					});
			}
		});
	},

	fbLogin: function (send, data) {
		var birthday = (data.birthday) ? data.birthday.split("/") : false;
		if (birthday)
			data.birthday = birthday[2] + "-" + birthday[0] + "-" + birthday[1];

		var obj = {
			network: "facebook",
			id: data.id,
			email: (data.email) ? data.email : "",
			verified: (data.email && data.verified) ? true : false,
			photo: (data.picture && data.picture.data && data.picture.data.url) ? data.picture.data.url : "",
			first_name: data.first_name,
			last_name: data.last_name,
			gender: (data.gender == "male") ? 2 : 1,
			birthday: (data.birthday) ? data.birthday : "",
			accessToken: (data.accessToken) ? data.accessToken : "",
			refreshToken: (data.refreshToken) ? data.refreshToken : "",
			stringData: JSON.stringify(data),
			returnData: false
		}

		this.passportLogin(send, obj);
	},

	googleLogin: function (send, data) {
		var birthday = (data.birthday) ? data.birthday.split("-") : false;
		if (!birthday || birthday.length != 3)
			data.birthday = "";

		var obj = {
			network: "googleplus",
			id: data.id,
			email: "",
			verified: true,
			photo: (data.image && data.image.url) ? data.image.url : "",
			first_name: data.name.givenName,
			last_name: data.name.familyName,
			gender: (data.gender == "male") ? 2 : 1,
			birthday: data.birthday,
			accessToken: (data.accessToken) ? data.accessToken : "",
			refreshToken: (data.refreshToken) ? data.refreshToken : "",
			stringData: JSON.stringify(data),
			returnData: false
		}
		for (var i = 0; i < data.emails.length; i++)
			if (data.emails[i].type == "account")
				obj.email = data.emails[i].value;

		if (!obj.email)
			obj.verified = false;

		this.passportLogin(send, obj);
	},

	twitterLogin: function (send, data) {
		var obj = {
			network: "twitter",
			id: data.id_str,
			email: "",
			verified: false,
			photo: data.profile_image_url,
			first_name: data.name,
			last_name: "",
			gender: 0,
			birthday: "0000-00-00",
			accessToken: (data.accessToken) ? data.accessToken : "",
			refreshToken: (data.refreshToken) ? data.refreshToken : "",
			stringData: JSON.stringify(data),
			returnData: false
		}

		this.passportLogin(send, obj);
	},

	instagramLogin: function (send, data) {
		var user = data.data;
		var obj = {
			network: "instagram",
			id: user.id,
			email: "",
			verified: false,
			photo: user.profile_picture,
			first_name: user.username,
			last_name: "",
			gender: 0,
			birthday: "0000-00-00",
			accessToken: (data.accessToken) ? data.accessToken : "",
			refreshToken: (data.refreshToken) ? data.refreshToken : "",
			stringData: JSON.stringify(user),
			returnData: false
		}

		this.passportLogin(send, obj);
	},

	// авторизация через соцсети с приложения
	authTokenLogin: function (send, data) {
		var self = this;

		if (data.network == "facebook") {
			var FB = require('fb');
			FB.api('me', { fields: ['id', 'name', 'first_name', 'last_name', 'gender', 'picture', 'verified', 'email', 'birthday'], access_token: data.token }, function (res) {
				var birthday = (res.birthday) ? res.birthday.split("/") : false;
				if (birthday)
					res.birthday = birthday[2] + "-" + birthday[0] + "-" + birthday[1];

				var obj = {
					network: "facebook",
					id: res.id,
					email: (res.email) ? res.email : "",
					verified: (res.email && res.verified) ? true : false,
					// photo: (res.picture && res.picture.data && res.picture.data.url) ? res.picture.data.url : "",
					photo: "",
					first_name: res.first_name,
					last_name: res.last_name,
					gender: (res.gender == "male") ? 1 : 2,
					birthday: (res.birthday) ? res.birthday : "",
					ip: data.ip,
					stringData: JSON.stringify(res),
					accessToken: "",
					refreshToken: "",
					returnData: true
				};

				self.passportLogin(function (result) {
					send(null, 'authLogin', JSON.stringify(result));
				}, obj);

				// send(null, 'authTokenLogin', JSON.stringify(obj));
			});
		}
		else if (data.network == "google") {
			request.get({
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				url: "https://www.googleapis.com/plus/v1/people/me?access_token=" + data.token + "&key=AIzaSyCLeRZcItsBXF9Wy19E4VR54sACOWEmt_c",
				form: {}
			}, function (err, response, res) {
				if (err)
					console.log("Error in Auth.authTokenLogin #1\n" + err);
				else {
					res = JSON.parse(res);

					var birthday = (res.birthday) ? res.birthday.split("-") : false;
					if (!birthday || birthday.length != 3)
						res.birthday = "";

					var obj = {
						network: "googleplus",
						id: res.id,
						email: "",
						verified: true,
						// photo: (res.image && res.image.url) ? res.image.url : "",
						photo: "",
						first_name: res.name.givenName,
						last_name: res.name.familyName,
						gender: (res.gender == "male") ? 1 : 2,
						birthday: res.birthday,
						ip: data.ip,
						stringData: JSON.stringify(res),
						accessToken: "",
						refreshToken: "",
						returnData: true
					}
					for (var i = 0; i < res.emails.length; i++)
						if (res.emails[i].type == "account")
							obj.email = res.emails[i].value;

					if (!obj.email)
						obj.verified = false;

					self.passportLogin(function (result) {
						send(null, 'authLogin', JSON.stringify(result));
					}, obj);

					// send(null, 'authTokenLogin', JSON.stringify(obj));
				}
			});
		}
		else if (data.network == "twitter") {
			var Twit = require('twit');

			var T = new Twit({
				consumer_key: "uZn5GEGnOwOPzkKs1XIIj1WSc",
				consumer_secret: "FKRYGERxSWancHWfFa06VWcr6LyFjFuFf8gAB4K929bwxipyDU",
				access_token: data.token,
				access_token_secret: data.token_secret,
				timeout_ms: 5 * 1000,  // optional HTTP request timeout to apply to all requests.
			});

			T.get('account/verify_credentials', { skip_status: true }).catch(function (err) {
				console.log("Error in Auth.authTokenLogin #2\n" + err.stack);
			}).then(function (result) {
				var res = result.data;

				var obj = {
					network: "twitter",
					id: res.id_str,
					email: "",
					verified: false,
					// photo: res.profile_image_url,
					photo: "",
					first_name: res.name,
					last_name: "",
					gender: 0,
					birthday: "0000-00-00",
					ip: data.ip,
					stringData: JSON.stringify(res),
					accessToken: "",
					refreshToken: "",
					returnData: true
				}

				self.passportLogin(function (result) {
					send(null, 'authLogin', JSON.stringify(result));
				}, obj);

				// send(null, 'authTokenLogin', JSON.stringify(obj));
			})
		}
	},

	passportLoginNew: function (send, data) {
		db.query("SELECT * FROM `tbl_user` WHERE `" + data.network + "Id` = '" + data.networkId + "';", function (err, rows) {
			if (err)
				console.log('Error in Auth.passportLoginNew #1\n' + err);
			else if (rows.length > 0) {
				var user = rows[0];

				if (user.userBdate && user.userBdate != "0000-00-00")
					var age = Helper.getAge(new Date(user.userBdate));
				else
					var age = false;

				send(null, 'authLogin', JSON.stringify({
					userId: user.userId,
					userNickname: user.userNickname,
					userPhoto: user.userPhoto,
					userAge: age,
					userRole: user.userRole,
					hash: Helper.getHashById(user.userId),
					success: true
				}));
			}
			else if (data.email != "") {
				db.query("SELECT * FROM `tbl_user` WHERE `userEmail` LIKE ?;", [data.email], function (err, rows) {
					if (err)
						console.log('Error in Auth.passportLoginNew #2\n' + err);
					else if (rows.length > 0) {
						var user = rows[0];

						if (user.userBdate && user.userBdate != "0000-00-00")
							var age = Helper.getAge(new Date(user.userBdate));
						else
							var age = false;

						send(null, 'authLogin', JSON.stringify({
							userId: user.userId,
							userNickname: user.userNickname,
							userPhoto: user.userPhoto,
							userAge: age,
							userRole: user.userRole,
							hash: Helper.getHashById(user.userId),
							success: true
						}));

						db.query("UPDATE `tbl_user` SET `" + data.network + "Id` = ?, `" + data.network + "` = ? WHERE `userId` = ?;", [data.networkId, JSON.stringify(data), user.userId], function (err, res) {
							if (err)
								console.log('Error in Auth.passportLoginNew #3\n' + err);
						});
					}
					else
						send(null, 'authTokenLoginNew', JSON.stringify(data));
				});
			}
			else
				send(null, 'authTokenLoginNew', JSON.stringify(data));
		});
	},

	// авторизация через соцсети с приложения
	authTokenLoginNew: function (send, data) {
		var self = this;

		if (data.network == "facebook") {
			var FB = require('fb');
			FB.api('me', { fields: ['id', 'name', 'first_name', 'last_name', 'gender', 'picture', 'verified', 'email', 'birthday'], access_token: data.token }, function (res) {
				var birthday = (res.birthday) ? res.birthday.split("/") : false;
				if (birthday)
					res.birthday = birthday[2] + "-" + birthday[0] + "-" + birthday[1];

				var obj = {
					network: "facebook",
					networkId: res.id,
					email: (res.email) ? res.email : "",
					verified: (res.email && res.verified) ? true : false,
					first_name: res.first_name,
					last_name: res.last_name,
					gender: (res.gender == "male") ? 1 : 2,
					birthday: (res.birthday) ? res.birthday : "",
					networData: JSON.stringify(res)
				};

				self.passportLoginNew(send, obj);
			});
		}
		else if (data.network == "google") {
			request.get({
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				url: "https://www.googleapis.com/plus/v1/people/me?access_token=" + data.token + "&key=AIzaSyCLeRZcItsBXF9Wy19E4VR54sACOWEmt_c",
				form: {}
			}, function (err, response, res) {
				if (err)
					console.log("Error in Auth.authTokenLoginNew #1\n" + err);
				else {
					res = JSON.parse(res);

					var birthday = (res.birthday) ? res.birthday.split("-") : false;
					if (!birthday || birthday.length != 3)
						res.birthday = "";

					var obj = {
						network: "googleplus",
						networkId: res.id,
						email: "",
						verified: true,
						first_name: res.name.givenName,
						last_name: res.name.familyName,
						gender: (res.gender == "male") ? 1 : 2,
						birthday: res.birthday,
						networData: JSON.stringify(res)
					}
					for (var i = 0; i < res.emails.length; i++)
						if (res.emails[i].type == "account")
							obj.email = res.emails[i].value;

					if (!obj.email)
						obj.verified = false;

					self.passportLoginNew(send, obj);
				}
			});
		}
		else if (data.network == "twitter") {
			var Twit = require('twit');

			var T = new Twit({
				consumer_key: "uZn5GEGnOwOPzkKs1XIIj1WSc",
				consumer_secret: "FKRYGERxSWancHWfFa06VWcr6LyFjFuFf8gAB4K929bwxipyDU",
				access_token: data.token,
				access_token_secret: data.token_secret,
				timeout_ms: 5 * 1000,  // optional HTTP request timeout to apply to all requests.
			});

			T.get('account/verify_credentials', { skip_status: true }).catch(function (err) {
				console.log("Error in Auth.authTokenLoginNew #2\n" + err.stack);
			}).then(function (result) {
				var res = result.data;

				var obj = {
					network: "twitter",
					networkId: res.id_str,
					email: "",
					verified: false,
					first_name: res.name,
					last_name: "",
					gender: 0,
					birthday: "0000-00-00",
					networData: JSON.stringify(res)
				}

				self.passportLoginNew(send, obj);
			});
		}
	},

	userRegister: function (send, data) {
		var result = { "error": false, "success": false };
		var myRe = /^[-0-9A-z_\.]{1,20}@[-0-9A-z_^\.]{1,20}\.[A-z]{2,4}$/i;
		var myRe2 = /^[-0-9A-z_\.]+$/i;
		if (!myRe.test(data.email))
			result.error = { "field": "userEmail", "text": "Wrong E-mail format." };
		else if (!myRe2.test(data.nickname))
			result.error = { "field": "useNickname", "text": "Nick must be unique without spaces and may consist of latin letters, numbers, and characters as: dot, dash, underscore. For example: User_234" };
		else if (data.pass.length < 4)
			result.error = { "field": "userPass", "text": "The password must be at least 4 characters long.." };
		else if (data.pass != data.passRepeat)
			result.error = { "field": "userPassRepeat", "text": "Passwords must match." };

		if (result.error == false) {
			db.query("CALL `userRegister` (?, ?, ?);", [data.nickname, data.email, md5(data.pass)], function (err, rows) {
				if (err)
					console.log('Error in Auth.userRegister #2\n' + err);
				else {
					if (rows[0][0].uId > 0) {
						var key = md5(rows[0][0].uId + "=>" + data.email);
						var domain = 'https://m.airybay.com';
						var url = 'https://m.airybay.com/confirm/' + rows[0][0].uId + '/' + key;

						Mailer.sendMessage({
							"to": data.email,
							"subject": "Confirm registration",
							"html": 'Hello!<br><br> You have just registered on  <a href="' + domain + '"> m.airybay.com </a> site. \
   To log in to your account, you must first verify your email by clicking the link below, or copy and paste it into your browser:<br>\
   <a href="' + url + '">' + url + '</a><br><br> Yours sincerely, the administration of the site.'
						});

						result = {
							userId: rows[0][0].uId,
							userNickname: data.nickname,
							userPhoto: "/img/guestAva.png",
							userAge: 0,
							userRole: 1,
							hash: Helper.getHashById(rows[0][0].uId),
							search: "",
							success: true,
							error: false
						};

						// follow by id1
						Favorites.addOrRemove(result.userId, 1);

						// send admin chat message
						Chat.sendAdminMessage(result.userId);
					}
					else if (rows[0][0].uId == 0)
						result.error = { "field": "userEmail", "text": "This E-mail is already registered." };
					else if (rows[0][0].uId == -1)
						result.error = { "field": "userEmail", "text": "This Nickname is already registered." };

					send(null, 'userRegister', JSON.stringify(result));
				}
			});
		}
		else
			send(null, 'userRegister', JSON.stringify(result));
	},

	isUserExist: function (send, data) {
		db.query("SELECT `userId` FROM `tbl_user` WHERE `userEmail` = ? LIMIT 1;\
			SELECT `userId` FROM `tbl_user` WHERE `userNickname` = ? LIMIT 1;", [data.email, data.nickname], function (err, rows) {
				if (err)
					console.log("Error in Auth.isUserExist #1\n" + err);
				else {
					var result = { emailExist: false, nicknameExist: false };

					if (rows[0].length > 0)
						result.emailExist = true;
					if (rows[1].length > 0)
						result.nicknameExist = true;

					send(null, 'isUserExist', JSON.stringify(result));
				}

			});
	},

	userRegisterFull: function (send, data) {
		var result = { "error": false, "success": false };

		data.day = parseInt(data.day);
		data.mounth = parseInt(data.mounth);
		data.year = parseInt(data.year);
		data.searchSettings.ageTo = parseInt(data.searchSettings.ageTo);
		data.searchSettings.ageFrom = parseInt(data.searchSettings.ageFrom);

		if (!data.pass)
			data.pass = data.passRepeat = Math.random() * 100000000;

		var myRe = /^[-0-9A-z_\.]{1,20}@[-0-9A-z_^\.]{1,20}\.[A-z]{2,4}$/i;
		var myRe2 = /^[-0-9A-z_\.]+$/i;
		if (!myRe.test(data.email))
			result.error = { "field": "userEmail", "text": "Wrong E-mail format." };
		else if (!myRe2.test(data.nickname))
			result.error = { "field": "userNickname", "text": "Nick must be unique without spaces and may consist of latin letters, numbers, and characters as: dot, dash, underscore. For example: User_234" };
		else if (data.pass.length < 4)
			result.error = { "field": "userPass", "text": "The password must be at least 4 characters long.." };
		else if (data.pass != data.passRepeat)
			result.error = { "field": "userPassRepeat", "text": "Passwords must match." };
		else if (data.gender != 1 && data.gender != 2)
			result.error = { "field": "userGenderId", "text": "Choose your sex: Male \\ Female" };
		else if (data.day < 1 || data.day > 31 || data.mounth < 1 || data.mounth > 12 || data.year < 1918 || data.year > 2018)
			result.error = { "field": "userBdate", "text": "Enter your birth date: DD\\MM\\YEAR" };
		else if (!data.searchSettings.gender.length)
			result.error = { "field": "searchGender", "text": "Whom do you want to find: female / male" };
		else if (!data.searchSettings.ageTo || !data.searchSettings.ageFrom)
			result.error = { "field": "searchAge", "text": "Choose age of your partner search" };
		else if (!data.photo || data.photo.length === 0)
			result.error = { "field": "photo", "text": "Please provide your photo" };
		else if (!data.livesIn || !data.livesIn.city || !data.livesIn.countryName)
			result.error = { "field": "livesIn", "text": "Choose city where you live" };
		/* else if (!data.placeToVisit || data.placeToVisit.length === 0)
			result.error = { "field": "field", "text": "Choose city you want to visit" }; */
		else if (!parseInt(data.payFor))
			result.error = { "field": "payFor", "text": "Select \"PAYING CAPACITY\" option" };

		if (result.error == false) {
			db.query("SELECT `userId` FROM `tbl_user` WHERE `userEmail` = ? LIMIT 1;\
				SELECT `userId` FROM `tbl_user` WHERE `userNickname` = ? LIMIT 1;", [data.email, data.nickname],
				function (err, rows) {
					if (err) {
						result.error = { "field": "sql", "text": "System error!" };
						console.log("Error in Auth.userRegisterFull #1\n" + err);
					}
					else if (rows[0].length)
						result.error = { "field": "userEmail", "text": "This E-mail is already registered." };
					else if (rows[0].length)
						result.error = { "field": "userEmail", "text": "This Nickname is already registered." };

					if (result.error == false) {
						var bDate = data.year + "-" + data.mounth + "-" + data.day;
						data.searchSettings.place = [];

						db.query("INSERT INTO `tbl_user` (`userNickname`, `userEmail`, `userPass`, `userPhoto`, `userGenderId`, `userBdate`, `userSearchSettings`, `userActive`, `userPayFor`, `userFrom`, `registeredFrom`) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'igotlike');",
							[data.nickname, data.email, md5(data.pass), data.photo, data.gender, bDate, JSON.stringify(data.searchSettings), ((data.payFor) ? data.payFor : 0), ((data.from) ? data.from : 'app')],
							function (err, res) {
								if (err) {
									result.error = { "field": "sql", "text": "System error!" };
									console.log("Error in Auth.userRegisterFull #2\n" + err);
								}
								else {
									const userId = res.insertId;

									im.identify('./public' + data.photo, function (err, features) {
										if (err)
											console.log("Error in Auth.userRegisterFull #4\n" + err);

										Post.add({ userId, images: [{ path: data.photo, width: features.width, height: features.height }] })
											.catch(err => console.log(err));
									});

									// insert city and country where user lives
									User.addUserRegion(send, { userId, ...data.livesIn });

									// insert places user wants to visit
									// const placesArr = data.placeToVisit.map(place => {
									// const formattedPlace = place.toLowerCase().replace(/\s*,\s*/g, ",");
									// return '(' + userId + ',"' + formattedPlace + '")';
									// });

									// const placesSql = placesArr.join(',');
									// db.query('INSERT INTO ctbl_user_want_to_visit (userId, place) VALUES ' + placesSql, (err, rows) => {
									// if (err)
									// console.log("Error in Auth.userRegisterFull - insert places\n" + err);
									// });


									// send mail
									const key = md5(userId + "=>" + data.email);
									const domain = 'https://m.airybay.com';
									const url = 'https://m.airybay.com/confirm/' + userId + '/' + key;

									Mailer.sendMessage({
										"to": data.email,
										"subject": "Confirm registration",
										"html": 'Hello!<br><br> You have just registered on  <a href="' + domain + '"> m.airybay.com </a> site. \
									To log in to your account, you must first verify your email by clicking the link below, or copy and paste it into your browser:<br>\
									<a href="' + url + '">' + url + '</a><br><br> Yours sincerely, the administration of the site.'
									});

									// follow by id1
									Favorites.addOrRemove(userId, 663090);

									// send admin chat message
									Chat.sendAdminMessage(userId);

									if (data.network) {
										db.query("UPDATE `tbl_user` SET `" + data.network + "Id` = ?, `" + data.network + "` = ? WHERE `userId` = ?;",
											[data.networkId, data.networData, userId],
											function (err, res) {
												if (err)
													console.log("Error in Auth.userRegisterFull #3\n" + err);

												send(null, 'authLogin', JSON.stringify({
													userId: userId,
													userNickname: data.nickname,
													userPhoto: data.photo,
													userAge: Helper.getAge(new Date(bDate)),
													userRole: 1,
													hash: Helper.getHashById(userId),
													success: true
												}));
											});
									}
									else {
										// send result back to client
										result = {
											success: true,
											error: false,
											userId: userId,
											userNickname: data.nickname,
											userPhoto: data.photo,
											userAge: Helper.getAge(new Date(bDate)),
											userRole: 1,
											hash: Helper.getHashById(userId),
											search: JSON.stringify(data.searchSettings),
											placeToVisit: data.placeToVisit,
										};

										send(null, 'userRegisterFull', JSON.stringify(result));
									}
								}
							});
					}
					else
						send(null, 'userRegisterFull', JSON.stringify(result));
				});
		} else
			send(null, 'userRegisterFull', JSON.stringify(result));

	},

	userConfirm: function (callback, data) {
		db.query("SELECT * FROM `tbl_user` WHERE `userId` = ?;", [data.userId], function (err, rows) {
			if (err)
				console.log('Error in Auth.userConfirm #1\n' + err);
			else {
				var hash = false;

				if (rows[0]) {
					var key = md5(rows[0].userId + "=>" + rows[0].userEmail);
					if (key == data.key) {
						hash = Helper.getHashById(rows[0].userId);
						db.query("UPDATE `tbl_user` SET `userConfirm` = '1' WHERE `userId` = ?;", [rows[0].userId]);
					}
				}
				callback(hash);
			}
		});
	},

	userResetPassword: function (send, data) {
		db.query("SELECT * FROM `tbl_user` WHERE `userEmail` LIKE ?", [data.email], function (err, rows) {
			if (err)
				console.log('Error in Auth.userResetPassword #1\n' + err);
			else {
				if (rows.length) {
					var code = md5(rows[0].userId + "-" + rows[0].userEmail + "-" + rows[0].userRegister);

					Html_letters.getResetPasswordMessage({ receiverName: rows[0].userNickname, code: code }, function (html) {
						Mailer.sendMessage({
							"to": rows[0].userEmail,
							"subject": "Reset password",
							"text": "Hello,\n\n\
You have requested reset of the password.\n\
Please copy following code into the app:\n\
" + code + "\n\
If you didn't request the password reset, ignore the message.\n\n\
Thank you.",
							"html": html
						});
					});

					send(null, 'userResetPassword', JSON.stringify({ error: false }));
				}
				else
					send(null, 'userResetPassword', JSON.stringify({ error: true }));
			}
		});
	},

	userChangePassword: function (send, data) {
		if (data.pass.length < 4)
			send(null, 'userChangePassword', JSON.stringify({ error: "The password must be at least 4 characters long." }));
		else {
			db.query("SELECT * FROM `tbl_user` WHERE `userEmail` LIKE ?;", [data.email], function (err, rows) {
				if (err)
					console.log("Error in Auth.userChangePassword #1\n" + err);
				else {
					if (rows[0]) {
						var key = md5(rows[0].userId + "-" + rows[0].userEmail + "-" + rows[0].userRegister);

						if (key == data.key) {
							db.query("UPDATE `tbl_user` SET `userPass` = ? WHERE `userId` = ?;", [md5(data.pass), rows[0].userId], function (err, res) {
								if (err)
									console.log("Error in Auth.userChangePassword #2\n" + err);
								else
									send(null, 'userChangePassword', JSON.stringify({
										"hash": Helper.getHashById(rows[0].userId),
										error: false
									}));
							});
						}
						else
							send(null, 'userChangePassword', JSON.stringify({ error: "Invalid key" }));
					}
					else
						send(null, 'userChangePassword', JSON.stringify({ error: "Invalid key" }));
				}
			});
		}
	}
};
const db = require('./db');
const Helper = require('./helper');

module.exports = {
	updateUserLatLng: function (send, data) {
		db.query("UPDATE `tbl_user` SET `userLocationLat` = ?, `userLocationLng` = ? WHERE `userId` = ?;", [data.lat, data.lng, data.userId], function (err, res) {
			if(err)
				console.log("Error in Location.updateUserLatLng #1\n" + err);
			else
				send(null, "updateUserLatLng", JSON.stringify({success: true}));
		});
	}, 
	
	getObjectInZone: function (send, data) {
		var self = this;
		
		db.query('SELECT \
			t.`userId`, \
			t.`userNickname`, \
			t.`userPhoto`, \
			t.`userBdate`, \
			t.`userCity`, \
			t.`userLocationLat`, \
			t.`userLocationLng`, \
			t.`userVerification`, \
			t2.`id` AS inFavorite, \
			t3.`paramEn` AS userCountry \
		FROM `tbl_user` AS t \
		LEFT JOIN `ctbl_userfavorite` AS t2 ON t2.`userId` = ? AND t2.`profileId` = t.`userId` \
		LEFT JOIN `tbl_param_country` AS t3 ON t3.`paramId` = t.`userCountryId` \
		WHERE \
			t.`userActive` = 1 AND \
			t.`userRemoved` = 0 AND \
			t.`userShowInMap` = 1 AND \
			t.`userLocationLat` != 0 AND \
			t.`userLocationLng` != 0;', [data.userId], 
		function (err, rows) {
			if (err)
				console.log("Error in Location.getObjectInZone #1\n" + err);
			else {
				var users = [];
				for(var i=0; i<rows.length; i++) {
					if(self.inZone(rows[i].userLocationLat, rows[i].userLocationLng, data.lat1, data.lng1, data.lat2, data.lng2, data.lat3, data.lng3, data.lat4, data.lng4)) {
						rows[i] = Helper.handleUserName(rows[i]);
						
						if(rows[i].userBdate && rows[i].userBdate != "0000-00-00")
							rows[i].userAge = Helper.getAge(new Date(rows[i].userBdate));
						else
							rows[i].userAge = false;
						
						if(rows[i].userCity)
							rows[i].userCity = rows[i].userCity.charAt(0).toUpperCase() + rows[i].userCity.substr(1);
						
						if(rows[i].userCountry)
							rows[i].userCountry = rows[i].userCountry.charAt(0).toUpperCase() + rows[i].userCountry.substr(1);
						
						users.push(rows[i]);
					}
				}
				
				send(null, "getObjectInZone", JSON.stringify({users:users}));
			}
		});
	}, 
	
	getFollowingInZone: function (send, data) {
		var self = this;
		
		db.query('SELECT \
			t2.`userId`, \
			t2.`userNickname`, \
			t2.`userPhoto`, \
			t2.`userBdate`, \
			t2.`userCity`, \
			t2.`userLocationLat`, \
			t2.`userLocationLng`, \
			t2.`userVerification`, \
			t3.`paramEn` AS userCountry\
		FROM `ctbl_userfavorite` AS t\
		LEFT JOIN `tbl_user` AS t2 ON t2.`userId` = t.`userId`\
		LEFT JOIN `tbl_param_country` AS t3 ON t3.`paramId` = t2.`userCountryId` \
		WHERE \
			t.`profileId` = ? AND \
			t2.`userActive` = 1 AND \
			t2.`userRemoved` = 0 AND \
			t2.`userShowInMap` = 1 AND \
			t2.`userLocationLat` != 0 AND \
			t2.`userLocationLng` != 0;', [data.userId], 
		function (err, rows) {
			if (err)
				console.log("Error in Location.getFollowingInZone #1\n" + err);
			else {
				var users = [];
				for(var i=0; i<rows.length; i++) {
					if(self.inZone(rows[i].userLocationLat, rows[i].userLocationLng, data.lat1, data.lng1, data.lat2, data.lng2, data.lat3, data.lng3, data.lat4, data.lng4)) {
						rows[i] = Helper.handleUserName(rows[i]);
						
						if(rows[i].userBdate && rows[i].userBdate != "0000-00-00")
							rows[i].userAge = Helper.getAge(new Date(rows[i].userBdate));
						else
							rows[i].userAge = false;
						
						if(rows[i].userCity)
							rows[i].userCity = rows[i].userCity.charAt(0).toUpperCase() + rows[i].userCity.substr(1);
						
						if(rows[i].userCountry)
							rows[i].userCountry = rows[i].userCountry.charAt(0).toUpperCase() + rows[i].userCountry.substr(1);
						
						users.push(rows[i]);
					}
				}
				
				send(null, "getFollowingInZone", JSON.stringify({users:users}));
			}
		});
	}, 
	
	inZone: function(lat, lng, lat1, lng1, lat2, lng2, lat3, lng3, lat4, lng4) {
		var a = (lng2 - lng1) * lat + (lat1 - lat2) * lng + lng1 * lat2 - lat1 * lng2;
		var b = (lng3 - lng2) * lat + (lat2 - lat3) * lng + lng2 * lat3 - lat2 * lng3;
		var c = (lng4 - lng3) * lat + (lat3 - lat4) * lng + lng3 * lat4 - lat3 * lng4;
		var d = (lng1 - lng4) * lat + (lat4 - lat1) * lng + lng4 * lat1 - lat4 * lng1;
		
		// console.log(a, b, c, d);
		
		if(a <=0 && b <=0 && c<= 0 && d <= 0 )
			return true;
		else
			return false;
	}, 
	
	getAllMapObject: function (send, data) {
		var self = this;
		
		db.query('SELECT \
			t.`userId`, \
			t.`userNickname`, \
			t.`userPhoto`, \
			t.`userBdate`, \
			t.`userCity`, \
			t.`userLocationLat`, \
			t.`userLocationLng`, \
			t.`userVerification`, \
			t2.`id` AS inFavorite, \
			t3.`paramEn` AS userCountry \
		FROM `tbl_user` AS t \
		LEFT JOIN `ctbl_userfavorite` AS t2 ON t2.`userId` = ? AND t2.`profileId` = t.`userId` \
		LEFT JOIN `tbl_param_country` AS t3 ON t3.`paramId` = t.`userCountryId` \
		WHERE \
			t.`userActive` = 1 AND \
			t.`userRemoved` = 0 AND \
			t.`userShowInMap` = 1 AND \
			t.`userLocationLat` != 0 AND \
			t.`userLocationLng` != 0;', [data.userId], 
		function (err, rows) {
			if (err)
				console.log("Error in Location.getObjectInZone #1\n" + err);
			else {
				var users = [];
				for(var i=0; i<rows.length; i++) {
					rows[i] = Helper.handleUserName(rows[i]);
					rows[i].distance = self.getDistance(data.lat, data.lng, rows[i].userLocationLat, rows[i].userLocationLng);
				}
				
				while(rows.length) {
					var min = 0;
					for (var i = 1; i<rows.length; i++) {
						if(rows[min].distance > rows[i].distance)
							min = i;
					}
					rows[min].distance = undefined;
					users.push(rows[min]);
					rows.splice(min, 1);
				}
				
				send(null, "getAllMapObject", JSON.stringify({users:users}));
			}
		});
	}, 
	
	getDistance: function(lat, lng, lat2, lng2) {
		var a = lat2 - lat;
		var b = lng2 - lng;
		return a * a + b * b;
	}
};
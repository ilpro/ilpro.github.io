'use strict';

var db = require('./db');
var Helper = require('./helper');

module.exports = {
	getAllUsers: function(send) {
		db.query("SELECT t.`userId` \
			FROM `tbl_user` AS t \
			ORDER BY t.`userId` DESC;",
		function(err, rows) {
			if(err)
				send(err);
			else
				send(null, rows);
		});
	}, 
	getSearchUsers: function(send) {
		db.query("SELECT t.`userId` \
			FROM `tbl_user` AS t \
			WHERE t.`userSearchShow` = 1 AND t.`userActive` = 1 AND `userApproved` = 1 \
			ORDER BY t.`userId` DESC;",
		function(err, rows) {
			if(err)
				send(err);
			else
				send(null, rows);
		});
	}, 
	getPopularBoys: function(send) {
		db.query("SELECT `userId`, `userNickname`, `userPhoto`, `userBdate`, `userVerification` FROM `tbl_user` WHERE `userGenderId` = 2 AND `userInFeed` = 1 AND `userRemoved` = 0;",
		function(err, rows) {
			if(err)
				send(err);
			else {
				for(var i=0; i<rows.length; i++) {
					rows[i] = Helper.handleUserName(rows[i]);
					
					if (rows[i].userBdate != "0000-00-00")
						rows[i].userAge = Helper.getAge(rows[i].userBdate);
					else
						rows[i].userAge = 1000;
					
					rows[i].inFavorite = 0;
				}
				send(null, rows);
			}
		});
	}, 
	getPopularGirls: function(send) {
		db.query("SELECT `userId`, `userNickname`, `userPhoto`, `userBdate`, `userVerification` FROM `tbl_user` WHERE `userGenderId` = 1 AND `userInFeed` = 1 AND `userRemoved` = 0;",
		function(err, rows) {
			if(err)
				send(err);
			else {
				for(var i=0; i<rows.length; i++) {
					rows[i] = Helper.handleUserName(rows[i]);
					
					if (rows[i].userBdate != "0000-00-00")
						rows[i].userAge = Helper.getAge(rows[i].userBdate);
					else
						rows[i].userAge = 1000;
					
					rows[i].inFavorite = 0;
				}
				send(null, rows);
			}
		});
	}, 
	getPopularPostsBoys: function(send) {
		db.query("SELECT \
	t2.`postId`, \
	t2.`userId`, \
	CONCAT('@', t3.`userNickname`) AS userNickname, \
	t3.`userPhoto`, \
	t3.`userVerification`, \
	t4.`userImagePath` AS image, \
	t5.`path` AS video, \
	t5.`thumbPath` AS videoThumb, \
	COUNT(t.`postId`) AS likes, \
	t2.`time` \
FROM `tbl_user_post_like` AS t \
LEFT JOIN `tbl_user_post` AS t2 ON t2.`postId` = t.`postId` \
LEFT JOIN `tbl_user` AS t3 ON t3.`userId` = t2.`userId` \
LEFT JOIN `tbl_user_image` AS t4 ON t4.`postId` = t.`postId` \
LEFT JOIN `tbl_user_video` AS t5 ON t5.`postId` = t.`postId` \
WHERE t3.`userGenderId` = 2 AND t3.`userInFeed` = 1 AND t3.`userRemoved` = 0 AND (t4.`userImagePath` IS NOT NULL OR t5.`path` IS NOT NULL) \
GROUP BY t.`postId` \
ORDER BY t2.`time` DESC \
LIMIT 0, 100",
		function(err, rows) {
			if(err)
				send(err);
			else {
				for(var i=0; i<rows.length; i++) {
					var dateObj = new Date(rows[i].time);
					rows[i].time = dateObj.getDate() + "." + (dateObj.getMonth() + 1) + "." + dateObj.getFullYear() + " at " + ((dateObj.getHours() < 10) ? "0" : "") + dateObj.getHours() + ":" + ((dateObj.getMinutes() < 10) ? "0" : "") + dateObj.getMinutes();
				}
				send(null, rows);
			}
		});
	}, 
	getPopularPostsGirls: function(send) {
		db.query("SELECT \
	t2.`postId`, \
	t2.`userId`, \
	CONCAT('@', t3.`userNickname`) AS userNickname, \
	t3.`userPhoto`, \
	t3.`userVerification`, \
	t4.`userImagePath` AS image, \
	t5.`path` AS video, \
	t5.`thumbPath` AS videoThumb, \
	COUNT(t.`postId`) AS likes, \
	t2.`time` \
FROM `tbl_user_post_like` AS t \
LEFT JOIN `tbl_user_post` AS t2 ON t2.`postId` = t.`postId` \
LEFT JOIN `tbl_user` AS t3 ON t3.`userId` = t2.`userId` \
LEFT JOIN `tbl_user_image` AS t4 ON t4.`postId` = t.`postId` \
LEFT JOIN `tbl_user_video` AS t5 ON t5.`postId` = t.`postId` \
WHERE t3.`userGenderId` = 1 AND t3.`userInFeed` = 1 AND t3.`userRemoved` = 0 AND (t4.`userImagePath` IS NOT NULL OR t5.`path` IS NOT NULL) \
GROUP BY t.`postId` \
ORDER BY t2.`time` DESC \
LIMIT 0, 100",
		function(err, rows) {
			if(err)
				send(err);
			else {
				for(var i=0; i<rows.length; i++) {
					var dateObj = new Date(rows[i].time);
					rows[i].time = dateObj.getDate() + "." + (dateObj.getMonth() + 1) + "." + dateObj.getFullYear() + " at " + ((dateObj.getHours() < 10) ? "0" : "") + dateObj.getHours() + ":" + ((dateObj.getMinutes() < 10) ? "0" : "") + dateObj.getMinutes();
				}
				send(null, rows);
			}
		});
	}
}
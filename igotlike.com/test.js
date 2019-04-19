/* const redis = require("ioredis");
const Redis = redis.createClient(6379, '127.0.0.1');

Redis.get("getPopularBoys", function (err, result) {
	console.log(result)
}); */

const db = require('./models/db');

/* db.query("SELECT userId, userSearchSettings FROM `tbl_user` WHERE `userSearchSettings` NOT LIKE '%place%'", function(err, rows){
	for(var i=0; i<rows.length; i++) {
		var obj = {};
		if(rows[i].userSearchSettings) {
			obj = JSON.parse(rows[i].userSearchSettings);
			obj.place = [];
		}
		else 
			obj = {gender: [ 1, 2 ], ageFrom: 18, ageTo: 50, place: []};
		
		db.query("UPDATE `tbl_user` SET `userSearchSettings` = ? WHERE `userId` = ?;", [JSON.stringify(obj), rows[i].userId]);
	}
}) */

/* db.query('SELECT userId, userSearchSettings FROM `tbl_user` WHERE `userSearchSettings` LIKE \'%place":"1%\'', function(err, rows){
	for(var i=0; i<rows.length; i++) {
		var obj = {};
		obj = JSON.parse(rows[i].userSearchSettings);
		obj.place = obj.place.split(",");
		for(var j=0; j<obj.place.length; j++)
			obj.place[j] = parseInt(obj.place[j]);
		
		db.query("UPDATE `tbl_user` SET `userSearchSettings` = ? WHERE `userId` = ?;", [JSON.stringify(obj), rows[i].userId]);
	}
}) */
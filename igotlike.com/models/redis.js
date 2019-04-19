var redis = require("ioredis");
var Redis = redis.createClient(6379, '127.0.0.1');

var db = require('./db');
var Helper = require('./helper');

module.exports = {
  getPopularUsers: function (data, send) {
		db.query("SELECT `userGenderId` FROM `tbl_user` WHERE `userId` = ?;", [data.userId], function (err, rows) {
			if(err){
				console.log("Error in Redis.getPopularUsers #1\n" + err);
				send([]);
			}
			else if(!rows.length)
				send([]);
			else {
				if(rows[0].userGenderId == 0)
					send([]);
				else {
					var key = (rows[0].userGenderId == 1) ? "getPopularBoys" : "getPopularGirls";
					Redis.get(key, function (err, result) {
						if(err) {
							console.log("Error in Redis.getPopularUsers #2\n" + err);
							send([]);
						}
						else {
							result = Helper.shuffleArray(JSON.parse(result));
							result.splice(10, (result.length - 10));
							send(result);
						}
					});
				}
			}
		});
	}
}
'use strict';

const Redis = require("ioredis");
const redis_client = Redis.createClient(6379, '127.0.0.1');

const Cache = require('./models/cache');

let ready = 0;

var intervalId = setInterval(function(){
	if(ready == 0) {
		clearInterval(intervalId);
		process.exit(0);
	}
}, 1000);

ready += 1;
Cache.getAllUsers(function(err, data){
	if(!err)
		redis_client.set("getAllUsers", JSON.stringify(data));
	else
		console.log(err);
	ready -= 1;
});

ready += 1;
Cache.getSearchUsers(function(err, data){
	if(!err)
		redis_client.set("getSearchUsers", JSON.stringify(data));
	else
		console.log(err);
	ready -= 1;
});

ready += 1;
Cache.getPopularBoys(function(err, data){
	if(!err)
		redis_client.set("getPopularBoys", JSON.stringify(data));
	else
		console.log(err);
	ready -= 1;
});

ready += 1;
Cache.getPopularGirls(function(err, data){
	if(!err)
		redis_client.set("getPopularGirls", JSON.stringify(data));
	else
		console.log(err);
	ready -= 1;
});

ready += 1;
Cache.getPopularPostsBoys(function(err, data){
	if(!err)
		redis_client.set("getPopularPostsBoys", JSON.stringify(data));
	else
		console.log(err);
	ready -= 1;
});

ready += 1;
Cache.getPopularPostsGirls(function(err, data){
	if(!err)
		redis_client.set("getPopularPostsGirls", JSON.stringify(data));
	else
		console.log(err);
	ready -= 1;
});
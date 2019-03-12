var dataSocket = io.connect('https://www.youproud.com:7000');
var notifications = new Notifications(dataSocket);
var feed = new Feed(dataSocket);
var INITIALIZED = false;

dataSocket.on('connect', function(){
	console.log('open');
	// isConnectedToSocket = true;
	var cookieHash = getCookie("hash");
	if(cookieHash) {
		// console.log(cookieHash);
		dataSocket.emit('updateAuthClient', {hash:cookieHash});

		if(!INITIALIZED){
			notifications.init();
			feed.init();
			INITIALIZED = true;
		}
	}
});

dataSocket.on('disconnect', function(){
	console.log('close');
	// isConnectedToSocket = false;
});
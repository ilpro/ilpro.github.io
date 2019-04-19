var dataSocket = io.connect('https://igotlike.com:6050');

// class definitions
// var notifications = new Notifications(dataSocket);

dataSocket.on('connect', function(){
	console.log('open');
	// isConnectedToSocket = true;
	var cookieHash = getCookie("hash");
	if(cookieHash) {
		// console.log(cookieHash);
		dataSocket.emit('updateAuthClient', {hash:cookieHash});

		// init notifications for load messages count
		// notifications.init(cookieHash);
	}
});

dataSocket.on('disconnect', function(){
	console.log('close');
	// isConnectedToSocket = false;
});

dataSocket.on('userCash', function(data){
	data = JSON.parse(data);
	$(".side-menu .richments").text(data.userCash);
});
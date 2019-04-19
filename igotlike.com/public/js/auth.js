'use strict';

/** Global user variables **/
var userHash = getCookie("hash");
var userInfo = false; // there will be info with name, lastname, nickname and photo
var userAuthLink = false;

/** Get user info **/
if(userHash) {
  dataSocket.emit('getUserAuthInfo', JSON.stringify({"hash":userHash}));
}


/** Receiving user info **/
dataSocket.on('getUserAuthInfo', function (data) {
	data = JSON.parse(data);
	
	if(data.success) {
		userInfo = data;
		
		// $("#header__user-info .userPhoto").attr("src", data.userPhoto);
		// $("#header__user-info .userName").text("@" + data.userName);
	}
	else {
		deleteCookie("hash");
		window.location.href = "/login";
	}
});

var search = (getCookie("search")) ? JSON.parse(getCookie("search")) : {};
if(search.residence && search.gender && search.ageFrom && search.ageTo) {
	$(".side-menu-item.settings-item").css("display", "");
}

/** Wait until user info will be received **/
function launchAfterUserInfoReceived (f, params, context) {
	var self = this;

	if(userHash && !userInfo) {
		setTimeout(function (){
			launchAfterUserInfoReceived(f, params, context)
		}, 50);
	} else {
		if(params) {
			if(context) {
				f.call(context, params);
			} else {
				f(params);
			}
		} else {
			f();
		}
	}
}

$(".close-cross").click(function(){
	$(".main-page").show();
	$(".page-login-register").hide();
})

/***** Show login on button click ****/
$(".login-link, .login-item").click(function(e){
	e.preventDefault();
	$('.page-login-register, .page-login-register .form-body').hide();
	$('.page-login-register, .page-login-register .form-body.login').show();
});
$(".registration-link").click(function(e){
	e.preventDefault();
	$('.page-login-register, .page-login-register .form-body').hide();
	$('.page-login-register, .page-login-register .form-body.register').show();
});


/* Login */
$(".form-body .login-button").click(function(e){
	e.preventDefault();
	dataSocket.emit('userLogin', JSON.stringify({
		"email"	: $(".form-body.login .email-input").val(),
		"pass"	: $(".form-body.login .password-input").val(),
	}));
});

dataSocket.on('userLogin', function (data) {
	data = JSON.parse(data);
	
	if (data.success) {
		userHash = data.hash;
		setCookie("hash", userHash, {"path": "/", "expires": 31536000});
		var prevPage = getCookie("requestedPage");
		document.location.href = (prevPage) ? prevPage : "/profile";
		
		// if(data.search)
		// 	setCookie("search", data.search, {"path": "/", "expires": 31536000});
		//
		// if(userAuthLink)
		// 	window.location.href = userAuthLink;
		// else {
		// 	$(".login-item, .page-login-register").hide();
		// 	// $('.page-login-register .form-body').hide();
		// 	// $('.page-login-register .form-body.pick-filter').show();
		// }
		//
		// dataSocket.emit('getUserAuthInfo', {"hash":userHash});
	}
	else
		alert(data.error);
});


/* Register */
$(".form-body .register-button").click(function(e){
	e.preventDefault();
	dataSocket.emit('userRegister', JSON.stringify({
		"nickname"		: $(".form-body.register .nickname-input").val(),
		"email"			: $(".form-body.register .email-input").val(),
		"pass"			: $(".form-body.register .password-input").val(),
		"passRepeat"	: $(".form-body.register .password-confirm-input").val()
	}));
});

dataSocket.on('userRegister', function (data) {
	data = JSON.parse(data);
	
	if (data.success) {
		setTimeout(function(){
			// alert("You are successfully registered! Please, confirm your email address in order to enter your profile. You will receive a letter with confirmation link to your email in term of 10 minutes, follow the link to confirm! If you do not see the letter, please, check the spam box.");
			alert("You are successfully registered! You will be automatically authorized right now!");
			
			userHash = data.hash;
			setCookie("hash", userHash, {"path": "/", "expires": 31536000});
			
			window.location.href = "/";
		}, 100);
	}
	else 
		alert(data.error.text);
});

/** Social networks **/
function socLogin(token) {
  dataSocket.emit('userSocLogin', {"token":token});
}

// Confirm user
// if(urlHash.getState("page") == "confirm-user") {
	// dataSocket.emit('userConfirm', {"uid":urlHash.getState("uid"), "key":urlHash.getState("key")});
// }

// dataSocket.on('userConfirm', function (data) {
	// if (data.success) {
		// alert("Вы успешно подтвердили почту. Сейчас вы будете автоматически авторизированны!");
		// urlHash.removeState(["page", "uid", "key"]);
		// userLogin(data);
	// }
	// else
		// alert('Ошибка подтверждения почты. Напишите нам об этом в разделе "инфо"!');
// });
'use strict';

/** Global user variables **/
var userHash = getCookie("hash");
var userInfo = false; // there will be info with name, lastname, nickname and photo
var realUserId = false; // first state of user ID, not model
var userAuthLink = false;
var showRefillNotification = false;
var registerRequest = false;

/** getUserAuthInfo **/
if (userHash) {
  dataSocket.emit('getUserAuthInfo', JSON.stringify({"hash": userHash}));
  $('.show-for-registered').show(); // show elements for registered users
}
dataSocket.on('getUserAuthInfo', function (data) {
  data = JSON.parse(data);
  userLogin(data.user);
});


/** Login **/
function userLogin(data) {
  userInfo = data;
  userHash = data.hash;
  realUserId = data.userId;

  setCookie("hash", userHash, {"path": "/", "expires": 31536000});

  $(".header-info-user p").text(data.userName);
  if (data.userPhoto)
    $(".header-info-user img").attr("src", data.userPhoto);
  
  var newImg = new Image();
  newImg.onload = function () {
	$(".header-info").show();
  }
  newImg.src = data.userPhoto;
}

/** landing, landing-part EJS **/
$(".btn-log").click(function(e) {
  e.preventDefault();
  dataSocket.emit('userLogin', JSON.stringify({
    "email": $(".lg-form-email-input").val(),
    "pass": $(".lg-form-password-input").val(),
  }));
});

dataSocket.on('userLogin', function (data) {
  data = JSON.parse(data);

  if (data.success) {
    userLogin(data);

    var modelId = getCookie("modelId");
    if (modelId)
      window.location.href = "/profile/" + modelId;
    else
      window.location.href = "/";
  }
  else {
    showAlertModal(data.error);
  }
});

// Confirm user
if (window.location.pathname == "/" && urlHash.getState("uid"))
  dataSocket.emit('userConfirm', JSON.stringify({"uid": urlHash.getState("uid"), "key": urlHash.getState("key")}));

dataSocket.on('userConfirm', function (data) {
  data = JSON.parse(data);

  if (data.success) {
    showAlertModal("You have successfully confirmed your e-mail address! You will be automatically authorized right now!");
	setCookie("hash", data.hash, {"path": "/", "expires": 31536000});
	$("#alert-modal-confirm").on("click", function(){
		if(getCookie("hash"))
			window.location.href = "/";
	});
  }
  else
    showAlertModal('E-mail confirmation error occurred. Please, contact us for details!');
});

// userLogout
$(".logout").click(function(){
	deleteCookie("hash");
	deleteCookie("search");
	window.location.href = "/";
});

/** Logout not found user **/
dataSocket.on('userLogout', function (data) {
  deleteCookie("hash");
  window.location.href = "/";
});

if(window.location.pathname != "/registration" && getCookie("registrationData")) {
	deleteCookie("hash");
	window.location.href = "/registration";
}

/** Check cookie or add new cookie **/
checkFirstTimeVisit();
function checkFirstTimeVisit() {
  // if dating page open with user profile
  var firstTimeVisitId = getCookie("firstTimeVisitDatingId");

  // if cookie exists and user logged in
  if (firstTimeVisitId && userHash) {
    // and delete cookie
    deleteCookie("firstTimeVisitDatingId");
    return;
  }

  // waiting when user log in
  if (firstTimeVisitId && !userHash) {
    return;
  }

  // if user has no cookie
  if (!firstTimeVisitId) {
    // if user authorized and hasn't cookie it means this is old user, exit
    if (userHash) return;

    var myRe = /^#\/preview\/([0-9]+)$/g;
    var matches = myRe.exec(window.location.hash);
    // return if dating page not open
    if (matches === null) return;

    // if dating page opens, save profileId from string like "/#/preview/237"
    var profileId = matches[1];

    // set profile Id fo 1 year and waits for registration
    setCookie("firstTimeVisitDatingId", profileId, {"path": "/", "expires": 31536000});
    return;
  }
}

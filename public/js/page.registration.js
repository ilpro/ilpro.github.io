$('.gender-container').click(function(){
    $('.gender-container').removeClass('active');
    $(this).addClass('active');
});

var $uploadPhotoArea = $(".photos-wrapper div");
$uploadPhotoArea.upload({
	action: "/feed/upload-image",
	postKey: "image", 
	maxSize: 15728640, 
	label: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106 106"><defs><style>.aa,.cc{fill:none;}.aa{stroke:#747474;}.bb{stroke:none;}</style></defs><g transform="translate(-475.41 -353.5)"><rect class="aa" width="105" height="105" rx="4" transform="translate(475.91 354)"/><g transform="translate(-104.09 142)"><g class="aa" transform="translate(594 226)"><circle class="bb" cx="38" cy="38" r="38"/><circle class="cc" cx="38" cy="38" r="37.5"/></g><g transform="translate(613 245)"><line class="aa" x2="38" transform="translate(0 19)"/><line class="aa" y1="38" transform="translate(19)"/></g></g></g></svg>'
});

// обрезать изображение для главного фото
var jcropApi;
var jcropX = 0;
var jcropY = 0;
var jcropX2 = 100;
var jcropY2 = 100;
function cropevent(c){
	if(parseInt(c.w) > 0){
		var rx = 150 / c.w;
		var ry = 150 / c.h;
		
		$(".fs-upload img").css({
			width: Math.round(rx * $(".jcrop-holder img").width()) + "px", 
			height: Math.round(ry * $(".jcrop-holder img").height()) + "px", 
			marginLeft: "-" + Math.round(rx * c.x) + "px", 
			marginTop: "-" + Math.round(ry * c.y) + "px"
		});
		
		if(c.x < 0) jcropX = 0; else jcropX = Math.floor(c.x);
		if(c.y < 0) jcropY = 0; else jcropY = Math.floor(c.y);
		if(c.x2 < 0) jcropX2 = 0; else jcropX2 = Math.floor(c.x2);
		if(c.y2 < 0) jcropY2 = 0; else jcropY2 = Math.floor(c.y2);
	}
}

var $cropBody = $(".user-crop-photo-modal");
$uploadPhotoArea.on("filecomplete", function(obj, file, res){
	var data = JSON.parse(res);
	if(!data.img.success) return alert(data.img.message);

	$(".fs-upload").css("padding", 0).html('<img src="' + data.img.path + '">');
	$cropBody.prepend('<img src="' + data.img.path + '" alt="crop photo">');
	
	var newImg = new Image();
    newImg.onload = function () {
        $(".user-crop-photo-modal-layout").addClass("active");
		jcropApi = $.Jcrop($cropBody.find("img"), {
			bgColor		: 'white',
			bgOpacity	: 0.3,
			aspectRatio	: 1,
			minSize		: [300, 300],
			setSelect	: [0, 0, 300, 300],
			onChange	: cropevent,
			onSelect	: cropevent
		});
    }
    newImg.src = data.img.path;
});

var networkData = getCookie("registrationData");
if(networkData) {
	networkData = JSON.parse(networkData);
	
	networkData.birthday = networkData.birthday.split("-");
	
	$(".form-reg-new .nickname-input").val(networkData.first_name);
	
	$(".form-reg-new .b-day-input").val(parseInt(networkData.birthday[2]));
	$(".form-reg-new .b-mounth-input").val(parseInt(networkData.birthday[1]));
	$(".form-reg-new .b-year-input").val(parseInt(networkData.birthday[0]));
	
	$(".form-reg-new .gender-container[data-id=" + networkData.gender + "]").addClass("active");
}

$(".user-crop-photo-modal-layout .close, .user-crop-photo-modal-layout .shadow, .user-crop-photo-modal-layout button").click(function(){
	$(".user-crop-photo-modal-layout").removeClass("active");
	jcropApi.destroy();
});

var regProcessing = false;
$(".form-reg-new .btn-register").click(function(){
	if(!$("#terms-agree").is(':checked'))
		showAlertModal("Please agree with Temrs & Conditions!");
	else if(!regProcessing) {
		regProcessing = true;

		var orientation = [];
		$(".form-reg-new .cust_box :checked").each(function(a, b){
			orientation.push($(this).val());
		});
		
		dataSocket.emit('userRegister', JSON.stringify({
			"photo": $(".photos-wrapper img").attr("src"),
			"crop": [jcropX, jcropY, jcropX2, jcropY2],
			"nickname": $(".form-reg-new .nickname-input").val(),
			"email": $(".form-reg-new .email-input").val(),
			"password": $(".form-reg-new .password-input").val(),
			"passRepeat": $(".form-reg-new .password-confirm-input").val(),
			"bDay": $(".form-reg-new .b-day-input").val(),
			"bMounth": $(".form-reg-new .b-mounth-input").val(),
			"bYear": $(".form-reg-new .b-year-input").val(),
			"userLivesIn": {countryName: userCountry, city: userCity},
			"gender": $(".form-reg-new .gender-container.active").data("id"),
			"specifically": $(".form-reg-new .specifically").val(),
			"orientation": orientation, 
			"networkData": networkData, 
			"from": getCookie("userFrom"), 
			"referer": getCookie("userReferer")
		}));
	}
});

dataSocket.on('userRegister', function (data) {
  regProcessing = false;
  data = JSON.parse(data);

  if (data.success) {
    // sendGoogleEventRegistration();
	deleteCookie("registrationData");
	setCookie("hash", data.hash, {"path": "/", "expires": 31536000});
	showAlertModal("You are successfully registered! You will be automatically authorized right now!");
	setTimeout(function(){
		window.location.href = "/";
	}, 3000);
  }
  else {
    $(".form-reg-new").find(".nickname-input, .email-input, .password-input, .password-confirm-input").parent().removeClass("error");
	
	for(var i=0; i<data.error.length; i++) {
		if(["nickname", "email", "password", "password-confirm"].indexOf(data.error[i].field) != -1)
			$(".form-reg-new ." + data.error[i].field + "-input").parent().addClass("error");
		else
			break;
	}
	
	showAlertModal(data.error[0].text);
  }
});

function sendGoogleEventRegistration() {
  // check cookie
  var firstTimeRegister = getCookie("firstTimeRegister");

  // if user already registered earlier, exit
  if (!firstTimeRegister) {
    // send google event
    ga('send', 'event', 'registration', 'main_form');

    // set cookie for 1 year
    setCookie("firstTimeRegister", true, {"path": "/", "expires": 31536000});
  }
};
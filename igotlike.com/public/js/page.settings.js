dataSocket.emit('checkSocialKeys', JSON.stringify({hash:userHash, keysList: ['all']}));
dataSocket.off('checkSocialKeys').on('checkSocialKeys', function (data) {
    data = JSON.parse(data);
    var checkActions = {
        'facebook': 'fb',
        'twitter': 'twitter',
        'instagram': 'insta'
    };
    for(var i in data.status){
        if (data.status[i] === 'success'){
            $(".settings-soc-buttons .settings-soc-btn." + checkActions[i]).addClass("active").find("span").text("Вийти");
        }
    }
});

$(".settings-soc-buttons .settings-soc-btn").each(function () {
    var socTitle = $(this).attr('data-name');
    $(this).off("click").on("click", function () {
        if($(this).hasClass("active")){
            $(this).removeClass("active").find("span").text("Увійти");
            dataSocket.emit('clearSocialKeys', JSON.stringify({hash:userHash, keysList: [socTitle]}));
        } else {
            if (socTitle === 'instagram'){
                openPromotionPopup("views/instagram-login.html", "Instagram");
            } else{
                $(this).addClass("active").find("span").text("Вийти");
                window.location.href = '/auth/' + socTitle;
            }
        }
    });
    dataSocket.off('clearSocialKeys').on('clearSocialKeys', function (data) {
        data = JSON.parse(data);
        for(var i in data.status){
            if (data.status[i] === 'success'){
                console.log('Logout from' + i.capitalize());
            } else if (data.status[i] === 'error'){
                console.log('Error during logout from' + i.capitalize());
            }
        }
    });
});

dataSocket.off('checkInstagramLoginData').on('checkInstagramLoginData', function (data) {
    data = JSON.parse(data);
    if (data.message === "finalized") {
        $(".settings-soc-buttons .settings-soc-btn.insta").addClass("active").find("span").text("Вийти");
        console.log('Loged into Instagram');
    }
});

// $(".social-profile-number").inputmask("+38 (099) 999-99-99");


dataSocket.emit('getSocialContacts', JSON.stringify({hash:userHash}));
dataSocket.off('getSocialContacts').on('getSocialContacts', function (data) {
    data = JSON.parse(data);
    if (+data.hasTelegram === 1){
        $("#hasTelegram").attr("checked", true);
    }
    if (+data.hasViber === 1){
        $("#hasViber").attr("checked", true);
    }
    if (+data.hasWhatsapp === 1){
        $("#hasWhatsapp").attr("checked", true);
    }
    $("input.social-profile-link").add("input.social-profile-number").add("input.social-profile-mail").each(function () {
        var inputName = $(this).data('link');
        if(data[inputName] !== null){
            $(this).val(data[inputName])
        }
    })
});

dataSocket.off('updateUserSocialContacts').on('updateUserSocialContacts', function (data) {
    data = JSON.parse(data);
    if (data.message === "success") {
        showNotify("success", 'Збережено');
    }
});

var timeoutSocInput = false;
$(".settings-soc input.social-profile-link, .settings-soc input.social-profile-number, .settings-soc input.social-profile-mail").on('input',function(){
    clearTimeout(timeoutSocInput);

    timeoutSocInput = setTimeout((function(input) {
        return function () {
            dataSocket.emit('updateUserSocialContacts', JSON.stringify({
                "hash"	: userHash,
                "key"	: $(input).data("link"),
                "value": $(input).val()
            }));
        }
    }(this)), 1000);
});

$("#hasViber, #hasTelegram, #hasWhatsapp").on('click',function(){
    dataSocket.emit('updateUserSocialContacts', JSON.stringify({
        "hash"	: userHash,
        "key"	: $(this).attr("name"),
        "value"	: (($(this).is(':checked')) ? 1 : 0)
    }));
});




$(".settings-language input[name=userLanguage]").change(function(){
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash,
		"key"	: "userLanguage",
		"value"	: $(this).val()
	}));
});

$('#userPublicProfile, #showMyComments').change(function(){
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash, 
		"key"	: $(this).attr("name"), 
		"value"	: ($(this).is(":checked")) ? 1 : 0
	}));
});

var $uploadBtn = $(".photos-wrapper .fs-upload-target");
$uploadBtn.ajaxUpload({
	url : "/profile/upload-image", 
	name: "image", 
	onSubmit: function() {
		return true;
	}, 
	onComplete: function(res) {
		var html = '<div class="single-photo to-main">\
	<img class="profile-img" src="' + res + '" alt="profile image">\
</div>';
		$uploadBtn.before(html);
		$(".photos-wrapper .to-main:last").trigger("click");
		
		return true;
	}
});

$(".photos-wrapper").on("click", ".to-main", function(){
	var croppicContainerPreloadOptions = {
		uploadUrl:'/profile/upload-image',
		cropUrl:'/profile/cropimage',
		loadPicture:$(this).closest(".single-photo").find(".profile-img").attr("src"),
		enableMousescroll:true,
		doubleZoomControls:true,
		rotateControls: false,
		loaderHtml:'<div class="loader bubblingG"><span id="bubblingG_1"></span><span id="bubblingG_2"></span><span id="bubblingG_3"></span></div> ',
		onReset:function(){
			$(".modal-wrapper").hide();
		},
		onAfterImgCrop:function(result){
			$(".modal-wrapper").hide();
			$(".user-avatar img").attr("src", result.url);
			$('input[name=userPhoto]').val(result.url);
			$(".userPhoto").removeClass("not");
		},
		onError:function(errormessage){
			console.log('onError:'+errormessage);
		}
	}
	var cropContainerPreload = new Croppic('croppic-modal', croppicContainerPreloadOptions);
	$(".modal-wrapper").show();
});

// удалить изображение
/* $(".photos-wrapper").on("click", ".to-trash", function(){
	dataSocket.emit('deleteUserImage', {
		"hash"	: getCookie("hash"), 
		"image"	: $(this).closest(".single-photo").find(".profile-img").attr("src")
	});
	return false;
});
dataSocket.on('deleteUserImage', function (data) {
	$(".profile-img[src='"+data.image+"']").parent().animate({
		width: 0,
		height: 0,
		opacity: 0
	}, 200, function () {
		this.remove();
	})
}); */

/* Dating Conditions */
$('#userWantToDate, select[name="userResidenceId"], select[name="userGenderId"]').change(function(){
	var key = $(this).attr("name");
	
	if(key == "userWantToDate")
		var val = ($(this).is(":checked")) ? 1 : 0;
	else
		var val = $(this).val();
	
	if(val)
		$("." + key).removeClass("not");
	else
		$("." + key).addClass("not");
	
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash, 
		"key"	: key, 
		"value"	: val
	}));
	
	checkConditions();
});
$('select[name="birthDay"], select[name="birthMonth"], select[name="birthYear"]').change(function(){
	var birthDay = $('select[name="birthDay"]').val();
	var birthMonth = $('select[name="birthMonth"]').val();
	var birthYear = $('select[name="birthYear"]').val();
	
	if(birthDay && birthMonth && birthYear)
		$(".userBdate").removeClass("not");
	else
		$(".userBdate").addClass("not");
	
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash, 
		"key"	: "userBdate", 
		"value"	: birthYear + "-" + birthMonth + "-" + birthDay
	}));
	
	checkConditions();
});
function checkConditions() {
	var userWantToDate = $('#userWantToDate:checked').length;
	var userPhoto = $('input[name=userPhoto]').val();
	var birthDay = $('select[name="birthDay"]').val();
	var birthMonth = $('select[name="birthMonth"]').val();
	var birthYear = $('select[name="birthYear"]').val();
	var userResidenceId = $('select[name="userResidenceId"]').val();
	var userGenderId = $('select[name="userGenderId"]').val();
	
	if(!userWantToDate || userPhoto == "/img/guestAva.png" || !birthDay || !birthMonth || !birthYear || !userResidenceId || !userGenderId) {
		$(".settings-block-status").removeClass("allowed").text(lang.lSetNotAllowText);
		
		dataSocket.emit('updateUserParam', JSON.stringify({
			"hash"	: userHash, 
			"key"	: "userSearchShow", 
			"value"	: 0
		}));
		
		return false;
	}
	else {
		$(".settings-block-status").addClass("allowed").text(lang.lSetAllowText);
		
		dataSocket.emit('updateUserParam', JSON.stringify({
			"hash"	: userHash, 
			"key"	: "userSearchShow", 
			"value"	: 1
		}));
		
		return true;
	}
}
/* Dating Conditions END */
 
/*** Slider init */
//variables
var $from = $(".from-age");
var $to = $(".to-age");
var $ageSlider = $('#pickSlider_settings');
//slider init
$ageSlider.slider({
    range: true,
    min: 18,
    max: 50,
    values: [ 18, 50 ],
    slide: function( event, ui ) {
        $from.val(ui.values[ 0 ]);
        $to.val(ui.values[ 1 ]);
    }
});
$from.val($ageSlider.slider( "values", 0 ));
$to.val($ageSlider.slider( "values", 1 ));

//change from field input
$from.change(function(){
    var val1 = parseInt($from.val());
    var val2 = parseInt($to.val());
    val1 = val1 < val2 ? val1 : val2;
    $ageSlider.slider( "values", 0, val1 );
});
//change to field input
$to.change(function(){
    var val1 = parseInt($from.val());
    var val2 = parseInt($to.val());
    val2 = val2 > val1 ? val2 : val1;
    $ageSlider.slider( "values", 1, val2 );
});
/*** Slider init END*/

var search = (getCookie("search")) ? JSON.parse(getCookie("search")) : {};
if(search) {
	if(search.ageFrom && search.ageTo) {
		$from.val(search.ageFrom);
		$to.val(search.ageTo);
		$ageSlider.slider( "values", [ search.ageFrom, search.ageTo ] );
	}
	if(search.gender == "" || search.gender == $("#lookMale_pick_modal").val())
		$("#lookMale_pick_modal").attr("checked", true);
	if(search.gender == "" || search.gender == $("#lookFemale_pick_modal").val())
		$("#lookFemale_pick_modal").attr("checked", true);
	$(".chosen-select-residence-pick").val(search.residence);
	if(search.online == 1)
		$("#isOnline_pick_modal").attr("checked", "checked");
}

$(".search-button").click(function(){
	var err = false;

	var residence = $(".chosen-select-residence-pick").val();
	var gender = "";
	
	if(!residence)
		err = lang.lDatingErrCity;
	else {
		var gender1 = $("#lookMale_pick_modal:checked").val();
		var gender2 = $("#lookFemale_pick_modal:checked").val();
		
		if(!gender1 && !gender2)
			err = lang.lDatingErrGender;
		else if(gender1 && !gender2)
			gender = gender1;
		else if(gender2 && !gender1)
			gender = gender2;
	}
	
	if(err)
		alert(err);
	else {
		search = {
			online: $("#isOnline_pick_modal:checked").length, 
			ageFrom: $from.val(), 
			ageTo: $to.val(), 
			gender: gender,
			residence: residence,
			offset: 0, 
			hash: userHash
		};
		setCookie("search", JSON.stringify(search), {"path": "/", "expires": 31536000});
		window.location.href = "/travelers";
	}
});

$(".logout-btn").click(function(){
	deleteCookie("hash");
	window.location.href = "/";
});

// AiryBay
$('.gender-container').click(function(){
    $('.gender-container').removeClass('active');
    $(this).addClass('active');
});

$('.trigger').click(function(){
    $(this).toggleClass('active');
});

$('.msg-privacy-button').click(function(){
    $('.msg-privacy-modal').addClass('active');
    $('.dark-bg').addClass('active');
});

$('.msg-privacy-modal .line, .dark-bg').click(function(){
    $('.msg-privacy-modal').removeClass('active');
    $('.dark-bg').removeClass('active');
});

$('.cpf-button').click(function(){
    $('.pay-type-modal').addClass('active');
    $('.dark-bg').addClass('active');
});

$('.pay-type-modal .line, .dark-bg').click(function(){
    $('.pay-type-modal').removeClass('active');
    $('.dark-bg').removeClass('active');
});

$(document).ready(function () {
    //variables
    var $from = $(".from-age");
    var $to = $(".to-age");
    var $ageSlider = $('#pickSlider_main');
    //slider init
    $ageSlider.slider({
        range: true,
        min: 0,
        max: 100,
        values: [ 0, 100 ],
        slide: function( event, ui ) {
            $from.val(ui.values[ 0 ]);
            $to.val(ui.values[ 1 ]);
        }
    });
    $from.val($ageSlider.slider( "values", 0 ));
    $to.val($ageSlider.slider( "values", 1 ));

    //change from field input
    $from.change(function(){
        var val1 = parseInt($from.val());
        var val2 = parseInt($to.val());
        val1 = val1 < val2 ? val1 : val2;
        $ageSlider.slider( "values", 0, val1 );
    });

});

/* setTimeout(function(){
	dataSocket.emit('getPopularUsres', JSON.stringify({hash:userHash}));
}, 3000); */
/**
 * Created by Creator on 03.01.2017.
 */

// hide elements
$('.edit-profile').hide();

$("img[data-src]").lazy({afterLoad:function(obj){
	obj.removeClass("inloading");
}});
 
var videoPlayer = false;

$(".ribbons-menu-item").on("click", function () {
	$(".ribbons-menu-item, .sub-page").removeClass("active");
	var keyAttr = $(this).addClass("active").attr("data-heading");
	$('.sub-page.' + keyAttr).toggleClass("active")
});

$('.dropdown-block[data-heading=video] .single-photo img').on("click", function () {
  var source = $(this).attr('src').slice(0,-4);
  var id = $(this).parent(".single-photo").off("click").attr('data-imageid');


	$(this).parent().prepend('<video id="'+ id +'" width="100%" height="100%" controls>\
		  <source src="' + source + '.mp4" type="video/mp4">'
		+ lang.lProfileVideoErr +
		'</video>');
  $(this).remove();


  //video player init
  $(function () {
    var whatever = $('video#'+id).mediaelementplayer({
      success: function (player, node) {
        videoPlayer = player;
      }
    });
  });

  videoPlayer.play();
});


// favorite
$(".page-profile .menu-item.favorite").on("click",function(){
	dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:$(this).data("id")}));
});
dataSocket.on('addUserFavorite', function (data) {
	data = JSON.parse(data);
	
	if(data.action == "add")
		$(".page-profile .menu-item.favorite").addClass("active");
	else if(data.action == "remove")
		$(".page-profile .menu-item.favorite").removeClass("active");
});

// user image like
var myRe = /\/([0-9]+)$/ig;
var url = myRe.exec(window.location.pathname);
var profileId = url[1];
var currentLikeObj = false;

$('.photo-info','.photos-wrapper').on("click", ".like", function () {
  currentLikeObj = $(this).parents('.single-photo');
	dataSocket.emit('updateUserImageLike', JSON.stringify({hash:getCookie("hash"), profileId:profileId, imageId:currentLikeObj.data("imageid")}));
    dataSocket.emit('getUserPostLike', JSON.stringify({hash:userHash, profileId:currentLikeObj.data("profileid"), ribbonId:currentLikeObj.data("ribbonid")}));
});
dataSocket.on('updateUserImageLike', function (data) {
	var n = parseInt(currentLikeObj.find(".like-amount").text());
		
	if(data.action == "add") {
		n += 1;
		currentLikeObj.find(".like").addClass("active");
	}
	else if(data.action == "remove") {
		n -= 1;
		currentLikeObj.find(".like").removeClass("active");
	}
	
	currentLikeObj.find(".like-amount").text(n);
});

$(".subFeed").on("click", ".photo-options .like", function () {
    currentLikeObj = $(this).closest('.single-photo');
    dataSocket.emit('updateUserPostLike', JSON.stringify({hash:getCookie("hash"), profileId:currentLikeObj.data("profileid"), ribbonId:currentLikeObj.data("ribbonid")}));
});
dataSocket.on('updateUserPostLike', function (data) {
    var n = parseInt(currentLikeObj.find(".like-amount").html().match(/\d+/gi)[0]);

    if(data.action == "add") {
        n += 1;
        currentLikeObj.find(".like").addClass("active");
    }
    else if(data.action == "remove") {
        n -= 1;
        currentLikeObj.find(".like").removeClass("active");
    }

    currentLikeObj.find(".like-amount").text(n);
});

// gifts
$(".gifts").on("click", ".gift-container", function(){
	if(profileId)
		dataSocket.emit('getAllGift', JSON.stringify({profileId:profileId}));
	
	
	$(".gifts-modal").find(".control-button, .change-body>div").removeClass("active");
	if($(this).hasClass("empty"))
		$(".gifts-modal .make-gift-button, .gifts-modal .make-gift").addClass("active");
	else
		$(".gifts-modal .gifts-part-button, .gifts-modal .gifts-part").addClass("active");
});
dataSocket.on('getAllGift', function (data) {
	data = JSON.parse(data);
	
	var html = "";
	for(var key in data.giftCollect.pack) {
		var giftsPack = "";
        var packName = "";

        switch(data.giftCollect.pack[key].packName) {
            case 'MEM2':
                packName = 'Меми';
                break;
			case 'cafe':
                packName = 'Кафе';
				break;
			case 'cats':
                packName = 'Коти';
                break;
			case 'dogs':
                packName = 'Собаки';
                break;
			case 'jewellery':
                packName = 'Коштовності';
                break;
			case 'love':
                packName = 'Кохання';
                break;
            case 'music':
                packName = 'Музика';
                break;
            case 'other':
                packName = 'Інші';
                break;
            case 'presents':
                packName = 'Подарунки';
                break;
            case 'soft_toys':
                packName = 'М\'які іграшки';
                break;
            case 'food':
                packName = 'Їжа';
                break;
            case 'transport':
                packName = 'Транспорт';
                break;
            case 'travel':
                packName = 'Подорожі';
                break;
			default:
                packName = data.giftCollect.pack[key].packName;
		}

		html += '<div class="divider"></div><div class="dropdown-heading" data-heading="' + data.giftCollect.pack[key].packName + '">' + packName + '</div>';

		for(var key1 in data.giftCollect.pack[key].stickers) {
			giftsPack += '<div class="gift-image-container" data-id="' + data.giftCollect.pack[key].stickers[key1].stickerId + '" data-price="' + data.giftPrice + '">\
			<div class="gift-wrap">\
				<img src="' + 'https://emosmile.com' + data.giftCollect.pack[key].stickers[key1].stickerImg + '" alt="gift">\
				<div class="price-holder">\
					<div class="price-ico"></div>\
					<div class="price-title">' + data.giftPrice + ' St.</div>\
				</div>\
			</div>\
		</div>';
		}

		html +='<div class="info-items-container dropdown-block" data-heading="' + data.giftCollect.pack[key].packName + '">' + giftsPack + '</div>';
	}
	$(".make-gift").html(html);
	
	html = '';
	for(var i=0; i<data.giftProfile.length; i++)
		html += '<div class="gift-row">\
			<div class="gift-image-container">\
				<img src="' + data.giftProfile[i].giftPath + '" alt="gift">\
			</div>\
			<div class="gift-date-time">\
				<div class="gift-time">' + data.giftProfile[i].time + '</div>\
				<div class="gift-date">' + data.giftProfile[i].date + '</div>\
			</div>\
			<a href="/profile/' + data.giftProfile[i].userId + '" class="main-info">\
				<div class="avatar-holder">\
					<div class="user-avatar" title="">\
						<img src="' + data.giftProfile[i].userPhoto + '" alt="user" class="" style="max-width: 100%;">\
					</div>\
				</div>\
				<div class="info-holder">\
					<div class="main-info-row">\
						<div class="id">id:' + data.giftProfile[i].userId + '</div>\
						<div class="name">' + data.giftProfile[i].userName + '</div>\
						<div class="age">' + data.giftProfile[i].age + ' ' + lang.lUserYears + '</div>\
						<div class="city">' + data.giftProfile[i].userResidence + '</div>\
					</div>\
				</div>\
			</a>\
		</div>';
	$(".gifts-part").html(html);
	
	$(".modal-wrapper, .gifts-modal").show();
});

// buttons
$(".gifts-modal .make-gift-button").on("click",function(e){
    e.preventDefault();
	if(!$(this).hasClass("active")) {
		$(".gifts-modal .gifts-part-button, .gifts-modal .gifts-part").removeClass("active");
		$(".gifts-modal .make-gift-button, .gifts-modal .make-gift").addClass("active");
	}
});
$(".gifts-modal .gifts-part-button").on("click",function(e){
    e.preventDefault();
	if(!$(this).hasClass("active")) {
		$(".gifts-modal .make-gift-button, .gifts-modal .make-gift").removeClass("active");
		$(".gifts-modal .gifts-part-button, .gifts-modal .gifts-part").addClass("active");
	}
});
$(".gifts-modal .close-button").on("click",function(e){
    e.preventDefault();
	$(".modal-wrapper, .gifts-modal").hide();
});

//открыть группу подарков
$(document).on("click", ".dropdown-heading", function (event) {
    wasTouch($(this), event, function ($element) {
        var keyAttr = $element.toggleClass("active").attr("data-heading");
        $('.dropdown-block[data-heading=' + keyAttr + ']').toggleClass("opened")
    });
});

// gift confirm modal
var giftId = false;
$(".make-gift").on("click", ".gift-image-container", function(event){

    wasTouch($(this), event, function ($element) {
        giftId = $element.data("id");

        $(".gifts-modal .confirm-modal .price-title").text($element.data("price") + " stealers");

        $(".gifts-modal .confirm-modal .user-avatar img").attr("src", $(".body-mobile .main-info .user-avatar img").attr("src"));
        $(".gifts-modal .confirm-modal .corner-gift img").attr("src", $element.find("img").attr("src"));

        $(".gifts-modal .make-gift").removeClass("active");
        $(".gifts-modal .confirm-modal").addClass("active");
    });
});
$(".gifts-modal .confirm-modal .buy").on("click", function(){
	if(userHash && profileId)
		dataSocket.emit('buyGift', JSON.stringify({hash:userHash, profileId:profileId, giftId:giftId}));
	
	$(".modal-wrapper, .gifts-modal").hide();
});
dataSocket.on('buyGift', function (data) {
	data = JSON.parse(data);
	
	if(data.result) {
		var html = '<div class="gift-container">\
				<img class="gift-image" src="' + data.gift.giftPath + '" alt="img">\
			</div>';
		$(".body-mobile .gifts .gift-container:last").remove();
		$(".body-mobile .gifts").prepend(html);
	}
});
$(".gifts-modal .confirm-modal .cancel").on("click", function(e){
	e.preventDefault();
	$(".gifts-modal .make-gift").addClass("active");
	$(".gifts-modal .confirm-modal").removeClass("active");
});

// USER
//claim user
$(".page-profile > .main-info").on("click", ".settings-dots", function () {
	$(".claim-modal-wrapper, .claim-modal, .claim-popup.claim").show();
});

$(".claim-bg").on("click", function (e) {
    e.preventDefault();
    $(".claim-modal-wrapper, .claim-modal, .claim-popup").hide();
});

$(".menu-item.claim-user").on("click", function () {
	$(".claim-popup.claim").hide();
	$(".claim-popup.claim-reason").show();
});

// add/remove user blacklist
$(".claim-modal .block-user").on("click", function () {
	dataSocket.emit('addUserBlacklist', JSON.stringify({hash:userHash, profileId:profileId}));
});

dataSocket.on('addUserBlacklist', function (data) {
	$(".claim-modal .block-user").toggle();
});

$(".claim-modal .claim-button").on("click", function () {
	var arr = [];
	$(".claim-reason input:checked").each(function(){
		arr.push($(this).val());
	});
	dataSocket.emit('addUserClaim', JSON.stringify({hash:userHash, profileId:profileId, claimId:arr}));
	$(".claim-modal-wrapper, .claim-modal, .claim-popup.claim").hide();
	$(".claim-popup.claim").show();
	$(".claim-popup.claim-reason").hide();
});

// PHOTO
//claim photo
var profileImage = {id:0, blacklist:false, claim:false, obj:false};
$(".subPhotos .photos-wrapper").on("click", ".settings-dots", function () {
	profileImage.obj = $(this).closest(".single-photo");
	profileImage.id = profileImage.obj.data("imageid");
	
	if(profileImage.blacklist != profileImage.obj.data("blacklist")) {
		profileImage.blacklist = profileImage.obj.data("blacklist");
		$(".claim-photo-modal .block-user").toggle();
	}
	
	if(profileImage.claim != profileImage.obj.data("claim")) {
		profileImage.claim = profileImage.obj.data("claim");
		$(".claim-photo-modal .claim-user").toggle();
	}
	
	$(".claim-photo-modal-wrapper, .claim-photo-modal, .claim-photo-popup").show();
});

$(".claim-photo-bg").on("click", function (e) {
    e.preventDefault();
    $(".claim-photo-modal-wrapper, .claim-photo-modal, .claim-photo-popup").hide();
});

// add/remove photo blacklist
$(".claim-photo-modal .block-user").on("click", function () {
	dataSocket.emit('addImageBlacklist', JSON.stringify({hash:userHash, imageId:profileImage.id}));
});

dataSocket.on('addImageBlacklist', function (data) {
	profileImage.blacklist = !profileImage.blacklist;
	profileImage.obj.data("blacklist", profileImage.blacklist);
	$(".claim-photo-modal .block-user").toggle();
});

// add/remove photo claim
$(".claim-photo-modal .claim-user").on("click", function () {
	dataSocket.emit('addImageClaim', JSON.stringify({hash:userHash, imageId:profileImage.id}));
});

dataSocket.on('addImageClaim', function (data) {
	profileImage.claim = !profileImage.claim;
	profileImage.obj.data("claim", profileImage.claim);
	$(".claim-photo-modal .claim-user").toggle();
});


$('.likes-wrap').on('click',function(e){
    e.preventDefault();
    currentLikeObj = $(this).parents('.single-photo');
    var $target = $(this).find('.likes-arrow');
    var $text = $(this).parents(".single-photo").find('.who-likes');
    var textState = $text.css('display');
    var profileId = $(this).parents(".single-photo").data("profileid");
    var ribbonId =  $(this).parents(".single-photo").data("ribbonid");
    $target.toggleClass('rotated-arrow');
    $text.css('display',(textState == 'block') ? 'none' : 'block');

    dataSocket.emit('getUserPostLike', JSON.stringify({hash:userHash, profileId:profileId, ribbonId:ribbonId}));
});

dataSocket.removeEventListener('getUserPostLike').on('getUserPostLike', function (data) {
    var html = "";
    var isLiked = false;

    data.likes.forEach(function(row){
        if(row.my)
            isLiked = true;
        html += htmlLikePerson(row);
    });
    if(html){
        currentLikeObj.find('.who-likes').html(html);
    }
});

// html елемент списка лайков
function htmlLikePerson(row) {
    return '<a href="/profile/'+row.userId+'"><div class="like-person '+((row.my) ? "my": "")+'">\
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="-1 0 20 16">\
					<path fill="#d3494e" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
					4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
					3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
				</svg>\
				<figure class="like-person-avatar" title="">\
					<img src="'+row.userPhoto+'" alt="user" class="" style="max-width: 100%;">\
				</figure>\
				<div class="name-status-holder flexcol">\
					<div class="user-nickname">'+row.userName+'</div>\
					<!--<div class="user-online-status">'+((row.userLastActive != "online") ? row.userLastActive : lang.lOnlineStatus)+'</div>-->\
				</div>\
				<svg class="user-favour svg-ico '+((row.inFavorite)?'active':'')+'" data-userid="'+row.userId+'" xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">\
					<!--<path fill="#B4B4B4" d="M7.8,2.1c0-0.5,0.2-0.7,0.7-0.7c0,0,0.7-0.1,0.7,0.7c0,0.7-0.6,0.5-0.6,0.8C9,3.9,9.8,7.3,11.3,8 \
						c1.5,1.1,3.6-0.6,4.4-1.2c-0.2-0.7-0.1-1,0.1-1.2c0.2-0.2,0.6-0.2,0.8,0C17,5.7,17.1,6.2,17,6.4c-0.1,0.2-0.5,0.5-1,0.5 \
						c0,0-2.1,5.3-2.3,6c0,0.2-0.2,0.4-0.5,0.4H3.9c-0.2,0-0.4-0.1-0.5-0.4l-2.3-6C0.5,6.9,0.3,6.8,0,6.4c-0.1-0.4,0.1-0.7,0.4-0.8 \
						c0.1-0.1,0.6-0.2,0.8,0c0.4,0.2,0.4,0.6,0.1,1.1c0.8,0.7,3,2.1,4.1,1.5c1.2-0.5,2.8-4.7,2.9-5.2C8.3,2.6,7.9,2.7,7.8,2.1z \
						M13.5,13.6v1.1H3.5v-1.1H13.5z"/>-->\
				</svg>\
			</div></a>';
}

// POST
//claim post
var postData = {ribbonId:0, claim:false, obj:false};
var currentImage = false;
$(".subFeed .photos-wrapper").on("click", ".settings-dots", function (e) {
    e.preventDefault();
    postData.obj = $(this).closest(".single-photo");
    postData.ribbonId = postData.obj.data("ribbonid");
    if(postData.obj.data("avatar") === false){
        $(".claim-post-modal-wrapper .make-main-option").hide()
    } else {
        $(".claim-post-modal-wrapper .make-main-option").show()
    }
    currentImage = $(this).parents(".single-photo").find(".profile-img").attr("src");

    if(postData.claim != postData.obj.data("claim")) {
        postData.claim = postData.obj.data("claim");
        $(".claim-post-modal .claim-user").toggle();
    }

    $(".claim-post-modal-wrapper, .claim-post-modal, .claim-post-popup").show();
});

// add/remove post claim
$(".claim-post-modal .claim-user").on("click", function (e) {
    e.preventDefault();
    dataSocket.emit('claimRibbonPost', JSON.stringify({hash:userHash, ribbonId:postData.ribbonId}));
});

dataSocket.on('claimRibbonPost', function (data) {
    postData.claim = !postData.claim;
    postData.obj.data("claim", postData.claim);
    $(".claim-post-modal .claim-user").toggle();
});

$(".claim-post-bg").on("click", function (e) {
	e.preventDefault();
    $(".claim-post-modal-wrapper, .claim-post-modal, .claim-post-popup").hide();
});


//share
var recentImage = '';
$(".share").on("click", function (e) {
    e.preventDefault();
    recentImage = $(this).parents(".single-photo");
    $(".share-post-wrapper").find(".share-btn").off("click").on("click", function (e) {
        e.preventDefault();
        var postData = {
            postSocialsArray: []
        };
        $(".share-post-wrapper, .share-post-modal, .post-share").hide();
        var hasImages = recentImage.find(".profile-img").length>0;
        var hasVideo =  recentImage.find('video source').attr('src');
        var hasLink = recentImage.find('.post-content').attr('href');

        var postText = recentImage.find(".post-text").text();
        if(postText.length>0 && !hasLink) {
            postText = correctHashTagsOnEdit(postText);
            postText = correctPostTextBeforeSend(postText).text;
            postData.status = postText;
        } else if (hasLink){
            postText = recentImage.find("h3.title").contents().filter(function() {
                return this.nodeType == 3;
            }).text();

            postText = correctHashTagsOnEdit(postText);
            postText = correctPostTextBeforeSend(postText).text;
            if((postText.length+hasLink.length +4)<280 ){
                postData.status = postText + "... " + hasLink;
            } else {
                postData.status = postText.slice(0, (280 - hasLink.length - 4)) + "... " + hasLink;
            }
        }
        if(hasVideo){
            postData.postVideo = hasVideo;
        }
        if(hasImages){
            var imgArr = [];
            recentImage.find(".profile-img").each(function (index,img) {
                imgArr.push($(img).attr("src"));
            });
            postData.imgArr = imgArr;
        }
        postData.shareType = hasLink ? 'news': 'post';
        $(".share-post-wrapper").find('.menu-item.share-item:not(.no-active) input[type="checkbox"]').each(function () {
            if($(this).is(':checked')){
                if(!(!(hasImages || hasVideo) && $(this).attr("name") === 'instagram')){
                    postData.postSocialsArray.push($(this).attr("name"))
                }
            }
        });
        if (postData.postSocialsArray.length >0){
            dataSocket.emit('shareSocialPost', JSON.stringify({hash: userHash, postData: postData}));
        }
    });
    $(".share-post-wrapper, .share-post-modal, .post-share").toggle();
});
$(".share-post-bg").on("click", function (e) {
    e.preventDefault();
    $(".share-post-wrapper, .share-post-modal, .post-share").hide();
});

dataSocket.off('facebookSharePost').on('facebookSharePost', function (data) {
    data = JSON.parse(data);
    if(data.error) {
        window.location.href = data.error;
    } else {
        showNotify("success",'Поширено в Facebook');
    }
});
dataSocket.off('twitterSharePost').on('twitterSharePost', function (data) {
    data = JSON.parse(data);
    if(data.error) {
        window.location.href = data.error;
    } else if(data.vid_error){
        showNotify("danger",'Формат не підтримується Twitter або файл більше 15мб');
    } else {
        showNotify("success",'Поширено в Twitter');
    }
});
dataSocket.off('instagramSharePost').on('instagramSharePost', function (data) {
    data = JSON.parse(data);
    if(data.message === "error") {
        openPromotionPopup("pages/instagram-login.html", "Instagram");
    } else if (data.message === "success"){
        showNotify("success",'Поширено в Instagram');
    }
});

dataSocket.off('checkInstagramLoginData').on('checkInstagramLoginData', function (data) {
    data = JSON.parse(data);
    if (data.message === "finalized") {
        showNotify("success",'Loged into Instagram');
    }
});

dataSocket.emit('checkSocialKeys', JSON.stringify({hash: userHash, keysList: ['all']}));
dataSocket.off('checkSocialKeys').on('checkSocialKeys', function (data) {
    data = JSON.parse(data);
    var checkActions = {
        'facebook': 'fb',
        'twitter': 'twit',
        'instagram': 'inst'
    };
    for(var i in data.status){
        if (data.status[i] === 'success'){
            $(".share-post-wrapper").find("." + checkActions[i] +"-share").removeClass("no-active");
        }
    }
});

$("#croppic-modal").on('click', function (e) {
    e.preventDefault();
});

$(".make-main-option").on("click", function(){
    $(".claim-post-modal-wrapper, .claim-post-modal, .claim-post-popup").hide();

    // https://github.com/acornejo/jquery-cropbox
    var croppicContainerPreloadOptions = {
        uploadUrl:'/profile/upload-image',
        cropUrl:'/profile/cropimage',
        loadPicture: currentImage,
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
        },
        onError:function(errormessage){
            console.log('onError:'+errormessage);
        }
    }
    var cropContainerPreload = new Croppic('croppic-modal', croppicContainerPreloadOptions);
    $(".modal-wrapper").show();
});

dataSocket.emit('getSocialContacts', JSON.stringify({hash: userHash, profileId: ''+profileId}));
dataSocket.off('getSocialContacts').on('getSocialContacts', function (data) {
    data = JSON.parse(data);

    if(data.socialEmail !== null){
        if(data.socialEmail.length>0){
            $('.soc-btn[data-link="socialEmail"]').attr('href','mailto:'+data.socialEmail).show();
        }
    }
    if(data.phoneNumber !== null){
        if(data.phoneNumber.length>0){
            if (+data.hasTelegram === 1){
                var $socTelegramWrapper = $('.soc-btn[data-link="hasTelegram"]');
                $socTelegramWrapper.show();
                $socTelegramWrapper.find(".soc-tooltip").text(data.phoneNumber);
                fadeMenu($socTelegramWrapper.find('svg'), $socTelegramWrapper.find(".soc-tooltip"));
            }
            if (+data.hasViber === 1){
                var $socViberWrapper = $('.soc-btn[data-link="hasViber"]');
                $socViberWrapper.show();
                $socViberWrapper.find(".soc-tooltip").text(data.phoneNumber);
                fadeMenu($socViberWrapper.find('img'), $socViberWrapper.find(".soc-tooltip"));
            }
            if (+data.hasWhatsapp === 1){
                var $socWhatsappWrapper = $('.soc-btn[data-link="hasWhatsapp"]');
                var phoneNumberToFormat = data.phoneNumber;
                var phoneCorrect = phoneNumberToFormat.match(/\D/im);

                while (phoneCorrect !== null ){
                    phoneNumberToFormat = phoneNumberToFormat.replace(phoneCorrect[0],'');
                    phoneCorrect = phoneNumberToFormat.match(/\D/im);
                }

                $socWhatsappWrapper.attr('href','https://api.whatsapp.com/send?phone=+'+phoneNumberToFormat).show();
                $socWhatsappWrapper.find(".soc-tooltip").text(data.phoneNumber);
                fadeMenu($socWhatsappWrapper.find('img'), $socWhatsappWrapper.find(".soc-tooltip"));
            }
        }
    }

    $(".soc-buttons .soc-btn.soc-link").each(function () {
        var inputName = $(this).data('link');
        if(data[inputName] !== null){
            if(data[inputName].length>0){
                var linkCorrect = data[inputName].match(/\/\//g);
                if (linkCorrect === null) {
                    data[inputName] = '//'+data[inputName];
                }
                $(this).attr('href',data[inputName]).show();
            }
        }
    })
});
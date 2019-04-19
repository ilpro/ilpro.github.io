var currentPost = false;
var currentLikeObj = false;
$(".photos-wrapper").on("click", ".single-photo[data-ribbonid] .photo-options .like", function () {
    currentLikeObj = $(this).closest('.single-photo');
    dataSocket.emit('updateUserPostLike', JSON.stringify({hash:getCookie("hash"), profileId:currentLikeObj.data("profileid"), ribbonId:currentLikeObj.data("ribbonid")}));
});
$(".photos-wrapper").on("click", ".single-photo[data-postid] .photo-options .like", function () {
    currentLikeObj = $(this).closest('.single-photo');
    dataSocket.emit('updateUserNewsPostLike', JSON.stringify({hash:getCookie("hash"), postId:currentLikeObj.data("postid")}));
});
dataSocket.on('updateUserPostLike', function (data) {
    updateUserPostLike(data)
});
dataSocket.on('updateUserNewsPostLike', function (data) {
    updateUserPostLike(data)
});
function updateUserPostLike(data) {
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
}

$('.photos-wrapper').on('click', '.single-photo[data-ribbonid] .likes-wrap', function(e){
    e.preventDefault();
    var data = currentLikeObjGrabber($(this));
    dataSocket.emit('getUserPostLike', JSON.stringify({hash:userHash, profileId:data.profileId, ribbonId:data.ribbonId}));
});

$('.photos-wrapper').on('click', '.single-photo[data-postid] .likes-wrap', function(e){
    e.preventDefault();
    var data = currentLikeObjGrabber($(this));
    dataSocket.emit('getUserNewsPostLike', JSON.stringify({hash:userHash, postId:data.postId}));
});

function currentLikeObjGrabber($current){
    var returnobj = {};
    currentLikeObj = $current.parents('.single-photo');
    var $target = $current.find('.likes-arrow');
    var $text = currentLikeObj.find('.who-likes');
    var textState = $text.css('display');
    $target.toggleClass('rotated-arrow');
    $text.css('display',(textState == 'block') ? 'none' : 'block');
    if(currentLikeObj.attr('data-ribbonid')){
        returnobj.profileId = currentLikeObj.data("profileid");
        returnobj.ribbonId =  currentLikeObj.data("ribbonid");
    } else if (currentLikeObj.attr('data-postid')) {
        returnobj.postId = currentLikeObj.data("postid");
    }

    return returnobj
}

dataSocket.removeEventListener('getUserPostLike').on('getUserPostLike', function (data) {
    insertLikesPerson(data)
});
dataSocket.removeEventListener('getUserNewsPostLike').on('getUserNewsPostLike', function (data) {
    insertLikesPerson(data)
});

function insertLikesPerson(data) {
    var html = "";
    var isLiked = false;

    for(var i=0;i<data.likes.length;i++){
        if(data.likes[i].my)
            isLiked = true;
        html += htmlLikePerson(data.likes[i]);
    }
    if(html){
        currentLikeObj.find('.who-likes').html(html);
    }
}

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
//delete post
var postData = {ribbonId:0, userId:0, claim:false, obj:false};
$(".page-ribbon .photos-wrapper").on("click", ".settings-dots.delete-my", function (e) {
    e.preventDefault();
    postData.obj = $(this).closest(".single-photo");
    postData.ribbonId = postData.obj.data("ribbonid");
    postData.userId = postData.obj.data("profileid");

    $(".popup-post-wrapper, .popup-post-modal, .post-control").show();
});

//delete post
$(".popup-post-modal .post-delete-option").on("click", function (e) {
    e.preventDefault();
    $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();
    dataSocket.emit('deleteRibbonPost', JSON.stringify({hash:userHash,userId:postData.userId, ribbonId:postData.ribbonId}));
});

dataSocket.on('deleteRibbonPost', function () {
    postData.obj.animate({
        width: 0,
        height: 0,
        opacity: 0
    }, 200, function () {
        this.remove();
    });
});

$(".popup-post-bg").on("click", function (e) {
    e.preventDefault();
    $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();
});

$(".page-ribbon .photos-wrapper").on("click", ".settings-dots.claim-other", function (e) {
    e.preventDefault();
    postData.obj = $(this).closest(".single-photo");
    postData.ribbonId = postData.obj.data("ribbonid");

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
    $(".share-post-wrapper").find(".share-btn").off().on("click", function (e) {
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
    $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();

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
var myRe = /\/([0-9]+)$/ig;
var url = myRe.exec(window.location.pathname);
var profileId = url[1];
var galleryModal = $(".user-gallery-modal-layout");
var searchTravellersSettings = getCookie('searchTravellersSettings');
if(!searchTravellersSettings){
  searchTravellersSettings = {offset: 0}
} else {
  searchTravellersSettings = JSON.parse(searchTravellersSettings);
}

setCookie("lastTravelerId", profileId, {"path": "/", "expires": 31536000});

$(".main-photo").click(function(e){
	e.preventDefault();
	$(".user-gallery-modal-layout").find(".left, .right").hide();
	$(".user-gallery-modal-layout .user-gallery-modal-wrap *").hide();
	$(".user-gallery-modal-layout .user-gallery-modal-wrap img").replaceWith('<img src="' + $(this).attr("href") + '" alt="main user photo" class="user-gallery-img">');
	$(".user-gallery-modal-layout").addClass("active");
});

function getImgSize(imgSrc, callback) {
    var newImg = new Image();

    newImg.onload = function () {
        if (callback != undefined)
            callback(newImg)
    };

    newImg.src = imgSrc;
}

$(".gallery-block .user-photo").each(function(){
	var src = $(this).attr("src");
	if(src) {
		getImgSize(src, function(img){
			$(".gallery-block img[src=" + JSON.stringify(img.getAttribute("src")) + "]").show().prev().remove();
		});
	}
});

//user gallery modal
var galleryCurrentPhoto;
function showPhoto(el){
	galleryCurrentPhoto = el;
	
	$(".user-gallery-img").replaceWith('<img src="' + el.attr("src") + '" alt="photo ' + el.data("number") + '" class="user-gallery-img" >');
	$(".user-gallery-modal p span:eq(0)").text(el.data("number"));
	$(".user-gallery-modal p span:eq(1)").text($(".gallery-block .user-photo").length);
}

$("main").on("click", ".gallery-block .user-photo", function(){
	showPhoto($(this));
	$(".user-gallery-modal-layout").find(".left, .right").show();
	$(".user-gallery-modal-layout .user-gallery-modal-wrap *").show();
	galleryModal.addClass("active");
});

$(".user-gallery-modal .arrow-left, .user-gallery-modal-layout .left").click(function(){
	var el = galleryCurrentPhoto.parent().prev().find(".user-photo");
	
	if(el.length)
		showPhoto(el);
	else
		galleryModal.removeClass("active");
});

$(".user-gallery-modal .arrow-right, .user-gallery-modal-layout .right").click(function(){
	var el = galleryCurrentPhoto.parent().next().find(".user-photo");
	
	if(el.length)
		showPhoto(el);
	else
		galleryModal.removeClass("active");
});

//show more info
$(".btn-more, .more-photos").click(function(){
	$(".loader-bg").addClass("active");
	$.get("/profile/more/" + profileId, function(html, b, c) {
		$(".more-info").html(html);
		$(".btn-more").addClass('hide');
		$(".loader-bg").removeClass("active");
		$('.more-info, .action-row').removeClass('hide');
		$(".more-info .single-photo .photo").each(function(){
			var src = $(this).attr("src");
			if(src) {
				getImgSize(src, function(img){
					$(".single-photo img[src=" + JSON.stringify(img.getAttribute("src")) + "]").show().prev().remove();
				});
			}
		});
	});
});

// Add to favorite
$(".profile-media-info").on("click", ".btn-row button", function(){
	dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:profileId}));
	$(this).toggleClass("active");
});

// next traveller
$('#next-user').click(function (e){
  searchTravellersSettings.offset++;
  dataSocket.emit('searchUser', JSON.stringify({hash: userHash, offset: searchTravellersSettings.offset}))
});

// prev traveller
$('#prev-user').click(function (e){
  searchTravellersSettings.offset--;
  dataSocket.emit('searchUser', JSON.stringify({hash: userHash, offset: searchTravellersSettings.offset}))
});

dataSocket.on("searchUser", function(data){
  data = JSON.parse(data);
  $(".loader-bg").removeClass("active");
  if(!data.user) {
    return showAlertModal('Sorry, nobody found by this criteria. Please try to change search preferences')
  }
  setCookie("searchTravellersSettings", JSON.stringify(data), {"path": "/", "expires": 31536000});
  window.location.href = "/profile/" + data.user.userId;
});
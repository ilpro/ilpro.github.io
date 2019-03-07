String.prototype.replaceMany = function(replaces) {
	var str = this;
	for(var index in replaces)
		str = str.replace("{" + index + "}", replaces[index]);
	return str;
};

dataSocket.on('newNotification', function (data) {
	var data = JSON.parse(data);
	
	var text = "", html = "", svg = "";

	switch(data.notificationType) {
      case "PhotoLike" : {
        text = '<a href="/profile/{senderId}">{senderName}</a> liked your <strong>photo</strong>.';
		text = text.replaceMany({
			"senderId" : data.senderId, 
			"senderName" : data.userName
		});
		html = '<img src="' + data.image + '" alt="user image" style="cursor: pointer;">';
		svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 46.777"><path d="M54 14.582a14.571 14.571 0 0 0-27-7.615A14.57 14.57 0 1 0 5.005 25.562l20.664 20.664a1.882 1.882 0 0 0 2.661 0l20.664-20.664A14.529 14.529 0 0 0 54 14.582z"></path></svg>';
        break;
      }
      case "UserFavorite" : {
        text = '<a href="/profile/{senderId}">{senderName}</a> followed you.';
		text = text.replaceMany({
			"senderId" : data.senderId, 
			"senderName" : data.userName
		});
		if(data.favorite) {
			html = '<button data-id="' + data.senderId + '">\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15.24"><defs></defs><path d="M9.151 9.914l-.517-.268a.666.666 0 0 1-.367-.589v-.84a5.246 5.246 0 0 0 .932-1.839.993.993 0 0 0 .4-.79V4.572a.985.985 0 0 0-.267-.667V2.554A2.2 2.2 0 0 0 8.775.9 3.452 3.452 0 0 0 6.133 0a3.452 3.452 0 0 0-2.642.9 2.2 2.2 0 0 0-.558 1.657v1.348a.984.984 0 0 0-.267.667v1.016a.992.992 0 0 0 .4.79 5.241 5.241 0 0 0 .933 1.838v.84a.667.667 0 0 1-.367.589l-2.378 1.237a2.276 2.276 0 0 0-1.255 2.011v1.077a.26.26 0 0 0 .267.254h9.075a3.634 3.634 0 0 1-.19-4.31z"></path><path d="M12.536 8.636a3.306 3.306 0 1 0 3.467 3.3 3.391 3.391 0 0 0-3.467-3.3zm1.6 3.556h-1.333v1.27a.267.267 0 0 1-.533 0v-1.27h-1.334a.254.254 0 1 1 0-.508h1.333v-1.27a.267.267 0 0 1 .533 0v1.27h1.334a.254.254 0 1 1 0 .508z"></path></svg>\
<span>Following</span></button>';
		}
		else {
			html = '<button class="active" data-id="' + data.senderId + '">\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15.24"><defs></defs><path d="M9.151 9.914l-.517-.268a.666.666 0 0 1-.367-.589v-.84a5.246 5.246 0 0 0 .932-1.839.993.993 0 0 0 .4-.79V4.572a.985.985 0 0 0-.267-.667V2.554A2.2 2.2 0 0 0 8.775.9 3.452 3.452 0 0 0 6.133 0a3.452 3.452 0 0 0-2.642.9 2.2 2.2 0 0 0-.558 1.657v1.348a.984.984 0 0 0-.267.667v1.016a.992.992 0 0 0 .4.79 5.241 5.241 0 0 0 .933 1.838v.84a.667.667 0 0 1-.367.589l-2.378 1.237a2.276 2.276 0 0 0-1.255 2.011v1.077a.26.26 0 0 0 .267.254h9.075a3.634 3.634 0 0 1-.19-4.31z"></path><path d="M12.536 8.636a3.306 3.306 0 1 0 3.467 3.3 3.391 3.391 0 0 0-3.467-3.3zm1.6 3.556h-1.333v1.27a.267.267 0 0 1-.533 0v-1.27h-1.334a.254.254 0 1 1 0-.508h1.333v-1.27a.267.267 0 0 1 .533 0v1.27h1.334a.254.254 0 1 1 0 .508z"></path></svg>\
<span>Follow</span></button>';
		}
		svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15.547 15.547"><defs/><path d="M8.892 10.114l-.5-.274a.684.684 0 0 1-.357-.6v-.858a5.446 5.446 0 0 0 .907-1.876 1.03 1.03 0 0 0 .386-.806V4.664a1.033 1.033 0 0 0-.259-.68V2.605a2.324 2.324 0 0 0-.542-1.69A3.261 3.261 0 0 0 5.96 0a3.261 3.261 0 0 0-2.568.915 2.322 2.322 0 0 0-.542 1.691v1.378a1.031 1.031 0 0 0-.259.68V5.7a1.03 1.03 0 0 0 .388.806 5.441 5.441 0 0 0 .908 1.876v.857a.684.684 0 0 1-.357.6L1.218 11.1a2.336 2.336 0 0 0-1.219 2.053v1.1a.259.259 0 0 0 .259.259h8.819a3.856 3.856 0 0 1-.185-4.4z"/><path d="M12.179 8.81a3.369 3.369 0 1 0 3.369 3.369 3.372 3.372 0 0 0-3.369-3.369zm1.555 3.628h-1.3v1.3a.259.259 0 0 1-.518 0v-1.3h-1.3a.259.259 0 0 1 0-.518h1.3v-1.3a.259.259 0 0 1 .518 0v1.3h1.3a.259.259 0 1 1 0 .518z"/></svg>';
        break;
      }
    }
	
	html = '<div class="link-wrap">\
	<div class="row align-items-center notification-item m-0 justify-content-between new">\
		<div class="row m-0 align-items-center">\
			<figure class="user-avatar-holder">\
				<img src="' + data.userPhoto + '" alt="photo">\
			</figure>\
			<p>' + text + '</p>\
		</div>\
		<div class="row justify-content-end m-0 notification-info align-items-center">\
		' + html + '\
		' + svg + '\
		</div>\
	</div>\
</div>';
// console.log(html);
	$(".notification-list").prepend(html);
});

$('.read-all').on('click', function(e) {
	e.preventDefault();
	$(".sidebar-item.notifications .indicator-count").text("0").hide();
	$(".notification-item.new").removeClass("new");
	dataSocket.emit('readAllNotifications', JSON.stringify({hash: userHash}));
});

$(".notification-item img").click(function(){
	$(".user-gallery-modal-layout").find(".left, .right").remove();
	$(".user-gallery-modal-layout .user-gallery-modal-wrap").html('<img src="' + $(this).attr("src") + '">');
	$(".user-gallery-modal-layout").addClass("active");
});
$(".user-gallery-modal-layout").on("click", ".shadow, .close", function(){
	$(this).closest(".user-gallery-modal-layout").removeClass("active");
});

// Add to favorite
var btnFollow;
$(".link-wrap").on("click", "button", function(){
	btnFollow = $(this);
	dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:$(this).data("id")}));
});

dataSocket.on('addUserFavorite', function (data) {
	btnFollow.toggleClass("active");
	var span = btnFollow.find("span");
	var text = span.text();
	(text == "Following") ? span.text("Follow") : span.text("Following")
	showSettingsNotify("success", "Saved");
})
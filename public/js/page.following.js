$("div.action-row-item").click(function(){
	dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:$(this).data("id")}));
	$(this).toggleClass("active");
});

$(".btn-following, .btn-followers").click(function(){
	$(".tabs-row button").removeClass("active");
	$(".sub-list").removeClass("active");
	
	$(".search-container input").val("");
	$(".sub-list .link-wrap").show();
	
	$(this).addClass("active");
	$("." + $(this).data("tab")).addClass("active");
});

// Add to favorite
$(".sub-list").on("click", ".link-wrap button", function(){
	dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:$(this).data("id")}));
});

dataSocket.on('addUserFavorite', function (data) {
	data = JSON.parse(data);
	
	$(".link-wrap button[data-id=" + data.profileId  + "]")
	.toggleClass("active")
	.find("span")
	.text((data.action == "add") ? "Following" : "Follow");
	
	if($(".side-followers").hasClass("active")) {
		$(".side-following [data-userid=" + data.profileId  + "]").remove();
		if(data.action == "add")
			$(".side-following").prepend($(".side-followers [data-userid=" + data.profileId  + "]")[0].outerHTML);
	}
	
	showSettingsNotify("success", "Saved");
});
function getCookie(name) {
	var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

// $(window).on('load', function() {
//     $('.preloader-screen').find('.preloader-element').fadeOut().end().delay(400).fadeOut('slow');
// });

$(".hamburger, .side-menu-close-cover").bind("tap", function () {
	$('body').toggleClass('sidemenu-opened');
});

$(".info-show").click(function(){
    $(".dropdown-menu.info").toggleClass("active");
});

$("header a, .app-block a").click(function(e){
	// e.preventDefault();
	var subid = getCookie("subid");
	if(subid)
		$.get("/allemodels/" + subid, function(){});
	/* if(window.location.search.replace("?from=", "") == "mgd") {
		if($(this).data("app") == "gp")
			_mgq.push(["MgSensorInvoke", "Playmarket"]);
		else
			_mgq.push(["MgSensorInvoke", "Appstore"]);
	} */
});
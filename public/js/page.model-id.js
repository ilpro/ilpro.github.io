var p = window.location.pathname.match(/[0-9]+/i);
var modelId = p[0];
setCookie("modelId", modelId, {"path": "/", "expires": 31536000});

if(getCookie("confirmPolicy") == 1)
	$(".prelanding-window").remove();
else
	$(".prelanding-window").show();

$(".btn-confirm").click(function(){
	if($(".prelanding-window input").is(':checked')) {
		setCookie("confirmPolicy", 1, {"path": "/", "expires": 31536000});
		$(".prelanding-window").remove();
	}
	else
		showAlertModal("Please confirm your age and accept the policy before entering Youproud!");
});

$('#vertical').lightSlider({
	gallery: true,
	item: 1,
	vertical: true,
	verticalHeight: 400,
	vThumbWidth: 100,
	thumbItem: 4,
	thumbMargin: 4,
	slideMargin: 0,
	enableDrag: false,
	onAfterSlide: function () { // this is a custom callback we have added
		/* if ( $('.lslide.active').is(':last-child')) {
			document.location.href = '/profile/' + $('#vertical').attr('data-model-id');
		} */
	},
});
$(document).on("keyup", function (e) {
	if(e.keyCode == 13)
	  dataSocket.emit('userLogin', JSON.stringify({
		"email": $(".lg-form-email-input").val(),
		"pass": $(".lg-form-password-input").val(),
	  }));
});
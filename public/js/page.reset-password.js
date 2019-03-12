/** landing, landing-part EJS **/
$(".btn-reset").click(function(e) {
  e.preventDefault();
  
  var pass = $(".lg-form-password-input").val();
  if (pass < 4)
    showAlertModal("The password must be at least 4 characters long.");
  else if (pass != $(".lg-form-password-input2").val())
    showAlertModal("Passwords do not match");
  else
    dataSocket.emit('userChangePassword', JSON.stringify({"uid": urlHash.getState("uid"), "key": urlHash.getState("key"), "pass": pass}));
});

dataSocket.on('userChangePassword', function (data) {
  data = JSON.parse(data);
  if(data.error)
	  showAlertModal(data.error);
  else {
	  showAlertModal("Your password has been changed successfully. You will be logged in to your account after pressing OK.");
	  setCookie("hash", data.hash, {"path": "/", "expires": 31536000});
  }
});

$("#alert-modal-confirm").on("click", function(){
	if(getCookie("hash"))
		window.location.href = "/";
});
/** landing, landing-part EJS **/
$(".btn-forgot").click(function(e) {
  e.preventDefault();
  dataSocket.emit('userResetPassword', JSON.stringify({"email": $(".lg-form-email-input").val()}));
  $(".lg-form-email-input").val("");
});

dataSocket.on('userResetPassword', function (data) {
  data = JSON.parse(data);
  if(data.error)
	  showAlertModal("Your email is not found");
  else
	  showAlertModal("A letter with a form of  reset has been send to your email. If you have not received it within a minute, please check the spam box.");
});
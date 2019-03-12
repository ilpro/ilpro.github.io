/*** Slider init START */
var $from = $(".from-age");
var $to = $(".to-age");
var $ageSlider = $('#ageSlider');

$ageSlider.slider({
    range: true,
    min: 18,
    max: 50,
    values: [ $from.val(), $to.val() ],
    slide: function( event, ui ) {
        $from.val(ui.values[ 0 ]);
        $to.val(ui.values[ 1 ]);
    }, 
	stop: function( event, ui ) {
		updateSearchSettings();
	}
});

// change from field input
$from.change(function(){
    var val1 = parseInt($from.val());
    var val2 = parseInt($to.val());
    val1 = val1 < val2 ? val1 : val2;
    $ageSlider.slider( "values", 0, val1 );
	updateSearchSettings();
});
$to.change(function(){
    var val1 = parseInt($from.val());
    var val2 = parseInt($to.val());
    val2 = val2 > val1 ? val2 : val1;
    $ageSlider.slider( "values", 1, val2 );
	updateSearchSettings();
});
/*** Slider init END */

function updateSearchSettings(){
  var gender = [];
  $(".select-gender .gender-container.active").each(function () {
    gender.push($(this).data("val"));
  });

  var place = [];
  if($("#search-in-my-city:checked").length) place.push(2);
  if($("#search-worldwide:checked").length) place.push(1);

  var orientation = [];
  if($('.select-orientation input:checked').length){
    $('.select-orientation input:checked').each(function (){
      orientation.push(+$(this).attr('data-val'));
    });
  }

  var search = {
    gender: gender,
    orientation: orientation,
    place: place,
    ageFrom: parseInt($from.val()),
    ageTo: parseInt($to.val()),
    offset: 0,
    hash: userHash
  };

  dataSocket.emit('updateUserParam', JSON.stringify({key:"userSearchSettings", value:JSON.stringify(search), hash: userHash}));
}

$(".gender-container").click(function(){
	$(this).toggleClass("active");
	updateSearchSettings();
});

$(".search-button").click(function(){
  deleteCookie("lastTravelerId");
  dataSocket.emit('searchUser', JSON.stringify({hash: userHash}))
});

dataSocket.on("searchUser", function(data){
  data = JSON.parse(data);
  if(!data.user) {
    return showAlertModal('Sorry, nobody found by this criteria. Please try to change search preferences')
  }
  window.location.href = "/profile/" + data.user.userId;
});


$(".select-orientation input").change(function(){
  $(this).toggleClass("active");
  updateSearchSettings();
});

$("#search-in-my-city").change(function (){
  updateSearchSettings();
});

$("#search-worldwide").change(function (){
  updateSearchSettings();
});

// NOTIFICATIONS
$(".notification-settings-line .trigger").click(function(){
	$(this).toggleClass("active");
	dataSocket.emit('updateUserParam', JSON.stringify({key:$(this).data("key"), value:(($(this).hasClass("active")) ? 1 : 0), hash: userHash}));
});

dataSocket.on("updateUserParam", function(data){
	data = JSON.parse(data);
	if(data.success)
		showSettingsNotify("success", "Saved");
	else
		showSettingsNotify("danger", "Save error!");
});

$(".change-password").click(function(){
	$(".check-container").hide();
	if($("#new_password").val() != $("#repeat_password").val()) {
		showAlertModal("Passwords do not match!");
		$("#repeat_password").closest(".input-row").find(".check-container").show();
	}
	else
		dataSocket.emit('updateUserPassword', JSON.stringify({oldPass:$("#old_password").val(), newPass:$("#new_password").val(), hash: userHash}));
});
dataSocket.on("updateUserPassword", function(data){
	data = JSON.parse(data);
	if(data.error) {
		$("#" + data.field).closest(".input-row").find(".check-container").show();
		showAlertModal(data.error);
	}
	else {
		$("#old_password, #new_password").val("")
		showAlertModal("Your password has been changed successfully.");
	}
});

$(".delete-btn").click(function(){
	if(confirm("Are you sure, that you want to delete your profile?"))
		dataSocket.emit('deleteUser', JSON.stringify({hash:userHash}));
});

dataSocket.on('deleteUser', function (data) {
	data = JSON.parse(data);
	if(!data.success)
		showAlertModal('Error occurred while deleting profile!');
});
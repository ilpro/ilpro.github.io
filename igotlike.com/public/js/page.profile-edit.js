// $("#userPhone").inputmask("+38 (099) 999-99-99");

var timeoutId = false;
$(".decimals.kg, .decimals.sm").keyup(function(){
	clearTimeout(timeoutId);
	
	var obj = $(this).parent(".info-item").find(".info-parameter[data-name]");
	if(obj.data("name")){
		timeoutId = setTimeout(function() {
			// sendStatusIcoState("sending");
			dataSocket.emit('updateUserParam', JSON.stringify({
				"hash"	: userHash,
				"key"	: obj.data("name"),
				"value": obj.text()
			}));
		}, 1000);
	}
});
$(".decimals.kg, .decimals.sm").focusout(function(){
	var obj = $(this).parent(".info-item").find(".info-parameter[data-name]");
	if(obj.data("name")){
		// sendStatusIcoState("sending");
		dataSocket.emit('updateUserParam', JSON.stringify({
			"hash"	: userHash,
			"key"	: obj.data("name"),
			"value"	: obj.text()
		}));
	}

});
$(".info-items-container select").change(function(){
	// sendStatusIcoState("sending");
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash, 
		"key"	: $(this).attr("name"), 
		"value"	: $(this).val()
	}));
});
$("[name=birthDay], [name=birthMonth], [name=birthYear]").unbind("change").change(function(){
	var day = $("[name=birthDay]").val();
	var month = $("[name=birthMonth]").val();
	var year = $("[name=birthYear]").val();
	
	// sendStatusIcoState("sending");
	
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash, 
		"key"	: "userBdate", 
		"value"	: ((day && month && year) ? year + "-" + month + "-" + day : "0000-00-00")
	}));
});
$(".clickable input").change(function() {
	// sendStatusIcoState("sending");
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"	: userHash, 
		"key"	: $(this).attr("name"), 
		"value"	: (($(this).is(':checked')) ? 1 : 0)
	}));
});

dataSocket.on('updateUserParam', function (data) {
	data = JSON.parse(data);
	if(!data.success)
		alert(((data.text) ? data.text : "Помилка збереження."));
});


var $mainBody = $("body");
/*** User status changing functions ***/
var $parameterText = $(".parameter-text"),
	$saveButtonHolder = $(".save-button-holder"),
	$saveStatusButton = $(".save-status-btn"),
	$parameterField = $(".parameter-field"),
	userStatus = '';
$parameterText.on("focusin", function (e) {
	var $target = $(".parameter-field.editable");
	$target
		.find(".save-button-holder")
		.hide();
	$target
		.removeClass("editable")
		.find(".parameter-text")
		.text(userStatus);
	userStatus = $(e.target).text();
	$(e.target)
		.closest(".parameter-field")
		.addClass("editable")
		.find(".save-button-holder")
		.show();
});


$(document).on("keydown", ".parameter-text", function (e) {
	var $target = $(e.target).closest(".parameter-field");
	if (e.which == 27) {
		// Esc keyboard button close status input field
		// & returns old status
		$target
			.find(".save-button-holder")
			.hide();
		$target
			.removeClass("editable")
			.find(".parameter-text")
			.text(userStatus)
			.blur();
	}
	if (e.which == 13) {
		// Enter saves status
		e.preventDefault();
		$target
			.find(".save-status-btn")
			.click();
		$target
			.find(".parameter-text")
			.blur();
	}
});

$mainBody.click(function (e) {
		var isButtonArr = [],
			isNotButton;
		for (var i = 0; i< $parameterText.length; i++){
			isButtonArr[i] = !( !(e.target !=  $parameterText[i]) || !(e.target != $saveButtonHolder[i]) || !(e.target != $parameterField[i]) || !(e.target != $saveStatusButton[i]))
		}
		isNotButton = !isButtonArr.includes(false);
		if (isNotButton) {
			var $target = $(".parameter-field.editable");
			$target
				.find(".save-button-holder")
				.hide();
			$target
				.removeClass("editable")
				.find(".parameter-text")
				.text(userStatus)
				.blur();
		}
	}
);

$saveStatusButton.click(function (e) {
	var obj = $(this).closest(".parameter-field").find(".parameter-text");
	dataSocket.emit('updateUserParam', JSON.stringify({
		"hash"  : userHash,
		"key"  : obj.data("name"),
		"value"  : obj.text()
	}));
	userStatus = $(e.target).closest(".parameter-text").text();
	$(e.target).closest(".save-button-holder").hide();
	$(".parameter-field.editable").removeClass("editable");
});

/*** User status changing functions END***/

if (!Array.prototype.includes) {
	Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
		'use strict';
		var O = Object(this);
		var len = parseInt(O.length, 10) || 0;
		if (len === 0) {
			return false;
		}
		var n = parseInt(arguments[1], 10) || 0;
		var k;
		if (n >= 0) {
			k = n;
		} else {
			k = len + n;
			if (k < 0) {k = 0;}
		}
		var currentElement;
		while (k < len) {
			currentElement = O[k];
			if (searchElement === currentElement ||
				(searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
				return true;
			}
			k++;
		}
		return false;
	};
}
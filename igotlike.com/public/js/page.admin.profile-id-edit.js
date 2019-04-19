// set profileHash to upload photo
setCookie('editProfileHash', editUserHash, {path: "/"});

$("#userPhone").inputmask("+38 (099) 999-99-99");

var timeoutId = false;
$(".decimals.kg, .decimals.sm").keyup(function(){
  clearTimeout(timeoutId);

  var obj = $(this).parent(".info-item").find(".info-parameter[data-name]");
  if(obj.data("name")){
    timeoutId = setTimeout(function() {
      // sendStatusIcoState("sending");
      dataSocket.emit('updateUserParam', JSON.stringify({
        "hash"	: editUserHash,
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
      "hash"	: editUserHash,
      "key"	: obj.data("name"),
      "value"	: obj.text()
    }));
  }

});
$(".info-items-container select").change(function(){
  // sendStatusIcoState("sending");
  dataSocket.emit('updateUserParam', JSON.stringify({
    "hash"	: editUserHash,
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
    "hash"	: editUserHash,
    "key"	: "userBdate",
    "value"	: ((day && month && year) ? year + "-" + month + "-" + day : "0000-00-00")
  }));
});
$(".clickable input").change(function() {
  // sendStatusIcoState("sending");
  dataSocket.emit('updateUserParam', JSON.stringify({
    "hash"	: editUserHash,
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
    "hash"  : editUserHash,
    "key"  : obj.data("name"),
    "value"  : obj.text()
  }));
  userStatus = $(e.target).closest(".parameter-text").text();
  $(e.target).closest(".save-button-holder").hide();
  $(".parameter-field.editable").removeClass("editable");
});

$('.cpf-button').on("tap", function () {
  $(".cpf-container").toggleClass('active');
});

$('.cpf-list .pay-type-item').on("tap", function () {
  $(".cpf-container").removeClass('active');

  $(".pay-type-container").html($(this)[0].outerHTML).show();

  dataSocket.emit('updateUserParam', JSON.stringify({
    "hash": editUserHash,
    "key": "userPayFor",
    "value": $(this).data("type")
  }));
});

// open can pay for select
$('.pay-type-container').on('tap', function () {
  $(".cpf-container").toggleClass('active');
});

// загрузить изображение
$(".add-common-photo-button").ajaxUpload({
  url: "/profile/upload-image",
  name: "image",
  onSubmit: function () {
    return true;
  },
  onComplete: function (data) {
    data = JSON.parse(data);

    var html =
      '<div class="img-holder" data-imageid="' + data.imageId + '">\
        <svg class="delete-img" viewBox="0 0 21.9 21.9"><path d="M14.1 11.3c-.2-.2-.2-.5 0-.7l7.5-7.5c.2-.2.3-.5.3-.7s-.1-.5-.3-.7L20.2.3c-.2-.2-.5-.3-.7-.3-.3 0-.5.1-.7.3l-7.5 7.5c-.2.2-.5.2-.7 0L3.1.3C2.9.1 2.6 0 2.4 0s-.5.1-.7.3L.3 1.7c-.2.2-.3.5-.3.7s.1.5.3.7l7.5 7.5c.2.2.2.5 0 .7L.3 18.8c-.2.2-.3.5-.3.7s.1.5.3.7l1.4 1.4c.2.2.5.3.7.3s.5-.1.7-.3l7.5-7.5c.2-.2.5-.2.7 0l7.5 7.5c.2.2.5.3.7.3s.5-.1.7-.3l1.4-1.4c.2-.2.3-.5.3-.7s-.1-.5-.3-.7l-7.5-7.5z"/></svg>\
        <img src="' + data.image + '">\
        <div class="btn-main">Make main</div>\
      </div>';

    $("#photos-container").prepend(html);
  }
});


$(".popup-bg").on("click", function (e) {
  e.preventDefault();
  $(".popup-modal-wrapper, .popup-modal, .image-control").hide();
});

// удалить изображение
$(document).on("click", ".delete-img", function (e) {
  e.preventDefault();

  dataSocket.emit('deleteUserImage', JSON.stringify({
    "hash": editUserHash,
    "imageId": $(this).closest(".img-holder").attr("data-imageid")
  }));

  return false;
});
dataSocket.on('deleteUserImage', function (data) {
  data = JSON.parse(data);

  if (data.success) {
    $(".img-holder[data-imageid='" + data.imageId + "']").animate({
      width: 0,
      height: 0,
      opacity: 0
    }, 200, function () {
      this.remove();
    });
  }
});

$(document).on("click", ".btn-main", function () {
  var currentImage = {};
  currentImage.id = $(this).closest(".img-holder").attr("data-imageid");
  currentImage.image = $(this).closest(".img-holder").find("img").attr("src");

  // https://github.com/acornejo/jquery-cropbox
  var croppicOptions = {
    uploadUrl: '/profile/upload-image',
    cropUrl: '/profile/cropimage',
    loadPicture: currentImage.image,
    enableMousescroll: true,
    doubleZoomControls: true,
    rotateControls: false,
    loaderHtml: '<div class="loader bubblingG"><span id="bubblingG_1"></span><span id="bubblingG_2"></span><span id="bubblingG_3"></span></div> ',
    onReset: function () {
      $(".modal-wrapper").hide();
    },
    onAfterImgCrop: function (result) {
      $(".modal-wrapper").hide();
      $(".img-holder").removeClass('main-photo');
      $(".img-holder[data-imageid='" + currentImage.id  + "']").addClass('main-photo');
    },
    onError: function (errormessage) {
      console.log('onError:' + errormessage);
    }
  }
  var cropContainerPreload = new Croppic('croppic-modal', croppicOptions);
  $(".modal-wrapper").show();
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
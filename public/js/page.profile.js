$(".photo").click(function (e) {
  e.preventDefault();
  $(".user-gallery-modal-layout").find(".left, .right").hide();
  $(".user-gallery-modal-layout .user-gallery-modal-wrap").html('<img src="' + $(this).attr("href") + '">');
  $(".user-gallery-modal-layout").addClass("active");
});

$('.chat-privacy').click(function () {
  $('.chat-privacy').toggleClass('show');
});
$('.chat-privacy-option').click(function () {
  if ($(".chat-privacy").hasClass("show")) {
    dataSocket.emit('updateUserParam', JSON.stringify({
      "hash": userHash,
      "key": "userChatStatus",
      "value": $(this).data("status"),
    }));
    $('.chat-privacy-option').removeClass("active");
    $(this).addClass("active");
  }
});

dataSocket.on('updateUserParam', function (data) {
  data = JSON.parse(data);
  if (data.success)
    showSettingsNotify("success", "Saved");
  else
    showSettingsNotify("danger", "Save error!");
});

// info card
var choosenInit = false;
$(".more-info-card.info .edit, .more-info-card-edit.info .edit").click(function () {
  $(".more-info-card.info, .more-info-card-edit.info").toggleClass("hide");

  //choosen
  if (!choosenInit) {
    choosenInit = true;
    $(".chosen-select").chosen({allow_single_deselect: true, disable_search_threshold: 10});
  }
});
$(".more-info-card-edit.info .btn-done").click(function () {
  var name, str;
  var data = {hash: userHash};
  $(".more-info-card-edit input, .more-info-card-edit select").each(function () {
    name = $(this).attr("name");
    if ($(this).attr("type") == "checkbox")
      data[name] = $(this).is(':checked') ? 1 : 0;
    else if (name)
      data[name] = $(this).val();
    str += "'" + name + "', ";
  });

  dataSocket.emit('updateMyInfo', JSON.stringify(data));
});

dataSocket.on('updateMyInfo', function (data) {
  data = JSON.parse(data);

  for (var key in data) {
    if (data[key]) {
      if (key == "userChildren") {
        if (parseInt(data[key]) > 0) {
          $("." + key + " p").text(data[key]);
          $("." + key).show();
        }
      }
      else if (key == "userWeight" || key == "userHeight") {
        $("." + key + " p span").text(data[key]);
        $("." + key).show();
      }
      else {
        $("." + key + " p").text(data[key]);
        $("." + key).show();
      }
    }
    else
      $("." + key).hide();
  }

  $(".more-info-card.info, .more-info-card-edit.info").toggleClass("hide");

  showSettingsNotify("success", "Saved");
});

// myself card
$(".more-info-card.myself .edit, .more-info-card-edit.myself .edit").click(function () {
  $(".more-info-card.myself, .more-info-card-edit.myself").toggleClass("hide");
});
$(".more-info-card-edit.myself .btn-done").click(function () {
  var val = $(".more-info-card-edit.myself textarea").val();
  $(".more-info-card.myself .more-info-card-body").text(val)
  $(".more-info-card.myself, .more-info-card-edit.myself").toggleClass("hide");

  dataSocket.emit('updateUserParam', JSON.stringify({
    "hash": userHash,
    "key": $(".more-info-card-edit.myself textarea").attr("name"),
    "value": val,
  }));
});

// partner card
$(".more-info-card.partner .edit, .more-info-card-edit.partner .edit").click(function () {
  $(".more-info-card.partner, .more-info-card-edit.partner").toggleClass("hide");
});
$(".more-info-card-edit.partner .btn-done").click(function () {
  var val = $(".more-info-card-edit.partner textarea").val();
  $(".more-info-card.partner .more-info-card-body").text(val)
  $(".more-info-card.partner, .more-info-card-edit.partner").toggleClass("hide");

  dataSocket.emit('updateUserParam', JSON.stringify({
    "hash": userHash,
    "key": $(".more-info-card-edit.partner textarea").attr("name"),
    "value": val,
  }));
});

// обрезать изображение для аватара
var jcropApi;
var jcropX = 0;
var jcropY = 0;
var jcropX2 = 100;
var jcropY2 = 100;
var cropImgSrc = '';

$('#last-uploaded-images').on('click', '.single-photo', function () {
  cropImgSrc = $(this).find('img').attr('src');

  $(".user-crop-photo-modal").prepend('<img src="' + cropImgSrc + '" alt="crop photo" style="max-width: 800px; max-height: 800px;">');
  var $cropImg = $(".user-crop-photo-modal-layout").find("img");

  $(".user-crop-photo-modal-layout").addClass("active");

  function cropevent(c) {
    if (parseInt(c.w) > 0) {
      if (c.x < 0) jcropX = 0; else jcropX = Math.floor(c.x);
      if (c.y < 0) jcropY = 0; else jcropY = Math.floor(c.y);
      if (c.x2 < 0) jcropX2 = 0; else jcropX2 = Math.floor(c.x2);
      if (c.y2 < 0) jcropY2 = 0; else jcropY2 = Math.floor(c.y2);
    }
  }

  jcropApi = $.Jcrop($cropImg, {
    bgColor: 'white',
    bgOpacity: 0.3,
    aspectRatio: 1,
    minSize: [300, 300],
    setSelect: [0, 0, 300, 300],
    onChange: cropevent,
    onSelect: cropevent
  });
});

$(document).on('click', '#save-avatar' , function (){
  var reqObj = {
    hash: userHash,
    imgUrl: cropImgSrc,
    width: (jcropX2 - jcropX),
    height: (jcropY2 - jcropY),
    x: jcropX,
    y: jcropY
  };

  dataSocket.emit('updateAvatar', JSON.stringify(reqObj));
});

dataSocket.on('updateAvatar', function (data) {
  data = JSON.parse(data);
  if(!data.success) return showAlertModal(data.message);

  $('.profile-avatar-wrap a').attr('href', data.image.path);
  $('.profile-avatar-wrap img').attr('src', data.image.path);
  $('.user-avatar-holder img').attr('src', data.image.path);
  $("#last-uploaded-images").removeClass("active");
  jcropApi.destroy();
});

$(".user-crop-photo-modal-layout .close, .user-crop-photo-modal-layout .shadow").click(function () {
  $(".user-crop-photo-modal-layout").removeClass("active");
  jcropApi.destroy();
});

$(".user-crop-photo-modal-layout").on("click", "button", function () {
  dataSocket.emit('cropPhoto', JSON.stringify({
    "hash": userHash,
    "path": cropImgSrc,
    "x": jcropX,
    "y": jcropY,
    "width": (jcropX2 - jcropX),
    "height": (jcropY2 - jcropY)
  }));

  $(".user-crop-photo-modal-layout .close").trigger("click");
});

// select photo to update avatar
$(document).on('click', '#select-avatar', function () {
  $('#last-uploaded-images').addClass('active');
});

$(document).on('click', '#last-uploaded-images .shadow, #last-uploaded-images .close', function () {
  $('#last-uploaded-images').removeClass('active');
});

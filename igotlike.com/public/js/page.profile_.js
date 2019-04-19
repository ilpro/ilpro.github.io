$("img[data-src]").lazy();

dataSocket.on('userPlacesToVisit', function (places) {
  var places = JSON.parse(places);
  var placesHtml = '';

  for (var i = 0; i < places.length; i++) {
    placesHtml += '<div class="tag-place" style="text-transform: capitalize" data-id="' + places[i].id + '">' + places[i].place + '\
  <svg class="close" xmlns="http://www.w3.org/2000/svg" width="20.354" height="20.354" viewBox="0 0 20.354 20.354">\
    <title>close</title>\
    <line x1="0.177" y1="0.177" x2="20.177" y2="20.177" fill="none" stroke="#4d4d4d" stroke-miterlimit="10" stroke-width="1.5"></line>\
    <line x1="19.72" y1="0.634" x2="0.634" y2="19.72" fill="none" stroke="#4d4d4d" stroke-miterlimit="10" stroke-width="1.5"></line>\
  </svg>\
</div>';
  }

  $('.tag-place-container').html(placesHtml).show();
});

$('.cpf-button').on("tap", function () {
  $(".cpf-container").toggleClass('active');
});

$('.cpf-list .pay-type-item').on("tap", function () {
  $(".cpf-container").removeClass('active');

  $(".pay-type-container").html($(this)[0].outerHTML);

  dataSocket.emit('updateUserParam', JSON.stringify({
    "hash": userHash,
    "key": "userPayFor",
    "value": $(this).data("type")
  }));
});

$(".ribbons-menu-item").on("tap", function () {
  $(".ribbons-menu-item, .sub-page").removeClass("active");
  var keyAttr = $(this).addClass("active").attr("data-heading");
  $('.sub-page.' + keyAttr).toggleClass("active");
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


    var html = '<div class="single-photo" data-imageid="' + data.imageId + '">\
    <div class="main-info">\
      <div class="avatar-holder">\
        <div class="user-avatar" title="">\
          <img src="' + userInfo.userPhoto + '" alt="user" style="max-width: 100%;">\
        </div>\
      </div>\
      <div class="info-holder">\
        <div class="main-info-row">\
          <div class="name">' + userInfo.userName + '</div>\
        </div>\
        <div class="settings-dots">\
          <div class="settings-dot"></div>\
          <div class="settings-dot"></div>\
          <div class="settings-dot"></div>\
        </div>\
        <div class="publish-date">just now</div>\
      </div>\
    </div>\
    <a href="/image/4">\
      <img class="profile-img" src="' + data.image + '" alt="photo" style="display: block;">\
    </a>\
    <div class="photo-info">\
      <div class="like ">\
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 17 16">\
          <path fill="#313133" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9\
      4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77\
      3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
        </svg>\
        <div class="like-amount">0</div>\
      </div>\
    </div>\
  </div>\
</div>';

    $(".photos-wrapper").prepend(html);
  }
});

var currentImage = {id: 0, image: false};

$(".photos-wrapper").on("tap", ".settings-dots", function (e) {
  e.preventDefault();
  
  currentImage.id = $(this).parents(".single-photo").data("imageid");
  currentImage.image = $(this).parents(".single-photo").find(".profile-img").attr("src");

  $(".popup-modal-wrapper, .popup-modal, .image-control").show();
});


$(".popup-bg").on("click", function (e) {
  e.preventDefault();
  $(".popup-modal-wrapper, .popup-modal, .image-control").hide();
});

// удалить изображение
$(".delete-option").on("click", function (e) {
  e.preventDefault();

  $(".popup-modal-wrapper, .popup-modal, .image-control").hide();

  dataSocket.emit('deleteUserImage', JSON.stringify({
    "hash": getCookie("hash"),
    "imageId": currentImage.id
  }));
  
  return false;
});
dataSocket.on('deleteUserImage', function (data) {
  data = JSON.parse(data);

  if(data.success) {
    $(".single-photo[data-imageid='" + data.imageId + "']").animate({
      width: 0,
      height: 0,
      opacity: 0
    }, 200, function () {
      this.remove();
    });
  }
});

$(".make-main-option").on("click", function () {
  $(".popup-modal-wrapper, .popup-modal, .image-control").hide();
  $(".popup-post-wrapper, .popup-post-modal, .post-control").hide();

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
      $(".user-avatar img").attr("src", result.url);
    },
    onError: function (errormessage) {
      console.log('onError:' + errormessage);
    }
  }
  var cropContainerPreload = new Croppic('croppic-modal', croppicOptions);
  $(".modal-wrapper").show();
});
// show loader-bg
$(".sidebar-item, .page-profile-id .dating-navs, .right-side-camera a, .camgirl-holder a").click(function (e) {
  if ($(this).hasClass("sidebar-item") && $(this).hasClass("current"))
    e.preventDefault();
  else
    $(".loader-bg").addClass("active");
});
$(".header-info, .footer-info, .right-side-camera, .camgirl-holder, .notification-list").on("click", "a", function () {
  $(".loader-bg").addClass("active");
});

// поиск по нику в шапке
var searchTimeoutId;
$(".search-container").on("keyup", "input", function () {
  $(".search-container-wrap .sub-list").removeClass("active");
  var str = $(this).val().trim();
  if (!str.length) {
    $("#posts").show();
    $("#searched-posts").empty().hide();
    return;
  }

  if (searchTimeoutId) clearTimeout(searchTimeoutId);

  // timer to prevent spam server while user writing
  searchTimeoutId = setTimeout(function () {
    if(str[0] === '#' && str.substring(1).length > 0){
      dataSocket.emit('searchHashtags', JSON.stringify({hash: userHash, hashtag: str.substring(1)}));
    } else {
      dataSocket.emit('searchUserByNick', JSON.stringify({hash: userHash, nickname: str.toLowerCase()}));
    }
  }, 500);
});


dataSocket.on('searchHashtags', function (data) {
  data = JSON.parse(data);
  var tagsHtml = '';

  for (var i = 0; i < data.hashtags.length; i++) {
    tagsHtml += '<a class="help-tag" href="/posts/hashtags/'+ data.hashtags[i].hashtag +'">#'+ data.hashtags[i].hashtag +'</a>';
  }

  var tagsSectionHtml = '<div class="people-help">'+ tagsHtml +'</div>';
  $(".search-container-wrap .sub-list").empty().html(tagsSectionHtml).addClass("active");
});

dataSocket.on('searchUserByNick', function (data) {
  data = JSON.parse(data);

  var html = '';
  for (var i = 0; i < data.length; i++) {
    html += '<div class="link-wrap">\
	<div class="row align-items-center sub-item m-0 justify-content-between">\
		<div class="row m-0 align-items-center">\
			<figure class="user-avatar-holder">\
				<img src="' + data[i].userPhoto + '" alt="photo">\
			</figure>\
      <div class="people-help-info">\
          <p><span class="id-main">ID:685987</span><a href="/profile/' + data[i].userId + '> <span class="nick">' + data[i].userName + '</span></a></p>\
          <p>28 years, Kiev, Ukraine</p>\
      </div>\
			<!-- <p><a href="/profile/' + data[i].userId + '">' + data[i].userName + '</a></p> -->\
		</div>\
		<div class="row justify-content-end m-0 sub-info align-items-center">\
			<a href="/chat#id=' + data[i].userId + '"><svg class="user-msg" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.01 32.12"><path d="M.5 15.72a15.22 15.22 0 1 1 30.44 0 14.94 14.94 0 0 1-2.18 7.8l2.75 8.1-8.43-2.68A15.24 15.24 0 0 1 .5 15.72z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>\
			<button data-id="' + data[i].userId + '">\
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15.24"><defs></defs><path d="M9.151 9.914l-.517-.268a.666.666 0 0 1-.367-.589v-.84a5.246 5.246 0 0 0 .932-1.839.993.993 0 0 0 .4-.79V4.572a.985.985 0 0 0-.267-.667V2.554A2.2 2.2 0 0 0 8.775.9 3.452 3.452 0 0 0 6.133 0a3.452 3.452 0 0 0-2.642.9 2.2 2.2 0 0 0-.558 1.657v1.348a.984.984 0 0 0-.267.667v1.016a.992.992 0 0 0 .4.79 5.241 5.241 0 0 0 .933 1.838v.84a.667.667 0 0 1-.367.589l-2.378 1.237a2.276 2.276 0 0 0-1.255 2.011v1.077a.26.26 0 0 0 .267.254h9.075a3.634 3.634 0 0 1-.19-4.31z"></path><path d="M12.536 8.636a3.306 3.306 0 1 0 3.467 3.3 3.391 3.391 0 0 0-3.467-3.3zm1.6 3.556h-1.333v1.27a.267.267 0 0 1-.533 0v-1.27h-1.334a.254.254 0 1 1 0-.508h1.333v-1.27a.267.267 0 0 1 .533 0v1.27h1.334a.254.254 0 1 1 0 .508z"></path></svg>\
			<span>Following</span></button>\
		</div>\
	</div>\
</div>';
  }

  if (html)
    $(".search-container-wrap .sub-list").html(html).addClass("active");
});

$(".search-container .close").click(function () {
  $(".search-container input").val("");
  $(".search-container-wrap .sub-list").removeClass("active");

  $("#posts").show();
  $("#searched-posts").empty().hide();
});

// Hide photo gallery modal
$(".user-gallery-modal-layout").on("click", ".shadow, .close", function () {
  $(this).closest(".user-gallery-modal-layout").removeClass("active");
});

/** ALERT modal window ***/
function showAlertModal(content) {
  $('#alert-modal-text').html(content);
  $('#alert-modal').addClass('active');
};

$('#alert-modal-confirm, #alert-modal-cancel, #alert-modal-close').on('click', function () {
  $('#alert-modal').removeClass('active');
});

// chat notify modal
function showChatNotify(icon, title, message, url) {
  var notify = $.notify({
    // options
  }, {
    // settings
    element: 'body',
    position: null,
    allow_dismiss: false,
    newest_on_top: false,
    showProgressbar: false,
    placement: {
      from: "bottom",
      align: "right"
    },
    offset: {
      x: 10,
      y: 10
    },
    spacing: 5,
    z_index: 1031,
    delay: 5000,
    timer: 1000,
    mouse_over: null,
    animate: {
      enter: 'animated fadeInDown',
      exit: 'animated fadeOutDown'
    },
    onShow: null,
    onShown: null,
    onClose: null,
    onClosed: null,
    icon_type: 'image',
    template: '<div data-notify="container">\
        <a data-notify="url" href="{3}" class="msg-notification">\
            <div class="rose-line" style="#FF5A60"></div>\
            <figure  class="user-avatar">\
            <img data-notify="icon" style="max-width: 100%">\
            </figure>\
            <div class="text">\
                <div data-notify="title" class="nickname">{1}</div>\
                <div data-notify="message" class="msg-text">"{2}"</div>\
            </div>\
        </a>' +
    '</div>'
  });
  notify.update({
    icon: icon,
    title: title,
    message: message,
    url: url
  })
};

function showSettingsNotify(functionState, messageText) {
  var notify = $.notify({
    // options
  }, {
    // settings
    element: 'body',
    position: null,
    allow_dismiss: false,
    newest_on_top: false,
    showProgressbar: false,
    placement: {
      from: "bottom",
      align: "right"
    },
    offset: {
      x: 10,
      y: 10
    },
    spacing: 5,
    z_index: 1031,
    delay: 5000,
    timer: 1000,
    mouse_over: null,
    animate: {
      enter: 'animated fadeInDown',
      exit: 'animated fadeOutDown'
    },
    onShow: null,
    onShown: null,
    onClose: null,
    onClosed: null,
    template: '<div data-notify="container" class="alert alert-{0}" role="alert">' +
    '<span data-notify="message">{2}</span>' +
    '</div>'
  });
  notify.update({
    type: functionState,
    message: messageText
  })
};

$(".btn-follow").click(function(){
	dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:$(this).data("userid")}));
	$(this).toggleClass("active");
});
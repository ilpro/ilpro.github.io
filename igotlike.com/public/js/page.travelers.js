var profileId = false;
var search = (getCookie("search")) ? JSON.parse(getCookie("search")) : {
  gender: [1, 2],
  place: [1, 2],
  ageFrom: 18,
  ageTo: 50,
  offset: 0
};
search.hash = userHash;

var myRe = /^#\/preview\/([0-9]+)$/g;
var matches = myRe.exec(window.location.hash);
if (matches != null) {
  profileId = matches[1];
  dataSocket.emit('getPreviewUser', JSON.stringify({profileId: profileId, hash: userHash}));
}
else
  dataSocket.emit('searchUser', JSON.stringify(search));

/** Popular places **/
dataSocket.emit('getPopularPlaces', JSON.stringify({hash: userHash}));

dataSocket.on('popularPlaces', function (places) {
  var popularPlaces = JSON.parse(places);
  var placesHtml = '';

  for (var i = 0; i < popularPlaces.length; i++) {
    placesHtml +=
      '<div class="tag-place" style="text-transform: capitalize">' + popularPlaces[i].place + '</div>';
  }

  $('.popular-places').html(placesHtml).show();
});

/*** Places user wants to visit ***/
dataSocket.emit('getPlacesToVisit', JSON.stringify({hash: userHash}));

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

  $('#user-places').html(placesHtml).show();
});


$(".tag-place-container").on("tap", ".tag-place .close", function () {
  var id = $(this).parent().attr('data-id');
  dataSocket.emit('removePlaceToVisit', JSON.stringify({hash: userHash, recordId: id}));
  $(this).parent().remove();
});

/*** Swiper init */
var swiper = $('.swiper-container').swiper({
  nextButton: '.swiper-button-next',
  prevButton: '.swiper-button-prev',
  pagination: false,
  paginationClickable: false,
  preloadImages: false,
  lazyLoading: true,
  loop: true
});
$(window).on("orientationchange", function () {
  swiper.update();
});
/*** Swiper init  end*/

/*** Slider init */
var $from = $(".from-age");
var $to = $(".to-age");
var $ageSlider = $('#ageSlider');

$ageSlider.slider({
  range: true,
  min: 18,
  max: 50,
  values: [search.ageFrom, search.ageTo],
  slide: function (event, ui) {
    $from.val(ui.values[0]);
    $to.val(ui.values[1]);
  }
});


// set input value
$from.val($ageSlider.slider("values", 0));
$to.val($ageSlider.slider("values", 1));

//change from field input
$from.change(function () {
  var val1 = parseInt($from.val());
  var val2 = parseInt($to.val());
  val1 = val1 < val2 ? val1 : val2;
  $ageSlider.slider("values", 0, val1);
});
$to.change(function () {
  var val1 = parseInt($from.val());
  var val2 = parseInt($to.val());
  val2 = val2 > val1 ? val2 : val1;
  $ageSlider.slider("values", 1, val2);
});
/*** Slider init END*/

/*** Gender & want-lives ***/
$(".form-body .gender-container").click(function () {
  $(this).toggleClass("active");
});

for (var i = 0; i < search.gender.length; i++)
  $(".form-body .true-select-gender .gender-container[data-val=" + search.gender[i] + "]").addClass("active");
for (var i = 0; i < search.place.length; i++)
  $(".form-body .want-lives .gender-container[data-val=" + search.place[i] + "]").addClass("active");
/*** Gender & want-lives end ***/

$(".search-button").on("click", function () {
  var gender = [];
  $(".true-select-gender .gender-container.active").each(function () {
    gender.push($(this).data("val"));
  });

  var place = [];
  $(".want-lives .gender-container.active").each(function () {
    place.push($(this).data("val"));
  });

  search = {
    gender: gender,
    place: place,
    ageFrom: parseInt($from.val()),
    ageTo: parseInt($to.val()),
    offset: 0,
    hash: userHash
  }

  dataSocket.emit('searchUser', JSON.stringify(search));
});

dataSocket.on('searchUser', function (data) {
  data = JSON.parse(data);

  if (data.user) {
    profileId = data.user.userId;

    window.location.hash = "/preview/" + profileId;

    document.title = data.user.userNickname + ", " + data.user.userAge + ", " + data.user.userCity;

    //Информация в шапке
    $(".header-profile-info .user-avatar img").attr("src", data.user.userPhoto);
    $(".header-profile-info .recipient-id").text(data.user.userId).show();
    $(".header-profile-info .nickname").text(data.user.userNickname);
    $(".header-profile-info .user-city").text(data.user.userCity + ", " + data.user.userCountry);
    $('#message-link').attr('href', 'chat#id=' + data.user.userId);

    //картинки вместе со слайдами
    swiper.removeAllSlides();
    swiper.appendSlide('<div class="swiper-slide">\
			<a href="/profile/' + profileId + '" class="sizebox check-auth"></a>\
			<img data-src="' + data.user.userPhoto + '" class="swiper-lazy pick-image first">\
			<div class="swiper-lazy-preloader swiper-lazy-preloader-white"></div>\
		</div>');
    for (var i = 0; i < data.images.length; i++) {
      swiper.appendSlide('<div class="swiper-slide">\
				<a href="/profile/' + profileId + '" class="sizebox check-auth"></a>\
				<img data-src="' + data.images[i].path + '" class="swiper-lazy pick-image">\
				<div class="swiper-lazy-preloader swiper-lazy-preloader-white"></div>\
			</div>');
    }
    swiper.appendSlide('<div class="swiper-slide">\
			<a href="/profile/' + profileId + '" class="sizebox check-auth"></a>\
			<div class="endslide-box">\
				<svg xmlns="http://www.w3.org/2000/svg" width="50" height="44" viewBox="0 0 50 44">\
				<g fill="#FFF">\
					<path d="M49.63 13.8L21.3.08c-.33-.16-.73-.02-.9.3l-6.15 13.1h3.36l4.53-9.62L46.7\
					15.77 39.02 32.1 34.7 30v8.63l2.65 1.3c.33.15.73 0 .9-.33l11.7-24.9c.15-.33 0-.73-.32-.9zm0 0"/>\
					<path d="M32.06 15.07H.66c-.36 0-.66.3-.66.66v27.6c0 .37.3.67.67.67h31.4c.36 0\
					.65-.3.65-.67v-27.6c0-.36-.3-.66-.66-.66zm-1.8 21.14h-2c-1.16-3-2.6-7.23-4.75-6.67-2.53.66-3.8\
					6.68-3.8 6.68s-1.3-6.78-4.88-10.42C11.24 22.14 7.77 36.2 7.77 36.2H3.03V18.13h27.22v18.1zm0 0"/>\
					<path d="M9.64 22c0 1.25-1 2.26-2.22 2.26-1.22 0-2.22-1-2.22-2.26 0-1.25 1-2.26 2.22-2.26\
					1.23 0 2.22 1 2.22 2.26zm0 0M22.32 23.6c.5 0 .97-.06 1.38-.15.5.2 1.08.34 1.72.34\
					1.63 0 2.96-.82 2.96-1.82s-1.33-1.82-2.96-1.82c-.62 0-1.2.12-1.66.32-.05\
					0-.43-.28-.6-.3-.37-.05-.8-.06-1.13.14-.28.18-.45.48-.5.8-1.32.15-2.3.64-2.3 1.2 0\
					.7 1.38 1.27 3.1 1.27zm0 0"/>\
				</g>\
				</svg>\
			<div class="endslide-button check-auth">' + lang.lDatingMorePhotos + '</div>\
			</div> \
		</div>');
    swiper.slideTo(1);

    if (data.user.userStatus) {
      $(".page-single-pick .quote span").text(data.user.userStatus).show();
      $(".page-single-pick .quote").show();
    }
    else
      $(".page-single-pick .quote").hide();

    var html = "";
    if (data.user.userWantToVisit) {
      data.user.userWantToVisit.split(', ').forEach(function (el) {
        html += '<div class="tag-place" style="text-transform: capitalize">' + el.split(':')[1] + '</div>'
      });
      $(".tag-place-container.slider").html(html);
    }
    else
      $(".tag-place-container.slider").html("");

    /* html = "";
     if(data.user.userPayFor == 1)
     html = '<div class="pay-type-item two">I can pay for both\
     <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><title>pay-type-2</title><path d="M23.181,20.455a1.364,1.364,0,1,1,1.364-1.364,1.365,1.365,0,0,1-1.364,1.364ZM27.954,15H23.181a4.091,4.091,0,1,0,0,8.182h4.773A2.048,2.048,0,0,0,30,21.137V17.046A2.048,2.048,0,0,0,27.954,15Z" fill="#fff"></path><path d="M23.181,13.637h4.773a.681.681,0,0,0,.682-.682V10.909A2.721,2.721,0,0,0,26.126,8.2L22.21,1.365a2.7,2.7,0,0,0-3.7-1L5.085,8.182H2.727A2.73,2.73,0,0,0,0,10.909V27.273A2.73,2.73,0,0,0,2.727,30H25.909a2.73,2.73,0,0,0,2.727-2.727V25.227a.681.681,0,0,0-.682-.682H23.181a5.454,5.454,0,1,1,0-10.909ZM8.1,20.345l.367.368.5.5L7.212,22.97,5.09,20.848,2.969,22.97,1.212,21.213l.869-.868.369-.369.885-.885L1.212,16.971l1.757-1.759L5.09,17.336l2.122-2.124L8.97,16.971,6.849,19.092Zm7.854,2.321H10.969v-1l.909-.822c1.536-1.373,2.283-2.163,2.3-2.985,0-.573-.346-1.027-1.158-1.027a2.549,2.549,0,0,0-1.5.584l-.465-1.179a3.891,3.891,0,0,1,2.3-.725,2.185,2.185,0,0,1,2.467,2.206c0,1.179-.854,2.12-1.872,3.028l-.648.541v.022h2.65ZM10.487,8.182H7.8l11.4-6.636a1.319,1.319,0,0,1,1.013-.136,1.336,1.336,0,0,1,.819.633v0ZM23.056,5.587l1.486,2.595H18.6Z" fill="#fff"></path></svg>\
     </div>';
     else if(data.user.userPayFor == 2)
     html = '<div class="pay-type-item one">I can pay only for myself\
     <svg xmlns="http://www.w3.org/2000/svg" width="29.999" height="30" viewBox="0 0 29.999 30"><title>pay-type-1</title><path d="M23.181,20.455a1.364,1.364,0,1,1,1.364-1.364,1.365,1.365,0,0,1-1.364,1.364ZM27.954,15H23.181a4.091,4.091,0,1,0,0,8.182h4.773A2.048,2.048,0,0,0,30,21.136V17.046A2.048,2.048,0,0,0,27.954,15Z" fill="#fff"></path><path d="M23.181,13.637h4.773a.681.681,0,0,0,.682-.682V10.909A2.721,2.721,0,0,0,26.126,8.2L22.21,1.365a2.7,2.7,0,0,0-3.7-1L5.085,8.182H2.727A2.73,2.73,0,0,0,0,10.909V27.273A2.73,2.73,0,0,0,2.727,30H25.909a2.73,2.73,0,0,0,2.727-2.727V25.227a.681.681,0,0,0-.682-.682H23.181a5.454,5.454,0,1,1,0-10.909ZM8.1,20.345l.367.368.5.5L7.212,22.97,5.09,20.848,2.969,22.97,1.212,21.213l.869-.868.369-.369.885-.885L1.212,16.971l1.757-1.759L5.09,17.336l2.122-2.124L8.97,16.971,6.849,19.092Zm6.634,2.321H13.049V16.76h-.023l-1.422.676-.287-1.307,1.972-.917h1.446ZM10.487,8.182H7.8l11.4-6.636a1.319,1.319,0,0,1,1.013-.137,1.337,1.337,0,0,1,.819.633v0ZM23.056,5.587l1.486,2.595H18.6Z" fill="#fff"></path></svg>\
     </div>';
     else if(data.user.userPayFor == 3)
     html = '<div class="pay-type-item none">I can not pay\
     <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><title>pay-type-3</title><path d="M23.181,20.455a1.364,1.364,0,1,1,1.364-1.364,1.365,1.365,0,0,1-1.364,1.364ZM27.954,15H23.181a4.091,4.091,0,1,0,0,8.182h4.773A2.048,2.048,0,0,0,30,21.137V17.046A2.048,2.048,0,0,0,27.954,15Z" fill="#fff"></path><path d="M23.181,13.637h4.773a.681.681,0,0,0,.682-.682V10.909A2.722,2.722,0,0,0,26.126,8.2L22.21,1.365a2.7,2.7,0,0,0-3.7-1L5.085,8.182H2.727A2.73,2.73,0,0,0,0,10.909V27.273A2.73,2.73,0,0,0,2.727,30H25.909a2.73,2.73,0,0,0,2.727-2.727V25.227a.682.682,0,0,0-.682-.682H23.181a5.454,5.454,0,0,1,0-10.909Zm-8.776,7.813.477.478.651.649L13.25,24.858,10.495,22.1,7.74,24.858,5.458,22.577l1.128-1.127.479-.479,1.149-1.149L5.458,17.066,7.74,14.782l2.755,2.758,2.755-2.758,2.283,2.284-2.755,2.755ZM10.487,8.182H7.795l11.4-6.636a1.319,1.319,0,0,1,1.013-.136,1.337,1.337,0,0,1,.819.633v0ZM23.056,5.587l1.486,2.595H18.6Z" fill="#fff"></path></svg>\
     </div>';

     $(".pay-type-container").html(html); */

    $(".menu .profile").attr('href', "/profile/" + data.user.userId);
    $("#message-link").attr('href', "/chat#" + data.user.userId);

    if (data.user.favorite)
      $(".menu-item.favorite").addClass("active");
    else
      $(".menu-item.favorite").removeClass("active");

    search.offset = data.offset;
    setCookie("search", JSON.stringify(search), {"path": "/", "expires": 31536000});
  }
  else
    alert("Nothing found :(");
});

// следуйщий профиль
$(".page-single-pick .next-user").on("click", function () {
  search.offset += 1;
  dataSocket.emit('searchUser', JSON.stringify(search));
});
// предидущий профиль
$(".page-single-pick .previous-user").on("click", function () {
  search.offset -= 1;
  dataSocket.emit('searchUser', JSON.stringify(search));
});

// добавить в фавориты
$(".menu-item.favorite").on("click", function () {
  if (userHash && profileId)
    dataSocket.emit('addUserFavorite', JSON.stringify({hash: userHash, profileId: profileId}));
});
dataSocket.on('addUserFavorite', function (data) {
  data = JSON.parse(data);

  if (data.action == "add")
    $(".menu-item.favorite").addClass("active");
  else
    $(".menu-item.favorite").removeClass("active");
});
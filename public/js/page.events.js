$(".btn-make-event").click(function(){
	$(".make-event").toggleClass("active");
});

var map;
var marker;
var geocoder;
function initAutocomplete() {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: {lat: 48.856614, lng: 2.3522219},
		zoom: 13
	});
	
	// This event listener will call addMarker() when the map is clicked.
	map.addListener('click', function(event) {
		addMarker(event.latLng);
	});	
	
	var searchBox = new google.maps.places.SearchBox(document.getElementById('event-location-name'));
	
	searchBox.addListener('places_changed', function () {
		var placeInfo = searchBox.getPlaces()[0];

		if (!placeInfo.geometry) {
			// User entered the name of a Place that was not suggested and
			// pressed the Enter key, or the Place Details request failed.
			$('#place-address').attr('placeholder', 'Sorry, nothing found');
			return;
		}
		
		console.log(placeInfo.geometry);
		addMarker(placeInfo.geometry.location);
		map.setCenter(placeInfo.geometry.location);
	});
}

function addMarker(pos) {
	if(marker)
		marker.setMap(null);
	
	marker = new google.maps.Marker({
		position: pos,
		map: map, 
		draggable: true,
		animation: google.maps.Animation.DROP,
	});
	
	getAddress(marker.getPosition());
	
	google.maps.event.addListener(marker, 'dragend', function() {
		getAddress(marker.getPosition());
	});
}

function getAddress(pos) {
	geocoder.geocode({
		latLng: pos
	}, function(responses) {
		if (responses && responses.length > 0) {
			var city = "";
			for (var i=0; i<responses[0].address_components.length; i++)
                if (responses[0].address_components[i].types[0] == "locality")
                       city = responses[0].address_components[i];
			
			$(".event-location-name").val(responses[0].formatted_address).data("latlng", (pos.lat() + "," + pos.lng())).data("city", city.long_name);
		}
		else
			$(".event-location-name").val('Cannot determine address at this location.');
	});
}

/* if(marker) {
	marker = new google.maps.Marker({
		position: new google.maps.LatLng(a, b),
		map: map,
		title:"Hello World!" 
	});
}

google.maps.event.addListener(map, 'click', function(event) {
	if(marker)
		marker.setMap(null);
	marker = new google.maps.Marker({
		position: event.latLng,
		draggable: true,
		map: map
	});
	$("#form [name=latLng]").val(event.latLng.lat() + ", " + event.latLng.lng());
}); */


var $uploadPhotoArea = $(".btn-upload-image");
$uploadPhotoArea.upload({
	action: "/events/upload-image",
	postKey: "image", 
	maxSize: 15728640, 
	label: '<svg width="28px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27.947 24.747"><g transform="translate(-.001)"><circle cx="1.92" cy="1.92" r="1.92" transform="translate(8.614 6.107)"/><path d="M26.294 15.094a5.913 5.913 0 0 0-3.307-1.573V3.76a3.839 3.839 0 0 0-1.093-2.667A3.726 3.726 0 0 0 19.227 0H3.76a3.839 3.839 0 0 0-2.667 1.093A3.726 3.726 0 0 0 0 3.76v15.921a3.839 3.839 0 0 0 1.093 2.667 3.726 3.726 0 0 0 2.667 1.093h14.96a5.642 5.642 0 0 0 7.574-8.347zM1.413 3.76A2.368 2.368 0 0 1 3.76 1.413h15.467a2.368 2.368 0 0 1 2.347 2.347v8.32l-3.947-3.92a.716.716 0 0 0-1.013 0l-5.947 5.974L6.64 10.08a.716.716 0 0 0-1.013 0l-4.214 4.267zm2.32 18.294v-.027a2.34 2.34 0 0 1-1.653-.693 2.434 2.434 0 0 1-.667-1.653v-3.334L6.16 11.6l4.027 4.027a.742.742 0 0 0 1.013 0l5.947-5.974 3.893 3.92-.24.08a2.477 2.477 0 0 0-.347.107c-.107.027-.213.08-.32.107a.8.8 0 0 0-.213.107 2.477 2.477 0 0 0-.267.133l-.4.24c-.08.053-.133.08-.213.133-.053.027-.08.053-.133.08a3.217 3.217 0 0 0-.64.56 5.641 5.641 0 0 0-1.653 4 5.863 5.863 0 0 0 .133 1.173c.027.107.053.187.08.293.08.267.16.533.267.8v.027a4.892 4.892 0 0 0 .347.64zm21.521.027a4.219 4.219 0 0 1-5.894.053c-.107-.107-.213-.24-.32-.347-.08-.08-.16-.187-.24-.267a2.532 2.532 0 0 1-.267-.453c-.053-.107-.107-.187-.16-.293a2.253 2.253 0 0 1-.133-.453c-.027-.107-.08-.24-.107-.347a4.414 4.414 0 0 1-.08-.853 4.28 4.28 0 0 1 1.227-2.987 4.168 4.168 0 0 1 2.987-1.227 4.28 4.28 0 0 1 2.987 1.227 4.123 4.123 0 0 1 1.227 2.987 4.265 4.265 0 0 1-1.227 2.96z"/><path d="M24.588 18.374h-1.627v-1.627a.72.72 0 1 0-1.44 0v1.627h-1.627a.72.72 0 1 0 0 1.44h1.627v1.627a.72.72 0 1 0 1.44 0v-1.627h1.627a.72.72 0 1 0 0-1.44z"/></g></svg> Add'
});

$uploadPhotoArea.on("filecomplete", function(obj, file, res){
	var data = JSON.parse(res);
	if(data.error)
		return showAlertModal(data.error);

	var newImg = new Image();
    newImg.onload = function () {
		$(".chusen-event-photo .event-photo").remove();
		$(".chusen-event-photo").prepend('<img src="' + data.image + '" data-width="' + data.width + '" data-height="' + data.height + '" class="event-photo">').show();
    }
    newImg.src = data.image;
});

$(".chusen-event-photo .btn-delete").click(function(){
	$(".chusen-event-photo").hide();
	$(".chusen-event-photo .event-photo").remove();
});

var event = {};
$(".btn-create-event").click(function(){
	event = {
		"hash": userHash,
		"name": $(".event-title").val(),
		"details": $(".event-details").val(),
		"image": $(".chusen-event-photo .event-photo").attr("src"),
		"width": $(".chusen-event-photo .event-photo").data("width"),
		"height": $(".chusen-event-photo .event-photo").data("height"),
		"locationCity": $(".event-location-name").data("city"),
		"locationName": $(".event-location-name").val(),
		"locationLatLng": $(".event-location-name").data("latlng"),
		"date": $(".event-year").val() + "-" + $(".event-month").val() + "-" + $(".event-day").val() + " " + $(".event-hours").val() + ":" + $(".event-minute").val() + ":00"
	};
	
	if(!event.name)
		showAlertModal("Give name to your event");
	else if(!event.details)
		showAlertModal("Write details of your event");
	else if(!event.image)
		showAlertModal("Upload a cover photo for your event");
	else if(!event.locationName)
		showAlertModal("Write location of your event");
	else if(!event.locationLatLng)
		showAlertModal("Pick event location on the map");
	else if(!$(".event-day").val() || !$(".event-month").val() || !$(".event-year").val() || !$(".event-hours").val() || !$(".event-minute").val())
		showAlertModal("Set the date and time of event");
	else
		dataSocket.emit('addEvent', JSON.stringify(event));
});
dataSocket.on('addEvent', function (data) {
  data = JSON.parse(data);
  
  if(!data.error) {
	var html = '<div class="event">\
	<div class="details" id="details">\
		<div class="dismis">\
			<h2>' + event.name + '</h2>\
			<div id="dis"><img src="/img/events/close.svg"></div>\
		</div>\
	</div>\
	<div class="first-information moderation">\
		<div class="pending d-none">\
			<img src="/img/events/pending.svg">\
		</div>\
		<div class="event-picture">\
			<img src="' + event.image + '" alt="">\
		</div>\
		<div class="mini-info">\
			<h3 class="date-time">' + event.date + '</h3>\
			<h3 class="event-name">' + event.name + '</h3>\
			<p class="place">' + event.locationName + '</p>\
		</div>\
		<div class="people-joint">\
			<button class="btn joint">Join event chat</button>\
		</div>\
	</div>\
</div>';
	$(".make-event").after(html);
	$(".make-event").removeClass("active");
  }
  else
	  showAlertModal(data.error);
});

$(".event").on("click", ".event-picture, .mini-info", function(){
	$(this).closest(".event").find(".details").toggleClass("active");
});
$(".event").on("click", ".dismis div", function(){
	$(this).closest(".event").find(".details").removeClass("active");
});

$(".events").on("click", ".btn.joint", function(){
	dataSocket.emit('joinToEvent', JSON.stringify({eventId:$(this).closest(".event").data("id"), "hash": userHash}));
});

dataSocket.on('joinToEvent', function (data) {
  data = JSON.parse(data);
  
  var $item = $(".event[data-id=" + data.eventId + "]");
  
  if(data.result == "add") {
	  $item.find(".people-joint .people .photo-people").append('<figure data-userid=' + data.userId + '>\
		<img src="' + $(".header-info-user-container .user-avatar-holder img").attr("src") + '" alt="">\
	</figure>');
	  
	  var n = parseInt($item.find(".people-joint .people span").text()) + 1;
	  $item.find(".people-joint .people span").text(n);
	  
	  $item.find(".btn.joint").text("Leave");
  }
  else if(data.result == "remove") {
	  var n = parseInt($item.find(".people-joint .people span").text()) - 1;
	  $item.find(".people-joint .people span").text(n);
	  $item.find(".people-joint .people .photo-people [data-userid=" + data.userId + "]").remove();
	  $item.find(".btn.joint").text("Join event chat");
  }
});

window.addEventListener("load", function(event) { 
	if(window.location.hash) {
		var re = /^#[0-9]+$/;
		if(re.test(window.location.hash)) {
			var eventId = window.location.hash.replace("#", "");
			$(".event[data-id=" + eventId + "] .details").addClass("active");
			$('html, body').animate({
				scrollTop: $(".event[data-id=" + eventId + "]").offset().top + 'px'
			}, 'fast');
		}
	}
});
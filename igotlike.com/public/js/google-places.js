// Autocomplete func for GOOGLE PLACES API. Calls from google script in body tag
function initAutocomplete() {
    handleILiveIn();
    handleWantToVisit();
    handlePopularPlaces();
    handleAddPopularPlaces();
};


if(typeof editUserHash !== 'undefined'){
  userHash = editUserHash;
}

// User city and country
function handleILiveIn() {
  var input = (document.getElementById('i-live-in'));
  var autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', function () {
    var placeInfo = autocomplete.getPlace();

    if (!placeInfo.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      $('#place-visit').attr('placeholder', 'Sorry, nothing found');
      return;
    }

    // get country name from response
    var countryObj = placeInfo.address_components.filter(function (elem) {
      return elem.types.includes('country');
    });

    var countryName = countryObj[0].long_name;
    var userCity = placeInfo.name;

    dataSocket.emit('addUserRegion', JSON.stringify({
      hash: userHash,
      city: userCity,
      countryName: countryName
    }));

    $('#i-live-in').val('');
  });
};

// User want to visit places or countries
function handleWantToVisit() {
  var inputs = (document.getElementsByClassName('place-visit'));

  for (var i = 0; i < inputs.length; i++) {
    var autocomplete = new google.maps.places.Autocomplete(inputs[i]);
    autocomplete.addListener('place_changed', function () {
      var placeInfo = autocomplete.getPlace();

      if (!placeInfo.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        $('.place-visit').attr('placeholder', 'Sorry, nothing found');
        return;
      }

      // get country name from response
      var countryObj = placeInfo.address_components.filter(function (elem) {
        return elem.types.includes('country');
      });

      var countryName = countryObj[0].long_name;
      var placeName = placeInfo.name;

      placeName = placeInfo.name + ', ' + countryName;

      addPlacePreview(placeName);

      dataSocket.emit('addPlaceToVisit', JSON.stringify({
        hash:  userHash,
        place: placeName
      }));

      $('.place-visit').val('');
    });
  }
}

// Add to user want to visit places from popular list
function handlePopularPlaces(){
  $(document).on("click touchend", ".popular-places .tag-place", function () {
    var placeName = $(this).html();

    addPlacePreview(placeName);

    dataSocket.emit('addPlaceToVisit', JSON.stringify({
      hash:  userHash,
      place: placeName
    }));
  });
}

// Admin add popular places
function handleAddPopularPlaces(){
  var input = (document.getElementById('add-place-popular'));
  var autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', function () {
    var placeInfo = autocomplete.getPlace();

    if (!placeInfo.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      $('#place-visit').attr('placeholder', 'Sorry, nothing found');
      return;
    }

    // get country name from response
    var countryObj = placeInfo.address_components.filter(function (elem) {
      return elem.types.includes('country');
    });

    var countryName = countryObj[0].long_name;
    var placeName = placeInfo.name + ', ' + countryName;

    dataSocket.emit('addPopularPlace', JSON.stringify({city: placeName}));

    $('#add-place-popular').val('');
  });
}


// Event Handlers like "click"
$(".want-to-visit-container").on("click touchend", ".tag-place .close", function () {
  var id = $(this).parent().attr('data-id');
  $(this).parent().remove();
  dataSocket.emit('removePlaceToVisit', JSON.stringify({hash: userHash, recordId: id}));
});

$('.close', '.wtv-container').on('click touchend', function () {
  $(this).closest('.wtv-container').find('.google-places-input').val('');
});


// Socket handlers
dataSocket.on('userRegion', function (cityAndCountry) {
  cityAndCountry = JSON.parse(cityAndCountry);

  var placesHtml =
    '<div class="tag-place" style="text-transform: capitalize">' + cityAndCountry.city + ', ' + cityAndCountry.country + '</div>';
  $('#i-live-in-container').html(placesHtml).show();

  var headerInfoHtml =
    '<div class="recipient-residence"> \
       <span class="user-city">' + cityAndCountry.city + ', ' + cityAndCountry.country + '</span>\
     </div>';
  $('.header-profile-info .recipient-residence').remove();
  $('.header-profile-info .another-info').append(headerInfoHtml);

});

dataSocket.on('userPlacesToVisit', function (places) {
  var places = JSON.parse(places);
  var placesHtml = '';

  for (var i = 0; i < places.length; i++) {
    placesHtml +=
      '<div class="tag-place" style="text-transform: capitalize" data-id="' + places[i].id + '">\
      <span class="place-name">' + places[i].place + '</span>\
	<svg class="close" xmlns="http://www.w3.org/2000/svg" width="20.354" height="20.354" viewBox="0 0 20.354 20.354">\
		<title>close</title>\
		<line x1="0.177" y1="0.177" x2="20.177" y2="20.177" fill="none" stroke="#4d4d4d" stroke-miterlimit="10" stroke-width="1.5"></line>\
		<line x1="19.72" y1="0.634" x2="0.634" y2="19.72" fill="none" stroke="#4d4d4d" stroke-miterlimit="10" stroke-width="1.5"></line>\
	</svg>\
</div>';
  }

  $('.want-to-visit-container').html(placesHtml).show();
});

function addPlacePreview(placeName){
  var $placesCollection = $('.want-to-visit-container .tag-place span');
  var places = [];
  var placeNotInList = true;
  var inputtedPlace = placeName.toLowerCase();

  $placesCollection.each(function (){
    var place = $(this).text().toLowerCase();

    if(place === inputtedPlace){
      placeNotInList = false;
    }
  });

  if(placeNotInList){
    var placeHtml =
      '<div class="tag-place" style="text-transform: capitalize">\
      <span class="place-name">' + placeName + '</span>\
	<svg class="close" xmlns="http://www.w3.org/2000/svg" width="20.354" height="20.354" viewBox="0 0 20.354 20.354">\
		<title>close</title>\
		<line x1="0.177" y1="0.177" x2="20.177" y2="20.177" fill="none" stroke="#4d4d4d" stroke-miterlimit="10" stroke-width="1.5"></line>\
		<line x1="19.72" y1="0.634" x2="0.634" y2="19.72" fill="none" stroke="#4d4d4d" stroke-miterlimit="10" stroke-width="1.5"></line>\
	</svg>\
</div>';

    $('.want-to-visit-container').append(placeHtml);
  }
}
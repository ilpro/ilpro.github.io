// Autocomplete func for GOOGLE PLACES API. Calls from google script in body tag
var userCity, userCountry;

function initAutocomplete() {
  handleILiveIn();
  handleWantToVisit();
  handlePopularPlaces();
};

// User city and country
function handleILiveIn() {
  var input = (document.getElementById('i-live-in'));
  var autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', function () {
    var placeInfo = autocomplete.getPlace();

    if (!placeInfo.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      $('#i-live-in').attr('placeholder', 'Sorry, nothing found');
      return;
    }

    // get country name from response
    var countryObj = placeInfo.address_components.filter(function (elem) {
      return elem.types.includes('country');
    });

    userCountry = countryObj[0].long_name;
    userCity = placeInfo.name;

    $('#i-live-in').val('');


    var placesHtml =
      '<div class="tag-place" style="text-transform: capitalize">' + userCity + ', ' + userCountry + '</div>';
    $('#i-live-in-container').html(placesHtml).show();
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

      $('.place-visit').val('');
    });
  }
}

// Add to 'user want to visit' from popular places list
function handlePopularPlaces() {
  $(document).on("click touchend", ".popular-places .tag-place", function () {
    var placeName = $(this).html();
    addPlacePreview(placeName);
    $(this).remove();
  });
}
// remove
$(".want-to-visit-container").on("click touchend", ".tag-place .close", function () {
  var id = $(this).parent().attr('data-id');
  $(this).parent().remove();
});

$('.close', '.wtv-container').on('click touchend', function () {
  $(this).closest('.wtv-container').find('.google-places-input').val('');
});


function addPlacePreview(placeName) {
  var $placesCollection = $('.want-to-visit-container .tag-place span');
  var places = [];
  var placeNotInList = true;
  var inputtedPlace = placeName.toLowerCase();

  $placesCollection.each(function () {
    var place = $(this).text().toLowerCase();

    if (place === inputtedPlace) {
      placeNotInList = false;
    }
  });

  if (placeNotInList) {
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
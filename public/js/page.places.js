var _map;
$(document).on('click', '.place-item:not(.active)', function () {
  $(this).addClass('active');
  $('.places').addClass('hidden');
  // $('.place-item:not(.active)').hide();

  initMap($(this));
});

$(document).on('click', '.place-item.active .dis', function () {
  $('.places').removeClass('hidden');

  $(this).closest('.place-item').removeClass('active');
  $('.place-item .place-map ').empty();
  // $('.place-item').show();
});

function initMap($place) {
  var mapHtml =
    '<div style="overflow:hidden;height:440px;width:100%;"> \
       <div class="gmap_canvas" style="height:440px;width:100%;"></div>\
     </div>';
  $place.find('.place-map').html(mapHtml);

  var coordinates = {lat: +$place.attr('data-lat'), lng: +$place.attr('data-lng')};

  _map = new google.maps.Map($place.find('.gmap_canvas')[0], {
    center: coordinates,
    zoom: 16,
    mapTypeId: 'roadmap'
  });

  _setMarkerOnMap(coordinates, $(this).find('.place-info h2').text());
}

function _setMarkerOnMap(coordinates, name) {
  new google.maps.Marker({
    map: _map,
    position: coordinates,
    title: name
  });
}
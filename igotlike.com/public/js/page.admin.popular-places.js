dataSocket.emit('getPopularPlaces');

dataSocket.on('popularPlaces', function (data) {
  data = JSON.parse(data);
  if(!data.length){
    return
  }

  var popularPlacesHtml = '';

  data.forEach(function (placeObj){
    popularPlacesHtml +=
      '<li class="single-email" data-id="'+ placeObj.id +'">\
           <div class="user-nickname" style="text-transform: capitalize;">'+ placeObj.place +'</div>\
           <div class="preferences">\
             <button class="delete-place">delete</button>\
           </div>\
       </li>';
  });

  $('.emails-wrapper').html(popularPlacesHtml);
});

// Event Handlers like "click"
$(document).on("click", ".delete-place", function () {
  var $row =  $(this).closest('.single-email');
  var id = $row.attr('data-id');

  dataSocket.emit('removePopularPlace', JSON.stringify({id: id}));
  $row.remove();
});
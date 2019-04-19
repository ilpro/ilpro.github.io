$(".sub-header-item").click(function(){
	if(!$(this).hasClass("active")) {
		$(".sub-header-item").toggleClass("active");
		$(".users-list").toggle();
		$(".page-head .page-name").html($(this).html())
	}
});

var favoriteItem;
var favoriteItemId;
$(".page-subscribe").on('click', '.users-list .sub-button, .search-result .sub-button',function(e){
	e.preventDefault();
	favoriteItem = $(this).closest(".user-subscribe");
    favoriteItemId = favoriteItem.data("id");
    dataSocket.emit('addUserFavorite', JSON.stringify({hash:userHash, profileId:favoriteItemId}));
});
dataSocket.on('addUserFavorite', function (data) {
	data = JSON.parse(data);
	
	var favoriteItemHtml = '';
	if(data.action == "add"){
		if ($('.users-list.favorites .user-subscribe[data-id=' + favoriteItemId +']').length > 0){
            $('.user-subscribe[data-id=' + favoriteItemId +']').find(".sub-button").removeClass("active").text(lang.lSubActNotSub);
		} else {
            favoriteItemHtml = favoriteItem.wrap('<div/>').parent().html();
            favoriteItem.unwrap();
            $('.users-list.favorites').prepend(favoriteItemHtml);
            $('.user-subscribe[data-id=' + favoriteItemId +']').find(".sub-button").removeClass("active").text(lang.lSubActNotSub);
        }
    } else{
        $('.user-subscribe[data-id="' + favoriteItemId +'"]').find(".sub-button").addClass("active").text(lang.lSubActSub);
    }
});

$(".search .search__icosearch").on('click', function (e) {
	e.preventDefault();
	var searchValue = $(".search .search__input").val();
	if (searchValue.length > 0) {
        dataSocket.emit('searchFriends', JSON.stringify({searchValue: searchValue, hash:userHash}));
    }
});

$(".search .search__close").on('click', function (e) {
    e.preventDefault();
    $(".search .search__input").val('');
    $(".search-result").empty().hide();
});

dataSocket.on("searchFriendsResult", function (data) {
    data = JSON.parse(data);
    var findedFriend = '';

    if (data.result == false) {
        findedFriend = '<div style="padding: 10px;text-align: center;">Нічого не знайдено</div>';
	} else {
        for(var i=0;i<data.length;i++) {
            var subButton = '';
            if (data[i].favorite){
                subButton = '<div class="sub-button">Follow</div>';
			} else {
                subButton = '<div class="sub-button active">Following</div>'
			}
            findedFriend += '<a href="/profile/' + data[i].userId + '" class="user-subscribe" data-id="' + data[i].userId + '">\
								<div class="avatar-holder">\
									<div class="user-avatar" title=""><img src="' + data[i].userPhoto + '" alt="user" style="max-width: 100%;"></div>\
								</div>\
								<div class="info-box">\
									<div class="info-row">\
										<div class="id-box">\
											<div class="id">id:' + data[i].userId + '</div>\
										</div>\
										<div class="name">' + data[i].userName + '</div>\
									</div>\
									<!--<div class="online-status offline">5 годин тому</div>-->\
									<div class="rating-container stars' + data[i].stars + '">\
										<div class="rating-title">Рейтинг&nbsp;</div>\
										<svg class="rating-star one" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
											<path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
										</svg>\
										<svg class="rating-star two" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
											<path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
										</svg>\
										<svg class="rating-star three" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
											<path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
										</svg>\
										<svg class="rating-star four" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
											<path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
										</svg>\
										<svg class="rating-star five" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
											<path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
										</svg>\
									</div>\
									<div class="button-box">'
										+ subButton +
									'</div>\
								</div>\
							</a>'
        }
	}
	$(".search-result").html(findedFriend).show();
});


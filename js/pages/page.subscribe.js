'use strict';
const pageSubscribe = {
  socket: {},

  /** Init page **/
  init (socket) {
    this.socket = socket;

    // handlers
    this.initSocketHandlers();
    this.initHandlers();
	
    this.initFavorites();
  },

  initFavorites () {
    this.socket.emit('getUserFavorites', JSON.stringify({hash: user.hash}));
  },
  
  initFans () {
    this.socket.emit('getUserFans', JSON.stringify({hash: user.hash}));
  },

  initSocketHandlers () {
    var self = this;
    
	// insert models on page
    this.socket.off('userFavorites').on('userFavorites', (data) => {
      data = JSON.parse(data);
      this.insertUsers(data);
      $(".users-list").removeClass("fans").addClass('favorites');
    });
	
	this.socket.off('addUserFavorite').on('addUserFavorite', function (data) {
		data = JSON.parse(data);
        var favoriteItemHtml = '';
        if(data.action == "add"){
            if ($('.users-list.favorites .user-subscribe[data-id=' + self.userId +']').length > 0){
                $('.user-subscribe[data-id=' + self.userId +']').find(".sub-button").removeClass("active").text(lang.lSubActNotSub);
                console.log($('.user-subscribe[data-id=' + self.userId +']'));
            } else {
                favoriteItemHtml = self.activeItem.wrap('<div/>').parent().html();
                self.activeItem.unwrap();
                $('.users-list.favorites').prepend(favoriteItemHtml);
                $('.user-subscribe[data-id=' + self.userId +']').find(".sub-button").removeClass("active").text(lang.lSubActNotSub);
            }
        } else{
            $('.user-subscribe[data-id="' + self.userId +'"]').find(".sub-button").addClass("active").text(lang.lSubActSub);
        }
	});
	
	this.socket.off('userFans').on('userFans', (data) => {
      data = JSON.parse(data);
      this.insertUsers(data);
      $(".users-list").removeClass("favorites").addClass('fans');
    });

      this.socket.off('searchFriendsResult').on('searchFriendsResult', (data) => {
          data = JSON.parse(data);
          this.insertSearch(data);
      });
  },

  initHandlers () {
    var self = this;
    
	$('.subscribe-page').on('click', '.classic-tab', function () {
		if(!$(this).hasClass("active")) {
			$(".subscribe-page .classic-tab").toggleClass("active");
			if($(this).hasClass("favorites"))
				self.initFavorites();
			else
				self.initFans();
		}
	});
	
	// remove from favorites
    $('.subscribe-page').on('click', '.sub-button', function (e) {
        e.preventDefault();
      self.activeItem = $(this).closest('.user-subscribe');
	  self.userId = self.activeItem.data('id');
      user.addOrRemoveFromFavorites(self.userId);
    });

      $(".search .search__icosearch").on('click', function (e) {
          e.preventDefault();
          var searchValue = $(".search .search__input").val();
          if (searchValue.length > 0) {
              self.socket.emit('searchFriends', JSON.stringify({searchValue: searchValue, hash:user.hash}));
          }
      });

      $(".search .search__input").on('keyup',function (e) {
          if (e.keyCode === 13) {
              var searchValue = $(".search .search__input").val();
              if (searchValue.length > 0) {
                  self.socket.emit('searchFriends', JSON.stringify({searchValue: searchValue, hash:user.hash}));
              }
          }
      });

      $(".search .search__close").on('click', function (e) {
          e.preventDefault();
          $(".search .search__input").val('');
          $(".search-result").empty().hide();
      });
  },
  
  insertUsers (usersArr) {
    let html = '';

    for(var i = 0; i < usersArr.length; i++) {
      let userHtml = this.userTemplate(usersArr[i]);
      html += userHtml
    }

    $(".subscribe-page .users-list").html(html);
  },

    insertSearch (usersArr) {
        let html = '';

        for(var i = 0; i < usersArr.length; i++) {
            usersArr[i].favorite = usersArr[i].favorite === 1 ? 'active': '';
            let userHtml = this.userTemplate(usersArr[i]);
            html += userHtml
        }

        $(".subscribe-page .search-result").html(html).show();
    },


  /** User template **/
  userTemplate (userObj) {
    var html = '<a href="#page=profile&id=' + userObj.userId + '"><div class="user-subscribe" data-id="' + userObj.userId + '">\
	<div class="avatar-holder">\
		<div class="user-avatar" title="' + user.getName(userObj) + '">' + user.getPhoto(userObj.userPhoto, name) + '</div>\
	</div>\
	<div class="info-box">\
		<div class="info-row">\
			<div class="id-box">\
				<div class="id">id:' + userObj.userId + '</div>\
			</div>\
			<div class="name">@' + user.getName(userObj) + '</div>\
		</div>\
		<!--<div class="online-status ' + ((userObj.userLastActive == 'online') ? 'online' : 'offline') + '">' + userObj.userLastActive + '</div>-->\
		<div class="rating-container stars' + userObj.stars + '">\
			<div class="rating-title">' + lang.lUsersOnStarsRating + '&nbsp;</div>\
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
		<svg class="user-msg" onclick="window.location.href =\'/#page=messages&chatId=' + userObj.userId + '\';event.preventDefault();" xmlns="http://www.w3.org/2000/svg" width="30" height="25" viewBox="0 0 14 11">\
        <g fill="#969696">\
          <path d="M13.96.1c0-.03-.04-.1-.06-.1H.03C0 0 0 .06-.02.07l6.67 6.06c.1.08.2.26.33.26.1 0 .22-.16.3-.2"/>\
          <path d="M0 11h14c.04 0 0-.8 0-.86L8.74 5.6l-1.05.94c-.2.17-.47.26-.74.26-.26 0-.5-.1-.7-.26l-1-.97L0 10.27c0\
      .03-.05.73 0 .73zM0 .92v8.4l4.84-4.16M14 .94L9.16 5.2 14 9.32"/>\
      </g>\
      </svg>\
		<div class="button-box">\
			' + ((userObj.favorite == undefined || userObj.favorite == "active") ? '<div class="sub-button">' + lang.lSubActNotSub + '</div>' : '<div class="sub-button active">' + lang.lSubActSub + '</div>') + '\
		</div>\
	</div>\
</div></a>';
    return html;
  }
};
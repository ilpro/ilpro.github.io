'use strict';
const pageDating = {
	init ( socket ) {
		let self = this;
		
		self.socket = socket;
		self.profileId = urlHash.getState("id");
		self.search = (getCookie("search")) ? JSON.parse(getCookie("search")) : false;
		
		self.socket.emit('getResidence');
		
		if(self.profileId)
			self.socket.emit('getDatingProfile', JSON.stringify({profileId:self.profileId, hash:user.hash}));
		else if(self.search)
			self.socket.emit('searchDatingProfile', JSON.stringify(self.search));
		else
			showVideoModal(".pick-form"); 
		
		// #########################
		// VIDEO SEARCH PAGE
		
		//variables
		self.$ageFrom_pick = $(".modal-video .from-age");
		self.$ageTo_pick = $(".modal-video .to-age");
		self.$ageSlider_pick = $('.modal-video #pickSlider');

		//slider init
		self.$ageSlider_pick.slider({
			range: true,
			min: 18,
			max: 50,
			values: [18, 50],
			slide: function (event, ui) {
				self.$ageFrom_pick.val(ui.values[0]);
				self.$ageTo_pick.val(ui.values[1]);
			}
		});
		self.$ageFrom_pick.val(self.$ageSlider_pick.slider("values", 0));
		self.$ageTo_pick.val(self.$ageSlider_pick.slider("values", 1));

		//choosen
		var config = {
			'.modal-video .chosen-select-residence-pick': {
				allow_single_deselect: true,
				width: "135px",
				disable_search_threshold: 10
			}
		};

		for (var selector in config)
			$(selector).chosen(config[selector]);
		
		// #########################
		// DATING PAGE
		
		//variables
		self.$ageFrom = $(".slide-page .from-age");
		self.$ageTo = $(".slide-page .to-age");
		self.$ageSlider = $('.slide-page #agePickSlider');
		
		//slider init
		self.$ageSlider.slider({
			range: true,
			min: 18,
			max: 50,
			values: [((self.search) ? self.search.ageFrom  : 18), ((self.search) ? self.search.ageTo  : 50)],
			slide: function (event, ui) {
				self.$ageFrom.val(ui.values[0]);
				self.$ageTo.val(ui.values[1]);
			}
		});
		self.$ageFrom.val(self.$ageSlider.slider("values", 0));
		self.$ageTo.val(self.$ageSlider.slider("values", 1));
		
		//choosen
		var config = {
				'.slide-page .chosen-select-residence': {
				allow_single_deselect: true,
				width: "135px",
				disable_search_threshold: 10
			}
		};

		for (var selector in config)
			$(selector).chosen(config[selector]);

		/*** Swiper init */
		self.swiper = $('.swiper-container').swiper({
			nextButton: '.swiper-button-next',
			prevButton: '.swiper-button-prev',
			pagination: false,
			paginationClickable: false,
			preloadImages: false,
			lazyLoading: true,
			loop: true
		});
		$(window).on("orientationchange", function () {
			self.swiper.update();
		});
		/*** Swiper init */

		if(self.search) {
			if(self.search.gender == "" || self.search.gender ==$(".slide-page #lookMale_pick").val())
				$(".slide-page #lookMale_pick").attr("checked", true);
			if(self.search.gender == "" || self.search.gender == $(".slide-page #lookFemale_pick").val())
				$(".slide-page #lookFemale_pick").attr("checked", true);
			if(self.search.online == 1)
				$(".slide-page #isOnline").attr("checked", true);
		}

		// handlers
		self.initSocketHandlers();
		self.initHandlers();
		self.initGifts()
	},

	initSocketHandlers () {
		// insert models on page
		this.socket.off('getResidence').on( 'getResidence', ( data ) => {
			data = JSON.parse( data );
			this.updateResidence( data );
		});
		
		this.socket.off('searchDatingProfile').on( 'searchDatingProfile', ( data ) => {
			data = JSON.parse( data );
			this.updateData( data );
		});
	},

	initHandlers () {
		let self = this;


		// $("body").off("hideVideoModal").on("hideVideoModal", function () {
			// window.location.hash = "";
		// });
		
		// кнопка найти на странице с видео
		$(".modal-video .search-button").off("click").click(function () {
			var err = false;

			var residence = $(".modal-video .chosen-select-residence-pick").val();
			var gender = "";
			
			if(!residence)
				err = lang.lDatingErrCity;
			else {
				var gender1 = $(".modal-video #lookMale_pick_modal:checked").val();
				var gender2 = $(".modal-video #lookFemale_pick_modal:checked").val();
				
				if(!gender1 && !gender2)
					err = lang.lDatingErrGender;
				else if(gender1 && !gender2)
					gender = gender1;
				else if(gender2 && !gender1)
					gender = gender2;
			}
			
			if(err)
				alert(err);
			else {
				self.search = {
					ageFrom: self.$ageFrom_pick.val(),
					ageTo: self.$ageTo_pick.val(),
					online: $(".modal-video #isOnline_pick_modal:checked").length,
					gender: gender,
					residence: residence,
					offset: 0,
					hash: user.hash
				}
				
				self.$ageFrom.val(self.search.ageFrom);
				self.$ageTo.val(self.search.ageTo);
				self.$ageSlider.slider( "values", [ self.search.ageFrom, self.search.ageTo ] );
				
				if(self.search.gender == "" || self.search.gender ==$(".slide-page #lookMale_pick").val())
					$(".slide-page #lookMale_pick").attr("checked", true);
				if(self.search.gender == "" || self.search.gender == $(".slide-page #lookFemale_pick").val())
					$(".slide-page #lookFemale_pick").attr("checked", true);
				
				$(".slide-page .chosen-select-residence").val(self.search.residence).trigger("chosen:updated");
				
				if(self.search.online == 1)
					$(".slide-page #isOnline").attr("checked", true);
				
				self.socket.emit('searchDatingProfile', JSON.stringify(self.search));
			}
		});
		
		//change from field input
		self.$ageFrom.change(function () {
			var val1 = parseInt(self.$ageFrom.val());
			var val2 = parseInt(self.$ageTo.val());
			val1 = val1 < val2 ? val1 : val2;
			self.$ageSlider.slider("values", 0, val1);
		});
		
		//change to field input
		self.$ageTo.change(function () {
			var val1 = parseInt(self.$ageFrom.val());
			var val2 = parseInt(self.$ageTo.val());
			val2 = val2 > val1 ? val2 : val1;
			self.$ageSlider.slider("values", 1, val2);
		});
		
		// следуйщий профиль
		$(".user-controls .next-user").on("click", function(){
			self.search = (getCookie("search")) ? JSON.parse(getCookie("search")) : "";
			
			if(self.search.online != undefined) {
				self.search.offset += 1;
				self.search.hash = user.hash;
				self.socket.emit('searchDatingProfile', JSON.stringify(self.search));
			}
			else
				showVideoModal(".pick-form");
		});
		// предидущий профиль
		$(".user-controls .previous-user").on("click", function(){
			self.search = (getCookie("search")) ? JSON.parse(getCookie("search")) : "";
			
			if(self.search.online != undefined) {
				self.search.offset -= 1;
				self.search.hash = user.hash;
				self.socket.emit('searchDatingProfile', JSON.stringify(self.search));
			}
			else
				showVideoModal(".pick-form");
		});
		
		// кнопка найти на странице карточек
		$(".slide-page .search-button").click(function(){
			var err;
			
			var residence = $(".slide-page .chosen-select-residence").val();
			var gender = "";
			
			if(!residence)
				err = lang.lDatingErrCity;
			else {
				var gender1 = $(".slide-page #lookMale_pick:checked").val();
				var gender2 = $(".slide-page #lookFemale_pick:checked").val();
				
				if(!gender1 && !gender2)
					err = lang.lDatingErrGender;
				else if(gender1 && !gender2)
					gender = gender1;
				else if(gender2 && !gender1)
					gender = gender2;
			}
			
			if(err)
				alert(err);
			else {
				self.search = {
					ageFrom: self.$ageFrom.val(),
					ageTo: self.$ageTo.val(),
					online: $(".slide-page #isOnline:checked").length,
					gender: gender,
					residence: residence,
					offset: 0,
					hash: user.hash
				}
				
				self.socket.emit('searchDatingProfile', JSON.stringify(self.search));
			}
		});
		
		// add/remove from favorites
		$('.profile-menu .menu-item.favorite').click(function (){
			user.addOrRemoveFromFavorites(self.profileId);
			$(this).toggleClass('active');
		});
	},

	initGifts () {
		var self = this;
		
		//GIFTS SCRIPTS
		$(".profile-menu").on("click", ".menu-item.gifts-link, .gift-container.empty", function () {
			if(user.hash) {
				self.socket.emit('getAllGift', JSON.stringify({profileId:self.profileId}));
				showFlipModal('.flipper.gifts-modal');
				$(".flipper.gifts-modal").find(".breadcrumbs-gifts, .gifts-body").removeClass("active");
				$(".flipper.gifts-modal").find(".breadcrumbs-make-gift, .make-gift-body").addClass("active");
			}
		});

		$(".profile-menu").on("click", ".gift-container.full", function () {
			if(user.hash) {
				self.socket.emit('getAllGift', JSON.stringify({profileId:self.profileId}));
				showFlipModal('.flipper.gifts-modal');
				$(".flipper.gifts-modal").find(".breadcrumbs-make-gift, .make-gift-body").removeClass("active");
				$(".flipper.gifts-modal").find(".breadcrumbs-gifts, .gifts-body").addClass("active");
			}
		});

		function giftImgTemplate(giftId, giftPrice, giftPath) {
			return '<div class="gift-image-container" ' +
				'data-id="' + giftId + '" ' +
				'data-price="' + giftPrice + '">\
				<img src="' + giftPath + '" alt="gift">\
			</div>'
		}

		function priceHolderTemplate(giftPrice) {
			return '<div class="price-holder active">\
				<div class="price-ico"></div>\
				<div class="price-title">' + giftPrice + '</div>\
			</div>'
		}

		self.socket.on('getAllGift', function (data) {
			data = JSON.parse(data);

			var gifts = data.giftCollect.pack;

			var html1 = "";


			for(var key2 in data.giftCollect.pack) {
				var giftsPack = "";

				html1 += '<div class="divider"></div><div class="dropdown-heading" data-heading="' + data.giftCollect.pack[key2].packName + '">' + data.giftCollect.pack[key2].packName + '</div>';

				for(var key1 in data.giftCollect.pack[key2].stickers) {
					giftsPack += '<div class="gift-image-container" data-id="' + data.giftCollect.pack[key2].stickers[key1].stickerId + '" data-price="' + data.giftPrice + '">\
				<img src="' + 'https://emosmile.com' + data.giftCollect.pack[key2].stickers[key1].stickerImg + '" alt="gift">\
				<div class="price-holder">\
					<div class="price-ico"></div>\
					<div class="price-title">' + data.giftPrice + '</div>\
				</div>\
		</div>';
				}

				html1 +='<div class="info-items-container dropdown-block" data-heading="' + data.giftCollect.pack[key2].packName + '">' + giftsPack + '</div>';
			}
			$(".make-gift-body").html(html1);

			var html = "" ;
			if (data.giftProfile.length<1) {
				html = '<div class="no-gifts-notify">You can be first to make a gift for ' + user.getName(self.currentUser, true) + '!</div>' ;
			}
			for (var i=0; i<data.giftProfile.length; i++) {
				html += '<a class="gift-image-container" href="/#page=profile&id='+data.giftProfile[i].userId+'">\
			<img src="' + data.giftProfile[i].giftPath + '" alt="">\
			<div class="gift-user">\
				<div class="avatar-holder">\
					<div class="user-avatar" title="">\
						<img src="' + ((data.giftProfile[i].userPhoto) ? data.giftProfile[i].userPhoto : '/media/ava/guestAva.png') + '" alt="user" class="" style="max-width: 100%;">\
					</div>\
				</div>\
				<div class="info-holder">\
					<div class="main-info-row" >\
						<div class="id">ID:' + data.giftProfile[i].userId + '</div>\
						<div class="name">@' + data.giftProfile[i].userName + '</div>\
						<div class="age-city-holder">\
							<div class="city">' + data.giftProfile[i].userResidence + '</div>\
						</div>\
						<div class="gift-time">' + data.giftProfile[i].date + '</div>\
					</div>\
				</div>\
			</div>\
		</a>';
			}
			$(".gifts-body").html(html);
		});

		$(".breadcrumbs-gifts, .breadcrumbs-make-gift").click(function () {
			if(!$(this).hasClass("active")) {
				$(".breadcrumbs-make-gift, .make-gift-body").toggleClass("active");
				$(".breadcrumbs-gifts, .gifts-body").toggleClass("active");
			}
		});

		var giftId;
		$(".make-gift-body").on("click", ".gift-image-container", function () {
			giftId = $(this).data("id");
			$(".gift-confirm-modal .user-avatar").html('<img src="' + $(".avatar-holder img").attr("src") + '">');
			$(".gift-confirm-modal .corner-gift").html('<img src="' + $(this).find("img").attr("src") + '">');
			$(".gift-confirm-modal .price-title").text($(this).data("price"));
			$(".gift-confirm-modal, .gift-confirm-modal-overlay ").addClass("active");
		});

		$(".gift-confirm-modal .gift-confirm-modal-close").click(function () {
			$(".gift-confirm-modal, .gift-confirm-modal-overlay ").removeClass("active");
		});
		$(".gifts-modal").on("click", ".buy-link", function(){
			self.socket.emit('buyGift', JSON.stringify({profileId:self.profileId, giftId: giftId, hash:user.hash}));
			$(".gift-confirm-modal .gift-confirm-modal-close").trigger("click");
			hideFlipModal('.flipper.gifts-modal');
		});
		self.socket.on('buyGift', function (data) {
			var data = JSON.parse(data);

			if(data.result) {
				$(".gift-container:last").remove();
				$(".menu-item.gift").prepend('<a class="gift-container full" href="/#page=profile&id='+data.gift.userId+'">' +
					'<img src="' + data.gift.giftPath + '" alt="" class="gift-image">' +
					'<div class="gift-user">' +
					'<div class="avatar-holder">' +
					'<div class="user-avatar" title="">' +
					'<img src="' + ((data.gift.userPhoto) ? data.gift.userPhoto : '/media/ava/guestAva.png') + '" alt="' + data.gift.userName + '" class="" style="max-width: 100%;">' +
					'</div>' +
					'</div>' +
					'<div class="info-holder">' +
					'<div class="main-info-row">' +
					'<div class="id">ID:' + data.gift.userId + '</div>' +
					'<div class="name">@' + data.gift.userName + '</div>' +
					'<div class="age-city-holder">' +
					'<div class="age">' + ((data.gift.age) ? data.gift.age + ' years' : '') + '</div>' +
					'<div class="city">' + data.gift.userResidence + '</div>' +
					'</div>' +
					'<div class="gift-time">' + data.gift.date + '</div>' +
					'</div>' +
					'</div>' +
					'</div>' +
					'</a>');
			}
			else
				alert("Refill your account");

		});


		/*** Attach price info to cursor in modal gift***/
		var tooltipPrice = new AttachInfoToCursor({
			targetToAttach: '.price-holder',
			parentToLocalCord: '.gift-image-container',
			horizontalOverflowPrevent: 1,
			horizontalOverflowPreventParent: '.form-template-front',
			horizontalOverflowPreventLeftDifference: 300,
			horizontalOverflowPreventIndent: 100,
			verticalOverflowPrevent: 1,
			verticalOverflowPreventTarget: '#giftFlipBody',
			verticalOverflowPreventBottomIndent: 20,
			targetForHandlers: '.make-gift-body .gift-image-container img',
			onShowCallback: function (e) {
				var $parent = $(e.target).parents('.gift-image-container');
				var price = $parent.attr('data-price');
				var priceHtml = priceHolderTemplate(price);
				$parent.append(priceHtml);
			},
			onHideCallback: function (e) {
				var $target = $(e.target).parents('.gift-image-container').find('.price-holder');
				$target.remove();
			}
		});

		/*** Attach user info to cursor in modal gift***/
		var tooltipUserModal = new AttachInfoToCursor({
			targetToAttach: '.gift-user',
			parentToLocalCord: '.gift-image-container',
			horizontalOverflowPrevent: 1,
			horizontalOverflowPreventParent: '.form-template-front',
			horizontalOverflowPreventLeftDifference: 200,
			horizontalOverflowPreventIndent: 200,
			verticalOverflowPrevent: 1,
			verticalOverflowPreventTarget: '#giftFlipBody',
			verticalOverflowPreventBottomIndent: 20,
			targetForHandlers: '.gifts-body .gift-image-container img'
		});

		/*** Attach user info to cursor on main user gifts row***/
		var tooltipUser = new AttachInfoToCursor({
			targetToAttach: '.gift-user',
			parentToLocalCord: '.gift-container.full',
			horizontalOverflowPrevent: 1,
			horizontalOverflowPreventParent: '.menu-item.gift',
			horizontalOverflowPreventLeftDifference: 150,
			horizontalOverflowPreventIndent: 200,
			targetForHandlers: '.gift-container.full img'
		});
	},
	
	updateResidence (data) {
		var self = this;
		
		var html = '<option class="one-option-item" value="">' + lang.lCheckCityChoose +'</option>';
		for(var i=0; i<data.length; i++)
			html += '<option class="one-option-item" value="' + data[i].paramId + '" ' + ((data[i].paramId == self.search.residence) ? 'selected="selected"' : '') + '>' + data[i].paramName + '</option>';
		$(".modal-video .chosen-select-residence-pick").html(html).trigger("chosen:updated");
		$(".slide-page .chosen-select-residence").html(html).trigger("chosen:updated");
	},
	
	updateData (data) {
		let self = this;
		
		if(data.user) {
			self.profileId = data.user.userId;
			self.currentUser = data.user;
			
			urlHash.pushState({id: self.profileId});
			
			document.title = user.getName(data.user, true) + ", " + data.user.userAge + ", " + data.user.userResidence + lang.lDatingPageTitle;
			
			//Информация в шапке
			$(".profile-info-heading-block .avatar").html('<img src="'+data.user.userPhoto+'" style="width: 89px;">');
			$(".profile-info-heading-block .id").text("id:" + data.user.userId).show();
			$(".profile-info-heading-block .name").text('@'+user.getName(data.user, true));
			$(".profile-info-heading-block .age").text(lang.lAgeTitle + ' ' + data.user.userAge);
			$(".profile-info-heading-block .city").text(data.user.userResidence);
			$(".menu-item.message").attr("href", '/#page=messages&chatId=' + self.profileId);

			if(data.user.userLastActive == "online")
				$(".profile-info-heading-block .online-status").removeClass("offline").addClass("online").text("online");
			else
				$(".profile-info-heading-block .online-status").removeClass("online").addClass("offline").text(data.user.userLastActive);

			if(data.user.userDatingSettings){
				$(".partner-search-info").text(((data.user.userDatingSettings.gender) ? data.user.userDatingSettings.gender.substr(0, 1).toUpperCase() : "М, Ж") + ", " + data.user.userDatingSettings.ageFrom + "-" + data.user.userDatingSettings.ageTo + ", " + data.user.userDatingSettings.residence);
				$(".partner-search-info, .partner-search-title").show();
			}
			else
				$(".partner-search-info, .partner-search-title").hide();
			
			$(".profile-info-heading-block .menu-item:eq(0)").attr('href', "#page=profile&id=" + data.user.userId);
			
			if(data.user.userStatus) {
				$(".profile-info-heading-block .quote span").text(data.user.userStatus).show();
				$(".profile-info-heading-block .quote").show();
			}
			else
				$(".profile-info-heading-block .quote").hide();
			
			$(".rating-container").removeClass("stars0 stars1 stars2 stars3 stars4 stars5").addClass("stars" + data.user.stars);
			
			if(data.user.inFavorite)
				$(".menu-item.favorite").addClass("active");
			else
				$(".menu-item.favorite").removeClass("active");
			
			//картинки вместе со слайдами
			self.swiper.removeAllSlides();
			for(var i=0; i<data.images.length; i++)
				self.swiper.appendSlide('<div class="swiper-slide">'+
					'<a href="#page=profile&id=' + self.profileId + '" class="sizebox check-auth"></a>'+
					'<img data-src="' + data.images[i].path + '" class="swiper-lazy pick-image first">'+
					'<div class="swiper-lazy-preloader swiper-lazy-preloader-white"></div>'+
					'</div>');
			self.swiper.appendSlide('<div class="swiper-slide">' +
				'<a href="#page=profile&id=' + self.profileId + '" class="sizebox check-auth"></a>' +
				'<div class="endslide-box">' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="50" height="44" viewBox="0 0 50 44">' +
				'<g fill="#FFF">' +
				'<path d="M49.63 13.8L21.3.08c-.33-.16-.73-.02-.9.3l-6.15 13.1h3.36l4.53-9.62L46.7 ' +
				'15.77 39.02 32.1 34.7 30v8.63l2.65 1.3c.33.15.73 0 .9-.33l11.7-24.9c.15-.33 0-.73-.32-.9zm0 0"/> ' +
				'<path d="M32.06 15.07H.66c-.36 0-.66.3-.66.66v27.6c0 .37.3.67.67.67h31.4c.36 0 ' +
				'.65-.3.65-.67v-27.6c0-.36-.3-.66-.66-.66zm-1.8 21.14h-2c-1.16-3-2.6-7.23-4.75-6.67-2.53.66-3.8 ' +
				'6.68-3.8 6.68s-1.3-6.78-4.88-10.42C11.24 22.14 7.77 36.2 7.77 36.2H3.03V18.13h27.22v18.1zm0 0"/> ' +
				'<path d="M9.64 22c0 1.25-1 2.26-2.22 2.26-1.22 0-2.22-1-2.22-2.26 0-1.25 1-2.26 2.22-2.26 ' +
				'1.23 0 2.22 1 2.22 2.26zm0 0M22.32 23.6c.5 0 .97-.06 1.38-.15.5.2 1.08.34 1.72.34 ' +
				'1.63 0 2.96-.82 2.96-1.82s-1.33-1.82-2.96-1.82c-.62 0-1.2.12-1.66.32-.05 ' +
				'0-.43-.28-.6-.3-.37-.05-.8-.06-1.13.14-.28.18-.45.48-.5.8-1.32.15-2.3.64-2.3 1.2 0 ' +
				'.7 1.38 1.27 3.1 1.27zm0 0"/> ' +
				'</g> ' +
				'</svg> ' +
				'<div class="endslide-button check-auth">' + lang.lDatingMorePhotos + '</div> ' +
				'</div> ' +
				'</div>');
			
			self.swiper.slideTo(1);
			
			var html = '';
			for(var i=0; i<data.gift.length; i++) {
				html += '<a class="gift-container full check-auth" href="/#page=profile&id='+data.gift[i].userId+'">\
	<img src="' + data.gift[i].giftPath + '" alt="" class="gift-image">\
	<div class="gift-user">\
		<div class="avatar-holder">\
			<div class="user-avatar" title="">\
				<img src="' + data.gift[i].userPhoto + '" alt="' + data.gift[i].userName + '" class="" style="max-width: 100%;">\
			</div>\
		</div>\
		<div class="info-holder">\
			<div class="main-info-row">\
				<div class="id">ID:' + data.gift[i].userId + '</div>\
				<div class="name">@' + data.gift[i].userName + '</div>\
				<div class="age-city-holder">\
					<div class="city">' + data.gift[i].userResidence + '</div>\
				</div>\
				<div class="gift-time">' + data.gift[i].date + '</div>\
			</div>\
		</div>\
	</div>\
</a>';
			}
			for(i=data.gift.length; i<7; i++)
				html += '<div class="gift-container empty check-auth">\
	<svg xmlns="http://www.w3.org/2000/svg" width="43" height="49" viewBox="0 0 20 23">\
		<g fill="#F3F3F3">\
			<path d="M6.54 16.9l-.92-1.45-1.9.26 2.46-4.47H1.33V23H9.7V11.4l-3.15 5.5zM19.98 5.63h-5.45c.5\
						0 1-.47 1.34-.78.4-.36.73-.8.88-1.3.2-.7.14-1.57-.24-2.2C16 .5 15.18.03 14.2.03c-.76\
						0-1.45.26-2.05.66-.9.6-2.14 3-2.16 3.03-.2-.38-.4-1.15-.65-1.5-.42-.6-.93-1.13-1.52-1.53C7.23.3\
						6.53.04 5.8.04c-.75 0-1.43.32-1.94.8-.72.68-1.08 2.13-.72 3.05.3.72.98 1.73 1.87\
						1.73H0v5.04h9.15V5.63h1.68v5.04h9.16l-.02-5.04zM5.34 4.45c-.6-.38-1.15-1.1-.9-1.83.22-.67.92-1.03\
						1.6-.94.45.06.94.23 1.28.54.38.35.67.83.93 1.28.14.26.28.52.4.8.22.4.4.8.5\
						1.24-1.9-.2-3.1-.65-3.82-1.1zM11.7 3.4c.23-.4.5-.76.83-1.05.43-.4 1-.64 1.6-.63 1.06.02 1.76 1\
						1.07 1.9-.73 1-2.1 1.43-3.22 1.73-.12.03-1.15.2-1.17.27.18-.73.47-1.53.9-2.23zM16.3\
						15.7l-1.9-.3-.97 1.5-3.16-5.43V23h8.37V11.22h-4.82l2.47 4.46z"></path>\
		</g>\
	</svg>\
</div>';
			$(".menu-item.gift").html(html);
			
			// обновляем куки
			if(self.search) {
				self.search.offset = data.offset;
				setCookie("search", JSON.stringify(self.search), {"path": "/", "expires": 31536000});
			}

			hideVideoModal()
		}
		else
			alert(lang.lDatingSearchErr);
	}
}
'use strict';
const pageProfile = {
	profileId: false,
	botHash: false,
	socket: {},

	init ( params ) {
		var self = this;

    // show instagram login modal
    $(document).on('click', '.insta-login', function ()  {
      if ($(this)[0].hasAttribute("data-show-modal")) {
        openPromotionPopup("pages/instagram-login.html", "Instagram");
      }
    });

		self.socket = params.socket;
		self.profileId = params.profileId;

		self.socket.emit('getProfile', JSON.stringify({hash:user.hash, profileId: self.profileId}));

		self.socket.removeEventListener('getProfile');
		self.socket.on('getProfile', function (data) {
			data = JSON.parse( data );
			if(data.myData) {
				self.myPage(self.profileId, data);
				self.initTabs(data,'myPage');

			}
			else {
				self.idPage(self.profileId, data);
				$(".profile-menu").toggle();
				self.initTabs(data,'idPage');
			}
		});
		
		// delete id if page changes
		$(window).one('hashchange', e => {
			let page = urlHash.getState('page');

			if(page !== 'profile') {
				urlHash.removeState('id');
				self.profileId = false;
			}
		});
	},
	initTabs: function (data, page) {
		var self = this;
        var imageId;
        var ribbonId;

        if(!!data.user.commentsCount) {
			$('.classic-tab.my-comments').show();
		}

        if(imageId = urlHash.getState("imageId")) {
            var activity = {
                isInformation: true,
                isMyComments: false,
                isMyFeed: false,
                isActive: false
            };

            self.loadActiveTab(data, page, activity);
		} else if(ribbonId = urlHash.getState("ribbonId")) {
            var activity = {
                isInformation: false,
                isMyComments: false,
                isMyFeed: true,
                isActive: false
            };

            self.loadActiveTab(data, page, activity);
        } else {
            self.activeTabFirstLoad(data, page);
        }

		$(".classic-tab").click( function () {
            var activity = {
                isInformation: $(this).hasClass('information'),
                isMyComments: $(this).hasClass('my-comments'),
                isMyFeed: $(this).hasClass('feed-profile'),
                isActive: $(this).hasClass('active')
			};

            self.loadActiveTab(data, page, activity);
		} );
	},
	activeTabFirstLoad: function (data, page) {
        var self = this;
        var $activeTtab = $(".classic-tabs .classic-tab.active");
        var activity = {
            isInformation: $activeTtab.hasClass('information'),
            isMyComments: $activeTtab.hasClass('my-comments'),
            isMyFeed: $activeTtab.hasClass('feed-profile'),
            isActive: false
        };

        self.loadActiveTab(data, page, activity)
    },
	loadActiveTab: function (data, page, activity) {
        var self = this;
        if (activity.isActive) {
        } else if (activity.isInformation) {
            $(".classic-tab").removeClass('active');
            $('.classic-tab.information').addClass('active');
            $(".wrapper-tabs-info .inner-content").load('pages/' + lang.lName + '/profile-info.html',function () {
                if (page == 'myPage') {
                    pageProfile.myPage(pageProfile.profileId, data);
                } else if (page == 'idPage') {
                    pageProfile.idPage(pageProfile.profileId, data);
                }
            });
        } else if (activity.isMyComments){
            $(".classic-tab").removeClass('active');
            $('.classic-tab.my-comments').addClass('active');
            $(".wrapper-tabs-info .inner-content").load('pages/' + lang.lName + '/my-comments.html', function (){
                self.initComments();
            });
        } else if (activity.isMyFeed){
            var $mainHandlersTarget = $(".inner-content");
            $(".classic-tab").removeClass('active');
            $('.classic-tab.feed-profile').addClass('active');
            $(".wrapper-tabs-info .inner-content").load('pages/' + lang.lName + '/feed-profile.html', function (){
                self.initMyFeed();
                $mainHandlersTarget.off("click");
                pageFeed.initPostShare($mainHandlersTarget);
                pageFeed.initSocialLoginCheck();
                pageFeed.initDetailedLikesInfo($mainHandlersTarget);
                pageFeed.initPostImageToAvatar($mainHandlersTarget);
                if (page == 'myPage') {
                    pageFeed.initMyPostDelete($mainHandlersTarget);
                    pageFeed.initMyPostEdit($mainHandlersTarget);
                    $(".writepost .user-avatar img").attr('src',$("#authorized-user .user-avatar img").attr('src'));
                    $('.writepost').fadeIn(300);
                } else if (page == 'idPage') {
                    pageFeed.initIdPostClaim($mainHandlersTarget);
                    $('.writepost').remove();
                }

            });
        }
    },
	myPage: function(profileId, data) {
		var self = this;
		var $content = $(".center-content"), 
			$zoomBody = $("#zoomBody");
        $content.off('click');
        $zoomBody.off('click');
		
		self.updateInfo(data.user);
		self.updateGift(data.gift);
		self.updateImages(data.images, true);
		self.initGallery(profileId);
		self.initSocInfo(profileId);
		
		$(".profile-menu .favourite-link").addClass("active");
		$(".profile-information-block .edit").show();
		
		var imageId;
		if(imageId = urlHash.getState("imageId"))
			$(".profile-img[data-id=" + imageId + "]").trigger("click");

		/*** User status changing functions ***/
		var $status = $(".status"),
			$statusText = $(".status-text"),
			$newStatus = $(".new-status"),
			$statusChangeBlock = $(".status-change-block"),
			$saveStatusButton = $(".save-status-btn"),
			userStatus = $statusText.text();

		$statusText.on("focusin", function () {
			userStatus = $statusText.text();
			$status.addClass("editable");
			cursorToTheEnd($newStatus[0]);
		});

		$(document).on("keydown", ".new-status", function (e) {
			if (e.which == 27) {
				// Esc keyboard button close status input field
				// & returns old status
				$status.removeClass("editable");
				$newStatus.text(userStatus).blur();
			}
			if (e.which == 13) {
				// Enter saves status
				e.preventDefault();
				$saveStatusButton.click();
				$statusText.blur();
				$newStatus.blur();
			}
		});

		$content.on("click", function (e) {
			if ( !( !(e.target !=  $status[0]) || !(e.target != $statusChangeBlock[0]) || !(e.target != $saveStatusButton[0]) || !(e.target != $newStatus[0]))) {
				$status.removeClass("editable");
				$newStatus.text(userStatus).blur();
				$statusText.blur();
			}
		});

		$saveStatusButton.click(function () {
			userStatus = $newStatus.text();
			self.socket.emit('updateUserParam', {
				"hash"  : user.hash,
				"key"  : "userStatus",
				"value"  : userStatus
			});
			$status.removeClass("editable");
			$statusText.text(userStatus);
		});
		/*** User status changing functions END***/
		
		// ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ
		var $uploadPhotoArea = $(".photos-wrapper");
		$uploadPhotoArea.upload({
			action: "/profile/upload-image", 
			postKey: "image", 
			postData: {hash:user.hash}, 
			label: '<svg class="svg-ico add-photo-ico" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">\
			<g fill="none" stroke="#010101" stroke-miterlimit="10">\
				<ellipse cx="21.1" cy="21" rx="20.2" ry="20.4"></ellipse>\
				<path d="M21 8.7v23.6M9.4 20.5h23.4"></path>\
			</g>\
		</svg>'
		});

		$uploadPhotoArea.on("filecomplete", function(obj, file, res){
			var nextImageNumber = $(".photos-wrapper .single-photo").length + 1;
			var imgTemplate = '' +
				'<div class="single-photo" style="height: 0; opacity: 0">' +
					'<img class="profile-img" src="' + res + '" data-number="' + nextImageNumber + '" alt="profile image">' +
					'<div class="single-photo-edit">' +
						'<svg class="single-photo-edit-ico svg-ico" xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 11 11">' +
							'<path fill="#FFAE2E" d="M10.934 2.176L9.91 3.198l-2.086-2.08-.79.79L9.12 3.985l-5.115 5.1-2.085-2.08-.792.79 ' +
								'2.085 2.08-.51.507-.01-.01c-.055.093-.147.16-.256.185l-1.945.432c-.03.007-.058.01-.088.01-.106 ' +
								'0-.21-.042-.285-.118-.1-.098-.14-.238-.11-.373l.433-1.94c.025-.108.093-.2.185-.256l-.01-.01L8.848.097c.12-.12.317-.12.437 ' +
								'0l1.648 1.643c.122.12.122.316 0 .436z"/>' +
						'</svg>' +
						'<ul class="edit-img-menu">' +
							'<li class="option to-main">' + lang.lProfilePhotoMain + '</li>' +
							'<li class="option to-trash">' + lang.lProfilePhotoDeleteBtn + '</li>' +
						'</ul>' +
					'</div>' +
				'</div> ';
			$(".photos-wrapper .fs-upload-target").before(imgTemplate);

			$uploadPhotoArea.find(".single-photo").last().animate({
				height: 90,
				opacity: 1
			},200)
		});
		var dragImgTimer;
		$("body, .photos-wrapper").on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
			e.preventDefault();
			e.stopPropagation();
		}).on('dragover dragenter', function() {
			clearTimeout(dragImgTimer);
			$uploadPhotoArea.addClass('is-dragover');
		}).on('dragleave dragend drop', function() {
			dragImgTimer = setTimeout(function () {
				$uploadPhotoArea.removeClass('is-dragover')
			},200)
		});

		// УДАЛИТЬ ИЗОБРАЖЕНИЕ
		$content.on("click", ".to-trash", function(){
			self.socket.emit('deleteUserImage', {
				"hash"	: user.hash, 
				"image"	: $(this).parents(".single-photo").find(".profile-img").attr("src")
			});
			return false;
		});
		
		self.socket.removeEventListener('deleteUserImage');
		self.socket.on('deleteUserImage', function (data) {
			$(".photos-wrapper img[src='"+data.image+"']").parent().animate({
				width: 0,
				height: 0,
				opacity: 0
			}, 200, function () {
				this.remove();
			})
		});

		// ОБРЕЗАТЬ ИЗОБРАЖЕНИЕ
		var jcropApi;
		var jcropX = 0;
		var jcropY = 0;
		var jcropX2 = 200;
		var jcropY2 = 200;
		function cropevent(c){
			if(parseInt(c.w) > 0){
				if(c.x < 0) jcropX = 0; else jcropX = Math.floor(c.x);
				if(c.y < 0) jcropY = 0; else jcropY = Math.floor(c.y);
				if(c.x2 < 0) jcropX2 = 0; else jcropX2 = Math.floor(c.x2);
				if(c.y2 < 0) jcropY2 = 0; else jcropY2 = Math.floor(c.y2);
			}
		}
		
		var $cropBody = $("#cropBody");
		var cropImgSrc = '';
		$content.on("click", ".to-main", function(e){
			var $target = $(this).parents(".single-photo").find(".profile-img");
			cropImgSrc = $target.attr("src");
			if(!$target.parent().hasClass("add-photo")) {
				$cropBody.find("img").attr("src", cropImgSrc);
				showFlipModal(".flipper.avatar-crop-flip");

				jcropApi = $.Jcrop($cropBody.find("img"), {
					bgColor		: 'white',
					bgOpacity	: 0.3,
					aspectRatio	: 1,
					minSize		: [300, 300],
					setSelect	: [0, 0, 300, 300],
					onChange	: cropevent,
					onSelect	: cropevent
				});
				$('body').one("click",".page-shadow-hover, .form-close.clickable, .crop-image-save", function () {
					$cropBody.prepend('<img src="'+ cropImgSrc +'" alt="image" class="crop-image">');
					jcropApi.destroy();
					hideFlipModal(".flipper.avatar-crop-flip");
				});
			}
		});

		$content.on("click", ".crop-image-save", function(){
			self.socket.emit('cropUserImage', {
				"hash"	: user.hash, 
				"path"	: $cropBody.find(".crop-image").attr("src"),
				"x"		: jcropX, 
				"y"		: jcropY, 
				"width"	: (jcropX2 - jcropX), 
				"height": (jcropY2 - jcropY)
			});
			return false;
		});

		self.socket.removeEventListener('cropUserImage');
		self.socket.on('cropUserImage', function (data) {
			$(".avatar .profile-img, #authorized-user .user-avatar img").attr("src", data.image);
		});
		
		///////////////////////////////
		//			ИЗБРАННОЕ		 //
		///////////////////////////////
		$zoomBody.on("click", ".like-person .user-favour",function () {
			self.socket.emit('addUserFavorite', JSON.stringify({hash:user.hash, profileId:$(this).data("userid")}));
			$(this).toggleClass("active");
		});

        /*** Attach user info to cursor on main user gifts row***/
        var tooltipUser = new AttachInfoToCursor({
            targetToAttach: '.gift-user',
            parentToLocalCord: '.gift-container.full',
            horizontalOverflowPrevent: 1,
            horizontalOverflowPreventParent: '.menu-item.gift',
            horizontalOverflowPreventLeftDifference: 200,
            horizontalOverflowPreventIndent: 200,
            targetForHandlers: '.gift-container.full img'
        });
	}, 
	idPageFirstLoad: true,
	idPage: function(profileId, data) {
		var self = this;
		var $zoomBody = $("#zoomBody");
		
		$(".profile-block-wrapper .status-text").removeClass("hover").removeAttr("placeholder").removeAttr("contenteditable");
		$(".menu-item.message").attr("href", '/#page=messages&chatId=' + profileId);
		
		self.updateInfo(data.user);
		self.updateGift(data.gift);
		self.updateImages(data.images, false);
		self.initGallery(profileId);
        self.initSocInfo(profileId);

        var imageId;
        if(imageId = urlHash.getState("imageId"))
            $(".profile-img[data-id=" + imageId + "]").trigger("click");

		///////////////////////////////
		//			ИЗБРАННОЕ		 //
		///////////////////////////////
		if(self.idPageFirstLoad) {
		self.idPageFirstLoad = false;

		var favoriteBtn;
		
		// добавить возле фотографии
		$(".profile-menu .menu-item.favorite").off('click').on('click',function(e){
			e.preventDefault();
			if(user.hash) {
				favoriteBtn = 1;
				self.socket.emit('addUserFavorite', JSON.stringify({hash:user.hash, profileId:profileId}));
			}
		});
		
		// добавить в галереи
		$zoomBody.on("click", ".like-person .user-favour", function () {
			if(user.hash) {
				favoriteBtn = 2;
				self.socket.emit('addUserFavorite', JSON.stringify({hash:user.hash, profileId:$(this).data("userid")}));
				$(this).toggleClass("active");
			}
		});
		
		self.socket.off('addUserFavorite').on('addUserFavorite', function (data) {
			data = JSON.parse(data);
			if(favoriteBtn == 1) {
				if(data.action == "add")
					$(".profile-menu .menu-item.favorite").addClass("active");
				else if(data.action == "remove")
					$(".profile-menu .menu-item.favorite").removeClass("active");
			}
		});

		//GIFTS SCRIPTS
		$(".profile-menu").on("click", ".menu-item.gifts-link, .gift-container.empty", function () {
			self.socket.emit('getAllGift', JSON.stringify({profileId:profileId}));
			showFlipModal('.flipper.gifts-modal');
			$(".flipper.gifts-modal").find(".breadcrumbs-gifts, .gifts-body").removeClass("active");
			$(".flipper.gifts-modal").find(".breadcrumbs-make-gift, .make-gift-body").addClass("active");
		});
		$(".profile-menu").on("click", ".gift-container.full", function () {
			self.socket.emit('getAllGift', JSON.stringify({profileId:profileId}));
			showFlipModal('.flipper.gifts-modal');
			$(".flipper.gifts-modal").find(".breadcrumbs-make-gift, .make-gift-body").removeClass("active");
			$(".flipper.gifts-modal").find(".breadcrumbs-gifts, .gifts-body").addClass("active");
		});


		self.socket.on('getAllGift', function (data) {
			data = JSON.parse(data);

			var gifts = data.giftCollect.pack;

			var html1 = "";


			for(var key2 in data.giftCollect.pack) {
				var giftsPack = "";
                var packName = "";

                switch(data.giftCollect.pack[key2].packName) {
                    case 'MEM2':
                        packName = 'Меми';
                        break;
                    case 'cafe':
                        packName = 'Кафе';
                        break;
                    case 'cats':
                        packName = 'Коти';
                        break;
                    case 'dogs':
                        packName = 'Собаки';
                        break;
                    case 'jewellery':
                        packName = 'Коштовності';
                        break;
                    case 'love':
                        packName = 'Кохання';
                        break;
                    case 'music':
                        packName = 'Музика';
                        break;
                    case 'other':
                        packName = 'Інші';
                        break;
                    case 'presents':
                        packName = 'Подарунки';
                        break;
                    case 'soft_toys':
                        packName = 'М\'які іграшки';
                        break;
                    case 'food':
                        packName = 'Їжа';
                        break;
                    case 'transport':
                        packName = 'Транспорт';
                        break;
                    case 'travel':
                        packName = 'Подорожі';
                        break;
                    default:
                        packName = data.giftCollect.pack[key2].packName;
                }

				html1 += '<div class="divider"></div><div class="dropdown-heading" data-heading="' + data.giftCollect.pack[key2].packName + '">' + packName + '</div>';

				for(var key1 in data.giftCollect.pack[key2].stickers) {
					giftsPack += '<div class="gift-image-container" data-id="' + data.giftCollect.pack[key2].stickers[key1].stickerId + '" data-price="' + data.giftPrice + '">\
				<img src="' + 'https://emosmile.com' + data.giftCollect.pack[key2].stickers[key1].stickerImg + '" alt="gift">\
				<div class="price-holder">\
					<div class="price-ico"></div>\
					<div class="price-title">' + data.giftPrice + ' </div>\
				</div>\
		</div>';
				}

				html1 +='<div class="info-items-container dropdown-block" data-heading="' + data.giftCollect.pack[key2].packName + '">' + giftsPack + '</div>';
			}
			$(".make-gift-body").html(html1);

			var html = "" ;
			if (data.giftProfile.length<1) {
				html = '<div class="no-gifts-notify">Ти можеш бути першим, хто зробить подарунок!</div>' ;
			}
			for (var i=0; i<data.giftProfile.length; i++) {
				html += '<a class="gift-image-container" href="/#page=profile&id='+data.Profile[i].userId+'">\
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
							<!--<div class="age">' + ((data.giftProfile[i].age) ? data.giftProfile[i].age + ' years' : '') + '</div>-->\
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
			$(".gift-confirm-modal .user-avatar").html('<img src="' + $(".profile-img").attr("src") + '">');
			$(".gift-confirm-modal .corner-gift").html('<img src="' + $(this).find("img").attr("src") + '">');
			$(".gift-confirm-modal .price-title").text($(this).data("price"));
			$(".gift-confirm-modal, .gift-confirm-modal-overlay ").addClass("active");
		});

		$(".gift-confirm-modal .gift-confirm-modal-close").click(function () {
			$(".gift-confirm-modal, .gift-confirm-modal-overlay ").removeClass("active");
		});
		$(".gifts-modal").on("click", ".buy-link", function(){
			self.socket.emit('buyGift', JSON.stringify({profileId:profileId, giftId: giftId, hash:user.hash}));
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
					// '<div class="age">' + ((data.gift.age) ? data.gift.age + ' years' : '') + '</div>' +
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

            function priceHolderTemplate(giftPrice) {
                return '<div class="price-holder active">\
				<div class="price-ico"></div>\
				<div class="price-title">' + giftPrice + ' symbols</div>\
			</div>'
            }

		/*** Attach price info to cursor in modal gift***/
		var tooltipPrice = new AttachInfoToCursor({
			targetToAttach: '.price-holder',
			parentToLocalCord: '.gift-image-container',
			horizontalOverflowPrevent: 1,
			horizontalOverflowPreventParent: '.form-template-front',
			horizontalOverflowPreventLeftDifference: 300,
			horizontalOverflowPreventIndent: 125,
			verticalOverflowPrevent: 1,
			verticalOverflowPreventTarget: '#giftFlipBody',
			verticalOverflowPreventBottomIndent: 20,
			targetForHandlers: '.make-gift-body .gift-image-container img',
			onShowCallback: function (e, settings) {
				var $parent = $(e.target).parents(settings.parentToLocalCord);
				var price = $parent.attr('data-price');
				var priceHtml = priceHolderTemplate(price);
				$parent.append(priceHtml);
			},
			onHideCallback: function (e, settings) {
				var $target = $(e.target).parents(settings.parentToLocalCord).find(settings.targetToAttach);
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
			horizontalOverflowPreventLeftDifference: 200,
			horizontalOverflowPreventIndent: 200,
			targetForHandlers: '.gift-container.full img'
		});

		}
	},
	updateInfo: function(data) {
		var self = this;
		
		$(".avatar .profile-img").attr("src", data.userPhoto);
		$(".main-info .id").text("id: " + data.userId);
		$(".main-info .name").text('@'+user.getName(data, true));
		if(data.age)
            $(".main-info .age").text(lang.lAgeTitle + " " + data.age);
		$(".main-info .userResidence").text(data.userResidence);
		
		$(".rating-container").addClass("stars" + data.stars);
		
		if(data.userDatingSettings){
			$(".partner-search-info").text(((data.userDatingSettings.gender) ? data.userDatingSettings.gender.substr(0, 1).toUpperCase() : "М, Ж") + ", " + data.userDatingSettings.ageFrom + "-" + data.userDatingSettings.ageTo + ", " + data.userDatingSettings.residence);
			$(".partner-search-info, .partner-search-title").show();
		}
		else
			$(".partner-search-info, .partner-search-title").hide();
		
		$(".online-status").text(data.userLastActive).addClass((data.userLastActive == "online") ? "online" : "offline").show();

		if (data.userStatus) {
			$(".status .status-text, .status .new-status").text(data.userStatus);
			$(".quote").show();
		}

		if(self.profileId == user.info.userId && (!data.userStatus || data.userStatus.length === 0)){
			$(".quote").show();
		}
		
		// $(".profile-information-block .info-item, .profile-information-block .about-text").hide();
		if(data.userResidence)
			$(".userResidence .info-parameter").text(data.userResidence).parent().addClass("visible");
		if(data.userBdateText)
			$(".userBdateText .info-parameter").text(data.userBdateText).parent().addClass("visible");
		if(data.userGender)
			$(".userGender .info-parameter").text(data.userGender).parent().addClass("visible");
		if(data.userEyes)
			$(".userEyes .info-parameter").text(data.userEyes).parent().addClass("visible");
		if(data.userHair)
			$(".userHair .info-parameter").text(data.userHair).parent().addClass("visible");
		if(data.userBody)
			$(".userBody .info-parameter").text(data.userBody).parent().addClass("visible");
		if(data.userWeight)
			$(".userWeight div:eq(1)").text(data.userWeight).parent().addClass("visible");
		if(data.userHeight)
			$(".userHeight div:eq(1)").text(data.userHeight).parent().addClass("visible");
		if(data.userReligion)
			$(".userReligion .info-parameter").text(data.userReligion).parent().addClass("visible");
		if(data.userEducation)
			$(".userEducation .info-parameter").text(data.userEducation).parent().addClass("visible");
		if(data.userOccupation)
			$(".userOccupation .info-parameter").text(data.userOccupation).parent().addClass("visible");
		if(data.userMaritalStatus)
			$(".userMaritalStatus .info-parameter").text(data.userMaritalStatus).parent().addClass("visible");
		if(data.userChildren)
			if(+data.userChildren == 0) {
				$(".userChildren .info-parameter").text(lang.lSetNoChild).parent().addClass("visible");
			} else {
				$(".userChildren .info-parameter").text(data.userChildren).parent().addClass("visible");
			}
		if(data.userSmoke)
			$(".userSmoke .info-parameter").text(data.userSmoke).parent().addClass("visible");
		if(data.userDrink)
			$(".userDrink .info-parameter").text(data.userDrink).parent().addClass("visible");
		if(data.userHobbies)
			$(".userHobbies .info-parameter").text(data.userHobbies).parent().addClass("visible");
		if(data.userFavoriteColor)
			$(".userFavoriteColor .info-parameter").text(data.userFavoriteColor).parent().addClass("visible");
		if(data.userSport)
			$(".userSport .info-parameter").text(data.userSport).parent().addClass("visible");
		if(data.userBeenAbroad)
			$(".userBeenAbroad .info-parameter").text(data.userBeenAbroad).parent().addClass("visible");
		if(data.userDatingGoal)
			$(".userDatingGoal .info-parameter").text(data.userDatingGoal).parent().addClass("visible");
		if(data.userInterest)
			$(".userInterest .info-parameter").text(data.userInterest).parent().addClass("visible");
		if(data.userCharacter)
			$(".userCharacter .info-parameter").text(data.userCharacter).parent().addClass("visible");
		if(data.userAboutMyself)
			$(".userAboutMyself .about-text-content").text(data.userAboutMyself).parent().addClass("visible");
		if(data.userAboutPartner)
			$(".userAboutPartner .about-text-content").text(data.userAboutPartner).parent().addClass("visible");
		
		if(data.inFavorite)
			$(".profile-menu .menu-item.favorite").addClass('active');
		
	},
	updateGift: function(data) {
		var html = '';
		for(var i=0; i<data.length; i++) {
			html += '<a class="gift-container full check-auth" href="/#page=profile&id='+data[i].userId+'">\
	<img src="' + data[i].giftPath + '" alt="" class="gift-image">\
	<div class="gift-user">\
		<div class="avatar-holder">\
			<div class="user-avatar" title="">\
				<img src="' + data[i].userPhoto + '" alt="' + data[i].userName + '" class="" style="max-width: 100%;">\
			</div>\
		</div>\
		<div class="info-holder">\
			<div class="main-info-row" >\
				<div class="id">ID:' + data[i].userId + '</div>\
				<div class="name">@' + data[i].userName + '</div>\
				<div class="age-city-holder">\
					<!--<div class="age">' + ((data[i].age) ? data[i].age + ' years' : '') + '</div>-->\
					<div class="city">' + data[i].userResidence + '</div>\
				</div>\
				<div class="gift-time">' + data[i].date + '</div>\
			</div>\
		</div>\
	</div>\
</a>';
			}
		for(i=data.length; i<9; i++)
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
	}, 
	updateImages: function(images, controlBtn) {
		var html = '';
		images.forEach(function(row, i){
			if(controlBtn)
				html += '<div class="single-photo">\
					<img class="profile-img" src="'+row.path+'" data-id="'+row.id+'" data-number="'+(i+1)+'" alt="profile image">\
					<div class="single-photo-edit">\
						<svg class="single-photo-edit-ico svg-ico" xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 11 11">\
							<path fill="#FFAE2E" d="M10.934 2.176L9.91 3.198l-2.086-2.08-.79.79L9.12 3.985l-5.115 5.1-2.085-2.08-.792.79\
					2.085 2.08-.51.507-.01-.01c-.055.093-.147.16-.256.185l-1.945.432c-.03.007-.058.01-.088.01-.106\
					0-.21-.042-.285-.118-.1-.098-.14-.238-.11-.373l.433-1.94c.025-.108.093-.2.185-.256l-.01-.01L8.848.097c.12-.12.317-.12.437\
					0l1.648 1.643c.122.12.122.316 0 .436z"/>\
						</svg>\
						<ul class="edit-img-menu">\
							<li class="option to-main">' + lang.lProfilePhotoMain + '</li>\
							<li class="option to-trash">' + lang.lProfilePhotoDeleteBtn + '</li>\
						</ul>\
					</div>\
				</div>';
			else
				html += '<div class="single-photo">\
					<img class="profile-img" src="'+row.path+'" data-id="'+row.id+'" data-number="'+(i+1)+'" alt="profile image">\
				</div>';
		});
		$(".photos-wrapper").prepend(html);
	}, 
	initGallery: function(profileId) {
		var self = this;
		var $zoomBody = $("#zoomBody");
        $zoomBody.off('click');
		
		// клик по фото
		$(".profile-img").off('click').on("click",function(){
			var imageId = $(this).data("id");
			updateLikeList(imageId);

			$zoomBody.find(".big-img-like-wrapper").data("imageid", imageId);

			var source = $(this).attr("src").replace("_thumb","");
			var position = $(this).attr("data-number");
			var totalImages = $(".photos-wrapper .single-photo").length;
			
			$zoomBody.find(".img-control-wrapper img").attr("src",source);

			if(position) {
				$zoomBody.find(".photo-number").show();
				$zoomBody.find(".prev").show();
				$zoomBody.find(".next").show();
				$zoomBody.find(".current-photo-number").html(position);
			} else {
				$zoomBody.find(".photo-number").hide();
				$zoomBody.find(".prev").hide();
				$zoomBody.find(".next").hide();
			}

			$zoomBody.find(".total-photos").html(totalImages);
			
			showFlipModal(".flipper.img-zoom-flip");
		});
		// предыдущее фото
		$zoomBody.on('click', ".prev",function () {
			var $currentImage = $zoomBody.find(".img-control-wrapper img");
			var currentImageLink = $currentImage.attr("src");
			var $galleryImg = $(".photos-wrapper img[src='"+currentImageLink+"']");
			var $prevTarget = $galleryImg.parents(".single-photo").prev().find(".profile-img");

			if ($prevTarget.length == 0)
				$prevTarget = $galleryImg.closest(".photos-wrapper").find(".single-photo").last().find(".profile-img");
			
			var imageId = $prevTarget.data("id");
			updateLikeList(imageId);
			$zoomBody.find(".big-img-like-wrapper").data("imageid", imageId);

			$currentImage.attr("src", $prevTarget.attr("src"));
			$zoomBody.find(".current-photo-number").html($prevTarget.data("number"));
			setTimeout(resizeModal(".flipper.img-zoom-flip"),100);
		});
		// следующее фото
		$zoomBody.on('click', ".next", function () {
			var $currentImage = $zoomBody.find(".img-control-wrapper img");
			var currentImageLink = $currentImage.attr("src");
			var $galleryImg = $(".photos-wrapper img[src='"+currentImageLink+"']");
			var $nextTarget = $galleryImg.parents(".single-photo").next().find(".profile-img");

			if ($nextTarget.length == 0)
				$nextTarget = $galleryImg.closest(".photos-wrapper").find(".single-photo").first().find(".profile-img");
			
			var imageId = $nextTarget.data("id");
			updateLikeList(imageId);
			$zoomBody.find(".big-img-like-wrapper").data("imageid", imageId);

			$currentImage.attr("src", $nextTarget.attr("src"));
			$zoomBody.find(".current-photo-number").html($nextTarget.data("number"));
			setTimeout(resizeModal(".flipper.img-zoom-flip"),100);
		});
		
		
		///////////////////////////////
		//			ЛАЙКИ			 //
		///////////////////////////////
				
		// получить список лайков при открытии галереи
		function updateLikeList(imageId) {
			$zoomBody.find(".like-person").remove();
			self.socket.emit('getUserImageLike', {hash:user.hash, profileId:profileId, imageId:imageId});
		}
		
		// html елемент списка лайков
		function htmlLikePerson(row) {
			return '<a href="/#page=profile&id='+row.userId+'"><div class="like-person '+((row.my) ? "my": "")+'">\
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="-1 0 20 16">\
					<path fill="#d3494e" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
					4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
					3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
				</svg>\
				<figure class="like-person-avatar" title="">\
					<img src="'+row.userPhoto+'" alt="user" class="" style="max-width: 100%;">\
				</figure>\
				<div class="name-status-holder flexcol">\
					<div class="user-nickname">@'+row.userName+'</div>\
					<!--<div class="user-online-status">'+((row.userLastActive != "online") ? row.userLastActive : lang.lOnlineStatus)+'</div>-->\
				</div>\
				<svg class="user-favour svg-ico '+((row.inFavorite)?'active':'')+'" data-userid="'+row.userId+'" xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">\
					<!--<path fill="#B4B4B4" d="M7.8,2.1c0-0.5,0.2-0.7,0.7-0.7c0,0,0.7-0.1,0.7,0.7c0,0.7-0.6,0.5-0.6,0.8C9,3.9,9.8,7.3,11.3,8 \
						c1.5,1.1,3.6-0.6,4.4-1.2c-0.2-0.7-0.1-1,0.1-1.2c0.2-0.2,0.6-0.2,0.8,0C17,5.7,17.1,6.2,17,6.4c-0.1,0.2-0.5,0.5-1,0.5 \
						c0,0-2.1,5.3-2.3,6c0,0.2-0.2,0.4-0.5,0.4H3.9c-0.2,0-0.4-0.1-0.5-0.4l-2.3-6C0.5,6.9,0.3,6.8,0,6.4c-0.1-0.4,0.1-0.7,0.4-0.8 \
						c0.1-0.1,0.6-0.2,0.8,0c0.4,0.2,0.4,0.6,0.1,1.1c0.8,0.7,3,2.1,4.1,1.5c1.2-0.5,2.8-4.7,2.9-5.2C8.3,2.6,7.9,2.7,7.8,2.1z \
						M13.5,13.6v1.1H3.5v-1.1H13.5z"/>-->\
				</svg>\
			</div></a>';
		}
		
		self.socket.off('getUserImageLike').on('getUserImageLike', function (data) {
			var html = "";
			var isLiked = false;
			
			data.likes.forEach(function(row){
				if(row.my)
					isLiked = true;
				html += htmlLikePerson(row);
			});
			if(html)
				$zoomBody.find(".img-like-info").append(html);
			
			if(isLiked) {
				$zoomBody.find(".big-img-liked").addClass("is-liked");
				$zoomBody.find(".like-heart").removeClass("empty");
			}
			else {
				$zoomBody.find(".big-img-liked").removeClass("is-liked");
				$zoomBody.find(".like-heart").addClass("empty");
			}
			
			$zoomBody.find(".img-like-info .likes-amount").text(data.likes.length);
		});
		
		// клик по лайку
		$zoomBody.on("click", ".big-img-like-wrapper, .total-image-likes", function () {
			$zoomBody.find(".big-img-liked").toggleClass("is-liked");
			$zoomBody.find(".like-heart").toggleClass("empty");
			self.socket.emit('updateUserImageLike', {hash:user.hash, profileId:profileId, imageId:$zoomBody.find(".big-img-like-wrapper").data("imageid")});
		});
		
		self.socket.off('updateUserImageLike').on('updateUserImageLike', function (data) {
			var n = parseInt($zoomBody.find(".img-like-info .likes-amount").text());
				
			if(data.action == "add") {
				var html = htmlLikePerson(data.item);
				$zoomBody.find(".total-image-likes").after(html);
				n += 1;
			}
			else if(data.action == "remove") {
				$zoomBody.find(".like-person.my").remove();
				n -= 1;
			}
			
			$zoomBody.find(".img-like-info .likes-amount").text(n);
		});
	}, 
	updateHeartOpacity: function(o) {
		var self = this;
		var $zoomBody = $("#zoomBody");
		
		var heartHeight = $zoomBody.find(".big-img-like-wrapper").height();
		var heartWidth = $zoomBody.find(".big-img-like-wrapper").width();
		var heartOffset = $zoomBody.find(".big-img-like-wrapper").offset();
		var t =[heartWidth,heartHeight],
			r = [heartOffset.left,heartOffset.top];
		r[0] += t[0] / 2;
		r[1] += t[1] / 2;
		var a = Math.sqrt((r[0] - o.pageX) * (r[0] - o.pageX) + (r[1] - o.pageY) * (r[1] - o.pageY)), i = 150, p = 0;
		i > a && (p = .3 + (1 - a / i));
		p = Math.min(1, Math.max(0, p));
		$zoomBody.find(".big-img-like-wrapper").css("opacity", p);
	},

	// получить список ботов
	getAllBot: function (socket) {
		var self = this;
		self.socket = socket;
		
		if (user.hash) {
			self.socket.emit('getAllBot', {hash:user.hash});
		
			self.socket.removeEventListener('getAllBot');
			self.socket.on('getAllBot', function (data) {
				var html = '';
				data.users.forEach(function(row, i){
					html += '<li class="single-email">\
						<div class="checkbox-container">\
							<input name="userId[]" value="'+row.userId+'" type="checkbox" id="id'+row.userId+'">\
							<label for="id'+row.userId+'">\
								<i class="check-img"></i>\
							</label>\
						</div>\
						<a href="#page=bot-edit&id='+row.userId+'">\
							<figure class="user-avatar" title="">\
								<img src="'+row.userPhoto+'" alt="user" style="max-width: 100%;">\
							</figure>\
							<div class="user-nickname">@'+row.userNickname+'</div>\
						</a>\
						<!-- <div class="checkbox-container">\
							<input name="emailCheck" type="checkbox" id="online'+row.userId+'">\
							<label for="online'+row.userId+'">\
								<i class="check-img"></i>\
							</label>\
						</div> -->\
					</li>';
				});
				$(".emails-wrapper").html(html);

				// insert total bot count
				$('.from','.emails-header').html('add user (models: '+ data.users.length +')');
			});
			
			$(".emails-header .delete").click(function(){
				var userIds = [];
				$(".single-email input:checked").each(function(){
					userIds.push($(this).val());
				})
				self.socket.emit('deleteBot', {
					hash	: user.hash,
					userIds	: userIds
				});
				return false;
			})

			self.socket.on('deleteBot', function (data) {
				if(data.success) {
					$(".single-email input:checked").closest(".single-email").remove();
					showNotify("success", lang.lProfileNotifyDel);
				}
				else
					showNotify("danger", lang.lProfileNotifyDelErr);
			});
		}
	},
	// создать нового бота
	createBot: function (socket) {
		var self = this;
		self.socket = socket;
		
		if (user.hash) {
			self.socket.emit('createBot', {hash:user.hash});
		
			self.socket.removeEventListener('createBot');
			self.socket.on('createBot', function (data) {
				window.location.hash = "page=bot-edit&id="+data.userId;
			});
		}
	},
	// изменить бота
	editBot: function (socket) {
		var self = this;
		self.socket = socket;
		
		if (user.hash) {
			self.socket.emit('editBot', JSON.stringify({hash:user.hash, profileId:urlHash.getState('id')}));
			
			self.socket.removeEventListener('editBot');
			self.socket.on('editBot', function (data) {
				data = JSON.parse(data);
				
				if(data) {
					self.botHash = data.user.userHash;
					
					if(data.user.userDatingSettings) {
						if(data.user.userDatingSettings.gender == 0 || data.user.userDatingSettings.gender == $("#findGirls").val())
							$("#findGirls").attr("checked", true);
						if(data.user.userDatingSettings.gender == 0 || data.user.userDatingSettings.gender == $("#findBoys").val())
							$("#findBoys").attr("checked", true);
						if(data.user.userDatingSettings.online == 1)
							$("#findOnlineOnly").attr("checked", true);
					}
					
					if(data.user.userActive)
						$("#userActive").attr("checked", true);
					if(data.user.userVisible)
						$("#userVisible").attr("checked", true);
					if(data.user.userConfirm)
						$("#userConfirm").attr("checked", true);
					if(data.user.useNickname)
						$("#useNickname").attr("checked", true);
					if(data.user.userWantToDate)
						$("#userWantToDate").attr("checked", true);
					if(data.user.userPublicProfile)
						$("#userPublicProfile").attr("checked", true);
					
					$(".userName").text(data.user.userName);
					$(".userLastName").text(data.user.userLastName);
					$(".userNickname").text(data.user.userNickname);
					$(".userWeight").text(data.user.userWeight);
					$(".userHeight").text(data.user.userHeight);
					$(".userOccupation").text(data.user.userOccupation);
					$(".userAboutMyself").text(data.user.userAboutMyself);
					$(".userAboutPartner").text(data.user.userAboutPartner);
					$(".userStatus").text(data.user.userStatus);
					
					$("select[name=userRole]").val(data.user.userRole);
					
					var html = '<option class="one-option-item" value=""></option>';
					for(var i=0; i<data.city.length; i++)
						html += '<option class="one-option-item" value="'+data.city[i].paramId+'">'+data.city[i].paramName+'</option>'
					$("select[name=userResidenceId], select[name=findResidence]").append(html);
					$("select[name=userResidenceId]").val(data.user.userResidenceId);
					$("select[name=findResidence]").val(data.user.userDatingSettings.residence);

					$("select[name=birthDay]").val(data.user.userBdate[0]);
					$("select[name=birthMonth]").val(data.user.userBdate[1]);
					$("select[name=birthYear]").val(data.user.userBdate[2]);
					
					html = '';
					for(var i=0; i<data.gender.length; i++)
						html += '<option class="one-option-item" value="'+data.gender[i].paramId+'">'+data.gender[i].paramName+'</option>'
					$("select[name=userGenderId]").append(html);
					$("select[name=userGenderId]").val(data.user.userGenderId);
					
					html = '';
					for(var i=0; i<data.eyes.length; i++)
						html += '<option class="one-option-item" value="'+data.eyes[i].paramId+'">'+data.eyes[i].paramName+'</option>'
					$("select[name=userEyesId]").append(html);
					$("select[name=userEyesId]").val(data.user.userEyesId);
					
					html = '';
					for(var i=0; i<data.hair.length; i++)
						html += '<option class="one-option-item" value="'+data.hair[i].paramId+'">'+data.hair[i].paramName+'</option>'
					$("select[name=userHairId]").append(html);
					$("select[name=userHairId]").val(data.user.userHairId);
					
					html = '';
					for(var i=0; i<data.body.length; i++)
						html += '<option class="one-option-item" value="'+data.body[i].paramId+'">'+data.body[i].paramName+'</option>'
					$("select[name=userBodyId]").append(html);
					$("select[name=userBodyId]").val(data.user.userBodyId);
					
					html = '';
					for(var i=0; i<data.religion.length; i++)
						html += '<option class="one-option-item" value="'+data.religion[i].paramId+'">'+data.religion[i].paramName+'</option>'
					$("select[name=userReligionId]").append(html);
					$("select[name=userReligionId]").val(data.user.userReligionId);
					
					html = '';
					for(var i=0; i<data.education.length; i++)
						html += '<option class="one-option-item" value="'+data.education[i].paramId+'">'+data.education[i].paramName+'</option>'
					$("select[name=userEducationId]").append(html);
					$("select[name=userEducationId]").val(data.user.userEducationId);
					
					html = '';
					for(var i=0; i<data.marital_status.length; i++)
						html += '<option class="one-option-item" value="'+data.marital_status[i].paramId+'">'+data.marital_status[i].paramName+'</option>'
					$("select[name=userMaritalStatusId]").append(html);
					$("select[name=userMaritalStatusId]").val(data.user.userMaritalStatusId);
					
					$("select[name=userChildren]").val(data.user.userChildren);
					
					html = '';
					for(var i=0; i<data.smoke.length; i++)
						html += '<option class="one-option-item" value="'+data.smoke[i].paramId+'">'+data.smoke[i].paramName+'</option>'
					$("select[name=userSmokeId]").append(html);
					$("select[name=userSmokeId]").val(data.user.userSmokeId);
					
					html = '';
					for(var i=0; i<data.drink.length; i++)
						html += '<option class="one-option-item" value="'+data.drink[i].paramId+'">'+data.drink[i].paramName+'</option>'
					$("select[name=userDrinkId]").append(html);
					$("select[name=userDrinkId]").val(data.user.userDrinkId);

					html = '';
					for(var i=0; i<data.hobbie.length; i++)
						html += '<option class="one-option-item" value="'+data.hobbie[i].paramId+'">'+data.hobbie[i].paramName+'</option>'
					$("select[name=userHobbiesId]").append(html);
					$("select[name=userHobbiesId]").val(data.user.userHobbiesId);
					
					html = '';
					for(var i=0; i<data.color.length; i++)
						html += '<option class="one-option-item" value="'+data.color[i].paramId+'">'+data.color[i].paramName+'</option>'
					$("select[name=userFavoriteColorId]").append(html);
					$("select[name=userFavoriteColorId]").val(data.user.userFavoriteColorId);
					
					html = '';
					for(var i=0; i<data.sport.length; i++)
						html += '<option class="one-option-item" value="'+data.sport[i].paramId+'">'+data.sport[i].paramName+'</option>'
					$("select[name=userSportId]").append(html);
					$("select[name=userSportId]").val(data.user.userSportId);
					
					html = '';
					for(var i=0; i<data.country.length; i++)
						html += '<option class="one-option-item" value="'+data.country[i].paramId+'">'+data.country[i].paramName+'</option>'
					$("select[name=userBeenAbroadId]").append(html);
					$("select[name=userBeenAbroadId]").val(data.user.userBeenAbroadId);
					
					html = '';
					for(var i=0; i<data.dating_goal.length; i++)
						html += '<option class="one-option-item" value="'+data.dating_goal[i].paramId+'">'+data.dating_goal[i].paramName+'</option>'
					$("select[name=userDatingGoalId]").append(html);
					$("select[name=userDatingGoalId]").val(data.user.userDatingGoalId);
					
					html = '';
					for(var i=0; i<data.interest.length; i++)
						html += '<option class="one-option-item" value="'+data.interest[i].paramId+'">'+data.interest[i].paramName+'</option>'
					$("select[name=userInterestId]").append(html);
					$("select[name=userInterestId]").val(data.user.userInterestId);
					
					html = '';
					for(var i=0; i<data.character.length; i++)
						html += '<option class="one-option-item" value="'+data.character[i].paramId+'">'+data.character[i].paramName+'</option>'
					$("select[name=userCharacterId]").append(html);
					$("select[name=userCharacterId]").val(data.user.userCharacterId);
					
					html = '';
					data.images.forEach(function(row, i){
						html += '<div class="single-photo">\
							<img class="profile-img" src="'+row.path+'" data-id="'+row.id+'" data-number="'+(i+1)+'" alt="profile image">\
							<div class="single-photo-edit">\
								<svg class="single-photo-edit-ico svg-ico" xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 11 11">\
									<path fill="#FFAE2E" d="M10.934 2.176L9.91 3.198l-2.086-2.08-.79.79L9.12 3.985l-5.115 5.1-2.085-2.08-.792.79\
							2.085 2.08-.51.507-.01-.01c-.055.093-.147.16-.256.185l-1.945.432c-.03.007-.058.01-.088.01-.106\
							0-.21-.042-.285-.118-.1-.098-.14-.238-.11-.373l.433-1.94c.025-.108.093-.2.185-.256l-.01-.01L8.848.097c.12-.12.317-.12.437\
							0l1.648 1.643c.122.12.122.316 0 .436z"/>\
								</svg>\
								<ul class="edit-img-menu">' +
								'<li class="option to-main">' + lang.lProfilePhotoMain + '</li>' +
								'<li class="option to-trash">' + lang.lProfilePhotoDeleteBtn + '</li>' +
								'</ul>\
							</div>\
						</div>';
					});
					$(".photos-wrapper").prepend(html);
					
					//slider
					var $ageFrom = $(".partner-search .sliderdata-from");
					var $ageTo = $(".partner-search .sliderdata-to");
					var $slider = $(".partner-search #slider");
					
					$slider.slider({
						range: true,
						min: 18,
						max: 50,
						values: [((data.user.userDatingSettings) ? data.user.userDatingSettings.ageFrom : 18), ((data.user.userDatingSettings) ? data.user.userDatingSettings.ageTo : 80)],
						slide: function (event, ui) {
							$ageFrom.val(ui.values[0]);
							$ageTo.val(ui.values[1]);
						}, 
						change: function( event, ui ) {
							$("[name=findResidence]").trigger("change");
						}
					});
					$ageFrom.val($slider.slider("values", 0));
					$ageTo.val($slider.slider("values", 1));

					//change from field input
					$ageFrom.change(function () {
						var val1 = parseInt($ageFrom.val());
						var val2 = parseInt($ageTo.val());
						val1 = val1 < val2 ? val1 : val2;
						$slider.slider("values", 0, val1);
						$("[name=findResidence]").trigger("change");
					});
					
					//change to field input
					$ageTo.change(function () {
						var val1 = parseInt($ageFrom.val());
						var val2 = parseInt($ageTo.val());
						val2 = val2 > val1 ? val2 : val1;
						$slider.slider("values", 1, val2);
						$("[name=findResidence]").trigger("change");
					});
					
					 //choosen
					var config = {
						'.chosen-select-deselect'  : {allow_single_deselect:true, width:"200px",disable_search_threshold:10},
						'.chosen-select-birthday'  : {allow_single_deselect:true, width:"55px",disable_search_threshold:10},
						'.chosen-select-birthmonth'  : {allow_single_deselect:true, width:"100px",disable_search_threshold:10},
						'.chosen-select-birthyear'  : {allow_single_deselect:true, width:"75px",disable_search_threshold:10}
						/*,
						 '.chosen-select-no-results': {no_results_text:'Oops, nothing found!'}*/
					};

					for (var selector in config)
						$(selector).chosen(config[selector]);
					
					/*** User status changing functions ***/
					var $parameterText = $(".parameter-text"),
						$saveButtonHolder = $(".save-button-holder"),
						$saveStatusButton = $(".save-status-btn"),
						$parameterField = $(".parameter-field"),
						$cabinetWrapper = $(".cabinet-edit-page"),
						userStatus = '';

					$parameterField.on("focusin", ".parameter-text", function(e){
						var $target = $(".parameter-field.editable");
						$target
							.find(".save-button-holder")
							.hide();
						$target
							.removeClass("editable")
							.find(".parameter-text")
							.text(userStatus);
						userStatus = $(e.target).text();
						$(e.target)
							.closest(".parameter-field")
							.addClass("editable")
							.find(".save-button-holder")
							.show();
					});

					$parameterField.on("keydown", ".parameter-text", function(e){
						var $target = $(e.target).closest(".parameter-field");
						if (e.which == 27) {
							// Esc keyboard button close status input field
							// & returns old status
							$target
								.find(".save-button-holder")
								.hide();
							$target
								.removeClass("editable")
								.find(".parameter-text")
								.text(userStatus)
								.blur();
						}
						if (e.which == 13) {
							// Enter saves status
							e.preventDefault();
							$target
								.find(".save-status-btn")
								.click();
							$target
								.find(".parameter-text")
								.blur();
						}
					});

					$cabinetWrapper.on("click", function(e){
						var isButtonArr = [],
							isNotButton;
						for (var i = 0; i< $parameterText.length; i++){
							isButtonArr[i] = !( !(e.target !=  $parameterText[i]) || !(e.target != $saveButtonHolder[i]) || !(e.target != $parameterField[i]) || !(e.target != $saveStatusButton[i]))
						}
						isNotButton = !isButtonArr.includes(false);
						if (isNotButton) {
							var $target = $(".parameter-field.editable");
							$target
								.find(".save-button-holder")
								.hide();
							$target
								.removeClass("editable")
								.find(".parameter-text")
								.text(userStatus)
								.blur();
						}
					});

					$saveStatusButton.on("click", function(e){
						var obj = $(this).closest(".parameter-field").find(".parameter-text");
						self.socket.emit('updateUserParam', {
							"hash"  : self.botHash,
							"key"  : obj.data("name"),
							"value"  : obj.text()
						});
						userStatus = $(e.target).closest(".parameter-text").text();
						$(e.target).closest(".save-button-holder").hide();
						$(".parameter-field.editable").removeClass("editable");
					});
					
					$(".info-items-container select, .check-container input").change(function(){
						if($(this).attr("name").substr(0, 4) == "find") {
							var gender = "";
					
							var gender1 = $("#findGirls:checked").val();
							var gender2 = $("#findBoys:checked").val();
								
							if(gender1 && !gender2)
								gender = gender1;
							else if(gender2 && !gender1)
								gender = gender2;
							
							var value = {
								ageFrom		: $ageFrom.val(),
								ageTo		: $ageTo.val(),
								online		: $("#findOnlineOnly:checked").length,
								gender		: gender,
								residence	: $("select[name=findResidence]").val(),
								offset		: 0
							}
							
							self.socket.emit('updateUserParam', {
								"hash"	: self.botHash,
								"key"	: "userDatingSettings",
								"value"	: JSON.stringify(value)
							});
						}
						else {
							self.socket.emit('updateUserParam', {
								"hash"	: self.botHash,
								"key"	: $(this).attr("name"),
								"value"	: ($(this).attr("type") == "checkbox") ? (($(this).is(':checked')) ? 1 : 0) : $(this).val()
							});
						}
					});
					
					$("[name=birthDay], [name=birthMonth], [name=birthYear]").unbind("change").change(function(){
						var day = $("[name=birthDay]").val();
						var month = $("[name=birthMonth]").val();
						var year = $("[name=birthYear]").val();

						self.socket.emit('updateUserParam', {
							"hash"	: self.botHash,
							"key"	: "userBdate",
							"value"	: ((day && month && year) ? year + "-" + month + "-" + day : "0000-00-00")
						});
					});
					
					self.socket.removeEventListener('updateUserParam');
					self.socket.on('updateUserParam', function (data) {
						setTimeout(function(){
							if(data.success)
								showNotify("success", lang.lProfileSave);
							else
								showNotify("danger", lang.lProfileSaveErr);
						}, 100);
					});
					
					// ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ
					var $content = $(".center-content");
					var $uploadPhotoArea = $(".photos-wrapper");
					$uploadPhotoArea.upload({
						action: "/profile/upload-image", 
						postKey: "image", 
						postData: {hash:self.botHash}, 
						label: '<svg class="svg-ico add-photo-ico" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">\
						<g fill="none" stroke="#010101" stroke-miterlimit="10">\
							<ellipse cx="21.1" cy="21" rx="20.2" ry="20.4"></ellipse>\
							<path d="M21 8.7v23.6M9.4 20.5h23.4"></path>\
						</g>\
					</svg>'
					});

					$uploadPhotoArea.on("filecomplete", function(obj, file, res){
						var nextImageNumber = $(".photos-wrapper .single-photo").length + 1;
						var imgTemplate = '' +
							'<div class="single-photo" style="height: 0; opacity: 0">' +
								'<img class="profile-img" src="' + res + '" data-number="' + nextImageNumber + '" alt="profile image">' +
								'<div class="single-photo-edit">' +
									'<svg class="single-photo-edit-ico svg-ico" xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 11 11">' +
										'<path fill="#FFAE2E" d="M10.934 2.176L9.91 3.198l-2.086-2.08-.79.79L9.12 3.985l-5.115 5.1-2.085-2.08-.792.79 ' +
											'2.085 2.08-.51.507-.01-.01c-.055.093-.147.16-.256.185l-1.945.432c-.03.007-.058.01-.088.01-.106 ' +
											'0-.21-.042-.285-.118-.1-.098-.14-.238-.11-.373l.433-1.94c.025-.108.093-.2.185-.256l-.01-.01L8.848.097c.12-.12.317-.12.437 ' +
											'0l1.648 1.643c.122.12.122.316 0 .436z"/>' +
									'</svg>' +
									'<ul class="edit-img-menu">' +
										'<li class="option to-main">' + lang.lProfilePhotoMain + '</li>' +
										'<li class="option to-trash">' + lang.lProfilePhotoDeleteBtn + '</li>' +
									'</ul>' +
								'</div>' +
							'</div> ';
						$(".photos-wrapper .fs-upload-target").before(imgTemplate);

						$uploadPhotoArea.find(".single-photo").last().animate({
							height: 90,
							opacity: 1
						},200)
					});
					var dragImgTimer;
					$("body, .photos-wrapper").on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
						e.preventDefault();
						e.stopPropagation();
					}).on('dragover dragenter', function() {
						clearTimeout(dragImgTimer);
						$uploadPhotoArea.addClass('is-dragover');
					}).on('dragleave dragend drop', function() {
						dragImgTimer = setTimeout(function () {
							$uploadPhotoArea.removeClass('is-dragover')
						},200)
					});

					// УДАЛИТЬ ИЗОБРАЖЕНИЕ
					$content.on("click", ".to-trash", function(){
						self.socket.emit('deleteUserImage', {
							"hash"	: self.botHash, 
							"image"	: $(this).parents(".single-photo").find(".profile-img").attr("src")
						});
						return false;
					});
					
					self.socket.removeEventListener('deleteUserImage');
					self.socket.on('deleteUserImage', function (data) {
						$(".photos-wrapper img[src='"+data.image+"']").parent().animate({
							width: 0,
							height: 0,
							opacity: 0
						}, 200, function () {
							this.remove();
						})
					});

					// ОБРЕЗАТЬ ИЗОБРАЖЕНИЕ
					var jcropApi;
					var jcropX = 0;
					var jcropY = 0;
					var jcropX2 = 200;
					var jcropY2 = 200;
					function cropevent(c){
						if(parseInt(c.w) > 0){
							if(c.x < 0) jcropX = 0; else jcropX = Math.floor(c.x);
							if(c.y < 0) jcropY = 0; else jcropY = Math.floor(c.y);
							if(c.x2 < 0) jcropX2 = 0; else jcropX2 = Math.floor(c.x2);
							if(c.y2 < 0) jcropY2 = 0; else jcropY2 = Math.floor(c.y2);
						}
					}
					
					var $cropBody = $("#cropBody");
					var cropImgSrc = '';
					$content.on("click", ".to-main", function(e){
						var $target = $(this).parents(".single-photo").find(".profile-img");
						cropImgSrc = $target.attr("src");
						if(!$target.parent().hasClass("add-photo")) {
							$cropBody.find("img").attr("src", cropImgSrc);
							showFlipModal(".flipper.avatar-crop-flip");

							jcropApi = $.Jcrop($cropBody.find("img"), {
								bgColor		: 'white',
								bgOpacity	: 0.3,
								aspectRatio	: 1,
								minSize		: [300, 300],
								setSelect	: [0, 0, 300, 300],
								onChange	: cropevent,
								onSelect	: cropevent
							});
							$content.one("click",".page-shadow-hover, .form-close.clickable, .crop-image-save", function () {
								$cropBody.prepend('<img src="'+ cropImgSrc +'" alt="image" class="crop-image">');
								jcropApi.destroy();
								hideFlipModal(".flipper.avatar-crop-flip");
							});
						}
					});

					$content.on("click", ".crop-image-save", function(){
						self.socket.emit('cropUserImage', {
							"hash"	: self.botHash, 
							"path"	: $cropBody.find(".crop-image").attr("src"),
							"x"		: jcropX, 
							"y"		: jcropY, 
							"width"	: (jcropX2 - jcropX), 
							"height": (jcropY2 - jcropY)
						});
						return false;
					});
				}
			});
		}
	},
	
	initComments: function (){
		var self = this;

		// request: sticker, response: stickers
		stickersAndEmoji.init({container: '.sticker-lift', socket: self.socket});
		chat.initSocketHandlers();

		waitForStickers();

		function waitForStickers() {
			if ($.isEmptyObject(stickersAndEmoji.stickers)) {
				setTimeout(waitForStickers, 200)
			} else {
				chat.getCommentsForMainChat({userId: self.profileId});  // request: getCommentsForMainChat, response: commentsForMainChat
			}
		}
	},
    initMyFeed: function () {
        var self = this;
        pageFeed.currentPost.ribbonId = false;

        pageFeed.initWritePostHandlers();

        self.socket.emit('getProfileFeed', JSON.stringify({hash: user.hash, userId: self.profileId}));

        self.socket.off('profileFeed').on('profileFeed', function (data) {
            data = JSON.parse(data);

            var myRibbonHTML = '';

            for (var i=0; i<data.length;i++){
                myRibbonHTML += pageFeed.ribbonData(data[i])
            }

            // клик по лайку
            $(".inner-content .feed-profile").html(myRibbonHTML).off("click").on("click", ".postaction .like", function () {
                pageFeed.recentImage = $(this).parents(".post");
                var data = {
                	hash: user.hash,
					profileId: pageFeed.recentImage.data("userid"),
					ribbonId: pageFeed.recentImage.data("ribbonid")
                };
                self.socket.emit('updateUserPostLike', JSON.stringify(data));
                self.socket.emit('getUserPostLike', JSON.stringify(data));
            });

            $(".feed-profile .post").each(function () {
                fadeMenu($(this).find('.settings-dots'),$(this).find('.post-menu'));
            });
            pageFeed.initFeedGallery($(".inner-content .feed-profile"));

            var ribbonId;
            if(ribbonId = urlHash.getState("ribbonId")){
            	setTimeout(function () {
                    $(document).scrollTo(".post[data-ribbonid=" + ribbonId + "]");
                },5000)
            }
		});

        pageFeed.initPostPhotoUpload();
        pageFeed.initPosthotoDelete();
        pageFeed.initSavePost();

        self.socket.off('addRibbonPost').on('addRibbonPost', function (data) {
            var data = JSON.parse(data);
            if (data.result === 'success') {
                var postData  = {};
                var postImgArray = [];
                var postWidthArray = [];
                var postHeightArray = [];
                var ribbonVideo = $('.picture-box video source').attr('src');
                var ribbonVideoThumb = $('.picture-box video').attr('data-thumb');

                $('.picture-box img').each(
                    function(index) {
                        postImgArray.push($(this).attr('src'));
                        postWidthArray.push($(this).attr('data-width'));
                        postHeightArray.push($(this).attr('data-height'));
                    }
                );

                postData.ribbonDate = 'online';
                postData.ribbonVideo = ribbonVideo ? ribbonVideo : null;
                postData.ribbonVideoThumb = ribbonVideoThumb ? ribbonVideoThumb : null;
                postData.ribbonPhoto = postImgArray.join().length > 0 ? postImgArray.join() : null;
                postData.ribbonPhotoWidth = postWidthArray.join().length > 0 ? postWidthArray.join() : null;
                postData.ribbonPhotoHeight = postHeightArray.join().length > 0 ? postHeightArray.join() : null;
                postData.mylike = null;
                postData.claim = null;
                postData.ribbonId = data.ribbonId;
                postData.userId = data.userId;
                postData.like = 0;
                postData.ribbonText = pageFeed.correctPostTextBeforeSend($('.writepost__input').html()).text;
                postData.userPhoto = $('#authorized-user .user-avatar img').attr('src');
                postData.userName = $('#authorized-user .profile-name').text();

                if (data.status === 'add'){
                    $(".inner-content .feed-profile").prepend(pageFeed.ribbonData(postData));
                    showNotify(data.result, 'Додано');
                    fadeMenu($(".feed-profile .post:first-of-type").find('.settings-dots'),$(".feed-profile .post:first-of-type").find('.post-menu'));
                } else if (data.status === 'update') {
                    $('.inner-content .feed-profile .post[data-ribbonid="' + data.ribbonId + '"]').replaceWith(pageFeed.ribbonData(postData));
                    showNotify(data.result, 'Відредаговано');
                    fadeMenu($('.post[data-ribbonid="' + data.ribbonId + '"]').find('.settings-dots'),$('.post[data-ribbonid="' + data.ribbonId + '"]').find('.post-menu'));
                }


                $('.pictures-holder').find('.picture-box').remove();
                $('.pictures-holder .template').show();
                $('.writepost__input').html('');
                $('.writepost .cancel-post').click();
            } else if (data.result === 'error') {
                showNotify(data.result, 'Помилка додавання');
            }
        });
    },

    initSocInfo: function(profileId){
        var self = this;

        self.socket.emit('getSocialContacts', JSON.stringify({hash:user.hash, profileId: ''+profileId}));
        self.socket.off('getSocialContacts').on('getSocialContacts', function (data) {
            data = JSON.parse(data);

            if(data.socialEmail !== null){
                if(data.socialEmail.length>0){
                    $('.soc-btn[data-link="socialEmail"]').attr('href','mailto:'+data.socialEmail).show();
                }
            }
            if(data.phoneNumber !== null){
                if(data.phoneNumber.length>0){
                    if (+data.hasTelegram === 1){
                        var $socTelegramWrapper = $('.soc-btn[data-link="hasTelegram"]');
                        $socTelegramWrapper.show();
                        $socTelegramWrapper.find(".soc-tooltip").text(data.phoneNumber);
                        fadeMenu($socTelegramWrapper.find('svg'), $socTelegramWrapper.find(".soc-tooltip"));
                    }
                    if (+data.hasViber === 1){
                        var $socViberWrapper = $('.soc-btn[data-link="hasViber"]');
                        $socViberWrapper.show();
                        $socViberWrapper.find(".soc-tooltip").text(data.phoneNumber);
                        fadeMenu($socViberWrapper.find('img'), $socViberWrapper.find(".soc-tooltip"));
                    }
                    if (+data.hasWhatsapp === 1){
                    	var $socWhatsappWrapper = $('.soc-btn[data-link="hasWhatsapp"]');
                        var phoneNumberToFormat = data.phoneNumber;
                        var phoneCorrect = phoneNumberToFormat.match(/\D/im);

                        while (phoneCorrect !== null ){
                            phoneNumberToFormat = phoneNumberToFormat.replace(phoneCorrect[0],'');
                            phoneCorrect = phoneNumberToFormat.match(/\D/im);
                        }

                        $socWhatsappWrapper.attr('href','https://api.whatsapp.com/send?phone=+'+phoneNumberToFormat).show();
                        $socWhatsappWrapper.find(".soc-tooltip").text(data.phoneNumber);
                        fadeMenu($socWhatsappWrapper.find('img'), $socWhatsappWrapper.find(".soc-tooltip"));
                    }
                }
			}

            $(".soc-buttons .soc-btn.soc-link").each(function () {
                var inputName = $(this).data('link');
                if(data[inputName] !== null){
                    if(data[inputName].length>0){
                    	var linkCorrect = data[inputName].match(/\/\//g);
                        if (linkCorrect === null) {
                            data[inputName] = '//'+data[inputName];
                        }
                        $(this).attr('href',data[inputName]).show();
                    }
				}
            })
        });
    }
};
'use strict';
const pageSettings = {
  socket: {},
  $ageFrom: {},
  $ageTo: {},
  $slider: {},

  /** Init page **/
  init (socket) {
    let self = this;
    self.socket = socket;

    self.editPage();
    self.searchSettingsInit();
    self.stickersSettingsInit();
    self.radioSettingsInit();
    self.socialSettingsInit()
  },

  // редактирования пользователя
  editPage () {
    var self = this;

    self.socket.emit('getProfileEdit', JSON.stringify({hash: user.hash}));
    self.socket.off("getProfileEdit").on('getProfileEdit', function (data) {
      data = JSON.parse(data);

      self.user = data.user;

      $(".settings-language ." + self.user.userLanguage).attr("checked", true);

      $(".settings-profile .kg").text(self.user.userWeight);
      $(".settings-profile .userName").text(self.user.userName);
      $(".settings-profile .santimeters").text(self.user.userHeight);
      $(".settings-profile .userLastName").text(self.user.userLastName);
      $(".settings-profile .userNickname").text(self.user.userNickname);
      $(".settings-profile .userOccupation").text(self.user.userOccupation);
      $(".settings-profile .userAboutMyself").text(self.user.userAboutMyself);
      $(".settings-profile .userAboutPartner").text(self.user.userAboutPartner);

      if (self.user.useNickname)
        $(".settings-profile #useNickname").attr("checked", true);
      if (self.user.userPublicProfile)
        $(".settings-privacy #userPublicProfile").attr("checked", true);
      if (self.user.showMyComments)
        $(".settings-privacy #showMyComments").attr("checked", true);

      var html = '<option class="one-option-item" value=""></option>';
      for (var i = 0; i < data.city.length; i++)
        html += '<option class="one-option-item" value="' + data.city[i].paramId + '">' + data.city[i].paramName + '</option>'
      $("select[name=userResidenceId]").append(html);
      $("select[name=userResidenceId]").val(self.user.userResidenceId);

      $("select[name=birthDay]").val(self.user.userBdate[0]);
      $("select[name=birthMonth]").val(self.user.userBdate[1]);
      $("select[name=birthYear]").val(self.user.userBdate[2]);

      html = '';
      for (var i = 0; i < data.gender.length; i++)
        html += '<option class="one-option-item" value="' + data.gender[i].paramId + '">' + data.gender[i].paramName + '</option>'
      $("select[name=userGenderId]").append(html);
      $("select[name=userGenderId]").val(self.user.userGenderId);

      html = '';
      for (var i = 0; i < data.eyes.length; i++)
        html += '<option class="one-option-item" value="' + data.eyes[i].paramId + '">' + data.eyes[i].paramName + '</option>'
      $(".settings-profile select[name=userEyesId]").append(html);
      $(".settings-profile select[name=userEyesId]").val(self.user.userEyesId);

      html = '';
      for (var i = 0; i < data.hair.length; i++)
        html += '<option class="one-option-item" value="' + data.hair[i].paramId + '">' + data.hair[i].paramName + '</option>'
      $(".settings-profile select[name=userHairId]").append(html);
      $(".settings-profile select[name=userHairId]").val(self.user.userHairId);

      html = '';
      for (var i = 0; i < data.body.length; i++)
        html += '<option class="one-option-item" value="' + data.body[i].paramId + '">' + data.body[i].paramName + '</option>'
      $(".settings-profile select[name=userBodyId]").append(html);
      $(".settings-profile select[name=userBodyId]").val(self.user.userBodyId);

      html = '';
      for (var i = 0; i < data.religion.length; i++)
        html += '<option class="one-option-item" value="' + data.religion[i].paramId + '">' + data.religion[i].paramName + '</option>'
      $(".settings-profile select[name=userReligionId]").append(html);
      $(".settings-profile select[name=userReligionId]").val(self.user.userReligionId);

      html = '';
      for (var i = 0; i < data.education.length; i++)
        html += '<option class="one-option-item" value="' + data.education[i].paramId + '">' + data.education[i].paramName + '</option>'
      $(".settings-profile select[name=userEducationId]").append(html);
      $(".settings-profile select[name=userEducationId]").val(self.user.userEducationId);

      html = '';
      for (var i = 0; i < data.marital_status.length; i++)
        html += '<option class="one-option-item" value="' + data.marital_status[i].paramId + '">' + data.marital_status[i].paramName + '</option>'
      $(".settings-profile select[name=userMaritalStatusId]").append(html);
      $(".settings-profile select[name=userMaritalStatusId]").val(self.user.userMaritalStatusId);

      $(".settings-profile select[name=userChildren]").val(self.user.userChildren);

      html = '';
      for (var i = 0; i < data.smoke.length; i++)
        html += '<option class="one-option-item" value="' + data.smoke[i].paramId + '">' + data.smoke[i].paramName + '</option>'
      $(".settings-profile select[name=userSmokeId]").append(html);
      $(".settings-profile select[name=userSmokeId]").val(self.user.userSmokeId);

      html = '';
      for (var i = 0; i < data.drink.length; i++)
        html += '<option class="one-option-item" value="' + data.drink[i].paramId + '">' + data.drink[i].paramName + '</option>'
      $(".settings-profile select[name=userDrinkId]").append(html);
      $(".settings-profile select[name=userDrinkId]").val(self.user.userDrinkId);

      html = '';
      for (var i = 0; i < data.hobbie.length; i++)
        html += '<option class="one-option-item" value="' + data.hobbie[i].paramId + '">' + data.hobbie[i].paramName + '</option>'
      $(".settings-profile select[name=userHobbiesId]").append(html);
      $(".settings-profile select[name=userHobbiesId]").val(self.user.userHobbiesId);

      html = '';
      for (var i = 0; i < data.color.length; i++)
        html += '<option class="one-option-item" value="' + data.color[i].paramId + '">' + data.color[i].paramName + '</option>'
      $(".settings-profile select[name=userFavoriteColorId]").append(html);
      $(".settings-profile select[name=userFavoriteColorId]").val(self.user.userFavoriteColorId);

      html = '';
      for (var i = 0; i < data.sport.length; i++)
        html += '<option class="one-option-item" value="' + data.sport[i].paramId + '">' + data.sport[i].paramName + '</option>'
      $(".settings-profile select[name=userSportId]").append(html);
      $(".settings-profile select[name=userSportId]").val(self.user.userSportId);

      html = '';
      for (var i = 0; i < data.country.length; i++)
        html += '<option class="one-option-item" value="' + data.country[i].paramId + '">' + data.country[i].paramName + '</option>'
      $(".settings-profile select[name=userBeenAbroadId]").append(html);
      $(".settings-profile select[name=userBeenAbroadId]").val(self.user.userBeenAbroadId);

      html = '';
      for (var i = 0; i < data.dating_goal.length; i++)
        html += '<option class="one-option-item" value="' + data.dating_goal[i].paramId + '">' + data.dating_goal[i].paramName + '</option>'
      $(".settings-profile select[name=userDatingGoalId]").append(html);
      $(".settings-profile select[name=userDatingGoalId]").val(self.user.userDatingGoalId);

      html = '';
      for (var i = 0; i < data.interest.length; i++)
        html += '<option class="one-option-item" value="' + data.interest[i].paramId + '">' + data.interest[i].paramName + '</option>'
      $(".settings-profile select[name=userInterestId]").append(html);
      $(".settings-profile select[name=userInterestId]").val(self.user.userInterestId);

      html = '';
      for (var i = 0; i < data.character.length; i++)
        html += '<option class="one-option-item" value="' + data.character[i].paramId + '">' + data.character[i].paramName + '</option>'
      $(".settings-profile select[name=userCharacterId]").append(html);
      $(".settings-profile select[name=userCharacterId]").val(self.user.userCharacterId);

      // CONTACTS
      $(".settings-profile .userPhone").text(self.user.userPhone);
      $(".settings-profile .userUrlFacebook").text(self.user.userUrlFacebook);
      $(".settings-profile .userUrlInstagram").text(self.user.userUrlInstagram);
      $(".settings-profile .userUrlTwitter").text(self.user.userUrlTwitter);
      $(".settings-profile .userUrlGogglePlus").text(self.user.userUrlGogglePlus);

      if (self.user.useViber)
        $(".settings-profile #useViber").attr("checked", true);
      if (self.user.useTelegram)
        $(".settings-profile #useTelegram").attr("checked", true);
      if (self.user.useWhatsApp)
        $(".settings-profile #useWhatsApp").attr("checked", true);

      // DATING

      // чекбокс "участвовать в знакомствах"
      if (self.user.userWantToDate) {
        $(".settings-dating #wantToDate").attr("checked", true);
        $(".settings-dating .wantToDate.allowed").removeClass("not");
      }

      // фото профиля
      if (self.user.userPhoto != "/media/ava/guestAva.png")
        $(".settings-dating .userPhoto.allowed").removeClass("not");

      // загруженные изображения
      var html = "";
      for (var i = 0; i < data.images.length; i++)
        html += '<div class="single-photo">\
					<img class="profile-img" src="' + data.images[i].path + '" alt="profile image">\
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
      $(".settings-dating .photos-wrapper").prepend(html);

      // дата рождения
      if (self.user.userBdate[0] != 0)
        $(".settings-dating .userBdate.allowed").removeClass("not");

      // город
      if (self.user.userResidenceId > 0)
        $(".settings-dating .userResidenceId.allowed").removeClass("not");

      // пол
      if (self.user.userGenderId > 0)
        $(".settings-dating .userGenderId.allowed").removeClass("not");

      self.checkConditions();

      // CHOSEN
      var config = {
        '.chosen-select-deselect': {width: "200px", disable_search_threshold: 10},
        '.chosen-select-birthday': {width: "55px", disable_search_threshold: 10},
        '.chosen-select-birthmonth': {width: "100px", disable_search_threshold: 10},
        '.chosen-select-birthyear': {width: "75px", disable_search_threshold: 10},
        '.chosen-select-gender': {width: "120px", disable_search_threshold: 10}
      };

      for (var selector in config)
        $(selector).chosen(config[selector]);

      $("#userPhone").inputmask("+38 (099) 999-99-99");
    });

    // CHANGE EVENT
    self.updateDatingShow = false;

    $(".settings-language [name=userLanguage]").change(function () {
      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": "userLanguage",
        "value": $(this).val()
      });
      location.reload();
    });

    $(".settings-profile .info-items-container select").change(function () {
      var key = $(this).attr("name");
      if (key != "userResidenceId" && key != "userGenderId") {
        self.socket.emit('updateUserParam', {
          "hash": user.hash,
          "key": key,
          "value": $(this).val()
        });
      }
      else
        $(".settings-dating [name=" + key + "]").val($(this).val()).trigger("chosen:updated");
    });
    $(".settings-profile [name=birthDay], .settings-profile [name=birthMonth], .settings-profile [name=birthYear]").unbind("change").change(function () {
      var day = $(".settings-profile [name=birthDay]").val();
      var month = $(".settings-profile [name=birthMonth]").val();
      var year = $(".settings-profile [name=birthYear]").val();

      $(".settings-dating [name=birthDay]").val(day).trigger("chosen:updated");
      $(".settings-dating [name=birthMonth]").val(month).trigger("chosen:updated");
      $(".settings-dating [name=birthYear]").val(year).trigger("chosen:updated");
      $(".settings-dating .chosen-select-birthday").trigger("change");

      self.updateDatingShow = true;
    });
    $(".settings-privacy .check-container input, .settings-profile .check-container input").click(function () {
      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": $(this).attr("name"),
        "value": (($(this).is(':checked')) ? 1 : 0)
      });
    });


    /*** User status changing functions ***/
    var $parameterText = $(".settings-profile .parameter-text"),
      $saveButtonHolder = $(".settings-profile .save-button-holder"),
      $saveStatusButton = $(".settings-profile .save-status-btn"),
      $parameterField = $(".settings-profile .parameter-field"),
      $cabinetWrapper = $(".settings-profile"),
      userStatus = '';

    $parameterField.on("focusin", ".parameter-text", function (e) {
      var $target = $(".settings-profile .parameter-field.editable");
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

    $parameterField.on("keydown", ".settings-profile .parameter-text", function (e) {
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

    $cabinetWrapper.on("click", function (e) {
      var isButtonArr = [],
        isNotButton;
      for (var i = 0; i < $parameterText.length; i++) {
        isButtonArr[i] = !( !(e.target != $parameterText[i]) || !(e.target != $saveButtonHolder[i]) || !(e.target != $parameterField[i]) || !(e.target != $saveStatusButton[i]))
      }
      isNotButton = !isButtonArr.includes(false);
      if (isNotButton) {
        var $target = $(".settings-profile .parameter-field.editable");
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

    $saveStatusButton.on("click", function (e) {
      var obj = $(this).closest(".parameter-field").find(".parameter-text");
      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": obj.data("name"),
        "value": obj.text().trim()
      });
      userStatus = $(e.target).closest(".parameter-text").text();
      $(e.target).closest(".save-button-holder").hide();
      $(".settings-profile .parameter-field.editable").removeClass("editable");
    });

    // чекбокс "участвовать в знакомствах"
    $(".settings-dating #wantToDate").change(function () {
      self.user.userWantToDate = $(".settings-dating #wantToDate:checked").length;

      self.updateDatingShow = true;

      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": "userWantToDate",
        "value": self.user.userWantToDate
      });
      $(".settings-dating .wantToDate.allowed").toggleClass("not");
    });

    // ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ
    var $content = $(".settings-dating");
    var $uploadPhotoArea = $(".settings-dating .photos-wrapper");

    $uploadPhotoArea.upload({
      action: "/profile/upload-image",
      postKey: "image",
      postData: {hash: user.hash},
      label: '<svg class="svg-ico add-photo-ico" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">\
				<g fill="none" stroke="#010101" stroke-miterlimit="10">\
					<ellipse cx="21.1" cy="21" rx="20.2" ry="20.4"></ellipse>\
					<path d="M21 8.7v23.6M9.4 20.5h23.4"></path>\
				</g>\
			</svg>'
    });

    $uploadPhotoArea.on("filecomplete", function (obj, file, res) {
      var imgTemplate = '<div class="single-photo" style="height: 0; opacity: 0">\
				<img class="profile-img" src="' + res + '" alt="profile image">\
				<div class="single-photo-edit">\
					<svg class="single-photo-edit-ico svg-ico" xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 11 11">\
						<path fill="#FFAE2E" d="M10.934 2.176L9.91 3.198l-2.086-2.08-.79.79L9.12 3.985l-5.115 5.1-2.085-2.08-.792.79 \
							2.085 2.08-.51.507-.01-.01c-.055.093-.147.16-.256.185l-1.945.432c-.03.007-.058.01-.088.01-.106 \
							0-.21-.042-.285-.118-.1-.098-.14-.238-.11-.373l.433-1.94c.025-.108.093-.2.185-.256l-.01-.01L8.848.097c.12-.12.317-.12.437 \
							0l1.648 1.643c.122.12.122.316 0 .436z"/>\
					</svg>\
						<ul class="edit-img-menu">' +
        '<li class="option to-main">' + lang.lProfilePhotoMain + '</li>' +
        '<li class="option to-trash">' + lang.lProfilePhotoDeleteBtn + '</li>' +
        '</ul>\
</div>\
</div> ';
      $(".settings-dating .photos-wrapper .fs-upload-target").before(imgTemplate);

      $uploadPhotoArea.find(".single-photo").last().animate({
        height: 90,
        opacity: 1
      }, 200);
    });

    // dropzone
    var dragImgTimer;
    $("body, .settings-dating .photos-wrapper").on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
    }).on('dragover dragenter', function () {
      clearTimeout(dragImgTimer);
      $uploadPhotoArea.addClass('is-dragover');
    }).on('dragleave dragend drop', function () {
      dragImgTimer = setTimeout(function () {
        $uploadPhotoArea.removeClass('is-dragover')
      }, 200)
    });

    // УДАЛИТЬ ИЗОБРАЖЕНИЕ
    $content.on("click", ".to-trash", function () {
      self.socket.emit('deleteUserImage', {
        "hash": user.hash,
        "image": $(this).parents(".single-photo").find(".profile-img").attr("src")
      });
      return false;
    });

    self.socket.off("deleteUserImage").on('deleteUserImage', function (data) {
      $(".settings-dating .photos-wrapper img[src='" + data.image + "']").parent().animate({
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

    function cropevent(c) {
      if (parseInt(c.w) > 0) {
        if (c.x < 0) jcropX = 0; else jcropX = Math.floor(c.x);
        if (c.y < 0) jcropY = 0; else jcropY = Math.floor(c.y);
        if (c.x2 < 0) jcropX2 = 0; else jcropX2 = Math.floor(c.x2);
        if (c.y2 < 0) jcropY2 = 0; else jcropY2 = Math.floor(c.y2);
      }
    }

    var $cropBody = $("#cropBody");
    var cropImgSrc = '';
    $content.on("click", ".to-main", function (e) {
      var $target = $(this).parents(".single-photo").find(".profile-img");
      cropImgSrc = $target.attr("src");
      if (!$target.parent().hasClass("add-photo")) {
        $cropBody.find("img").attr("src", cropImgSrc);
        showFlipModal(".flipper.avatar-crop-flip");

        jcropApi = $.Jcrop($cropBody.find("img"), {
          bgColor: 'white',
          bgOpacity: 0.3,
          aspectRatio: 1,
          minSize: [300, 300],
          setSelect: [0, 0, 300, 300],
          onChange: cropevent,
          onSelect: cropevent
        });
        $(".modal-keeper").one("click", ".page-shadow-hover, .form-close.clickable, .crop-image-save", function () {
          $cropBody.prepend('<img src="' + cropImgSrc + '" alt="image" class="crop-image">');
          jcropApi.destroy();
          hideFlipModal(".flipper.avatar-crop-flip");
        });
      }
    });

    $(".modal-keeper").on("click", ".crop-image-save", function () {
      self.socket.emit('cropUserImage', {
        "hash": user.hash,
        "path": $cropBody.find(".crop-image").attr("src"),
        "x": jcropX,
        "y": jcropY,
        "width": (jcropX2 - jcropX),
        "height": (jcropY2 - jcropY)
      });
      return false;
    });

    self.socket.off("cropUserImage").on('cropUserImage', function (data) {
      $("#authorized-user .user-avatar img").attr("src", data.image + "?" + (new Date()).getTime());
      $(".settings-dating .userPhoto.allowed").removeClass("not");
      self.user.userPhoto = data.image;
      self.checkConditions();
    });

    $(".settings-dating .chosen-select-birthday, .settings-dating .chosen-select-birthmonth, .settings-dating .chosen-select-birthyear").change(function () {
      var day = $(".settings-dating .chosen-select-birthday").val();
      var month = $(".settings-dating .chosen-select-birthmonth").val();
      var year = $(".settings-dating .chosen-select-birthyear").val();

      $(".settings-profile [name=birthDay]").val(day).trigger("chosen:updated");
      $(".settings-profile [name=birthMonth]").val(month).trigger("chosen:updated");
      $(".settings-profile [name=birthYear]").val(year).trigger("chosen:updated");

      if (day && month && year)
        $(".settings-dating .userBdate.allowed").removeClass("not");
      else
        $(".settings-dating .userBdate.allowed").addClass("not");

      self.user.userBdate = [day, month, year];

      self.updateDatingShow = true;

      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": "userBdate",
        "value": ((day && month && year) ? year + "-" + month + "-" + day : "0000-00-00")
      });
    });

    $("[name=userResidenceId], [name=userGenderId]").change(function () {
      var key = $(this).attr("name");
      var val = $(this).val();
      self.user[key] = val;

      $(".settings-profile [name=" + key + "]").val(val).trigger("chosen:updated");

      if (val > 0)
        $(".settings-dating ." + key + ".allowed").removeClass("not");
      else
        $(".settings-dating ." + key + ".allowed").addClass("not");

      self.updateDatingShow = true;

      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": key,
        "value": val
      });
    });

    self.socket.off("updateUserParam").on('updateUserParam', function (data) {
      setTimeout(function () {
        if (self.updateDatingShow)
          self.checkConditions();

        if (data.success) {
          showNotify("success", lang.lSetSaved);
        } else {
          showNotify("danger", (data.text) ? data.text : lang.lSetSaveErr);
        }
      }, 100);
    });

    /*** User status changing functions END***/
    if (!Array.prototype.includes) {
      Array.prototype.includes = function (searchElement /*, fromIndex*/) {
        'use strict';
        var O = Object(this);
        var len = parseInt(O.length, 10) || 0;
        if (len === 0) {
          return false;
        }
        var n = parseInt(arguments[1], 10) || 0;
        var k;
        if (n >= 0) {
          k = n;
        } else {
          k = len + n;
          if (k < 0) {
            k = 0;
          }
        }
        var currentElement;
        while (k < len) {
          currentElement = O[k];
          if (searchElement === currentElement ||
            (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
            return true;
          }
          k++;
        }
        return false;
      };
    }
  },

  checkConditions () {
    var self = this;

    self.updateDatingShow = false;

    // get user info to update user.info obj
    setTimeout(function () {
      user.getUserInfo();
    }, 500);

    if (!self.user.userWantToDate || self.user.userPhoto == "/media/ava/guestAva.png" || !self.user.userBdate[0] || !self.user.userBdate[1] || !self.user.userBdate[2] || !self.user.userResidenceId || !self.user.userGenderId) {
      $(".settings-dating .settings-block-status").removeClass("allowed").text(lang.lSetNotAllowText);

      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": "userDatingShow",
        "value": 0
      });

      return false;
    }
    else {
      $(".settings-dating .settings-block-status").addClass("allowed").text(lang.lSetAllowText);

      self.socket.emit('updateUserParam', {
        "hash": user.hash,
        "key": "userDatingShow",
        "value": 1
      });

      return true;
    }
  },

  searchSettingsInit () {
    var self = this;

    self.search = (getCookie("search")) ? JSON.parse(getCookie("search")) : false;

    self.$ageFrom = $(".settings-dating .sliderdata-from");
    self.$ageTo = $(".settings-dating .sliderdata-to");
    self.$slider = $(".settings-dating #slider");

    self.$slider.slider({
      range: true,
      min: 18,
      max: 50,
      values: [((self.search) ? self.search.ageFrom : 18), ((self.search) ? self.search.ageTo : 50)],
      slide: function (event, ui) {
        self.$ageFrom.val(ui.values[0]);
        self.$ageTo.val(ui.values[1]);
      }
    });
    self.$ageFrom.val(self.$slider.slider("values", 0));
    self.$ageTo.val(self.$slider.slider("values", 1));

    if (self.search) {
      $(".settings-dating .partner-search input:checkbox").attr("checked", false);

      $(".settings-dating .partner-search .chosen-select-deselect").val(self.search.residence);

      if (self.search.gender == "" || self.search.gender == $(".settings-dating #findGirls").val())
        $(".settings-dating #findGirls").attr("checked", true);
      if (self.search.gender == "" || self.search.gender == $(".settings-dating #findBoys").val())
        $(".settings-dating #findBoys").attr("checked", true);
      if (self.search.online == 1)
        $(".settings-dating #findOnlineOnly").attr("checked", true);
    }

    // event
    self.$ageFrom.change(function () {
      var val1 = parseInt(self.$ageFrom.val());
      var val2 = parseInt(self.$ageTo.val());
      val1 = val1 < val2 ? val1 : val2;
      self.$slider.slider("values", 0, val1);
    });

    self.$ageTo.change(function () {
      var val1 = parseInt(self.$ageFrom.val());
      var val2 = parseInt(self.$ageTo.val());
      val2 = val2 > val1 ? val2 : val1;
      self.$slider.slider("values", 1, val2);
    });

    $(".settings-dating .search-button").click(function () {
      var err = false;

      var residence = $(".settings-dating .partner-search .chosen-select-deselect").val();
      var gender = "";

      if (!residence)
        err = lang.lDatingErrCity;
      else {
        var gender1 = $(".settings-dating #findGirls:checked").val();
        var gender2 = $(".settings-dating #findBoys:checked").val();

        if (!gender1 && !gender2)
          err = lang.lDatingErrGender;
        else if (gender1 && !gender2)
          gender = gender1;
        else if (gender2 && !gender1)
          gender = gender2;
      }

      if (err)
        alert(err);
      else {
        self.search = {
          ageFrom: self.$ageFrom.val(),
          ageTo: self.$ageTo.val(),
          online: $(".settings-dating #findOnlineOnly:checked").length,
          gender: gender,
          residence: residence,
          offset: 0,
          hash: user.hash
        }

        setCookie("search", JSON.stringify(self.search), {"path": "/", "expires": 31536000});

        urlHash.pushState({page: "dating"});
      }
    });
  },

  /** STICKERS BLOCK **/
  stickersSettingsInit () {
    stickersAndEmoji.allStickersInit({hash: user.hash});
    this.stickersHandlersInit();
  },

  stickersHandlersInit() {
    var self = this;

    // jQuery sortable init
    $("#user-stickers").sortable({
      revert: "true",
      delay: 100,
      tolerance: "pointer",
      update: function (event, ui) {
        if ($('.sticker-place[data-pack-id]').length > 2) {
          var newFavoriteArr = [];
          $(".sticker-place:lt(5)", "#user-stickers").each(function () {
            newFavoriteArr.push(+$(this).attr("data-pack-id"));
          });
          stickersAndEmoji.favoritePacks = newFavoriteArr;
          stickersAndEmoji.updateFavoriteStickerPacks();
          showNotify("success", lang.lSetSaved);
        }
      }
    });

    // show all stickers in pack in modal window
    $(document).on("click", ".bottom-add", function () {
      var packId = $(this).closest('.preview-place').attr('data-pack-id');
      var packName = $(this).closest('.preview-place').attr('data-pack-name');
      var stickersArr = stickersAndEmoji.allStickers[packId].stickers;
      var allStickersHtml = '';

      for (var counter = 0; counter < stickersArr.length; counter++) {
        var stickerImg =
          '<figure class="sticker send-smile">\
             <img src="https://emosmile.com' + stickersArr[counter].stickerImg + '" alt="sticker">\
					 </figure>';

        allStickersHtml += stickerImg;
      }

      $('.sticker-container', '#stickerPreview').html(allStickersHtml);
      $('.sticker-preview-title', '#stickerPreview').html(packName);
      $('.sticker-preview-amount', '#stickerPreview').html(counter + lang.lSetStickersTitle);
      showFlipModal('.flipper.sticker-preview-flip');
    });

    // Insert stickers to user sticker'slist from all stickers list
    $(document).on("click", '#stickers-list .img-holder', function (e) {
      var packId = $(this).closest('.preview-place').attr('data-pack-id');
      var packName = $(this).closest('.preview-place').attr('data-pack-name');

      // if sticker already in user's list - exit
      if ($('.sticker-place[data-pack-id="' + packId + '"]', '#user-stickers').length > 0) {
        return;
      }

      var $emptyWindow = $(".sticker-place.empty", "#user-stickers ");
      var stickerLogoSrc = $(this).find('img').attr('src');
      var stickerTemplate =
        '<div class="top-add">' +
        '<div class="sticker-choose-title">' + packName + '</div>' +
        '</div>' +
        '<div class="img-holder">' +
        '<img src="' + stickerLogoSrc + '" data-pack-id="' + packId + '" alt="sticker">' +
        '</div>' +
        '<div class="remove-sticker-pack">' + svg.closeSticker +
        '</div>' +
        '<div class="bottom-add">' +
        '<div class="sticker-choose-title">' + lang.lStickPackPreview + '</div>' +
        '</div>';

      // if empty window in user's list exist, insert into it chosen station
      if ($emptyWindow.length > 0) {
        $emptyWindow.first().html(stickerTemplate).removeClass("empty").attr('data-pack-id', packId);
        stickersAndEmoji.addStickerPackToFavorite(packId);
        return;
      } else {
        // if all window in user's list not empty, insert it in latest position
        $(".sticker-place", "#user-stickers").last().find('.remove-sticker-pack').click();

        // add clicked station to favorites and user radio lists
        setTimeout(function () {
          $('.preview-place[data-pack-id="' + packId + '"] .img-holder', '#stickers-list').click();
        }, 50);
        return;
      }

      showNotify("success", lang.lSetSaved);
    });

    // Remove sticker in user stickers
    $(document).on("click", '#user-stickers .remove-sticker-pack', function (event) {
      event.preventDefault();
      var $box = $(this).closest('.sticker-place');
      var packId = $box.attr('data-pack-id');

      $(this).closest('.sticker-place').empty().addClass('empty').removeAttr('data-pack-id');
      stickersAndEmoji.removePackFromFavorite(+packId);
      showNotify("success", lang.lSetSaved);
    });
  },
  /** RADIO BLOCK **/
  radioSettingsInit () {
    var self = this;

    function initRadioSettings() {
      self.insertRadioList(); // insert all radio stations in menu
      self.insertUserStations();
      self.initRadioHandlers(); // init event handlers (e.g. click)
      // self.initRadioSocketHandlers(); // init socket handlers (dataSocket.on)
      self.radioListSortable(); // make radio menu sortable with JQuery UI

      //show promo video after stations load
      $(".promo-radio").css("opacity", 1);
      $(".radio-loading-container").css("display", "none");
    }

    // wait until radio data will be load into the page
    var checkForRadioData = setInterval(function () {
      // if radioData object is not empty
      if (!$.isEmptyObject(radio.radioData)) {
        clearInterval(checkForRadioData);
        initRadioSettings();
      }
    }, 100);
  },

  /** Insert all radio stations **/
  insertRadioList () {
    var self = this;
    var allRadioHtml = '';

    for (var item in radio.radioData) {
      var active = '';
      var station = radio.radioData[item];

      // active class for stations which in favorites
      if (radio.favoriteChannels.includes('' + station.radioId)) {
        active = 'active';
      }

      var stationHtml =
        '<div class="preview-place ' + active + '" data-radio-id="' + station.radioId + '" data-station-name="' + station.radioTitle + '">\
				   <div class="img-holder">\
				     <span class="station-logo">\
				       ' + station.radioLogo + '\
				     </span>\
				     <div class="station-name">' + station.radioTitle + '</div>\
				     <div class="add-hover">\
				         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">\
				           <path fill="#fff" d="M2 2C-.7 4.8-.7 9.2 2 12c2.7 2.7 7.2 2.7 9.9 0s2.7-7.2 0-9.9C9.2-.7 4.8-.7 2 2m9.3 3.9V8H8v3.3H5.9V8H2.7V5.9H6V2.6h2.1v3.3h3.2z"></path>\
				         </svg>' +
        lang.lSetAdd +
        '</div>\
      </div>\
    </div>';

      allRadioHtml += stationHtml;
    }

    $('#radio-list').html(allRadioHtml);
  },

  insertUserStations (){
    var self = this;

    // insert user's stations from favorites
    radio.favoriteChannels.forEach(function (favoriteStation, i, arr) {
      radio.radioData.forEach(function (station, i, arr) {
        if (+station.radioId === +favoriteStation) {
          var $emptyWindow = $(".station-place.empty", "#user-radio");

          var stationTemplate =
            '<div class="img-holder">\
              ' + station.radioLogo + '\
						     <div class="station-name">' + station.radioTitle + '</div>\
						   </div>\
						   <div class="remove-station">\
						     <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14">\
						       <path fill="gray" d="M15 14h-3L7.6 8.3l-5 5.7H0l6-7L.2 0h3l4.4 5.6L12.2 0H15L9 7"></path>\
						     </svg>\
						   </div>';

          $emptyWindow.first().html(stationTemplate).removeClass("empty").attr('data-radio-id', +station.radioId);
        }
      });
    });
  },

  initRadioHandlers () {
    // Insert stations to user station's list from all radio list
    $("#radio-list").off('click', '.preview-place').on('click', '.preview-place', function (e) {
      var stationId = $(this).attr('data-radio-id');
      var stationName = $(this).attr('data-station-name');

      // if station already in user's list - exit
      if ($('.station-place[data-radio-id="' + stationId + '"]', '#user-radio').length > 0) {
        return;
      }

      var $emptyWindow = $(".station-place.empty", "#user-radio ");
      var stationLogo = $(this).find('.station-logo').html();

      var stationTemplate =
        '<div class="station-place">\
           <div class="img-holder">\
             ' + stationLogo + '\
				     <div class="station-name">' + stationName + '</div>\
				   </div>\
				   <div class="remove-station">\
				     <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14">\
				       <path fill="gray" d="M15 14h-3L7.6 8.3l-5 5.7H0l6-7L.2 0h3l4.4 5.6L12.2 0H15L9 7"></path>\
				     </svg>\
				   </div>\
				 </div>';

      // if empty window in user's list exist, insert into it chosen station
      if ($emptyWindow.length > 0) {
        $emptyWindow.first().html(stationTemplate).removeClass("empty").attr('data-radio-id', stationId);
        radio.addChannelToFavorite(stationId);
      } else {
        // if all window in user's list full, insert it in latest position
        $(".station-place", "#user-radio").last().find('.remove-station').click();

        // add clicked station to favorites and user radio lists
        setTimeout(function () {
          $('.preview-place[data-station-id="' + stationId + '"]', '#radio-list').click();
        }, 50);
      }

      showNotify("success", lang.lSetSaved);
    });

    // Close radio in user's bar
    $("#user-radio").off('click', '.remove-station').on('click', '.remove-station', function (event) {
      event.preventDefault();
      var $box = $(this).closest('.station-place');
      var stationId = $box.attr('data-radio-id');

      $(this).closest('.station-place').empty().addClass('empty').removeAttr('data-radio-id');
      radio.removeChannelFromFavorite(stationId);
      showNotify("success", lang.lSetSaved);
    });
  },

  /** Init jQuery sortable for radio**/
  radioListSortable (){
    // jQuery sortable init
    $("#user-radio").sortable({
      revert: "true",
      delay: 100,
      tolerance: "pointer",
      update: function (event, ui) {
        if ($('.station-place[data-radio-id]', '#user-radio').length > 2) {
          var newFavoriteArr = [];
          $(".station-place:lt(5)", "#user-radio").each(function () {
            newFavoriteArr.push(+$(this).attr("data-radio-id"));
          });
          radio.favoriteChannels = newFavoriteArr;
          radio.updateFavoriteChannels();
          showNotify("success", lang.lSetSaved);
        }
      }
    });
  },

  socialSettingsInit(){
    var self = this;

    self.socket.emit('checkSocialKeys', JSON.stringify({hash: user.hash, keysList: ['all']}));
    self.socket.off('checkSocialKeys').on('checkSocialKeys', function (data) {
      data = JSON.parse(data);

      if (data.status.instagram === 'error') {
        $('.insta-login').each(function () {
          $(this).attr('data-show-modal', true);
        });
      } else {
        $('.insta-login').each(function () {
          $(this)[0].removeAttribute('data-show-modal');
        });

        $('.inst-share').removeClass('no-active');
      }

      var checkActions = {
        'facebook': 'fb',
        'twitter': 'twitter',
        'instagram': 'insta',
        'googleplus': 'gplus'
      };
      for (var i in data.status) {
        if (data.status[i] === 'success') {
          $(".settings-soc-buttons .settings-soc-btn." + checkActions[i]).addClass("active").find("span").text("Вийти");
        }
      }
    });

    $(".settings-soc-buttons .settings-soc-btn").each(function () {
      var socTitle = $(this).attr('data-name');
      $(this).off("click").on("click", function () {
        if ($(this).hasClass("active")) {
          $(this).removeClass("active").find("span").text("Увійти");
          self.socket.emit('clearSocialKeys', JSON.stringify({hash: user.hash, keysList: [socTitle]}));
        } else {
          if (socTitle === 'instagram') {
            openPromotionPopup("pages/instagram-login.html", "Instagram");
          } else {
            $(this).addClass("active").find("span").text("Вийти");
            window.location.href = '/auth/' + socTitle;
          }
        }
      });
      self.socket.off('clearSocialKeys').on('clearSocialKeys', function (data) {
        data = JSON.parse(data);
        for (var i in data.status) {
          if (data.status[i] === 'success') {
            showNotify("success", 'Logout from' + i.capitalize());
          } else if (data.status[i] === 'error') {
            showNotify("danger", 'Error during logout from' + i.capitalize());
          }
        }
      });
    });

    self.socket.off('checkInstagramLoginData').on('checkInstagramLoginData', function (data) {
      data = JSON.parse(data);
      if (data.message === "finalized") {
        $(".settings-soc-buttons .settings-soc-btn.insta").addClass("active").find("span").text("Вийти");
        showNotify("success", 'Loged into Instagram');

        $('.insta-login').each(function () {
          $(this)[0].removeAttribute('data-show-modal');
        });
        $('.inst-share').removeClass('no-active');
      }
    });

    $(".social-profile-number").inputmask("+38 (099) 999-99-99");


    self.socket.emit('getSocialContacts', JSON.stringify({hash: user.hash}));
    self.socket.off('getSocialContacts').on('getSocialContacts', function (data) {
      data = JSON.parse(data);
      if (+data.hasTelegram === 1) {
        $("#hasTelegram").attr("checked", true);
      }
      if (+data.hasViber === 1) {
        $("#hasViber").attr("checked", true);
      }
      if (+data.hasWhatsapp === 1) {
        $("#hasWhatsapp").attr("checked", true);
      }
      $("input.social-profile-link").add("input.social-profile-number").add("input.social-profile-mail").each(function () {
        var inputName = $(this).data('link');
        if (data[inputName] !== null) {
          $(this).val(data[inputName])
        }
      })
    });

    self.socket.off('updateUserSocialContacts').on('updateUserSocialContacts', function (data) {
      data = JSON.parse(data);
      if (data.message === "success") {
        showNotify("success", lang.lSetSaved);
      }
    });

    var timeoutSocInput = false;
    $(".settings-soc input.social-profile-link, .settings-soc input.social-profile-number, .settings-soc input.social-profile-mail").keyup(function () {
      clearTimeout(timeoutSocInput);

      timeoutSocInput = setTimeout((function (input) {
        return function () {
          self.socket.emit('updateUserSocialContacts', JSON.stringify({
            "hash": user.hash,
            "key": $(input).data("link"),
            "value": $(input).val()
          }));
        }
      }(this)), 1000);
    });

    $("#hasViber, #hasTelegram, #hasWhatsapp").click(function () {
      self.socket.emit('updateUserSocialContacts', JSON.stringify({
        "hash": user.hash,
        "key": $(this).attr("name"),
        "value": (($(this).is(':checked')) ? 1 : 0)
      }));
    });
  }
};
/*** OUTPUT PRMOMOTIONS VIDEO FROM YOUTUBE IFRAME ***/
var PromoMovie = function () {

};

/** html elements selectors**/
PromoMovie.prototype.previewBox = ".popup-video-mini";
PromoMovie.prototype.closePreviewBoxBtn = ".cr-min";
PromoMovie.prototype.closePreviewBoxTooltip = ".tolt";
PromoMovie.prototype.popupVideo = ".popup-video-large";
PromoMovie.prototype.overlay = ".b-g";
PromoMovie.prototype.popupVideoCloseBtn = ".cr-lg";

/** Init promo movie in collapsed state **/
PromoMovie.prototype.init = function () {
  var self = this;

  // detect if user opened video
  if (typeof urlHash.getState('promotions') !== 'undefined') {
    self.autoPlay();
  } else {
    // exit if user check to cancel show preview video
    if (getCookie("never-show-promo"))
      return;

    self.showPreview();
  }
};

/** Init promo movie for radio page **/
PromoMovie.prototype.Radioinit = function () {
  var self = this;

    // exit if user check to cancel show preview video
    if (getCookie("never-show-promo"))
      return;

    self.showRadioPreview();
};

PromoMovie.prototype.showRadioPreview = function () {
  var self = this;
  var promoRadio = ".promo-radio";
    // show tooltips
    fadeMenu($(self.popupVideoCloseBtn), $(self.closePreviewBoxTooltip));

    // hide video html container and all its elements if close button clicked
    $(self.popupVideoCloseBtn).on("click", function () {
      $(promoRadio).hide(200);
      setTimeout(function () {
        $(promoRadio).remove();
      }, 200);
    });
};

PromoMovie.prototype.showPreview = function () {
  var self = this;

  if ($(self.previewBox).length > 0) {
    //show mini-preview popup image for video
    $(self.previewBox).show(200);
    $(self.closePreviewBoxBtn).show(200);

    // show tooltips
    fadeMenu($(self.closePreviewBoxBtn), $(self.closePreviewBoxTooltip));

    // hide preview html container and all its elements if close preview button clicked
    $(self.previewBox).on("click", function () {
      self.autoPlay()
    });
    $(self.closePreviewBoxBtn).on("click", function () {
      self.hidePreviewBox()
    });
  }
};

/** Autoplay promo movie in state if specified page opened (e.g. root/promo-1) **/
PromoMovie.prototype.autoPlay = function () {
  var self = this;

  // start playing of video
  self.play();

  // hide youtube popup if user clicked on close popup button or overlay under video
  $(self.popupVideoCloseBtn).on("click", function () {
    self.close();
  });
  $(self.overlay).on("click", function () {
    self.close()
  });
};

/** Play video func**/
PromoMovie.prototype.hidePreviewBox = function () {
  var self = this;
  $(self.previewBox).off().hide(200);
  $(self.closePreviewBoxBtn).hide(200);
  $(self.closePreviewBoxTooltip).hide(200);

  var neverShowBool = $("#never-show-promo").prop("checked");

  // do not show promotions video for 1 year if user select this option
  if (neverShowBool) setCookie("never-show-promo", true, 31536000);
};

/** Play popup youtube video **/
PromoMovie.prototype.play = function () {
  var self = this;

  // hide all preview html elements
  self.hidePreviewBox();

  // Create large video popup(start playing)
  $(self.popupHtmlElem).insertAfter(self.previewBox);

  $(self.popupVideo).show(200); // Show large video popup
  $(self.overlay).show(200); // show dark overlay under video popup
};

/** Hide popup youtube video **/
PromoMovie.prototype.close = function () {
  var self = this;

  // remove page name from address line
  if (typeof urlHash.getState('promotions') !== 'undefined') {
    urlHash.removeState('promotions');
  }

  $(self.popupVideo).hide(200);
  $(self.overlay).hide();

  //Delete large video popup(stop playing)
  setTimeout(function () {
    $(self.popupVideo).remove();
    $(self.overlay).remove();
  }, 200);
};


// html for youtube movie
PromoMovie.prototype.popupHtmlElem =
  '<div class="popup-video-large">\
      <div class="wrapper-video">\
          <iframe class="popupframe" width="100%"\
          src="https://www.youtube.com/embed/WTmxHtPbkJo?rel=0&amp;controls=1&amp;showinfo=0&amp;autoplay=1" frameborder="0"\
          allowfullscreen></iframe>\
      </div>\
      <div class="f-s cr-lg"></div>\
  </div>\
  <div class="b-g"></div>';

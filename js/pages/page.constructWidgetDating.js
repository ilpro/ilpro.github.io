/******* COMMENTS WIDGET CONSTRUCTOR **********/
var pageConstructWidgetDating = {
  socket: {},

  init: function (socket) {
    var self = this;
    self.socket = socket;

    $(document).off("#generate-banner-btn").on("click", "#generate-banner-btn", function (e) {
      e.preventDefault();

      if (!self.checkFields()) return;

      // get height value specified by user and handle value if it inside range
      var width = self.getWidthValue($("#widget-width").val());

      self.constructWidget(width);
    });
  },

  /** Checks if fields correctly filled **/
  checkFields: function () {
    var self = this;
    var domain = $("#client-domain").val();

    // check if user not login
    if (!getCookie('hash')) {
      alert(lang.lWComLoginNotify);
      return false;
    }

    // check domain field
    if (!self.validateDomainName(domain)) {
      $("#client-domain").focus();
      return false;
    }

    return true;
  },

  /** Validate domain name **/
  validateDomainName: function (domain) {
    // check if user correctly fill domain filed
    if (typeof domain == 'undefined' || domain.length <= 3) {
      alert(lang.lWComDomainNotify);
      return false;
    }
    else {
      return true;
    }
  },

  /*** Check specified by user width value if it inside widgetMinWidth and widgetMaxWidth range ***/
  getWidthValue: function (widthValue) {
    var self = this;
    var width = +widthValue;
    var minWidth = 250; // set min value for widget width (in pixels)
    var maxWidth = 1500; // set max value for widget width (in pixels)

    if (width < minWidth) {
      $("#widget-width").val(minWidth);
      return minWidth;
    }
    if (width > maxWidth) {
      $("#widget-width").val(maxWidth);
      return maxWidth;
    }

    return width;
  },

  /*** Create news widget string and display it at the page ***/
  constructWidget: function (width) {
    var self = this;
    var params = {}; // object with widget parameters

    params.hash = getCookie('hash');

    // Cut user's url to delete http:// and further pages
    params.domain = self.getDomainFromUrl($("#client-domain").val());

    // width x height
    params.size = width + 'x' + width * 1.67;

    // city
    params.city = $("#select-city option:selected").val();

    // insert into DB record that this user is admin of widget. Attach widget to user
    self.socket.emit('attachWidgetDating', JSON.stringify(params));

    // Insert generated string into textarea
    self.socket.off('widgetDatingId').on('widgetDatingId', function (data) {
      var response = JSON.parse(data);
      self.insertGeneratedWidgetCode(params, response);
    });
  },

  insertGeneratedWidgetCode: function (params, response){
    var code =
      '<script async src="https://widget.mediastealer.com/dating/datingLauncher.js"></script>' +
      '<div class="msCustomMedia" data-ms-custom-media-id="'+ response.bannerId +'"></div>';
    $('.generated-html').text(code); // insert code
    $('#banner-container').html(code); // insert banner example
  },


  /** Cut user's url to delete http:// and pages **/
  getDomainFromUrl: function (url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
      domain = url.split('/')[2];
    }
    else {
      domain = url.split('/')[0];
    }

    if (domain.indexOf("www.") > -1) {
      domain = domain.substring(4);
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
  },
};
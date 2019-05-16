/******* COMMENTS WIDGET CONSTRUCTOR **********/
var pageConstructWidgetNews = {
  socket: {},

  init: function (socket) {
    var self = this;
    self.socket = socket;

    $(document).off("#generate-news-widget-btn").on("click", "#generate-news-widget-btn", function (e) {
      e.preventDefault();

      if (!self.checkFields()) return;

      var widthValue = $("#widget-width").val();
      var heightValue = $("#widget-height").val();

      // get width and height value specified by user and handle value if it inside range
      var width = self.getWidthValue(widthValue);
      var height = self.getHeightValue(heightValue);

      self.constructWidget(width, height);
    });

    self.initHandlers();
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

  initHandlers: function () {
    var self = this;

    // change color of square
    $("#widget-color").on('keyup', function (event) {
      $("#color-square").css('background-color', '#' + $("#widget-color").val())
    });

    // disable/enable selected news
    $('#choose-news').on('change', 'input', function (event) {
      var newsFilter = $(this).attr('data-value');

      if ($(this).is(':checked')) {
        $('#select-news option[data-sort="' + newsFilter + '"]').removeAttr('disabled');
      } else {
        $('#select-news option[data-sort="' + newsFilter + '"]').attr('disabled', true);
      }
    })
  },

  /*** Check specified by user width value if it inside widgetMinWidth and widgetMaxWidth range ***/
  getWidthValue: function (widthValue) {
    var self = this;
    var width = +widthValue;
    var minWidth = 260; // set min value for widget width (in pixels)
    var maxWidth = 1500; // set max value for widget width (in pixels)

    if (width === 0) {
      return '100%';
    }
    if (width < minWidth) {
      $("#widget-width").val(minWidth);
      return minWidth + 'px';
    }
    if (width > maxWidth) {
      $("#widget-width").val(maxWidth);
      return maxWidth + 'px';
    }

    return width + 'px';
  },

  /*** Check specified by user height value if it inside min/max range ***/
  getHeightValue: function (heightValue) {
    var self = this;
    var height = +heightValue;
    var minHeight = 400; // set min value for widget height (in pixels)
    var maxHeight = 1600; // set max value for widget height (in pixels)

    if (height < minHeight) {
      $("#widget-width").val(minHeight);
      return minHeight + 'px';
    }
    if (height > maxHeight) {
      $("#widget-width").val(maxHeight);
      return maxHeight + 'px';
    }

    return height + 'px';
  },

  /*** Create news widget string and display it at the page ***/
  constructWidget: function (width, height) {
    var self = this;
    var params = {}; // object with widget parameters

    // Cut user's url to delete http:// and further pages
    var domain = self.getDomainFromUrl($("#client-domain").val());

    // parent container ID
    params.containerId = 'msNewsContainer';

    // news settings
    $("#news-new").is(':checked') ? params.newsTime = true : params.newsTime = false;
    $("#news-popular").is(':checked') ? params.newsVisits = true : params.newsVisits = false;
    $("#news-viewed").is(':checked') ? params.newsOnline = true : params.newsOnline = false;
    $("#news-discussed").is(':checked') ? params.newsLikes = true : params.newsLikes = false;
    params.newsSelected = $("#select-news option:selected").val();

    // html element style parameters
    params.width = width;
    params.height = height;

    // inner widget parameters
    params.language = $("input[name='language']:checked", ".input-language").attr('id');
    params.bgColor = $("input[name='color']", ".input-text").val();
    params.logo = $("input[name='logoColor']:checked", ".input-logo-color").attr('data-logo-color');

    // insert into DB record that this user is admin of widget. Attach widget to user
    self.attachWidget(domain); // request: attachWidget, response: widgetId

    // Insert generated string into textarea
    self.socket.off('widgetId').on('widgetId', function (data) {
      self.insertGeneratedWidgetCode(params, data);
      self.showWidgetOnPage(params)
    });
  },

  insertGeneratedWidgetCode: function (params, data){
    var response = JSON.parse(data);
    var userId = response['userId'];

    var newsWidgetCode =
      '<div id="' + params.containerId + '"></div>' +
      '<script src="https://widget.mediastealer.com/news/newsLauncher.js"></script>' +
      '<script>newsLauncher({container:"' + params.containerId + '", width:"' + params.width + '", height:"' + params.height + '", userId:' + userId + ', lang:"' + params.language + '", bgColor: "' + params.bgColor + '", logo:"' + params.logo + '", newsTime:' + params.newsTime + ', newsVisits:' + params.newsVisits + ', newsOnline:' + params.newsOnline + ', newsLikes:"' + params.newsLikes + '", newsSelected:"'+ params.newsSelected +'"})</script>';

    $('#widget-container, .generated-html').empty(); // clear box with widget example
    $(".generated-html").text(newsWidgetCode); // insert
  },


  showWidgetOnPage: function (params){
    var iframeString =
      '<iframe id="mediastealerNews" src="https://widget.mediastealer.com/news/index.html#lang=' +
      params.language +
      '&bgColor=' + params.bgColor +
      '&logo=' + params.logo +
      (!!params.newsTime ? '&newsTime=' + params.newsTime : '') +
      (!!params.newsVisits ? '&newsVisits=' + params.newsVisits : '') +
      (!!params.newsOnline ? '&newsOnline=' + params.newsOnline : '') +
      (!!params.newsLikes ? '&newsLikes=' + params.newsLikes : '') +
      '&newsSelected=' + params.newsSelected + '"' +
      ' style="width: '+ params.width +'; height:'+ params.height +';border: none;box-shadow: rgba(26, 23, 27, 0.298039) 0 1px 10px;"></iframe>';

    $("#widget-container").html(iframeString);
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

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
  },

  /** Attach widget to user. Request: attachWidget, response: widgetId **/
  attachWidget: function (domain) {
    var self = this;
    var hash = getCookie('hash');

    var sendData = {
      hash: hash,
      domain: domain,
      widget: 'news'
    };

    self.socket.emit('attachWidget', JSON.stringify(sendData));
  }
};
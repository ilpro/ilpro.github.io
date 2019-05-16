/******* COMMENTS WIDGET CONSTRUCTOR **********/
const pageConstructWidgetComments = {
  socket: {},

  init: function (socket) {
    var self = this;

    self.socket = socket;

    $(document).off("#generate-news-widget-btn").on("click", "#generate-comments-widget-btn", function (e) {
      e.preventDefault();

      if (!self.checkFields()) return;

      var widthValue = $("#widget-width").val();

      // get width value specified by user and handle value if it inside widgetMinWidth and widgetMaxWidth range
      var width = self.getWidthValue(widthValue);

      $('#widget-container, .generated-html').empty(); // clear box with widget example

      self.construct(width);
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
    var width = widthValue;
    var minWidth = 300; // You can set min value for widget width (in pixels)
    var maxWidth = 1500; //You can set max value for widget width (in pixels)

    if (+width === 0) {
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

    return +width + 'px';
  },

  /*** Create comments widget string and display it at the page ***/
  construct: function (width) {
    var self = this;

    // get parameters, which will be passed into function
    var smilesModule = $("#smilebox-field").is(':checked') ? true : false;
    var commentsModule = $("#comments-field").is(':checked') ? true : false;
    var language = $("input[name='language']:checked", ".input-language").attr('id');
    var domain = self.getDomainFromUrl(); // Cut user's url to delete http:// and further pages

    // combine css styles and return as a string
    var border = self.getBorderStyles();
    var css = 'width: ' + width + ';' + border;

    // insert into DB record that this user is admin of widget. Attach widget to user
    self.attachWidget(domain); // request: attachWidget, response: widgetId


    // Insert generated string into textarea
    self.socket.off('widgetId').on('widgetId', function (data) {
      var response = JSON.parse(data);
      var userId = response['userId'];
      var commentsContainer = 'msCommentsContainer';

      var generatedIframeString =
        '<div id="' + commentsContainer + '"></div>' +
        '<script src="https://widget.mediastealer.com/comments/commentsLauncher.js"></script>' +
        '<script>commentsLauncher({container: "' + commentsContainer + '",css: "'+ css +'",userId: ' + userId + ',lang: "' + language + '",smiles: ' + smilesModule + ',comments: ' + commentsModule + '})</script>';

      $(".generated-html").text(generatedIframeString);
      //$('#widget-instructions').show();
    });

    self.showWidget(css);
  },

  /** Show widget on mediastealer page **/
  showWidget: function (css) {
    var self = this;
    // get parameters, which will be passed through iframe url
    var smilesModule = '';
    var commentsModule = '';
    var language = $("input[name='language']:checked", ".input-language").attr('id');
    if ($("#smilebox-field").is(':checked')) smilesModule = '&smiles=true';
    if ($("#comments-field").is(':checked')) commentsModule = '&comments=true';

    var htmlString =
      '<iframe id="commentsFrame" src="https://widget.mediastealer.com/comments/index.html#lang=' +
      language +
      smilesModule +
      commentsModule + '"' +
      ' style="'+ css +'"></iframe>' +
      '<script src="https://widget.mediastealer.com/comments/assets/js/iframe-resize/iframeResizer.min.js"></script>' +
      '<script>iFrameResize({log: false, autoResize: true, scrolling: false}, "#commentsFrame");</script>';

    var htmlMobileString =
      '<iframe id="commentsMobileFrame" src="https://widget.mediastealer.com/comments/index.html#lang=' +
      language +
      smilesModule +
      commentsModule + '"' +
      ' style="'+ css +'"></iframe>' +
      '<script src="https://widget.mediastealer.com/comments/assets/js/iframe-resize/iframeResizer.min.js"></script>' +
      '<script>iFrameResize({log: false, autoResize: true, scrolling: false}, "#commentsMobileFrame");</script>';

    $("#widget-container").html(htmlString);
    $("#widget-mobile-container").html(htmlMobileString);
  },

  /** Cut user's url to delete http:// and pages **/
  getDomainFromUrl: function () {
    var domain;
    var url = $("#client-domain").val();

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

  /** Get selected border styles **/
  getBorderStyles: function (){
    var selectedBorder = $("input[name='border']:checked", ".input-border").attr('id');
    var border;

    switch (selectedBorder){
      case 'shadow-border':
        border = 'border: none; box-shadow: rgba(26, 23, 27, 0.298039) 0 1px 10px;';
        break;
      case 'border-border':
        border = 'border: 1px solid #ddddde; box-shadow: none';
        break;
      default:
        border = 'border: none; box-shadow: none';
    }

    return border;
  },

  /** Attach widget to user. Request: attachWidget, response: widgetId **/
  attachWidget: function (domain) {
    var self = this;
    var hash = getCookie('hash');

    var sendData = {
      hash: hash,
      domain: domain,
      widget: 'comments'
    };

    self.socket.emit('attachWidget', JSON.stringify(sendData));
  }
};
'use strict';

/** Hide element if click was not on this element **/
function hideElemByClickOnBody(elem, cssClassToRemove) {

  setTimeout(function () {
    document.addEventListener("click", function hideElem(e) {
      if (!e.target.closest(elem)) {
        document.removeEventListener('click', hideElem);

        if (cssClassToRemove) {
          document.querySelector(elem).classList.remove(cssClassToRemove)
        } else {
          document.querySelector(elem).style.display = 'none';
        }
      } else {
        hideElemByClickOnBody(elem, cssClassToRemove);
      }
    });
  }, 50);
}


/***** FADE MENU IN WITH TIMINGS & ANIMATIONS  ****/
function fadeMenu(hoverButton, fadeMenu) {
  var tim;
  hoverButton.mouseenter(function () {
    clearTimeout(tim);
    fadeMenu.fadeIn(50);
    hoverButton.addClass("hovered");
  });
  hoverButton.mouseleave(function () {
    tim = setTimeout(function () {
      fadeMenu.fadeOut(50);
      hoverButton.removeClass("hovered");
    }, 100);
  });
  fadeMenu.mouseenter(function () {
    clearTimeout(tim);
  });
  fadeMenu.mouseleave(function () {
    tim = setTimeout(function () {
      fadeMenu.fadeOut(50);
      hoverButton.removeClass("hovered");
    }, 100);
  });
}

/** MOVE CURSOR TO THE END OF THE CARET **/
function cursorToTheEnd(htmlElement) {
  var range, selection;

  range = document.createRange();//Create a range (a range is a like the selection but invisible)
  range.selectNodeContents(htmlElement);//Select the entire contents of the element with the range
  range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
  selection = window.getSelection();//get the selection object (allows you to change selection)
  selection.removeAllRanges();//remove any selections already made
  selection.addRange(range);//make the range you have just created the visible selection
}

function socLogin(token) {
  auth.socLogin(token);
}

function showNotify(functionState, messageText) {
  var notify = $.notify({
    // options
  }, {
      // settings
      element: 'body',
      position: null,
      allow_dismiss: false,
      newest_on_top: false,
      showProgressbar: false,
      placement: {
        from: "bottom",
        align: "right"
      },
      offset: {
        x: 10,
        y: 10
      },
      spacing: 5,
      z_index: 1031,
      delay: 5000,
      timer: 1000,
      mouse_over: null,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutDown'
      },
      onShow: null,
      onShown: null,
      onClose: null,
      onClosed: null,
      template: '<div data-notify="container" class="alert alert-{0}" role="alert">' +
        '<span data-notify="message">{2}</span>' +
        '</div>'
    });
  notify.update({
    type: functionState,
    message: messageText
  })
};

function formatDate(date) {
  var newsDate = new Date(date),
    todayDate = new Date();
  var day1 = newsDate.getDate(),
    day2 = todayDate.getDate();
  var month1 = newsDate.getMonth(),
    month2 = todayDate.getMonth();
  var month = parseInt(newsDate.getMonth()) + 1;
  var day = parseInt(newsDate.getDate());
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  var dayFull = (day1 == day2 && month1 == month2) ? "Сегодня" : day + "." + month + "." + newsDate.getFullYear();
  var hours = parseInt(newsDate.getHours()) < 10 ? '0' + newsDate.getHours() : newsDate.getHours();
  var minute = parseInt(newsDate.getMinutes()) < 10 ? '0' + newsDate.getMinutes() : newsDate.getMinutes();
  var time = hours + ":" + minute;
  return { day: dayFull, time: time };
}

/*** Insert recommended news from cache ***/
function getNewsRecommended(socket) {
  // request for recommended news
  socket.emit('getCache', 'newsRecommended');

  // news recommended
  socket.off('newsRecommended').on('newsRecommended', function (data) {
    // data = JSON.parse(data);

    var recommendedNewsArr = JSON.parse(data);
    var $container = $('.recommended-news');

    if (recommendedNewsArr.length === 0) {
      return
    }

    $container.empty();

    recommendedNewsArr.forEach(function (item, i, arr) {
      var newsDate = formatDate(item.insertTime);
      var newsItem =
        '<section style="display: block;" class="recommended-news-box round-corners">\
         <div class="news-item">\
           <div class="date">\
             <div class="day">' + newsDate.day + '</div>\
           <i class="ico time-small-ico"></i>\
           <time class="time">' + newsDate.time + '</time>\
         </div>\
         <button class="btn comment-btn comments-no-msg float-left">\
           <i class="ico"></i>\
           <div class="tooltip round-corners box-shadow">' + lang.lNewsOpenComm + ' (<span class="comment-val">0</span>)</div>\
         </button>\
         <div class="donor float-left">\
           <img class="donor-icon" src="/media/feeds/' + item.urlFavicon + '" alt="">\
         </div>\
         <a class="article float-left" target="_blank" href="http://content.emoment.com/top/' + item.linkId + '" title="' + htmlEscape(item.urlTitle) + '" style="white-space: nowrap">\
           ' + item.urlTitle + '\
         </a>\
      </div>\
      </section>';

      $container.append(newsItem);
    });

    $container.show(); // display: block for container;
  });
};

/*** Replace All occurrences in string at one time**/
function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

function stringReplaceAll(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function htmlEscapeBack(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

//News load line update function
var progressFillTimer;
function progressFill(updateTime) {
  var progress = $("#news-load-timer .progress");
  var newProgress = progress.clone(true);
  progress.before(newProgress);
  $("." + progress.attr("class") + ":last").remove();
  $("." + progress.attr("class")).css("animation", "progressFill " + updateTime + "ms linear infinite");
}

function progressFillupdate(updateTime) {
  clearInterval(progressFillTimer);
  progressFill(updateTime);
  progressFillTimer = setInterval(function () {
    progressFill(updateTime);
  }, updateTime * 20)
}

/*** Attach detailed info to cursor ***/
//calculate & attach position
function attachDetailedInfo(e) {
  var $target = $(e.target).parents(".preview-tile").find(".other-info");
  var offset = $(e.target).parents(".preview-tile").offset();
  var wrapper = $(e.target).parents(".all-videos-container");
  var wrapperOffset = $(wrapper).offset();
  var targetHeight = $target.height();
  var windowHeight = window.innerHeight;
  var delta = 0;
  var beta = 20;
  var mouseOffset = 5;

  //prevent block from overflow cutting in header
  if (offset.left - wrapperOffset.left > 600) {
    delta = -200;
  }
  var left = e.pageX - offset.left + mouseOffset + delta;
  var top = e.pageY - offset.top + mouseOffset;

  if (e.pageY + targetHeight + mouseOffset + beta > windowHeight) {
    top = windowHeight - targetHeight - offset.top - beta;
  }

  $target.css({
    'left': left,
    'top': top
  });
}

//show detailed info & call attach mousemove
function showDetailedInfo(e) {
  var $target = $(e.target).parents(".preview-tile").find(".other-info");
  $target.show();
  $("body").on("mousemove", ".active-zone", attachDetailedInfo);
}


//hide detailed info & call detach mousemove
function hideDetailedInfo(e) {
  var $target = $(e.target).parents(".preview-tile").find(".other-info");
  $target.hide();
  $("body").off("mousemove", ".active-zone", attachDetailedInfo);
}
/*** Attach detailed info to cursor END***/


/*** RESIZE AVATAR ****/
function cutImg(img) {
  var $img = $(img);
  var height = $img.height();
  var width = $img.width();

  if (height > width) {
    $img.css("maxWidth", "100%");
  } else {
    $img.css("maxHeight", "100%");
  }
}

/***** DISABLE WINDOW SCROLL ON HOVER ****/
function disableWindowScroll(e, $container) {
  var scrollTo = null;

  if (e.type == 'mousewheel') {
    scrollTo = (e.originalEvent.wheelDelta * -1);
  }
  else if (e.type == 'DOMMouseScroll') {
    scrollTo = 40 * e.originalEvent.detail;
  }

  if (scrollTo) {
    e.preventDefault();
    $container.scrollTop(scrollTo + $container.scrollTop());
  }
}

/**** BOOKMARK PANE ****/
if (typeof urlHash.getState('bookmark') !== 'undefined') showBookmarkPane();

$(document).on('click', '.favour-wrap .close-cross', function (e) {
  $(".favour-wrap").hide();
  urlHash.removeState('bookmark')
});

function showBookmarkPane() {
  var $bookmarkPane = $('.favour-wrap');
  if ($bookmarkPane.length > 0) $bookmarkPane.show();

  $(document).keydown(function (e) {
    // ⌘ (91 - Webkit, 17 - Opera, 224 - Firefox)
    if (e.ctrlKey || e.keyCode == 91 || e.keyCode == 17 || e.keyCode == 224) {
      urlHash.removeState('bookmark');
      $bookmarkPane.hide();
    }
  });
}

/***Load Lazy Chat Stickers in messages  ***/
function msgStickresLazyLoad() {
  var $targetForLazy = $("img[data-src]");
  var linksListForLazy = [];
  var downloadingImage = [];

  $targetForLazy.each(function () {
    linksListForLazy.push($(this).attr("data-src"));
  });

  for (var i = 0; i < $targetForLazy.length; i++) {
    downloadingImage[i] = new Image();
    downloadingImage[i].src = linksListForLazy[i];

    downloadingImage[i].onload = function () {
      $targetForLazy[i].src = downloadingImage[i].src;
    }(i);
  }
  setTimeout(function () {
    $targetForLazy.each(function () {
      if ($(this).attr("data-src").length > 0) {
        $(this).attr("src", $(this).attr("data-src"))
      }
    });
  }, 10000)
}

/*** Trigger a callback when the selected images are loaded ***/
function onImgLoad(selector, callback) {
  $(selector).each(function () {
    if (this.complete || /*for IE 10-*/ $(this).height() > 0) {
      callback.apply(this);
    }
    else {
      $(this).on('load', function () {
        callback.apply(this);
      });
    }
  });
}

function checkAuth() {
  $(document).on('click', '.check-auth', function (e) {
    if (!user.hash) {
      e.preventDefault();
      $('#login').click();
    }
  })
}
checkAuth();

/** Cut domain from parent url ***/
function getDomainFromUrl(url) {
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
}

/** SMILE & EMOTIONS FLYING FUNCTIONS ***/

/*Emotions id*/
var e_id = 0;

/*Construct emotion function with variable start parameters top, left*/
function emotion(e_id, top, left, emoID) {

  left += Math.random() * 170;

  var svg3 = '';
  switch (emoID) {
    case "like":
      svg3 = '<svg id="emo-'
        + e_id +
        '" class="emo" ' +
        'style="top: '
        + top +
        'px; left:'
        + left +
        'px;" ' +
        'width="51" height="51" viewBox="0 0 41 41">' +
        '<path fill="#3894D1" d="M20.57 0C9.25-.03 0 9.17 0 20.47 0 31.75 9.16 40.97 20.43 41 31.75 ' +
        '41.03 41 31.84 41 20.53 41 9.25 31.84.03 20.57 0zM13.1 29.44c-.7 0-1.16-.02-1.85 ' +
        '0-.5.02-.84-.13-.84-.57v-8.5c0-.43.46-.57.96-.54.67.03 1.22 0 1.9 0 .64 0 .9.35.9 1l-.02 ' +
        '7.6c0 .7-.34 1-1.03 1zm17.2-5.07c.46.8.27 1.47-.45 2.02-.02 0-.04 ' +
        '0-.05.02-.32.25-.44.57-.4.98.02.28.06.57-.1.8-.5.75-1.1 1.33-2.02 1.5-1 .2-2 .13-2.98.13-1.3 ' +
        '0-2.6-.06-3.9-.24-1.3-.2-2.58-.5-3.88-.7-.33-.08-.38-.2-.38-.5v-5.2c0-.87.02-1.73 0-2.58 ' +
        '0-.27.05-.42.36-.38.3.03.54-.1.76-.28.25-.2.46-.43.64-.7.7-.93 1.2-1.97 1.6-3.06.3-.8.77-1.42 ' +
        '1.47-1.92.6-.44 1-1.06 1.2-1.77.32-.93.42-1.8.5-2.75 0-.22.05-.42.2-.42h.77c.04 0 ' +
        '.07-.07.1-.06.93.28 1.48.83 1.7 1.75.22 1 .13 1.98-.3 2.93-.24.53-.53 1.04-.77 ' +
        '1.58-.2.46-.4.9-.4 1.43 0 .3.08.42.42.4 1.5-.04 3.03-.08 4.56.06.53.04.96.23 ' +
        '1.3.64.2.26.38.52.53.8.27.5.27.92-.1 1.38-.5.62-.47.67-.08 1.33.53.9.55.9-.14 1.67-.35.37-.46.74-.2 1.17z">' +
        '</path>' +
        '</svg>';
      break;
    case "love":
      svg3 = '<svg id="emo-'
        + e_id +
        '" class="emo" ' +
        'style="top: '
        + top +
        'px; left:'
        + left +
        'px;" ' +
        'width="51" height="51" viewBox="0 0 51 51">' +
        '<path fill="#EF4653" d="M25.6 0C11.5-.04 0 11.4 0 25.46 0 39.5 11.4 50.96 25.4 51 39.5 ' +
        '51.03 51 39.6 51 25.54 51.02 11.5 39.6.04 25.6 0zm14.8 22.32c-.08 1.12-.23 2.2-.65 3.24-.67 ' +
        '1.7-1.58 3.2-2.75 4.57-1.3 1.53-2.76 2.88-4.3 4.17-2.33 1.96-4.73 3.8-7.13 5.66-.06.05-.1.05-.16 ' +
        '0-1.9-1.53-3.9-3.03-5.8-4.6-1.65-1.36-3.3-2.76-4.8-4.33-1.2-1.26-2.2-2.62-3-4.16-.7-1.3-1.2-2.64-1.32-4.1-.02-.2-.07-.43-.07-.64v-.7l.04-.15c.03-.5.1-.98.23-1.45.73-2.72 ' +
        '2.5-4.48 5.15-5.34 1.9-.7 3.8-.5 5.68.2 1.8.74 3.2 1.95 4.07 3.7 0 .03.03.06.07.06l.06-.1c.3-.63.7-1.2 ' +
        '1.2-1.7 1.32-1.4 2.95-2.23 4.85-2.5 1.9-.3 3.7.02 5.4 1.02 2 1.2 2.97 3 3.34 5.3">' +
        '</path>' +
        '</svg>';
      break;
    case "laugh":
      svg3 = '<svg id="emo-'
        + e_id +
        '" class="emo" ' +
        'style="top: '
        + top +
        'px; left:'
        + left +
        'px;" ' +
        'width="51" height="51" viewBox="0 0 41 41">' +
        '<path fill="#F6D65C" d="M.2 20.4C.2 9 9.4 0 20.8 0 32 0 41.2 9.2 41.2 20.5S32 41 20.6 41C9.4 ' +
        '41 .2 31.7.2 20.4z"></path>' +
        '<path fill="none" stroke="#3E3E40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" ' +
        'd="M8.6 13.7s4.4 0 6.4 1.3c-4.4.2-9.4.8-9.4.8m22.7-7s-3.4 1.3-5 4c4-2 8.8-3.5 8.8-3.5"></path>' +
        '<path fill="#3E3E40" d="M36 25c-1 4-4 8.3-11.2 10-7 1.6-11.8-.8-14.8-3.7-3.3-3.2-4.5-7-4.5-7s5-3 ' +
        '15-5.3c9.8-2.2 15.7-1.7 15.7-1.7s1 3.6-.2 7.7z"></path>' +
        '<path fill="#F05469" d="M36 25c-1 4-4 8.3-11.2 10-7 1.6-11.8-.8-14.8-3.7 2.5-3.3 6.6-6 11.6-7.4 5.4-1.7 10.6-1 14.4 1z"></path>' +
        '</svg>';
      break;
    case "shout":
      svg3 = '<svg id="emo-'
        + e_id +
        '" class="emo" ' +
        'style="top: '
        + top +
        'px; left:'
        + left +
        'px;" ' +
        'width="51" height="51" viewBox="0 0 41 41">' +
        '<path fill="#F6D65C" d="M20.6 41C9.2 41 0 31.8 0 20.5 0 9.3 9.2 0 20.4 0 31.7 0 41 9.2 41 20.5 ' +
        '41 31.7 31.8 41 20.6 41z"></path>' +
        '<path fill="none" stroke="#3E3E40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" ' +
        'd="M9.8 7.4c2.4-1 6.6-1.5 7.6 1.3m9.6.8c2.4-1 6.6-1.5 7.6 1.4"></path>' +
        '<ellipse transform="rotate(-77.52 17.78 28.933)" fill="#3E3E40" cx="17.8" cy="28.9" rx="5.8" ry="4"></ellipse>' +
        '<circle fill="#3E3E40" cx="13.1" cy="14.3" r="2.2"></circle>' +
        '<circle fill="#3E3E40" cx="29.3" cy="15.8" r="2.2"></circle>' +
        '</svg>';
      break;
    case "sad":
      svg3 = '<svg id="emo-'
        + e_id +
        '" class="emo" ' +
        'style="top: '
        + top +
        'px; left:'
        + left +
        'px;" ' +
        'width="51" height="51" viewBox="0 0 41 41">' +
        '<path fill="#F6D65C" d="M0 20.4C0 9.2 9.3 0 20.6 0 31.8 0 41 9.2 41 20.5S31.8 41 20.4 41C9.2 41 0 31.7 0 20.4z"></path>' +
        '<path fill="none" stroke="#3E3E40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M8.8 15.3l5.8-2m17.6 2l-5.8-2"></path>' +
        '<ellipse transform="rotate(171.115 13.517 21.07)" fill="#3E3E40" cx="13.5" cy="21.1" rx="1.9" ry="2.4"></ellipse>' +
        '<ellipse transform="rotate(8.885 27.985 21.068)" fill="#3E3E40" cx="28" cy="21.1" rx="1.9" ry="2.4"></ellipse>' +
        '<path fill="none" stroke="#3E3E40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M14.7 33.4c2-3.6 9.6-4 11.6 0"></path>' +
        '</svg>';
      break;
    case "angry":
      svg3 = '<svg id="emo-'
        + e_id +
        '" class="emo" ' +
        'style="top: '
        + top +
        'px; left:'
        + left +
        'px;" ' +
        'width="51" height="51" viewBox="0 0 41 41">' +
        '<path fill="#F6D65C" d="M40.8 17.8C39.5 7.8 30.8 0 20.6 0 10 0 1.6 7.8.2 17.8L0 20.4C0 31.7 9.2 ' +
        '41 20.4 41 31.8 41 41 31.8 41 20.5c0-1 0-1.8-.2-2.7z"></path>' +
        '<radialGradient id="a" cx="20.8" cy="-.3" r="34" gradientTransform="matrix(1 0 0 .6584 -.28 -.072)" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#F05469"></stop>' +
        '<stop offset="1" stop-color="#F05469" stop-opacity="0"></stop>' +
        '</radialGradient>' +
        '<path fill="url(#a)" d="M20.6 0C10 0 1.6 7.8.2 17.8c5.6 3 12.6 4.6 20.2 4.6 7.7 0 14.8-1.7 20.4-4.6C39.5 7.8 30.8 0 20.6 0z"></path>' +
        '<path fill="none" stroke="#3E3E40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M10 11l5.5 4M31 11l-5.5 4"></path>' +
        '<circle fill="#3E3E40" cx="13.7" cy="19.6" r="2.2"></circle>' +
        '<circle fill="#3E3E40" cx="28" cy="19.6" r="2.2"></circle>' +
        '<path fill="none" stroke="#3E3E40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M16.6 30.3h7.8"></path>' +
        '</svg>';
      break;
  }
  return svg3;
}//End emotion(e_id, top, left, emoID)

/*Insert constructed smiles/emotions into body function*/
function append_block(id, smileID) {

  var svg,
    /*** SMILE TARGET VARIABLE (APPEND TO THE AVATAR OF THE LAST COMMENT) ***/
    $singlePageCommentsButton = $(".smiles-tab"),
    singlePageCommentsButtonOffset = $singlePageCommentsButton.offset() ? $singlePageCommentsButton.offset() : '',
    svg3 = $singlePageCommentsButton ? emotion(id, singlePageCommentsButtonOffset.top, singlePageCommentsButtonOffset.left, smileID) : '';

  if (smileID == "like" || "love" || "laugh" || "shout" || "sad" || "angry") {
    svg = svg3;
  }

  $("body").append(svg);
}//End append_block(id,co)

/*Fly emotion function*/
function fireEmotion(emoID) {
  //chat container visibility variable
  var co = "none";
  //count each smile id ++
  e_id += 1;

  /*Insert smile*/
  append_block(e_id, emoID);

  var f = .3, h = .6, c = 3, p = 0, s = .5,
    a = "thru", r = 1, i = 80, n = 100,
    y = 50, o = 5, l = 5000, u = .25,
    d = 100, k = 0,


    //end y delta depend on chat state
    z = co == "none" ? 1.3 : .7;

  //Some calculations of end fly point
  var m = y * o + l * u;
  m = Math.min(m, l);
  m += Math.random() * d;
  var v = (Math.random() * s - s / 2) * 5,
    P = i / 2 - Math.random() * i + k,
    g = -(m / 2),
    T = n / 2 - Math.random() * n + p,
    _ = -m / z;

  var target = '#emo-' + e_id;

  //Smile appear animation
  TweenLite.to(target, f, { scaleY: h, scaleX: h, ease: Back.easeOut });

  //Smile flight animation
  TweenLite.to(target, c, {
    rotation: v + "rad",
    ease: Sine.easeIn,
    bezier: { type: a, curviness: r, autoRotate: !1, values: [{ x: P, y: g }, { x: T, y: _ }] },
    onComplete: function () {
      $(target).remove();
    }
  });
}//End Play()
/** EMOTIONS FLYING FUNCTIONS END***/

function AttachInfoToCursor(parameters) {
  var self = this;
  self.settings = {
    targetToAttach: 0,
    parentToLocalCord: 0,
    horizontalOverflowPrevent: 0,
    horizontalOverflowPreventParent: 0,
    horizontalOverflowPreventLeftDifference: 200,
    horizontalOverflowPreventIndent: 200,
    verticalOverflowPrevent: 0,
    verticalOverflowPreventTarget: 0,
    verticalOverflowPreventBottomIndent: 0,
    mouseOffsetX: 5,
    mouseOffsetY: 5,
    targetForHandlers: 0,
    onShowCallback: function (e, settings) {
      var $target = $(e.target).parents(settings.parentToLocalCord).find(settings.targetToAttach);
      $target.addClass("active");
    },
    onHideCallback: function (e, settings) {
      var $target = $(e.target).parents(settings.parentToLocalCord).find(settings.targetToAttach);
      $target.removeClass("active");
    }
  };

  parameters = typeof parameters !== 'undefined' ? parameters : 0;

  if (parameters === 0) {
    console.log("parameters error");
    return false
  }

  $.extend(true, self.settings, parameters);

  $("body")
    .on("mouseenter", self.settings.targetForHandlers, { settings: self.settings }, function (e) {
      var settings = e.data.settings;
      settings.onShowCallback(e, settings);
      $("body").on("mousemove", settings.targetForHandlers, { settings: settings }, self.attachUserInfoUni);
    })
    .on("mouseleave", self.settings.targetForHandlers, { settings: self.settings }, function (e) {
      var settings = e.data.settings;
      settings.onHideCallback(e, settings);
      $("body").off("mousemove", settings.targetForHandlers, { settings: settings }, self.attachUserInfoUni);
    });
}

/** Users online mouse info attachment **/
AttachInfoToCursor.prototype.attachUserInfoUni = function (e) {
  var settings = e.data.settings;
  var $target = $(e.target).parents(settings.parentToLocalCord).find(settings.targetToAttach);
  var offset = $(e.target).parents(settings.parentToLocalCord).offset();
  var wrapper = $(e.target).parents(settings.horizontalOverflowPreventParent);
  var wrapperOffset = $(wrapper).offset();
  var delta = 0;
  var mouseOffsetX = settings.mouseOffsetX;
  var mouseOffsetY = settings.mouseOffsetY;

  if (settings.verticalOverflowPrevent != 0) {
    var targetHeight = $target.height();
    var windowHeight = $(settings.verticalOverflowPreventTarget)[0].offsetHeight;
    var beta = settings.verticalOverflowPreventBottomIndent;
  }

  if (settings.horizontalOverflowPrevent != 0) {
    //prevent block from overflow cutting in header
    if (offset.left - wrapperOffset.left > settings.horizontalOverflowPreventLeftDifference) {
      delta = -settings.horizontalOverflowPreventIndent;
      mouseOffsetX = -mouseOffsetX;
    }
  }

  var left = e.pageX - offset.left + mouseOffsetX + delta;
  var top = e.pageY - offset.top + mouseOffsetY;

  if (settings.verticalOverflowPrevent != 0) {
    if (e.pageY - wrapperOffset.top + targetHeight + mouseOffsetY + beta > windowHeight) {
      top = windowHeight + wrapperOffset.top - targetHeight - offset.top - beta;
      left = left + mouseOffsetX;
    }
  }

  $target.css({
    'left': left,
    'top': top
  });
};

/*** Attach user info to cursor in modal gift***/
var tooltipUserModal = new AttachInfoToCursor({
  targetToAttach: '.other-info',
  parentToLocalCord: '.online-userbox',
  targetForHandlers: '.online-userbox .online-avatar img'
});


//открыть группу подарков
$(document).on("click", ".dropdown-heading", function () {
  var keyAttr = $(this).toggleClass("active").attr("data-heading");
  $('.dropdown-block[data-heading=' + keyAttr + ']').toggleClass("opened")
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
      if (k < 0) { k = 0; }
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

var windowObjectReference = null; // global variable
function openPromotionPopup(strUrl, strWindowName) {
  if (windowObjectReference == null || windowObjectReference.closed) {
    windowObjectReference = window.open(strUrl, strWindowName,
      "resizable,scrollbars=0,menubar=0,toolbar=0,personalbar=0,status=0,width=400,height=550,left=200,top=200");
  } else {
    windowObjectReference.focus();
  };
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function setTodayDate() {
  const daysOfWeek = ['Недiля', 'Понедiлок', 'Вiвторок', "Середа", "Четвер", "П'ятниця", "Субота"]
  const today = new Date();
  const day = daysOfWeek[today.getDay()];
  let month = today.getMonth();
  month = month.length === 2 ? month : '0' + month
  const date = `${today.getDate()}.${month}.${today.getFullYear()}`
  $('[data-filter="day"] .text-day').html(day)
  $('[data-filter="day"] .num-day').html(date)
}

const getRandomHash = () => ('?' + Math.random().toString(36).substring(7))
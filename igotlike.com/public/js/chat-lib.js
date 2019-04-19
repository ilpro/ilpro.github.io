// /**
//  * Created by Sasha on 05.01.2017.
//  */
// var startPoint = {};
// var nowPoint;
// var ldelay;
// var $wrapper = $(".sticker-pack-set-wrap");
// var startTransform;
// var startTransformValues = [];
// var startTransformX;
// var wrapperWidth;
// var rowWidth;
// var maxNegative;
// var otk = {};
// var clearTransition;
//
// /** Touchstart event
//  * detects start point parameters & full, visible wrapper widths *
//  **/
// $wrapper.on('touchstart', function (event) {
//   /*console.log ("touchstart");*/
//   event.preventDefault();
//   event.stopPropagation();
//
//   wrapperWidth = $wrapper[0].offsetWidth;
//   rowWidth = $wrapper.find(".sticker-pack-row")[0].scrollWidth;
//   startTransform = $wrapper.find(".sticker-pack-row").css("transform");
//   startTransformValues = startTransform.match(/-?\d+/g);
//   /*console.log(startTransform);
//    console.log(startTransformValues);
//    console.log(startTransformValues[4]);*/
//   startPoint.x = event.originalEvent.changedTouches[0].pageX;
//   startPoint.y = event.originalEvent.changedTouches[0].pageY;
//   ldelay = new Date();
// });
//
// /** Touchmoove event
//  * realtime detects finger touch point parameters & apply it to block *
//  **/
// $wrapper.on('touchmove', function (event) {
//   /*console.log ("touchmove");*/
//   event.preventDefault();
//   event.stopPropagation();
//
//   nowPoint = event.originalEvent.changedTouches[0];
//   startTransformX = +startTransformValues[4];
//   otk.x = nowPoint.pageX - startPoint.x + startTransformX;
//   /*console.log(otk.x);*/
//
//   $wrapper.find(".sticker-pack-row").css('transform', 'translate(' + otk.x + 'px, 0px ) translateZ(0)');
// });
//
// /** Touchend event
//  * 1-st part calculates overflows & animate block return into visible field *
//  * 2-nd detects fast swipe and move block(without overflows) *
//  **/
// $wrapper.on('touchend', function (event) {
//   /*console.log('touchend');*/
//
//   var pdelay = new Date();
//   nowPoint = event.originalEvent.changedTouches[0];
//   var xAbs = Math.abs(startPoint.x - nowPoint.pageX);
//   maxNegative = wrapperWidth - rowWidth;
//   /*console.log(otk.x);*/
//
//   if (otk.x > 0) {
//     /*console.log("left");*/
//     animateSwipe(0);
//   }
//
//   if (otk.x < maxNegative) {
//     /*console.log("right");*/
//     animateSwipe(maxNegative);
//   }
//
//   if ((xAbs > 20) && (pdelay.getTime() - ldelay.getTime()) < 200) {
//     /*console.log('fastSwipe');*/
//     var swipeEndPointCoordinate;
//
//     if (nowPoint.pageX < startPoint.x) {
//       /*console.log('left');*/
//
//       /*СВАЙП ВЛЕВО*/
//       if (startTransformX - 200 < maxNegative) {
//         swipeEndPointCoordinate = maxNegative;
//       } else {
//         swipeEndPointCoordinate = startTransformX - 200;
//       }
//       /*console.log(startTransformX,swipeEndPointCoordinate);*/
//       animateSwipe(swipeEndPointCoordinate);
//     } else {
//       /*console.log('right');*/
//
//       /*СВАЙП ВПРАВО*/
//       if (startTransformX + 200 > 0) {
//         swipeEndPointCoordinate = 0;
//       } else {
//         swipeEndPointCoordinate = startTransformX + 200;
//       }
//       /*console.log(startTransformX,swipeEndPointCoordinate);*/
//       animateSwipe(swipeEndPointCoordinate);
//     }
//   }
// });
//
// /** Animate block movement to coordinate **/
// function animateSwipe(coordinate) {
//   clearTimeout(clearTransition);
//   $wrapper.find(".sticker-pack-row").css({
//     'transform': 'translateX(' + coordinate + 'px) translateZ(0px)',
//     'transition': 'transform .075s ease'
//   });
//
//   clearTransition = setTimeout(function () {
//     $wrapper.find(".sticker-pack-row").css('transition', "");
//   }, 110)
// }
//
// /** Orientation change event
//  * recalculates block overflow on orientation change *
//  **/
// $(window).on('orientationchange', function (event) {
//   /*console.log('orientationchange');*/
//   wrapperWidth = $wrapper[0].offsetWidth;
//   rowWidth = $wrapper.find(".sticker-pack-row")[0].scrollWidth;
//   maxNegative = wrapperWidth - rowWidth;
//   startTransform = $wrapper.find(".sticker-pack-row").css("transform");
//   startTransformValues = startTransform.match(/-?\d+/g);
//
//   if (startTransformValues[4] > 0) {
//    /* console.log("left");*/
//     animateSwipe(0);
//   }
//
//   if (startTransformValues[4] < maxNegative) {
//    /*console.log("right");*/
//     animateSwipe(maxNegative);
//   }
// });
//
//
// $(".sticker-set-btn").bind('tap',function () {
//   $(".sticker-set-btn.active").removeClass("active");
//   $(this).addClass("active")
// });
//
// $(".open-chat-smiles-ico").bind('tap',function () {
//   $(".smiles-wrapper").toggleClass("opened");
// });


/**
 * Created by Sasha on 05.01.2017.
 */
var startPoint = {};
var nowPoint;
var ldelay;
var $wrapper = '';
var $innerWrap = '';
var startTransform;
var startTransformValues = [];
var startTransformX;
var wrapperWidth;
var rowWidth;
var maxNegative;
var otk = {};
var clearTransition;

function touchRowSliderInit() {
  $wrapper = $(".sticker-pack-set-wrap");
  $innerWrap = $wrapper.find(".sticker-set-btn-container");

  $wrapper.on('touchstart', function (event) {
    touchStartCalc(event)
  });
  $wrapper.on('touchmove', function (event) {
    touchMoveCalc(event)
  });
  $wrapper.on('touchend', function (event) {
    touchEndCalcfunction(event)
  } );
  $(window).on('orientationchange', function (event) {
    orientChangeUpdate(event)
  });

  $(".sticker-set-btn").bind('tap',function () {
    var currentActive = $(this).attr('data-sticker-set');

    $(".sticker-set-btn.active, .sticker-container.active").removeClass("active");

    $(this).addClass("active");
    $("#" + currentActive).addClass("active");
  });

  $(".open-chat-smiles-ico").bind('tap',function () {
    $(".smiles-wrapper, .close-chat-smiles-ico, .open-chat-smiles-ico").toggleClass("opened");
    stickerMarginCalc();
  });

  $(".close-chat-smiles-ico, .close-smiles-wide-button").bind('tap',function () {
    $(".open-chat-smiles-ico, .smiles-wrapper, .close-chat-smiles-ico").toggleClass("opened");
  });

}

/** Touchstart event
 * detects start point parameters & full, visible wrapper widths *
 **/
function touchStartCalc(event) {
  /*console.log ("touchstart");*/
  // event.preventDefault();
  // event.stopPropagation();

  wrapperWidth = $wrapper[0].offsetWidth;
  rowWidth = $innerWrap[0].scrollWidth;
  startTransform = $innerWrap.css("transform");
  startTransformValues = startTransform.match(/-?\d+/g);
  /*console.log(startTransform);
   console.log(startTransformValues);
   console.log(startTransformValues[4]);*/
  startPoint.x = event.originalEvent.changedTouches[0].pageX;
  startPoint.y = event.originalEvent.changedTouches[0].pageY;
  ldelay = new Date();
}

/** Touchmoove event
 * realtime detects finger touch point parameters & apply it to block *
 **/
function touchMoveCalc(event) {
  /*console.log ("touchmove");*/
  // event.preventDefault();
  // event.stopPropagation();

  nowPoint = event.originalEvent.changedTouches[0];
  startTransformX = +startTransformValues[4];
  otk.x = nowPoint.pageX - startPoint.x + startTransformX;
  /*console.log(otk.x);*/

  $innerWrap.css('transform', 'translate(' + otk.x + 'px, 0px ) translateZ(0)');
}

/** Touchend event
 * 1-st part calculates overflows & animate block return into visible field *
 * 2-nd detects fast swipe and move block(without overflows) *
 **/
function touchEndCalcfunction(event) {
  /*console.log('touchend');*/

  var pdelay = new Date();
  nowPoint = event.originalEvent.changedTouches[0];
  var xAbs = Math.abs(startPoint.x - nowPoint.pageX);
  maxNegative = wrapperWidth - rowWidth;
  /*console.log(otk.x);*/

  if (otk.x > 0) {
    /*console.log("left");*/
    animateSwipe(0);
  }

  if (otk.x < maxNegative) {
    /*console.log("right");*/
    animateSwipe(maxNegative);
  }

  if ((xAbs > 20) && (pdelay.getTime() - ldelay.getTime()) < 200) {
    /*console.log('fastSwipe');*/
    var swipeEndPointCoordinate;

    if (nowPoint.pageX < startPoint.x) {
      /*console.log('left');*/

      /*СВАЙП ВЛЕВО*/
      if (startTransformX - 200 < maxNegative) {
        swipeEndPointCoordinate = maxNegative;
      } else {
        swipeEndPointCoordinate = startTransformX - 200;
      }
      /*console.log(startTransformX,swipeEndPointCoordinate);*/
      animateSwipe(swipeEndPointCoordinate);
    } else {
      /*console.log('right');*/

      /*СВАЙП ВПРАВО*/
      if (startTransformX + 200 > 0) {
        swipeEndPointCoordinate = 0;
      } else {
        swipeEndPointCoordinate = startTransformX + 200;
      }
      /*console.log(startTransformX,swipeEndPointCoordinate);*/
      animateSwipe(swipeEndPointCoordinate);
    }
  }
  return true
}

/** Orientation change event
 * recalculates block overflow on orientation change *
 * ONLY IF CONTAINER TRANSFORMATIONS EXISTS
 **/

function orientChangeUpdate() {
  /*console.log('orientationchange');*/
  wrapperWidth = $wrapper[0].offsetWidth;
  rowWidth = $innerWrap[0].scrollWidth;
  maxNegative = wrapperWidth - rowWidth;
  startTransform = $innerWrap.css("transform");
  startTransformValues = startTransform.match(/-?\d+/g);

  if(startTransformValues) {
    if (startTransformValues[4] > 0) {
      /* console.log("left");*/
      animateSwipe(0);
    }

    if (startTransformValues[4] < maxNegative) {
      /*console.log("right");*/
      animateSwipe(maxNegative);
    }
    stickerMarginCalc()
  }
}

/** Animate block movement to coordinate **/
function animateSwipe(coordinate) {
  clearTimeout(clearTransition);
  $innerWrap.css({
    'transform': 'translateX(' + coordinate + 'px) translateZ(0px)',
    'transition': 'transform .075s ease'
  });

  clearTransition = setTimeout(function () {
    $innerWrap.css('transition', "");
  }, 110)
}

function stickerMarginCalc() {
  var stickerSide = 72;
  var windowPaddingSum = 10;
  var windowSide = $(".smiles-wrapper")[0].offsetWidth;
  var totalStickersInRow = Math.floor((windowSide-windowPaddingSum)/stickerSide);
  var stickerMarginRight = (windowSide - windowPaddingSum - totalStickersInRow*stickerSide)/totalStickersInRow;
  $("figure.sticker").css("margin-right", stickerMarginRight);
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

function sendSm(e) {
  var $smile = $(e.target);
  var $textField = $('.enter-text-field');
  var $sendBtn = $('.send-message-button');
  stickersAndEmoji.sendSticker($smile, $textField, $sendBtn);
  var rowText = $textField.html();
  var correctedText = message.correctMessageBeforeSend(rowText);
}
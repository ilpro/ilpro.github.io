'use strict';
var activeFlipModal = false;

/** Show modal window **/
$(document).on("click", "#login, .search-login-link", function (e) {
    e.preventDefault();
    // openModal("#login-form-modal", "#login-close");
	showVideoModal(".flipper.register-login-flip");
});

// $("").click(function(){
	// showFlipModal(".flipper.register-login-flip", true);
// });

$("body").on("click", ".login-link, .registration-link", function(){
	$(".flipper.register-login-flip").toggleClass("flip");
});

$("body").on("click", ".search-registration-link", function () {
    $(".flipper.register-login-flip").addClass("flip");
    showVideoModal(".flipper.register-login-flip");
});

$(window).resize( function(){
    if ($(".flipper.img-zoom-flip").hasClass("active")){
        resizeModal(".flipper.img-zoom-flip")
    }
    if ($(".flipper.avatar-crop-flip").hasClass("active")){
        resizeModal(".flipper.avatar-crop-flip")
    }
    if ($(".flipper.notification-flip").hasClass("active")){
        resizeModal(".flipper.notification-flip")
    }
});

/** Change form on click **/
/* $("#to-register, #to-login").click(function (event) { // listen if click on trigger button
    event.preventDefault(); // switching off standart behavior

    $("#login-form-modal, #register-form-modal").addClass("js-modal-window");

    $("#register-close").click(function (e) {
        $("#login-close").click();
    });

    if ($(event.target).closest("#to-register").length > 0) {
        $("#login-form-modal").animate({opacity: 0, top: '45%'}, 200, function () {
            $(this).css('display', 'none');
        });
        setTimeout(function () {
            $("#register-form-modal").css('display', 'block').animate({opacity: 1, top: '50%'}, 200);
        }, 300);
    } else {
        $("#register-form-modal").animate({opacity: 0, top: '45%'}, 200, function () {
            $(this).css('display', 'none');
        });
        setTimeout(function () {
            $("#login-form-modal").css('display', 'block').animate({opacity: 1, top: '50%'}, 200);
        }, 300);
    }
}); */


/***** OPEN / CLOSE MODAL WINDOW ********/
function showModal($container) {
    $('#modal-overlay').fadeIn(0, // at first smoothly show the dark overlay
        function () { // after execution last animation
            $container // fetch container going to be show
                .css('display', 'block') // changing style of modal window to viseble
                .animate({opacity: 1, top: '50%'}, 0); // smoothly adding opacity with moving to down
        });
}

function hideModal() {
    $(".js-modal-window")
        .animate({opacity: 0, top: '45%'}, 0,  // smoothly changing opacity to 0 together with moving up modal window
            function () { // after animation ends
                $(this).css('display', 'none'); // hiding container
                $('#modal-overlay').fadeOut(0); // hiding overlay
            }
        );
}

function openModal(container, closeBtn) {
    $(container).addClass("js-modal-window"); // without this class modal window will not work

    // show modal window
    showModal($(container));

    //listen click on overlay or close button (if exist) to close midal
    $('#modal-overlay').one("click", function (e) { // listen if click on trigger button
        e.preventDefault(); // switching off standart behavior
        hideModal();
    });

    if (closeBtn) // if close btn exist
        $(closeBtn).one("click", function (e) { // listen if click on trigger button
            e.preventDefault(); // switching off standart behavior
            hideModal();
        });
}

/***** NOTIFICATION WINDOW LOGIC ********/
function notifyUser(notifyMessage) {
    $("#notification-message").html(notifyMessage);
    openModal('#notification-form-modal','#notification-close');
    $("#notification-form-modal").find(".submit-btn").click(function (e) {
        e.preventDefault();
        $("#notification-close").click();
    });
}

/***** New MODAL WINDOW ********/
function hideFlipModal(flipperPlusClass) {
    $(flipperPlusClass).addClass("fly-back").removeClass("active");
    $(".page-shadow-hover").addClass("fadeout");

    setTimeout(function () {
        $(flipperPlusClass).removeClass("fly-back flip");
        $(".page-shadow-hover, .modal-keeper").removeClass("active fadeout");
    }, 500);
    $(".page-shadow-hover, .form-close.clickable").off("click");
    $("body").css('overflow', '');

    //fix for pause player on closing
    $("body").trigger("hideFlipModal");
}

/***** Flip popups modals with animation  ****/
function showFlipModal(flipperPlusClass) {
    activeFlipModal = flipperPlusClass;

    $(activeFlipModal + ', .page-shadow-hover, .modal-keeper').addClass("active");
    $("body").css('overflow', 'hidden');

    resizeModal(flipperPlusClass);

    $(".page-shadow-hover, .form-close.clickable").one("click",function () {
        hideFlipModal(flipperPlusClass);
    });
}

function resizeModal(flipperPlusClass) {
    var menuHeight = document.querySelector(flipperPlusClass+" .form-body").offsetHeight;
    var menuWidth = document.querySelector(flipperPlusClass+" .form-body").offsetWidth;
    var windowHeight = window.innerHeight;
    var offsetTop, marginTop;
    if (menuHeight > windowHeight){
        marginTop = 0;
        offsetTop = 20;
    } else {
        marginTop = -menuHeight/2+"px";
        offsetTop = '';
    }
    $(flipperPlusClass).css({
        'margin-left': -menuWidth/2+"px",
        'margin-top': marginTop,
        'width': menuWidth + "px",
        'top' : offsetTop,
        'height': menuHeight - 4 + "px"
    });
    $(".page-shadow-hover").css("min-height", menuHeight + (2 * offsetTop) + 'px');
}

function showVideoModal(flipperPlusClass) {
    var wasFilterOpened = $(".modal-video .pick-form").css("display") === "block";
    var search = (getCookie("search")) ? JSON.parse(getCookie("search")) : false;
    var videoSample = '<video class="cover-video" src="video/MsGirlLoop.mp4" autoplay="autoplay" loop="loop" muted onplaying="this.controls=false" tabindex="0"></video>';

    if (!$(".modal-video .cover-video")[0]) {
        $(".modal-video").prepend(videoSample).show();
        $(".modal-video .cover-video").fadeIn(300);
    }

    $(".modal-video .cover-video").siblings().hide();
    $(flipperPlusClass).show();

    resizeModal(flipperPlusClass);

    $(".modal-video .form-close.clickable, .modal-video .close-cross").one("click", function () {
        hideVideoModal()
    });

    if (wasFilterOpened) {
        $(".modal-video .form-close.clickable").off("click").one("click", function () {
            hideVideoModal(false);
            showVideoModal(".pick-form");
        });
    }
    if (!wasFilterOpened && !search) {
        $(".modal-video .close-cross").off("click").one("click", function () {
            window.location.hash = "#";
            hideVideoModal();
        });
    }
}

function hideVideoModal(hideBgToo) {

    hideBgToo = typeof hideBgToo !== 'undefined' ? hideBgToo : true;

    $(".modal-video .cover-video").siblings().fadeOut(300);
    if (hideBgToo) {
        $(".modal-video .cover-video").fadeOut(300);
    }

    $(".modal-video .form-close.clickable, .modal-video .close-cross").off("click");
    // $("body").trigger("hideVideoModal");

    if (hideBgToo) {
        setTimeout(function () {
            $(".modal-video .cover-video").remove();
            $(".modal-video").hide();
        }, 400);
    }

    setTimeout(function () {
        $(".flipper.register-login-flip").removeClass("flip");
    }, 400);

}

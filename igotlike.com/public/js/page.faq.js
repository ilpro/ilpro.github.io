'use strict';

$(".write-msg").on("click",function (e) {
    e.preventDefault();
    $(".contact-form").show();
});

$(".about .close-cross").on("click", function (e) {
    e.preventDefault();
    $(".contact-form").hide();
});
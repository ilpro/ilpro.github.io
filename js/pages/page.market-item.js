'use strict';

const pageMarketItem = {

    init: function() {
        var self = this;

        $(document).ready(function () {
            var mySwiper = new Swiper ('.item-preview-swiper-container', {
                slideClass : 'swiper-slide',
                wrapperClass : 'swiper-wrapper',
                nextButton: '.swiper-button-next',
                prevButton: '.swiper-button-prev',
                direction: 'horizontal',
                loop: true,
                watchActiveIndex: true,
                onSlideChangeEnd:function(swipe){
                    $(".presSlidesActive").text(swipe.realIndex + 1);
                }
            });

            $(".presSlidesActive").text("1");
            $(".presSlidesFrom").text(mySwiper.slides.length -2);
        });

    }
};
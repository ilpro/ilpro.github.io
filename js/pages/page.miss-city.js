'use strict';

const pageMissCity = {

    init: function() {
        var self = this;

        self.initHandlers();
    },

    initHandlers: function(){
        $('.miss-city-page').on('click', ".filter-menu-button", function () {
            if(!$(this).hasClass("active-filter")) {
                $('.miss-city-page .active-filter').removeClass("active-filter");
                var activeFilter = $(this).attr('class').replace("filter-menu-button sort-menu-",'');
                $(this).addClass("active-filter");
                $('.' + activeFilter + "-view").addClass("active-filter");
            }
        });
    }
};
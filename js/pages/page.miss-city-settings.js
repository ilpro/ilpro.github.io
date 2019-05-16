'use strict';

const pageMissCitySettings = {

    init: function() {
        var self = this;

        var config = {
            '.chosen-select-deselect': {width: "210px", disable_search_threshold: 10},
            '.chosen-select-birthday': {width: "55px", disable_search_threshold: 10},
            '.chosen-select-birthmonth': {width: "100px", disable_search_threshold: 10},
            '.chosen-select-birthyear': {width: "75px", disable_search_threshold: 10},
            '.chosen-select-gender': {width: "120px", disable_search_threshold: 10}
        };

        for (var selector in config)
            $(selector).chosen(config[selector]);

    }
};
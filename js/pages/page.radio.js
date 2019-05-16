'use strict';
const pageRadio = { 

  socket: {}, // socket

  searchWordsMap: {}, // there will be search key-value object after getSearchWordsMap launchs
  stationsSearchMap: {}, // there will be search key-value object after getStationsSearchMap launchs
  updateEnable: false, // if boolean true, radio history will be updated when 'radioAll' response comes

  init: function(socket) {
    var self = this;

    self.socket = socket;

    // init recommended news block on page
    getNewsRecommended(self.socket);

    // get users online
    usersOnline.init();

    function initRadioPage() {
      self.initHandlers(); // init event handlers (e.g. click)
      self.initSocketHandlers(); // init socket handlers (dataSocket.on)
      self.insertGenres();// insert radio genres from Radio.genres array
      self.insertRegions();// insert radio genres from Radio.regions array
      self.insertRadioList(); // insert all radio stations in menu
      self.getFiltersSearchMap(radio.genres, radio.regions); // create search key\value object
      self.getStationsSearchMap(radio.radioData); // create search key\value object
      self.listSortable(); // make radio menu sortable with JQuery UI

      //show promo video after stations load
      $(".promo-radio").css("opacity", 1);
      $(".radio-loading-container").css("display", "none");
    }

    // wait until radio data will be load into the page
    var checkForRadioData = setInterval(function() {
      // if radioData object is not empty
      if(radio.radioData.length > 0) {
        clearInterval(checkForRadioData);
        initRadioPage();
      }
    }, 100);
  },

  /** Insert radio list from widget's radio data **/
  insertRadioList: function() {
    var self = this;
    var urlChannel = urlHash.getState("playRadio");
    var favoriteStationFirstArr = self.getFavoriteStationsFirst();
    var allStationHtmlStr = '';
    var historySongListIco = '<svg class="history-list-ico" width="26" height="23" viewBox="0 0 26 23">\
        <path fill="#5D5D5D" d="M4 0h22v2H4zm0 3h22v2H4zm0 3h22v2H4zm0 3h22v2H4zM0 0h3v2H0zm0 3h3v2H0zm0\
    3h3v2H0zm0 3h3v2H0zm4 3h22v2H4zm0 3h22v2H4zm0 3h22v2H4zm0 3h22v2H4zm-4-9h3v2H0zm0 3h3v2H0zm0\
    3h3v2H0zm0 3h3v2H0z"></path>\
    </svg>';

    if(urlChannel){
      $("#radio-page .player-control").addClass("playing");
    }

    favoriteStationFirstArr.forEach(function (station, i, arr){
      var activeChn = '';

      if(typeof station.radioId !== 'undefined') {
        activeChn = urlChannel == station.radioId ? ' active' : '';
      }

      if(!station.regionName) station.regionName = '';
      if(!station.genresTitles) station.genresTitles = '';

      var radioListItem =
        '<li class="radio-page__block' + activeChn + '" \
           data-chanel="' + station.radioId + '" \
           data-radio-url="' + station.radioUrl + '" \
           data-genre="' + station.genresTitles.toLowerCase() + '" \
           data-region="' + station.regionName.toLowerCase() + '">' +
        station.radioLogo + ' \
          <div class="chanel-name">' + station.radioTitle + '</div>' +
        '<div class="histoty-song-list">' +
        self.historyTrackList(station.tracks) +
        historySongListIco +
        '</div>' +
        '</li>';

      allStationHtmlStr += radioListItem;
    });

    $(".radio-page__list-container").append(allStationHtmlStr);
    self.songHistoryReposition(); // history tracks reposition func

    // copy song to the buffer by click on copy link button
    var clipboardSong = new Clipboard(".copy-song-btn", "#radio-page");
  },


  /** Create song history list **/
  historyTrackList: function(tracksStr) {
    var self = this;

    var stationLastTracks = !!tracksStr ? tracksStr.split('||') : false;

    // if tracks exists in DB, return its list
    if(stationLastTracks) {
      return (
      '<div class="song-history round-corners">\
         ' + self.getHtmlTrackInfo(stationLastTracks[0]) + '\
         <div class="song-history-title played-old">' + lang.lRadioPreviousTitle + '</div>\
         <ul class="song-history-list">\
           <li class="song-history-list-item clearfix">' + self.getHtmlTrackInfo(stationLastTracks[1]) + '</li>\
           <li class="song-history-list-item clearfix">' + self.getHtmlTrackInfo(stationLastTracks[2]) + '</li>\
           <li class="song-history-list-item clearfix">' + self.getHtmlTrackInfo(stationLastTracks[3]) + '</li>\
           <li class="song-history-list-item clearfix">' + self.getHtmlTrackInfo(stationLastTracks[4]) + '</li>\
         </ul>\
         <div class="spike"></div>\
       </div>')
    }
    // if no any data about last tracks
    else {
      return (
        '<div class="song-history round-corners">\
           <div class="song-history-title playing-now">' + lang. lRadioNoSongsNames + '</div>\
           <div class="spike"></div>\
         </div>')
    }
  },

  /*** Cut track string by '-' to extract artist name ***/
  getHtmlTrackInfo: function(trackStr) {
    var self = this;
    var artist = '';
    var song = '';

    if(!!trackStr && trackStr.indexOf('-') != -1) {
      artist = trackStr.substring(0, trackStr.indexOf('-'));
      song = trackStr.substring(trackStr.indexOf('-'));
    } else {
      artist = trackStr;
    }

    var trackInfo =
      '<div class="song-title">\
         <div class="author-name">' + artist + '</div>\
         <div class="song-name">' + song + '</div>\
       </div>' +
      self.getHtmlSongControl(trackStr);

    return trackInfo;
  },

  getHtmlSongControl: function(trackStr) {
    var trackStrEncoded = encodeURIComponent(trackStr);
    var songControl =
      '<div class="song-control"> \
         <div class="copy-song-btn" data-clipboard-text="' + trackStr + '" title="' + lang.lRadioSongTitleCopy + '">\
           <span class="copy-link-tooltip round-corners box-shadow">' + lang.lRadioSongTitleCopySucsess + '</span>\
           <svg width="15" height="19" viewBox="0 0 15 19">\
             <path fill="none" stroke="#F5F5F5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" \
             d="M12.482 17.96c-.364.48-.94.54-1.584.54H2.914C1.82 18.5.5 18.107.5 17.013V5.083c0-.547.366-1.17.75-1.53"/>\
             <path fill="none" stroke="#F5F5F5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" \
             d="M2.5 6V2.07C2.5.976 3.84.5 4.933.5h6.91L14.5 3.145V14.76c0 1.094-.49 1.74-1.583 1.74H4.933c-1.093 0-2.433-.647-2.433-1.74V6M5 5.5h7M5 9.5h7M5 11.5h7"/>\
           </svg>\
         </div> \
         <!--<a href="http://vk.com/audio?q=' + trackStrEncoded + '" title="' + lang.lSearch + ' Вконтакте" class="contact-song ico vk-radio-ico" target="_blank"></a>-->\
         <a href="https://play.google.com/music/listen#/sr/' + trackStrEncoded + '" title="' + lang.lSearch + ' Google Music" class="google-song ico google-radio-ico" target="_blank"></a>\
         <!--<a href="https://music.yandex.ua/search?text=' + trackStrEncoded + '" title="' + lang.lSearch + ' Yandex Music" class="y-music-song ico yandex-music-radio-ico" target="_blank"></a>-->\
         <a href="https://soundcloud.com/search/sounds?q=' + trackStrEncoded + '" title="' + lang.lSearch + ' SoundCloud" class="sound-cloud-song ico sound-cloud-radio-ico" target="_blank"></a>\
         <a href="https://www.youtube.com/results?search_query=' + trackStrEncoded + '" title="' + lang.lSearch + ' Youtube" class="youtube-song ico youtube-radio-ico" target="_blank"></a>\
       </div>';

    return songControl;
  },

  /** SONG HISTORY BLOCK REPOSITION FUNCTION **/
  songHistoryReposition: function() {
    /*take wrapper offset*/
    var controlOffset = $(".radio-list-wrapper").offset();
    $(".song-history").each(function() {
      /*hack to find displayed none offset*/
      $(this).css("opacity", 0);
      $(this).css("display", "block");
      var elementOffset = $(this).closest($(".radio-page__block")).offset();
      $(this).css("display", "");
      $(this).css("opacity", "");
      /*append new offset to each song -history block and spike*/
      $(this).css("left", controlOffset.left - elementOffset.left - 5 + "px");
      $(this).find(".spike").css("left", elementOffset.left - controlOffset.left + 1 + "px")
    })
  },

  /** INIT RADIO PAGE HANDLERS **/
  initHandlers: function() {
    var self = this;

    /**** COPY LINK BUTTON *****/
    $("#radio-page").on("click", ".copy-song-btn", function () {
      var $tooltip = $(this).find(".copy-link-tooltip");
      if ($tooltip.hasClass("copy-link-popup")) return;

      $tooltip.show().addClass("copy-link-popup");

      setTimeout(function () {
        $tooltip.hide().removeClass("copy-link-popup");
      }, 1300);
    });

    // load history when history when user opens history menu
    $('.radio-page__list-container').on('mouseenter', '.histoty-song-list', function(e) {
        self.updateEnable = true;
        self.socket.emit('getCache', 'radioAll');
    });

    $('.radio-page__list-container').on('mouseleave', '.histoty-song-list', function(e) {
      self.updateEnable = false;
    });

    // handle clicks on radio list and redirect it to radio widget list
    $(".radio-page__list-container").off("click").on("click", ".radio-page__block", function(event) {
      if(event.target.closest('.song-history')) return;

      var channel = $(this).attr("data-chanel");

      $(".radio-page__block.active").removeClass("active");
      $(this).addClass("active");

      $('#stations-list').find('.station-row[data-channel="' + channel + '"]').click();
    });

    // Change station name in footer if station changed
    $(document).off($.jPlayer.event.play).on($.jPlayer.event.play, function() {
      var $channel = $("#radio-page .radio-page__block.active");
      var channelName = $channel.find('.chanel-name').text();
      $("#footer-radio-name").html(channelName);

      $("#radio-page .player-control").addClass("playing");
    });


    // SEARCH HANDLERS
    // Handle click on genres and regions block, handle selected target
    $('#genres-list, #regions-list').click(function(e) {
      if($(e.target).closest('.list-item').length > 0) {
        self.handleByFilters($(e.target));
      }
    });

    // clear all selected
    $('.cross', '.control-block').click(function(e) {
      if($(e.target).closest('.region-sort').length > 0) {
        $('.list-item.active', '#regions-list').removeClass('active').first().addClass('active');
        $('.list-item.active', '#regions-list').first().click();
        return;
      }
      if($(e.target).closest('.genre-sort').length > 0) {
        $('.list-item.active', '#genres-list').removeClass('active').first().addClass('active');
        $('.list-item.active', '#genres-list').first().click();
        return;
      }
    });

    $('#regionhover, #genrehover').click(function(e) {
      /** Open genre & regions on click **/
      if($(e.target).closest('.region-sort').length > 0) {
        $('#regions-list-wrapper').toggle();
      }
      if($(e.target).closest('.genre-sort').length > 0) {
        $('#genres-list-wrapper').toggle();
      }
    });

    $(document).click(function(e) {
      if($(e.target).closest('.region-sort').length === 0 || $(e.target).closest('.close-list').length > 0) {
        $('#regions-list-wrapper').hide();
      }
      if($(e.target).closest('.genre-sort').length === 0 || $(e.target).closest('.close-list').length > 0) {
        $('#genres-list-wrapper').hide();
      }
    });

    // submit search stations form
    $('#radio-search').keyup(function() {
      self.handleSearch($(this).val());
    });

    // handle escape press if focused on search line and clear search
    $(document).keyup(function(e) {
      if(e.keyCode === 27) {
        if($('#radio-search').is(':focus')) {
          self.handleSearch('');
        }
      }
    });

    // clear search
    $('.search-field__box .cross').click(function() {
      $('#radio-search').val('');
      $('.search-field__box .cross').hide(); // hide clear cross
      $('.radio-page__block.hidden').removeClass('hidden'); // show all stations
    });
  },

  /** START HANDLE SOCKET EVENTS **/
  initSocketHandlers: function() {
    var self = this;

    self.socket
      .off('radioAll', self.update.bind(self))
      .on('radioAll', self.update.bind(self));
  },

  /** Insert genres list **/
  insertGenres: function() {
    $('#genres-list').empty();
    console.log(radio);
    for(var i = 0; i < radio.genres.length; i++) {
      var genre = radio.genres[i].genresTitle.toLowerCase();
      var totalStationsByGenre = radio.genres[i].total;
      var genreItem =
        '<li class="list-item" data-filter="' + genre + '">' + genre + ' (' + totalStationsByGenre + ')</li>';
      $('#genres-list').append(genreItem);
    }
  },

  /** Insert regions list **/
  insertRegions: function() {
    $('#regions-list').empty();
    for(var i = 0; i < radio.regions.length; i++) {
      var region = radio.regions[i].regionName.toLowerCase();

      // not to show Russia genre
      if(region.indexOf('россия') !== -1){
        continue;
      }

      var totalStationsByRegion = radio.regions[i].total;
      var regionItem =
        '<li class="list-item" data-filter="' + region + '">' + region + ' (' + totalStationsByRegion + ')</li>';
      $('#regions-list').append(regionItem);
    }
  },

  /** Update page radio **/
  update: function() {
    var self = this;

    if(self.updateEnable) {
      $('.radio-page__block .song-history').remove(); // remove previous history
      self.insertUpdatedTracks(); // insert updated history
      self.songHistoryReposition(); // reposition tooltip elements with tracks history for stations
    }
  }, 

  /** Update history of tracks **/
  insertUpdatedTracks: function() {
    var self = this;
    var length = radio.radioData.length;

    for(var i = 0; i < length; i++) {
      var stationObj = radio.radioData[i];
      var stationId = stationObj['radioId'];
      $('.radio-page__block[data-chanel="' + stationId + '"] .histoty-song-list').append(self.historyTrackList(stationObj['tracks']));
    }
  },


  /** JQUERY UI SORTABLE RADIO LIST **/
  listSortable: function() {
    // make radio stations list sortable
    $(".jquery-sortable-pageradio").sortable({
      revert: "true",
      delay: 100,
      tolerance: "pointer",
      cancel: ".song-history", /*prevent element sorting*/
      update: function(event, ui) {
        // change favorites on list sort
        var newFavoriteArr = [];
        $(".radio-page__block:lt(6)", ".jquery-sortable-pageradio").each(function() {
          newFavoriteArr.push(+$(this).attr("data-chanel"));
          radio.favoriteChannels = newFavoriteArr;
        });
        radio.updateFavoriteChannels();
        // radio.insertUserStations();
        /*song history reposition after sorting*/
        var controlOffset = $(".radio-list-wrapper").offset();
        $(".song-history").each(function() {
          /*hack to find displayed none offset*/
          $(this).css("opacity", 0);
          $(this).css("display", "block");
          var elementOffset = $(this).closest($(".radio-page__block")).offset();
          $(this).css("display", "");
          $(this).css("opacity", "");
          /*append new offset to each song -history block and spike*/
          $(this).css("left", controlOffset.left - elementOffset.left - 5 + "px");
          $(this).find(".spike").css("left", elementOffset.left - controlOffset.left + 1 + "px")
        })

      }
    });
  },

  /** Search **/
  handleByFilters: function($target) {
    var self = this;
    var genres = [];
    var regions = [];

    // highlight chosen filter box
    $target.closest('.list-item').toggleClass('active');

    // get all filters words, push them into arrays
    $('.list-item.active', '#genres-list').each(function() {
      genres.push($(this).attr('data-filter'));
    });
    $('.list-item.active', '#regions-list').each(function() {
      regions.push($(this).attr('data-filter'));
    });

    if(genres.length > 0) {
      $('.genre-sort').addClass('active');
      $('.genre-sort .amount').show().html(genres.length);
      $('.genre-sort .cross').show();
    } else {
      $('.genre-sort').removeClass('active');
      $('.amount, .cross', '.genre-sort').hide()
    }

    if(regions.length > 0) {
      $('.region-sort').addClass('active');
      $('.region-sort .amount').show().html(regions.length);
      $('.region-sort .cross').show();
    } else {
      $('.region-sort').removeClass('active');
      $('.amount, .cross', '.region-sort').hide();
    }

    // filter stations in HTML
    self.filterStations(genres, regions);
  },

  /** Show/hide stations by genre or region **/
  filterStations: function(genresArr, regionsArr) {
    var self = this;
    var $allStations = $('.radio-page__list-container .radio-page__block');

    // if no filter chosen - exit
    if(genresArr.length === 0 && regionsArr.length === 0) {
      $allStations.removeClass('hidden');
      self.songHistoryReposition();
      return;
    }

    function isInGenres($station) {
      if(genresArr.length > 0) {
        for(var i = 0; i < genresArr.length; i++) {
          if($station.attr('data-genre').indexOf(genresArr[i].toLowerCase()) != -1)
            return true; // if one of station genres exists in filtered genres
        }
        return false; // if this station genres not in filtered genres
      }
      return true; // if no filter selected, don't count them
    }

    function isInRegions($station) {
      if(regionsArr.length > 0) {
        for(var i = 0; i < regionsArr.length; i++) {
          if($station.attr('data-region').indexOf(regionsArr[i].toLowerCase()) != -1)
            return true; // if one of station regions exists in filtered regions
        }
        return false; // if this station regions not in filtered regions
      }
      return true; // if no filter selected, don't count them
    }

    $allStations.each(function() {
      var $station = $(this);

      if(isInGenres($station) && isInRegions($station))
        $station.removeClass('hidden').addClass('selected');
    });

    $allStations.not('.selected').addClass('hidden');
    $allStations.removeClass('selected');

    self.songHistoryReposition();
  },

  /** Handle search input text **/
  handleSearch: function(searchStr) {
    var self = this;
    var searchWord = searchStr.toLowerCase();

    if(searchWord.length > 0) {
      $('.search-field__box .cross').show(); // show clear cross

      // was found in genre or region search string
      if(searchWord in self.searchWordsMap) {
        $('.list-item.active', '.list').removeClass('active');
        $('.list-item[data-filter="' + self.searchWordsMap[searchWord] + '"]').click();
        return
      }

      // if word was found in station search string
      if(searchWord in self.stationsSearchMap) {
        // show only selected station
        $('.radio-page__block', '.radio-page__list-container')
          .not('.radio-page__block[data-chanel="' + self.stationsSearchMap[searchWord] + '"]')
          .addClass('hidden');
      }
    } else { // if search input empty, show all stations
      $('.cross', '.control-block').click();
      $('.search-field__box .cross').hide(); // hide clear cross
      $('.radio-page__block.hidden').removeClass('hidden'); // show all stations
    }

    self.songHistoryReposition();
  },

  /** Attach words from regions and genres objects to its keys **/
  getFiltersSearchMap: function(genresArr, regionArr) {
    var self = this;

    // loop over each region in array
    for(var i = 0; i < regionArr.length; i++) {
      var region = regionArr[i]['regionName'].toLowerCase(); // take root region name
      var searchWordsRegionArr = regionArr[i]['regionSearch'].toLowerCase().split(' '); // make array from search string

      // loop over every word in search string array
      for(var y = 0; y < searchWordsRegionArr.length; y++) {
        var wordRegion = searchWordsRegionArr[y];
        self.searchWordsMap[wordRegion] = region; // attach root region name to every search word
      }
    }

    // loop over each region in array
    for(var x = 0; x < genresArr.length; x++) {
      var genre = genresArr[x]['genresTitle'].toLowerCase(); // take root region name
      var searchWordsGenreArr = genresArr[x]['genresSearch'].toLowerCase().split(' '); // make array from search string

      // loop over every word in search string array
      for(var z = 0; z < searchWordsGenreArr.length; z++) {
        var wordGenre = searchWordsGenreArr[z];
        self.searchWordsMap[wordGenre] = genre; // attach root region name to every search word
      }
    }
  },

  /** Attach search words from every station to station's ID **/
  getStationsSearchMap: function(radioData) {
    var self = this;

    // Loop over all the stations
    for(var x = 0; x < radioData.length; x++) {
      var stationId = radioData[x]['radioId']; // take root station ID
      var searchWordsArr = radioData[x]['radioSearch'].toLowerCase().split(' '); // make array from search string

      // loop over every word in search string array
      for(var z = 0; z < searchWordsArr.length; z++) {
        var searchWord = searchWordsArr[z];
        self.stationsSearchMap[searchWord] = stationId; // attach root region name to every search word
      }
    }
  },

  getFavoriteStationsFirst: function() {
    var favoritesLength = radio.favoriteChannels.length;

    // make radio from favorites on station list top
    if(favoritesLength > 0) {
      var favoriteStations = [];
      var otherStations = [];
      var length = radio.radioData.length;

      for(var y = 0; y < length; y++) {
        var stationObj = radio.radioData[y];

        // if station in favorites
        if(radio.favoriteChannels.includes(stationObj.radioId)){
          for(var x = 0; x < favoritesLength; x++) {
            if(radio.favoriteChannels[x] == stationObj.radioId)
              favoriteStations[x] = stationObj;
          }
        } else { // if station not in favorites
            otherStations.push(stationObj);
        }
      }
      return favoriteStations.concat(otherStations);
    }
    else { // if no users favorites exists
      return radio.radioData;
    }
  }
};

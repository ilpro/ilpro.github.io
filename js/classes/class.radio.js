"use strict";

function Radio(socket) {
  this.socket = socket;
  this.firstLoad = true; // if radio initiated at first time
  this.radioData = []; // radio data from server
  this.regions = []; // radio regions from server
  this.genres = []; // radio genres from server
  this.favoriteChannels = []; // users favorite
  this.playingChannel = false; // false or channel id
  this.url = false; // url for JPlayer
  this.intervalID = false; // interval variable for update radio every 10 sek
}

Radio.prototype.init = function (_data) {
  var self = this;

  // socket listeners
  self.getFavoriteChannels();
  self.initSocketHandlers();

  // get radio stations, radio regions and radio genres
  self.socket.emit('getCache', 'radioAll');
  self.socket.emit('getCache', 'radioRegions');
  self.socket.emit('getCache', 'radioGenres');

  // Handle URL query changes
  $(window).on('hashchange', e => {
    if (self.playingChannel) {
      urlHash.pushState({playRadio: self.playingChannel});
    }
  });
};

/*** INIT EVENT HANDLERS **/
Radio.prototype.eventHandlersInit = function () {
  var self = this;

  // launch station if user click play after first load page
  $('.play-pause-wrapper', '#current-station').click(function (e) {
    if ($(this).hasClass('station-launch')) {
      var stationId = $(this).removeClass('station-launch').attr('data-station-launch-id');
      $('.station-row[data-channel="' + stationId + '"]', '#stations-list').click();
    }
  });

  // open menu
  $("#stations-menu").mouseenter(function () {
    $(this).closest('.radio-all').addClass('show-list');
    self.socket.emit('getCache', 'radioAll');
  });

  // hide menu
  $('#stations-list').mouseleave(function () {
    $(this).closest('.radio-all').removeClass('show-list');
  });

  fadeMenu($("#stations-menu"), $('#stations-list'));

  // Change radio station
  $('#stations-list').on('click', '.station-row', function (e) {

    // close menu if it opens
    $(this).closest('.radio-all').removeClass('show-list');

    if (e.target.closest('.volume-copy-block')) {
      return
    }

    e.preventDefault();

    var channel = $(this).attr('data-channel');
    var channelName = $(this).attr('data-radio-name');
    var channelUrl = $(this).attr('data-radio-url');
    var channelIco = $(this).find('.station-ico-holder').html();

    urlHash.pushState({playRadio: channel});

    $("#jquery_jplayer_1").jPlayer("setMedia", {
      title: channelName,
      mp3: channelUrl
    });
    $("#jquery_jplayer_1").jPlayer("play");

    $('.station-row ', '#stations-list').removeClass('active');
    $(this).addClass('active');
    $('.current-station-logo', '#stations-menu').html(channelIco);

    // if radio page opens
    $('.radio-page__block', '.radio-page__list-container')
      .removeClass('active')
      .filter('[data-chanel="' + channel + '"]')
      .addClass('active');
  });

  $('.jp-volume-bar').slider({
    orientation: "vertical",
    range: "min",
    min: 1,
    max: 100,
    value: 80,
    slide: function (event, ui) {
      var audioVolume = $(".jp-volume-bar .ui-slider-range").height() / $(" .jp-volume-bar").height();
      $("#jquery_jplayer_1").jPlayer("volume", audioVolume)
    }
  });

  fadeMenu($(".volume-control"), $('.jp-volume-bar'));

  /**** COPY LINK BUTTON *****/
  $("#stations-list, #current-station-copy-block").on("click", ".copy-clipboard", function () {
    var $tooltip = $(this).find(".copy-link-tooltip");
    if ($tooltip.hasClass("copy-link-popup")) return;

    $tooltip.show().addClass("copy-link-popup");

    setTimeout(function () {
      $tooltip.hide().removeClass("copy-link-popup");
    }, 1300);
  });
};

/** Socket Handlers **/
Radio.prototype.initSocketHandlers = function () {
  var self = this;

  self.socket.on('favoriteRadioStations', function (data) {
    self.favoriteChannels = JSON.parse(data); // parse data
  });

  self.socket.on('radioAll', function (data) {
    // wait until favorites will be load into the page
    var checkForRadioFavorites = setInterval(function () {
      // if radioData object is not empty
      if (self.favoriteChannels.length > 0) {
        clearInterval(checkForRadioFavorites);
        self.handleRadioResponse(data);
      }
    }, 100);
  });

  self.socket.on('radioRegions', function (data) {
    self.regions = JSON.parse(data); // parse data
  });

  self.socket.on('radioGenres', function (data) {
    self.genres = JSON.parse(data); // parse data
  });
};

/** Handle response for server **/
Radio.prototype.handleRadioResponse = function (data) {
  var self = this;
  self.radioData = JSON.parse(data); // parse data;

  if (self.firstLoad) {
    self.firstLoad = false; // prevent launching first load func

    // add channel to favorites and auto play it if link from external resource
    if (urlHash.getState('playRadio') != undefined) {
      self.autoPlay(urlHash.getState('playRadio'));
    }

    // self.insertUserStations(); // insert widget user's favorites radio stations
    self.JPlayerInit(); // initialization of main radio player
    self.eventHandlersInit(); // start site radio handlers

    // insert radio stations in menu list
    self.insertFirstFavoriteStation();
    self.insertUserStations('#stations-list');
    self.insertAllStations('#stations-list');

    // update radio data every 15 sek
    self.getUpdate(15000);
  } else {
    // update track info
    self.update();
  }
};

/*** Insert logo of first station in favorites and current song **/
Radio.prototype.insertFirstFavoriteStation = function (selector) {
  var self = this;
  var $box = $(selector);
  var stationObj = false;

  self.radioData.forEach(function (station, i, arr) {
    if (+station.radioId === +self.favoriteChannels[0]) {
      stationObj = station;
    }
  });

  if (stationObj) {
    var trackInfo = self.getTrackInfo(stationObj.tracks);
    $('.current-station-logo', '#stations-menu').html(stationObj.radioLogo);

    if (!urlHash.getState('playRadio')) {
      $('.play-pause-wrapper', '#current-station').addClass('station-launch');
      $('.play-pause-wrapper', '#current-station').attr('data-station-launch-id', stationObj.radioId);
    }

    // $('.artist','#current-station').html(trackInfo.artist);
    // $('.track-name','#current-station').html(trackInfo.song);
  } else {
    $('.current-station-logo', '#stations-menu').html(svg.radioDefaultLogo)
  }
};

/** MAKE FAVORITE CHANNELS ARRAY **/
Radio.prototype.getFavoriteChannels = function () {
  var self = this;
  var userId = false;
  if (user && user.info && user.info.userId && user.info.userId) {
    userId = user.info.userId
  }
  self.socket.emit('getFavoriteRadioStations', JSON.stringify({userId: userId}));
};

/** ADD CHANNEL TO FAVORITES IF USER CAME TO SITE FROM EXTERNAL RESOURCE
 e.g. http://www.mediastealer.info/#page=main&playRadio=5 **/
Radio.prototype.autoPlay = function (channel) {
  var self = this;
  var radioChannel = +channel;
  var channelExists = false;

  // click to play btn after all resources loads
  function play() {
    setTimeout(function () {
      $('.station-row[data-channel="' + radioChannel + '"]', '#stations-list').click();
      // $('.state-play', '#current-station').hide();
      // $('.state-pause', '#current-station').show();
    }, 1000);
  }

  // check if linked station exist in radio stations array
  self.radioData.forEach(function (elem, i, arr) {
    if (+elem.radioId === radioChannel) {
      channelExists = true
    }
  });

  if (channelExists === false) return; // if channel not exist - return

  // if channel already exists in favorites - click on it
  if (self.favoriteChannels.indexOf(radioChannel) !== -1) {
    play();
    return;
  }

  // or insert channel into favorites array
  self.addChannelToFavorite(radioChannel);
  play();
};

/** INSERT ALL RADIO STATIONS IN DROP-DOWN MENU **/
Radio.prototype.insertAllStations = function (containerSelector) {
  var self = this;
  var $container = $(containerSelector);
  var allStationsHtml = '';

  self.radioData.forEach((station, i, arr) => {
    if (!self.favoriteChannels.includes(station.radioId)) {
      allStationsHtml += self.stationTemplate(station);
    }
  });

  var clipboard = new Clipboard(".copy-clipboard", ".radio-all");
  $container.append(allStationsHtml);
};

/** INSERT USER'S FAVORITE RADIO STATIONS **/
Radio.prototype.insertUserStations = function (cssSelector) {
  var self = this;
  var $userPlayList = $(cssSelector);
  var userStations = '';

  // insert user's stations from favorites
  self.favoriteChannels.forEach(function (item, i, arr) {
    self.radioData.forEach(function (station, index, array) {
      if (+item === station.radioId) {
        // add active class to first station in favorites for jPlayer can play it
        userStations += self.stationTemplate(station);
      }
    });
  });

  $userPlayList.append(userStations);
};

/** Radio station template **/
Radio.prototype.stationTemplate = function (station) {
  var self = this;
  var active = '';

  var trackInfo = self.getTrackInfo(station.tracks);
  var socSearch = self.getHtmlSocialSearch(trackInfo);

  if (+self.playingChannel === +station.radioId) {
    active = ' active';
  }

  var userRadiostation =
    '<div class="station-row ' + active + '" \
                data-channel="' + station.radioId + '" \
                data-radio-url="' + station.radioUrl + '" \
                data-radio-name="' + station.radioTitle + '">\
             <div class="station-ico-holder">\
               ' + station.radioLogo + '\
             </div>\
             <div class="control-name-container">\
               <div class="play-pause-wrapper">\
                 ' + svg.radioPlay + '\
                 ' + svg.radioPause + '\
               </div>\
               <div class="track-info">\
                 <div class="artist" title="' + lang.lRadioTitleSinger + '">' + trackInfo.artist + '</div>\
                 <div class="track-name" title="' + lang.lRadioTitleSong + '">' + trackInfo.song + '</div>\
               </div>\
             </div>\
             <div class="volume-copy-block">\
               <div class="volume-control"></div>\
               ' + socSearch + '\
             </div>\
           </div>';

  return userRadiostation;
};

/** Get current track **/
Radio.prototype.getTrackInfo = function (tracksStr) {
  var self = this;

  var trackObj = {artist: '', song: ''};
  var stationLastTracks = !!tracksStr ? tracksStr.split('||') : false;

  // if tracks exists in DB, return its list
  if (stationLastTracks) {
    var trackStr = stationLastTracks[0];

    // if track string exists and it contains '-'
    if (!!trackStr && trackStr.indexOf('-') != -1) {
      trackObj.artist = trackStr.substring(0, trackStr.indexOf('-')) + ' - ';
      trackObj.song = trackStr.substring(trackStr.indexOf('-'));
    } else {
      trackObj.artist = trackStr;
    }
  }
  // if no any data about last tracks
  else {
    trackObj.artist = lang.lRadioNoArtist;
  }

  return trackObj;
};

/** JPLAYER INIT **/
Radio.prototype.JPlayerInit = function () {
  var self = this;

  $("#jquery_jplayer_1").jPlayer({
    ready: function () {

    },
    play: function (event) {
      var channel = $("#stations-list .station-row.active").attr('data-channel');

      self.url = event.jPlayer.status.src;
      self.updateRadioData();
      urlHash.pushState({playRadio: channel});
      self.playingChannel = channel;
    },
    pause: function (event) {
      urlHash.removeState('playRadio');
      document.title = lang.lRadioTitleSingle;

      self.playingChannel = false;
    },
    volumechange: function (event) {
      $('.jp-volume-bar').attr('title', Math.round(parseFloat(event.jPlayer.options.volume * 100)) + '%');
    },

    swfPath: "/assets/js/jplayer",
    cssSelectorAncestor: ".radio-all",
    supplied: "webmv, ogv, m4v, oga, mp3",
    preload: "none",
    wmode: "window",
    useStateClassSkin: true,
    autoBlur: false,
    keyEnabled: false,
    verticalVolume: true
  });
};

/** INSERT RADIO DATA INTO HTML EVERY 10 SEK**/
Radio.prototype.updateRadioData = function () {
  var self = this;

  $.post("/getAudioName", {url: self.url}, function (data) {
    $('#radio-container .copy-link-btn').show();
    $('#radio-container .find-track').show();

    var radioName = $("#stations-list .station-row.active").attr('data-radio-name');
    document.title = radioName + lang.lRadioPageTitleSong;

    if (data.artist && data.track) {
      if (data.artist.length == 0) data.artist = lang.lRadioNoArtistSingle;

      $("#current-station .artist").text(data.artist + ' -');
      $("#current-station .track-name").text('- ' + data.track);
      $('.copy-clipboard', '#current-station-copy-block').attr("data-clipboard-text", data.full);
    }
    else {
      $("#current-station .artist").text(lang.lRadioNoArtistSingle);
      $("#current-station .track-name").text('');
    }

    if (data) {
      radioName = $(".jp-playlist-current").html();
      var encodedSongTitle = encodeURIComponent(data.full);

      $(".copy-vk", '#current-station-copy-block').show().attr("href", "http://vk.com/audio?q=" + encodedSongTitle);
      $(".copy-gmusic", '#current-station-copy-block').show().attr("href", "https://play.google.com/music/listen#/sr/" + encodedSongTitle);
      $(".copy-ymusic", '#current-station-copy-block').show().attr("href", "https://music.yandex.ua/search?text=" + encodedSongTitle);
      $(".copy-sound-cloud", '#current-station-copy-block').show().attr("href", "https://soundcloud.com/search/sounds?q=" + encodedSongTitle);
      $(".copy-youtube", '#current-station-copy-block').show().attr("href", "https://www.youtube.com/results?search_query=" + encodedSongTitle);
    }
  }, "json")
    .fail(function () {
      $('#radio-container .copy-link-btn').hide();
      $('#radio-container .find-track').hide();
      $("#current-station .artist").text(lang.lRadioNoArtistSingle);
      $("#current-station .track-name").text('');
    });

  // auto update radio data
  clearTimeout(self.intervalID);
  self.intervalID = setTimeout(function () {
    self.updateRadioData();
  }, 10000);
};


// CORRECTLY REMOVE CHANNEL TO FAVORITES **/
Radio.prototype.removeChannelFromFavorite = function (stationId) {
  var self = this;
  // stationId = stationId;

  var indexToRemove = self.favoriteChannels.indexOf(stationId);
  self.favoriteChannels.splice(indexToRemove, 1);
  self.updateFavoriteChannels();
};

/** CORRECTLY ADD FAVORITE CHANNEL **/
Radio.prototype.addChannelToFavorite = function (stationId) {
  var self = this;
  stationId = stationId + '';

  // if channel already exists in favorites
  if (self.favoriteChannels.includes(stationId)) return;

  if (self.favoriteChannels.length < 6) {
    self.favoriteChannels.push(stationId);
  } else {
    self.favoriteChannels.shift(); // delete first element of favorite array
    self.favoriteChannels.push(stationId);
  }
  self.updateFavoriteChannels();
};

/** UPDATE FAVORITE CHANNELS **/
Radio.prototype.updateFavoriteChannels = function () {
  var self = this;

  if (!user.hash) {
    return;
  }

  // clean up empty slots in favorites array
  for (var i = 0; i < self.favoriteChannels.length; i++) {
    if (!self.favoriteChannels[i]) {
      self.favoriteChannels.splice(i, 1);
    }
  }

  // var favoritePacksStr = stickersAndEmoji.favoritePacks.join(',');
  self.socket.emit('updateFavoriteRadioStations', JSON.stringify({
    hash: user.hash,
    stations: self.favoriteChannels
  }));
};


/** TIMER FOR UPDATE RADIO HISTORY ***/
Radio.prototype.update = function () {
  var self = this;

  self.radioData.forEach(function (station, index, array) {
    var $station = $('.station-row[data-channel="' + station.radioId + '"]', '#stations-list');
    var trackInfo = self.getTrackInfo(station.tracks);

    $station.find('.artist', '.track-info').html(trackInfo.artist);
    $station.find('.track-name', '.track-info').html(trackInfo.song);
  })
};

/** TIMER FOR UPDATE RADIO HISTORY ***/
Radio.prototype.getUpdate = function (timer) {
  var self = this;

  setTimeout(function () {
    if ($('.radio-all').hasClass('show-list')) {
      self.socket.emit('getCache', 'radioAll');
    }

    self.getUpdate(timer);
  }, timer);
};

Radio.prototype.getHtmlSocialSearch = function (trackObj) {
  var self = this;

  var trackStr = trackObj.artist + trackObj.song;
  var trackStrEncoded = encodeURIComponent(trackStr);

  var searchHtml =
    '<div class="copy-clipboard" data-clipboard-text="' + trackStr + '" title="' + lang.lRadioSongTitleCopy + '">\
    <span class="copy-link-tooltip round-corners box-shadow" style="display: none;">' + lang.lRadioSongTitleCopySucsess + '</span>\
       ' + svg.copy + '\
     </div>\
     <!--<a class="copy-vk" href="http://vk.com/audio?q=' + trackStrEncoded + '" title=' + lang.lSearch + '" Вконтакте" target="_blank">\
       ' + svg.vk + '\
     </a>-->\
     <a class="copy-gmusic" href="https://play.google.com/music/listen#/sr/' + trackStrEncoded + '" title=' + lang.lSearch + '" Google Music" target="_blank">\
       ' + svg.googleMusic + '\
     </a>\
     <a class="copy-sound-cloud" href="https://soundcloud.com/search/sounds?q=' + trackStrEncoded + '" title=' + lang.lSearch + '" SoundCloud" target="_blank">\
       ' + svg.soundCloud + '\
     </a>\
     <!--<a class="copy-ymusic" href="https://music.yandex.ua/search?text=' + trackStrEncoded + '" title=' + lang.lSearch + '" Yandex Music" target="_blank">\
       ' + svg.yMusic + '\
     </a>-->\
     <a class="copy-youtube" href="https://www.youtube.com/results?search_query=' + trackStrEncoded + '" title=' + lang.lSearch + '" Youtube" target="_blank">\
       ' + svg.youtube + '\
     </a>';

  return searchHtml;
};
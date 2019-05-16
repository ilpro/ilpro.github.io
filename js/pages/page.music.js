'use strict';

Array.prototype.shuffle = function( b )
{
	var i = this.length, j, t;
	while( i )  {
		j = Math.floor( ( i-- ) * Math.random() );
		t = b && typeof this[i].shuffle!=='undefined' ? this[i].shuffle() : this[i];
		this[i] = this[j];
		this[j] = t;
	}
	return this;
};

const pageMusic = {
	socket: {},
	track: false,
	repeatOne: false,
	repeatAll: false,
	playRandom: false,
	arrRandomTrack: [],

	init ( socket ) {
		var self = this;

		self.socket = socket;
		
		self.socket.emit('getUserAudio', JSON.stringify({hash:user.hash}));
		self.socket.removeEventListener('getUserAudio');
		self.socket.on('getUserAudio', function (data) {
			data = JSON.parse(data);
			if(data.audio.length)
				self.insertMusic(data.audio);
		});
		
		self.socket.removeEventListener('removeUserAudio');
		self.socket.on('removeUserAudio', function (data) {
			data = JSON.parse(data);
			if(data.audioId) {
				$(".track[data-id=" + data.audioId + "]").fadeOut(300);
				if(parseInt(data.audioId) == parseInt(self.track.data("id")))
					self.playNext();
			}
		});
		
		$("#jplayer").jPlayer({
			swfPath: "/js/jplayer/jquery.jplayer.swf", 
			supplied: "mp3", 
			solution: "html, flash", 
			wmode: "window", 
			play: function(event){
				$(".tracklist .track").removeClass("active");
				self.track.addClass("active");
				var cover = self.track.find(".track__cover img").attr("src");
				$(".player .player__cover img").attr("src", ((cover != "/img/defaultCover.svg") ? cover : "/img/musicCoverPlayer.svg"));
				$(".player .player__title").text(self.track.find(".track__name").text());
				$(".player .control__play").removeClass("play").addClass("pause");
				// $("#audio .current .jp-volume-bar-value").css("width", (event.jPlayer.options.volume*100)+"%");
			}, 
			pause: function(event){
				$(".player .control__play").removeClass("pause").addClass("play");
			}, 
			volumechange: function(event){
				// $("#audio .current .jp-volume-bar-value").css("width", (event.jPlayer.options.volume*100)+"%");
			}, 
			timeupdate: function(event){
				$(".player .player__time").text("-" + self.convertTime(event.jPlayer.status.duration - event.jPlayer.status.currentTime));
				// $(".page-music .player .player__time .time-during").css("width", (event.jPlayer.status.seekPercent).toFixed(2)+"%");
				$(".player .timeline__progress").css("width", (event.jPlayer.status.currentPercentAbsolute).toFixed(2)+"%");
				// $("#audio .current h6").html($("h6", self.track).html());
			}, 
			ended: function(event){
				self.playNext();
			}
		});
		
		// ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ
		var $uploadPhotoArea = $(".upload");
		$uploadPhotoArea.upload({
			action: "/audio/upload-audio", 
			maxSize: 15728640, 
			postKey: "image", 
			postData: {hash:user.hash}, 
			label: '<svg class="upload__icoupload" xmlns="http://www.w3.org/2000/svg" width="30" height="33" viewBox="0 0 30 33">\
	<path opacity=".1" fill="#313133" d="M30 21.6c0 3-2.7 5.2-6 5.2-3 0-5.8-2.4-5.8-5.3 0-3 2.7-5.3 6-5.3\
	1.8 0 3.5.8 4.6 2V7.7l-17 2.2V27.4c0 3-2.7 5.3-6 5.3-3.2 0-5.8-2.4-5.8-5.3 0-3 2.6-5.3 6-5.3 1.8 0 3.5 1 4.6 2.2v-21c0-.2.2-.5.5-.5L29.4.3c.2 0 .4 0 .5.2l.2.4v20.6z"/></svg>\
<a href="#" class="upload__text">' + lang.lMusTrackAddTitle + '</a>\
<a href="#" class="upload__button">' + lang.lMusUploadLoadTitle + '</a><div class="overlay"><img src="/img/downloading.gif" alt="downloading">' + lang.lMusUploadWaitTitle + '</div>'
		});

		$uploadPhotoArea.on("start", function(obj, file, res){
			$uploadPhotoArea.addClass("loading");
		});

		$uploadPhotoArea.on("complete", function(obj, file, res){
			$uploadPhotoArea.removeClass("loading");
		});

		$uploadPhotoArea.on("filecomplete", function(obj, file, res){
			var data = JSON.parse(res);
			var html = '<div class="track" data-id="' + data.id + '" data-file="' + data.file + '">\
	<div class="track__play-cover">\
		<div class="track__cover">\
			<img src="' + ((data.cover) ? data.cover : "/img/defaultCover.svg") + '" alt="cover" style="max-width: 100%;">\
		</div>\
		<div class="track__name">' + data.artist + ((data.title) ? " - " + data.title : "") + '</div>\
	</div>\
	<span class="track__time">' + data.duration +'</span>\
	<span class="track__delete">\
		<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19">\
				<path fill="gray" d="M.2 18.8L18.8.2"></path>\
				<path fill="none" stroke="gray" stroke-width="2" stroke-miterlimit="10" d="M.2 18.8L18.8.2"></path>\
				<path fill="gray" d="M18.8 18.8L.2.2"></path>\
				<path fill="none" stroke="gray" stroke-width="2" stroke-miterlimit="10" d="M18.8 18.8L.2.2"></path>\
		</svg>\
	</span>\
	<a href="' + data.file + '" download><img src="/img/music-download-ico.svg" class="track__download" width="15" height="19"></a>\
	<a href="#" class="clipboard" data-clipboard-text="' + data.artist + ((data.title) ? " - " + data.title : "") + '" style="position:absolute;right:245px;top:19px;">\
		<span class="copy-link-tooltip round-corners box-shadow" style="display: none;">' + lang.lRadioSongTitleCopySucsess + '</span>\
		<img src="/img/music-copy.svg" class="track__text" width="16" height="19">\
	</a>\
	<a href="https://play.google.com/music/listen#/sr/' + data.artist + ((data.title) ? " - " + data.title : "") + '" target="_blank"><img src="/img/music-g-copy.svg" class="track__headphones" width="20" height="20"></a>\
	<a href="https://soundcloud.com/search/sounds?q=' + data.artist + ((data.title) ? " - " + data.title : "") + '" target="_blank"><img src="/img/music-scloud-copy.svg" class="track__soundcloud" width="46" height="20"></a>\
	<a href="https://www.youtube.com/results?search_query=' + data.artist + ((data.title) ? " - " + data.title : "") + '" target="_blank"><img src="/img/music-yt-copy.svg" class="track__youtube" width="29" height="20"></a>\
</div>';
			$(".tracklist").prepend(html);
			
			var btns = document.querySelectorAll('.clipboard');
			var clipboard = new Clipboard(btns[0]);
			
			self.arrRandomTrack.push(self.arrRandomTrack.length);
		});
		
		$(".tracklist").on("click", ".track__play-cover", function(){
			self.track = $(this).closest(".track");
			self.playTrack();
		});
		$(".tracklist").on("click", ".clipboard", function(e){
			e.preventDefault();
			
			var btn = $(this);
			
			var tooltip = btn.find(".copy-link-tooltip");
			if(tooltip.hasClass("copy-link-popup"))
				return false;

			tooltip.show().addClass("copy-link-popup");

			setTimeout(function (){
				tooltip.hide().removeClass("copy-link-popup");
			}, 1300);
		});
		
		$(".tracklist").on("click", ".track__delete", function(){
			var track = $(this).closest(".track");
			self.socket.emit('removeUserAudio', JSON.stringify({hash:user.hash, audioId:track.data("id")}));
		});
		$(".player .timeline").click(function(event){
			var offset = $(this).offset();
			var percent = ((((event.clientX - offset.left) / $(this).width()) * 100)).toFixed(2);
			$("#jplayer").jPlayer("playHead", percent);
		});
		$(".player .control__play").click(function(){
			if($(this).hasClass("play")){
				if(self.track)
					$("#jplayer").jPlayer("play");
				else {
					if(self.playRandom)
						self.track = $(".tracklist .track:eq(" + self.arrRandomTrack[0] + ")");
					else
						self.track = $(".tracklist .track:first");
					self.playTrack();
				}
			}
			else if($(this).hasClass("pause")) {
				$("#jplayer").jPlayer("pause");
			}
		});
		$(".player .control__prev").click(function(){
			self.playPrev();
			
		});
		$(".player .control__next").click(function(){
			self.playNext();
		});
		$(".player .control__loop").click(function(){
			$(this).toggleClass("active");
			self.repeatAll = !self.repeatAll;
		});
		$(".player .control__loop-once").click(function(){
			$(this).toggleClass("active");
			self.repeatOne = !self.repeatOne;
		});
		$(".player .control__mix").click(function(){
			$(this).toggleClass("active");
			self.playRandom = !self.playRandom;
		});

		var dragImgTimer;
		$("body, .fs-upload-element").on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
			e.preventDefault();
			e.stopPropagation();
		}).on('dragover dragenter', function() {
			clearTimeout(dragImgTimer);
			$(".fs-upload-element").addClass('is-dragover');
		}).on('dragleave dragend drop', function() {
			dragImgTimer = setTimeout(function () {
				$(".fs-upload-element").removeClass('is-dragover')
			},200)
		});
		
		$(document).on('click', '.search__icosearch, .search__close', function () {
			$('.search__icosearch').toggleClass('search__icosearch-active');
			$('.search__input').toggleClass('search__input-active');
			$('.search__close').toggleClass('search__close-active');
			$('.space').toggleClass('space-plus');
			$('.upload').toggleClass('hidden');
			$('.tracklist').toggleClass('hidden');
			$('.addtrack').toggleClass('hidden');
		});
	},
	
	insertMusic(data) {
		var self = this;
		
		var html = '';
		for(var i=0; i<data.length; i++) {
			self.arrRandomTrack.push(i);

			html += '<div class="track" data-id="' + data[i].audioId + '" data-file="' + data[i].audioFile + '">\
	<div class="track__play-cover">\
		<div class="track__cover">\
			<img src="' + ((data[i].audioCover) ? data[i].audioCover : "/img/defaultCover.svg") + '" alt="cover" style="max-width: 100%;">\
		</div>\
		<div class="track__name">' + data[i].audioArtist + ((data[i].audioTitle) ? " - " + data[i].audioTitle : "") + '</div>\
	</div>\
	<span class="track__time">' + data[i].audioDuration +'</span>\
	<span class="track__delete">\
		<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19">\
				<path fill="gray" d="M.2 18.8L18.8.2"></path>\
				<path fill="none" stroke="gray" stroke-width="2" stroke-miterlimit="10" d="M.2 18.8L18.8.2"></path>\
				<path fill="gray" d="M18.8 18.8L.2.2"></path>\
				<path fill="none" stroke="gray" stroke-width="2" stroke-miterlimit="10" d="M18.8 18.8L.2.2"></path>\
		</svg>\
	</span>\
	<a href="' + data[i].audioFile + '" download><img src="/img/music-download-ico.svg" class="track__download" width="15" height="19"></a>\
	<a href="#" class="clipboard" data-clipboard-text="' + data[i].audioArtist + ((data[i].audioTitle) ? " - " + data[i].audioTitle : "") + '" style="position:absolute;right:245px;top:19px;">\
		<span class="copy-link-tooltip round-corners box-shadow" style="display: none;">' + lang.lRadioSongTitleCopySucsess + '</span>\
		<img src="/img/music-copy.svg" class="track__text" width="16" height="19">\
	</a>\
	<a href="https://play.google.com/music/listen#/sr/' + data[i].audioArtist + ((data[i].audioTitle) ? " - " + data[i].audioTitle : "") + '" target="_blank"><img src="/img/music-g-copy.svg" class="track__headphones" width="20" height="20"></a>\
	<a href="https://soundcloud.com/search/sounds?q=' + data[i].audioArtist + ((data[i].audioTitle) ? " - " + data[i].audioTitle : "") + '" target="_blank"><img src="/img/music-scloud-copy.svg" class="track__soundcloud" width="46" height="20"></a>\
	<a href="https://www.youtube.com/results?search_query=' + data[i].audioArtist + ((data[i].audioTitle) ? " - " + data[i].audioTitle : "") + '" target="_blank"><img src="/img/music-yt-copy.svg" class="track__youtube" width="29" height="20"></a>\
</div>';
		}

		html += '<div style="text-align: center; text-transform: uppercase;font-weight: bold;padding: 20px 0 0;;font-size: 15px;color: #313133;">Як користуватися музичним сховищем (відеоінструкція):</div>\
		<div class="promo-radio" style="opacity: 1;">\
			<div class="popup-video-large">\
			<div class="wrapper-video">\
			<iframe class="popupframe" width="100%" src="https://www.youtube.com/embed/fpWRBQFRTec?rel=0&amp;controls=1&amp;showinfo=0&amp;autoplay=0" frameborder="0" allowfullscreen=""></iframe>\
			</div>\
			</div>\
			</div>';

		$(".tracklist").html(html);
		
		var btns = document.querySelectorAll('.clipboard');
		var clipboard = new Clipboard(btns);
		
		self.arrRandomTrack.shuffle();
	}, 
	
	convertTime(seconds) {
		seconds = parseInt(seconds);
		
		var minutes = Math.floor(seconds / 60);
		seconds = Math.round(seconds % 60);
		
		if(minutes < 10)
			minutes = minutes;
		if(seconds < 10)
			seconds = "0" + seconds;
		
		return minutes + ":" + seconds;
	},
	
	playTrack() {
		var self = this;
		
		$("#jplayer").jPlayer("setMedia", {"mp3":self.track.data("file")});
		$("#jplayer").jPlayer("unmute");
		$("#jplayer").jPlayer("play");
	}, 
	
	playPrev() {
		var self = this;
		
		if(self.repeatOne)
			self.playTrack();
		else {
			if(self.playRandom) {
				var current = $('.track').index(self.track);
				
				for(var i=0; i<self.arrRandomTrack.length; i++)
					if(current == self.arrRandomTrack[i])
						break;
				
				if(self.arrRandomTrack[i-1] != undefined) {
					self.track = $(".track:eq(" + self.arrRandomTrack[i-1] + ")");
					self.playTrack();
				}
				else if(self.repeatAll) {
					self.track = $(".track:eq(" + self.arrRandomTrack[self.arrRandomTrack.length - 1] + ")");
					self.playTrack();
				}
			}
			else {
				self.track = self.track.prev(".track");
				if(self.track.length)
					self.playTrack();
				else if(self.repeatAll) {
					self.track = $(".tracklist .track:first");
					self.playTrack();
				}
			}
		}
	},
	
	playNext() {
		var self = this;
		
		if(self.repeatOne)
			self.playTrack();
		else {
			if(self.playRandom) {
				var current = $('.track').index(self.track);
				
				for(var i=0; i<self.arrRandomTrack.length; i++)
					if(current == self.arrRandomTrack[i])
						break;
				
				if(self.arrRandomTrack[i+1] != undefined) {
					self.track = $(".track:eq(" + self.arrRandomTrack[i+1] + ")");
					self.playTrack();
				}
				else if(self.repeatAll) {
					self.arrRandomTrack.shuffle();
					self.track = $(".track:eq(" + self.arrRandomTrack[0] + ")");
					self.playTrack();
				}
			}
			else {
				self.track = self.track.next(".track");
				if(self.track.length)
					self.playTrack();
				else if(self.repeatAll) {
					self.track = $(".tracklist .track:first");
					self.playTrack();
				}
			}
		}
	}
}
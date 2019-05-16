'use strict';
const pageDemoNews = {
    init ( socket ) {
        let self = this;

        self.socket = socket;
        let city = urlHash.getState('city');
        self.city = !city ? 340 : city;

        // handlers
        self.initSocketHandlers();
        self.initHandlers();

    },

    initSocketHandlers () {
        let self = this;
        self.socket.emit('getDemoNewsByCity', JSON.stringify({city: self.city}));

        self.socket.on('getDemoNewsByCity', function (data) {
            data = JSON.parse(data);

            var myRibbonHTML = '';

            for (var i=0; i<data.length;i++){
                if(data[i].type === 'post'){
                    myRibbonHTML += pageFeed.ribbonData(data[i])
                } else if (data[i].type === 'news' && data[i].newsImg.match(/\.png|\.jpe?g/i)){
                    myRibbonHTML += self.postNewsData(data[i])
                }
            }

            $(".feed .feed-wrapper").html(myRibbonHTML);

            $(".feed-wrapper").off('click');
        });
    },

    initHandlers () {
        let self = this;
        $(".feed").on('click', function (e) {
            e.preventDefault();
            if(!user.hash){
                $('#login').click();
            } else {
                window.location = "https://www.emoment.com/"
            }
        })
    },

    postNewsData: function(data) {
        var active = '',
            pubTime,
            feedImg  = data.feedImageBig != '' ? data.feedImageBig : data.feedImage,
            date = data.newsTimePublic;

        if (!/offline/.test(date) && !/online/.test(date)) {
            pubTime = data.newsTimePublic
        } else if (/online/.test(date)) {
            pubTime = 'Щойно'
        } else {
            pubTime = 'Дуже давно'
        }
        return '<div class="post single-photo news" data-postid="' + data.urlId + '">\
                    <div class="postheader">\
                            <div class="user-avatar" title="">\
                                <img src="/media/feeds/' + feedImg + '" alt="user" style="max-width: 100%;">\
                            </div>\
                        <div class="postheader__name">' + data.feedTitle + '</div>\
                        <span class="postheader__time">' + pubTime + '</span>\
                    </div>\
                    <a style="display: block" href="' + data.newsUrl + '" target="_blank" class="postcontent">\
                        <div class="postcontent__media">\
                            <img src="' + data.newsImg + '"  class="postimg" style="max-width: 100%;min-width: 100%;">\
                        </div>\
                        <div class="postcontent__text">' + data.newsHeader + '\
                            <br> <span class="url-content">' + data.feedTitle + '</span>\
                        </div>\
                    </a>\
                    <div class="postinfo">\
                <div class="like">\
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 17 16">\
									<path fill="#313133" d="M8.5 2.94C9.16 1.28 10.55 0 12.28 0c1.45 0 2.66.76 3.6 1.83 1.32 1.46 1.9 \
								4.67-.5 7.02-1.25 1.2-6.85 7.13-6.85 7.13s-5.6-5.94-6.84-7.13C-.75 6.53-.2 3.32 1.16 1.83 2.12.77 \
								3.32 0 4.75 0c1.74 0 3.1 1.28 3.75 2.94"></path>\
								</svg>\
								<div class="likes">'
            + data.totalLikes +
            '</div>\
        </div>\
    </div>\
            </div>';
    },

};
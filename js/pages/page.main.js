"use strict";

const pageMain = {
  socket: {},
  isFirstLoad: true,
  currentNews: false, // there will be info about current news existing on main page
  newsFilter: {}, // there will be page params like pageMain.filter.sort = 'likes' and  pageMain.filter.period = 'hour';
  newsContainer: '#news-load-block',

  /** Init page **/
  init (socket) {
    this.socket = socket;
    
    // get users online
    usersOnline.init();

    // get hash values. If it is root of the site and no hash exists
    // set this.filter.sort = 'likes' and  this.filter.period = 'hour';
    this.getFilterParams();

    // handlers
    this.initSocketHandlers();
    this.initHandlers();

    // request for news
    getNewsRecommended(this.socket);
    this.socket.emit('getNews', JSON.stringify({filter: this.newsFilter}));

    // add css active class to active buttons
    this.addActiveClassToFilterButtons();

    //plugin for news mix
    this.initMixItUp();

    // start loop with timer that updates news on page
    this.update(120000);
  },

  /** MixItUp jQuery plugin **/
  initMixItUp () {
    $(this.newsContainer).mixItUp({
      load: {
        sort: 'order:asc' /* default:asc */
      },
      animation: {
        effects: 'fade scale', /* fade scale */
        duration: 700 /* 600 */
      },
      selectors: {
        target: '.news-box'
      },
      layout: {
        display: 'block'
      }
    });
  },

  /** Socket listeners **/
  initSocketHandlers () {
    // this.socket.on('newsRecommended', this.insertNewsRecommended.bind(this));
    this.socket.on('news', this.insertNews.bind(this));
  },


  /** Event listeners **/
  initHandlers () {
    const self = this;

    // click on menu buttons
    $('.main-wrapper').on('click', '.news-page .sort-menu-button', function(e) {
      $('.news-page .sort-menu-button').removeClass('active');
      $(this).addClass('active');
      var sort = $(this).data('value');
      urlHash.pushState({sort: sort});
      $('#news-load-block').html('<figure class="animation-loading">\
        <img src="img/loader-bw.gif" alt="loading-meadiastealer">\
        </figure>');
      self.getFilterParams();
      self.filterNews();
    });

    $('.main-wrapper').on('click', '.news-page .filter-menu-button', function(e) {
      $('.news-page .filter-menu-button').removeClass('active-filter');
      $(this).addClass('active-filter');
      var period = $(this).data('value');
      urlHash.pushState({period: period});
      $('#news-load-block').html('<figure class="animation-loading">\
        <img src="img/loader-bw.gif" alt="loading-meadiastealer">\
        </figure>');
      self.getFilterParams();
      self.filterNews();
    });
  },

  /** Insert news from Redis **/
  insertNews (data) {
    let newsArr = JSON.parse(data);
    let $newsContainer = $(this.newsContainer);

    $newsContainer.find('.animation-loading').remove();

    // add only new news
    this.addNewNews(newsArr);
    this.updateOldNews(newsArr);

    $newsContainer.mixItUp('sort', 'order:asc');

    setTimeout(function() {
      $('.new-item .news-item, .changed-item .news-item').css({'background': '#fff'});
    }, 2000);

    setTimeout(function() {
      $('.new-item .news-item, .changed-item .news-item').removeAttr('style');
      $('.new-item').removeClass('new-item');
      $('.changed-item').removeClass('changed-item');
    }, 3000);
  },

  /** Insert new news **/
  addNewNews (data) {
    var newsContainer = $(this.newsContainer);
    var newsList = [];

    // check which news already exists on page
    for(var i = 0; i < data.length; i++) {
      if(!$('.news-box[data-id=' + parseInt(data[i].urlId) + ']').length)
        newsList.push(i);
    }

    // add new news to page
    for(var j = 0; j < newsList.length; j++) {
      var newsElem = this.newsTemplate(data[newsList[j]], newsList[j], true);
      newsContainer.append(newsElem);
    }
  },


  /** Update existing news **/
  updateOldNews (data) {
    var self = this;

    $('.changed-val').removeClass('changed-val');

    $('.news-box').each(function() {
      var newsElem = $(this);
      var remove = true;

      for(var i = 0; i < data.length; i++) {
        if(newsElem.attr('data-id') == data[i].urlId) {
          var curr = newsElem.attr('data-order');

          newsElem.attr('data-order', i);

          if(curr > i) {
            newsElem.addClass('changed-item');
          }
          self.updateNewsCounts(newsElem, data[i]);
          remove = false;
        }
      }
      if(remove) {
        $(this).remove();
      }
    });
  },

  /** News template **/
  newsTemplate (value, order, isNew) {
    let likes = this.parseLikes(value.likes);
    let newsDate = formatDate(value.newsTimePublic);
    let commentExist = value.commentCount > 0 ? 'comments-have-msg' : 'comments-no-msg';
    isNew = isNew ? ' new-item' : '';
    let socialSharingTooltip = this.getSocialSharingTooltip(likes);

    var html = '<section class="news-box round-corners' + isNew + '"\
                       data-news-url="' + value.newsUrl + '" \
                       data-news-header="' + htmlEscape(value.newsHeader) + '" \
                       data-feed-id="' + value.feedId + '" \
                       data-id="' + value.urlId + '" \
                       data-order="' + order + '"> \
                    <div class="news-item">\
                        <a href="' + value.newsUrl + '" target="_blank" style="text-decoration: none" class="date">\
                            <div class="day">' + newsDate.day + '</div>\
                            <i class="ico time-small-ico"></i>\
                            <time class="time">' + newsDate.time + '</time>\
                        </a>\
                        <button class="btn comment-btn ' + commentExist + ' float-left">\
                            <i class="ico"></i>\
                            <div class="tooltip round-corners box-shadow">' + lang.lNewsOpenComm + ' (<span class="comment-val">' + value.commentCount + '</span>)</div>\
                        </button>\
                        <a class="donor float-left" href="' + value.newsUrl + '" target="_blank" title="' + value.feedTitle + '">\
                            <img class="donor-icon" src="/media/feeds/' + value.feedImage + '" alt="">\
                        </a>\
                        <a class="article float-left" target="_blank" href="' + value.newsUrl + '" title="' + htmlEscape(value.newsHeader) + '" style="white-space: nowrap">\
                            ' + value.newsHeader + '\
                        </a>\
                        <div class="news-icons-container float-right">\
                          <div class="social-block tooltip-viewed">\
                            <i class="ico viewed-small-ico"></i>\
                            <div class="text3-icons-news visit-val">' + value.newsVisits + '</div>\
                            <div class="tooltip round-corners box-shadow">' + lang.lNewsAllViews + '</div>\
                          </div>\
                          <div class="social-block tooltip-online">\
                            <i class="ico person_small-ico"></i>\
                            <div class="text3-icons-news online-val">' + value.newsOnline + '</div>\
                            <div class="tooltip round-corners box-shadow">' + lang.lNewsUsersOnline + '</div>\
                          </div>\
                          <div class="social-block tooltip-likes">\
                            <i class="ico thumbsup_small-ico"></i>\
                            <div class="text3-icons-news likes-val">' + likes.sum + '</div>\
                            ' + socialSharingTooltip + '\
                          </div>\
                        </div>\
                    </div>\
                  </section>';

    return html;
  },


  /** Update news info like social like number **/
  updateNewsCounts  (elem, value) {
    var likes = this.parseLikes(value.likes);

    var visitVal = elem.find('.visit-val').text();
    var onlineVal = elem.find('.online-val').text();
    var likesVal = elem.find('.likes-val').text();
    var commentVal = elem.find('.comment-val').text();

    elem.find('.visit-val').text(value.newsVisits);
    elem.find('.online-val').text(value.newsOnline);
    elem.find('.likes-val').text(likes.sum);
    elem.find('.comment-val').text(value.commentCount);

    // fb social
    elem.find('.tooltip-item[data-soc-counter="fbTotal"] span').text(likes.fbTotal);
    elem.find('.tooltip-item[data-soc-counter="fbShare"] span').text(likes.fbShare);
    elem.find('.tooltip-item[data-soc-counter="fbLikes"] span').text(likes.fbLikes);
    elem.find('.tooltip-item[data-soc-counter="fbComments"] span').text(likes.fbComments);

    //vk social
    elem.find('.tooltip-item[data-soc-counter="vkTotal"] span').text(likes.vkTotal);
    elem.find('.tooltip-item[data-soc-counter="vkShare"] span').text(likes.vkShare);

    // gp social
    elem.find('.tooltip-item[data-soc-counter="gpTotal"] span').text(likes.gpTotal);
    elem.find('.tooltip-item[data-soc-counter="gpShare"] span').text(likes.gpShare);

    //ok social
    elem.find('.tooltip-item[data-soc-counter="okTotal"] span').text(likes.okTotal);
    elem.find('.tooltip-item[data-soc-counter="okShare"] span').text(likes.okShare);

    // ms social
    elem.find('.tooltip-item[data-soc-counter="msTotal"] span').text(likes.msTotal);
    elem.find('.tooltip-item[data-soc-counter="msShare"] span').text(likes.msShare);
    elem.find('.tooltip-item[data-soc-counter="msLikes"] span').text(likes.msLikes);
    elem.find('.tooltip-item[data-soc-counter="msComments"] span').text(likes.msComments);

    if(visitVal != value.newsVisits)
      elem.find('.visit-val').parent().addClass('changed-val');
    if(onlineVal != value.newsOnline)
      elem.find('.online-val').parent().addClass('changed-val');
    if(likesVal != likes.sum)
      elem.find('.likes-val').parent().addClass('changed-val');
    if(commentVal != value.commentCount) {
      var btn = elem.find('.comment-btn');
      btn.addClass('changed-val');
      if(!btn.hasClass('comments-have-msg')) {
        btn.removeClass('comments-no-msg').addClass('comments-have-msg');
      }
    }
  },


  /** Social sharing info tooltip template **/
  getSocialSharingTooltip (likes) {

    let socialSharingTooltip =
      '<div class="tooltip round-corners box-shadow">\
         <div class="tooltip__social-box">\
           <div class="tooltip-item" data-soc-counter="fbTotal">\
             <figure><i class="ico facebook-active-ico"></i></figure>\
             <span>' + likes.fbTotal + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="fbShare">\
           <figure><i class="ico repost-fb-ico"></i></figure>\
           <span>' + likes.fbShare + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="fbLikes">\
           <figure><i class="ico like-fb-ico"></i></figure>\
           <span>' + likes.fbLikes + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="fbComments">\
           <figure><i class="ico comment-fb-ico"></i></figure>\
           <span>' + likes.fbComments + '</span>\
         </div>\
       </div>\
       <div class="tooltip__social-box">\
         <div class="tooltip-item" data-soc-counter="vkTotal">\
           <figure><i class="ico vk-active-ico"></i></figure>\
           <span>' + likes.vkTotal + '</span>\
         </div>\
         <div class="tooltip-item vk-share" data-soc-counter="vkShare">\
           <figure><i class="ico repost-vk-ico"></i></figure>\
           <span>' + likes.vkShare + '</span>\
         </div>\
         <div class="tooltip-item">\
           <figure><i class="ico like-unactive-ico"></i></figure>\
           <span>x</span>\
         </div>\
         <div class="tooltip-item">\
           <figure><i class="ico comment-unactive-ico"></i></figure>\
           <span>x</span>\
         </div>\
       </div>\
       <div class="tooltip__social-box">\
         <div class="tooltip-item" data-soc-counter="gpTotal">\
           <figure><i class="ico google-active-ico"></i></figure>\
           <span>' + likes.gpTotal + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="gpShare">\
           <figure><i class="ico repost-gp-ico"></i></figure>\
           <span>' + likes.gpShare + '</span>\
         </div>\
         <div class="tooltip-item">\
           <figure><i class="ico like-unactive-ico"></i></figure>\
           <span>x</span>\
         </div>\
         <div class="tooltip-item">\
           <figure><i class="ico comment-unactive-ico"></i></figure>\
           <span>x</span>\
         </div>\
       </div>\
       <div class="tooltip__social-box">\
         <div class="tooltip-item" data-soc-counter="okTotal">\
           <figure><i class="ico odnoklassniki-active-ico"></i></figure>\
           <span>' + likes.okTotal + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="okShare">\
           <figure><i class="ico repost-ok-ico"></i></figure>\
           <span>' + likes.okShare + '</span>\
         </div>\
         <div class="tooltip-item">\
           <figure><i class="ico like-unactive-ico"></i></figure>\
           <span>x</span>\
         </div>\
         <div class="tooltip-item">\
           <figure><i class="ico comment-unactive-ico"></i></figure>\
           <span>x</span>\
         </div>\
       </div>\
       <div class="tooltip__social-box">\
         <div class="tooltip-item" data-soc-counter="msTotal">\
           <figure><i class="ico ms-active-ico"></i></figure>\
           <span>' + likes.msTotal + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="msShare">\
           <figure><i class="ico repost-ms-ico"></i></figure>\
           <span>' + likes.msShare + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="msLikes">\
           <figure><i class="ico like-ms-ico"></i></figure>\
           <span>' + likes.msLikes + '</span>\
         </div>\
         <div class="tooltip-item" data-soc-counter="msComments">\
           <figure><i class="ico comment-ms-ico"></i></figure>\
           <span>' + likes.msComments + '</span>\
         </div>\
       </div>\
     </div>';

    return socialSharingTooltip;
  },


  /** Read current hash and put it into object params **/
  getFilterParams(){
    this.newsFilter.sort = (urlHash.getState('sort')) ? urlHash.getState('sort') : 'likes';
    this.newsFilter.period = (urlHash.getState('period')) ? urlHash.getState('period') : 'today';
  },

  /** Highlight selected news filter buttons **/
  addActiveClassToFilterButtons() {
    $('.news-page .sort-menu-button[data-value=' + this.newsFilter.sort + ']').addClass('active');
    $('.news-page .filter-menu-button[data-value=' + this.newsFilter.period + ']').addClass('active-filter');
  },

  parseLikes(_likes) {
    var likes;
    try {
      likes = JSON.parse(_likes);
      // t = total
      // l = likes
      // s = share
      // c = count of comments
      if(!!likes[4]) {
        return {
          sum: likes[0].t + likes[1].t + likes[2].t + likes[3].t + likes[4].t,
          fbTotal: likes[0].t, fbLikes: likes[0].l, fbShare: likes[0].s, fbComments: likes[0].c,
          vkTotal: likes[1].t, vkLikes: likes[1].l, vkShare: likes[1].s, vkComments: likes[1].c,
          gpTotal: likes[2].t, gpLikes: likes[2].l, gpShare: likes[2].s, gpComments: likes[2].c,
          okTotal: likes[3].t, okLikes: likes[3].l, okShare: likes[3].s, okComments: likes[3].c,
          msTotal: likes[4].t, msLikes: likes[4].l, msShare: likes[4].s, msComments: likes[4].c
        };
      } else {
        return {
          sum: likes[0].t + likes[1].t + likes[2].t + likes[3].t,
          fbTotal: likes[0].t, fbLikes: likes[0].l, fbShare: likes[0].s, fbComments: likes[0].c,
          vkTotal: likes[1].t, vkLikes: likes[1].l, vkShare: likes[1].s, vkComments: likes[1].c,
          gpTotal: likes[2].t, gpLikes: likes[2].l, gpShare: likes[2].s, gpComments: likes[2].c,
          okTotal: likes[3].t, okLikes: likes[3].l, okShare: likes[3].s, okComments: likes[3].c,
          msTotal: 0, msLikes: 0, msShare: 0, msComments: 0
        };
      }
    } catch(e) {
      return {fb: 0, vk: 0, gp: 0, ok: 0};
    }
  },

  /** Update news after several interval **/
  update(timeMs){
    // checks if main page still opened, if not, stops requests for news
    if($(this.newsContainer).length > 0) {
      // start css line animation
      this.startLoadTimerAnimation(timeMs);

      setTimeout(()=> {
        this.socket.emit('getNews', JSON.stringify({filter: this.newsFilter}));
        this.update(timeMs);
      }, timeMs)
    }
  },

  /** Animate moving of line that shows, when new news will be loaded **/
  startLoadTimerAnimation (timeMs) {
    let elem = document.querySelector('.progress', '#news-load-timer');
    let timer = +timeMs - 400;

    elem.style.cssText = '';

    setTimeout(function (){
      elem.style.cssText =
        'width: 0; \
         transition-property: width;\
         transition-duration: '+ timer +'ms;\
       transition-timing-function: linear';
    }, 50);

    setTimeout(function (){
      elem.style.width = '100%';
    }, 100);

  },

  filterNews () {
    if(this.newsFilter.period == 'yesterday' && this.newsFilter.sort == 'time') {
      $('#news-load-block').html('<div class="search-result-img"></div>');
    }
    else if(this.newsFilter.period == 'yesterday' && this.newsFilter.sort == 'online') {
      $('#news-load-block').html('<div class="search-result-img img-3"></div>');
    }
    else {
      this.socket.emit('getNews', JSON.stringify({filter: this.newsFilter}));
    }
  },

  // /*** Insert recommended news from cache ***/
  // insertNewsRecommended(data){
  //   var recommendedNewsArr = JSON.parse(data);
  //
  //   if(recommendedNewsArr.length === 0){
  //     return;
  //   }
  //
  //   var $container = $('.recommended-news');
  //
  //   $container.empty();
  //
  //   recommendedNewsArr.forEach(function(item, i, arr) {
  //     var newsDate = formatDate(item.insertTime);
  //     var newsItem =
  //       '<section style="display: block;" class="recommended-news-box round-corners">\
  //        <div class="news-item">\
  //          <div class="date">\
  //            <div class="day">' + newsDate.day + '</div>\
  //          <i class="ico time-small-ico"></i>\
  //          <time class="time">' + newsDate.time + '</time>\
  //        </div>\
  //        <button class="btn comment-btn comments-no-msg float-left">\
  //          <i class="ico"></i>\
  //          <div class="tooltip round-corners box-shadow">Открыть комментарии (<span class="comment-val">0</span>)</div>\
  //        </button>\
  //        <div class="donor float-left">\
  //          <img class="donor-icon" src="/media/feeds/' + item.urlFavicon + '" alt="">\
  //        </div>\
  //        <a class="article float-left" target="_blank" href="/view/2/' + item.linkId + '" title="' + htmlEscape(item.urlTitle) + '" style="white-space: nowrap">\
  //          ' + item.urlTitle + '\
  //        </a>\
  //     </div>\
  //     </section>';
  //
  //     $container.append(newsItem);
  //   });
  //
  //   $container.show(); // display: block for container;
  // },
};
"use strict";
/******* COMMENTS WIDGET CONSTRUCTOR **********/
var pageBannersStatistics = {
  socket: {},
  isFirstLoad: true,
  widgetStatistic: [],

  init(socket) {
    var self = this;

    if (self.isFirstLoad) {
      self.socket = socket;
      self.initSocketHandlers();
      self.isFirstLoad = false;
    }

    self.initEventHandlers();

    // get sites list at first
    self.socket.emit('getBannerSitesList', JSON.stringify({hash: user.info.hash}));

    // show/hide admin panel which links user to domain
    if (user.info.userRole >= 50) {
      $('.adm').css('opacity', 1);
    }
  },

  /** Listeners **/
  initSocketHandlers() {
    var self = this;

    // handle register
    self.socket.on('bannersSitesList', function (data) {
      data = JSON.parse(data);
      self.insertSitesList(data);
      self.insertSavedUserInfo(data[0].price);
      self.getStatistic(data[0].domainId, data[0].bannerId);
    });

    // handle register
    self.socket.on('bannerStatistic', function (data) {
      self.widgetStatistic = JSON.parse(data);
      self.insertWidgetStatistic();

      var price = +$('.author option:selected').attr('data-price');
      if(price){
        self.calcPrice(price);
      }
    });

    // success/error messages
    self.socket.on('bindPriceToBanner', function (data) {
      data = JSON.parse(data);
      if (data.success) {
        $('.author [data-bannerid="'+ data.bannerId +'"]').attr('data-price', data.price);
        showNotify("success", lang.lProfileSave);
      }
      else {
        showNotify("danger", lang.lProfileSaveErr);
      }
    });
  },

  /** Event handlers like click **/
  initEventHandlers () {
    var self = this;

    // get widget statistic for selected domain
    $(".author").change(function () {
      var domainId = $('.author option:selected').attr('data-domainId');
      var bannerId = $('.author option:selected').attr('data-bannerId');
      var price = $('.author option:selected').attr('data-price');
      self.getStatistic(domainId, bannerId);
      self.insertSavedUserInfo(price);
    });

    // recalculate price in all rows
    $('#price').on('input', function () {
      self.calcPrice($(this).val());
    });

    // bind price to banner
    $('.save-button').click(function () {
      var price = +($('#price').val());
      var bannerId = $('.author option:selected').attr('data-bannerid');
    
      if (!bannerId || bannerId.length === 0) {
        alert('Пожалуйста выберите домен');
        return;
      }

      if(!$.isNumeric(price)){
        $('#price').focus();
        alert('Пожалуйста, введите корректное число');
      }
    
      if(price) {
        self.bindBannerPrice(bannerId, price);
      }
    });

    // sorting
    $('.heading-item').click(function () {
      var filter = $(this).attr('data-filter');
      var order = $(this).attr('data-order');

      $('.heading-item').removeClass('active').filter($(this)).addClass('active');

      if (filter === 'price') {
        self.sortStatisticbyPrice($(this))
      } else {
        self.sortStatisticArr($(this));
        self.insertWidgetStatistic(filter);

        var price = +$('.author option:selected').attr('data-price');
        if(price) self.calcPrice(price)
      }
    });
  },

  /** Get widget statistic for selected domain **/
  getStatistic (domainId, bannerId) {
    var self = this;
    self.socket.emit('getBannerStatistic', JSON.stringify({
      hash: user.info.hash,
      domainId: domainId,
      bannerId: bannerId
    }));
  },

  /** Recalculate price in all rows **/
  calcPrice(val) {
    var priceTotal = 0;
    var price = +val;

    $('.body-row').each(function (i, elem) {
      var views = +$(this).find('.views').text();
      var calculatedPrice = 0;
      if (views > 0) {
        calculatedPrice = ((views / 1000) * price).toFixed(3);
      }
      $(this).find('.price').html(calculatedPrice);
      priceTotal += +calculatedPrice;
    });

    $('#price-total').text((priceTotal).toFixed(3));
  },

  /**  Bind price to domain  (for admin only) **/
  bindBannerPrice(bannerId, price) {
    var self = this;

    var sendData = {
      hash: user.info.hash,
      bannerId: bannerId,
      price: price
    };

    self.socket.emit('bindPriceToBanner', JSON.stringify(sendData));
  },

  /** Insert domain's list into html **/
  insertSitesList (data) {
    var html = '';

    for (var i = 0; i < data.length; i++) {
      html += '<option data-domainId="' + data[i].domainId + '" \
                       data-bannerId="' + data[i].bannerId + '" \
                       data-userId="' + +data[i].userId + '" \
                       data-price="' + +data[i].price + '">' +
                data[i].domain + ', ' + data[i].bannerName + ', ' + data[i].size +
      '</option>'
    }

    $('.author').html(html).removeAttr('style');
  },


  insertSavedUserInfo (price) {
    if(+price){
      $('#price').val(+price);
    } else {
      $('#price').val('');
    }
  },

  /** Insert statistic into html **/
  insertWidgetStatistic(filter) {
    var self = this;
    var rows = '';
    var statsArr = self.widgetStatistic.rows;
    var len = statsArr.length;

    for (var i = 0; i < len; i++) {
      var item = statsArr[i];
      var date = message.formatDate(item.time);
      var percentage = 0;
      
      if(filter){
        switch (filter) {
          case 'views':
            percentage = (+item.views * 100) / +self.widgetStatistic.maxViews;
            break;
          case 'viewsUnique':
            percentage = (+item.viewsUnique * 100) / +self.widgetStatistic.maxViewsUnique;
            break;
          case 'clicks':
            percentage = (+item.clicks * 100) / +self.widgetStatistic.maxClicks;
            break;
          case 'clicksUnique':
            percentage = (+item.clicksUnique * 100) / +self.widgetStatistic.maxClicksUnique;
            break;
          case 'requests':
            percentage = (+item.requests * 100) / +self.widgetStatistic.maxRequests;
            break;
          case 'ctr':
            percentage = (+item.ctr * 100) / +self.widgetStatistic.maxCtr;
        }
      }

      rows +=
        '<div class="body-row">\
           <div class="row-content-part">\
             <div class="left-content-info">\
               <div class="table-row-item company-name" data-time="' + item.time + '">' + date.day + '</div>\
             </div>\
           <div class="right-content-fill">\
             <div class="filler" style="width: '+ percentage +'%"></div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 '+ svg.requests +'\
               </div>\
               <div class="item-number">' + +item.requests + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.eye + '\
               </div>\
               <div class="item-number views">' + +item.views + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.aim + '\
               </div>\
               <div class="item-number">' + +item.viewsUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrow + '\
               </div>\
               <div class="item-number">' + +item.clicks + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrowInCircle + '\
               </div>\
               <div class="item-number">' + +item.clicksUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerFinger + '\
               </div>\
               <div class="item-number ctr">' + +item.ctr + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.coinSmall + '\
               </div>\
               <div class="item-number price">0</div>\
             </div>\
           </div>\
         </div>\
       </div>';
    }

    $('#banner-table').html(rows);
  },

  /** Sort array by specified filter string **/
  sortStatisticArr ($elem){
    var self = this;
    var filter = $elem.attr('data-filter');
    var order = $elem.attr('data-order');
    var arr = self.widgetStatistic.rows;

    // basic functions for clicks, views, clicksUnique and viewsUnique
    var sortingFunc = function (a, b) {
      return b[filter] - a[filter]
    };
    var sortingFuncReversed = function (a, b) {
      return a[filter] - b[filter]
    };

    // if time filter clicked, get data
    if (filter === 'time') {
      sortingFunc = function (a, b) {
        return new Date(b.time) - new Date(a.time)
      };
      sortingFuncReversed = function (a, b) {
        return new Date(a.time) - new Date(b.time)
      };
    }

    // if other filters clicked (clicks, views, clicksUnique and viewsUnique)
    if (order === 'desc') {
      $('.heading-item').attr('data-order', 'desc');
      $elem.attr('data-order', 'asc');
      arr.sort(sortingFunc);
    } else {
      $elem.attr('data-order', 'desc');
      arr.sort(sortingFuncReversed);
    }
  },

  sortStatisticbyPrice ($elem) {
    var self = this;
    var filter = $elem.attr('data-filter');
    var order = $elem.attr('data-order');
    var arr = $(".body-row");
    var html = '';
    var maxPrice = 0;

    $(".body-row").each(function (){
      var price = +$(this).find('.price').text();
      if(price > maxPrice){
        maxPrice = price;
      }
    });

    arr.sort(function (a, b) {
      if (order === 'desc') {
        $('.heading-item').attr('data-order', 'desc');
        $elem.attr('data-order', 'asc');
        return +($(b).find('.' + filter).html()) - +($(a).find('.' + filter).html());
      } else {
        $elem.attr('data-order', 'desc');
        return +($(a).find('.' + filter).html()) - +($(b).find('.' + filter).html());
      }
    }).each(function () {
      var elemHtml = $(this).html();
      html += '<div class="body-row">' + elemHtml + '</div>';
    });

    $('#banner-table').html(html);

    $('.body-row').each(function (){
      var price = +$(this).find('.price').text();
      $(this).find('.filler').css('width', (price * 100) / maxPrice + '%');
    });
  },
};
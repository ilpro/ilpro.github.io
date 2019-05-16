'use strict';

var pagePartnershipBanners = {
  socket: {},
  isFirstLoad: true,
  bannerSizes: [],
  allBannersStatistic: {},
  bannerStatistic: [],

  /** Init **/
  init: function (socket) {
    var self = this;
    self.socket = socket;

    if (self.isFirstLoad) {
      self.initSocketHandlers();
      self.isFirstLoad = false;
    }

    self.initEventHandlers();
    self.getSitesList();
    self.getBannerSizesList();

    setTodayDate();

    // show input price window for admin
    if (user.info.userRole >= 50) {
      $('#price-info').hide();
    }
  },

  /** Event listeners like 'click' **/
  initEventHandlers: function () {
    var self = this;

    // get widget statistic for selected domain
    $("#domain").change(function () {
      var domainId = $('#domain option:selected').attr('data-domainId');
      self.getExistingBanners(domainId);

      $('#banner-table').empty();
    });

    // get statistic by day/week/month/total
    $(document).on('click', '.filter-item', '.date-filter', function () {
      $('.filter-item').removeClass('active').filter($(this)).addClass('active');

      if ($('#existing-banners-wrapper .body-row.active').length > 0) {
        var bannerId = $('#existing-banners-wrapper .body-row.active').attr('data-banner-id');
        self.getStatisticByBannerId(bannerId);
      }

      var domainId = $('#domain option:selected').attr('data-domainId');
      self.getExistingBanners(domainId);
    });

    // sorting
    $(document).on('click', '.heading-item[data-filter]', function () {
      var filter = $(this).attr('data-filter');

      $('.heading-item').removeClass('active').filter($(this)).addClass('active');

      if ($('#existing-banners-wrapper .body-row.active').length === 0) {
        self.sortStatisticByFilter($(this), self.allBannersStatistic.banners);
        self.insertExistingBanners(filter);
      } else {
        self.sortStatisticByFilter($(this), self.allBannersStatistic.banners, self.bannerStatistic.statistics);
        self.sortStatisticByFilter($(this), self.allBannersStatistic.banners);
        self.insertExistingBanners(filter);
        self.insertBannerStatistic(filter);
      }
    });

    // show more statistic for selected banner
    $(document).on('click', '#existing-banners-wrapper .body-row', function (e) {
      // return if edit button clicked
      var clickedItem = e.target;
      if (clickedItem.closest('.edit-button')) {
        return
      }

      // or show more statistic
      var bannerId = $(this).attr('data-banner-id');
      $('#existing-banners-wrapper .body-row').removeClass('active').filter($(this)).addClass('active');
      $('#existing-banners-wrapper').attr('data-banner-active', bannerId);
      self.getStatisticByBannerId(bannerId);
    });

    // show modal create banner window
    $(document).on('click', '#show-save-banner-modal', function () {
      // clear fields
      $('#modal-create-banner').removeAttr('data-banner-id');
      $('#banner-size option').prop('selected', false).first().prop('selected', true);

      // hide buttons
      $('#show-code').hide();
      $('#delete-banner').hide();
      $('.banner-price-holder').hide();

      $('#modal-create-banner, .bg-shadow').addClass('active');
    });

    // insert parameters when edit button clicked for existing banner
    $(document).on('click', '.edit-button', function () {
      var bannerId = +$(this).closest('.body-row').attr('data-banner-id');
      $('#modal-create-banner').attr('data-banner-id', bannerId);

      var bannerPrice = +$(this).closest('.body-row').attr('data-banner-price');
      $('#price-info').html(bannerPrice);

      var bannerName = $(this).closest('.body-row').find('.bannerName').text();
      $('#banner-name').val(bannerName);

      var bannerSizeId = +$(this).closest('.body-row').attr('data-banner-size-id');
      $('#banner-size option').prop('selected', false);
      $('#banner-size [data-banner-size-id="' + bannerSizeId + '"]').prop('selected', true);

      // show buttons if the hidden
      $('#show-code').show();
      $('#delete-banner').show();
      $('.banner-price-holder').show();

      $('#modal-create-banner, .bg-shadow').addClass('active');
    });

    // show delete banner confirm modal
    $(document).on('click', '#delete-banner', function () {
      $('#delete-banner-confirm').addClass('active');
      $('#modal-create-banner').removeClass('active');
      // self.deleteBanner($('#modal-create-banner').attr('data-banner-id'));
    });

    // delete banner
    $(document).on('click', '#delete-banner-yes', function () {
      self.deleteBanner($('#modal-create-banner').attr('data-banner-id'));
    });

    // cancel banner delete modal
    $(document).on('click', '#delete-banner-no', function () {
      $('#delete-banner-confirm').removeClass('active');
      $('#modal-create-banner').addClass('active');
    });

    // // attach domain
    // $(document).off('click', '#save-domain').on('click', '#save-domain', function () {
    //   self.attachDomain();
    // });

    // add new banner
    $(document).off('click', '#save-banner').on('click', '#save-banner', function () {
      if (!self.checkFields()) return;
      self.saveBanner();
    });

    // close modal create banner window
    $(document).on('click', '#modal-create-banner .close-cross, .banner-btn.save, .bg-shadow, #delete-banner-yes', function () {
      $('#modal-create-banner, #delete-banner-confirm, .bg-shadow').removeClass('active');
    });

    // show copy code modal
    $(document).on('click', '#show-code', function () {
      $('.form-banner-code').addClass('active');
      self.showGeneratedBannerCode($('#modal-create-banner').attr('data-banner-id'));
    });

    // close copy code modal
    $(document).on('click', '.form-banner-code .close-cross', function () {
      $('.form-banner-code').removeClass('active');
    });
  },

  /** Socket listeners **/
  initSocketHandlers() {
    var self = this;

    // insert sites list
    self.socket.off('getUserDomains').on('getUserDomains', data => {
      data = JSON.parse(data)
      self.insertSitesList(data);
    });

    // insert banners sizes in modal window select
    self.socket.off('getBannerSizes').on('getBannerSizes', data => {
      data = JSON.parse(data)
      self.insertBannerSizesList(data)
    });

    // insert already created banners with statistic
    self.socket.off('getBannersStatisticsByDomain').on('getBannersStatisticsByDomain', function (data) {
      self.allBannersStatistic = JSON.parse(data);

      // sort by views by default
      var filter = '';
      if ($('.heading-item.active', '#filter-2').length === 0) {
        filter = 'views';
      }

      self.insertExistingBanners(filter);
    });

    // insert already created banners with statistic
    self.socket.off('getBannerStatistics').on('getBannerStatistics', function (data) {
      self.bannerStatistic = JSON.parse(data);

      // sort by views by default
      var filter = '';
      if ($('.heading-item.active', '#filter-2').length === 0) {
        filter = 'views';
      }

      self.insertBannerStatistic(filter);
    });

    // insert generated code
    self.socket.off('saveBanner').on('saveBanner', function (data) {
      data = JSON.parse(data);

      if (data.isUpdated) {
        showNotify("success", lang.lProfileSave);
        return self.updateBannerRowHtml(data);
      }

      // update current banners
      const domainId = $("#domain option:selected").attr('data-domainId');
      self.getExistingBanners(domainId);

      // show banner control buttons
      $('#show-code').show();
      $('#delete-banner').show();
      $('.banner-price-holder').hide();

      // open window with code
      self.showGeneratedBannerCode(data.bannerId);
    });

    self.socket.off('deleteBanner').on('deleteBanner', function (data) {
      data = JSON.parse(data);
      if (data.success) {
        showNotify("success", lang.lProfileSave);
        $('.body-row[data-banner-id="' + data.bannerId + '"]', '#existing-banners-wrapper').remove();
      } else {
        showNotify("danger", lang.lProfileSaveErr)
      }
    });

    self.socket.off('attachUserToDomain').on('attachUserToDomain', function (data) {
      data = JSON.parse(data)
      if (data.status === 'ALREADY_EXISTS') {
        showNotify('danger', data.message)
      }
      $('#domain-input').val('')
      self.getSitesList();
    });
  },

  /** Get Sites list **/
  getSitesList() {
    var self = this;
    // get sites list and banner sizes
    self.socket.emit('getUserDomains', JSON.stringify({
      hash: user.info.hash
    }));
  },

  /** Insert domain's list into html **/
  insertSitesList(res) {
    const data = res.domains;

    if (!data.length) return

    var html = '<option>Домен</option>';

    const sorted = data.sort((a, b) => {
      if (+a.bannersCount < +b.bannersCount) {
        return 1
      } else {
        return -1
      }
    });


    for (var i = 0; i < sorted.length; i++) {
      var bannersExistsStyles = '';
      var count = +sorted[i].bannersCount;

      if (count) {
        bannersExistsStyles = 'style="font-weight: bold"';
      }
      html +=
        '<option data-domainId="' + sorted[i].domainId + '" ' + bannersExistsStyles + '>' +
        sorted[i].domain + '(' + count + ')' +
        '</option>'
    }

    $('#domain').html(html);

    $('#banner-section').show()
  },

  /** Get widget dating domain's list ***/
  getBannerSizesList() {
    var self = this;
    self.socket.emit('getBannerSizes');
  },

  /** Insert banners sizes list into html **/
  insertBannerSizesList(data) {
    var self = this;
    self.bannerSizes = data;
    var html = '<option value="false">Розмiр</option>';

    for (var i = 0; i < self.bannerSizes.length; i++) {
      var size = self.bannerSizes[i];
      html += '<option value="' + size.size + '" data-banner-size-id="' + size.bannerSizeId + '">' + size.size + '</option>'
    }

    $('#banner-size').html(html);
  },

  /** Get all banners by domain Id **/
  getExistingBanners(domainId) {
    var self = this;
    var filter = $('.filter-item.active').attr('data-filter');

    self.socket.emit('getBannersStatisticsByDomain', JSON.stringify({
      hash: user.info.hash,
      domainId: domainId,
      period: filter
    }));

    // clear table and show boot animation
    $('#existing-banners-wrapper').empty();
    $('#loading-1').show();
  },

  insertExistingBanners(filter) {
    var self = this;
    var existingBannersHtml = '';
    var totalIncome = 0;

    for (var i = 0; i < self.allBannersStatistic.banners.length; i++) {
      var banner = self.allBannersStatistic.banners[i];
      var percentage = 0;

      if (filter) {
        switch (filter) {
          case 'views':
            percentage = (+banner.views * 100) / +self.allBannersStatistic.maxViews;
            break;
          case 'viewsUnique':
            percentage = (+banner.viewsUnique * 100) / +self.allBannersStatistic.maxViewsUnique;
            break;
          case 'clicks':
            percentage = (+banner.clicks * 100) / +self.allBannersStatistic.maxClicks;
            break;
          case 'clicksUnique':
            percentage = (+banner.clicksUnique * 100) / +self.allBannersStatistic.maxClicksUnique;
            break;
          case 'requests':
            percentage = (+banner.requests * 100) / +self.allBannersStatistic.maxRequests;
            break;
          case 'ctr':
            percentage = (+banner.ctr * 100) / +self.allBannersStatistic.maxCtr;
            break;
          case 'income':
            percentage = (+banner.income * 100) / +self.allBannersStatistic.maxIncome;
        }
      }

      var activeClass = '';
      var activeBannerId = $('#existing-banners-wrapper').attr('data-banner-active');
      if (banner.bannerId === +activeBannerId) {
        activeClass = 'active';
      }

      var bannerHtml =
        '<div class="body-row clickable ' + activeClass + '" \
              data-banner-id="' + +banner.bannerId + '" \
              data-banner-price="' + +banner.price + '" \
              data-banner-size-id="' + +banner.bannerSizeId + '">\
           <div class="row-content-part">\
             <div class="left-content-info">\
               <div class="edit-button">\
                 ' + svg.editPencil + '\
               </div>\
               <div class="table-row-item company-name">\
                 <span class="resolution">' + banner.size + '</span>\
                 <span class="bannerName">' + banner.bannerName + '</span>\
               </div>\
             </div>\
             <div class="right-content-fill">\
               <div class="filler" style="width: ' + percentage + '%"></div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.requests + '\
                 </div>\
                 <div class="item-number">' + +banner.requests + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.eye + '\
                 </div>\
                 <div class="item-number views">' + +banner.views + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.aim + '\
                 </div>\
                 <div class="item-number">' + +banner.viewsUnique + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.pointerArrow + '\
                 </div>\
                 <div class="item-number">' + +banner.clicks + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.pointerArrowInCircle + '\
                 </div>\
                 <div class="item-number">' + +banner.clicksUnique + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.pointerFinger + '\
                 </div>\
                 <div class="item-number ctr">' + +banner.ctr + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.coinSmall + '\
                   <div class="item-number price">' + +banner.income.toFixed(3) + '</div>\
                 </div>\
               </div>\
             </div>\
           </div>\
         </div>';

      existingBannersHtml += bannerHtml;

      // calc total price
      totalIncome += (+banner.income)

    }

    // hide boot animation
    $('#loading-1').hide();
    $('#existing-banners-wrapper').html(existingBannersHtml);

    // insert total price
    $('#total-price').html(totalIncome.toFixed(2));
  },

  getStatisticByBannerId(bannerId) {
    var self = this;
    var filter = $('.filter-item.active').attr('data-filter');

    self.socket.emit('getBannerStatistics', JSON.stringify({
      hash: user.info.hash,
      bannerId: bannerId,
      period: filter
    }));

    // clear table and show boot animation
    $('#banner-table').empty();
    $('#loading-2').show();
  },

  insertBannerStatistic(filter) {
    var self = this;
    var bannersHtml = '';

    self.bannerStatistic.statistics.forEach((date) => {
      const maxRequests = self.bannerStatistic.maxRequests
      const maxViews = self.bannerStatistic.maxViews
      const maxViewsUnique = self.bannerStatistic.maxViewsUnique
      const maxClicks = self.bannerStatistic.maxClicks
      const maxClicksUnique = self.bannerStatistic.maxClicksUnique
      const maxCtr = self.bannerStatistic.maxCtr
      const maxIncome = self.bannerStatistic.maxIncome

      const dateTime = message.formatDate(date.date);

      let percentage = 0;

      if (filter) {
        switch (filter) {
          case 'views':
            percentage = (date.views * 100) / maxViews;
            break;
          case 'viewsUnique':
            percentage = (date.viewsUnique * 100) / maxViewsUnique;
            break;
          case 'clicks':
            percentage = (date.clicks * 100) / maxClicks;
            break;
          case 'clicksUnique':
            percentage = (date.clicksUnique * 100) / maxClicksUnique;
            break;
          case 'requests':
            percentage = (date.requests * 100) / maxRequests;
            break;
          case 'ctr':
            percentage = (date.ctr * 100) / maxCtr;
            break;
          case 'income':
            percentage = (date.income * 100) / maxIncome;
        }
      }

      bannersHtml +=
        '<div class="body-row">\
         <div class="row-content-part">\
           <div class="left-content-info">\
               <div class="table-row-item company-name" data-time="' + dateTime.time + '">' + dateTime.day + '</div>\
           </div>\
           <div class="right-content-fill">\
             <div class="filler" style="width: ' + percentage + '%"></div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.requests + '\
                 </div>\
                 <div class="item-number">' + date.requests + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.eye + '\
                 </div>\
                 <div class="item-number views">' + date.views + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.aim + '\
                 </div>\
                 <div class="item-number">' + date.viewsUnique + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.pointerArrow + '\
                 </div>\
                 <div class="item-number">' + date.clicks + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.pointerArrowInCircle + '\
                 </div>\
                 <div class="item-number">' + date.clicksUnique + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.pointerFinger + '\
                 </div>\
                 <div class="item-number ctr">' + date.ctr + '</div>\
               </div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.coinSmall + '\
                   <div class="item-number price">' + date.income + '</div>\
                 </div>\
               </div>\
             </div>\
        </div>\
      </div>';
    })

    // hide boot anim
    $('#loading-2').hide();

    $('#banner-table').html(bannersHtml);
  },

  /** Save banner if all required fileds fullfilled **/
  saveBanner() {
    var self = this;
    var params = {}; // object with widget parameters

    params.hash = getCookie('hash');
    params.domainId = $("#domain option:selected").attr('data-domainId');
    params.bannerSizeId = $('#banner-size option:selected').attr('data-banner-size-id');
    params.bannerName = $('#banner-name').val();

    var $modal = $('#modal-create-banner');
    if ($modal.attr('data-banner-id')) {
      params.bannerId = $modal.attr('data-banner-id');
    }

    // insert into DB record that this user is admin of widget. Attach banner to user
    self.socket.emit('saveBanner', JSON.stringify(params));
  },

  // attachDomain(){
  //   const params = {
  //     hash: getCookie('hash'),
  //     domain: $('#domain-input').val()
  //   }

  //   this.socket.emit('attachUserToDomain', JSON.stringify(params));
  // },

  /** Update banner info on frontend **/
  updateBannerRowHtml(data) {
    var self = this;
    var $bannerRow = $('.body-row[data-banner-id="' + data.bannerId + '"]', '#existing-banners-wrapper');

    // size
    $bannerRow.attr('data-banner-size-id', data.bannerSizeId);
    var bannerSizeName = $('#banner-size [data-banner-size-id="' + data.bannerSizeId + '"]').text();
    $bannerRow.find('.resolution').html(bannerSizeName);

    // name
    $bannerRow.find('.bannerName').html(data.bannerName);

    // price
    if (data.price) {
      $bannerRow.attr('data-banner-price', data.price);
    }
  },

  /** Delete banner form frontend and from DB **/
  deleteBanner(bannerId) {
    var self = this;

    if (bannerId) {
      self.socket.emit('deleteBanner', JSON.stringify({
        hash: user.info.hash,
        bannerId: bannerId
      }));
    }
  },

  showGeneratedBannerCode(bannerId) {
    var code = '';

    if (bannerId) {
      code =
        '<script async src="https://info.emoment.com/init.js"></script>' +
        '<div class="emmnt-ctnt" id="emmnt-ctnt-' + bannerId + '"></div>';
    }

    $('.form-banner-code textarea').text(code); // insert code
    $('.form-banner-code').addClass("active");
  },

  /** Checks if fields correctly filled **/
  checkFields() {
    var self = this;
    var domainId = $("#domain option:selected").attr('data-domainId');

    // check if user not login
    if (!getCookie('hash')) {
      alert(lang.lWComLoginNotify);
      return false;
    }

    // check domain selected
    if (!domainId || domainId.length === 0) {
      alert('Пожалуйста выберите домен');
      return false;
    }

    // check banner size
    if ($('#banner-size option:selected').val() === 'false') {
      alert('Пожалуйста, выберите размер баннера');
      return false;
    }

    // check banner name
    if ($('#banner-name').val().length === 0) {
      alert('Пожалуйста, выберите имя баннеру');
      $('#banner-name').focus();
      return false;
    }

    return true;
  },

  /** Sort array by specified filter string **/
  sortStatisticByFilter($elem, arr1, arr2) {
    var self = this;
    var filter = $elem.attr('data-filter');
    var order = $elem.attr('data-order');

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

      for (var i = 1; i < arguments.length; i++) {
        arguments[i].sort(sortingFunc);
      }
    } else {
      $elem.attr('data-order', 'desc');

      for (var k = 1; k < arguments.length; k++) {
        arguments[k].sort(sortingFuncReversed);
      }
    }
  },
};
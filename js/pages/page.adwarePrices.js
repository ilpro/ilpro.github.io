"use strict";
/******* COMMENTS WIDGET CONSTRUCTOR **********/
var pageAdwarePrices = {
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

    self.socket.emit('getBannerDefaultPrice', JSON.stringify({hash: user.info.hash}));
    self.initEventHandlers();
  },

  /** Listeners **/
  initSocketHandlers() {
    var self = this;

    self.socket.on('bannerDefaultPrice', function (data) {
      data = JSON.parse(data);
      self.insertPricesTable(data);
      // self.insertSizesSelect(data);
    });

    // success/error messages
    self.socket.on('bannerDefaultPriceBinded', function (data) {
      data = JSON.parse(data);
      if (data.success) {
        showNotify("success", lang.lProfileSave);
        // $('#current-prices [data-banner-size-id="'+ data.bannerSizeId +'"] .item-number').html(data.price)
      }
      else {
        showNotify("danger", lang.lProfileSaveErr);
      }
    });
  },

  /** Event handlers like click **/
  initEventHandlers () {
    var self = this;

    $('.filter-item').on('click', function (){
      $('.filter-item').removeClass('active').filter($(this)).addClass('active');
      self.getStatistic();
    });

    $('#current-prices').on('change', '.item-number', function (){
      var newPrice = +$(this).val();
      var bannerSizeId = $(this).closest('.body-row').attr('data-banner-size-id');

      if(!$.isNumeric(newPrice)){
        $(this).focus();
        alert('Пожалуйста, введите корректное число');
      }

      self.bindPriceToSize(bannerSizeId, newPrice);
    });

    // // bind user to domain  (for admin only)
    // $('#save-button').click(function () {
    //   var price = +($('#price').val());
    //   var bannerSizeId = $('.banner-resolution option:selected').attr('data-banner-size-id');
    //
    //   if (!bannerSizeId || bannerSizeId.length === 0) {
    //     alert('Пожалуйста выберите размер баннера');
    //     return;
    //   }
    //
    //   self.bindPriceToSize(bannerSizeId, price);
    // });
  },

  insertPricesTable (data) {
    var self = this;
    var html = '';

    for(var i = 0; i < data.length; i++){
      var htmlItem =
        '<div class="body-row" data-banner-size-id="'+ data[i].bannerSizeId +'">\
           <div class="row-content-part">\
             <div class="left-content-info">\
               <div class="table-row-item">'+ data[i].size +'</div>\
             </div>\
             <div class="right-content-fill">\
               <div class="table-row-item">\
                 <div class="item-ico"></div>\
                 <input class="item-number" value="'+ data[i].price +'">\
               </div>\
             </div>\
           </div>\
         </div>';

      html += htmlItem;
    }


    $('#current-prices').html(html)
  },

  /** Insert banners sizes list into html **/
  insertSizesSelect(data){
    var self = this;

    var html = '<option value="false">Размер</option>';

    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      html += '<option value="' + item.size + '" data-banner-size-id="' + item.bannerSizeId + '">' + item.size + '</option>'
    }

    $('.banner-resolution').html(html);
  },

  /**  Bind price to domain  (for admin only) **/
  bindPriceToSize(bannerSizeId, price) {
    var self = this;

    var sendData = {
      hash: user.info.hash,
      bannerSizeId: bannerSizeId,
      price: price
    };

    self.socket.emit('bindPriceToBannerSizeId', JSON.stringify(sendData));
  },
};
'use strict';

/** Start  page chat **/
const pageStickers = {
  socket: {},
  allStickers: false,
  purchasedPacks: {},
  favoritePacks: [],
  stickerPackPrice: 0,


  /** Init page **/
  init (socket) {
    const self = this;
    self.socket = socket;


    if (!self.allStickers) {
      self.socket.emit('getAllStickers', JSON.stringify({hash: userHash}));
    } else {
      self.insertAllStickerPacks();
      self.insertUserStickerPacks();
    }

    self.stickersHandlersInit();
    self.socketHandlersInit();
  },

  socketHandlersInit() {
    var self = this;

    self.socket.on('stickersAll', function (data) {
      data = JSON.parse(data);
      self.allStickers = data.pack;
      self.stickerPackPrice = data.stickerPackPrice;

      // insert purchased packs into object
      if (data.purchasedPacks) {
        for (var i = 0; i < data.purchasedPacks.length; i++) {
          self.purchasedPacks[data.purchasedPacks[i].stickerPackId] = true;
        }
      }

      // insert favorites into array
      if (data.favorites) {
        if (typeof data.favorites === "string") {
          self.favoritePacks = data.favorites.split(',');
        } else {
          self.favoritePacks = data.favorites
        }
        self.insertUserStickerPacks();
      }

      self.insertAllStickerPacks();
    });

    self.socket.on('buyStickerPack', function (data) {
      var data = JSON.parse(data);

      if (data.result) {
        var $sticker = $('.sticker-item[data-pack-id="' + data.stickerPackId + '"]', '#stickers-list');
        $sticker.addClass('purchased');
        $sticker.find('.purchase-holder').remove();
        self.insertIntoFavoritesListHtml($sticker);
      }
    });

    self.socket.on('showRefillForm', function (data) {
      window.location.href = "/transactions";
      // updateForm(100, "USD", function(){
      //   $(".purchase-symbols-modal-layout").addClass("active");
      // });
    });
  },

  /** STICKERS BLOCK **/
  stickersHandlersInit: function () {
    var self = this;

    // jQuery sortable init
    $("#user-stickers").sortable({
      revert: "true",
      delay: 100,
      tolerance: "pointer",
      update: function (event, ui) {
        if ($('.sticker-item[data-pack-id]', '#user-stickers').length > 2) {
          var newFavoriteArr = [];
          $(".ui-sortable-handle:lt(5)", "#user-stickers").each(function () {
            newFavoriteArr.push(+$(this).find('.sticker-item').attr("data-pack-id"));
          });
          self.favoritePacks = newFavoriteArr;
          self.updateFavoriteStickerPacks();
          // showNotify("success", "Saved");
        }
      }
    });

    // add new favorite pack from all packs
    $('#stickers-list').on('click', '.sticker-item.purchased', function () {
      self.insertIntoFavoritesListHtml($(this));
    });

    // show all stickers in pack in modal window
    $(document).on("click", ".btn-preview", function () {
      var packId = $(this).closest('.sticker-item').attr('data-pack-id');
      var packName = $(this).closest('.sticker-item').attr('data-pack-name');
      var stickersArr = self.allStickers[packId].stickers;
      var allStickersHtml = '';

      for (var counter = 0; counter < stickersArr.length; counter++) {
        allStickersHtml +=
          '<div class="stickers-preview-item">\
             <img src="https://emosmile.com' + stickersArr[counter].stickerImg + '" >\
           </div>';
      }

      $('.stickers-preview-body', '#stickers-preview-modal').html(allStickersHtml);
      $('.stickers-name', '#stickers-preview-modal').html(packName);
      $('.amount', '#stickers-preview-modal').html(counter + ' stickers');
      $('#stickers-preview-modal').addClass('active');
    });

    // hide stickers modal
    $(".shadow, .close", '#stickers-preview-modal').click(function () {
      $('#stickers-preview-modal').removeClass("active");
    });

    // Buy new sticker pack or insert already bought pack to user sticker's from all stickers
    $(document).on("click", '#stickers-list .purchase-holder', function (e) {
      var $sticker = $(this).closest('.sticker-item');
      var packId = $sticker.attr('data-pack-id');

      self.socket.emit('buyStickerPack', JSON.stringify({hash: userHash, stickerPackId: packId}));
    });

    // Remove sticker from user stickers
    $(document).on("click", '#user-stickers .close', function (event) {
      event.preventDefault();
      var packId = $(this).closest('.sticker-item').attr('data-pack-id');

      $(this).closest('.sticker-item').empty().addClass('empty').removeAttr('data-pack-id');
      self.removePackFromFavorite(+packId);
      // showNotify("success", "Saved");
    });
  },

  insertUserStickerPacks: function () {
    var self = this;

    // insert user's sticker packs from favorites
    self.favoritePacks.forEach(function (favoritePack, i, arr) {
      for (var pack in self.allStickers) {
        if (+favoritePack === +pack) {
          var $emptyWindow = $(".sticker-item.empty", "#user-stickers");
          var stickerTemplate =
            '<div class="sticker-body">\
               <div class="close">\
                 <svg height="7" viewBox="0 0 16.414 16.414" width="7" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2"><path d="m.707.707 15 15"/><path d="m.707 15.707 15-15"/></g></svg>\
               </div>\
               <p class="sticker-name">' + self.allStickers[pack].packName + '</p>\
               <img src="https://emosmile.com' + self.allStickers[pack].mainSticker + '">\
             </div>\
             <button class="btn-preview">Preview</button>';

          $emptyWindow.first().html(stickerTemplate).removeClass("empty").attr('data-pack-id', +pack);
        }
      }
    });
  },

  insertAllStickerPacks: function () {
    var self = this;
    var allStickersHtml = '';

    for (var item in self.allStickers) {
      var pack = self.allStickers[item];
      var purchased = '';
      var purchaseHtml =
        '<div class="purchase-holder">\
           <button class="purchase">\
             <p class="price">' + self.stickerPackPrice + '</p>\
             <svg xmlns="http://www.w3.org/2000/svg" width="18.53" height="18.53" viewBox="0 0 36 36"><title>coin</title><circle cx="18" cy="18" r="18" transform="translate(-0.027 0.027) rotate(-0.087)" fill="#f8dc4a"></circle><g opacity="0.28"><path d="M30.431,4.945,4.07,29.362q.572.7,1.21,1.336L31.67,6.254Q31.083,5.569,30.431,4.945Z" fill="#fff"></path><path d="M34.946,11.882a17.937,17.937,0,0,0-2-3.961L6.846,32.091a18,18,0,0,0,3.795,2.3Z" fill="#fff"></path><path d="M.976,23.824A17.937,17.937,0,0,0,3.1,28.063L29.209,3.879a17.993,17.993,0,0,0-4.064-2.442Z" fill="#fff"></path></g><path d="M18.481,34.808a.259.259,0,0,1-.008-.518q.256-.008.51-.024a.259.259,0,0,1,.033.517q-.262.016-.526.025Zm-1.554-.023h-.016q-.264-.016-.525-.04a.259.259,0,1,1,.048-.516q.253.024.509.039a.259.259,0,0,1-.015.517Zm3.617-.172a.259.259,0,0,1-.04-.515q.253-.04.5-.088a.259.259,0,1,1,.1.509q-.258.049-.519.09A.238.238,0,0,1,20.543,34.614Zm-5.673-.083a.251.251,0,0,1-.048,0q-.259-.049-.516-.106a.259.259,0,1,1,.113-.506q.248.055.5.1a.259.259,0,0,1-.048.514Zm7.7-.368a.259.259,0,0,1-.072-.508q.245-.071.487-.15a.259.259,0,1,1,.161.493q-.25.081-.5.155A.255.255,0,0,1,22.566,34.162Zm-9.7-.144a.257.257,0,0,1-.08-.013q-.252-.081-.5-.17a.259.259,0,1,1,.175-.487q.241.086.484.165a.259.259,0,0,1-.08.505Zm11.652-.559a.259.259,0,0,1-.1-.5q.234-.1.463-.21a.259.259,0,0,1,.221.468q-.237.112-.478.217A.26.26,0,0,1,24.515,33.459Zm-13.581-.2a.261.261,0,0,1-.11-.025q-.239-.113-.474-.232a.259.259,0,0,1,.236-.462q.227.116.459.225a.259.259,0,0,1-.11.494Zm15.425-.74a.259.259,0,0,1-.133-.482q.22-.131.434-.267a.259.259,0,1,1,.279.437q-.222.141-.448.275A.259.259,0,0,1,26.359,32.517ZM9.116,32.258a.259.259,0,0,1-.139-.04q-.223-.142-.441-.29a.259.259,0,1,1,.291-.428q.211.144.427.28a.259.259,0,0,1-.139.478Zm18.954-.908a.259.259,0,0,1-.159-.463q.2-.157.4-.319a.259.259,0,1,1,.33.4q-.2.168-.41.329A.259.259,0,0,1,28.071,31.35ZM7.439,31.039a.258.258,0,0,1-.165-.059q-.2-.168-.4-.342a.259.259,0,0,1,.342-.389q.192.169.389.332a.259.259,0,0,1-.165.458Zm22.185-1.061a.259.259,0,0,1-.183-.442q.181-.181.355-.367a.259.259,0,0,1,.378.355q-.18.192-.366.378A.258.258,0,0,1,29.624,29.979Zm-23.7-.357a.258.258,0,0,1-.188-.081q-.18-.191-.355-.389a.259.259,0,1,1,.388-.343q.169.191.344.377a.259.259,0,0,1-.188.436Zm25.067-1.2a.259.259,0,0,1-.2-.418q.157-.2.307-.408a.259.259,0,0,1,.419.3q-.155.213-.317.421A.259.259,0,0,1,30.994,28.424Zm-26.39-.4a.259.259,0,0,1-.209-.106q-.155-.212-.3-.43a.259.259,0,0,1,.428-.292q.144.211.294.417a.259.259,0,0,1-.209.412ZM32.16,26.711a.259.259,0,0,1-.222-.392q.131-.219.254-.444a.259.259,0,0,1,.454.25q-.127.232-.262.458A.259.259,0,0,1,32.16,26.711Zm-28.67-.43a.259.259,0,0,1-.227-.134q-.127-.229-.247-.463a.259.259,0,0,1,.461-.237q.116.227.239.45a.259.259,0,0,1-.226.384ZM33.1,24.865a.256.256,0,0,1-.1-.022.259.259,0,0,1-.135-.34q.1-.235.2-.473a.259.259,0,1,1,.482.191q-.1.246-.2.488A.259.259,0,0,1,33.1,24.865ZM2.6,24.409a.259.259,0,0,1-.241-.163q-.1-.244-.187-.492a.259.259,0,1,1,.487-.176q.087.24.181.477a.259.259,0,0,1-.145.337A.262.262,0,0,1,2.6,24.409Zm31.2-1.5a.255.255,0,0,1-.072-.01.259.259,0,0,1-.177-.321q.071-.244.134-.492a.259.259,0,1,1,.5.129q-.066.256-.139.508A.259.259,0,0,1,33.805,22.913ZM1.962,22.439a.259.259,0,0,1-.251-.195q-.066-.255-.123-.512a.259.259,0,0,1,.505-.114q.056.249.12.5a.259.259,0,0,1-.186.315A.25.25,0,0,1,1.962,22.439Zm32.293-1.548a.264.264,0,0,1-.04,0,.259.259,0,0,1-.216-.3q.04-.252.071-.505a.259.259,0,1,1,.514.065q-.033.262-.073.521A.259.259,0,0,1,34.255,20.891ZM1.573,20.4a.259.259,0,0,1-.257-.227q-.033-.26-.058-.523a.259.259,0,0,1,.516-.049q.024.255.056.507a.259.259,0,0,1-.224.29Zm32.875-1.576h-.006a.26.26,0,0,1-.253-.267q.008-.254.008-.51V18a.259.259,0,1,1,.518,0v.049c0,.18,0,.356-.008.531A.259.259,0,0,1,34.448,18.828Zm-33.006-.5a.248.248,0,0,1-.259-.246v-.026q0-.251.007-.5a.264.264,0,0,1,.267-.251.259.259,0,0,1,.251.267q-.007.241-.007.484A.271.271,0,0,1,1.441,18.323ZM34.378,16.7a.259.259,0,0,1-.258-.234q-.024-.255-.057-.507a.259.259,0,1,1,.514-.066q.034.261.059.524a.259.259,0,0,1-.233.282ZM1.567,16.268l-.032,0a.259.259,0,0,1-.225-.289q.032-.262.073-.521a.259.259,0,1,1,.512.079q-.039.252-.07.506A.259.259,0,0,1,1.567,16.268Zm32.484-1.61a.259.259,0,0,1-.252-.2q-.057-.249-.12-.5a.259.259,0,1,1,.5-.13q.066.254.124.511a.259.259,0,0,1-.253.316Zm-32.1-.427a.256.256,0,0,1-.064-.008.259.259,0,0,1-.187-.315q.065-.256.138-.508a.259.259,0,0,1,.5.143q-.07.245-.134.492A.259.259,0,0,1,1.949,14.232ZM33.467,12.67a.259.259,0,0,1-.243-.17q-.087-.24-.182-.477a.259.259,0,1,1,.481-.192q.1.244.188.492a.259.259,0,0,1-.155.332A.256.256,0,0,1,33.467,12.67ZM2.585,12.26a.259.259,0,0,1-.241-.354q.1-.246.2-.488a.259.259,0,0,1,.476.205q-.1.235-.2.473A.259.259,0,0,1,2.585,12.26Zm30.053-1.488a.259.259,0,0,1-.231-.14q-.116-.227-.24-.449a.259.259,0,1,1,.453-.252q.127.23.248.463a.259.259,0,0,1-.23.378ZM3.466,10.382A.259.259,0,0,1,3.239,10q.127-.231.261-.458a.259.259,0,1,1,.446.263q-.13.22-.253.444A.259.259,0,0,1,3.466,10.382ZM31.577,8.993a.259.259,0,0,1-.214-.112q-.145-.211-.295-.416a.259.259,0,0,1,.418-.306q.155.212.3.429a.259.259,0,0,1-.213.406Zm-27-.362a.259.259,0,0,1-.209-.411q.155-.213.316-.422a.259.259,0,1,1,.41.317q-.156.2-.306.409A.259.259,0,0,1,4.575,8.631ZM30.3,7.36a.259.259,0,0,1-.194-.087q-.169-.191-.344-.377a.259.259,0,1,1,.377-.355q.181.191.355.388a.259.259,0,0,1-.194.431ZM5.894,7.032A.259.259,0,0,1,5.705,6.6q.18-.192.366-.379a.259.259,0,1,1,.367.366q-.18.181-.354.367A.258.258,0,0,1,5.894,7.032ZM28.832,5.9a.258.258,0,0,1-.171-.065q-.192-.168-.389-.33a.259.259,0,0,1,.329-.4q.2.168.4.342a.259.259,0,0,1-.171.453ZM7.4,5.61a.259.259,0,0,1-.166-.458q.2-.168.41-.33a.259.259,0,1,1,.319.408q-.2.157-.4.32A.258.258,0,0,1,7.4,5.61Zm19.79-.979a.258.258,0,0,1-.145-.044q-.212-.143-.428-.28a.259.259,0,1,1,.276-.438q.223.141.441.289a.259.259,0,0,1-.145.474ZM9.075,4.388a.259.259,0,0,1-.14-.477q.221-.141.447-.276a.259.259,0,0,1,.265.445q-.219.13-.434.267A.257.257,0,0,1,9.075,4.388Zm16.331-.808a.257.257,0,0,1-.117-.028q-.228-.116-.46-.224a.259.259,0,1,1,.219-.469q.24.112.474.231a.259.259,0,0,1-.117.49ZM10.887,3.385a.259.259,0,0,1-.111-.493q.237-.112.478-.217a.259.259,0,1,1,.207.475q-.234.1-.463.211A.259.259,0,0,1,10.887,3.385ZM23.5,2.76a.26.26,0,0,1-.087-.015q-.241-.086-.485-.165a.259.259,0,1,1,.159-.493q.252.081.5.17a.259.259,0,0,1-.087.5ZM12.81,2.618a.259.259,0,0,1-.081-.505q.25-.082.5-.156a.259.259,0,1,1,.146.5q-.245.072-.487.151A.258.258,0,0,1,12.81,2.618Zm8.7-.43a.263.263,0,0,1-.056-.006q-.248-.055-.5-.1a.259.259,0,1,1,.1-.509q.259.049.516.1a.259.259,0,0,1-.055.512ZM14.816,2.1a.259.259,0,0,1-.049-.513q.258-.05.518-.091a.259.259,0,0,1,.082.511q-.253.041-.5.088A.253.253,0,0,1,14.816,2.1Zm4.645-.228h-.024q-.253-.023-.509-.038a.259.259,0,0,1-.243-.274.256.256,0,0,1,.274-.243q.264.016.525.039a.259.259,0,0,1-.023.517Zm-2.59-.034a.259.259,0,0,1-.016-.517q.262-.017.525-.026a.255.255,0,0,1,.268.25.259.259,0,0,1-.25.268q-.256.009-.51.025Z" fill="#f2c341"></path><circle cx="17.999" cy="17.962" r="15.071" fill="#c99204"></circle><circle cx="17.999" cy="17.962" r="14.407" fill="#dea004"></circle><g opacity="0.16"><path d="M3.935,21.083a14.317,14.317,0,0,0,1.84,4.5L26.535,6.357a14.355,14.355,0,0,0-4.345-2.181Z" fill="#fff"></path><path d="M27.788,7.394,6.714,26.913a14.491,14.491,0,0,0,1.206,1.34L29.031,8.7A14.492,14.492,0,0,0,27.788,7.394Z" fill="#fff"></path><path d="M32.009,14.6a14.32,14.32,0,0,0-1.745-4.2L9.524,29.61a14.356,14.356,0,0,0,4.052,2.064Z" fill="#fff"></path></g><path d="M15.9,16.758q1.687,2.855,2.583,4.166a31.547,31.547,0,0,0,1.96,2.57q2.025-2.518,2.025-4.1a1.383,1.383,0,0,0-.506-1.129,2.355,2.355,0,0,0-1.519-.415h-.688v-.9h7.217v.9h-.545a2.787,2.787,0,0,0-1.155.208,2.514,2.514,0,0,0-.837.642,7.3,7.3,0,0,0-.928,1.6,20.311,20.311,0,0,1-2.362,3.946q1.778,1.817,3.1,1.817a1.69,1.69,0,0,0,1.343-.636,4.219,4.219,0,0,0,.72-2.194h.8a5.647,5.647,0,0,1-1.045,3.686,3.287,3.287,0,0,1-2.641,1.259,4.127,4.127,0,0,1-1.824-.454,10.34,10.34,0,0,1-2.239-1.648,10.718,10.718,0,0,1-2.687,1.648,6.99,6.99,0,0,1-2.531.454,5.558,5.558,0,0,1-4.056-1.57,5.2,5.2,0,0,1-1.6-3.868,5.31,5.31,0,0,1,1.019-3.18,10.475,10.475,0,0,1,3.667-2.8,10.146,10.146,0,0,1-1.233-4.218,4.17,4.17,0,0,1,1.33-3.115A4.52,4.52,0,0,1,16.535,8.14a4.216,4.216,0,0,1,2.907.947,3.206,3.206,0,0,1,1.064,2.518,4.2,4.2,0,0,1-1.019,2.732A10.136,10.136,0,0,1,15.9,16.758ZM13.628,17.77q-2.739,1.519-2.739,3.647a5.984,5.984,0,0,0,1.278,3.433,3.8,3.8,0,0,0,3.186,1.8,5.423,5.423,0,0,0,3.31-1.311,37.313,37.313,0,0,1-2.258-2.979Q15.406,20.885,13.628,17.77Zm1.778-2.012a6.416,6.416,0,0,0,2.57-1.746,3.587,3.587,0,0,0,.7-2.226,2.784,2.784,0,0,0-.642-1.934,2.11,2.11,0,0,0-1.642-.714,2.163,2.163,0,0,0-1.635.681,2.517,2.517,0,0,0-.649,1.811A9.416,9.416,0,0,0,15.406,15.758Z" fill="#c99204"></path><path d="M16.3,16.439q1.687,2.855,2.583,4.166a31.547,31.547,0,0,0,1.96,2.57q2.025-2.518,2.025-4.1a1.383,1.383,0,0,0-.506-1.129,2.355,2.355,0,0,0-1.519-.415h-.688v-.9h7.217v.9h-.545a2.787,2.787,0,0,0-1.155.208,2.514,2.514,0,0,0-.837.642,7.3,7.3,0,0,0-.928,1.6,20.311,20.311,0,0,1-2.362,3.946q1.778,1.817,3.1,1.817a1.69,1.69,0,0,0,1.343-.636,4.219,4.219,0,0,0,.72-2.194h.8A5.647,5.647,0,0,1,26.467,26.6a3.287,3.287,0,0,1-2.641,1.259A4.127,4.127,0,0,1,22,27.406a10.34,10.34,0,0,1-2.239-1.648,10.718,10.718,0,0,1-2.687,1.648,6.99,6.99,0,0,1-2.531.454,5.558,5.558,0,0,1-4.056-1.57,5.2,5.2,0,0,1-1.6-3.868,5.31,5.31,0,0,1,1.019-3.18,10.475,10.475,0,0,1,3.667-2.8,10.146,10.146,0,0,1-1.233-4.218,4.17,4.17,0,0,1,1.33-3.115A4.52,4.52,0,0,1,16.934,7.82a4.216,4.216,0,0,1,2.907.947,3.206,3.206,0,0,1,1.064,2.518,4.2,4.2,0,0,1-1.019,2.732A10.136,10.136,0,0,1,16.3,16.439Zm-2.271,1.012Q11.288,18.97,11.288,21.1a5.984,5.984,0,0,0,1.278,3.433,3.8,3.8,0,0,0,3.186,1.8,5.423,5.423,0,0,0,3.31-1.311A37.313,37.313,0,0,1,16.8,22.039Q15.8,20.566,14.026,17.451ZM15.8,15.439a6.416,6.416,0,0,0,2.57-1.746,3.587,3.587,0,0,0,.7-2.226,2.784,2.784,0,0,0-.642-1.934,2.11,2.11,0,0,0-1.642-.714,2.163,2.163,0,0,0-1.635.681,2.517,2.517,0,0,0-.649,1.811A9.416,9.416,0,0,0,15.8,15.439Z" fill="#f8dc4a"></path></svg>\
             <p class="title">Buy</p>\
           </button>\
         </div>';

      // active class for stations which in favorites
      for (var y = 0; y < self.favoritePacks.length; y++) {
        if (+self.favoritePacks[y] === +item) {
          purchased = ' purchased';
        }
      }

      if (item in self.purchasedPacks) {
        purchased = ' purchased';
        purchaseHtml = '';
      }

      allStickersHtml +=
        '<div class="col-2 px-2 pb-3">\
           <div class="sticker-item ' + purchased + '" data-pack-id="' + item + '" data-pack-name="' + pack.packName + '">\
             <div class="sticker-body">\
               <p class="sticker-name">' + pack.packName + '</p>\
               <img src="https://emosmile.com' + pack.mainSticker + '">\
               ' + purchaseHtml + '\
             </div>\
             <button class="btn-preview">Preview</button>\
           </div>\
         </div>';
    }

    $('#stickers-list').html(allStickersHtml);
  },

  // insert sticker pack from all sticker's packs list to user's sticker packs list
  insertIntoFavoritesListHtml($sticker){
    var self = this;
    var $emptyWindow = $(".sticker-item.empty", "#user-stickers");
    var packId = $sticker.attr('data-pack-id');
    var packName = $sticker.attr('data-pack-name');
    var html = $sticker.html();

    // if all window in user's list not empty, remove last favorite's sticker pack
    if ($emptyWindow.length === 0) {
      $emptyWindow = $(".sticker-item", "#user-stickers").last();
      $emptyWindow.find('.close').click();
    }

    $emptyWindow
      .first()
      .html(html)
      .removeClass("empty")
      .attr({'data-pack-id': packId, 'data-pack-name': packName});

    self.addStickerPackToFavorite(packId);
  },

  // favorites sticker pack add\delete\update
  addStickerPackToFavorite: function (packId) {
    var self = this;
    packId = +packId;

    // if channel already exists in favorites
    if (packId in self.favoritePacks) return;

    if (self.favoritePacks.length < 6) {
      self.favoritePacks.push(packId);
    } else {
      self.favoritePacks.shift(); // delete first element of favorite array
      self.favoritePacks.push(packId);
    }
    self.updateFavoriteStickerPacks();
  },

  removePackFromFavorite: function (packId) {
    var self = this;
    packId = +packId;

    var indexToRemove = self.favoritePacks.indexOf(packId);
    self.favoritePacks.splice(indexToRemove, 1);
    self.updateFavoriteStickerPacks();
  },

  updateFavoriteStickerPacks: function () {
    var self = this;
    // clean up empty slots in favorites array
    for (var i = 0; i < self.favoritePacks.length; i++) {
      if (!self.favoritePacks[i]) {
        self.favoritePacks.splice(i, 1);
      }
    }

    self.socket.emit('updateFavoriteStickerPacks', JSON.stringify({hash: userHash, packs: self.favoritePacks}));
  },
};

pageStickers.init(dataSocket);
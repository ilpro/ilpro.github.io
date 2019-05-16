'use strict';
const pagePartners = {
  socket: {},
  selectedUser: false,

  init(params) {
    var self = this;

    self.socket = params.socket;

    self.socket.emit('getAllPartners', JSON.stringify({ hash: user.hash }));

    self.initSocketHandlers();
    self.initEventListeners();
  },

  initSocketHandlers() {
    var self = this;

    self.socket.off("getAllPartners").on("getAllPartners", function (data) {
      data = JSON.parse(data);

      var html = "";
      for (var i = 0; i < data.length; i++)
        html +=
          '<li class="single-email" data-user-id="' + data[i].userId + '">\
	           <a href="#page=profile&id=' + data[i].userId + '">\
		           <figure class="user-avatar" title="">\
		             <img src="' + data[i].userPhoto + '" data-id="0" alt="profile image" alt="user" class="" style="max-width: 100%;">\
		           </figure>\
		           <div class="user-nickname">@' + data[i].userName + '</div>\
		         </a>\
		         <a href="#page=messages&chatId=:' + data[i].userEmail + '">\
		           '+ svg.letter + '\
		         </a>\
		         <a class="user-email" href="mailto:' + data[i].userEmail + '">' + data[i].userEmail + '</a>\
		         <div class="edition-holder">\
		           <div class="edition-button">'+ lang.lPartnersSources + '</div>\
		         </div>\
		         <a href="#page=partners&id=' + data[i].userId + '" class="coins-amount-holder">\
		           <div class="coins-amount">\
		             '+ svg.coinSmall + '\
			           <span>' + data[i].userBalance + '</span>\
			         </div>\
			       </a>\
			     </li>';
      $(".partners-page .emails-wrapper").html(html);
    });

    self.socket.off('partnerDomains').on('partnerDomains', function (data) {
      data = JSON.parse(data);
      self.insertParnterDomains(data);
    });

    // // insert sites list
    // self.socket.off('widgetDatingSitesList').on('widgetDatingSitesList', function (data) {
    //   data = JSON.parse(data);
    //   self.insertSitesList(data);
    // });

    // // bind user to domain  (for admin only)
    // $('[data-domain]').click(function () {
    //   var userId = +self.selectedUser;
    //   var domainId = $(this).attr('data-domainId');
    //
    //   if (!domainId || domainId.length === 0) {
    //     alert('Пожалуйста выберите домен');
    //     return;
    //   }
    //
    //   if(userId) self.bindUserToDomain(domainId, userId);
    // });
  },

  initEventListeners() {
    var self = this;

    $(".partners-page").on('click', '.edition-button', function (e) {
      e.preventDefault();
      self.selectedUser = $(this).closest('.single-email').attr('data-user-id');
      self.socket.emit('getPartnerDomains', JSON.stringify({ userId: self.selectedUser }));
    });
    $(".partners-page").on('click', '.edition-list .close-cross', function (e) {
      e.preventDefault();
      $(".partners-page .edition-list").removeClass('active');
    });

    // // get sites list by click and insert into modal window
    // $('#get-sites-list').click(function (e){
    //   self.socket.emit('getWidgetDatingSitesList', JSON.stringify({hash: user.info.hash}));
    // });
  },

  /** Insert domains list **/
  insertParnterDomains(data) {
    var self = this;
    var html = '';

    if (data.length === 0) {
      html = '<a href="#page=partnership-widget" id="get-sites-list"><li><p class="edition-name">Прикрепить издательство</p></li></a>';
    }

    for (var i = 0; i < data.length; i++) {
      var domain = data[i].domain;
      html += '<a href="http://' + domain + '" target="_blank"><li><p class="edition-name">' + domain + '</p></li></a>';
    }

    $('.edition-list ul').html(html);
    $(".partners-page .edition-list").addClass('active');
  },

  // /** Insert all sites list to bind it to user**/
  // insertSitesList(sites){
  //   for(var i = 0; i < sites.length; i++){
  //     var domain = sites[i].domain;
  //     html += '<li data-domainId="'+ domainId +'"><p class="edition-name">'+ domain +'</p></li>';
  //   }
  //
  //   $('.edition-list ul').html(html);
  //   $(".partners-page .edition-list").addClass('active');
  // },

  /** Page partners transactions **/
  getPartnerTransaction(params) {
    var self = this;

    self.socket = params.socket;
    self.profileId = params.profileId;

    self.socket.emit('getPartnerTransaction', JSON.stringify({ hash: user.hash, profileId: self.profileId }));

    self.socket.off("getTransaction").on("getTransaction", function (data) {
      data = JSON.parse(data);

      var html = "";
      for (var i = 0; i < data.length; i++)
        html += '<div class="table-row">\
	<div class="order-serial-number">\
		<div class="serial">#' + data[i].transactionId + '</div>\
		<div class="order-state finished">\
			<div class="state-finished">\
				<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">\
					<path fill="none" stroke="#009245" stroke-width=".5" stroke-miterlimit="10" d="M10 1l-5.5 9L1 4.4"></path>\
				</svg>\
			</div>\
		</div>\
	</div>\
	<div class="spent-target">\
		' + ((data[i].profileId) ? '<a href="#page=profile&id=' + data[i].profileId + '" class="user-target-nick">' + data[i].userName + '</a><div class="user-target-id">ID:' + data[i].profileId + '</div>' : 'Administration') + '\
	</div>\
	<div class="payment-type">' + data[i].transactionType + '</div>\
	<div class="payment-amount ' + ((data[i].transactionSum > 0) ? 'income' : 'outcome') + '">\
		<div class="payment-income">\
			<svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7">\
				<path fill="#009245" d="M0 7l4-7 4 7"></path>\
			</svg>\
		</div>\
		<div class="payment-outcome">\
			<svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7">\
				<path fill="#F00" d="M8 0L4 7 0 0"></path>\
			</svg>\
		</div>\
		<div class="payment-quantity">' + Math.abs(data[i].transactionSum) + '</div>\
	</div>\
	<div class="date-quantity">' + data[i].transactionDate + '</div>\
	<div class="comments">' + data[i].transactionComment + '</div>\
</div>';
      $(".transactions-user-table-body").html(html);
    });

    self.socket.off("newTransaction").on("newTransaction", function (data) {
      data = JSON.parse(data);
      var html = '<div class="table-row">\
	<div class="order-serial-number">\
		<div class="serial">#' + data.transactionId + '</div>\
		<div class="order-state finished">\
			<div class="state-finished">\
				<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">\
					<path fill="none" stroke="#009245" stroke-width=".5" stroke-miterlimit="10" d="M10 1l-5.5 9L1 4.4"></path>\
				</svg>\
			</div>\
		</div>\
	</div>\
	<div class="spent-target">\
		Administration\
	</div>\
	<div class="payment-type">' + data.transactionType + '</div>\
	<div class="payment-amount ' + ((data.transactionSum > 0) ? 'income' : 'outcome') + '">\
		<div class="payment-income">\
			<svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7">\
				<path fill="#009245" d="M0 7l4-7 4 7"></path>\
			</svg>\
		</div>\
		<div class="payment-outcome">\
			<svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7">\
				<path fill="#F00" d="M8 0L4 7 0 0"></path>\
			</svg>\
		</div>\
		<div class="payment-quantity">' + Math.abs(data.transactionSum) + '</div>\
	</div>\
	<div class="date-quantity">' + data.transactionDate + '</div>\
	<div class="comments">' + data.transactionComment + '</div>\
</div>';
      $(".transactions-user-table-body").prepend(html);
    });

    $(".ok-button").click(function () {
      self.newTransaction();
    })
  },

  newTransaction() {
    var self = this;

    var typeId = $("select[name=paymentType]").val();
    var sum = Math.abs($(".spent-input").val());
    $(".spent-input").val(sum);
    if (typeId) {
      self.socket.emit('newTransaction', JSON.stringify({
        hash: user.hash,
        profileId: self.profileId,
        typeId: typeId,
        sum: sum,
        comment: $(".comments-input").val()
      }));
    }
  }
};


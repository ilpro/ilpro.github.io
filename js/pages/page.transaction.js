'use strict';
const pageTransaction = {
  init(params) {
    const self = this;

    self.socket = params.socket;

    self.socket.emit('getBannersTransactionsByUser', JSON.stringify({ hash: user.hash }));

    self.socket.on("getBannersTransactionsByUser", function (data) {
      data = JSON.parse(data);

      var wrapURLs = function (text, new_window) {
        var url_pattern = /(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}\-\x{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/ig;
        var target = (new_window === true || new_window == null) ? '_blank' : '';

        return text.replace(url_pattern, function (url) {
          var protocol_pattern = /^(?:(?:https?|ftp):\/\/)/i;
          var href = protocol_pattern.test(url) ? url : 'http://' + url;
          return '<a title="' + url + '"style="width: 100%; text-decoration: underline; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" href="' + href + '" target="' + target + '">' + url + '</a>';
        });
      };

      var html = "";
      let total = 0
      data.forEach(transaction => {
        total += (+transaction.amount)
        const date = moment(transaction.createdAt).format('DD.MM.YYYY, HH:mm:ss');
        const transactionNumber = +transaction.amount
        const transactionFixed = transactionNumber.toFixed(3)
        const commentWithLink = wrapURLs(transaction.comment)

        html +=
          '<div class="table-row custom-head">\
             <div class="order-serial-number col-1">\
               <div class="serial">#' + transaction.id + '</div>\
               <div class="order-state finished">\
                 <div class="state-finished">\
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">\
                    <path fill="none" stroke="#009245" stroke-width=".5" stroke-miterlimit="10" d="M10 1l-5.5 9L1 4.4"></path>\
                  </svg>\
                </div>\
              </div>\
            </div>\
            <!-- <div class="spent-target">' + transaction.userId + '</div> -->\
            <div class="payment-amount col-2 ' + ((transactionFixed > 0) ? 'income' : 'outcome') + '">\
              <div class="payment-income">\
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7"><path fill="#009245" d="M0 7l4-7 4 7"></path></svg>\
              </div>\
              <div class="payment-outcome">\
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7"><path fill="#F00" d="M8 0L4 7 0 0"></path></svg>\
              </div>\
              <div class="payment-quantity">' + transactionFixed + '</div>\
            </div>\
            <div class="date-quantity col-3">' + date + '</div>\
            <div class="comments col-4">'+ commentWithLink + '</div>\
          </div>';
      })
      $(".transactions-user-table-body").html(html);
      $('#sum-total').html(total.toFixed(2));
    })
  }
}
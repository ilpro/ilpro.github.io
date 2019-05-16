'use strict';

var pageInfo = {
  socket: {},

  init: function (socket){
    var self = this;
	  
    self.socket = socket;

    function magnetBottom(index){
      var containerOffset = $(index).offset();
      var containerTop = parseInt( containerOffset.top );
      var windowHeight = parseInt( $(window).outerHeight() );
      var height = windowHeight - containerTop;
      $(index).css({minHeight: height - 10});
    }

    magnetBottom(".statistic-wrapper");

    /*Modal window control*/
    $(document).on("click", ".write-message", function (e) {
      e.preventDefault();
      openModal("#message-form-modal", "#message-close");
    });

    self.socket.off('sendLetter').on('sendLetter', function(data){
      if(data == "Ok") {
        hideModal();
        $("#message-email, #message-subject, #message-text").val("");
        $("#message-form").removeClass("submitted");
        setTimeout(function() {
          alert(lang.lInfoMsgSend);
        }, 300);
      } else
        alert(lang.lInfoMsgSendErr);
    });

	/*Tooltips appearing*/
    if(document.querySelector('#message-form')){
      document.querySelector('#message-form').addEventListener('submit', function (e) {
        e.preventDefault();
        e.currentTarget.classList.add('submitted');
        if($('#message-form')[0].checkValidity()) {
          self.socket.emit('sendLetter', JSON.stringify({
            "email" : $("#message-email").val(),
            "subject" : $("#message-subject").val(),
            "message" : $("#message-text").val()
          }));
        }
      });
    }
  }
};
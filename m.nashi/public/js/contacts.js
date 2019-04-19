$('#send-contacts').click(e => {
  const email = $('#email').val().trim();
  if(!email || !email.length){
    alert('Будь-ласка, вкажiть ваш емейл');
    return $('#email').focus();
  }

  const fullName = $('#fullName').val().trim();
  if(!fullName || !fullName.length){
    alert('Будь-ласка, вкажiть вашi ПIБ');
    return $('#fullName').focus();
  }

  const birthDate = $('#birthDate').val().trim();
  const phone = $('#phone').val().trim();

  $.ajax({
    url: '/contacts',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify({email, fullName, birthDate, phone}),
    processData: false,
    success: function( data, textStatus, jQxhr ){
      $('#phone, #birthDate, #fullName, #email').val('');
      alert('Дякуємо! Вашi данi були збереженi');
    },
    error: function( jqXhr, textStatus, errorThrown ){
      console.log(jqXhr,textStatus, errorThrown);
      alert('Вибачте, виникла помилка, спробуйте будь-ласка пiзiше')
    }
  });
});

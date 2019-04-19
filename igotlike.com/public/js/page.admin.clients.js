'use strict';
var page = 1;
var inProgress = false;

dataSocket.on('getAllUsers', function (data) {
  data = JSON.parse(data);

  if (data.users.length) {
    inProgress = false;
    updateUsersList(data);
  }
  else  {
    $(".emails-wrapper").html('<h1 style="text-align: center;">Nothing found</h1>');
  }


  $('#loader').hide();
});

$("#user-search").keyup(function(e){
  if(e.keyCode == 13) {
    dataSocket.emit('getAllUsers', JSON.stringify({
      hash : userHash,
      search : $(this).val(),
      page : 1
    }));
    $(".emails-wrapper").empty();
  }
});
$("#user-search-cancel").click(function(){
  $("#user-search").val("");
  dataSocket.emit('getAllUsers', JSON.stringify({
    hash : userHash,
    page : 1
  }));
  $(".emails-wrapper").empty();
});

function updateUsersList(data) {
  var html = "";
  for (var i = 0; i < data.users.length; i++) {
    var userCity = data.users[i].userCity ? data.users[i].userCity + ', ' + data.users[i].userCountry : '';

    var userWantToVisit = '';
    if (data.users[i].userWantToVisit) {
      userWantToVisit = data.users[i].userWantToVisit.split(", ").map(function (place) {
        return place.split(':')[1] + ';';
      })
    }

    var online = data.users[i].userLastActive === 'online' ? 'online' : 'offline';
    var checked = data.users[i].userApproved ? 'checked' : '';
    var chatCount = data.users[i].chatCount ? data.users[i].chatCount : '';

    html +=
      '<li class="single-email" data-userid="' + data.users[i].userId + '">\
         <div class="single-cell">\
           <p class="user-id">ID: <span>' + data.users[i].userId + '</span></p>\
           <a href="/profile/' + data.users[i].userId + '" class="user-avatar" title="">\
             <img src="' + data.users[i].userPhoto + '" alt="user" class="" style="max-width: 100%;">\
           </a>\
           <a href="https://airybay.com/profile/' + data.users[i].userId + '" class="user-nickname">' + data.users[i].userNickname + '</a>\
             <div class="location" title="' + userCity + '">' + userCity + '</div>\
             <div class="visit" title="' + userWantToVisit + '">\
               ' + userWantToVisit + '\
             </div>\
             <div class="messages-amount">\
               <select name="userGenderId" style="width: 65px;">\
                 <option value="0">---</option>\
                 <option value="1" ' + ((data.users[i].userGenderId == 1) ? 'selected' : '') + '>Female</option>\
                 <option value="2" ' + ((data.users[i].userGenderId == 2) ? 'selected' : '') + '>Male</option>\
               </select>\
               &nbsp;&nbsp;&nbsp;\
             </div>\
             <div class="last-active">\
               <div class="online-status  ' + online + '">\
                 ' + data.users[i].userLastActive + '\
               </div>\
             </div>\
             <div class="register-date">\
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1000 1000">\
                 <path fill="#22416d" d="M684.8 378.7h139v139H685v-139zM684.8 549.2h139v139H685V549zM786\
                 50.7c0-22.3-18.3-40.7-40.6-40.7H738c-22.2 0-40.6 18.4-40.6 40.7V128H786V50.6zM515.2\
                 375h139v139h-139V375zM309 50.7c0-22.3-18.4-40.7-41-40.7h-7c-22.4 0-40.8 18.4-40.8\
                 40.7V128H309V50.6zM345.5 377h138.8v139H345.5V377zM172 722.6h138.8v139H172v-139zM175.6\
                 551h139v139h-139V551z"/>\
                 <path fill="#22416d" d="M851.8 128H786v85.7c0 22.3-18.4 40.7-40.7 40.7H738c-22.3\
                 0-40.7-18.4-40.7-40.7V128H309v85.7c0 22.3-18.4 40.7-41 40.7h-7c-22.4\
                 0-40.8-18.4-40.8-40.7V128h-72c-43.5 0-79 35.4-79 79v704c0 43.4 35.5 79 79\
                 79h526L931 729V207c-.2-43.6-35.6-79-79.2-79zm40.7 605l-155-.6c-43.6-.3-70.8\
                 28.5-70.5 71.8l.8 147h-522c-19.7 0-40.4-13-40.4-36.4V288.3l787-.3v445z"/>\
                 <path fill="#22416d" d="M345.5 547.2h138.8v139.2H345.5V547.2zM175.6 380.5h139v139h-139v-139zM515.2\
                 545.3h139v139h-139v-139zM341.6 719h139v139h-139V719z"/>\
               </svg>\
               <span>' + data.users[i].userRegister + '</span>\
             </div>\
             <div class="coins-amount"><button class="delete-user">delete</button></div>\
             <div class="verify-user">\
               <input class="approve-user" type="checkbox" id="approve-' + data.users[i].userId + '" ' + checked + '>\
               <label for="approve-' + data.users[i].userId + '" style="border: 1px solid gainsboro; padding: 2px">approve</label>\
             </div>\
             <div class="verify-user">\
               <input class="in-feed-user" type="checkbox" id="in-feed-' + data.users[i].userId + '" ' + ((data.users[i].userInFeed) ? 'checked' : '') + '>\
               <label for="in-feed-' + data.users[i].userId + '" style="border: 1px solid gainsboro; padding: 2px">in feed</label>\
             </div>\
             <div class="messages-amount" style="width: 40px">\
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 41 39">\
               <path fill="#22416d" d="M41 17c0-9.4-9.2-17-20.5-17S0 7.6 0 17s8.2 17 19.5 17c1 0\
               2-.2 3-.4C25.8 36.6 33 39 33 39c-2-2.3-3.5-5.6-3.7-6.6C36.3 29.7 41 23.8 41 17zm-29.2\
               2.6c-1.5 0-2.7-1.3-2.7-2.8S10.4 14 12 14c1.5 0 2.7 1.3 2.7 2.8s-1.2 2.8-2.7 2.8zm8.2\
               0c-1.5 0-2.7-1.3-2.7-2.8S18.5 14 20 14c1.5 0 2.8 1.3 2.8 2.8s-1.3 2.8-2.8 2.8zm8\
               0c-1.5 0-2.8-1.3-2.8-2.8S26.5 14 28 14c1.5 0 2.7 1.3 2.7 2.8s-1.2 2.8-2.7 2.8z"/>\
               </svg>\
               <span>' + chatCount + '</span>\
             </div>\
			 <div class="verify-user">\
			   <a href="/models/edit/' + data.users[i].userId + '">Edit</a>\
			 </div>\
           </li>';
  }

  $(".emails-wrapper").append(html);
}

$(document).on('click', '.delete-user', function () {
  if (confirm('Вы действительно хотите удалить юзера ID:' + userId + '?')) {
    var userId = $(this).closest(".single-email").data("userid");
	dataSocket.emit('deleteUser', JSON.stringify({hash: userHash, idToDelete: userId}));
  }
});

dataSocket.on('deleteUser', function (data) {
  if (data.success) {
    $('.single-email[data-userId="' + data.clientId + '"]').remove();
  } else {
    alert('Не удалось удалить юзера ID:' + data.clientId + '. Возможно вам не хватает прав');
  }
});

$(document).on('change', '.approve-user', function () {
	dataSocket.emit('adminUpdateUserParam', JSON.stringify({
		hash: userHash, 
		profileId: $(this).closest(".single-email").data("userid"), 
		key : "userApproved", 
		value : $(this).is(":checked") ? 1 : 0
    }));
});

$(document).on('change', 'select[name=userGenderId]', function () {
	dataSocket.emit('adminUpdateUserParam', JSON.stringify({
		hash: userHash, 
		profileId: $(this).closest(".single-email").data("userid"), 
		key : "userGenderId", 
		value : $(this).val()
    }));
});

$(document).on('change', '.in-feed-user', function () {
	dataSocket.emit('adminUpdateUserParam', JSON.stringify({
		hash: userHash, 
		profileId: $(this).closest(".single-email").data("userid"), 
		key : "userInFeed", 
		value : $(this).is(":checked") ? 1 : 0
    }));
});


function loadData() {
  inProgress = true;
  page += 1;
  dataSocket.emit('getAllUsers', JSON.stringify({hash: userHash, page: page}));
  $('#loader').show();
}
$('#load-more').click(loadData);

// $(window).scroll(function () {
//   if (($(window).scrollTop() + 500) >= ($(".emails-wrapper").height()) && !inProgress)
//     loadData();
// });

$(document).on('click', '.change-gender', function () {
	var userId = $(this).attr('data-userId');
});
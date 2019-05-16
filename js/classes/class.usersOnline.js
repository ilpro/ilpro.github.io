'use strict';
function UsersOnline(socket) {
  this.socket = socket;
};

/** Init **/
UsersOnline.prototype.init = function () {
  var self = this;

  self.socket.emit('getUsersOnline');
  self.initSocketListeners();
};

UsersOnline.prototype.initSocketListeners = function () {
  var self = this;

  self.socket.on('usersOnline', function (data) {
    data = JSON.parse(data);
    self.insertUsersOnline(data);
  })
};

UsersOnline.prototype.insertUsersOnline = function (usersArr) {
  let self = this;
  let htmlAll = '';

  usersArr.forEach((elem, i, arr) => {
    let userName = user.getName(elem);
    let userPhoto = user.getPhoto(elem.userPhoto, userName);

    let html =
      '<a href="/#page=profile&id=' + elem.userId + '" class="online-userbox">\
         <div class="online-avatar">\
           ' + userPhoto + '\
         </div>\
         <div title="Знакомлюсь!" class="online-status-image">\
           <svg  xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 13">\
             <path fill="#ed1e79" d="M14 4c-.2-2.4-1.8-4-3.8-4C9 0 7.6.7 7 2 6.3.6 5 0 3.8 0 1.8 0 .2 1.6 0 4v1.3c.4 1.3 1 \
                 2.4 2 3.3L7 13l5-4.4c1-1 1.6-2 2-3.3V4zm0 0">\
             </path>\
           </svg>\
         </div>\
         ' + self.userfullInfo(elem) + '\
       </a>';

    htmlAll += html;
  });

  $('.online-users-row', '#users-online').html(htmlAll)
};

/** Init **/
UsersOnline.prototype.userfullInfo = function (userObj) {
  const self = this;

  let userName = user.getName(userObj);
  let status = '';
  let bDate = '';
  let eyes ='';
  let hair ='';
  let weight ='';
  let height ='';
  let religion ='';
  let occupation ='';
  let marital ='';
  let children ='';
  let smoke ='';
  let drink ='';
  let abroad ='';
  let goal ='';
  let rating = '';

  //stars0 - показатель звезд, где 0 - нету и до stars5
  rating = '<div class="other-info-title">' + lang.lUsersOnStarsRating + '</div>\
    <div class="rating-container stars'+ userObj.stars +'" style="display: block;">\
            <svg class="rating-star one" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
        <path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
        </svg>\
        <svg class="rating-star two" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
        <path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
        </svg>\
        <svg class="rating-star three" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
        <path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
        </svg>\
        <svg class="rating-star four" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
        <path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
        </svg>\
        <svg class="rating-star five" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15">\
        <path fill="#B3B3B3" d="M7.5 0l2.3 5 5.2.7-3.7 4L12 15l-4.5-2.6L3 15l.8-5.4-3.8-4L5.2 5"></path>\
        </svg>\
        </div>';

  if (userObj.userStatus) {
    status = '<div class="status-holder">\
                <div class="other-info-title">' + lang.lUsersOnStatus + '</div>\
                <div class="user-status">' + userObj.userStatus + '</div>\
              </div>';
  }
  
  if (userObj.userBdate.length > 0) {
    // let date = new Date(userObj.userBdate);
    bDate = '<div class="info-item birthdate clearfix">\
               <div class="info-name">' + lang.lProfileInfoBdate + '</div>\
               <div class="info-parameter">' + userObj.userBdate +'</div>\
             </div>';
  }

  if (userObj.userEyes) {
    eyes = '<div class="info-item eyes clearfix">\
               <div class="info-name">' + lang.lProfileInfoEues + '</div>\
               <div class="info-parameter">' + userObj.userEyes + '</div>\
             </div>';
  }

  if (userObj.userHair) {
    hair = '<div class="info-item hair clearfix">\
              <div class="info-name">' + lang.lProfileInfoHair + '</div>\
              <div class="info-parameter">' + userObj.userHair + '</div>\
            </div>';
  }

  if (userObj.userWeight) {
    weight = '<div class="info-item weight clearfix">\
                <div class="info-name">' + lang.lProfileInfoWeight + '</div>\
                <div class="info-parameter kg">' + userObj.userWeight + '</div>\
                <div class="info-parameter">' + lang.lProfileInfoKG + '</div>\
              </div>';
  }

  if (userObj.userHeight) {
    height = '<div class="info-item height clearfix">\
                <div class="info-name">' + lang.lProfileInfoHeight + '</div>\
                <div class="info-parameter sm">'+ userObj.userHeight +'</div>\
                <div class="info-parameter units">' + lang.lProfileInfoSM + '</div>\
              </div>';
  }

  if (userObj.userReligion) {
    religion = '<div class="info-item religion clearfix">\
                   <div class="info-name">' + lang.lProfileInfoReligion + '</div>\
                   <div class="info-parameter">'+ userObj.userReligion +'</div>\
                 </div>';
  }

  if (userObj.userOccupation) {
    occupation = '<div class="info-item occupation clearfix">\
                   <div class="info-name">' + lang.lProfileInfoOccupation + '</div>\
                   <div class="info-parameter">'+ userObj.userOccupation +'</div>\
                 </div>';
  }

  if (userObj.userMaritalStatus) {
    marital = '<div class="info-item marital-status clearfix">\
                   <div class="info-name">' + lang.lProfileInfoMarital + '</div>\
                   <div class="info-parameter">'+ userObj.userMaritalStatus +'</div>\
                  </div>';
  }

  if (userObj.userChildren) {
    children = '<div class="info-item children clearfix">\
                 <div class="info-name">' + lang.lProfileInfoChildren + '</div>\
                 <div class="info-parameter">'+ userObj.userChildren +'</div>\
               </div>';
  }

  if (userObj.userSmoke) {
    smoke = '<div class="info-item smoke clearfix">\
                   <div class="info-name">' + lang.lProfileInfoSmoke + '</div>\
                   <div class="info-parameter">'+ userObj.userSmoke +'</div>\
                 </div>';
  }

  if (userObj.userDrink) {
    drink = '<div class="info-item drink clearfix">\
               <div class="info-name">' + lang.lProfileInfoDrink + '</div>\
               <div class="info-parameter">'+ userObj.userDrink +'</div>\
             </div>';
  }

  if (userObj.userBeenAbroad) {
    abroad = '<div class="info-item been-abroad clearfix">\
                <div class="info-name">' + lang.lProfileInfoAbroad + '</div>\
                <div class="info-parameter">'+ userObj.userBeenAbroad +'</div>\
              </div>';
  }

  if (userObj.userDatingGoal) {
    goal = '<div class="info-item dating-goal clearfix">\
                <div class="info-name">' + lang.lProfileInfoGoal + '</div>\
                <div class="info-parameter">'+ userObj.userDatingGoal +'</div>\
              </div>';
  }

  let infoHtml =
    '<div class="other-info">\
       <div class="main-info clearfix">\
         <span class="id">id:' + userObj.userId + '</span>\
         <span class="name">' + userName + '</span>\
         <div class="age-city-holder">\
           <span class="age">' + userObj.userAge + '</span>\
           <span class="city">' + userObj.userResidence + '</span>\
         </div>\
         ' + status + '\
         ' + rating + '\
       </div>\
     <div class="other-info-title">' + lang.lInfoEditTitle + '</div>\
       <div class="info-items-container">\
         <div class="info-item residence clearfix">\
           <div class="info-name">' + lang.lProfileInfoResidence + '</div>\
           <div class="info-parameter">' + userObj.userResidence + '</div>\
         </div>\
         '+ bDate +'\
         '+ eyes +'\
         '+ hair +'\
         '+ weight +'\
         '+ height +'\
         '+ religion +'\
         '+ occupation +'\
         '+ marital +'\
         '+ children +'\
         '+ smoke +'\
         '+ drink +'\
         '+ abroad +'\
         '+ goal +'\
       </div>\
    </div>';

  return infoHtml;
};

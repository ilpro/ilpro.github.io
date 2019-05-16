'use strict';

class Auth {
  constructor( socket ) {
    this.socket = socket;
  }

  /** Init listeners **/
  init() {
    this.initEventListeners();
    this.initSocketListeners();
  }


  /** Event listeners, e.g "click" **/
  initEventListeners() {
    const self = this;

    // user logged in
    $( "body" )
	.off("submit", ".form-body.login")
	.on("submit", ".form-body.login", function( e ) {
      e.preventDefault();
      self.login( $( this ) );
    } );

    // user register
    $( "body" )
	.off("submit", ".form-body.register")
	.on("submit", ".form-body.register", function( e ) {
      e.preventDefault();
      self.register( $( this ) );
    } );

    // user logout
    $( "#logout" ).click( function( e ) {
      e.preventDefault();
      self.logout();
    } );

    fadeMenu($(".profile-cover"), $("#authorized-user-menu"));
  }


  /** Socket handlers e.g. socket.on('event') **/
  initSocketListeners() {
    const self = this;

    // handle user info after his login
    self.socket.on( 'authLogin', function( data ) {
      data = JSON.parse(data);
      self.insertInfo( data );
    } );

    // handle user info after register
    self.socket.on( 'authRegister', function( data ) {
	  data = JSON.parse(data);
      if ( data.success )
        notifyUser(lang.lUserRegisterSucsess);
	  else {
        for ( var i = 0; i < data.error.length; i++ )
          notifyUser(data.error[i].text);
      }
    } );

    // user confirms email request
    self.socket.on( 'authConfirm', function( data ) {
      data = JSON.parse(data);
      if ( data.success ) {
		notifyUser( lang.lUserRegisterNotifySucsess );
        self.insertInfo( data );

        if(route.previousPage) {
		  urlHash.pushState({page: route.previousPage});
        } else {
          urlHash.pushState({page: 'main'});
        }
      }
      else
        notifyUser( lang.lUserRegisterNotifyError );
    } );
  }

  /** Emit login info **/
  login( $form ) {
    this.socket.emit( 'authLogin', {
      "email": $form.find( ".email-input" ).val(),
      "pass": $form.find( ".password-input" ).val()
    } );
  }

  socLogin (token) {
    this.socket.emit('authSocLogin', {"token": token});
  }

  /** Emit register info **/
  register( $form ) {
    console.log('register');
    this.socket.emit( 'authRegister', {
      "name": $form.find( ".nickname-input" ).val(),
      "email": $form.find( ".email-input" ).val(),
      "pass": $form.find( ".password-input" ).val(),
      "passRepeat": $form.find( ".password-confirm-input" ).val()
    } );
  }
  
  confirm () {
    let sendData = {
      uid: urlHash.getState("uid"),
      key: urlHash.getState("key")
    };

    this.socket.emit('authConfirm', JSON.stringify(sendData));
  }

  /** Change frontend userbox and delete coookies with hash **/
  logout() {
    // delete cookies
    setCookie( "hash", "", {"path": "/", "expires": -1} );
	setCookie( "search", "", {"path": "/", "expires": -1} );

    // remove user info
    user.info = false;
    user.hash = false;

    // remove info from html
    $( '.profile-name, .user-avatar', '#authorized-user' ).empty();
    $( '#authorized-user' ).hide();
	$(".side-menu .hidden, .side-menu .special").hide();

    // show login button
    $( '#login' ).show();

    // trigger user logout for other functions
    $( document ).trigger( 'userLogout' );
  }

  /** Insert user info into HTML and set cookies for 1 year **/
  insertInfo( response ) {
    const self = this;
    
    if ( response.success ) {
      // set cookie for 1 year
      setCookie( "hash", response.hash, {"path": "/", "expires": 31536000} );

      // close login window
      hideVideoModal();

      // insert info into html
      user.insertLoginInfo( response );

      // get user info to insert into obj
      user.getUserInfo();
      self.socket.emit('updateAuthClient', {hash: response.hash});

      // init notifications for load messages count
      notifications.init({
        totalMsgBox: '#messages-menu',
        userHash: response.hash
      });
    }
    else {
      notifyUser( response.error );
    }
  }
}
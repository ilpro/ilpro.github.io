// SLIDER SWIPER

// var swiper = new Swiper('.swiper-container');
 var swiper = new Swiper('.swiper-container', {
      autoplay: {
      	delay: 3000,
      },    
});

// BURGER MENU
 const burger = document.querySelector('.burger-menu');

	function animateBurger(){
		burger.classList.toggle('open');
	}

	burger.addEventListener('click', animateBurger);


$('.burger-menu').on('click', function(){

	// $('h1').css('color', 'green');
	$('header').toggleClass('show');
	$('.menu').toggleClass('show-menu');
	
});
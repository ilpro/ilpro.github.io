// $('.arrowLeft').click(function() {
// 		$('.population-rating').toggleClass('active');
// 		$(this).toggleClass('rat2');
// 		// $('.active').animate({left: 0 + 'px'},3000);
// 	});

$('.arrowLeft').click(function() {
		$('.population-rating').toggleClass('active');
		$('.arrowLeft2').css('display','block');
		$(this).css('display','none');
		// $('.active').animate({left: 0 + 'px'},3000);
	});


$('.arrowLeft2').click(function() {
	$('.population-rating').toggleClass('active');
		$('.arrowLeft').css('display','block');
		$(this).css('display','none');
		// $('.active').animate({left: 0 + 'px'},3000);
	});



$('.arrowTop').click(function(){
	$('.table-data').toggleClass('activeBottom');
	$('.arrowTop2').css('display', 'block');
	$(this).css('display', 'none');
});

$('.arrowTop2').click(function(){
	$('.table-data').toggleClass('activeBottom');
	$('.arrowTop').css('display', 'block');
	$(this).css('display', 'none');
});








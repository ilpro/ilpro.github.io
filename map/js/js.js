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


$('.arrowRight').click(function(){
	$('.diagram').toggleClass('activeRight');
	$('.arrowRight2').css('display', 'block');
	$(this).css('display','none');
});


$('.arrowRight2').click(function(){
	$('.diagram').toggleClass('activeRight');
	$('.arrowRight').css('display','block');
	$(this).css('display', 'none');
});




// ChartsJs


var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: ['line'],

    // The data for our dataset
    data: {
        labels: [12, 19, 26, 33, 40, 47, 54, 61, 68],
        datasets: [{
            label: 'Жінки',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#FF0080',
            borderColor: '#FF0080',
            data: [40, 22, 43, 16, 20, 38, 35]
        },

        {
        	label: 'Чоловіки',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#0090FF',
            borderColor: '#0090FF',
            data: [12, 20, 32, 39, 32, 28, 32, 34, 24 ]
        }]
    },

    // Configuration options go here
    options: {}
});





// RANGE SLIDER


// $( function() {
//     	$( "#slider-range" ).slider({
//       		range: true,
//       		min: 0,
//       		max: 100,
//       		values: [ 18, 74 ],
//       		slide: function( event, ui ) {
//         $( "#amount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );

//       }
//     });
//     $( "#amount" ).val( $( "#slider-range" ).slider( "values", 0 ) +
//       " - " + $( "#slider-range" ).slider( "values", 1 ) );
//   } );



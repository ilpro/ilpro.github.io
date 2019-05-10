
$(function(){

$('.company-item_link').click(function(){
	$('.formats-table').show();
	$('.page-content').hide();
});


$('.creat-company').click(function(){

	$('.creat-company_items').toggleClass('active-company');
	$(this).toggleClass('creat-company_active');
	$('svg:eq(1)').toggleClass('svg-active');
	$('svg:eq(0)').toggleClass('svg-active2');
});


$('.cross').click(function(){

	$('.formats-table').hide();
	$('.page-content').show();	

});


$('button.but').click(function(){

	$('.but').removeClass('active-button');
	$(this).addClass('active-button');

});


$('button.but-tab').click(function(){

	$('.but-tab').removeClass('active-buttons_table');
	$(this).addClass('active-buttons_table');

});



});


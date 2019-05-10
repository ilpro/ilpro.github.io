
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

	if($('button.but:eq(1)').hasClass('active-button')){
		$('.formats').show();
		$('.domains').hide();
	}

	else {
		$('.formats').hide();
		$('.domains').show();
	}

});


$('button.but-tab').click(function(){

	$('.but-tab').removeClass('active-buttons_table');
	$(this).addClass('active-buttons_table');

});


$('button.buttons-act').click(function(){

	$('.buttons-act').removeClass('active-button2');
	$(this).addClass('active-button2');


	if($('button.buttons-act:eq(0)').hasClass('active-button2')){
		$('.table-domains').css('display','flex');
		$('.table-formats').hide();
		$('.table-devices').hide();
	}

	else if ($('button.buttons-act:eq(1)').hasClass('active-button2')){
		$('.table-formats').show();
		$('.table-domains').hide();
		$('.table-devices').hide();
	}

	else {
		$('.table-formats').hide();
		$('.table-domains').hide();
		$('.table-devices').show();
	}

});


$('li.list-active').click(function(){

	$('.list-active').removeClass('active');
	$(this).addClass('active');

});


});


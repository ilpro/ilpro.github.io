$(function(){

$('.company-item_link').click(function(){
	$('.formats-table').show();
	$('.page-content').hide();
});


$('.cross').click(function(){

	$('.formats-table').hide();
	$('.page-content').show();	

});

$('.creat-company').click(function(){
	$('.creat-company_items').toggleClass('active-company');
	$(this).toggleClass('creat-company_active');
	$('svg:eq(1)').toggleClass('svg-active');
	$('svg:eq(0)').toggleClass('svg-active2');
});

$('.delete-company').click(function(){
	$(this).toggleClass('delete-company_active');
	$('.check-active').toggleClass('check-active2');
	$('svg:eq(3)').toggleClass('svg-active');
	$('svg:eq(2)').toggleClass('svg-active2');
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


$('button.but2').click(function(){

	$('.but2').removeClass('active-button3');
	$(this).addClass('active-button3');

	if($('button.but2:eq(0)').hasClass('active-button3')){
		$('.formats').show();
		$('.dates').hide();
	}

	else {
		$('.formats').hide();
		$('.dates').show();
	}

});


$('.classic-tab').click(function(){

	$('.classic-tab').removeClass('active');
	$(this).addClass('active');

	if($('.classic-tab:eq(0)').hasClass('active')){
		$('.page-content').show();
		$('.page-banners').hide();
	}

	else {
		$('.page-content').hide();
		$('.page-banners').show();
	}

});


$('button.but-tab').click(function(){

	$('.but-tab').removeClass('active-buttons_table');
	$(this).addClass('active-buttons_table');

});

$('.heading-item').click(function(){
	$('.heading-item svg').removeClass("panel-item_active");
	$(this).find("svg").addClass('panel-item_active');
	// $('this').addClass('panel-item_active');
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


$('li.filter-item').click(function(){

	$('.filter-item').removeClass('active');
	$(this).addClass('active');

});

$('.clickable').click(function(){
	$('.clickable').removeClass('active');
	$(this).addClass('active');
	$('.company-item_link svg path').toggleClass('svg-col');

});


$('.add-button').click(function(){
	$('.form-add-banner').addClass('active');
	$('.bg-shadow').addClass('active');

});

$('.close-cross').click(function(){
	$('.form-add-banner').removeClass('active');
	$('.bg-shadow').removeClass('active');

});

});


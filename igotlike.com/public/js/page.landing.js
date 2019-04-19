var end = new Date('04/15/2018 0:0 AM');

var _second = 1000;
var _minute = _second * 60;
var _hour = _minute * 60;
var _day = _hour * 24;
var timer;

function showRemaining() {
	var now = new Date();
	var distance = end - now;
	
	if (distance < 0) {
		clearInterval(timer);
		document.getElementById('countdown').innerHTML = 'EXPIRED!';

		return;
	}
	
	var days = Math.floor(distance / _day);
	var hours = Math.floor((distance % _day) / _hour);
	var minutes = Math.floor((distance % _hour) / _minute);
	var seconds = Math.floor((distance % _minute) / _second);

	document.getElementById('countdown').innerHTML = '<div class="time-item"> <p>' + days + '</p><p>days</p><div>';
	document.getElementById('countdown').innerHTML += '<div class="time-item"> <p>' + hours + '</p><p>hours</p><div>';
	document.getElementById('countdown').innerHTML += '<div class="time-item"> <p>' + minutes + '</p><p>min</p><div>';
	document.getElementById('countdown').innerHTML += '<div class="time-item"> <p>' + seconds + '</p><p>sec</p><div>';
}

timer = setInterval(showRemaining, 1000);
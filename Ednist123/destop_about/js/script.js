
/* NavigationMenu */
navMenu.onclick = function myFunction() {

	var x = document.getElementById('myTopnav');
	if (x.className === 'topnav'){
		x.className += 'responsive';
	}
	else{
		x.className = 'topnav';
	}
}

var image = document.getElementById('myImage');

	image.addEventListener('click', function(){

   if (image.getAttribute('src') == "img/krest.png"){

      image.src = "img/kub.png"}

   else{

      image.src = "img/krest.png"}


});


/* AboutUsForm */

function openbox(){

    display = document.getElementById('box').style.display;

    if(display=='none'){
       document.getElementById('box').style.display='block';
    }
    else{
       document.getElementById('box').style.display='none';
    }
}


var stream, profileId;

var swiper = $('.swiper-container').swiper({
    nextButton: '.swiper-button-next',
    prevButton: '.swiper-button-prev',
    pagination: false,
    paginationClickable: false,
    preloadImages: false,
    lazyLoading: true,
    slidesPerView: 3,
    spaceBetween: 0,
	onSlideChangeEnd: function(e) {
		// когда пролистываеш слайд подгружать камеру
		/* var n = e.activeIndex + 2;
		var item = $(".ln-girlsoncamera .swiper-slide:eq(" + n + ")");
		if(!item.hasClass("init")) {
			profileId = item.data("id");
			stream = new RtmpStreamer(document.getElementById('rtmp-player-' + profileId)); 
			stream.play("rtmp://88.198.197.185:1935/live", "id" + profileId + "s");
			stream.setScreenSize(640, 480);
			item.addClass("init");
		} */
	}
});

if(document.getElementById("myChart")) {
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: ["", "", "", "1ST QUARTER","", "", "",  "2ND QUARTER","", "", "",  "3RD QUARTER","", "", "",  "4TH QUARTER","", "", "",  "UP TO DATE"],
			datasets: [
				{

					backgroundColor: "rgba(0,0,0,0)",
					borderColor: "#22416d",
					data: [2000, 2200, 2100, 2500, 2800, 3000, 2700, 3000, 3100, 2900, 3400, 3500, 3600, 3500, 3900, 3800, 3400, 3600, 3700, 4000, 5000]
				}, {
					backgroundColor: "rgba(0,0,0,0)",
					borderColor: "#CE0061",
					data: [2200, 2400, 2300, 2700, 2900, 2800, 3100, 3300, 3200, 3500, 3800, 3900, 3900, 3800, 4100, 4000, 4000, 4100, 4200, 4600, 5000]
				}
			]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero:true
					}
				}],
				xAxes: [{
					categoryPercentage: 1.0,
					barPercentage: 1.0
				}]
			},
			legend: {
				display: false,
			}
		}
	});
}
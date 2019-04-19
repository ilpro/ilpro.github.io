$("#ipspUSD").on("submit", function(e){
	if(!$(".agreement input:checked").length) {
		e.preventDefault();
		alert("Check Terms & Conditions!")
	}
})
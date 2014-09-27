function exploreTile(){
	var selectedValue = $('#names').val();
	var imgUrl = '/' + selectedValue;
	$('#daimg').attr('src', '/' + selectedValue);

	var context = $("#cnv")[0].getContext('2d');
	//context.clearRect(0, 0, 1280, 720);
	var image = new Image();
	image.onload = function() {
		$('#size').text(image.width + " x " + image.height);
		for(var x = 0; x < 1280; x += image.width){
			for(var y = 0; y < 720; y += image.height){
				//context.drawImage(image, x, 0, image.width, image.height, x, 0, image.width, image.height);
				context.drawImage(image, x, y, image.width, image.height);
			}
		}
	};
	image.src = imgUrl;
}

function toggleUseCanvas(){
	$('#daimg').toggle();
	$('#cnv').toggle();
}

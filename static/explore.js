
// convert component stream to pixels
function toPixels(imgData){
	var result = [];
	var bpp = 4;	//4 bits per pixel (RGBA)
	console.log("DEBUG: width = " + imgData.width + ", height = " + imgData.height + " imgdata.length = " + imgData.data.length);
	for(var y = 0; y < imgData.height; y++){
		var row = [];
		for(var x = 0; x < imgData.width; x++){
			var index = 4 * ((imgData.width * y) + x);
			row.push({ "r": imgData.data[index], "g": imgData.data[index+1], "b": imgData.data[index+2], "a": imgData.data[index+3]});
		}
		result.push(row);
	}
	return result;
}

function componentUnderThreshold(x, xPrime, threshold){
	if(x == xPrime){
		return true;
	}
	var num = (x - xPrime) * 100.0;
	var den = Math.max(x, xPrime);
	var percent = Math.abs(num / den);
	return percent <= threshold;
}

function rgbUnderThreshold(reference, pixel, threshold){
	return componentUnderThreshold(reference.r, pixel.r, threshold) &&
		componentUnderThreshold(reference.g, pixel.g, threshold) &&
		componentUnderThreshold(reference.b, pixel.b, threshold);
}

function columnUnderThreshold(reference, colPixels, threshold){
	return colPixels.every(function(pixel){
		return rgbUnderThreshold(reference, pixel, threshold);
	});
}

function getColumn(pixels, index){
	return pixels.map(function(row){
		return row[index];
	});
}

function findLeftCropRect(imageData, threshold){
	var pixels = toPixels(imageData);
	var firstPixel = pixels[0][0];
	console.log("pixels = " + pixels[0].length + "x" + pixels.length);
	console.log("firstPixel = " + JSON.stringify(firstPixel));
	var x = 0;
	while((x < imageData.width) && columnUnderThreshold(firstPixel, getColumn(pixels, x), threshold)){
		x++;
	}
	return {"width": x, "height": imageData.height};
}

function updatePalette(filename){
	var url = '/palette/' + filename;
	$.ajax({
		url: url,
	}).done(function(data){
		console.log("palette data => " + data[0]);
		var rgb = function(p){
			return "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
		}

		$('#pcolor1').css('background-color', rgb(data[0]));
		$('#pcolor2').css('background-color', rgb(data[1]));
		$('#pcolor3').css('background-color', rgb(data[2]));
		$('#pcolor4').css('background-color', rgb(data[3]));
		$('#pcolor5').css('background-color', rgb(data[4]));
		$('#palette').show();
	});
}

function updateEntropy(filename){
	var url = '/entropy/' + filename;
	$.ajax({
		url: url,
	}).done(function(data){
		$('#entropy').text("Entropy: " + data.entropy.toFixed(3));
		$('#entropy').show();
	});
}

function exploreTile(){
	var selectedValue = $('#names').val();
	var imgUrl = '/' + selectedValue;
	$('#throbber').show();
	$('#palette').hide();
	$('#entropy').hide();
	$('#analyze').hide();
	$('#daimg').attr('src', '/' + selectedValue);
	$('#served').one('load', function(){ 
		$('#throbber').hide();
		updatePalette(selectedValue);
		updateEntropy(selectedValue);
	});
	$('#served').attr('src', '/scaled/' + selectedValue);

	var context = $("#cnv")[0].getContext('2d');
	context.clearRect(0, 0, 1280, 720);
	var image = new Image();
	image.onload = function() {
		$('#size').text(image.width + " x " + image.height);
		for(var x = 0; x < 1280; x += image.width){
			for(var y = 0; y < 720; y += image.height){
				context.drawImage(image, x, y, image.width, image.height);
			}
		}
		var imageData = context.getImageData(0, 0, Math.min(1280, image.width), Math.min(720, image.height));
		var leftRect = findLeftCropRect(imageData, 10);
	};
	image.src = imgUrl;
}

function showHideTiles(raw, canvas, served, analyze){
	raw ? $('#daimg').show() : $('#daimg').hide();
	canvas ? $('#cnv').show() : $('#cnv').hide();
	served ? $('#served').show() : $('#served').hide();
	analyze ? $('#analyze').show() : $('#analyze').hide();
}

function contentAnalyze(){
	console.log('analyzing...');
	console.log("Width: " + $('#analyze').width());
	var canvas = $('#analyze')[0];
	var context = canvas.getContext('2d');
	var image = new Image();
	image.onload = function(){
		console.log("Loaded.");
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		var data = imageData.data;
		console.log("Data length = " + data.length);
		for(var i = 0; i < data.length; i += 4) {
			var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
			data[i + 0] = brightness;
			data[i + 1] = brightness;
			data[i + 2] = brightness;
		}
		console.log("Done analyzing!");
		context.putImageData(imageData, 0, 0);
	}
	console.log("Setting new image source to " + $('#served').attr('src'));
	image.src =  $('#served').attr('src');
	showHideTiles(false, false, false, true);
}

$(document).ready(function() {
	$('#raw').click(function(){
		showHideTiles(true, false, false);
	});
	$('#canvas').click(function(){
		showHideTiles(false, true, false);
	});
	$('#serv').click(function(){
		showHideTiles(false, false, true);
	});
});

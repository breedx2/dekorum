
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

function makeGrayscale(imageData){
	var data = imageData.data;
	console.log("Data length = " + data.length);
	for(var i = 0; i < data.length; i += 4) {
		var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
		data[i + 0] = brightness;
		data[i + 1] = brightness;
		data[i + 2] = brightness;
	}
}

function computeHistogram(imageData){
	var data = imageData.data;
	console.log("Data length = " + data.length);
	var hist = [];
	for(var i = 0; i < data.length; i += 4) {
		var pixelVal = data[i];
		if(hist[pixelVal]){
			hist[pixelVal] = hist[pixelVal] + 1;
		}
		else{
			hist[pixelVal] = 1;
		}
	}
	return hist;
}

function findMedianPixelValue(imageData){
	var j = 0;
	var terse = [];
	for(var i = 0; i < imageData.data.length; i += 4) {
		terse[j++] = imageData.data[i];
	}
	terse.sort();
	return terse[ terse.length / 2];
}

function threshhold(imageData, medianPixel){
	console.log("Performing threshhold at " + medianPixel);
	for(var i = 0; i < imageData.data.length; i += 4) {
		var val = 255; //white
		if(imageData.data[i + 0] >= medianPixel){
			val = 0;
		}
		imageData.data[i + 0] = val;
		imageData.data[i + 1] = val;
		imageData.data[i + 2] = val;
	}
}

function highlightTransitions(imageData){
	var y = imageData.height/2;
	console.log("Highlighting transitions at y =", y, "width", imageData.width, "height", imageData.height);
	var distance = 0;
	function offset(x){
		return 4*((imageData.width * y) + x);
	}
	for(var x = 0; x < imageData.width - 1; x++){
		var val = imageData.data[offset(x)];
		var nextVal = imageData.data[offset(x+1)];
		if(val != nextVal){
			imageData.data[offset(x)+0] = 255;
			imageData.data[offset(x)+1] = 0;
			imageData.data[offset(x)+2] = 0;
			distance++;
		}
		else {
			imageData.data[offset(x)+0] = 255;
			imageData.data[offset(x)+1] = 180;
			imageData.data[offset(x)+2] = 180;
			distance = 0;
		}
	}
}

function findHorizCrossings(imageData, y){
	console.log("Finding crossings at y =", y, "width", imageData.width, "height", imageData.height);
	var distance = 0;
	var crossings = [];
	function offset(x){
		return 4*((imageData.width * y) + x);
	}
	for(var x = 0; x < imageData.width - 1; x++){
		var val = imageData.data[offset(x)];
		var nextVal = imageData.data[offset(x+1)];
		if(val != nextVal){
			crossings.push(x);
		}
	}
	var result = {};
	result[y] = crossings;
	return result;
}

function pixelFromOffset(imageData, offset){
	return [imageData.data[offset+0], imageData.data[offset+1], imageData.data[offset+2]];
}

function measureHorizCrossings(imageData, y, crossingIndexes){
	function offset(x){
		return 4*((imageData.width * y) + x);
	}
	crossingIndexes.forEach(function(x){
		var rgbPixel = pixelFromOffset(imageData, offset(x));
		var nextRgbPixel = pixelFromOffset(imageData, offset(x+1));
		console.log("Pixel:", rgbPixel, "nextPixel:", nextRgbPixel, "delta-e:", colorDiff(rgbPixel, nextRgbPixel));
	});
	console.log("DERP", Math.max(2,9,21,33,7.8));
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
		var originalImageData = {
			width: imageData.width,
			height: imageData.height,
			data: new Uint8ClampedArray(imageData.data)
		};
		makeGrayscale(imageData);
		var hist = computeHistogram(imageData);
		var medianPixel = findMedianPixelValue(imageData);
		threshhold(imageData, medianPixel);

		var crossings = findHorizCrossings(imageData, 150);
		console.log("Crossings at 150:", crossings);
		measureHorizCrossings(originalImageData, 150, crossings[150]);

		highlightTransitions(imageData);
		console.log("Median pixel value is: " + medianPixel);
		console.log(hist);

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

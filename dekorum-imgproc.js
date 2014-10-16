var getpixels = require("get-pixels");
var fs = require('fs');
var PNG = require('pngjs').PNG;

// Converts the filename to a 720p PNG
function make720p(filename, callback){
	console.log("Converting to 720p: " + filename);
	getpixels(filename, 'image/jpeg', function(err, pixels){
		if(err){
			console.log("Error loading " + filename + ": " + err);
			return;
		}
		console.log("got pixels", pixels.shape.slice());

		pixels = autocrop(pixels, 10);	//consider a more flexible/configurable threshold
		var sourceWidth = pixels.shape[0];
		var sourceHeight = pixels.shape[1];
		var sourceDepth = pixels.shape[2];	//assumed to be 4bpp

		//TODO: Should autocrop happen before flinging pixels to png?

		var png = new PNG({
			'width': 1280, 'height': 720, filterType: -1
		});
		for(var y = 0; y < 720; y++){
			for(var x = 0; x < 1280; x++){
				var index = 4 * ((1280 * y) + x);
				png.data[index+3] = 50;
			}
		}
		for(var y = 0; y < Math.min(720, sourceHeight); y++){
			for(var x = 0; x < Math.min(1280, sourceWidth); x++){
				var index = 4 * ((1280 * y) + x);
				png.data[index + 0] = pixels.get(x, y, 0);
				png.data[index + 1] = pixels.get(x, y, 1);
				png.data[index + 2] = pixels.get(x, y, 2);
				png.data[index + 3] = pixels.get(y, x, 3);
			}
		}
		callback(png.pack());
	});
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
	return componentUnderThreshold(reference.get(0), pixel.get(0), threshold) &&
		componentUnderThreshold(reference.get(1), pixel.get(1), threshold) &&
		componentUnderThreshold(reference.get(2), pixel.get(2), threshold);
}

function columnUnderThreshold(reference, colPixels, threshold){
	for(var i = 0 ; i < colPixels.shape[0] ; i++){
		var pixel = colPixels.pick(i);
		if(!rgbUnderThreshold(reference, pixel, threshold)){
			return false;
		}
	}
	return true;
}

function findLeftCropRect(pixels, threshold){
	var x = 0;
	var firstPixel = pixels.pick(x,0);
	while((x < pixels.shape[0]) && columnUnderThreshold(firstPixel, pixels.pick(x, null, null), threshold)){
		x++;
	}
	return {"width": x, "height": pixels.shape[1]};
}

function findRightCropRect(pixels, threshold){
	var x = pixels.shape[0]-1;
	var firstPixel = pixels.pick(x, 0);
	while((x >= 0) && columnUnderThreshold(firstPixel, pixels.pick(x, null, null), threshold)){
		x--;
	}
	return {"width": x, "height": pixels.shape[1]};
}

function autocropLeft(pixels, threshold){
	var rect = findLeftCropRect(pixels, threshold);
	console.log("left crop rect = " + JSON.stringify(rect));
	return pixels.lo(rect.width, 0, 0);
}

function autocropRight(pixels, threshold){
	var rect = findRightCropRect(pixels, threshold);
	console.log("right crop rect = " + JSON.stringify(rect));
	return pixels.hi(rect.width, pixels.shape[1], pixels.shape[2]);
}

function autocrop(pixels, threshold){
	console.log("Autocropping image...");
	pixels = autocropLeft(pixels, threshold);
	return autocropRight(pixels, threshold);
}

module.exports = {
    make720p: make720p 
};

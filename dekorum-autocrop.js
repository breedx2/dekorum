
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
	return {"width": x >= (pixels.shape[0]/2) ? 0 : x, "height": pixels.shape[1]};
}

function findRightCropRect(pixels, threshold){
	var x = pixels.shape[0] - 1;
	var firstPixel = pixels.pick(x, 0);
	while((x >= 0) && columnUnderThreshold(firstPixel, pixels.pick(x, null, null), threshold)){
		x--;
	}
	return {"width": x <= (pixels.shape[0]/2) ? 0 : pixels.shape[0] - 1 - x, "height": pixels.shape[1]};
}

function findTopCropRect(pixels, threshold){
	var y = 0;
	var firstPixel = pixels.pick(0, y);
	while((y < pixels.shape[1]) && columnUnderThreshold(firstPixel, pixels.pick(null, y, null), threshold)){
		y++;
	}
	return {"width": pixels.shape[0], "height": y >= (pixels.shape[1]/2) ? 0 : y};
}

function findBottomCropRect(pixels, threshold){
	var y = pixels.shape[1] - 1;
	var firstPixel = pixels.pick(0, y);
	while((y >= 0) && columnUnderThreshold(firstPixel, pixels.pick(null, y, null), threshold)){
		y--;
	}
	return {"width": pixels.shape[0], "height": y <= (pixels.shape[1]/2) ? 0 : pixels.shape[1] - 1 - y};
}

function autocropLeft(pixels, threshold){
	var rect = findLeftCropRect(pixels, threshold);
	console.log("left crop rect = " + JSON.stringify(rect));
	return pixels.lo(rect.width, 0, 0);
}

function autocropRight(pixels, threshold){
	var rect = findRightCropRect(pixels, threshold);
	console.log("right crop rect = " + JSON.stringify(rect));
	return pixels.hi(pixels.shape[0] - rect.width, pixels.shape[1], pixels.shape[2]);
}

function autocropTop(pixels, threshold){
	var rect = findTopCropRect(pixels, threshold);
	console.log("top crop rect = " + JSON.stringify(rect));
	return pixels.lo(0, rect.height, 0);
}

function autocropBottom(pixels, threshold){
	var rect = findBottomCropRect(pixels, threshold);
	console.log("bottom crop rect = " + JSON.stringify(rect));
	return pixels.hi(pixels.shape[0], pixels.shape[1] - rect.height, pixels.shape[2]);
}

function autocrop(pixels, threshold){
	console.log("Autocropping image..." + pixels.shape[0] + " x " + pixels.shape[1]);
	pixels = autocropLeft(pixels, threshold);
	pixels = autocropRight(pixels, threshold);
	pixels = autocropTop(pixels, threshold);
	pixels = autocropBottom(pixels, threshold);
	return pixels;
}

module.exports = {
    autocrop: autocrop 
};

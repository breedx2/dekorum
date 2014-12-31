
exports = module.exports

module.exports = {
    entropy: entropy,
};

function rgbaToInt(pixelData, offset){
	var r = pixelData[offset + 0];
	var g = pixelData[offset + 1];
	var b = pixelData[offset + 2];
	var a = pixelData[offset + 3];
	return (r << 24) || (g << 16) || (b << 8) || a;
}

function histogram(pixelData){
	var histogram = {};
	console.log("DEBUG: length = " + pixelData.length);
	for(var i=0; i < pixelData.length; i += 4){
		var val = rgbaToInt(pixelData, i);
		if(histogram[val]){
			histogram[val] = histogram[val] + 1;
		}
		else{
			histogram[val] = 1;
		}
	}
	return histogram;
}

function probabilities(kv, signalSize){
	var keys = Object.keys(kv);
	var result = [];
	keys.forEach(function(k){
		var probability = kv[k] / signalSize;
		result.push(probability);
	});
	return result;
}

function entropy(pixelData){
	console.log("Calculating image entropy...");
	var hist = histogram(pixelData);
	var histlen = Object.keys(hist).length;
	console.log("Got histogram of length " + histlen);
	console.log(hist);
	var probs = probabilities(hist, pixelData.length / 4.0);
	console.log(probs);

	var result = 0;
	probs.forEach(function(v){
		result = result + ( v * Math.log(v));
	});
	result = -1 * result;
	console.log("ENTROPY: " + result);
	return result;
}

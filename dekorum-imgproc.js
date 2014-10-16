var getpixels = require("get-pixels");
var fs = require('fs');
var PNG = require('pngjs').PNG;
var autocrop = require('./dekorum-autocrop');

// Converts the filename to a 720p PNG
function make720p(filename, callback){
	console.log("Converting to 720p: " + filename);
	getpixels(filename, 'image/jpeg', function(err, pixels){
		if(err){
			console.log("Error loading " + filename + ": " + err);
			return;
		}
		console.log("got pixels", pixels.shape.slice());

		pixels = autocrop.autocrop(pixels, 10);	//consider a more flexible/configurable threshold

		var sourceWidth = pixels.shape[0];
		var sourceHeight = pixels.shape[1];
		var sourceDepth = pixels.shape[2];	//assumed to be 4bpp

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

module.exports = {
    make720p: make720p 
};

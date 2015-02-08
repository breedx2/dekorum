
function rgbToHsv(rgb){
	var r2 = rgb[0]/255.0;
	var g2 = rgb[1]/255.0;
	var b2 = rgb[2]/255.0;
	var cmax = Math.max(r2, g2, b2);
	var cmin = Math.min(r2, g2, b2);
	var delta = cmax - cmin;
	if(delta == 0){	//black, white, gray
		return [0, 0, cmin];
	}
	var d = (r2 == cmin) ? g2 - b2 : ((b2 == cmin) ? r2 - g2 : b2 - r2);
	var h = (r2 == cmin) ? 3 : ((b2 == cmin) ? 1 : 5);
	var hue = 60 * (h - d/delta);
	var sat = delta / cmax;
	var val = cmax;
	return [hue/360.0, sat, val];
}

// Do a rgb->xyz->lab for each pixel, then compute cie1994 delta-e
function colorDiff(rgb1, rgb2){
	var lab1 = rgbToLab(rgb1);
	var lab2 = rgbToLab(rgb2);
	return cie1994(lab1, lab2, true);	//isTextiles??
}

function rgbToLab(rgb){
	return xyzToLab(rgbToXyz(rgb));
}

//taken largely from http://html5hub.com/exploring-color-matching-in-javascript/
// Convert RGB to XYZ
function rgbToXyz(rgb){
    var _r = (rgb[0] / 255);
    var _g = (rgb[1] / 255);
    var _b = (rgb[2] / 255);
 
    if (_r > 0.04045) {
        _r = Math.pow(((_r + 0.055) / 1.055), 2.4);
    }
    else {
        _r = _r / 12.92;
    }
 
    if (_g > 0.04045) {
        _g = Math.pow(((_g + 0.055) / 1.055), 2.4);
    }
    else {                 
        _g = _g / 12.92;
    }
 
    if (_b > 0.04045) {
        _b = Math.pow(((_b + 0.055) / 1.055), 2.4);
    }
    else {                  
        _b = _b / 12.92;
    }
 
    _r = _r * 100;
    _g = _g * 100;
    _b = _b * 100;
 
    X = _r * 0.4124 + _g * 0.3576 + _b * 0.1805;
    Y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722;
    Z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505;
 
    return [X, Y, Z];
};

// Convert XYZ to LAB
function xyzToLab(xyz){
    var ref_X =  95.047;
    var ref_Y = 100.000;
    var ref_Z = 108.883;
 
    var _X = xyz[0] / ref_X;
    var _Y = xyz[1] / ref_Y;
    var _Z = xyz[2] / ref_Z;
 
    if (_X > 0.008856) {
         _X = Math.pow(_X, (1/3));
    }
    else {                 
        _X = (7.787 * _X) + (16 / 116);
    }
 
    if (_Y > 0.008856) {
        _Y = Math.pow(_Y, (1/3));
    }
    else {
      _Y = (7.787 * _Y) + (16 / 116);
    }
 
    if (_Z > 0.008856) {
        _Z = Math.pow(_Z, (1/3));
    }
    else { 
        _Z = (7.787 * _Z) + (16 / 116);
    }
 
    var CIE_L = (116 * _Y) - 16;
    var CIE_a = 500 * (_X - _Y);
    var CIE_b = 200 * (_Y - _Z);
 
    return [CIE_L, CIE_a, CIE_b];
};

// Finally, use cie1994 to get delta-e using LAB
function cie1994(lab1, lab2, isTextiles) {
    var x = {l: lab1[0], a: lab1[1], b: lab1[2]};
    var y = {l: lab2[0], a: lab2[1], b: lab2[2]};
    var k1;
    var kl;
    var kh = 1;
    var kc = 1;
    if (isTextiles) {
        k2 = 0.014;
        k1 = 0.048;
        kl = 2;
    }
    else {
        k2 = 0.015;
        k1 = 0.045;
        kl = 1;
    }
 
    var c1 = Math.sqrt(x.a * x.a + x.b * x.b);
    var c2 = Math.sqrt(y.a * y.a + y.b * y.b);
 
    var sh = 1 + k2 * c1;
    var sc = 1 + k1 * c1;
    var sl = 1;
 
    var da = x.a - y.a;
    var db = x.b - y.b;
    var dc = c1 - c2;
 
    var dl = x.l - y.l;
    var dh = Math.sqrt(da * da + db * db - dc * dc);
 
    var result = Math.sqrt(Math.pow((dl/(kl * sl)),2) + Math.pow((dc/(kc * sc)),2) + Math.pow((dh/(kh * sh)),2));
	return isNaN(result) ? 0 : result;
};
 

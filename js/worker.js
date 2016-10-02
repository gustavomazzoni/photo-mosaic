// worker
importScripts('image-helper.js');

this.onmessage = function(event) {
    var rgb = ImageHelper.getAverageRGB(event.data.imageData),
        // Convert color in rgb to hex
        colorHex = ImageHelper.rgbToHex(rgb.r, rgb.g, rgb.b);
    
	this.postMessage({
		index: event.data.index, 
		result: {imageData: event.data.imageData, colorHex: colorHex, index: event.data.tileIndex}
	});
}

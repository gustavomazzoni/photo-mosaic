var PhotoMosaic = (function(document){
	"use strict";

	var fabric = {}

	// limits of image size
	var MAX_HEIGHT = 680;
	var MAX_WIDTH = 680;
	// Resize the image in case it's bigger than the limit size
	function scaleSize(img){
		if (img.width < MAX_WIDTH && img.height < MAX_HEIGHT) return img;

		if (img.width > MAX_WIDTH) {
			img.height *= MAX_WIDTH / img.width;
			img.width = MAX_WIDTH;
		}
		if (img.height > MAX_HEIGHT) {
			img.width *= MAX_HEIGHT / img.height;
			img.height = MAX_HEIGHT;
		}
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img, 0, 0, img.width, img.height);
		var resizedImage = new Image();
		resizedImage.src = canvas.toDataURL();
		return resizedImage;
	}

	fabric.generate = function (image) {
		var start = performance.now(); //new Date().getTime();

		// Resize the image in case it's bigger than the limit size
		image = scaleSize(image);
		
		// Create promise to return the result when to whole canvas is ready
		var promise = new Promise(function(resolve, reject) {
			var canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			var context = canvas.getContext("2d");

			// call function to composite the tiles results into a photomosaic of the original image
			var photomosaic = new PhotoMosaic(image, TILE_WIDTH, TILE_HEIGHT);
			photomosaic.build().then(function(result) {
				for (var i = 0; i < result.length; i++) {
					var tile = result[i];
					context.drawImage(tile.image, tile.x, tile.y, tile.width, tile.height);
				};

				resolve(canvas);
				var end = performance.now(); //new Date().getTime();
				console.log('Execution time (ms): '+(end - start).toFixed(4));
			}, function(err) {
				reject(err);
			});
		});
		return promise;
	}

	function PhotoMosaic(image, width, height) {
		var _originalImage = image;
		var _tileWidth = width;
		var _tileHeight = height;

		var _worker = new Worker("js/worker.js");

	    var _index = 0;
		var _handlers = [];

		_worker.onmessage = function(e) {
			var handler = _handlers[e.data.index];
			if (e.data.err){
				handler.reject(e.data.err);
			} else {
				handler.resolve(e.data.result);
			}
		}

		// computes the average color of each tile,
		// fetches a tile from the server for that color, and
		// composites the results into a photomosaic of the original image.
		this.build = function() {
			// divides the image into tiles
			var slicedImageList = sliceImageIntoTiles();

			var promise = new Promise(function(resolve, reject) {
		  		var count = 0;
				for (var i = 0, l = slicedImageList.length; i < l; i++) {
					var tile = slicedImageList[i];
					var tileImage = new Image();
					tileImage.src = tile.src;
					var imageData = getImageData(tileImage);

					getAverageColor(imageData, i).then(function(result) {
						// Set the source image to the one fetched from the server for the color
						var sourceTile = "color/"+result.colorHex.substring(1);

						// create an image object and set the url source to preload the image
						var tempImg = new Image();
						tempImg.src = sourceTile;

						tempImg.onload = function(e) {
							var tile = slicedImageList[result.index];
							tile.src = e.target.src;
							tile.image = e.target;
							
							count++;

							if (count === l) {
								resolve(slicedImageList);
							}
						};
					}, function(err) {
						reject(err);
					});
				};
			});
			return promise;
		}

		// divides the image into tiles
		function sliceImageIntoTiles() {
			var canvas = document.createElement('canvas');
			var dx = canvas.width = _tileWidth;
			var dy = canvas.height = _tileHeight;
			var ctx = canvas.getContext("2d");

			var cols = _originalImage.width / _tileWidth;
			var rows = _originalImage.height / _tileHeight;

			var slicedImageList = [];
			for (var row = 0; row < rows; row++) {
				for (var col = 0; col < cols; col++) {
					// Take snapshot of a part of the source image. The tile.
					ctx.drawImage(_originalImage, dx*col, dy*row, dx, dy, 0, 0, dx, dy);

					var tile = {
						src: canvas.toDataURL(),
						width: dx,
						height: dy,
						x: dx * col,
						y: dy * row,
					};
					
					slicedImageList.push(tile);
				}
			}
			return slicedImageList;
		}

		// Get imageData from image object
		function getImageData(image){
			var c = document.createElement('canvas');
			var height = c.height = image.naturalHeight || image.offsetHeight || image.height;
		    var width = c.width = image.naturalWidth || image.offsetWidth || image.width;

		    var ctx = c.getContext('2d');
			ctx.drawImage(image, 0, 0);

		    var data;
		    try {
		        data = ctx.getImageData(0, 0, width, height);
		    } catch(e) {
		        console.log('Error getting image data.');
		    }
			return data;
		}

		// computes the average color of each tile
		// operation done by the worker.
		function getAverageColor(imageData, index) {
			_index++;

			var promise = new Promise(function(resolve, reject) {
				// Add the resolve and reject functions to handler
				// This promise will be called several times so it's necessary to keep a track of it.
		  		_handlers[_index] = {
					resolve: resolve,
					reject: reject
				}
				// The index property is to find the right handler
				// The tileIndex is to find the right tile
				_worker.postMessage({index: _index, imageData: imageData, tileIndex: index});
			});

			return promise;
		}
	}

	return fabric;
})(document)


var exports = exports || null;
if (exports) {
  exports.PhotoMosaic = PhotoMosaic;
}
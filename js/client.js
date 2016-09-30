(function(document){
	'use strict';

	var INITAL = 'initial',
		PROCESSING = 'processing',
		currentState = INITAL;

	function render(src){
		var image = new Image();
		image.onload = function(e) {
			changeState(PROCESSING);
			// generates the photo mosaic from original image
			PhotoMosaic.generate(e.target).then(function(result) {
				changeState(INITAL);
				// Display the canvas result
				document.getElementById('canvas-results').appendChild(result);
			});
		}
		image.src = src;
	}

	function changeState(state) {
		var innerBox = document.querySelector('.box-inner');

		innerBox.className = innerBox.className.replace(currentState, ' ' + state);

		currentState = state;
	}

	function loadImage(src, callback){
		//	Create FileReader
		var reader = new FileReader();

		//	Prevent any non-image file type from being read.
		if(!src.type.match(/image.*/)){
			console.log("The dropped file is not an image: ", src.type);
			return;
		}

		// Run callback function with the results on load
		reader.onload = function(e) {
			callback(e.target.result);
		};
		reader.readAsDataURL(src);
	}

	document.onreadystatechange = function() {
		if (document.readyState === 'complete') {
			// document ready
			var dropTarget = document.getElementById("drop-target"),
				fileInput = document.getElementById("file-input");

			// add Drag & Drop actions
			dropTarget.addEventListener("dragover", function(e) {
				e.preventDefault();
			}, true);
			dropTarget.addEventListener("drop", function(e) {
				e.preventDefault();
				// Load image from src then Run the results through the render function.
				loadImage(e.dataTransfer.files[0], render);
			}, true);

			// add File input action
			fileInput.addEventListener("change", function(e) {
				e.preventDefault();
				// Load image from src then Run the results through the render function.
				loadImage(e.target.files[0], render);
			});
		}
	};

})(document);

(function(document){
	"use strict";

	function render(src){
		var image = new Image();
		image.onload = function(e){
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

	var INITAL = "initial";
	var PROCESSING = "processing";
	var currentState = INITAL;
	function changeState(state) {
		var innerBox = document.querySelector(".box-inner");

		innerBox.className = innerBox.className.replace(currentState, ' '+state);

		currentState = state;
	}

	function loadImage(src){
		//	Prevent any non-image file type from being read.
		if(!src.type.match(/image.*/)){
			console.log("The dropped file is not an image: ", src.type);
			return;
		}

		//	Create our FileReader and run the results through the render function.
		var reader = new FileReader();
		reader.onload = function(e){
			render(e.target.result);
		};
		reader.readAsDataURL(src);
	}

	var dropTarget = document.getElementById("drop-target");
	dropTarget.addEventListener("dragover", function(e) {
		e.preventDefault();
	}, true);
	dropTarget.addEventListener("drop", function(e) {
		e.preventDefault();
		loadImage(e.dataTransfer.files[0]);
	}, true);

	var fileInput = document.getElementById("file-input");
	fileInput.onchange = function(e) {
		e.preventDefault();
		loadImage(e.target.files[0]);
	};

})(document);

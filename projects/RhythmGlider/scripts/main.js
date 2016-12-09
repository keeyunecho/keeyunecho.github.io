/** requestAnim shim layer by Paul Irish */
window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame    || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function(/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

var prevFftValues, fftValues, waveformValues;
var clock;
var acceleration = 1.005;
var collisionPenalty = 10;
var player;
var gameState = {
	"started": false,
	"paused": false,
	"over": false,
	"startOffset": 0,
	"velocity": 1.0,
	"points": 0,
	"minPoints": 300
};

$(document).ready(function() {

	initScene();
	var startTimer = 1,
		currTimer = 0,
		countdownTimerHandle,
		requestAnimHandle,
		slowAnimHandle,
		accelHandle;

	clock = new Tone.Clock(function(time){
		gameState.startOffset += 1;
	}, 1);


	//analyse the frequency/amplitude of the incoming signal	
	var fft = new Tone.Analyser("fft", 32);

	//get the waveform data for the audio
	var waveform = new Tone.Analyser("waveform", 1024);

	var songPlayer = new Tone.Player({
		"url" : "http://www.kellykcho.com/projects/RhythmGlider/examples/Whistle.m4a",
	}).fan(fft, waveform).toMaster();
	fftValues = fft.analyse();

	$('#getSongButton').click(function() {
	    document.getElementById('my_song').click();
	});

	$('#playSongButton').click(function() {
	    if (gameState.started === true) {
	    	unpauseGame();
	    } else {
	    	startGame();
	    }
	});


	player = new Player();
	createRocket();
	
	document.addEventListener('mousemove', function(event) {
		player.mousePos.x = event.clientX;
		player.mousePos.y = event.clientY;
	}, false);

	function startGame() {
		gameState.started = true;
		gameState.paused = false;
		gameState.over = false;
		gameState.startOffset = 0;
		$(".menu").fadeOut();
		startCountdown();
	}

	function pauseGame() {
		cancelAnimationFrame(requestAnimHandle);
		window.clearInterval(slowAnimHandle);
		window.clearInterval(accelHandle);
		songPlayer.stop();
		clock.stop();
		gameState.paused = true;
		
		$(".menu").fadeIn();
		$("#playSongButton").text("UNPAUSE");
	}

	function unpauseGame() {
		gameState.paused = false;
		$(".menu").fadeOut();
		startCountdown();
	}

	function stopGame() {
		cancelAnimationFrame(requestAnimHandle);
		window.clearInterval(slowAnimHandle);
		window.clearInterval(accelHandle);
		clock.stop();
		$("#playSongButton").text("PLAY");
	}

	function endGame() {
		gameState.over = true;
		if (gameState.points < gameState.minPoints) {
			$("#scoreEval").text("You couldn't escape the planet and eventually died of loneliness. Too bad.");
		} else {
			$("#scoreEval").text("Congratulations! You've escaped (and been engulfed by the darkness of deep outer space).");
		}
		$(".scoreboard").fadeIn();
	}

	function startCountdown() {
		currTimer = startTimer;
		$("#countdown").text(currTimer);
		countdownTimerHandle = window.setInterval(countdown, 1000);
		$("#countdown").fadeIn();
	}

	function countdown() {
		if (currTimer === 0) {
			$("#countdown").fadeOut();
			window.clearInterval(countdownTimerHandle);

			songPlayer.start("+0.0", gameState.startOffset);
			clock.start();
			slowAnimHandle = window.setInterval(gameTick, 1000 / 10);
			accelHandle = window.setInterval(accelerate, 1000 * 5);
			playGame();
		} else {
			$("#countdown").text(currTimer);
			currTimer -= 1;
		}
	}

	$(window).keypress(function (e) {
	  if (e.keyCode === 0 || e.keyCode === 32) {
	    e.preventDefault();
	    if (gameState.paused === false) {
	    	pauseGame();
	    }
	  }
	});

	function accelerate() {
		gameState.velocity *= acceleration;
		console.log(gameState.velocity);
	}

	function updatePoints() {
		$("#points").text("Energy = " + gameState.points);
	}

	var gj = 0;
	function gameTick() {
		prevFftValues = fftValues.slice();
		fftValues = fft.analyse();
		fftAvg = calcAverage(fft);

		waveformValues = waveform.analyse();
		waveMax = Math.max(...waveformValues);
		sf = calcDiff(prevFftValues, fftValues);
		if ( sf > 500) {
			createFlotsam(1.0, waveMax / 255, gameState.startOffset % maxFlotsam);
		}
		
		var w = waveformValues[0] / 255;
		createJetsam(w, gj % maxJetsam);
		planetExt.moveMountains(1 + ((w * 2) - 1) * 0.005);
		gj += 1;

		if (gameState.startOffset > 5) {
			deleteInvisible();
		}
	}

	function playGame() {
		requestAnimHandle = requestAnimationFrame(playGame);
		updatePoints();

		if (songPlayer.state == "stopped" && !gameState.paused) {
			endGame();
			cancelAnimationFrame(requestAnimHandle);
		}
		render();
	}
});
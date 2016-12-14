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

var songPlayer, noise, noiseVolume;
var fft, waveForm, prevFftValues, fftValues, waveformValues;
var clock;
var collisionPenalty = 10,
	flotsamThreshold,
	jetsamThreshold;
var player;
var gameState = {
	"started": false,
	"paused": false,
	"died": false,
	"startOffset": 0,
	"velocity": 1.0,
	"points": 0,
	"minPoints": 100,
	"song": 1,
	"endTime": 300,
	"pseudoEndTime": 300,
	"volumeSlope": 0
};

var songs = ["Anthem.m4a", "Thats_Christmas_To_Me.mp3"];

$(document).ready(function() {
	
	initScene();
	updateSong();
	
	var startTimer = 3,
		currTimer = 0,
		countdownTimerHandle,
		requestAnimHandle,
		slowAnimHandle,
		accelHandle;

	clock = new Tone.Clock(function(time){
		gameState.startOffset += 1;
	}, 1);

	$('#getSongButton').click(function() {
	    gameState.song = gameState.song ^ 1;
	    updateSong();
	});

	$('#playSongButton').click(function() {
	    if (gameState.started === true) {
	    	unpauseGame();
	    } else {
	    	startGame();
	    }
	});

	$('#aboutButton').click(function() {
		$(".aboutPage").fadeIn();
	});

	$('#backButton').click(function() {
		$(".aboutPage").fadeOut();
		$(".menu").fadeIn();
	});

	function updateSong() {
		$("#playSongButton").text("PLAY");
		if (gameState.song === 0) {
			$('#songTitle').text("'Anthem'");
			planetColor = colors.yellow;
			flotsamColor = colors.darkGrey;
			jetsamColor = colors.turquoise;
			flotsamThreshold = 400;
			jetsamThreshold = 300;
			gameState.pseudoEndTime = 85;
			gameState.endTime = 96;
			gameState.volumeSlope = 0.08;
		} else {
			$('#songTitle').text("'That's Christmas To Me'");
			planetColor = colors.white;
			flotsamColor = colors.green;
			jetsamColor = colors.red;
			flotsamThreshold = 100;
			jetsamThreshold = 0;
			gameState.pseudoEndTime = 60;
			gameState.endTime = 74;
			gameState.volumeSlope = 0.3;
		}

		resetGame();
		scene.remove(planet.mesh);
		scene.remove(planetExt.mesh);
		createPlanet();	
		renderer.render(scene, camera);	

		//analyse the frequency/amplitude of the incoming signal	
		fft = new Tone.Analyser("fft", 32);

		//get the waveform data for the audio
		waveform = new Tone.Analyser("waveform", 1024);

		songPlayer = new Tone.Player({
			"url" : "http://www.kellykcho.com/projects/RhythmGlider/examples/" + songs[gameState.song],
			"callback": ready()
		}).fan(fft, waveform).toMaster();
		fftValues = fft.analyse();
	}

	function ready() {
		noise = new Tone.Noise("white");
		noise.connect(Tone.Master);
		$(".menu").fadeIn();
	}

	document.addEventListener('mousemove', function(event) {
		player.mousePos.x = event.clientX;
		player.mousePos.y = event.clientY;
	}, false);

	function startGame() {
		resetGame();
		$(".menu").fadeOut();
		startCountdown();
	}

	function resetGame() {
		gameState.started = true;
		gameState.died = false;
		gameState.startOffset = 0;
		gameState.points = 0;
	}

	function pauseGame() {
		cancelAnimationFrame(requestAnimHandle);
		window.clearInterval(slowAnimHandle);
		window.clearInterval(accelHandle);
		songPlayer.stop();
		noise.stop();
		clock.stop();
		gameState.paused = true;

		console.log(gameState.startOffset);

		$("#playSongButton").text("UNPAUSE");
		$(".menu").fadeIn();
		
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

	function endGame(crashed) {
		if (gameState.started) {
			songPlayer.stop();
			noise.stop();

			gameState.started = false;
			cancelAnimationFrame(requestAnimHandle);
			// window.clearInterval(slowAnimHandle);
			window.clearInterval(accelHandle);
			if (crashed) {
				$("#scoreEval").text("You crashed and died. Maybe reconsider your career as spaceship driver.");
			} else if (gameState.points < gameState.minPoints) {
				$("#scoreEval").text("You couldn't escape the planet and eventually died of loneliness. Too bad.");
			} else {
				$("#scoreEval").text("Congratulations! You've escaped (and been engulfed by the darkness of deep outer space).");
			}
			$(".scoreboard").fadeIn();
		}
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
			noise.start();
			clock.start();
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


	function updatePoints() {
		$("#points").text("Energy = " + gameState.points);
	}

	function playGame() {
		requestAnimHandle = requestAnimationFrame(playGame);
		updatePoints();

		if (gameState.startOffset >= gameState.endTime) {
			endGame(false);
		}

		if (gameState.died) {
			endGame(true);
		}

		if (songPlayer.state == "stopped" && !gameState.paused) {
			endGame(false);
		}


		noise.volume.value = -10 - 0.8 * ( gameState.volumeSlope * gameState.points);
		render();
	}
});
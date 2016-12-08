$(document).ready(function() {

// var synth = new Tone.Synth().toMaster();
// synth.triggerAttackRelease("C4", "8n");

//will play as soon as it's loaded
var player = new Tone.Player({
	"url" : "examples/Whistle.m4a",
	"autostart" : true,
}).toMaster();

document.getElementById('getSongButton').onclick = function() {
    document.getElementById('my_song').click();
};

});
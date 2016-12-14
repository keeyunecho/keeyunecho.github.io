var canvasWidth, canvasHeight;
var viewport;

var canvas, context, renderer;
var scene, camera, aspectRatio, fieldOfView, nearPlane, farPlane;

var fftValues, waveformValues;
var flotsams = [], jetsams = [];
var planet, planetExt;
var space;
var startAngle = 22.5;
var cameraZPos = 150;
var toBeCleared = [];

var planetColor, flotsamColor, jetsamColor;

var colors = {
	"red": "#DB3340",
	"yellow": "#E8B71A",
	"cream": "#F7EAC8",
	"white": '#ffffff',
	"turquoise": "#1FDA9A",
	"blue": "#28ABE3",
	"green": "#1fad00",
	"lightGrey": "#C6D5CD",
	"darkGrey": "#5A6A62"
};

function initScene() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    viewport = document.getElementById("viewport");
    resolution = new THREE.Vector2(canvasWidth, canvasHeight);

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({
    	alpha: true,
    	antialias: true
    });
    renderer.setSize( canvasWidth, canvasHeight );
    renderer.setPixelRatio( window.devicePixelRatio );


    // Canvas Setup
    canvas = renderer.domElement;
    viewport.appendChild( canvas );
    context = canvas.getContext("webgl");

    createScene();
    createPlanet();
    createSpace();
    // createFlotsam(1.0, 1.0, 0);

    player = new Player();
	createRocket();

    window.addEventListener('resize', resizeWindow, false);

    renderer.render(scene, camera);
}

function createScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(colors.cream, 10, 1000);

	// Create the camera
	aspectRatio = canvasWidth / canvasHeight;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
		);
	scene.add(camera);

	camera.position.x = 0;
	camera.position.z = cameraZPos;
	camera.position.y = 25;

	cameraCull = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
	);

	createLights();
}

var hemisphereLight, shadowLight;

function createLights() {
	hemisphereLight = new THREE.HemisphereLight(0xffffff,0x000000, 0.5);
	scene.add(hemisphereLight);  

	ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
	scene.add(ambientLight);
}

function resizeWindow() {
	canvasHeight = window.innerHeight;
	canvasWidth = window.innerWidth;
	renderer.setSize(canvasWidth, canvasHeight);
	camera.aspect = canvasWidth / canvasHeight;
	camera.updateProjectionMatrix();
}

Space = function(){
	// Create an empty container
	this.mesh = new THREE.Object3D();
};

function createSpace(){
	space = new Space();
	scene.add(space.mesh);
}

Planet = function(color) {
	var mat = new THREE.MeshPhongMaterial({
		color: color,
		emissive: color,
		emissiveIntensity: 0.5,
		transparent: true,
		opacity: 0.8,
		shading: THREE.FlatShading,
	});


	this.radius = canvasWidth * 0.15;
	var numSegments = this.radius * 0.5;
	var geom = new THREE.SphereGeometry(this.radius, numSegments, numSegments);

	geom.mergeVertices();
	var numVertices = geom.vertices.length;
	this.mountains = [];

	for (var i = 0; i < numVertices; i++) {
		if (Math.random() > 0.3) {
			var v = geom.vertices[i];
			// a random angle
			var ang = (Math.random() * 2) - 1 * (Math.PI*2) * 0.2;
			// a random distance
			var amp = 5 + Math.random()* 5;

			v.x += Math.cos(ang)*amp;
			v.y += Math.sin(ang)*amp;
			v.z += amp;
		}

	}


	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.position.y = -this.radius;
	this.mesh.receiveShadow = true; 

	this.moveMountains = function(s) {
		this.mesh.scale.set(s, s, s);
	};
};


function createPlanet() {
	planet = new Planet(planetColor);
	planetExt = new Planet(planetColor);
	scene.add(planet.mesh);
	scene.add(planetExt.mesh);
}


Flotsam = function(fVal) {
	this.mesh = new THREE.Group();
	this.type = "Flotsam";
	// console.log('flots');

	var geom = new THREE.BoxGeometry(10,10,10);
	var mat = new THREE.MeshPhongMaterial({
		color: flotsamColor,
		emissive: flotsamColor,
		emissiveIntensity: 0.5,
		transparent: true
	});
	
	// controls number of blocks in flotsam
	var nBlocs = 3+Math.floor(fVal*3);
	for (var i=0; i<nBlocs; i++ ){
		
		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat); 
		
		// set the position and the rotation of each cube randomly
		m.position.x = i*10;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;
		
		// set the size of the cube randomly
		var s = 0.1 + Math.random() * 0.9;
		m.scale.set(s,s,s);
		
		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;
		
		// add the cube to the container we first created
		this.mesh.add(m);
	}

	this.maxSteps = 150;
	this.step = 0;
	this.exploded = false;

	this.maxSpeed = 10;
	this.opacityStep = 1/ this.maxSteps;
	
	this.collide = function() {
		if (!this.exploded) {
			this.exploded = true;
			gameState.points -= collisionPenalty;
			var children = this.mesh.children;
			for (var i = 0; i < children.length; i++) {
				children[i].xd = (Math.random()*this.maxSpeed*2 - this.maxSpeed) * 0.1 ;
				children[i].yd = (Math.random()*this.maxSpeed*2 - this.maxSpeed) * 0.1 ;
			}
		}
	};

	this.loop = function() {
		if (this.exploded) {
			for (var i = 0; i < this.mesh.children.length; i++) {
				this.mesh.children[i].position.x += this.mesh.children[i].xd;
				this.mesh.children[i].position.y += this.mesh.children[i].yd;
				this.mesh.children[i].material.opacity -= this.opacityStep;
			}
			this.step += 1;
		}

		if (this.step > 100) {
			this.delete();
		}
	};

	this.delete = function() {
		while (this.mesh.children.length) {
			this.mesh.remove(this.mesh.children[0]);
		}
		planet.mesh.remove(this.mesh);
	};
};


var numAngles = 180;
var stepAngle = (Math.PI*2 / numAngles);
function createFlotsam(fVal, wVal, aVal, phi) {

	var flotsam = new Flotsam(fVal);

	// console.log(fVal + "," + wVal);
	var r = planet.radius + (150 * wVal) - 60;
	
	flotsam.mesh.position.y = Math.sin(phi)*r;
	flotsam.mesh.position.x = Math.cos(phi)*r;

	// Rotate mesh to align with planet edge
	flotsam.mesh.rotation.z = phi + Math.PI/2;
	
	var s = wVal;
	flotsam.mesh.scale.set(s,s,s);

	planet.mesh.add(flotsam.mesh);  
	flotsams.push(flotsam);
}

Jetsam = function() {
	this.eaten = false;
	this.type = "Jetsam";

	var geom = new THREE.SphereGeometry(1,0);
	var mat = new THREE.MeshPhongMaterial({
		color: jetsamColor,
		emissive: jetsamColor,
		shininess: 100,
		specular:0x111111,
		shading:THREE.FlatShading,
		transparent: true
	});
	this.mesh = new THREE.Mesh(geom,mat);

	this.collide = function() {
		if (!this.eaten) {
			this.eaten = true;
			gameState.points += 1;
			this.mesh.material.opacity = 0.0;
		}
	};

	// this.loop = function() {
	// 	if (this.cleaned) {
	// 		this.delete();
	// 	}
	// };

	this.delete = function() {
		planet.mesh.remove(this.mesh);
	};
};

function createJetsam(wVal, aVal, phi) {

	var jetsam = new Jetsam();

	var r = Math.max(planet.radius + 2, planet.radius + (wVal * 90) -10);
	var y = Math.sin(phi) * r;
	var x = Math.cos(phi) * r;

	jetsam.mesh.position.y = y;
	jetsam.mesh.position.x = x;


	planet.mesh.add(jetsam.mesh);
	

	var pos = new THREE.Vector3();
	pos.setFromMatrixPosition( jetsam.mesh.matrixWorld );
	if (pos.x < -150) {
		p.delete();
		planet.mesh.rotation.z = 0;
		gt = 0;
	} else {
		jetsams.push(jetsam);
	}
}


function updateFlotsam() {
	for (var i = 0; i < flotsams.length; i++) {
		flotsams[i].loop();
	}
}

var gt = 0;
function gameTick() {

	prevFftValues = fftValues.slice();
	fftValues = fft.analyse();
	fftAvg = calcAverage(fftValues);
	scene.updateMatrixWorld();

	waveformValues = waveform.analyse();
	waveMax = Math.max(...waveformValues);
	sf = calcDiff(prevFftValues, fftValues);
	var a = gt % numAngles;
	var w = waveformValues[0] / 255;
	if (gameState.startOffset < gameState.pseudoEndTime) {
		var phi =  (startAngle * stepAngle) - (stepAngle * a);
		if ( sf > flotsamThreshold || w > 0.8) {
			createFlotsam(fftAvg / 255, waveMax / 255, a, phi);
		}
		createJetsam(w, a, phi);
	}

	if (noise.volume.value < (-50)) {
		songPlayer.volume.value = songPlayer.volume.value + 0.005;
	}
	
	planetExt.moveMountains(1 + ((w * 2) - 1) * 0.03);

	gt += 1;
}

var rt = 0;
function render() {
	renderer.clear();

	var v = 0.005;
	planet.mesh.rotation.z += v;
	planetExt.mesh.rotation.z += v;
	rt += 1;

	if (rt > 5) {
		gameTick();
		rt = 0;
	}

	player.update();
	renderer.render(scene, camera);
}
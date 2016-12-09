var canvasWidth, canvasHeight;
var viewport;

var canvas, context, renderer;
var scene, aspectRatio, fieldOfView, nearPlane, farPlane;
var frustum, cameraViewProjectionMatrix;

var fftValues, waveformValues;
var flotsams = [],
	jetsams = [];
var flotsamIDs = {},
	jetsamIDs = {};
var planet, planetExt;
var space;

var colors = {
	"red": "#DB3340",
	"yellow": "#E8B71A",
	"cream": "#F7EAC8",
	"turquoise": "#1FDA9A",
	"blue": "#28ABE3",
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
	camera.position.z = 150;
	camera.position.y = 25;

	frustum = new THREE.Frustum();
	cameraViewProjectionMatrix = new THREE.Matrix4();

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
		opacity: 0.1,
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
	planet = new Planet(colors.yellow);
	planetExt = new Planet(colors.yellow);
	scene.add(planet.mesh);
	scene.add(planetExt.mesh);
}


Flotsam = function(fVal) {
	this.mesh = new THREE.Group();
	this.type = "Flotsam";

	var geom = new THREE.BoxGeometry(10,10,10);
	var mat = new THREE.MeshPhongMaterial({
		color: colors.darkGrey,
		emissive: colors.lightGrey,
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

	this.delete = function() {
		while (this.mesh.children.length) {
			this.mesh.remove(this.mesh.children[0]);
		}
	};

	this.maxSteps = 200;
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
			var children = this.mesh.children;
			
			for (var i = 0; i < children.length; i++) {
				children[i].position.x += children[i].xd;
				children[i].position.y += children[i].yd;
				children[i].material.opacity -= this.opacityStep;
			}
			this.step += 1;
		}
		if (this.step == this.maxSteps) {
			this.exploded = false;
		}
	};
};

var maxFlotsam = 20;
var stepAngleF = (Math.PI*2 / maxFlotsam);
function createFlotsam(fVal, wVal, aVal) {

	var flotsam = new Flotsam(fVal);
	flotsamIDs[flotsam.mesh.id] = flotsam;
 
	var phi =  stepAngleF - (stepAngleF * aVal);
	var r = planet.radius + (100 * wVal) - 10;

	// Convert polar coordinates (phi, distance) into Cartesian coordinates (x, y)
	flotsam.mesh.position.y = Math.sin(phi)*r;
	flotsam.mesh.position.x = Math.cos(phi)*r;


	// Rotate mesh to align with planet edge
	flotsam.mesh.rotation.z = phi + Math.PI/2;
	
	var s = wVal;
	flotsam.mesh.scale.set(s,s,s);

	planet.mesh.add(flotsam.mesh);  
	flotsams.push(flotsam);
}

function updateFlotsams() {
	for (var i = 0, len = flotsams.length; i < len; i++) {
		flotsams[i].loop();
	}
}

Jetsam = function() {
	this.eaten = false;
	this.type = "Jetsam";
	var geom = new THREE.SphereGeometry(1,0);
	var mat = new THREE.MeshPhongMaterial({
		color: colors.turquoise,
		emissive: colors.turquoise,
		shininess: 100,
		specular:0x111111,
		shading:THREE.FlatShading,
		transparent: true
	});
	geom.boundingSphere.radius *= 100;
	this.mesh = new THREE.Mesh(geom,mat);

	this.collide = function() {
		if (!this.eaten) {
			this.eaten = true;
			gameState.points += 1;
			this.mesh.material.opacity = 0.0;
		}
	};
};

var maxJetsam = 180;
var stepAngleJ = (Math.PI*2 / maxJetsam);
function createJetsam(wVal, aVal) {

	var jetsam = new Jetsam();
	jetsamIDs[jetsam.mesh.id] = jetsam;

	var phi =  stepAngleJ - (stepAngleJ * aVal);
	var r = planet.radius + (wVal * 30) + 10;

	jetsam.mesh.position.y = Math.sin(phi)*r;
	jetsam.mesh.position.x = Math.cos(phi)*r;

	planet.mesh.add(jetsam.mesh);
	jetsams.push(jetsam);
}

function deleteInvisible() {
	camera.updateMatrixWorld(); // make sure the camera matrix is updated
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );
	cameraViewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
	frustum.setFromMatrix( cameraViewProjectionMatrix );


	if (flotsams.length > 0) {
		var visible = false;
		f = flotsams[0];
		if (!f.exploded) {
			for (var i = 0, n = f.mesh.children.length; i<n; i++) {
				c = f.mesh.children[i];
				visible = visible || frustum.intersectsObject(c);
			}
			if (!visible) {
				f = flotsams.shift();
				delete flotsamIDs[f.id];
				f.delete();
				scene.remove(f);
			}
		}
	}

	if (jetsams.length > 0) {
		var j = jetsams[0].mesh;
		if (!frustum.intersectsObject(j) || j.eaten) {
			jetsams.shift();
			j.parent.remove(j);
		}
	}
}

function render() {
	renderer.clear();

	var v = 0.005 * gameState.velocity;
	planet.mesh.rotation.z += v;
	planetExt.mesh.rotation.z += v;

	player.update();
	updateFlotsams();

	renderer.render(scene, camera);
}
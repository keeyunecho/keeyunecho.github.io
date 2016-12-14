Player = function() {
	this.mousePos = new THREE.Vector2();
	this.playerPos = new THREE.Vector3();
	this.raycaster = new THREE.Raycaster();
	this.NDC = new THREE.Vector2();

	this.flotsamTolerance = 15;
	this.jetsamTolerance = 15;

	this.update = function() {
		this.updatePosition();
		scene.updateMatrixWorld();
		
		var planetBrim = new THREE.Vector3(0, canvasHeight - planet.radius * planet.mesh.scale, 0);
		var d = (this.playerPos.clone().sub(planetBrim)).length();
		if (d < 10) {
			gameState.died = true;
			return;
		}

		for (var i = 0; i < flotsams.length; i++ ) {
			var p = flotsams[i];
			if (!p.exploded) {
				var pos = new THREE.Vector3();
				pos.setFromMatrixPosition( p.mesh.matrixWorld );
				if (pos.x < -150) {
					p.delete();
				} else {
					d = (this.playerPos.clone().sub(pos.clone())).length();
					if (d < this.flotsamTolerance) {
						p.collide();
					}
				}
			} else {
				p.loop();
			}
		}

		
		for (var i = 0; i < jetsams.length; i++ ) {
			var p = jetsams[i];
			if (p.eaten) {
				continue;
			}
			var pos = new THREE.Vector3();
			pos.setFromMatrixPosition( p.mesh.matrixWorld );
			if (pos.x < -150) {
				p.delete();
			} else {
				d = (this.playerPos.clone().sub(pos.clone())).length();
				if (d < this.jetsamTolerance) {
					p.collide();
				}
			}
		}
	};

	this.updatePosition = function() {
		this.playerPos.y = mouseToWorld(this.mousePos.x, this.mousePos.y).y;
		updateRocket(this.playerPos);
	};

};

function createRocket() {
	var geometry = new THREE.PlaneGeometry(30, 30);
	var loader = new THREE.TextureLoader();
	loader.crossOrigin = '';
	loader.load(
		'http://www.kellykcho.com/projects/RhythmGlider/img/rocket.png',
		function(texture) {
			var material = new THREE.MeshBasicMaterial({
				map: texture,
				overdraw: 0.5,
				transparent: true
			});
			player.rocket = new THREE.Mesh(geometry, material);
			player.rocket.rotateZ(-1.0);
			player.rocket.position.y += 50;
			scene.add(player.rocket);
			renderer.render(scene, camera);
		},
		function(xHR) {},
		function(xHR) {}
	);
}

function updateRocket(targetPos) {
		
	var targetY = targetPos.y;
	// Move the plane at each frame by adding a fraction of the remaining distance
	player.rocket.position.y += (targetY - player.rocket.position.y)*0.1;

	// Rotate the plane proportionally to the remaining distance
	player.rocket.rotation.z = (targetY-player.rocket.position.y)*0.0256 - 0.8;
	player.rocket.rotation.x = (player.rocket.position.y-targetY)*0.0064;
}
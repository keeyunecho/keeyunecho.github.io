Player = function() {
	this.mousePos = new THREE.Vector2();
	this.playerPos = new THREE.Vector3();
	this.raycaster = new THREE.Raycaster();
	this.NDC = new THREE.Vector2();

	this.flotsamTolerance = 40;
	this.jetsamTolerance = 15;

	this.update = function() {
		this.updatePosition();
		scene.updateMatrixWorld();
		
		
		var i, pos, diffPos, d;
		for (i = 0; i < flotsams.length; i++ ) {
			var f = flotsams[i];
			pos = new THREE.Vector3();
			pos.setFromMatrixPosition( f.mesh.matrixWorld );
			d = (this.playerPos.clone().sub(pos.clone())).length();
			if (d < this.flotsamTolerance) {
				f.collide();
			}
		}

		for (i = 0; i < jetsams.length; i++ ) {
			var j = jetsams[i];
			pos = new THREE.Vector3();
			pos.setFromMatrixPosition( j.mesh.matrixWorld );
			d = (this.playerPos.clone().sub(pos.clone())).length();
			if (d < this.jetsamTolerance) {
				j.collide();
			}
		}
	};

	this.updatePosition = function() {
		this.playerPos.y = mouseToWorld(this.mousePos.x, this.mousePos.y).y;
		updateRocket(this.playerPos);

		// this.NDC = mouseToNDC(this.mousePos);
	};

};

function createRocket() {
	var geometry = new THREE.PlaneGeometry(30, 30);
	var loader = new THREE.TextureLoader();
	loader.load(
		'img/rocket.png',
		function(texture) {
			var material = new THREE.MeshBasicMaterial({
				map: texture,
				overdraw: 0.5
			});
			player.rocket = new THREE.Mesh(geometry, material);
			scene.add(player.rocket);
		},
		function(xHR) {},
		function(xHR) {}
	);

	// var material = new THREE.MeshBasicMaterial({
	// 	color: colors.red
	// });
	// var rocket = new THREE.Mesh(geometry, material);
	// scene.add(rocket);
}

function updateRocket(targetPos) {
		
	var targetY = targetPos.y;
	console.log(player.rocket);
	// Move the plane at each frame by adding a fraction of the remaining distance
	player.rocket.position.y += (targetY - player.rocket.position.y)*0.1;

	// Rotate the plane proportionally to the remaining distance
	player.rocket.rotation.z = (targetY-player.rocket.position.y)*0.0128;
	player.rocket.rotation.x = (player.rocket.position.y-targetY)*0.0064;
}
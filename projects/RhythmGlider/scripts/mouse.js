function mouseToWorld(x, y) {
    // console.log("Mouse=" + event.clientX + "," + event.clientY);

    var w = new THREE.Vector3();
    w.x = ( x / canvasWidth ) * 2 - 1;
    w.y = - ( y / canvasHeight ) * 2 + 1; 
    w.z = 0.5;

    // DEBUGGING
    // console.log("NDC=" + w.x + "," + w.y + "," + w.z);

    w.unproject(camera);
    var dir = w.clone().sub(camera.position).normalize();
    var distance = - camera.position.z / dir.z;
    w = camera.position.clone().add( dir.multiplyScalar( distance ) );

    // DEBUGGING
    // console.log("World=" + w.x + "," + w.y + "," + w.z);

    return w;
}

function mouseToNDC(m) {
    var n = new THREE.Vector2();
    n.x = ( m.x / canvasWidth ) * 2 - 1;
    n.y = - ( m.y / canvasHeight ) * 2 + 1; 
    return n;
}
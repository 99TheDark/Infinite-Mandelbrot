Promise.all([
    fetch("shader.vert"),
    fetch("shader.frag")
])
    .then(files => Promise.all(
        files.map(file => file.text())
    ))
    .then(texts => main(...texts))

function main(vertexSource, fragmentSource) {
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");

    let [ width, height ] = [ canvas.width, canvas.height ] = [ innerWidth, innerHeight ];
    let [ hwidth, hheight ] = [ width / 2, height / 2 ];

    if(!gl) throw "Your browser does not support WebGL.";

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        throw "Error compiling vertex shader.\n\n" + gl.getShaderInfoLog(vertexShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        throw "Error compiling fragment shader.\n\n" + gl.getShaderInfoLog(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw "Error linking program.\n\n" + gl.getProgramInfoLog(program);

    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
        throw "Error validating program.\n\n" + gl.getProgramInfoLog(program);

    const fs = Float32Array.BYTES_PER_ELEMENT;

    const tris = new Float32Array([
        -1, 1,
        1, 1,
        -1, -1,
        1, -1,
        1, 1,
        -1, -1
    ]);

    const triBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tris, gl.STATIC_DRAW);

    const posAttribLocation = gl.getAttribLocation(program, "vertPos");
    gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * fs, 0);
    gl.enableVertexAttribArray(posAttribLocation);

    gl.useProgram(program);

    gl.viewport(0, 0, width, height);

    const cam = {
        zoom: 0.4,
        x: 0,
        y: 0
    };
    const orbit = {
        x: 0,
        y: 0
    };
    let mouseDown = false;

    function draw() {
        const zoomUniformLocation = gl.getUniformLocation(program, "zoom");
        gl.uniform1f(zoomUniformLocation, cam.zoom);

        const sizeUniformLocation = gl.getUniformLocation(program, "size");
        gl.uniform2f(sizeUniformLocation, width, height);

        const offsetUniformLocation = gl.getUniformLocation(program, "offset");
        gl.uniform2f(offsetUniformLocation, cam.x, cam.y);

        let z = { im: 0, re: 0 };
        let pass = true;
        for(let i = 0; i < 10000; i++) {
            let zOld = { ...z };
            z.re = zOld.re * zOld.re - zOld.im * zOld.im + cam.x;
            z.im = 2 * zOld.re * zOld.im + cam.y;
            if(Math.hypot(z.re, z.im) > 2) {
                pass = false;
                break;
            }
        }
        if(pass) {
            orbit.x = cam.x;
            orbit.y = cam.y;
        }

        const orbitUniformLocation = gl.getUniformLocation(program, "orbit");
        gl.uniform2f(orbitUniformLocation, orbit.x, orbit.y);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(draw);
    };

    document.addEventListener("wheel", e => {
        const mouseX = e.clientX - canvas.offsetLeft - hwidth;
        const mouseY = e.clientY - canvas.offsetTop - hheight;

        const preX = mouseX / cam.zoom;
        const preY = mouseY / cam.zoom;

        cam.zoom *= 1 + e.deltaY / 1000;
        cam.zoom = Math.min(Math.max(cam.zoom, 0.03), 380000);

        const postX = mouseX / cam.zoom;
        const postY = mouseY / cam.zoom;

        cam.x += map(preX - postX, 0, width, 0, 1);
        cam.y -= map(preY - postY, 0, height, 0, 1);
    });

    document.addEventListener("mousemove", e => {
        if(mouseDown) {
            cam.x -= e.movementX / width / cam.zoom;
            cam.y += e.movementY / height / cam.zoom;
        }
    });

    document.addEventListener("mousedown", () => mouseDown = true);
    document.addEventListener("mouseup", () => mouseDown = false);

    addEventListener("resize", () => {
        [ width, height ] = [ canvas.width, canvas.height ] = [ innerWidth, innerHeight ];
        [ hwidth, hheight ] = [ width / 2, height / 2 ];

        gl.viewport(0, 0, width, height);
    });

    function map(value, minFrom, maxFrom, minTo, maxTo) {
        return minTo + (value - minFrom) * (maxTo - minTo) / (maxFrom - minFrom);
    }

    draw();
};
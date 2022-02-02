import * as THREE from "./three.module.js";
import gsap from "gsap";

//* Plane dimensions
const world = {
	plane: {
		width: 400,
		height: 400,
		widthSegment: 50,
		heightSegment: 50,
	}
}

//* Create the Plane
const generatePlane = () => {
	planeMesh.geometry.dispose();
	planeMesh.geometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, world.plane.widthSegment, world.plane.heightSegment);

	//* Vertex position
	const { array } = planeMesh.geometry.attributes.position;
	const randomValues = [];
	for (let i = 0; i < array.length; i++) {
		if (i % 3 === 0) {
			const x = array[i];
			const y = array[i + 1];
			const z = array[i + 2];
			array[i] = x + (Math.random() - 0.5) * 3;
			array[i + 1] = y + (Math.random() - 0.5) * 3;
			array[i + 2] = z + (Math.random() - 0.5) * 3;
		}
		randomValues.push(Math.random() * Math.PI * 2);
	}

	planeMesh.geometry.attributes.position.randomValues = randomValues;
	planeMesh.geometry.attributes.position.originalPosition = planeMesh.geometry.attributes.position.array;

	const colors = [];
	for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) colors.push(0, 0, 0); //* RGB 0-1
	planeMesh.geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
}

//* Create Scene
const scene = new THREE.Scene();

//* Create Camera
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 70;

//* Create Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

//* Create Plane
const planeGeometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, world.plane.widthSegment, world.plane.heightSegment);
const planeMaterial = new THREE.MeshPhongMaterial({
	side: THREE.DoubleSide,
	flatShading: THREE.FlatShading,
	vertexColors: true
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);
generatePlane();

//* Directional Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1);
scene.add(light);

const raycaster = new THREE.Raycaster();

const mouse = {
	x: undefined,
	y: undefined,
}

let frame = 0;
function animate() {
	requestAnimationFrame(animate);
	frame += 0.01;
	renderer.render(scene, camera);
	
	//* Move vertices
	const { array, originalPosition, randomValues } = planeMesh.geometry.attributes.position;
	for (let i = 0; i < array.length; i += 3) {
		array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.003; //* x
		array[i + 1] = originalPosition[i + 1] + Math.sin(frame + randomValues[i]) * 0.003; //* y
	}
	planeMesh.geometry.attributes.position.needsUpdate = true;
	
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObject(planeMesh);
	if (intersects.length > 0) {
		//* Hover color
		const { color } = intersects[0].object.geometry.attributes;
		const initialColor = { r: 0, g: 0, b: 0 }
		const hoverColor = { r: 0.1, g: 0.1, b: 0.1 }
		gsap.to(hoverColor, {
			r: initialColor.r,
			g: initialColor.g,
			b: initialColor.b,
			onUpdate: () => {
				color.setXYZ(intersects[0].face.a, hoverColor.r, hoverColor.g, hoverColor.b); //* Vertice 1
				color.setXYZ(intersects[0].face.b, hoverColor.r, hoverColor.g, hoverColor.b); //* Vertice 2
				color.setXYZ(intersects[0].face.c, hoverColor.r, hoverColor.g, hoverColor.b); //* Vertice 3
			}
		});
		color.needsUpdate = true;
	}
}

//* Start Animation
animate();

//* Get Normalised Mouse Coordinates
addEventListener("mousemove", (event) => {
	mouse.x = (event.clientX / innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / innerHeight) * 2 + 1;
});

//* Make Canvas Responsive
addEventListener("resize", () => {
	renderer.setSize(innerWidth, innerHeight);
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
});
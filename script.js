import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from "./src/getStarfield.js";
import { drawThreeGeo } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
// scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 4;

// Get the container
const container = document.getElementById('threejs-container');

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ---- zoom limits ----
controls.minDistance = 3;   // stop at 3 units from the origin
controls.maxDistance = 20;  // stop at 20 units away

const geometry = new THREE.SphereGeometry(2);
const lineMat = new THREE.LineBasicMaterial({ 
  color: 0xffffff,
  transparent: true,
  opacity: 0.4, 
});
const edges = new THREE.EdgesGeometry(geometry, 1);
const line = new THREE.LineSegments(edges, lineMat);
scene.add(line);

const stars = getStarfield({ numStars: 1000, fog: false });
scene.add(stars);

fetch('./geojson/countries.json')
.then(response => response.text())
.then(text => {
  const data = JSON.parse(text);
  const countries = drawThreeGeo({
    json: data,
    radius: 2,
    materialOptions: {
      color: 0x80FF80,
    },
  });
  scene.add(countries);
});
/* ── white shell, intentionally *slightly* larger than the other layers ── */
// 1) a tiny offset avoids Z-fighting with your radius-2 geometry
const shellRadius = 1.99;          // 2  →  2.05

// 2) create the mesh
const whiteSphere = new THREE.Mesh(
  new THREE.SphereGeometry(shellRadius, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x000000 })
);

// 3) draw it *before* the countries so it’s not hidden behind them
whiteSphere.renderOrder = 1;       // countries can stay at the default 0

scene.add(whiteSphere);


// check here for more datasets ...
// https://github.com/martynafford/natural-earth-geojson
// non-geojson datasets: https://www.naturalearthdata.com/downloads/
fetch('./geojson/ne_110m_land.json')
  .then(response => response.text())
  .then(text => {
    const data = JSON.parse(text);
    const countries = drawThreeGeo({
      json: data,
      radius: 2,
      materialOptions: {
        color: 0x80FF80,
      },
    });
    scene.add(countries);
  });

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

// Get header height
const header = document.querySelector('header');
function resizeRenderer() {
  const headerHeight = header.offsetHeight;
  const width = window.innerWidth;
  const height = window.innerHeight - headerHeight;
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = headerHeight + 'px';
  renderer.domElement.style.left = '0';

  // Fix: update camera aspect and projection
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// Initial size
resizeRenderer();

// On window resize
window.addEventListener('resize', resizeRenderer);
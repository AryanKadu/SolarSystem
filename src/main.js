import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import * as TWEEN from '@tweenjs/tween.js';

const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
let loadingProgress = 0;
let totalTextures = 0;
let loadedTextures = 0;

const loadingScreen = document.getElementById('loading-screen');
const hamburgerMenu = document.getElementById('hamburger-menu');
const sidePanel = document.getElementById('side-panel');
const speedControlsContainer = document.getElementById('speed-controls-container');
const planetInfoPanel = document.getElementById('planet-info-panel');
const planetInfoTitle = document.getElementById('planet-info-title');
const planetInfoContent = document.getElementById('planet-info-content');
const closeInfoBtn = document.getElementById('close-info-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetViewBtn = document.getElementById('reset-view-btn');
const tooltip = document.getElementById('planet-tooltip');

function updateLoadingProgress() {
  loadedTextures++;
  loadingProgress = (loadedTextures / totalTextures) * 100;
  
  if (loadingProgress >= 100) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 800);
  }
}


function createGalaxyBackground(texture) {
  if (texture) {
    texture.encoding = THREE.sRGBEncoding;
  }
  
  const geometry = new THREE.SphereGeometry(500, 64, 64);
  geometry.scale(-1, 1, 1);
  
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    color: texture ? 0xffffff : 0x001122,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  
  createEnhancedStarField();
}


function createEnhancedStarField() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    
    const radius = 400 + Math.random() * 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    const colorType = Math.random();
    if (colorType < 0.6) {
      const intensity = 0.8 + Math.random() * 0.2;
      colors[i3] = colors[i3 + 1] = colors[i3 + 2] = intensity;
    } else if (colorType < 0.8) {
      colors[i3] = 0.6; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1;
    } else if (colorType < 0.92) {
      colors[i3] = 1; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.7;
    } else {
      colors[i3] = 1; colors[i3 + 1] = 0.6; colors[i3 + 2] = 0.4;
    }
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const starMaterial = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}


totalTextures = 10;
const galaxyTexture = textureLoader.load(
  'assets/galaxy.jpg',
  (texture) => {
    createGalaxyBackground(texture);
    updateLoadingProgress();
  },
  undefined,
  (error) => {
    console.warn('Galaxy texture failed to load, using fallback');
    createGalaxyBackground(null);
    updateLoadingProgress();
  }
);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1200
);
camera.position.set(0, 40, 100);

// renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;

//Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.maxDistance = 300;
controls.minDistance = 10;

// LIghting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xfff7b2, 12, 400, 1.5);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.far = 300;
scene.add(sunLight);

const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight1.position.set(100, 50, 100);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight2.position.set(-100, -50, -100);
scene.add(fillLight2);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);

//planet textures
const planetTextures = {};
const planetNames = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

planetNames.forEach(name => {
  planetTextures[name] = textureLoader.load(
    `assets/${name.toLowerCase()}.jpg`,
    () => updateLoadingProgress(),
    undefined,
    (error) => {
      console.warn(`${name} texture failed to load`);
      updateLoadingProgress();
    }
  );
});


const materialCache = {};

function getPlanetMaterial(name, color) {
  if (planetTextures[name] && !materialCache[name]) {
    materialCache[name] = new THREE.MeshStandardMaterial({
      map: planetTextures[name],
      metalness: 0.05,
      roughness: 0.7,
      emissive: new THREE.Color(color).multiplyScalar(0.15),
      emissiveIntensity: 0.8,
    });
    planetTextures[name].encoding = THREE.sRGBEncoding;
    return materialCache[name];
  }

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.05,
    roughness: 0.6,
    emissive: new THREE.Color(color).multiplyScalar(0.1),
    emissiveIntensity: 0.5,
  });
}

//Sun
let sunMesh = null;
function createSun() {
  const geometry = new THREE.SphereGeometry(20, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    map: planetTextures['Sun'],
    color: 0xffffff,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3,
  });
  
  const sun = new THREE.Mesh(geometry, material);
  sun.name = 'Sun';
  scene.add(sun);
  sunMesh = sun;

  //glow Efects
  const glowGeometry = new THREE.SphereGeometry(23, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.5,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  sun.add(glow);

  const coronaGeometry = new THREE.SphereGeometry(28, 16, 16);
  const coronaMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc00,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  sun.add(corona);

  return sun;
}

// planet
function createPlanet({ name, size, color, orbitRadius, segments = 32 }) {
  const geometry = new THREE.SphereGeometry(size, segments, segments);
  const material = getPlanetMaterial(name, color);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = orbitRadius;
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const orbitGroup = new THREE.Object3D();
  orbitGroup.add(mesh);
  scene.add(orbitGroup);

  //Atmospheric effects
  if (['Earth', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(name)) {
    const atmosGeometry = new THREE.SphereGeometry(size * 1.08, 16, 16);
    let atmosColor;
    switch(name) {
      case 'Earth': atmosColor = 0x87ceeb; break;
      case 'Jupiter': atmosColor = 0xff9933; break;
      case 'Saturn': atmosColor = 0xffd700; break;
      case 'Uranus': atmosColor = 0x4fd0e3; break;
      case 'Neptune': atmosColor = 0x4169e1; break;
    }
    
    const atmosMaterial = new THREE.MeshBasicMaterial({
      color: atmosColor,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
    mesh.add(atmosphere);
  }

  // Saturn rings
  if (name === 'Saturn') {
    const ringGeometry = new THREE.RingGeometry(size * 1.3, size * 2.2, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e4bc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      emissive: 0x332211,
      emissiveIntensity: 0.2,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    ring.receiveShadow = true;
    mesh.add(ring);

    // Ring particles
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = size * 1.4 + Math.random() * size * 0.6;
      const angle = Math.random() * Math.PI * 2;
      positions[i] = radius * Math.cos(angle);
      positions[i + 1] = (Math.random() - 0.5) * 0.1;
      positions[i + 2] = radius * Math.sin(angle);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf4e4bc,
      size: 0.15,
      transparent: true,
      opacity: 0.8
    });
    const ringParticles = new THREE.Points(particleGeometry, particleMaterial);
    mesh.add(ringParticles);
  }

  return { orbitGroup, mesh };
}

  //asteroid belt
function createAsteroidBelt() {
  const asteroidGroup = new THREE.Object3D();
  const asteroidCount = 600;
  const innerRadius = 65;
  const outerRadius = 75;

  for (let i = 0; i < asteroidCount; i++) {
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const size = 0.08 + Math.random() * 0.2;
    const height = (Math.random() - 0.5) * 3;

    const geometry = new THREE.DodecahedronGeometry(size, 0);
    
    const vertices = geometry.attributes.position.array;
    for (let j = 0; j < vertices.length; j += 3) {
      vertices[j] *= 0.7 + Math.random() * 0.6;
      vertices[j + 1] *= 0.7 + Math.random() * 0.6;
      vertices[j + 2] *= 0.7 + Math.random() * 0.6;
    }
    geometry.attributes.position.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.1, 0.3, 0.5 + Math.random() * 0.4),
      roughness: 0.8,
      metalness: 0.15,
      emissive: new THREE.Color().setHSL(0.1, 0.2, 0.1),
      emissiveIntensity: 0.3,
    });

    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.set(
      radius * Math.cos(angle),
      height,
      radius * Math.sin(angle)
    );
    
    asteroid.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    asteroidGroup.add(asteroid);
  }

  scene.add(asteroidGroup);
  return asteroidGroup;
}

//Create Sun
createSun();

// Planets Data
const planetData = [
  { name: 'Mercury', size: 1.38, color: 0xa0a0a0, orbitRadius: 40,  orbitSpeed: 1.6,  rotationSpeed: 0.02 },
  { name: 'Venus',   size: 1.95, color: 0xffdd88, orbitRadius: 50,  orbitSpeed: 1.18, rotationSpeed: 0.01 },
  { name: 'Earth',   size: 2.00, color: 0x2288dd, orbitRadius: 62,  orbitSpeed: 1.0, rotationSpeed: 0.01 },
  { name: 'Mars',    size: 1.53, color: 0xdd8888, orbitRadius: 75,  orbitSpeed: 0.81,  rotationSpeed: 0.01 },
  { name: 'Jupiter', size: 11.97,color: 0xffaa44, orbitRadius: 95,  orbitSpeed: 0.44, rotationSpeed: 0.005 },
  { name: 'Saturn',  size: 10.14, color: 0xa08060, orbitRadius: 130, orbitSpeed: 0.33, rotationSpeed: 0.004 },
  { name: 'Uranus',  size: 4.98, color: 0x88ddff, orbitRadius: 160, orbitSpeed: 0.22, rotationSpeed: 0.003 },
  { name: 'Neptune', size: 4.86, color: 0x4466aa, orbitRadius: 175, orbitSpeed: 0.18,  rotationSpeed: 0.002 },
];

//orbit
planetData.forEach(data => {
  const orbitGeometry = new THREE.TorusGeometry(data.orbitRadius, 0.08, 8, 100);
  const orbitMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x888888,
    opacity: 0.5,
    transparent: true,
    emissive: 0x222222,
    emissiveIntensity: 0.3,
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);
});

const planets = planetData.map(data => createPlanet({ ...data, segments: 32 }));
const asteroidBelt = createAsteroidBelt();

//planet facts
const planetFacts = {
  Mercury: {
    name: 'Mercury',
    diameter: '4,880 km',
    distance: '57.9 million km',
    period: '88 days',
    composition: 'Rocky (terrestrial)',
    features: 'No atmosphere, extreme temperatures (-173°C to 427°C), heavily cratered surface like the Moon',
    moons: '0',
    mass: '0.33 × 10²⁴ kg',
    gravity: '3.7 m/s²'
  },
  Venus: {
    name: 'Venus',
    diameter: '12,104 km',
    distance: '108.2 million km',
    period: '225 days',
    composition: 'Rocky (terrestrial)',
    features: 'Thick CO₂ atmosphere, hottest planet (462°C), retrograde rotation, volcanic surface',
    moons: '0',
    mass: '4.87 × 10²⁴ kg',
    gravity: '8.87 m/s²'
  },
  Earth: {
    name: 'Earth',
    diameter: '12,742 km',
    distance: '149.6 million km',
    period: '365.25 days',
    composition: 'Rocky (terrestrial)',
    features: 'Liquid water, life, oxygen atmosphere, protective magnetic field, 71% water coverage',
    moons: '1 (Luna)',
    mass: '5.97 × 10²⁴ kg',
    gravity: '9.81 m/s²'
  },
  Mars: {
    name: 'Mars',
    diameter: '6,779 km',
    distance: '227.9 million km',
    period: '687 days',
    composition: 'Rocky (terrestrial)',
    features: 'Red color from iron oxide, largest volcano (Olympus Mons), polar ice caps, thin atmosphere',
    moons: '2 (Phobos, Deimos)',
    mass: '0.64 × 10²⁴ kg',
    gravity: '3.71 m/s²'
  },
  Jupiter: {
    name: 'Jupiter',
    diameter: '139,820 km',
    distance: '778.5 million km',
    period: '11.9 years',
    composition: 'Gas giant (H₂, He)',
    features: 'Great Red Spot storm, largest planet, strongest magnetic field, cosmic vacuum cleaner',
    moons: '95+ (Io, Europa, Ganymede, Callisto)',
    mass: '1898 × 10²⁴ kg',
    gravity: '24.79 m/s²'
  },
  Saturn: {
    name: 'Saturn',
    diameter: '116,460 km',
    distance: '1.43 billion km',
    period: '29.5 years',
    composition: 'Gas giant (H₂, He)',
    features: 'Spectacular ring system, lowest density (less than water), hexagonal storm at north pole',
    moons: '146+ (Titan, Enceladus, Mimas)',
    mass: '568 × 10²⁴ kg',
    gravity: '10.44 m/s²'
  },
  Uranus: {
    name: 'Uranus',
    diameter: '50,724 km',
    distance: '2.87 billion km',
    period: '84 years',
    composition: 'Ice giant (H₂O, CH₄, NH₃)',
    features: 'Tilted 98° axis, blue-green color from methane, faint rings, coldest atmosphere',
    moons: '27 (Miranda, Ariel, Umbriel)',
    mass: '86.8 × 10²⁴ kg',
    gravity: '8.69 m/s²'
  },
  Neptune: {
    name: 'Neptune',
    diameter: '49,244 km',
    distance: '4.5 billion km',
    period: '165 years',
    composition: 'Ice giant (H₂O, CH₄, NH₃)',
    features: 'Strongest winds (2100 km/h), deep blue color, discovered through mathematics',
    moons: '16+ (Triton, Nereid)',
    mass: '102 × 10²⁴ kg',
    gravity: '11.15 m/s²'
  },
  Sun: {
    name: 'Sun',
    diameter: '1,391,000 km',
    distance: '0 km (center)',
    period: '25-35 days (rotation)',
    composition: 'Plasma (73% H, 25% He)',
    features: 'Nuclear fusion core, 5778K surface, solar wind, 99.86% of solar system mass',
    moons: '8 planets + asteroids',
    mass: '1989 × 10²⁷ kg',
    gravity: '274 m/s²'
  },
};

//Camera Movement using Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let tooltipTimeout = null;

function showTooltip(html, x, y) {
  if (tooltipTimeout) clearTimeout(tooltipTimeout);
  tooltip.innerHTML = html;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add('visible');
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  if (tooltipTimeout) clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    tooltip.innerHTML = '';
  }, 200);
}

function getPlanetTooltip(name) {
  const fact = planetFacts[name];
  if (!fact) return `<h4>${name}</h4>`;
  return `
    <h4>${fact.name}</h4>
    <div class="tooltip-row">
      <span class="tooltip-label">Diameter:</span>
      <span class="tooltip-value">${fact.diameter}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Distance:</span>
      <span class="tooltip-value">${fact.distance}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Period:</span>
      <span class="tooltip-value">${fact.period}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Moons:</span>
      <span class="tooltip-value">${fact.moons}</span>
    </div>
  `;
}

//camera focus
let focusedPlanet = null;
let cameraTween = null;
let targetTween = null;
let orbitAngle = 0;
let lockedPlanet = null;

const defaultCamera = {
  position: { x: 0, y: 40, z: 100 },
  target: { x: 0, y: 0, z: 0 }
};

function focusOnPlanetGSAP(planetObj, planetName) {
  if (focusedPlanet === planetObj) return;
  focusedPlanet = planetObj;

  const size = planetObj.geometry.boundingSphere ? planetObj.geometry.boundingSphere.radius : 1;
  const distance = Math.max(20, size * 5);

  planetObj.updateWorldMatrix(true, false);
  const worldPos = new THREE.Vector3();
  planetObj.getWorldPosition(worldPos);

  const camDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  const dest = worldPos.clone().add(camDir.multiplyScalar(distance));

  gsap.to(camera.position, {
    x: dest.x,
    y: dest.y,
    z: dest.z,
    duration: 1.5,
    ease: 'power3.inOut',
    onUpdate: () => controls.update(),
  });
  gsap.to(controls.target, {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    duration: 1.5,
    ease: 'power3.inOut',
    onUpdate: () => controls.update(),
    onComplete: () => {
      controls.update();
      lockedPlanet = planetObj;
    },
  });
  showInfoPanel(planetName);
}

function resetCameraViewGSAP() {
  focusedPlanet = null;
  lockedPlanet = null;
  gsap.to(camera.position, {
    x: defaultCamera.position.x,
    y: defaultCamera.position.y,
    z: defaultCamera.position.z,
    duration: 1.5,
    ease: 'power3.inOut',
    onUpdate: () => controls.update(),
  });
  gsap.to(controls.target, {
    x: defaultCamera.target.x,
    y: defaultCamera.target.y,
    z: defaultCamera.target.z,
    duration: 1.5,
    ease: 'power3.inOut',
    onUpdate: () => controls.update(),
    onComplete: () => controls.update(),
  });
  hideInfoPanel();
}

function showInfoPanel(name) {
  const fact = planetFacts[name];
  if (!fact) return;
  
  planetInfoTitle.textContent = fact.name;
  planetInfoContent.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Diameter</div>
        <div class="info-value">${fact.diameter}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Distance</div>
        <div class="info-value">${fact.distance}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Period</div>
        <div class="info-value">${fact.period}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Mass</div>
        <div class="info-value">${fact.mass}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Moons</div>
        <div class="info-value">${fact.moons}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Gravity</div>
        <div class="info-value">${fact.gravity}</div>
      </div>
    </div>
    <div class="info-features">
      <div class="info-label">Key Features</div>
      <div>${fact.features}</div>
    </div>
  `;
  planetInfoPanel.classList.add('visible');
  hideTooltip();
  
  //hamburger menu
  if (!sidePanel.classList.contains('open')) {
    hamburgerMenu.click();
  }
}

function hideInfoPanel() {
  planetInfoPanel.classList.remove('visible');
}

//orbital speed control
window.planetOrbitSpeeds = [...planetData.map(p => p.orbitSpeed)];

function createSpeedControls() {
  speedControlsContainer.innerHTML = '';
  
  planetData.forEach((planet, index) => {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'speed-control';
    controlDiv.innerHTML = `
      <span class="speed-control-label">${planet.name}</span>
      <input type="range" 
             min="0" 
             max="${(planet.orbitSpeed * 2).toFixed(3)}" 
             step="0.001" 
             value="${planet.orbitSpeed}" 
             data-planet="${index}">
      <span class="speed-value">${planet.orbitSpeed.toFixed(3)}</span>
    `;
    
    const slider = controlDiv.querySelector('input[type="range"]');
    const valueDisplay = controlDiv.querySelector('.speed-value');
    
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      window.planetOrbitSpeeds[index] = value;
      valueDisplay.textContent = value.toFixed(3);
    });
    
    speedControlsContainer.appendChild(controlDiv);
  });
}

hamburgerMenu.addEventListener('click', () => {
  hamburgerMenu.classList.toggle('open');
  sidePanel.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!sidePanel.contains(e.target) && !hamburgerMenu.contains(e.target)) {
    hamburgerMenu.classList.remove('open');
    sidePanel.classList.remove('open');
  }
});

closeInfoBtn.addEventListener('click', () => {
  hideInfoPanel();
});

canvas.addEventListener('mousemove', (event) => {
  if (event.target !== canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const planetMeshes = planets.map(p => p.mesh);
  if (sunMesh) planetMeshes.push(sunMesh);
  const intersects = raycaster.intersectObjects(planetMeshes, false);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const name = obj.name;
    if (name && planetFacts[name]) {
      showTooltip(getPlanetTooltip(name), event.clientX, event.clientY);
      canvas.style.cursor = 'pointer';
      return;
    }
  }
  hideTooltip();
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
  hideTooltip();
  canvas.style.cursor = 'grab';
});


canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const planetMeshes = planets.map(p => p.mesh);
  if (sunMesh) planetMeshes.push(sunMesh);
  const intersects = raycaster.intersectObjects(planetMeshes, false);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const name = obj.name;
    if (name && planetFacts[name]) {
      focusOnPlanetGSAP(obj, name);
    }
  }
});

let animationPaused = false;

pauseBtn.addEventListener('click', (e) => {
  e.preventDefault();
  animationPaused = !animationPaused;
  
  if (animationPaused) {
    pauseBtn.innerHTML = '▶ Resume';
    pauseBtn.classList.add('paused');
  } else {
    pauseBtn.innerHTML = '⏸ Pause';
    pauseBtn.classList.remove('paused');
  }
});

resetViewBtn.addEventListener('click', (e) => {
  e.preventDefault();
  resetCameraViewGSAP();
});


document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  switch(e.code) {
    case 'Space':
      e.preventDefault();
      pauseBtn.click();
      break;
    case 'Escape':
      e.preventDefault();
      resetCameraViewGSAP();
      break;
    case 'KeyH':
      hamburgerMenu.click();
      break;
    case 'Digit1':
      focusOnPlanetGSAP(planets[0].mesh, planets[0].mesh.name);
      break;
    case 'Digit2':
      focusOnPlanetGSAP(planets[1].mesh, planets[1].mesh.name);
      break;
    case 'Digit3':
      focusOnPlanetGSAP(planets[2].mesh, planets[2].mesh.name);
      break;
    case 'Digit4':
      focusOnPlanetGSAP(planets[3].mesh, planets[3].mesh.name);
      break;
    case 'Digit5':
      focusOnPlanetGSAP(planets[4].mesh, planets[4].mesh.name);
      break;
    case 'Digit6':
      focusOnPlanetGSAP(planets[5].mesh, planets[5].mesh.name);
      break;
    case 'Digit7':
      focusOnPlanetGSAP(planets[6].mesh, planets[6].mesh.name);
      break;
    case 'Digit8':
      focusOnPlanetGSAP(planets[7].mesh, planets[7].mesh.name);
      break;
    case 'Digit0':
      focusOnPlanetGSAP(sunMesh, 'Sun');
      break;
  }
});

// Responsive resize
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);

const clock = new THREE.Clock();
let lastElapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  
  let delta = 0;
  let elapsed = clock.getElapsedTime();
  
  if (!animationPaused) {
    delta = clock.getDelta();
    lastElapsed = elapsed;
  } else {
    elapsed = lastElapsed;
    delta = 0;
  }


  planets.forEach((planet, i) => {
    const speed = window.planetOrbitSpeeds && window.planetOrbitSpeeds[i] !== undefined
      ? window.planetOrbitSpeeds[i]
      : planetData[i].orbitSpeed;
    planet.orbitGroup.rotation.y = elapsed * speed;
    planet.mesh.rotation.y += planetData[i].rotationSpeed;
  });

  if (sunMesh) {
    sunMesh.rotation.y += 0.008;
  }

  if (asteroidBelt) {
    asteroidBelt.rotation.y += 0.002;
    if (!animationPaused) {
      asteroidBelt.children.forEach(asteroid => {
        asteroid.rotation.x += 0.01 * delta * 60;
        asteroid.rotation.y += 0.005 * delta * 60;
        asteroid.rotation.z += 0.008 * delta * 60;
      });
    }
  }


  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);

  if (lockedPlanet) {
    const size = lockedPlanet.geometry.boundingSphere ? lockedPlanet.geometry.boundingSphere.radius : 1;
    const distance = Math.max(20, size * 5);
    const worldPos = new THREE.Vector3();
    lockedPlanet.getWorldPosition(worldPos);
    const camDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const dest = worldPos.clone().add(camDir.multiplyScalar(distance));
    camera.position.lerp(dest, 0.15);
    controls.target.lerp(worldPos, 0.15);
    controls.update();
  }
}

function init() {
  createSpeedControls();
animate(); 
}

init();

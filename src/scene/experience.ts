import * as THREE from 'three';

export interface ARExperience {
  root: THREE.Group;
  update: (elapsed: number, delta: number) => void;
  onSelectObject?: (hit: THREE.Intersection) => string | null;
  setPaused: (paused: boolean) => void;
  isPaused: () => boolean;
  dispose: () => void;
}

interface CelestialInfo {
  name: string;
  diameter: string;
  fact: string;
  accent: string;
}

interface PlanetSpec extends CelestialInfo {
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  tilt: number;
  initialAngle: number;
  palette: [string, string, string];
  style: 'rocky' | 'banded' | 'earth' | 'ice';
  hasRings?: boolean;
}

const SUN_INFO: CelestialInfo = {
  name: 'Sol',
  diameter: '1,392,700 km',
  fact: 'Contiene el 99.86 % de toda la masa del Sistema Solar y su núcleo alcanza los 15 millones de grados.',
  accent: '#fbbf24'
};

const PLANET_SPECS: PlanetSpec[] = [
  {
    name: 'Mercurio',
    diameter: '4,879 km',
    fact: 'Es el planeta más pequeño y cercano al Sol; un año allí dura solo 88 días terrestres.',
    accent: '#94a3b8',
    radius: 0.015,
    orbitRadius: 0.11,
    orbitSpeed: 1.45,
    rotationSpeed: 0.4,
    tilt: 0.03,
    initialAngle: 0.4,
    palette: ['#9ca3af', '#6b7280', '#d1d5db'],
    style: 'rocky'
  },
  {
    name: 'Venus',
    diameter: '12,104 km',
    fact: 'Gira en sentido contrario al de la mayoría de los planetas y es el más caliente por su densa atmósfera.',
    accent: '#f59e0b',
    radius: 0.022,
    orbitRadius: 0.155,
    orbitSpeed: 1.08,
    rotationSpeed: -0.25,
    tilt: 0.05,
    initialAngle: 2.1,
    palette: ['#f59e0b', '#d97706', '#fde68a'],
    style: 'banded'
  },
  {
    name: 'Tierra',
    diameter: '12,742 km',
    fact: 'Es el único planeta conocido con agua líquida estable en la superficie y vida.',
    accent: '#38bdf8',
    radius: 0.024,
    orbitRadius: 0.205,
    orbitSpeed: 0.85,
    rotationSpeed: 1.2,
    tilt: 0.41,
    initialAngle: 4.0,
    palette: ['#0284c7', '#16a34a', '#e0f2fe'],
    style: 'earth'
  },
  {
    name: 'Marte',
    diameter: '6,779 km',
    fact: 'Alberga el Monte Olimpo, el volcán más grande del Sistema Solar, tres veces más alto que el Everest.',
    accent: '#ef4444',
    radius: 0.018,
    orbitRadius: 0.255,
    orbitSpeed: 0.66,
    rotationSpeed: 1.1,
    tilt: 0.44,
    initialAngle: 5.5,
    palette: ['#dc2626', '#9a3412', '#fca5a5'],
    style: 'rocky'
  },
  {
    name: 'Júpiter',
    diameter: '139,820 km',
    fact: 'Es el planeta más grande; su Gran Mancha Roja es una tormenta mayor que toda la Tierra.',
    accent: '#fb923c',
    radius: 0.044,
    orbitRadius: 0.325,
    orbitSpeed: 0.42,
    rotationSpeed: 2.0,
    tilt: 0.05,
    initialAngle: 1.2,
    palette: ['#d97706', '#fed7aa', '#b45309'],
    style: 'banded'
  },
  {
    name: 'Saturno',
    diameter: '116,460 km',
    fact: 'Sus icónicos anillos están hechos de miles de millones de fragmentos de hielo y roca.',
    accent: '#eab308',
    radius: 0.037,
    orbitRadius: 0.415,
    orbitSpeed: 0.31,
    rotationSpeed: 1.8,
    tilt: 0.47,
    initialAngle: 3.3,
    palette: ['#eab308', '#fef08a', '#ca8a04'],
    style: 'banded',
    hasRings: true
  },
  {
    name: 'Urano',
    diameter: '50,724 km',
    fact: 'Rota completamente de lado, con una inclinación axial de casi 98 grados.',
    accent: '#22d3ee',
    radius: 0.027,
    orbitRadius: 0.495,
    orbitSpeed: 0.22,
    rotationSpeed: -1.3,
    tilt: 1.71,
    initialAngle: 5.0,
    palette: ['#22d3ee', '#06b6d4', '#cffafe'],
    style: 'ice'
  },
  {
    name: 'Neptuno',
    diameter: '49,244 km',
    fact: 'Tiene los vientos más veloces del Sistema Solar, superando los 2,000 kilómetros por hora.',
    accent: '#60a5fa',
    radius: 0.026,
    orbitRadius: 0.56,
    orbitSpeed: 0.17,
    rotationSpeed: 1.4,
    tilt: 0.49,
    initialAngle: 0.9,
    palette: ['#2563eb', '#1d4ed8', '#93c5fd'],
    style: 'ice'
  }
];

function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#f59e0b');
  grad.addColorStop(0.5, '#fef08a');
  grad.addColorStop(1, '#ea580c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 180; i++) {
    const x = (i * 53) % canvas.width;
    const y = (i * 29) % canvas.height;
    const r = 3 + (i % 9);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(234, 88, 12, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPlanetTexture(spec: PlanetSpec): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const [c1, c2, c3] = spec.palette;

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (spec.style === 'banded') {
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.fillStyle = (y / 8) % 2 === 0 ? c2 : c3;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, y, canvas.width, 5);
    }
    ctx.globalAlpha = 1;
    if (spec.name === 'Júpiter') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(150, 82, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (spec.style === 'earth') {
    ctx.fillStyle = c2;
    const blobs = [
      [50, 48, 26, 18], [130, 60, 32, 22], [200, 45, 24, 16], [95, 92, 18, 12]
    ];
    for (const [x, y, rx, ry] of blobs) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = c3;
    ctx.fillRect(0, 0, canvas.width, 10);
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
  } else if (spec.style === 'rocky') {
    for (let i = 0; i < 65; i++) {
      const x = (i * 41 + 17) % canvas.width;
      const y = (i * 23 + 11) % canvas.height;
      const r = 2 + (i % 7);
      ctx.fillStyle = i % 2 === 0 ? c2 : c3;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, c3);
    grad.addColorStop(0.5, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(234, 179, 8, 0.05)');
  grad.addColorStop(0.3, 'rgba(254, 240, 138, 0.75)');
  grad.addColorStop(0.55, 'rgba(202, 138, 4, 0.35)');
  grad.addColorStop(0.8, 'rgba(253, 224, 71, 0.8)');
  grad.addColorStop(1, 'rgba(234, 179, 8, 0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function formatInfoCard(info: CelestialInfo): string {
  return `
    <div class="planet-card">
      <div class="planet-card-header">
        <span class="planet-dot" style="background:${info.accent}"></span>
        <strong class="planet-name">${info.name}</strong>
      </div>
      <p class="planet-diameter"><span>Diámetro:</span> ${info.diameter}</p>
      <p class="planet-fact">${info.fact}</p>
    </div>
  `;
}

export function createExperience(): ARExperience {
  const root = new THREE.Group();
  const systemGroup = new THREE.Group();
  systemGroup.position.set(0, 0.22, 0);
  root.add(systemGroup);

  const disposables: Array<{ dispose: () => void }> = [];
  const infoMap = new Map<THREE.Object3D, CelestialInfo>();

  // Sol central brillante
  const sunGeo = new THREE.SphereGeometry(0.068, 32, 32);
  const sunTex = createSunTexture();
  const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  systemGroup.add(sunMesh);
  infoMap.set(sunMesh, SUN_INFO);
  disposables.push(sunGeo, sunTex, sunMat);

  const glowGeo1 = new THREE.SphereGeometry(0.082, 24, 24);
  const glowMat1 = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow1 = new THREE.Mesh(glowGeo1, glowMat1);
  glow1.userData.nonInteractive = true;
  systemGroup.add(glow1);
  disposables.push(glowGeo1, glowMat1);

  const glowGeo2 = new THREE.SphereGeometry(0.102, 24, 24);
  const glowMat2 = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow2 = new THREE.Mesh(glowGeo2, glowMat2);
  glow2.userData.nonInteractive = true;
  systemGroup.add(glow2);
  disposables.push(glowGeo2, glowMat2);

  const sunLight = new THREE.PointLight(0xfff3c4, 2.8, 3.0, 1.5);
  systemGroup.add(sunLight);

  // Planetas y órbitas
  const orbiters: Array<{
    pivot: THREE.Group;
    mesh: THREE.Mesh;
    spec: PlanetSpec;
  }> = [];

  const ringTex = createRingTexture();
  disposables.push(ringTex);

  for (const spec of PLANET_SPECS) {
    const orbitGeo = new THREE.TorusGeometry(spec.orbitRadius, 0.0012, 8, 96);
    orbitGeo.rotateX(Math.PI / 2);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.35
    });
    const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
    orbitMesh.userData.nonInteractive = true;
    systemGroup.add(orbitMesh);
    disposables.push(orbitGeo, orbitMat);

    const pivot = new THREE.Group();
    pivot.rotation.y = spec.initialAngle;
    systemGroup.add(pivot);

    const planetGeo = new THREE.SphereGeometry(spec.radius, 28, 28);
    const planetTex = createPlanetTexture(spec);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.72,
      metalness: 0.08
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(spec.orbitRadius, 0, 0);
    planetMesh.rotation.z = spec.tilt;
    pivot.add(planetMesh);
    infoMap.set(planetMesh, spec);
    disposables.push(planetGeo, planetTex, planetMat);

    if (spec.hasRings) {
      const saturnRingGeo = new THREE.RingGeometry(spec.radius * 1.35, spec.radius * 2.25, 48);
      saturnRingGeo.rotateX(-Math.PI / 2);
      const saturnRingMat = new THREE.MeshBasicMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
      planetMesh.add(saturnRing);
      infoMap.set(saturnRing, spec);
      disposables.push(saturnRingGeo, saturnRingMat);
    }

    orbiters.push({ pivot, mesh: planetMesh, spec });
  }

  let paused = false;
  let simTime = 0;

  return {
    root,
    setPaused(value: boolean) {
      paused = value;
    },
    isPaused() {
      return paused;
    },
    update(_elapsed: number, delta: number) {
      const safeDelta = Math.min(delta, 0.1);
      if (!paused) {
        simTime += safeDelta;
        sunMesh.rotation.y = simTime * 0.18;
        for (const item of orbiters) {
          item.pivot.rotation.y = item.spec.initialAngle + simTime * item.spec.orbitSpeed;
          item.mesh.rotation.y = simTime * item.spec.rotationSpeed;
        }
      }
      const pulse = 1 + Math.sin(simTime * 3.0) * 0.04;
      glow1.scale.setScalar(pulse);
      glow2.scale.setScalar(1 + Math.cos(simTime * 2.2) * 0.06);
    },
    onSelectObject(hit: THREE.Intersection) {
      const info = infoMap.get(hit.object);
      return info ? formatInfoCard(info) : null;
    },
    dispose() {
      for (const d of disposables) d.dispose();
    }
  };
}

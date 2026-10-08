import * as THREE from "three";

const container = document.querySelector("#game");
const speedDisplay = document.querySelector("#speed");
const loading = document.querySelector("#loading");
const countdownDisplay = document.querySelector("#countdown");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-button");
const timerDisplay = document.querySelector("#timer");
const speedometerFill = document.querySelector("#speedometer-fill");
const speedometerNeedle = document.querySelector("#speedometer-needle");
const finishScreen = document.querySelector("#finish-screen");
const pauseScreen = document.querySelector("#pause-screen");
const startPanel = document.querySelector(".start-panel");
const mainMenuView = document.querySelector("#main-menu");
const controlsMenuView = document.querySelector("#controls-menu");
const leaderboardMenuView = document.querySelector("#leaderboard-menu");
const modeSelectView = document.querySelector("#mode-select");
const vehicleSelectView = document.querySelector("#vehicle-select");
const recordsRows = document.querySelector("#records-rows");
const recordsError = document.querySelector("#records-error");
const menuViews = document.querySelectorAll(".menu-view");
const playButton = document.querySelector("#play-button");
const controlsButton = document.querySelector("#controls-button");
const leaderboardButton = document.querySelector("#leaderboard-button");
const recordsBackButton = document.querySelector("#leaderboard-back-button");
const controlsBackButton = document.querySelector("#controls-back-button");
const modeBackButton = document.querySelector("#mode-back-button");
const modeNextButton = document.querySelector("#mode-next-button");
const vehicleBackButton = document.querySelector("#vehicle-back-button");
const resumeButton = document.querySelector("#resume-button");
const pauseRestartButton = document.querySelector("#pause-restart-button");
const pauseMainMenuButton = document.querySelector("#pause-main-menu-button");
const finishTimeDisplay = document.querySelector("#finish-time");
const finishBestLapDisplay = document.querySelector("#finish-best-lap");
const leaderboardForm = document.querySelector("#leaderboard-form");
const leaderboardNameInput = document.querySelector("#leaderboard-name");
const leaderboardSubmitButton = document.querySelector("#leaderboard-submit");
const leaderboardError = document.querySelector("#leaderboard-error");
const leaderboardSection = document.querySelector("#leaderboard-section");
const leaderboardRows = document.querySelector("#leaderboard-rows");
const modeStatus = document.querySelector("#mode-status");
const trackStatus = document.querySelector("#track-status");
const trackName = document.querySelector("#track-name");
const trackCoordinate = document.querySelector("#track-coordinate");
const timerLabel = document.querySelector("#timer-label");
const steerHint = document.querySelector("#steer-hint");
const lapCard = document.querySelector(".lap-card");
const positionCard = document.querySelector(".position-card");
const hillProgressCard = document.querySelector("#hill-progress-card");
const hillProgressDisplay = document.querySelector("#hill-progress");
const hillProgressFill = document.querySelector("#hill-progress-fill");
const checkpointCard = document.querySelector("#checkpoint-card");
const checkpointTimeDisplay = document.querySelector("#checkpoint-time");
const checkpointCountDisplay = document.querySelector("#checkpoint-count");
const ghostLabel = document.querySelector("#ghost-label");
const ghostTimeDisplay = document.querySelector("#ghost-time");
const runMessage = document.querySelector("#run-message");
const startIntro = document.querySelector("#start-intro");
const startButtonText = startButton.firstChild;
const finishKicker = document.querySelector("#finish-kicker");
const finishTitle = document.querySelector("#finish-title");
const finishLaps = document.querySelector("#finish-laps");
const finishPlace = document.querySelector("#finish-place");
const finishTimeLabel = document.querySelector("#finish-time-label");
const finishBestLabel = document.querySelector("#finish-best-label");
const finishCheckpoints = document.querySelector("#finish-checkpoints");
const finishRestartText = document.querySelector("#finish-restart").firstChild;
const modeCards = document.querySelectorAll(".mode-card");
const circuitWorld = new THREE.Group();
const hillWorld = new THREE.Group();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91cce3);
scene.fog = new THREE.Fog(0xaed4df, 460, 1180);

const camera = new THREE.PerspectiveCamera(57, window.innerWidth / window.innerHeight, 0.1, 1400);
camera.position.set(0, 9, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9f1ff, 0x9b815d, 1.8));
const sunlight = new THREE.DirectionalLight(0xffe2ad, 2.1);
sunlight.position.set(-120, 180, 100);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -180;
sunlight.shadow.camera.right = 180;
sunlight.shadow.camera.top = 180;
sunlight.shadow.camera.bottom = -180;
sunlight.shadow.bias = -0.00025;
scene.add(sunlight);

const cyan = new THREE.MeshStandardMaterial({
  color: 0xc59b59,
  roughness: 0.82,
});
const pink = new THREE.MeshStandardMaterial({
  color: 0x946844,
  roughness: 0.86,
});
const whiteGlow = new THREE.MeshStandardMaterial({
  color: 0xf1e4c8,
  roughness: 0.55,
});

const sandPixels = new Uint8Array(128 * 128 * 4);
let sandSeed = 7429;
for (let i = 0; i < 128 * 128; i += 1) {
  sandSeed = (sandSeed * 16807) % 2147483647;
  const grain = Math.floor(((sandSeed - 1) / 2147483646) * 28);
  sandPixels[i * 4] = 205 + grain;
  sandPixels[i * 4 + 1] = 178 + grain;
  sandPixels[i * 4 + 2] = 128 + grain;
  sandPixels[i * 4 + 3] = 255;
}
const sandTexture = new THREE.DataTexture(sandPixels, 128, 128, THREE.RGBAFormat);
sandTexture.wrapS = THREE.RepeatWrapping;
sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(52, 52);
sandTexture.colorSpace = THREE.SRGBColorSpace;
sandTexture.needsUpdate = true;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1800, 1800),
  new THREE.MeshStandardMaterial({ color: 0xd9c08e, map: sandTexture, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.16;
ground.receiveShadow = true;
scene.add(ground);

const shallowWater = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 1050),
  new THREE.MeshStandardMaterial({ color: 0x67b9c2, roughness: 0.38, metalness: 0.04 }),
);
shallowWater.rotation.x = -Math.PI / 2;
shallowWater.position.set(158, -0.55, -70);
scene.add(shallowWater);
const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1250),
  new THREE.MeshStandardMaterial({ color: 0x398ea7, roughness: 0.34, metalness: 0.08 }),
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.set(690, -0.62, -70);
scene.add(ocean);

const grid = new THREE.GridHelper(500, 100, 0x17384d, 0x172135);
grid.position.y = -0.145;
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);
grid.visible = false;

const centerX = 0;
const centerZ = 0;
const radiusX = 62;
const radiusZ = 40;
const trackWidth = 16;
const trackSamples = 320;

function makeOvalPoint(angle, offset = 0, y = 0) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const baseX = radiusX * cosine;
  const baseZ = radiusZ * sine;
  let normalX = cosine / radiusX;
  let normalZ = sine / radiusZ;
  const normalLength = Math.hypot(normalX, normalZ);
  normalX /= normalLength;
  normalZ /= normalLength;
  return new THREE.Vector3(
    centerX + baseX + normalX * offset,
    y,
    centerZ + baseZ + normalZ * offset,
  );
}

function makeRoad() {
  const positions = [];
  const indices = [];
  const uv = [];
  const innerOffset = -trackWidth / 2;
  const outerOffset = trackWidth / 2;

  for (let i = 0; i <= trackSamples; i += 1) {
    const angle = (i / trackSamples) * Math.PI * 2;
    const inner = makeOvalPoint(angle, innerOffset, -0.035);
    const outer = makeOvalPoint(angle, outerOffset, -0.035);
    positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
    uv.push(0, i / trackSamples, 1, i / trackSamples);
    if (i < trackSamples) {
      const a = i * 2;
      const b = a + 1;
      indices.push(a, b, a + 2, b, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x806648,
      roughness: 0.96,
      side: THREE.DoubleSide,
    }),
  );
  road.receiveShadow = true;
  circuitWorld.add(road);

  for (const offset of [-trackWidth / 2, trackWidth / 2]) {
    const points = [];
    for (let i = 0; i <= trackSamples; i += 1) {
      points.push(makeOvalPoint((i / trackSamples) * Math.PI * 2, offset, 0.025));
    }
    const edge = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), trackSamples, 0.105, 6, false),
      offset < 0 ? pink : cyan,
    );
    circuitWorld.add(edge);
  }

  const dashMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9c49b,
    roughness: 0.85,
  });
  for (let i = 0; i < 80; i += 1) {
    const angle = (i / 80) * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 1.05), dashMaterial);
    marker.position.copy(makeOvalPoint(angle, 0, 0.005));
    const tangentX = -radiusX * Math.sin(angle);
    const tangentZ = radiusZ * Math.cos(angle);
    marker.rotation.y = Math.atan2(tangentX, tangentZ);
    circuitWorld.add(marker);
  }

  const startLine = new THREE.Mesh(
    new THREE.BoxGeometry(trackWidth - 0.25, 0.04, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xf4e8cd, roughness: 0.72 }),
  );
  startLine.position.copy(makeOvalPoint(-Math.PI / 2, 0, 0.02));
  startLine.rotation.y = Math.PI / 2;
  circuitWorld.add(startLine);
}

makeRoad();

function addTracksidePylons() {
  const postGeometry = new THREE.CylinderGeometry(0.12, 0.17, 1.2, 8);
  const capGeometry = new THREE.SphereGeometry(0.13, 8, 6);
  for (let i = 0; i < 56; i += 1) {
    const angle = (i / 56) * Math.PI * 2;
    const outside = i % 2 === 0 ? 1 : -1;
    const post = new THREE.Mesh(postGeometry, i % 2 === 0 ? cyan : pink);
    post.position.copy(makeOvalPoint(angle, outside * (trackWidth / 2 + 2.2), 0.58));
    post.castShadow = true;
    circuitWorld.add(post);
    const cap = new THREE.Mesh(capGeometry, i % 2 === 0 ? whiteGlow : pink);
    cap.position.copy(post.position);
    cap.position.y += 0.65;
    circuitWorld.add(cap);
  }
}

addTracksidePylons();

function addCoastScenery() {
  let seed = 48271;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const scenery = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x735337, roughness: 0.95 });
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x476d43, roughness: 0.92, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x63824c, roughness: 0.92, side: THREE.DoubleSide }),
  ];
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.42, 9, 8);
  const leafGeometry = new THREE.SphereGeometry(1, 8, 6);
  for (let i = 0; i < 38; i += 1) {
    const z = -530 + i * 17 + random() * 10;
    const x = 91 + random() * 38;
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 4.25, z);
    trunk.rotation.z = (random() - 0.5) * 0.18;
    trunk.castShadow = true;
    scenery.add(trunk);
    const crown = new THREE.Vector3(x, 8.9, z);
    for (let frond = 0; frond < 7; frond += 1) {
      const angle = (frond / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeometry, leafMaterials[frond % 2]);
      leaf.position.set(crown.x + Math.cos(angle) * 2.2, crown.y - 0.2, crown.z + Math.sin(angle) * 2.2);
      leaf.scale.set(0.55, 0.16, 2.8);
      leaf.rotation.y = -angle;
      leaf.rotation.z = -0.18;
      leaf.castShadow = true;
      scenery.add(leaf);
    }
  }

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x8e8573, roughness: 1, flatShading: true });
  for (let i = 0; i < 115; i += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 82 + random() * 100;
    const size = 0.8 + random() * 2.5;
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(size, 0),
      rockMaterial,
    );
    rock.position.set(Math.cos(angle) * distance, size * 0.38, Math.sin(angle) * distance);
    rock.rotation.set(random(), random() * Math.PI, random());
    rock.scale.y = 0.55 + random() * 0.55;
    rock.castShadow = true;
    scenery.add(rock);
  }
  circuitWorld.add(scenery);

  const clouds = new THREE.Group();
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 1 });
  for (let i = 0; i < 24; i += 1) {
    const x = -320 + random() * 570;
    const y = 52 + random() * 32;
    const z = -550 + random() * 1050;
    const cloud = new THREE.Group();
    for (let puff = 0; puff < 4; puff += 1) {
      const size = 4 + random() * 4;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), cloudMaterial);
      mesh.position.set(puff * size * 0.9, random() * size * 0.5, random() * size * 0.3);
      cloud.add(mesh);
    }
    cloud.position.set(x, y, z);
    clouds.add(cloud);
  }
  scene.add(clouds);
}

addCoastScenery();
scene.add(circuitWorld);

const hillCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(38, 12, -55),
  new THREE.Vector3(48, 17, -88),
  new THREE.Vector3(-38, 31, -145),
  new THREE.Vector3(-48, 37, -178),
  new THREE.Vector3(38, 52, -235),
  new THREE.Vector3(48, 58, -268),
  new THREE.Vector3(-38, 74, -325),
  new THREE.Vector3(-48, 80, -358),
  new THREE.Vector3(38, 98, -415),
  new THREE.Vector3(45, 104, -448),
  new THREE.Vector3(0, 124, -510),
], false, "centripetal");
const hillLength = hillCurve.getLength();
const hillRoadWidth = 17;

function hillRoadPoint(progress, lateralOffset = 0, elevationOffset = 0) {
  const t = THREE.MathUtils.clamp(progress / hillLength, 0, 1);
  const point = hillCurve.getPointAt(t);
  const tangent = hillCurve.getTangentAt(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  point.addScaledVector(normal, lateralOffset);
  point.y += elevationOffset;
  return point;
}

function buildHillClimb() {
  const samples = 520;
  const positions = [];
  const indices = [];
  const leftEdge = [];
  const rightEdge = [];
  const centerLine = [];
  for (let i = 0; i <= samples; i += 1) {
    const progress = (i / samples) * hillLength;
    const center = hillRoadPoint(progress, 0, 0.02);
    const left = hillRoadPoint(progress, -hillRoadWidth / 2, 0.02);
    const right = hillRoadPoint(progress, hillRoadWidth / 2, 0.02);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    leftEdge.push(left);
    rightEdge.push(right);
    centerLine.push(center);
    if (i < samples) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const roadGeometry = new THREE.BufferGeometry();
  roadGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  roadGeometry.setIndex(indices);
  roadGeometry.computeVertexNormals();
  const road = new THREE.Mesh(roadGeometry, new THREE.MeshStandardMaterial({
    color: 0x806648,
    roughness: 0.97,
    side: THREE.DoubleSide,
  }));
  road.receiveShadow = true;
  hillWorld.add(road);

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c704d,
    roughness: 0.9,
  });
  for (const points of [leftEdge, rightEdge]) {
    hillWorld.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), samples, 0.14, 6, false),
      edgeMaterial,
    ));
  }
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4c097,
    roughness: 0.84,
  });
  for (let i = 0; i < 130; i += 1) {
    const progress = hillLength * (i + 0.5) / 130;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 2.1), markerMaterial);
    marker.position.copy(hillRoadPoint(progress, 0, 0.09));
    const tangent = hillCurve.getTangentAt(progress / hillLength);
    marker.rotation.y = Math.atan2(tangent.x, tangent.z);
    hillWorld.add(marker);
  }

  const pylonGeometry = new THREE.CylinderGeometry(0.12, 0.16, 2.8, 8);
  for (let i = 0; i <= 52; i += 1) {
    const progress = hillLength * i / 52;
    const side = i % 2 === 0 ? -1 : 1;
    const post = new THREE.Mesh(pylonGeometry, side < 0 ? cyan : pink);
    post.position.copy(hillRoadPoint(progress, side * (hillRoadWidth / 2 + 2.5), 1.4));
    post.castShadow = true;
    hillWorld.add(post);
  }

  const finishProgress = hillLength;
  const finishLine = new THREE.Mesh(
    new THREE.BoxGeometry(hillRoadWidth - 0.3, 0.12, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xf4e8cd, roughness: 0.72 }),
  );
  finishLine.position.copy(hillRoadPoint(finishProgress, 0, 0.14));
  const finishTangent = hillCurve.getTangentAt(1);
  finishLine.rotation.y = Math.atan2(finishTangent.x, finishTangent.z);
  hillWorld.add(finishLine);

  const flagPosition = hillRoadPoint(finishProgress, hillRoadWidth / 2 + 1.5, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 10), whiteGlow);
  pole.position.copy(flagPosition);
  pole.position.y += 4.5;
  pole.castShadow = true;
  hillWorld.add(pole);
  const flag = new THREE.Group();
  flag.position.set(flagPosition.x, flagPosition.y + 7.1, flagPosition.z);
  flag.rotation.y = Math.atan2(finishTangent.x, finishTangent.z);
  const flagMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf4f7ff, emissive: 0x30394f, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x111727, side: THREE.DoubleSide }),
  ];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const square = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.05), flagMaterials[(row + column) % 2]);
      square.position.set(0.55 + column * 1.1, 1.05 - row * 1.05, 0);
      flag.add(square);
    }
  }
  hillWorld.add(flag);

  const mountainMaterial = new THREE.MeshStandardMaterial({
    color: 0x82796a,
    roughness: 1,
    flatShading: true,
  });
  let seed = 7919;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 90; i += 1) {
    const progress = hillLength * random();
    const side = random() < 0.5 ? -1 : 1;
    const position = hillRoadPoint(progress, side * (36 + random() * 95), -9);
    const mountain = new THREE.Mesh(
      new THREE.IcosahedronGeometry(9 + random() * 20, 1),
      mountainMaterial,
    );
    mountain.position.set(position.x, position.y + 7 + random() * 14, position.z);
    mountain.rotation.y = random() * Math.PI;
    mountain.scale.y = 0.8 + random() * 1.8;
    hillWorld.add(mountain);
  }
}

buildHillClimb();
scene.add(hillWorld);
hillWorld.visible = false;

const checkpointGate = new THREE.Group();
const checkpointMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1ddb1,
  roughness: 0.68,
});
const checkpointPostGeometry = new THREE.BoxGeometry(0.35, 7, 0.45);
for (const side of [-7.2, 7.2]) {
  const post = new THREE.Mesh(checkpointPostGeometry, checkpointMaterial);
  post.position.set(side, 3.5, 0);
  checkpointGate.add(post);
}
const checkpointBeam = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.45, 0.5), checkpointMaterial);
checkpointBeam.position.y = 7;
checkpointGate.add(checkpointBeam);
scene.add(checkpointGate);
checkpointGate.visible = false;

function createCar({
  bodyColor = 0x151c30,
  topColor = 0x202844,
  glassColor = 0x58d6f1,
  frontMaterial = whiteGlow,
  rearMaterial = pink,
  leftHubMaterial = cyan,
  rightHubMaterial = pink,
  underglowColor = 0x05dfff,
  vehicleType = "rally",
} = {}) {
  const car = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor,
    metalness: 0.82,
    roughness: 0.25,
  });
  const topMaterial = new THREE.MeshStandardMaterial({
    color: topColor,
    metalness: 0.72,
    roughness: 0.21,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: glassColor,
    emissive: glassColor,
    emissiveIntensity: 0.85,
    metalness: 0.65,
    roughness: 0.16,
  });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x080a12, roughness: 0.72, metalness: 0.24 });

  const chassisSize = vehicleType === "truck" ? [2.7, 0.9, 4.65] : vehicleType === "sports" ? [2.25, 0.5, 4.7] : [2.25, 0.62, 4.25];
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(...chassisSize), bodyMaterial);
  chassis.position.y = vehicleType === "truck" ? 0.8 : 0.68;
  chassis.castShadow = true;
  car.add(chassis);

  const hoodSize = vehicleType === "truck" ? [2.3, 0.24, 1.65] : vehicleType === "sports" ? [1.98, 0.16, 1.5] : [1.92, 0.19, 1.15];
  const hood = new THREE.Mesh(new THREE.BoxGeometry(...hoodSize), topMaterial);
  hood.position.set(0, vehicleType === "truck" ? 1.28 : 0.98, -1.25);
  hood.castShadow = true;
  car.add(hood);

  const cabinSize = vehicleType === "truck" ? [1.9, 0.9, 1.8] : vehicleType === "sports" ? [1.5, 0.48, 1.5] : [1.55, 0.68, 1.72];
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(...cabinSize), glassMaterial);
  cabin.position.set(0, vehicleType === "truck" ? 1.55 : vehicleType === "sports" ? 1.13 : 1.24, vehicleType === "truck" ? -0.1 : 0.28);
  cabin.castShadow = true;
  car.add(cabin);

  const roofSize = vehicleType === "truck" ? [1.78, 0.14, 1.28] : vehicleType === "sports" ? [1.35, 0.1, 0.24] : [1.43, 0.12, 0.98];
  const roof = new THREE.Mesh(new THREE.BoxGeometry(...roofSize), topMaterial);
  roof.position.set(0, vehicleType === "truck" ? 2.02 : vehicleType === "sports" ? 1.39 : 1.63, vehicleType === "truck" ? -0.1 : 0.32);
  car.add(roof);

  const frontGlow = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.13, 0.08), frontMaterial);
  frontGlow.position.set(0, 0.75, -2.15);
  car.add(frontGlow);
  const rearGlow = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.08), rearMaterial);
  rearGlow.position.set(0, 0.78, 2.15);
  car.add(rearGlow);

  const wheelGeometry = new THREE.CylinderGeometry(0.43, 0.43, 0.3, 16);
  for (const x of [-1.17, 1.17]) {
    for (const z of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(wheelGeometry, tireMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.45, z);
      wheel.castShadow = true;
      car.add(wheel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.315, 12),
        x < 0 ? leftHubMaterial : rightHubMaterial,
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      car.add(hub);
    }
  }

  const underglow = new THREE.PointLight(underglowColor, 13, 9, 2);
  underglow.position.set(0, 0.3, 0);
  car.add(underglow);
  car.position.set(0, 0, -radiusZ);
  car.rotation.y = -Math.PI / 2;
  scene.add(car);
  return car;
}

const startAngle = -Math.PI / 2;
const vehicleCatalog = {
  sports: {
    name: "Sports Car",
    topSpeed: 210 / 3.6,
    acceleration: 25,
    handling: 0.62,
    hillTraction: 0.28,
    hillSpeedLimit: 16,
    appearance: {
      bodyColor: 0x8d1826,
      topColor: 0xe43b4c,
      glassColor: 0xffa2a8,
      frontMaterial: whiteGlow,
      rearMaterial: new THREE.MeshStandardMaterial({ color: 0xff5a64, emissive: 0xe31c37, emissiveIntensity: 2.8 }),
      leftHubMaterial: new THREE.MeshStandardMaterial({ color: 0xff5a64, emissive: 0xe31c37, emissiveIntensity: 2.3 }),
      rightHubMaterial: whiteGlow,
      underglowColor: 0xff344e,
      vehicleType: "sports",
    },
  },
  rally: {
    name: "Rally Car",
    topSpeed: 180 / 3.6,
    acceleration: 24,
    handling: 0.88,
    hillTraction: 0.48,
    hillSpeedLimit: 21,
    appearance: {
      bodyColor: 0x142c38,
      topColor: 0x1d5364,
      glassColor: 0x61edff,
      frontMaterial: whiteGlow,
      rearMaterial: cyan,
      leftHubMaterial: cyan,
      rightHubMaterial: whiteGlow,
      underglowColor: 0x16e6ff,
      vehicleType: "rally",
    },
  },
  truck: {
    name: "Heavy Truck",
    topSpeed: 130 / 3.6,
    acceleration: 34,
    handling: 0.72,
    hillTraction: 0.82,
    hillSpeedLimit: 32,
    appearance: {
      bodyColor: 0x76501a,
      topColor: 0xd39327,
      glassColor: 0xffdf8a,
      frontMaterial: whiteGlow,
      rearMaterial: new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xd88612, emissiveIntensity: 2.5 }),
      leftHubMaterial: new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xd88612, emissiveIntensity: 2 }),
      rightHubMaterial: whiteGlow,
      underglowColor: 0xffb52e,
      vehicleType: "truck",
    },
  },
};
let selectedVehicleId = "rally";
let car = createCar(vehicleCatalog[selectedVehicleId].appearance);
const opponents = [
  {
    car: createCar({
      bodyColor: 0x35162d,
      topColor: 0x64224f,
      glassColor: 0xff70ce,
      frontMaterial: whiteGlow,
      rearMaterial: pink,
      leftHubMaterial: pink,
      rightHubMaterial: whiteGlow,
      underglowColor: 0xff2fae,
    }),
    startProgress: -0.25,
    progress: -0.25,
    laneOffset: -4.5,
    speed: 31,
    finished: false,
    finishTime: null,
  },
  {
    car: createCar({
      bodyColor: 0x142c38,
      topColor: 0x1d5364,
      glassColor: 0x61edff,
      frontMaterial: whiteGlow,
      rearMaterial: cyan,
      leftHubMaterial: cyan,
      rightHubMaterial: whiteGlow,
      underglowColor: 0x16e6ff,
    }),
    startProgress: -0.52,
    progress: -0.52,
    laneOffset: 4.5,
    speed: 36,
    finished: false,
    finishTime: null,
  },
  {
    car: createCar({
      bodyColor: 0x241936,
      topColor: 0x48306a,
      glassColor: 0xbba0ff,
      frontMaterial: whiteGlow,
      rearMaterial: new THREE.MeshStandardMaterial({
        color: 0x9b72ff,
        emissive: 0x6429ff,
        emissiveIntensity: 2.1,
        roughness: 0.35,
      }),
      leftHubMaterial: whiteGlow,
      rightHubMaterial: pink,
      underglowColor: 0x9155ff,
    }),
    startProgress: -0.79,
    progress: -0.79,
    laneOffset: 0,
    speed: 42,
    finished: false,
    finishTime: null,
  },
];

const clock = new THREE.Clock();
const keys = new Set();
const carState = { speed: 0, heading: -Math.PI / 2 };
let audioContext;
let engineOscillator;
let engineHarmonic;
let engineGain;
let engineHarmonicGain;
const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const forward = new THREE.Vector3();
const lapDisplay = document.querySelector("#lap");
const positionDisplay = document.querySelector("#position");
const vehicleCards = document.querySelectorAll(".vehicle-card");
let previousLapAngle = -Math.PI / 2;
let currentLap = 1;
let totalAngle = 0;
let raceState = "ready";
let pausedRaceState = "racing";
let countdownRemaining = 3;
let lastCountdownNumber = 3;
let goRemaining = 0;
let raceTime = 0;
let lapStartedAt = 0;
let bestLapTime = Infinity;
let leaderboardRequestId = 0;
let gameMode = "circuit";
let hillProgress = 0;
let hillLaneOffset = 0;
let checkpointCount = 0;
let checkpointTimer = 20;
let checkpointTarget = 0.28;
let activeGhostRecord = null;
let ghostCar = null;
let runPath = [];
let pathSampleRemaining = 0;

function positionCheckpointGate() {
  const angle = startAngle + checkpointTarget;
  checkpointGate.position.copy(makeOvalPoint(angle, 0, 0));
  checkpointGate.position.y = 0;
  checkpointGate.rotation.y = Math.atan2(-radiusX * Math.sin(angle), radiusZ * Math.cos(angle));
}

function setGhostLabel(record) {
  const showGhostLabel = gameMode === "ghost" || Boolean(record);
  ghostLabel.hidden = !showGhostLabel;
  if (record) {
    ghostTimeDisplay.textContent = formatTime(record.bestTime);
  } else {
    ghostTimeDisplay.textContent = gameMode === "ghost" ? "FIRST RUN" : "--:--.--";
  }
}

function setCarAtStart() {
  if (gameMode === "hill") {
    const tangent = hillCurve.getTangentAt(0);
    car.position.copy(hillRoadPoint(0, hillLaneOffset));
    carState.heading = Math.atan2(-tangent.x, -tangent.z);
    car.rotation.set(Math.asin(THREE.MathUtils.clamp(tangent.y, -1, 1)), carState.heading, 0);
    return;
  }
  car.position.set(0, 0, -radiusZ);
  carState.heading = -Math.PI / 2;
  car.rotation.set(0, carState.heading, 0);
}

function setGameMode(mode) {
  if (!["circuit", "hill", "ghost", "checkpoint"].includes(mode) || raceState !== "ready") return;
  gameMode = mode;
  const climbing = mode === "hill";
  const checkpointRush = mode === "checkpoint";
  const ghostRide = mode === "ghost";
  circuitWorld.visible = !climbing;
  hillWorld.visible = climbing;
  grid.visible = !climbing;
  for (const opponent of opponents) opponent.car.visible = !climbing && !ghostRide && !checkpointRush;
  lapCard.hidden = climbing || checkpointRush;
  positionCard.hidden = climbing || checkpointRush || ghostRide;
  hillProgressCard.hidden = !climbing;
  checkpointCard.hidden = !checkpointRush;
  checkpointGate.visible = checkpointRush;
  modeStatus.textContent = climbing ? "HILL CLIMB" : ghostRide ? "GHOST RIDE" : checkpointRush ? "CHECKPOINT RUSH" : "CIRCUIT RACE";
  trackStatus.textContent = climbing ? "SUMMIT RUN" : checkpointRush ? "TIME ATTACK" : ghostRide ? "PERSONAL BEST" : "TRACK 01";
  trackName.textContent = climbing ? "MOUNTAIN ASCENT" : checkpointRush ? "CHECKPOINT COURSE" : ghostRide ? "GHOST CIRCUIT" : "NIGHT CIRCUIT";
  trackCoordinate.textContent = climbing ? `${Math.round(hillLength)} M CLIMB` : "35° 41' N — 139° 41' E";
  timerLabel.textContent = climbing ? "CLIMB TIME" : checkpointRush ? "TIME LEFT" : "RACE TIME";
  steerHint.textContent = climbing ? "Move across the road as you climb" : "Guide your car around the circuit";
  startIntro.textContent = climbing
    ? "Climb the winding mountain road. Heavy vehicles have the torque to conquer steep grades."
    : checkpointRush
      ? "Reach each glowing gate before time runs out. Every checkpoint adds five seconds."
      : ghostRide
        ? "Race your personal best ghost around the circuit. Your best run is saved for next time."
        : "Pick a machine for three laps of the circuit.";
  startButtonText.nodeValue = climbing ? "START CLIMB " : checkpointRush ? "START RUSH " : ghostRide ? "START GHOST RIDE " : "START RACE ";
  for (const card of modeCards) {
    const selected = card.dataset.mode === mode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  }
  hillProgress = 0;
  hillLaneOffset = 0;
  activeGhostRecord = null;
  checkpointCount = 0;
  checkpointTimer = 20;
  checkpointTarget = 0.28;
  positionCheckpointGate();
  hillProgressDisplay.textContent = "0";
  hillProgressFill.style.width = "0%";
  checkpointTimeDisplay.textContent = "20";
  checkpointCountDisplay.textContent = "0";
  setGhostLabel(activeGhostRecord);
  setCarAtStart();
}

function selectVehicle(vehicleId) {
  const vehicle = vehicleCatalog[vehicleId];
  if (!vehicle || raceState !== "ready") return;
  selectedVehicleId = vehicleId;
  activeGhostRecord = null;
  setGhostLabel(null);
  scene.remove(car);
  car = createCar(vehicle.appearance);
  setCarAtStart();
  carState.speed = 0;
  for (const card of vehicleCards) {
    const selected = card.dataset.vehicle === vehicleId;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  }
}

function resetCar() {
  leaderboardRequestId += 1;
  if (audioContext) {
    engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
    engineHarmonicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
  }
  hillProgress = 0;
  hillLaneOffset = 0;
  checkpointCount = 0;
  checkpointTimer = 20;
  checkpointTarget = 0.28;
  runPath = [];
  pathSampleRemaining = 0;
  setCarAtStart();
  carState.speed = 0;
  camera.position.copy(car.position).add(new THREE.Vector3(0, 8, gameMode === "hill" ? 12 : 19));
  camera.lookAt(car.position);
  for (const opponent of opponents) {
    opponent.progress = opponent.startProgress;
    opponent.finished = false;
    opponent.finishTime = null;
    updateOpponentPose(opponent);
  }
  currentLap = 1;
  totalAngle = 0;
  previousLapAngle = -Math.PI / 2;
  raceTime = 0;
  lapStartedAt = 0;
  bestLapTime = Infinity;
  countdownRemaining = 3;
  lastCountdownNumber = 3;
  goRemaining = 0;
  raceState = "countdown";
  lapDisplay.textContent = "01";
  hillProgressDisplay.textContent = "0";
  hillProgressFill.style.width = "0%";
  checkpointTimeDisplay.textContent = "20";
  checkpointCountDisplay.textContent = "0";
  positionCheckpointGate();
  timerDisplay.textContent = "00:00.00";
  countdownDisplay.textContent = "3";
  countdownDisplay.classList.remove("go");
  countdownDisplay.hidden = false;
  if (audioContext) playTone(520, 0.18);
  finishScreen.hidden = true;
  pauseScreen.hidden = true;
  leaderboardForm.hidden = false;
  leaderboardForm.reset();
  leaderboardSubmitButton.disabled = false;
  leaderboardError.hidden = true;
  leaderboardSection.hidden = true;
  finishCheckpoints.hidden = true;
  runMessage.hidden = true;
  if (ghostCar) ghostCar.visible = false;
  keys.clear();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (raceState === "paused") resumeRace();
    else if (startScreen.hidden && finishScreen.hidden) pauseRace();
    return;
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }
  keys.add(event.key.toLowerCase());
  if (event.key.startsWith("Arrow")) keys.add(event.key.toLowerCase());
});
document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
document.querySelector("#reset-button").addEventListener("click", () => {
  if (startScreen.hidden) resetCar();
});
document.querySelector("#finish-restart").addEventListener("click", resetCar);
startButton.addEventListener("click", startRace);
for (const card of modeCards) {
  card.addEventListener("click", () => setGameMode(card.dataset.mode));
}
for (const card of vehicleCards) {
  card.addEventListener("click", () => selectVehicle(card.dataset.vehicle));
}

function initializeAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
    engineOscillator = audioContext.createOscillator();
    engineHarmonic = audioContext.createOscillator();
    const engineFilter = audioContext.createBiquadFilter();
    const harmonicFilter = audioContext.createBiquadFilter();
    engineGain = audioContext.createGain();
    engineHarmonicGain = audioContext.createGain();
    engineOscillator.type = "sawtooth";
    engineHarmonic.type = "triangle";
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 440;
    harmonicFilter.type = "lowpass";
    harmonicFilter.frequency.value = 900;
    engineGain.gain.value = 0;
    engineHarmonicGain.gain.value = 0;
    engineOscillator.connect(engineFilter);
    engineHarmonic.connect(harmonicFilter);
    engineFilter.connect(engineGain);
    harmonicFilter.connect(engineHarmonicGain);
    engineGain.connect(audioContext.destination);
    engineHarmonicGain.connect(audioContext.destination);
    engineOscillator.start();
    engineHarmonic.start();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playTone(frequency, duration, type = "triangle") {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function createGhostCar(vehicle) {
  if (ghostCar) scene.remove(ghostCar);
  ghostCar = createCar(vehicle.appearance);
  ghostCar.traverse((part) => {
    if (part.isPointLight) {
      part.visible = false;
    } else if (part.material) {
      part.material = part.material.clone();
      part.material.transparent = true;
      part.material.opacity = 0.32;
      part.material.depthWrite = false;
      if (part.material.emissive) {
        part.material.emissive.set(0x5dbccc);
        part.material.emissiveIntensity = 0.4;
      }
    }
  });
  ghostCar.visible = false;
}

async function startRace() {
  initializeAudio();
  startButton.disabled = true;
  for (const card of modeCards) card.disabled = true;
  for (const card of vehicleCards) card.disabled = true;
  runMessage.hidden = true;
  try {
    const response = await fetch(`/api/records?mode=${encodeURIComponent(gameMode)}&vehicle=${encodeURIComponent(selectedVehicleId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load your saved runs.");
    activeGhostRecord = result.records.find((record) =>
      record.mode === gameMode && record.vehicle === selectedVehicleId
    ) || null;
    createGhostCar(vehicleCatalog[selectedVehicleId]);
    setGhostLabel(activeGhostRecord);
  } catch (error) {
    runMessage.textContent = error.message;
    runMessage.hidden = false;
    startButton.disabled = false;
    for (const card of modeCards) card.disabled = false;
    for (const card of vehicleCards) card.disabled = false;
    return;
  }
  resetCar();
  raceState = "countdown";
  countdownDisplay.hidden = false;
  startScreen.hidden = true;
  startButton.disabled = false;
  for (const card of modeCards) card.disabled = false;
  for (const card of vehicleCards) card.disabled = false;
}

function showMenuView(view) {
  for (const menuView of menuViews) menuView.hidden = menuView !== view;
  startScreen.setAttribute("aria-labelledby", view.getAttribute("aria-labelledby"));
  startScreen.hidden = false;
  pauseScreen.hidden = true;
  finishScreen.hidden = true;
  runMessage.hidden = true;
  startPanel.scrollTop = 0;
}

function returnToMainMenu() {
  if (audioContext) {
    engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
    engineHarmonicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
  }
  raceState = "ready";
  carState.speed = 0;
  countdownDisplay.hidden = true;
  if (ghostCar) ghostCar.visible = false;
  keys.clear();
  showMenuView(mainMenuView);
}

function pauseRace() {
  if (raceState !== "countdown" && raceState !== "go" && raceState !== "racing") return;
  pausedRaceState = raceState;
  raceState = "paused";
  keys.clear();
  if (audioContext) {
    engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
    engineHarmonicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
  }
  pauseScreen.hidden = false;
  resumeButton.focus();
}

function resumeRace() {
  if (raceState !== "paused") return;
  raceState = pausedRaceState;
  pauseScreen.hidden = true;
  countdownDisplay.hidden = raceState === "racing";
  if (audioContext && raceState === "racing") {
    engineGain.gain.setTargetAtTime(0.035, audioContext.currentTime, 0.12);
    engineHarmonicGain.gain.setTargetAtTime(0.014, audioContext.currentTime, 0.12);
  }
}

async function showLeaderboard() {
  showMenuView(leaderboardMenuView);
  recordsRows.replaceChildren();
  recordsError.hidden = true;
  try {
    const response = await fetch("/api/records");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load the leaderboard.");
    const modeNames = {
      circuit: "Circuit Race",
      hill: "Hill Climb",
      ghost: "Ghost Ride",
      checkpoint: "Checkpoint Rush",
    };
    for (const record of result.records) {
      const row = document.createElement("tr");
      const modeCell = document.createElement("td");
      const vehicleCell = document.createElement("td");
      const timeCell = document.createElement("td");
      const scoreCell = document.createElement("td");
      modeCell.textContent = modeNames[record.mode] || record.mode;
      vehicleCell.textContent = vehicleCatalog[record.vehicle]?.name || record.vehicle;
      timeCell.textContent = formatTime(record.bestTime);
      scoreCell.textContent = record.bestScore ? String(record.bestScore) : "—";
      row.append(modeCell, vehicleCell, timeCell, scoreCell);
      recordsRows.append(row);
    }
    if (!result.records.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "Finish a run to set a personal best.";
      row.append(cell);
      recordsRows.append(row);
    }
  } catch (error) {
    recordsError.textContent = error.message;
    recordsError.hidden = false;
  }
}

playButton.addEventListener("click", () => showMenuView(modeSelectView));
controlsButton.addEventListener("click", () => showMenuView(controlsMenuView));
leaderboardButton.addEventListener("click", showLeaderboard);
recordsBackButton.addEventListener("click", () => showMenuView(mainMenuView));
controlsBackButton.addEventListener("click", () => showMenuView(mainMenuView));
modeBackButton.addEventListener("click", () => showMenuView(mainMenuView));
modeNextButton.addEventListener("click", () => showMenuView(vehicleSelectView));
vehicleBackButton.addEventListener("click", () => showMenuView(modeSelectView));
resumeButton.addEventListener("click", resumeRace);
pauseRestartButton.addEventListener("click", () => {
  pauseScreen.hidden = true;
  resetCar();
});
pauseMainMenuButton.addEventListener("click", returnToMainMenu);

leaderboardForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const requestId = leaderboardRequestId;
  const name = leaderboardNameInput.value.trim();
  leaderboardSubmitButton.disabled = true;
  leaderboardError.hidden = true;

  try {
    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bestLapTime }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save your lap.");
    if (requestId !== leaderboardRequestId) return;

    leaderboardRows.replaceChildren();
    for (const [index, entry] of result.entries.entries()) {
      const row = document.createElement("tr");
      const placeCell = document.createElement("td");
      const nameCell = document.createElement("td");
      const timeCell = document.createElement("td");
      placeCell.textContent = String(index + 1).padStart(2, "0");
      nameCell.textContent = entry.name;
      timeCell.textContent = formatTime(entry.bestLapTime);
      row.append(placeCell, nameCell, timeCell);
      leaderboardRows.append(row);
    }
    leaderboardSection.hidden = false;
    leaderboardForm.hidden = true;
  } catch (error) {
    if (requestId !== leaderboardRequestId) return;
    leaderboardError.textContent = error.message;
    leaderboardError.hidden = false;
    leaderboardSubmitButton.disabled = false;
  }
});

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const hundredths = Math.floor((time % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

function updateRaceState(deltaTime) {
  if (raceState === "countdown") {
    countdownRemaining -= deltaTime;
    const countdownNumber = Math.ceil(countdownRemaining);
    if (countdownNumber > 0) {
      countdownDisplay.textContent = String(countdownNumber);
      if (countdownNumber < lastCountdownNumber) {
        playTone(520, 0.18);
        lastCountdownNumber = countdownNumber;
      }
    } else {
      raceState = "go";
      goRemaining = 0.55;
      countdownDisplay.textContent = "GO!";
      countdownDisplay.classList.add("go");
      playTone(880, 0.38, "sawtooth");
    }
  } else if (raceState === "go") {
    goRemaining -= deltaTime;
    if (goRemaining <= 0) {
      raceState = "racing";
      countdownDisplay.hidden = true;
      engineGain.gain.setTargetAtTime(0.035, audioContext.currentTime, 0.12);
      engineHarmonicGain.gain.setTargetAtTime(0.014, audioContext.currentTime, 0.12);
    }
  } else if (raceState === "racing") {
    raceTime += deltaTime;
    if (gameMode === "checkpoint") {
      checkpointTimer -= deltaTime;
      checkpointTimeDisplay.textContent = String(Math.ceil(Math.max(0, checkpointTimer)));
      timerDisplay.textContent = formatTime(Math.max(0, checkpointTimer));
      if (checkpointTimer <= 0) {
        checkpointTimer = 0;
        checkpointTimeDisplay.textContent = "0";
        timerDisplay.textContent = formatTime(0);
        finishRace();
      }
    } else {
      timerDisplay.textContent = formatTime(raceTime);
    }
  }
}

function finishRace() {
  if (raceState === "finished") return;
  raceState = "finished";
  carState.speed = 0;
  engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.12);
  engineHarmonicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.12);
  const finalTime = formatTime(raceTime);
  timerDisplay.textContent = finalTime;
  finishTimeDisplay.textContent = finalTime;
  const climbing = gameMode === "hill";
  const checkpointRush = gameMode === "checkpoint";
  const ghostRide = gameMode === "ghost";
  finishKicker.textContent = climbing ? "SUMMIT CONQUERED" : checkpointRush ? "RUSH COMPLETE" : ghostRide ? "GHOST RUN COMPLETE" : "CIRCUIT COMPLETE";
  finishTitle.firstChild.nodeValue = climbing ? "SUMMIT " : checkpointRush ? "CHECKPOINT " : "RACE ";
  finishTitle.querySelector("span").textContent = climbing ? "REACHED" : checkpointRush ? "RUSH" : "FINISHED";
  finishLaps.hidden = checkpointRush;
  finishLaps.textContent = climbing ? "YOU MADE IT TO THE TOP" : "ALL 3 LAPS COMPLETE";
  finishPlace.hidden = climbing || checkpointRush || ghostRide;
  finishTimeLabel.textContent = climbing ? "CLIMB TIME" : checkpointRush ? "CHECKPOINTS REACHED" : "TOTAL TIME";
  finishBestLabel.hidden = climbing || checkpointRush;
  finishBestLapDisplay.hidden = climbing || checkpointRush;
  leaderboardForm.hidden = climbing || checkpointRush;
  finishRestartText.nodeValue = climbing ? "CLIMB AGAIN " : checkpointRush ? "RUSH AGAIN " : ghostRide ? "GHOST RIDE AGAIN " : "RACE AGAIN ";
  finishCheckpoints.hidden = !checkpointRush;
  finishCheckpoints.textContent = `CHECKPOINTS REACHED: ${checkpointCount}`;
  if (checkpointRush) {
    finishTimeDisplay.textContent = String(checkpointCount);
  }
  leaderboardSection.hidden = true;
  if (!climbing && !checkpointRush && !ghostRide) {
    finishBestLapDisplay.textContent = formatTime(bestLapTime);
    updatePosition();
    finishPlace.textContent = `${positionDisplay.textContent} PLACE`;
  }
  finishScreen.hidden = false;
  if (!climbing && !checkpointRush) leaderboardNameInput.focus();
  saveRunRecord();
}

function updateOpponentPose(opponent) {
  const angle = startAngle + opponent.progress;
  opponent.car.position.copy(makeOvalPoint(angle, opponent.laneOffset));
  const tangentX = -radiusX * Math.sin(angle);
  const tangentZ = radiusZ * Math.cos(angle);
  opponent.car.rotation.y = Math.atan2(-tangentX, -tangentZ);
}

for (const opponent of opponents) updateOpponentPose(opponent);

function getPlayerProgress() {
  if (raceState === "finished") return Math.PI * 6;
  return (currentLap - 1) * Math.PI * 2 + totalAngle;
}

function getPlace(position) {
  const remainder = position % 100;
  if (remainder >= 11 && remainder <= 13) return `${position}TH`;
  if (position % 10 === 1) return `${position}ST`;
  if (position % 10 === 2) return `${position}ND`;
  if (position % 10 === 3) return `${position}RD`;
  return `${position}TH`;
}

function updatePosition() {
  const playerProgress = getPlayerProgress();
  const carsAhead = opponents.filter((opponent) =>
    opponent.progress > playerProgress
    || (raceState === "finished" && opponent.finished && opponent.finishTime < raceTime),
  ).length;
  positionDisplay.textContent = getPlace(carsAhead + 1);
}

function updateOpponents(deltaTime) {
  for (const opponent of opponents) {
    if (opponent.finished) continue;
    const angle = startAngle + opponent.progress;
    const tangentLength = Math.hypot(radiusX * Math.sin(angle), radiusZ * Math.cos(angle));
    opponent.progress += (opponent.speed / tangentLength) * deltaTime;
    if (opponent.progress >= Math.PI * 6) {
      opponent.progress = Math.PI * 6;
      opponent.finished = true;
      opponent.finishTime = raceTime;
    }
    updateOpponentPose(opponent);
  }
}

function updateLap() {
  const angle = Math.atan2(car.position.z / radiusZ, car.position.x / radiusX);
  let delta = angle - previousLapAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) < 0.45 && Math.sign(delta) === Math.sign(carState.speed || 1)) {
    totalAngle += delta;
    if (totalAngle >= Math.PI * 2) {
      totalAngle -= Math.PI * 2;
      const lapTime = raceTime - lapStartedAt;
      bestLapTime = Math.min(bestLapTime, lapTime);
      lapStartedAt = raceTime;
      if (currentLap === 3) {
        finishRace();
      } else {
        currentLap += 1;
        lapDisplay.textContent = String(currentLap).padStart(2, "0");
      }
    }
  }
  previousLapAngle = angle;
}

function updateCheckpointRush() {
  const angle = Math.atan2(car.position.z / radiusZ, car.position.x / radiusX);
  let delta = angle - previousLapAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) < 0.45 && Math.sign(delta) === Math.sign(carState.speed || 1)) {
    totalAngle += delta;
    if (totalAngle >= checkpointTarget) {
      checkpointCount += 1;
      checkpointTimer += 5;
      checkpointCountDisplay.textContent = String(checkpointCount);
      checkpointTimeDisplay.textContent = String(Math.ceil(checkpointTimer));
      checkpointTarget += (Math.PI * 2) / 16;
      positionCheckpointGate();
      playTone(640, 0.2);
    }
  }
  previousLapAngle = angle;
}

function sampleRunPath(deltaTime) {
  if (raceState !== "racing") return;
  pathSampleRemaining -= deltaTime;
  if (pathSampleRemaining > 0) return;
  pathSampleRemaining = 0.2;
  if (runPath.length >= 1800) return;
  runPath.push({
    x: Number(car.position.x.toFixed(2)),
    y: Number(car.position.y.toFixed(2)),
    z: Number(car.position.z.toFixed(2)),
    heading: Number(carState.heading.toFixed(3)),
  });
}

async function saveRunRecord() {
  if (runPath.length < 2) return;
  const path = [...runPath];
  const score = gameMode === "checkpoint" ? checkpointCount : 0;
  try {
    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: gameMode,
        vehicle: selectedVehicleId,
        time: raceTime,
        score,
        path,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save your run.");
    activeGhostRecord = result.record;
    setGhostLabel(activeGhostRecord);
    runMessage.textContent = result.improvedTime
      ? `New best ${formatTime(result.record.bestTime)} saved for ${vehicleCatalog[selectedVehicleId].name}.`
      : gameMode === "checkpoint" && result.improvedScore
        ? `New checkpoint best: ${result.record.bestScore} gates.`
        : "Run saved.";
    runMessage.hidden = false;
  } catch (error) {
    runMessage.textContent = error.message;
    runMessage.hidden = false;
  }
}

function updateGhost() {
  if (!ghostCar || !activeGhostRecord || !activeGhostRecord.path || raceState !== "racing") return;
  const points = activeGhostRecord.path;
  if (points.length < 2) return;
  const progress = THREE.MathUtils.clamp(raceTime / activeGhostRecord.bestTime, 0, 1) * (points.length - 1);
  const firstIndex = Math.floor(progress);
  const secondIndex = Math.min(firstIndex + 1, points.length - 1);
  const fraction = progress - firstIndex;
  const first = points[firstIndex];
  const second = points[secondIndex];
  ghostCar.position.set(
    THREE.MathUtils.lerp(first.x, second.x, fraction),
    THREE.MathUtils.lerp(first.y, second.y, fraction),
    THREE.MathUtils.lerp(first.z, second.z, fraction),
  );
  const headingDelta = Math.atan2(Math.sin(second.heading - first.heading), Math.cos(second.heading - first.heading));
  ghostCar.rotation.y = first.heading + headingDelta * fraction;
  ghostCar.visible = true;
}

function update(deltaTime) {
  updateRaceState(deltaTime);
  if (raceState === "paused") return;
  const racing = raceState === "racing";
  const throttle = keys.has("arrowup") || keys.has("w");
  const brake = keys.has("arrowdown") || keys.has("s");
  const left = keys.has("arrowleft") || keys.has("a");
  const right = keys.has("arrowright") || keys.has("d");
  const steering = racing ? Number(right) - Number(left) : 0;
  const vehicle = vehicleCatalog[selectedVehicleId];
  let maxSpeed = vehicle.topSpeed;

  if (gameMode === "hill") {
    maxSpeed = vehicle.hillSpeedLimit;
    const slope = Math.asin(THREE.MathUtils.clamp(hillCurve.getTangentAt(hillProgress / hillLength).y, -1, 1));
    if (racing && throttle) {
      carState.speed += (vehicle.acceleration * vehicle.hillTraction - 9.81 * Math.sin(slope)) * deltaTime;
    } else if (racing && brake) {
      carState.speed -= 32 * deltaTime;
    } else if (racing) {
      carState.speed -= (9.81 * Math.sin(slope) + 1.1) * deltaTime;
    } else {
      carState.speed = 0;
    }
    carState.speed = THREE.MathUtils.clamp(carState.speed, 0, maxSpeed);
    hillLaneOffset = THREE.MathUtils.clamp(hillLaneOffset + steering * 7 * deltaTime, -5.3, 5.3);
    if (racing) {
      hillProgress = Math.min(hillLength, hillProgress + carState.speed * deltaTime);
      const progressPercent = Math.floor((hillProgress / hillLength) * 100);
      hillProgressDisplay.textContent = String(progressPercent);
      hillProgressFill.style.width = `${progressPercent}%`;
      if (hillProgress >= hillLength) finishRace();
    }
    const progress = Math.min(hillProgress, hillLength - 0.001);
    const tangent = hillCurve.getTangentAt(progress / hillLength);
    const slopeAngle = Math.asin(THREE.MathUtils.clamp(tangent.y, -1, 1));
    forward.copy(tangent);
    car.position.copy(hillRoadPoint(progress, hillLaneOffset));
    carState.heading = Math.atan2(-tangent.x, -tangent.z);
    const steeringStrength = THREE.MathUtils.clamp(carState.speed / 9, 0, 1);
    car.rotation.set(slopeAngle, carState.heading, -steering * steeringStrength * 0.045);
  } else {
    if (racing && throttle) carState.speed += vehicle.acceleration * deltaTime;
    else if (racing && brake) carState.speed -= 37 * deltaTime;
    else carState.speed *= Math.exp(-0.85 * deltaTime);
    carState.speed = THREE.MathUtils.clamp(carState.speed, -15, maxSpeed);
    if (!racing || (Math.abs(carState.speed) < 0.08 && !throttle && !brake)) carState.speed = 0;

    const steeringStrength = THREE.MathUtils.clamp(Math.abs(carState.speed) / 9, 0, 1);
    carState.heading -= steering * steeringStrength * vehicle.handling * 1.8 * deltaTime * Math.sign(carState.speed || 1);
    forward.set(-Math.sin(carState.heading), 0, -Math.cos(carState.heading));
    car.position.addScaledVector(forward, carState.speed * deltaTime);
    car.rotation.y = carState.heading;
    car.rotation.z = -steering * steeringStrength * 0.045;
    car.rotation.x = Math.sin(clock.elapsedTime * 2.4) * Math.min(Math.abs(carState.speed) / maxSpeed, 1) * 0.008;
  }

  const speed = Math.round(Math.abs(carState.speed) * 3.6);
  speedDisplay.textContent = String(speed).padStart(3, "0");
  const speedFraction = THREE.MathUtils.clamp(speed / 190, 0, 1);
  speedometerFill.style.strokeDashoffset = String(188.5 * (1 - speedFraction));
  speedometerNeedle.setAttribute("transform", `rotate(${-90 + speedFraction * 180} 75 75)`);
  if (raceState === "racing") {
    const enginePitch = 68 + speedFraction * 110 + (throttle ? 12 : 0);
    engineOscillator.frequency.setTargetAtTime(enginePitch, audioContext.currentTime, 0.08);
    engineHarmonic.frequency.setTargetAtTime(enginePitch * 2.02, audioContext.currentTime, 0.08);
    engineGain.gain.setTargetAtTime(0.035 + speedFraction * 0.025 + (throttle ? 0.015 : 0), audioContext.currentTime, 0.12);
    engineHarmonicGain.gain.setTargetAtTime(0.012 + speedFraction * 0.01, audioContext.currentTime, 0.12);
  }
  if (racing && (gameMode === "circuit" || gameMode === "ghost")) updateLap();
  if (racing && gameMode === "checkpoint") updateCheckpointRush();
  if (gameMode === "circuit" && (raceState === "racing" || raceState === "finished")) updateOpponents(deltaTime);
  if (gameMode === "circuit") updatePosition();
  sampleRunPath(deltaTime);
  updateGhost();

  cameraTarget.copy(car.position);
  cameraTarget.y += gameMode === "hill" ? 2.2 : 1.5;
  cameraDesired.copy(car.position).addScaledVector(forward, gameMode === "hill" ? -15 : -11);
  cameraDesired.y += gameMode === "hill" ? 8 : 6.8;
  camera.position.lerp(cameraDesired, 1 - Math.exp(-4.2 * deltaTime));
  camera.lookAt(cameraTarget);
}

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  update(deltaTime);
  composer.render();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

loading.classList.add("hidden");
setTimeout(() => loading.remove(), 400);
animate();

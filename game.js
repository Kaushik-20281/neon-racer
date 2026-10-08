import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const container = document.querySelector("#game");
const speedDisplay = document.querySelector("#speed");
const loading = document.querySelector("#loading");
const loadingLabel = document.querySelector("#loading-label");
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
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb9d5);
let environmentRoot = null;
let environmentWorld = null;
let activeTheme = null;
let environmentColliders = [];
let environmentBounds = null;
let warmWhiteMaterial;
let sidewalkMaterial;
let curbMaterial;
let checkpointGate = null;

const camera = new THREE.PerspectiveCamera(57, window.innerWidth / window.innerHeight, 0.1, 1400);
camera.position.set(0, 9, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
container.appendChild(renderer.domElement);

const centerX = 0;
const centerZ = 0;
const radiusX = 62;
const radiusZ = 40;
const trackWidth = 16;
const trackSamples = 320;
const bridgeHeight = 8;
const bridgeRampHalfAngle = 0.56;
const lapCheckpointCount = 8;
const checkpointSpacing = 45;
const carCollisionRadius = 2.6;
const cityGroundHeight = -0.18;

function addCircleCollider(point, radius, minY = point.y, maxY = point.y + 10) {
  environmentColliders.push({
    type: "circle",
    x: point.x,
    z: point.z,
    radius,
    minY,
    maxY,
  });
}

function addBoxCollider(point, halfWidth, halfDepth, yaw = 0, minY = point.y, maxY = point.y + 10) {
  environmentColliders.push({
    type: "box",
    x: point.x,
    z: point.z,
    halfWidth,
    halfDepth,
    yaw,
    minY,
    maxY,
  });
}

function addCapsuleCollider(start, end, radius, minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y) + 2) {
  environmentColliders.push({
    type: "capsule",
    startX: start.x,
    startZ: start.z,
    endX: end.x,
    endZ: end.z,
    radius,
    minY,
    maxY,
  });
}

function isPositionBlocked(x, z, y, radius = carCollisionRadius) {
  if (
    !environmentBounds
    || x < environmentBounds.minX + radius
    || x > environmentBounds.maxX - radius
    || z < environmentBounds.minZ + radius
    || z > environmentBounds.maxZ - radius
  ) return true;

  for (const collider of environmentColliders) {
    if (y + 1.4 < collider.minY || y > collider.maxY) continue;
    if (collider.type === "circle") {
      if (Math.hypot(x - collider.x, z - collider.z) < collider.radius + radius) return true;
    } else if (collider.type === "box") {
      const offsetX = x - collider.x;
      const offsetZ = z - collider.z;
      const localX = offsetX * Math.cos(collider.yaw) - offsetZ * Math.sin(collider.yaw);
      const localZ = offsetX * Math.sin(collider.yaw) + offsetZ * Math.cos(collider.yaw);
      if (
        Math.abs(localX) < collider.halfWidth + radius
        && Math.abs(localZ) < collider.halfDepth + radius
      ) return true;
    } else {
      const segmentX = collider.endX - collider.startX;
      const segmentZ = collider.endZ - collider.startZ;
      const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
      const projection = segmentLengthSquared === 0
        ? 0
        : THREE.MathUtils.clamp(
          ((x - collider.startX) * segmentX + (z - collider.startZ) * segmentZ) / segmentLengthSquared,
          0,
          1,
        );
      const closestX = collider.startX + segmentX * projection;
      const closestZ = collider.startZ + segmentZ * projection;
      if (Math.hypot(x - closestX, z - closestZ) < collider.radius + radius) return true;
    }
  }
  return false;
}

function isInsideEnvironmentBounds(point, radius = 0) {
  return environmentBounds
    && point.x >= environmentBounds.minX + radius
    && point.x <= environmentBounds.maxX - radius
    && point.z >= environmentBounds.minZ + radius
    && point.z <= environmentBounds.maxZ - radius;
}

function isPathBlocked(start, end, getHeight, radius = carCollisionRadius) {
  const distance = Math.hypot(end.x - start.x, end.z - start.z);
  const steps = Math.max(1, Math.ceil(distance / 0.55));
  for (let i = 1; i <= steps; i += 1) {
    const fraction = i / steps;
    const x = THREE.MathUtils.lerp(start.x, end.x, fraction);
    const z = THREE.MathUtils.lerp(start.z, end.z, fraction);
    const y = getHeight(x, z, fraction);
    if (isPositionBlocked(x, z, y, radius)) return true;
  }
  return false;
}

function isCityPathBlocked(start, end, radius = carCollisionRadius) {
  return isPathBlocked(start, end, (x, z, fraction) => {
    const referenceY = THREE.MathUtils.lerp(start.y, end.y, fraction);
    const roadPosition = getCityRoadPosition(x, z, referenceY);
    return roadPosition.distance <= trackWidth + 2 ? roadPosition.point.y : 0;
  }, radius);
}

function moveCarWithCollisions(movingCar, deltaX, deltaZ, getHeight, radius = carCollisionRadius) {
  const steps = Math.max(1, Math.ceil(Math.hypot(deltaX, deltaZ) / 0.55));
  const stepX = deltaX / steps;
  const stepZ = deltaZ / steps;
  let collided = false;
  for (let i = 0; i < steps; i += 1) {
    const nextX = movingCar.position.x + stepX;
    const nextZ = movingCar.position.z + stepZ;
    if (!isPositionBlocked(nextX, nextZ, getHeight(nextX, nextZ), radius)) {
      movingCar.position.x = nextX;
      movingCar.position.z = nextZ;
      continue;
    }
    collided = true;
    if (!isPositionBlocked(nextX, movingCar.position.z, getHeight(nextX, movingCar.position.z), radius)) {
      movingCar.position.x = nextX;
    }
    if (!isPositionBlocked(movingCar.position.x, nextZ, getHeight(movingCar.position.x, nextZ), radius)) {
      movingCar.position.z = nextZ;
    }
  }
  return collided;
}

const environmentThemes = {
  circuit: {
    sky: 0x70bdf0, fog: 0xb5d9e9, fogNear: 560, fogFar: 1450,
    ground: 0x879477, road: 0x383e42, sidewalk: 0xb8b7ad, curb: 0xd2d0c6,
    sunlight: 0xfff3dc, sunlightIntensity: 2.4, hemisphere: 0xe4f4ff, hemisphereGround: 0x78836c,
    buildings: [0xd5c5a9, 0xb6bec0, 0xc59b83, 0xd7d2c7, 0x9eabb3, 0xc4b6a3],
    windows: 0x718995, trees: [0x53754d, 0x6d895a], accent: 0xe8d477,
  },
  ghost: {
    sky: 0xe8b487, fog: 0xf0d7b9, fogNear: 500, fogFar: 1330,
    ground: 0x8a896d, road: 0x47413e, sidewalk: 0xc3b6a3, curb: 0xd2c4ae,
    sunlight: 0xffd5a1, sunlightIntensity: 2.15, hemisphere: 0xffe7c7, hemisphereGround: 0x77745f,
    buildings: [0xc58b6e, 0xd0b58d, 0x9d9990, 0xd8cbb2, 0xb27c67, 0xc6b29b],
    windows: 0x82909a, trees: [0x66764e, 0x87905a], accent: 0xf1bd66,
  },
  checkpoint: {
    sky: 0xf3bd7d, fog: 0xf4d2a4, fogNear: 600, fogFar: 1500,
    ground: 0xc5a06b, road: 0x45403a, sidewalk: 0xd6bd91, curb: 0xe1cc9d,
    sunlight: 0xffc078, sunlightIntensity: 2.25, hemisphere: 0xffe1b4, hemisphereGround: 0x8a5b3c,
    buildings: [0xb77452, 0xd39a68, 0x985644, 0xc8875e, 0xe0b27b, 0xa65e49],
    windows: 0x806351, trees: [0x244e3a, 0x315e43], accent: 0xffb12e,
    rockColors: [0xa94c37, 0xc46b43],
  },
  hill: {
    sky: 0x9bc9e3, fog: 0xcbd9d4, fogNear: 360, fogFar: 1120,
    ground: 0x687754, road: 0x383e42, sidewalk: 0xb8b7ad, curb: 0xd2d0c6,
    sunlight: 0xfff0d1, sunlightIntensity: 2.2, hemisphere: 0xe3f3ff, hemisphereGround: 0x65734f,
    buildings: [0xd5c5a9, 0xb6bec0, 0xc59b83, 0xd7d2c7, 0x9eabb3, 0xc4b6a3],
    windows: 0x718995, trees: [0x244e3a, 0x315e43], accent: 0xe8d477,
  },
};

function createEnvironment(mode) {
  if (environmentRoot) disposeEnvironment();
  const theme = environmentThemes[mode];
  if (!theme) throw new Error(`No environment is configured for mode "${mode}".`);

  activeTheme = theme;
  environmentColliders = [];
  environmentBounds = mode === "hill" || mode === "checkpoint"
    ? mountainBounds
    : { minX: -180, maxX: 180, minZ: -150, maxZ: 150 };
  environmentRoot = new THREE.Group();
  environmentWorld = new THREE.Group();
  environmentRoot.add(environmentWorld);
  scene.add(environmentRoot);
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1800, 1800),
    new THREE.MeshStandardMaterial({ color: theme.ground, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = mode === "hill" || mode === "checkpoint" ? -1 : cityGroundHeight;
  ground.receiveShadow = true;
  environmentRoot.add(ground);
  environmentRoot.add(new THREE.HemisphereLight(theme.hemisphere, theme.hemisphereGround, 1.55));

  const sunlight = new THREE.DirectionalLight(theme.sunlight, theme.sunlightIntensity);
  sunlight.position.set(-120, 180, 100);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -180;
  sunlight.shadow.camera.right = 180;
  sunlight.shadow.camera.top = 180;
  sunlight.shadow.camera.bottom = -180;
  sunlight.shadow.bias = -0.00025;
  environmentRoot.add(sunlight);
  warmWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf4eee0, roughness: 0.72 });
  sidewalkMaterial = new THREE.MeshStandardMaterial({ color: theme.sidewalk, roughness: 0.96 });
  curbMaterial = new THREE.MeshStandardMaterial({ color: theme.curb, roughness: 0.9 });

  if (mode === "hill" || mode === "checkpoint") {
    buildHillClimb();
  } else {
    makeRoad();
    addCityScenery();
  }
  addEnvironmentClouds(mode);
  if (mode === "hill" || mode === "checkpoint") addMountainFog(mode);
  if (mode === "checkpoint") createCheckpointGate();
}

function disposeObjectResources(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse((object) => {
    if (object.isLight && object.shadow) object.shadow.dispose();
    if (object.geometry) geometries.add(object.geometry);
    if (Array.isArray(object.material)) object.material.forEach((material) => materials.add(material));
    else if (object.material) materials.add(object.material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function disposeEnvironment() {
  if (environmentRoot) {
    scene.remove(environmentRoot);
    disposeObjectResources(environmentRoot);
    environmentRoot.clear();
  }
  environmentRoot = null;
  environmentWorld = null;
  activeTheme = null;
  warmWhiteMaterial = null;
  sidewalkMaterial = null;
  curbMaterial = null;
  checkpointGate = null;
  environmentColliders = [];
  environmentBounds = null;
  mountainTerrainHeights = null;
  scene.background = new THREE.Color(0x8fb9d5);
  scene.fog = null;
}

function trackElevation(angle) {
  const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (Math.abs(wrapped) >= bridgeRampHalfAngle) return 0;
  const ramp = Math.cos((wrapped / bridgeRampHalfAngle) * Math.PI / 2);
  return bridgeHeight * ramp * ramp;
}

function trackTangent(angle) {
  return new THREE.Vector3(
    radiusX * Math.cos(angle),
    0,
    2 * radiusZ * Math.cos(2 * angle),
  );
}

function makeOvalPoint(angle, offset = 0, y = 0) {
  const tangent = trackTangent(angle);
  const normalX = -tangent.z / Math.hypot(tangent.x, tangent.z);
  const normalZ = tangent.x / Math.hypot(tangent.x, tangent.z);
  return new THREE.Vector3(
    centerX + radiusX * Math.sin(angle) + normalX * offset,
    y + trackElevation(angle),
    centerZ + radiusZ * Math.sin(2 * angle) + normalZ * offset,
  );
}

function findNearestTrackAngle(x, z, referenceY) {
  let bestAngle = 0;
  let bestScore = Infinity;
  const step = (Math.PI * 2) / trackSamples;
  for (let i = 0; i < trackSamples; i += 1) {
    const angle = i * step;
    const pointX = centerX + radiusX * Math.sin(angle);
    const pointZ = centerZ + radiusZ * Math.sin(2 * angle);
    const heightDelta = trackElevation(angle) - referenceY;
    const score = (pointX - x) ** 2 + (pointZ - z) ** 2 + heightDelta ** 2 * 4;
    if (score < bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }
  const coarseAngle = bestAngle;
  for (let i = -8; i <= 8; i += 1) {
    const angle = coarseAngle + (i * step) / 8;
    const pointX = centerX + radiusX * Math.sin(angle);
    const pointZ = centerZ + radiusZ * Math.sin(2 * angle);
    const heightDelta = trackElevation(angle) - referenceY;
    const score = (pointX - x) ** 2 + (pointZ - z) ** 2 + heightDelta ** 2 * 4;
    if (score < bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }
  return bestAngle;
}

function getCityRoadPosition(x, z, referenceY) {
  const angle = findNearestTrackAngle(x, z, referenceY);
  const point = makeOvalPoint(angle);
  return {
    angle,
    point,
    distance: Math.hypot(x - point.x, z - point.z),
  };
}

function isCityPlacementClear(point, radius) {
  if (!isInsideEnvironmentBounds(point, radius)) return false;
  const roadClearance = trackWidth / 2 + 5.5 + radius;
  for (let sample = 0; sample < trackSamples * 2; sample += 1) {
    const angle = (sample / (trackSamples * 2)) * Math.PI * 2;
    const roadX = centerX + radiusX * Math.sin(angle);
    const roadZ = centerZ + radiusZ * Math.sin(2 * angle);
    if (Math.hypot(point.x - roadX, point.z - roadZ) < roadClearance) return false;
  }
  return true;
}

function isCityBuildingPlacementClear(point, halfWidth, halfDepth, yaw) {
  if (!isInsideEnvironmentBounds(point)) return false;
  const roadClearance = trackWidth / 2 + 5.5 + 0.5;
  for (let sample = 0; sample < trackSamples * 2; sample += 1) {
    const angle = (sample / (trackSamples * 2)) * Math.PI * 2;
    const offsetX = centerX + radiusX * Math.sin(angle) - point.x;
    const offsetZ = centerZ + radiusZ * Math.sin(2 * angle) - point.z;
    const localX = offsetX * Math.cos(yaw) - offsetZ * Math.sin(yaw);
    const localZ = offsetX * Math.sin(yaw) + offsetZ * Math.cos(yaw);
    const outsideX = Math.max(Math.abs(localX) - halfWidth, 0);
    const outsideZ = Math.max(Math.abs(localZ) - halfDepth, 0);
    if (Math.hypot(outsideX, outsideZ) < roadClearance) return false;
  }
  return true;
}

function makeOvalRibbon(innerOffset, outerOffset, y, material, target) {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= trackSamples; i += 1) {
    const angle = (i / trackSamples) * Math.PI * 2;
    const inner = makeOvalPoint(angle, innerOffset, y);
    const outer = makeOvalPoint(angle, outerOffset, y);
    positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
    if (i < trackSamples) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(
    Array.from({ length: positions.length / 3 }, () => [0, 1, 0]).flat(),
    3,
  ));
  const ribbon = new THREE.Mesh(geometry, material);
  ribbon.receiveShadow = true;
  target.add(ribbon);
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
      color: activeTheme.road,
      roughness: 0.96,
      side: THREE.DoubleSide,
    }),
  );
  road.receiveShadow = true;
  environmentWorld.add(road);

  makeOvalRibbon(-trackWidth / 2 - 5.5, -trackWidth / 2 - 0.8, -0.08, sidewalkMaterial, environmentWorld);
  makeOvalRibbon(trackWidth / 2 + 0.8, trackWidth / 2 + 5.5, -0.08, sidewalkMaterial, environmentWorld);

  for (const offset of [-trackWidth / 2, trackWidth / 2]) {
    const points = [];
    for (let i = 0; i <= trackSamples; i += 1) {
      points.push(makeOvalPoint((i / trackSamples) * Math.PI * 2, offset, 0.025));
    }
    const edge = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), trackSamples, 0.16, 6, false),
      curbMaterial,
    );
    environmentWorld.add(edge);
  }

  const dashMaterial = new THREE.MeshStandardMaterial({
    color: activeTheme.accent,
    roughness: 0.85,
  });
  for (let i = 0; i < 96; i += 1) {
    const angle = (i / 96) * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 2), dashMaterial);
    marker.position.copy(makeOvalPoint(angle, 0, 0.005));
    const tangent = trackTangent(angle);
    const tangentX = tangent.x;
    const tangentZ = tangent.z;
    marker.rotation.y = Math.atan2(tangentX, tangentZ);
    environmentWorld.add(marker);
  }

  const startLine = new THREE.Mesh(
    new THREE.BoxGeometry(trackWidth - 0.25, 0.04, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xf4e8cd, roughness: 0.72 }),
  );
  startLine.position.copy(makeOvalPoint(startAngle, 0, 0.02));
  const startTangent = trackTangent(startAngle);
  startLine.rotation.y = Math.atan2(-startTangent.x, -startTangent.z);
  environmentWorld.add(startLine);

  const lapGateMaterial = new THREE.MeshStandardMaterial({
    color: activeTheme.accent,
    emissive: activeTheme.accent,
    emissiveIntensity: 0.24,
    roughness: 0.58,
  });
  const lapGatePosts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.38, 3.2, 0.42), lapGateMaterial, lapCheckpointCount * 2);
  const lapGateBeams = new THREE.InstancedMesh(new THREE.BoxGeometry(trackWidth - 0.5, 0.38, 0.42), lapGateMaterial, lapCheckpointCount - 1);
  const gateTransform = new THREE.Object3D();
  for (let gate = 1; gate < lapCheckpointCount; gate += 1) {
    const angle = startAngle + (Math.PI * 2 * gate) / lapCheckpointCount;
    const center = makeOvalPoint(angle);
    const tangent = trackTangent(angle);
    const yaw = Math.atan2(-tangent.x, -tangent.z);
    for (const side of [-1, 1]) {
      gateTransform.position.copy(center);
      gateTransform.position.x += Math.cos(yaw) * side * (trackWidth / 2 - 0.5);
      gateTransform.position.y += 1.6;
      gateTransform.position.z -= Math.sin(yaw) * side * (trackWidth / 2 - 0.5);
      gateTransform.rotation.set(0, yaw, 0);
      gateTransform.scale.set(1, 1, 1);
      gateTransform.updateMatrix();
      lapGatePosts.setMatrixAt((gate - 1) * 2 + (side === 1 ? 1 : 0), gateTransform.matrix);
    }
    gateTransform.position.copy(center);
    gateTransform.position.y += 3.3;
    gateTransform.rotation.set(0, yaw, 0);
    gateTransform.updateMatrix();
    lapGateBeams.setMatrixAt(gate - 1, gateTransform.matrix);
  }
  lapGatePosts.instanceMatrix.needsUpdate = true;
  lapGateBeams.instanceMatrix.needsUpdate = true;
  environmentWorld.add(lapGatePosts, lapGateBeams);

  const crosswalkMaterial = new THREE.MeshStandardMaterial({ color: 0xf2efe5, roughness: 0.9 });
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const tangent = trackTangent(angle);
    const tangentX = tangent.x;
    const tangentZ = tangent.z;
    const tangentLength = Math.hypot(tangentX, tangentZ);
    const yaw = Math.atan2(tangentX, tangentZ);
    for (let stripe = -4; stripe <= 4; stripe += 1) {
      const crossing = new THREE.Mesh(new THREE.BoxGeometry(trackWidth - 1.5, 0.035, 0.85), crosswalkMaterial);
      crossing.position.copy(makeOvalPoint(angle, 0, 0.02));
      crossing.position.x += (tangentX / tangentLength) * stripe * 1.25;
      crossing.position.z += (tangentZ / tangentLength) * stripe * 1.25;
      crossing.rotation.y = yaw;
      environmentWorld.add(crossing);
    }
  }
}

function addCityScenery() {
  let seed = 48271;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const buildingColors = activeTheme.buildings;
  const buildings = new THREE.Group();
  const buildingInstances = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 }),
    48,
  );
  buildingInstances.castShadow = true;
  buildingInstances.receiveShadow = true;
  const buildingTransform = new THREE.Object3D();
  let buildingCount = 0;
  const windowMaterial = new THREE.MeshStandardMaterial({ color: activeTheme.windows, roughness: 0.42, metalness: 0.16 });
  const windowGeometry = new THREE.BoxGeometry(1.15, 1.25, 0.08);
  const windowInstances = new THREE.InstancedMesh(windowGeometry, windowMaterial, 36000);
  const dummy = new THREE.Object3D();
  let windowCount = 0;

  function addBuilding(angle, side, offset, width, depth, height) {
    const point = makeOvalPoint(angle, side * offset, 0);
    point.y = cityGroundHeight;
    const tangent = trackTangent(angle);
    const yaw = Math.atan2(-tangent.x, -tangent.z);
    if (!isCityBuildingPlacementClear(point, width / 2, depth / 2, yaw)) return;
    const color = buildingColors[Math.floor(random() * buildingColors.length)];
    buildingTransform.position.set(point.x, point.y + height / 2, point.z);
    buildingTransform.rotation.set(0, yaw, 0);
    buildingTransform.scale.set(width, height, depth);
    buildingTransform.updateMatrix();
    buildingInstances.setMatrixAt(buildingCount, buildingTransform.matrix);
    buildingInstances.setColorAt(buildingCount, new THREE.Color(color));
    addBoxCollider(
      point,
      width / 2,
      depth / 2,
      yaw,
      point.y,
      point.y + height,
    );
    buildingCount += 1;

    for (const facade of [-1, 1]) {
      for (let floor = 1; floor < Math.floor(height / 4); floor += 1) {
        for (let column = 0; column < Math.floor(width / 2.7); column += 1) {
          dummy.position.set(
            point.x + Math.cos(yaw) * (column * 2.65 - width / 2 + 1.7) + Math.sin(yaw) * facade * (depth / 2 + 0.045),
            point.y + floor * 3.3,
            point.z - Math.sin(yaw) * (column * 2.65 - width / 2 + 1.7) + Math.cos(yaw) * facade * (depth / 2 + 0.045),
          );
          dummy.rotation.set(0, yaw, 0);
          dummy.updateMatrix();
          windowInstances.setMatrixAt(windowCount, dummy.matrix);
          windowCount += 1;
        }
      }
    }
    for (const facade of [-1, 1]) {
      for (let floor = 1; floor < Math.floor(height / 4); floor += 1) {
        for (let column = 0; column < Math.floor(depth / 2.7); column += 1) {
          const localZ = column * 2.65 - depth / 2 + 1.7;
          const localX = facade * (width / 2 + 0.045);
          dummy.position.set(
            point.x + Math.cos(yaw) * localX + Math.sin(yaw) * localZ,
            point.y + floor * 3.3,
            point.z - Math.sin(yaw) * localX + Math.cos(yaw) * localZ,
          );
          dummy.rotation.set(0, yaw + facade * Math.PI / 2, 0);
          dummy.updateMatrix();
          windowInstances.setMatrixAt(windowCount, dummy.matrix);
          windowCount += 1;
        }
      }
    }
  }

  for (let i = 0; i < 24; i += 1) {
    const angle = ((i + 0.5) / 24) * Math.PI * 2;
    for (const side of [-1, 1]) {
      const width = 10 + random() * 4;
      const depth = 10 + random() * 3;
      const offset = trackWidth / 2 + 5.5 + width / 2 + 2;
      addBuilding(angle, side, offset, width, depth, 18 + random() * 42);
    }
  }
  buildingInstances.count = buildingCount;
  buildingInstances.instanceMatrix.needsUpdate = true;
  buildingInstances.instanceColor.needsUpdate = true;
  buildings.add(buildingInstances);
  windowInstances.count = windowCount;
  windowInstances.instanceMatrix.needsUpdate = true;
  windowInstances.castShadow = false;
  buildings.add(windowInstances);
  environmentWorld.add(buildings);

  const treeTrunk = new THREE.MeshStandardMaterial({ color: 0x70513a, roughness: 0.95 });
  const foliage = [
    new THREE.MeshStandardMaterial({ color: activeTheme.trees[0], roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: activeTheme.trees[1], roughness: 0.96 }),
  ];
  const lampMetal = new THREE.MeshStandardMaterial({ color: 0x4b5457, roughness: 0.68, metalness: 0.42 });
  const lampGlass = new THREE.MeshStandardMaterial({ color: 0xf4e8c5, roughness: 0.45 });
  const trunkGeometry = new THREE.CylinderGeometry(0.22, 0.32, 4.8, 8);
  const crownGeometry = new THREE.SphereGeometry(1, 16, 12);
  const trunkInstances = new THREE.InstancedMesh(trunkGeometry, treeTrunk, 48);
  const crownInstances = foliage.map((material) => new THREE.InstancedMesh(crownGeometry, material, 72));
  const treeTransform = new THREE.Object3D();
  const crownCounts = [0, 0];
  let treeCount = 0;

  function addTree(angle, side, offset) {
    const point = makeOvalPoint(angle, side * offset, 0);
    point.y = cityGroundHeight;
    if (!isCityPlacementClear(point, 3.5)) return;
    addCircleCollider(point, 3.5, point.y, point.y + 10);
    treeTransform.position.set(point.x, point.y + 2.4, point.z);
    treeTransform.rotation.set(0, 0, 0);
    treeTransform.scale.set(1, 1, 1);
    treeTransform.updateMatrix();
    trunkInstances.setMatrixAt(treeCount, treeTransform.matrix);
    treeCount += 1;
    for (let i = 0; i < 3; i += 1) {
      const materialIndex = i % foliage.length;
      treeTransform.position.set(
        point.x + (random() - 0.5) * 1.2,
        point.y + 4.7 + i * 0.75,
        point.z + (random() - 0.5) * 1.2,
      );
      treeTransform.scale.set(2.1 + random() * 0.8, 1.9 + random() * 0.6, 2.1 + random() * 0.8);
      treeTransform.updateMatrix();
      crownInstances[materialIndex].setMatrixAt(crownCounts[materialIndex], treeTransform.matrix);
      crownCounts[materialIndex] += 1;
    }
  }

  function addStreetLamp(angle, side, offset) {
    const point = makeOvalPoint(angle, side * offset, 0);
    point.y = cityGroundHeight;
    if (!isCityPlacementClear(point, 1.6)) return;
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.19, 7.4, 8), lampMetal);
    pole.position.y = 3.7;
    pole.castShadow = true;
    lamp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.8), lampMetal);
    arm.position.set(0, 7.1, side * -0.7);
    lamp.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.9), lampGlass);
    head.position.set(0, 7.05, side * -1.4);
    lamp.add(head);
    lamp.position.set(point.x, point.y, point.z);
    const tangent = trackTangent(angle);
    lamp.rotation.y = Math.atan2(-tangent.x, -tangent.z);
    addCircleCollider(point, 1.6, point.y, point.y + 8);
    environmentWorld.add(lamp);
  }

  function addTrafficSignal(angle, side) {
    const point = makeOvalPoint(angle, side * 17.2, 0);
    point.y = cityGroundHeight;
    if (!isCityPlacementClear(point, 1.1)) return;
    const signal = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.2, 8), lampMetal);
    pole.position.y = 2.6;
    pole.castShadow = true;
    signal.add(pole);
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 1.7, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x343a3c, roughness: 0.75 }),
    );
    housing.position.set(0, 5.15, 0);
    signal.add(housing);
    const bulbColors = [0xb33e36, 0xd3a549, 0x648c58];
    for (let i = 0; i < bulbColors.length; i += 1) {
      const bulb = new THREE.Mesh(
        new THREE.CircleGeometry(0.19, 12),
        new THREE.MeshStandardMaterial({ color: bulbColors[i], roughness: 0.5 }),
      );
      bulb.position.set(0, 5.65 - i * 0.5, 0.26);
      signal.add(bulb);
    }
    signal.position.set(point.x, point.y, point.z);
    addCircleCollider(point, 1.1, point.y, point.y + 5.5);
    environmentWorld.add(signal);
  }

  for (let i = 0; i < 48; i += 1) {
    const angle = (i / 48) * Math.PI * 2;
    const side = i % 2 === 0 ? 1 : -1;
    addTree(angle, side, 21 + (i % 3) * 1.5);
    if (i % 2 === 0) addStreetLamp(angle, -side, 17.5);
  }
  trunkInstances.count = treeCount;
  trunkInstances.instanceMatrix.needsUpdate = true;
  trunkInstances.castShadow = true;
  for (let i = 0; i < crownInstances.length; i += 1) {
    crownInstances[i].count = crownCounts[i];
    crownInstances[i].instanceMatrix.needsUpdate = true;
    crownInstances[i].castShadow = true;
  }
  environmentWorld.add(trunkInstances, ...crownInstances);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    addTrafficSignal(angle, -1);
    addTrafficSignal(angle, 1);
  }

  const bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0xa9aaa3, roughness: 0.88 });
  const bridgeRailMaterial = new THREE.MeshStandardMaterial({ color: 0x596368, roughness: 0.65, metalness: 0.35 });
  const bridgePositions = [];
  const bridgeIndices = [];
  const bridgeEdgePoints = [[], []];
  const bridgeSamples = 56;
  for (let i = 0; i <= bridgeSamples; i += 1) {
    const angle = -bridgeRampHalfAngle + (2 * bridgeRampHalfAngle * i) / bridgeSamples;
    const left = makeOvalPoint(angle, -trackWidth / 2 - 1, -0.015);
    const right = makeOvalPoint(angle, trackWidth / 2 + 1, -0.015);
    bridgePositions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    bridgeEdgePoints[0].push(makeOvalPoint(angle, -trackWidth / 2 - 1, 1.35));
    bridgeEdgePoints[1].push(makeOvalPoint(angle, trackWidth / 2 + 1, 1.35));
    if (i < bridgeSamples) {
      const index = i * 2;
      bridgeIndices.push(index, index + 1, index + 2, index + 1, index + 3, index + 2);
    }
  }
  const bridgeGeometry = new THREE.BufferGeometry();
  bridgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(bridgePositions, 3));
  bridgeGeometry.setIndex(bridgeIndices);
  bridgeGeometry.computeVertexNormals();
  const bridgeDeck = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
  bridgeDeck.castShadow = true;
  bridgeDeck.receiveShadow = true;
  environmentWorld.add(bridgeDeck);
  for (const points of bridgeEdgePoints) {
    environmentWorld.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), bridgeSamples, 0.22, 8, false),
      bridgeRailMaterial,
    ));
    for (let i = 0; i < points.length - 1; i += 1) {
      addCapsuleCollider(
        points[i],
        points[i + 1],
        0.25,
        Math.min(points[i].y, points[i + 1].y) - 0.5,
        Math.max(points[i].y, points[i + 1].y) + 0.6,
      );
    }
  }
  const supportGeometry = new THREE.BoxGeometry(1.5, bridgeHeight - 0.3, 1.5);
  for (const x of [-10, 10]) {
    const support = new THREE.Mesh(supportGeometry, bridgeMaterial);
    support.position.set(x, (bridgeHeight - 0.3) / 2, 0);
    support.castShadow = true;
    environmentWorld.add(support);
    addBoxCollider(support.position, 0.75, 0.75, 0, 0, bridgeHeight);
  }
}

function addEnvironmentClouds(mode) {
  let seed = mode === "ghost" ? 58391 : mode === "hill" || mode === "checkpoint" ? 19087 : 48271;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const clouds = new THREE.Group();
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xfafcff, roughness: 1 });
  const cloudCount = mode === "hill" ? 11 : 16;
  for (let i = 0; i < cloudCount; i += 1) {
    const x = -420 + random() * 840;
    const y = 78 + random() * 38;
    const z = -620 + random() * 1240;
    const cloud = new THREE.Group();
    const puffCount = 4 + Math.floor(random() * 3);
    for (let puff = 0; puff < puffCount; puff += 1) {
      const size = 9 + random() * 6;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 10), cloudMaterial);
      mesh.position.set(
        (puff - (puffCount - 1) / 2) * size * 0.58,
        random() * size * 0.16,
        (random() - 0.5) * size * 0.35,
      );
      mesh.scale.set(1.35, 0.58, 0.9);
      cloud.add(mesh);
    }
    cloud.position.set(x, y, z);
    clouds.add(cloud);
  }
  environmentRoot.add(clouds);
}

function addMountainFog(mode) {
  const mistMaterial = new THREE.MeshBasicMaterial({
    color: mode === "checkpoint" ? 0xffe1b6 : 0xdce8e7,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  for (const [x, y, z, width] of [
    [-54, 25, -92, 52],
    [60, 42, -236, 64],
    [-52, 62, -386, 58],
    [8, 100, -486, 72],
  ]) {
    const mist = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mistMaterial);
    mist.position.set(x, y, z);
    mist.scale.set(width, 4, width * 0.44);
    environmentRoot.add(mist);
  }
}

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
const hillTerrainSamples = Array.from({ length: 321 }, (_, index) => hillCurve.getPointAt(index / 320));
const mountainBounds = { minX: -220, maxX: 220, minZ: -620, maxZ: 90 };
const mountainTerrainColumns = 88;
const mountainTerrainRows = 142;
let mountainTerrainHeights = null;

function hillRoadPoint(progress, lateralOffset = 0, elevationOffset = 0) {
  const t = THREE.MathUtils.clamp(progress / hillLength, 0, 1);
  const point = hillCurve.getPointAt(t);
  const tangent = hillCurve.getTangentAt(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  point.addScaledVector(normal, lateralOffset);
  point.y += elevationOffset;
  return point;
}

function hillRoadPointExtended(progress, lateralOffset = 0, elevationOffset = 0) {
  if (progress >= 0 && progress <= hillLength) return hillRoadPoint(progress, lateralOffset, elevationOffset);
  const endpointProgress = progress < 0 ? 0 : hillLength;
  const endpoint = hillRoadPoint(endpointProgress, lateralOffset, elevationOffset);
  const tangent = hillCurve.getTangentAt(endpointProgress / hillLength);
  return endpoint.addScaledVector(tangent, progress - endpointProgress);
}

function getMountainTerrainHeight(x, z) {
  if (!mountainTerrainHeights) return getMountainTerrainBaseHeight(x, z);
  const columnPosition = THREE.MathUtils.clamp(
    ((x - mountainBounds.minX) / (mountainBounds.maxX - mountainBounds.minX)) * mountainTerrainColumns,
    0,
    mountainTerrainColumns,
  );
  const rowPosition = THREE.MathUtils.clamp(
    ((z - mountainBounds.minZ) / (mountainBounds.maxZ - mountainBounds.minZ)) * mountainTerrainRows,
    0,
    mountainTerrainRows,
  );
  const column = Math.min(Math.floor(columnPosition), mountainTerrainColumns - 1);
  const row = Math.min(Math.floor(rowPosition), mountainTerrainRows - 1);
  const u = columnPosition - column;
  const v = rowPosition - row;
  const index = row * (mountainTerrainColumns + 1) + column;
  const topLeft = mountainTerrainHeights[index];
  const topRight = mountainTerrainHeights[index + 1];
  const bottomLeft = mountainTerrainHeights[index + mountainTerrainColumns + 1];
  const bottomRight = mountainTerrainHeights[index + mountainTerrainColumns + 2];
  return u + v <= 1
    ? topLeft * (1 - u - v) + topRight * u + bottomLeft * v
    : topRight * (1 - v) + bottomLeft * (1 - u) + bottomRight * (u + v - 1);
}

function getMountainTerrainBaseHeight(x, z) {
  let nearestDistanceSquared = Infinity;
  let nearestIndex = 0;
  for (let i = 0; i < hillTerrainSamples.length; i += 1) {
    const sample = hillTerrainSamples[i];
    const distanceSquared = (sample.x - x) ** 2 + (sample.z - z) ** 2;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestIndex = i;
    }
  }
  let routeDistanceSquared = Infinity;
  let routeHeight = hillTerrainSamples[nearestIndex].y;
  const firstSegment = Math.max(0, nearestIndex - 2);
  const lastSegment = Math.min(hillTerrainSamples.length - 2, nearestIndex + 1);
  for (let i = firstSegment; i <= lastSegment; i += 1) {
    const start = hillTerrainSamples[i];
    const end = hillTerrainSamples[i + 1];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const lengthSquared = dx * dx + dz * dz;
    const fraction = THREE.MathUtils.clamp(((x - start.x) * dx + (z - start.z) * dz) / lengthSquared, 0, 1);
    const offsetX = x - (start.x + dx * fraction);
    const offsetZ = z - (start.z + dz * fraction);
    const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
    if (distanceSquared < routeDistanceSquared) {
      routeDistanceSquared = distanceSquared;
      routeHeight = THREE.MathUtils.lerp(start.y, end.y, fraction);
    }
  }
  const distance = Math.sqrt(routeDistanceSquared);
  const blend = THREE.MathUtils.clamp((distance - 18) / 92, 0, 1);
  const smoothBlend = blend * blend * (3 - 2 * blend);
  return THREE.MathUtils.lerp(routeHeight - 0.45, -0.5, smoothBlend);
}

function getMountainGroundPoint(progress, lateralOffset) {
  const point = hillRoadPoint(progress, lateralOffset);
  point.y = getMountainTerrainHeight(point.x, point.z);
  return point;
}

function isMountainPlacementClear(point, radius) {
  if (!isInsideEnvironmentBounds(point, radius)) return false;
  const roadClearance = hillRoadWidth / 2 + 1.4 + radius;
  for (const sample of hillTerrainSamples) {
    if (Math.hypot(point.x - sample.x, point.z - sample.z) < roadClearance) return false;
  }
  return true;
}

function buildMountainTerrain() {
  const columns = mountainTerrainColumns;
  const rows = mountainTerrainRows;
  const positions = [];
  const indices = [];
  mountainTerrainHeights = [];
  for (let row = 0; row <= rows; row += 1) {
    const z = mountainBounds.minZ + ((mountainBounds.maxZ - mountainBounds.minZ) * row) / rows;
    for (let column = 0; column <= columns; column += 1) {
      const x = mountainBounds.minX + ((mountainBounds.maxX - mountainBounds.minX) * column) / columns;
      const height = getMountainTerrainBaseHeight(x, z);
      positions.push(x, height, z);
      mountainTerrainHeights.push(height);
      if (row < rows && column < columns) {
        const index = row * (columns + 1) + column;
        indices.push(index, index + columns + 1, index + 1);
        indices.push(index + 1, index + columns + 1, index + columns + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: activeTheme.ground, roughness: 1, side: THREE.DoubleSide }),
  );
  terrain.receiveShadow = false;
  environmentWorld.add(terrain);
}

function buildHillClimb() {
  const samples = 520;
  const positions = [];
  const indices = [];
  const leftEdge = [];
  const rightEdge = [];
  for (let i = 0; i <= samples; i += 1) {
    const progress = -20 + (i / samples) * (hillLength + 40);
    const left = hillRoadPointExtended(progress, -hillRoadWidth / 2, 0.02);
    const right = hillRoadPointExtended(progress, hillRoadWidth / 2, 0.02);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    leftEdge.push(left);
    rightEdge.push(right);
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
    color: activeTheme.road,
    roughness: 0.97,
    side: THREE.DoubleSide,
  }));
  road.receiveShadow = true;
  environmentWorld.add(road);
  buildMountainTerrain();

  const edgeMaterial = curbMaterial;
  for (const points of [leftEdge, rightEdge]) {
    environmentWorld.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), samples, 0.14, 6, false),
      edgeMaterial,
    ));
  }
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: activeTheme.accent,
    roughness: 0.84,
  });
  for (let i = 0; i < 100; i += 1) {
    const progress = hillLength * (i + 0.5) / 100;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 2.3), markerMaterial);
    marker.position.copy(hillRoadPoint(progress, 0, 0.09));
    const tangent = hillCurve.getTangentAt(progress / hillLength);
    marker.rotation.y = Math.atan2(tangent.x, tangent.z);
    environmentWorld.add(marker);
  }

  let seed = 7919;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x59615e, roughness: 0.7, metalness: 0.24 });
  const railPostGeometry = new THREE.BoxGeometry(0.18, 1.25, 0.18);
  const railPostInstances = new THREE.InstancedMesh(railPostGeometry, railMaterial, 260);
  const transform = new THREE.Object3D();
  let railPostCount = 0;
  for (const side of [-1, 1]) {
    const railPoints = [];
    for (let i = 0; i <= 180; i += 1) {
      const progress = -20 + (i / 180) * (hillLength + 32);
      const point = hillRoadPointExtended(progress, side * (hillRoadWidth / 2 + 1.35));
      point.y = getMountainTerrainHeight(point.x, point.z) + 1.4;
      railPoints.push(point);
      if (i % 3 === 0) {
        transform.position.copy(point);
        transform.position.y -= 0.7;
        transform.rotation.set(0, 0, 0);
        transform.scale.set(1, 1.4, 1);
        transform.updateMatrix();
        railPostInstances.setMatrixAt(railPostCount, transform.matrix);
        railPostCount += 1;
      }
    }
    for (let i = 0; i < railPoints.length - 1; i += 1) {
      addCapsuleCollider(
        railPoints[i],
        railPoints[i + 1],
        0.2,
        Math.min(railPoints[i].y, railPoints[i + 1].y) - 0.7,
        Math.max(railPoints[i].y, railPoints[i + 1].y) + 0.7,
      );
    }
    environmentWorld.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPoints), 180, 0.12, 6, false),
      railMaterial,
    ));
    const lowerRailPoints = railPoints.map((point) => point.clone().add(new THREE.Vector3(0, -0.55, 0)));
    environmentWorld.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lowerRailPoints), 180, 0.08, 6, false),
      railMaterial,
    ));
  }
  railPostInstances.count = railPostCount;
  railPostInstances.instanceMatrix.needsUpdate = true;
  environmentWorld.add(railPostInstances);

  const pineTrunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.28, 4, 7),
    new THREE.MeshStandardMaterial({ color: 0x574436, roughness: 0.96 }),
    168,
  );
  const pineCrowns = [0, 1, 2].map(() => new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 1, 7),
    new THREE.MeshStandardMaterial({ color: activeTheme.trees[0], roughness: 0.97 }),
    168,
  ));
  let pineCount = 0;
  for (let i = 0; i < 168; i += 1) {
    const fraction = random();
    const side = random() < 0.5 ? -1 : 1;
    const point = getMountainGroundPoint(fraction * hillLength, side * (20 + random() * 68));
    const scale = 0.8 + random() * 1.15;
    if (!isMountainPlacementClear(point, 2.5 * scale)) continue;
    addCircleCollider(point, 2.5 * scale, point.y, point.y + 11 * scale);
    transform.position.set(point.x, point.y + 2 * scale, point.z);
    transform.rotation.set(0, random() * Math.PI * 2, 0);
    transform.scale.set(scale, scale, scale);
    transform.updateMatrix();
    pineTrunks.setMatrixAt(pineCount, transform.matrix);
    for (let tier = 0; tier < pineCrowns.length; tier += 1) {
      transform.position.set(point.x, point.y + (3.2 + tier * 1.25) * scale, point.z);
      transform.scale.set(2.25 * scale, 4.4 * scale, 2.25 * scale);
      transform.updateMatrix();
      pineCrowns[tier].setMatrixAt(pineCount, transform.matrix);
    }
    pineCount += 1;
  }
  pineTrunks.count = pineCount;
  pineTrunks.instanceMatrix.needsUpdate = true;
  pineTrunks.castShadow = true;
  for (const crowns of pineCrowns) {
    crowns.count = pineCount;
    crowns.instanceMatrix.needsUpdate = true;
    crowns.castShadow = true;
  }
  environmentWorld.add(pineTrunks, ...pineCrowns);

  const rockColors = activeTheme.rockColors || [0x77776f, 0x969187];
  const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
  rockGeometry.computeBoundingBox();
  const rockBottomOffset = -rockGeometry.boundingBox.min.y;
  const rockHeightOffset = rockGeometry.boundingBox.max.y - rockGeometry.boundingBox.min.y;
  const rockInstances = rockColors.map((color) => new THREE.InstancedMesh(
    rockGeometry,
    new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }),
    100,
  ));
  const rockCounts = [0, 0];
  for (let i = 0; i < 200; i += 1) {
    const fraction = random();
    const side = random() < 0.5 ? -1 : 1;
    const point = getMountainGroundPoint(fraction * hillLength, side * (62 + random() * 110));
    const size = 7 + random() * 12;
    if (!isMountainPlacementClear(point, size * 2)) continue;
    const rockHeight = size * (0.7 + random() * 0.5);
    addCircleCollider(point, size * 1.9, point.y, point.y + rockHeight * rockHeightOffset);
    transform.position.set(point.x, point.y + rockHeight * rockBottomOffset, point.z);
    transform.rotation.set(0, random() * Math.PI, 0);
    transform.scale.set(size * (1.1 + random() * 0.8), rockHeight, size * (1 + random() * 0.7));
    transform.updateMatrix();
    const materialIndex = i % rockInstances.length;
    rockInstances[materialIndex].setMatrixAt(rockCounts[materialIndex], transform.matrix);
    rockCounts[materialIndex] += 1;
  }
  for (let i = 0; i < rockInstances.length; i += 1) {
    rockInstances[i].count = rockCounts[i];
    rockInstances[i].instanceMatrix.needsUpdate = true;
    rockInstances[i].castShadow = true;
    rockInstances[i].receiveShadow = true;
  }
  environmentWorld.add(...rockInstances);

  const finishProgress = hillLength;
  const finishLine = new THREE.Mesh(
    new THREE.BoxGeometry(hillRoadWidth - 0.3, 0.12, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xf4e8cd, roughness: 0.72 }),
  );
  finishLine.position.copy(hillRoadPoint(finishProgress, 0, 0.14));
  const finishTangent = hillCurve.getTangentAt(1);
  finishLine.rotation.y = Math.atan2(finishTangent.x, finishTangent.z);
  environmentWorld.add(finishLine);

  const flagPosition = hillRoadPoint(finishProgress, hillRoadWidth / 2 + 1.5, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 10), warmWhiteMaterial);
  pole.position.copy(flagPosition);
  pole.position.y += 4.5;
  pole.castShadow = true;
  environmentWorld.add(pole);
  const flag = new THREE.Group();
  flag.position.set(flagPosition.x, flagPosition.y + 7.1, flagPosition.z);
  flag.rotation.y = Math.atan2(finishTangent.x, finishTangent.z);
  const flagMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf4f7ff, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x111727, side: THREE.DoubleSide }),
  ];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const square = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.05), flagMaterials[(row + column) % 2]);
      square.position.set(0.55 + column * 1.1, 1.05 - row * 1.05, 0);
      flag.add(square);
    }
  }
  environmentWorld.add(flag);

  const summit = hillRoadPoint(hillLength, 0, 0.2);
  const summitTangent = hillCurve.getTangentAt(1);
  const summitYaw = Math.atan2(summitTangent.x, summitTangent.z);
  const lookout = new THREE.Group();
  const lookoutDeck = new THREE.Mesh(
    new THREE.BoxGeometry(32, 0.5, 25),
    new THREE.MeshStandardMaterial({ color: 0xb9b4a6, roughness: 0.9 }),
  );
  lookoutDeck.position.set(0, 0, -15);
  lookoutDeck.receiveShadow = true;
  lookout.add(lookoutDeck);
  const overlookRailMaterial = new THREE.MeshStandardMaterial({ color: 0x626a68, roughness: 0.72, metalness: 0.2 });
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 23), overlookRailMaterial);
    rail.position.set(side * 15.4, 0.9, -15);
    lookout.add(rail);
    for (let post = 0; post <= 5; post += 1) {
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.25, 0.24), overlookRailMaterial);
      upright.position.set(side * 15.4, 0.85, -25 + post * 4);
      lookout.add(upright);
    }
  }
  const overlookFrontRail = new THREE.Mesh(new THREE.BoxGeometry(30.8, 1.3, 0.22), overlookRailMaterial);
  overlookFrontRail.position.set(0, 0.9, -27.4);
  lookout.add(overlookFrontRail);
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x826b50, roughness: 0.8 });
  for (const x of [-9, 9]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.7), benchMaterial);
    bench.position.set(x, 1, -9);
    lookout.add(bench);
    const seatSupports = new THREE.Mesh(new THREE.BoxGeometry(3, 0.65, 0.25), overlookRailMaterial);
    seatSupports.position.set(x, 0.62, -9);
    lookout.add(seatSupports);
  }
  lookout.position.set(summit.x, summit.y, summit.z);
  lookout.rotation.y = summitYaw;
  const addLookoutCollider = (localX, localY, localZ, halfWidth, halfHeight, halfDepth) => {
    const point = new THREE.Vector3(
      summit.x + Math.cos(summitYaw) * localX + Math.sin(summitYaw) * localZ,
      summit.y + localY,
      summit.z - Math.sin(summitYaw) * localX + Math.cos(summitYaw) * localZ,
    );
    addBoxCollider(point, halfWidth, halfDepth, summitYaw, point.y - halfHeight, point.y + halfHeight);
  };
  for (const side of [-1, 1]) {
    addLookoutCollider(side * 15.4, 0.9, -15, 0.11, 0.65, 11.5);
  }
  addLookoutCollider(0, 0.9, -27.4, 15.4, 0.65, 0.11);
  for (const x of [-9, 9]) {
    addLookoutCollider(x, 1, -9, 1.75, 0.11, 0.35);
    addLookoutCollider(x, 0.62, -9, 1.5, 0.325, 0.125);
  }
  environmentWorld.add(lookout);
}

function createCheckpointGate() {
  checkpointGate = new THREE.Group();
  const checkpointMaterial = new THREE.MeshStandardMaterial({
    color: 0xffed73,
    emissive: 0xffa900,
    emissiveIntensity: 2.4,
    roughness: 0.68,
  });
  const checkpointPostGeometry = new THREE.BoxGeometry(0.55, 9, 0.65);
  for (const side of [-8.5, 8.5]) {
    const post = new THREE.Mesh(checkpointPostGeometry, checkpointMaterial);
    post.position.set(side, 4.5, 0);
    checkpointGate.add(post);
  }
  const checkpointBeam = new THREE.Mesh(new THREE.BoxGeometry(18, 0.65, 0.65), checkpointMaterial);
  checkpointBeam.position.y = 9;
  checkpointGate.add(checkpointBeam);
  environmentWorld.add(checkpointGate);
  positionCheckpointGate();
}

function createCar({
  bodyColor = 0x151c30,
  trimColor = 0x30383c,
  glassColor = 0x56717d,
  vehicleType = "hatchback",
} = {}) {
  const car = new THREE.Group();
  const specs = {
    hatchback: { width: 1.82, length: 4.05, cabinHeight: 1.52, roofLength: 1.38, wheelbase: 2.58 },
    taxi: { width: 1.84, length: 4.18, cabinHeight: 1.53, roofLength: 1.43, wheelbase: 2.62 },
    coupe: { width: 1.9, length: 4.48, cabinHeight: 1.31, roofLength: 0.96, wheelbase: 2.72 },
    truck: { width: 1.98, length: 5.12, cabinHeight: 1.58, roofLength: 1.28, wheelbase: 3.16 },
  }[vehicleType] || { width: 1.82, length: 4.05, cabinHeight: 1.52, roofLength: 1.38, wheelbase: 2.58 };
  const isTruck = vehicleType === "truck";
  const isCoupe = vehicleType === "coupe";
  const isTaxi = vehicleType === "taxi";
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.18, roughness: 0.34 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: trimColor, metalness: 0.16, roughness: 0.48 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: glassColor,
    metalness: 0.12,
    roughness: 0.24,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x202326, roughness: 0.86 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xb8bec0, metalness: 0.72, roughness: 0.3 });
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xfff1cf, roughness: 0.28 });
  const brakeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xb52d28, roughness: 0.38 });
  const interiorMaterial = new THREE.MeshStandardMaterial({ color: 0x272a28, roughness: 0.88 });
  const bodyWidth = specs.width;
  const frontZ = -specs.length / 2;
  const rearZ = specs.length / 2;
  const frontWheelZ = -specs.wheelbase / 2;
  const rearWheelZ = specs.wheelbase / 2;
  const roofY = specs.cabinHeight;
  const roofZ = isTruck ? -0.18 : 0.18;
  const cabinFrontZ = isTruck ? -0.94 : isCoupe ? -1.02 : -0.91;
  const cabinRearZ = isTruck ? 0.67 : isCoupe ? 0.81 : 1.07;
  const lowerGlassY = isCoupe ? 1.06 : 1.12;
  const windowInset = bodyWidth * 0.46;

  function addBox(parent, size, position, material, castShadow = false, cornerRadius = 0.04) {
    const radius = Math.min(cornerRadius, ...size.map((dimension) => dimension * 0.45));
    const geometry = new RoundedBoxGeometry(...size, 3, radius);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addPane(vertices) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    car.add(new THREE.Mesh(geometry, glassMaterial));
  }

  addBox(car, [bodyWidth, 0.48, specs.length * 0.84], [0, 0.67, 0.02], bodyMaterial, true, 0.12);
  addBox(car, [bodyWidth * 0.98, 0.32, 1.12], [0, 0.91, frontZ * 0.63], bodyMaterial, true, 0.09);
  if (!isTruck) {
    addBox(car, [bodyWidth * 0.96, 0.32, 0.78], [0, 0.91, 1.48], bodyMaterial, true, 0.08);
  }
  addBox(car, [bodyWidth + 0.08, 0.16, 0.16], [0, 0.55, frontZ * 0.94], trimMaterial, false, 0.035);
  addBox(car, [bodyWidth + 0.08, 0.16, 0.16], [0, 0.55, rearZ * 0.94], trimMaterial, false, 0.035);
  addBox(car, [1.12, 0.17, 0.22], [0, isCoupe ? 0.93 : 1.02, cabinFrontZ + 0.2], interiorMaterial);
  for (const x of [-0.43, 0.43]) {
    addBox(car, [0.39, isCoupe ? 0.28 : 0.38, 0.34], [x, isCoupe ? 1.04 : 1.17, 0.34], interiorMaterial);
    addBox(car, [0.4, 0.12, 0.4], [x, isCoupe ? 0.85 : 0.96, 0.28], interiorMaterial);
  }

  if (isTruck) {
    const bedLength = 1.45;
    const bedZ = 1.56;
    addBox(car, [1.5, 0.09, bedLength], [0, 1.015, bedZ], trimMaterial);
    for (const side of [-1, 1]) {
      addBox(car, [0.13, 0.44, bedLength], [side * 0.83, 1.17, bedZ], bodyMaterial, true);
    }
    addBox(car, [1.78, 0.4, 0.12], [0, 1.17, 2.25], bodyMaterial, true);
    addBox(car, [1.94, 0.12, 0.13], [0, 1.38, 2.25], bodyMaterial);
  }

  const roofWidth = isTruck ? 1.58 : isCoupe ? 1.55 : 1.52;
  addBox(car, [roofWidth, 0.13, specs.roofLength], [0, roofY, roofZ], bodyMaterial, true, 0.065);

  const windshieldBottomZ = cabinFrontZ - 0.16;
  const windshieldTopZ = roofZ - specs.roofLength * 0.42;
  addPane([
    -windowInset, lowerGlassY, windshieldBottomZ,
    windowInset, lowerGlassY, windshieldBottomZ,
    windowInset * 0.83, roofY - 0.1, windshieldTopZ,
    -windowInset * 0.83, roofY - 0.1, windshieldTopZ,
  ]);
  addPane([
    windowInset, lowerGlassY, cabinRearZ,
    -windowInset, lowerGlassY, cabinRearZ,
    -windowInset * 0.8, roofY - 0.1, roofZ + specs.roofLength * 0.47,
    windowInset * 0.8, roofY - 0.1, roofZ + specs.roofLength * 0.47,
  ]);

  for (const side of [-1, 1]) {
    const pillarZ = roofZ + 0.04;
    for (const [windowStart, windowEnd] of [[cabinFrontZ, pillarZ - 0.07], [pillarZ + 0.07, cabinRearZ]]) {
      const roofStart = roofZ - specs.roofLength * 0.44;
      const roofEnd = roofZ + specs.roofLength * 0.44;
      const windowRoofStart = THREE.MathUtils.clamp(windowStart, roofStart, roofEnd);
      const windowRoofEnd = THREE.MathUtils.clamp(windowEnd, roofStart, roofEnd);
      addPane([
        side * windowInset, lowerGlassY, windowStart,
        side * windowInset, lowerGlassY, windowEnd,
        side * windowInset * 0.92, roofY - 0.1, windowRoofEnd,
        side * windowInset * 0.92, roofY - 0.1, windowRoofStart,
      ]);
    }
    addBox(car, [0.12, roofY - lowerGlassY, 0.14], [side * windowInset * 0.96, (roofY + lowerGlassY) / 2, pillarZ], bodyMaterial, true);
    for (const z of [frontWheelZ + 0.2, rearWheelZ - 0.2]) {
      addBox(car, [0.1, 0.06, 0.14], [side * (bodyWidth / 2 + 0.03), 1.04, z], trimMaterial);
    }
    addBox(car, [0.16, 0.11, 0.25], [side * (bodyWidth / 2 + 0.12), 1.2, cabinFrontZ + 0.12], bodyMaterial, true);
    addBox(car, [0.12, 0.09, 0.2], [side * (bodyWidth / 2 + 0.18), 1.22, cabinFrontZ + 0.12], trimMaterial);
  }

  for (const side of [-1, 1]) {
    addBox(car, [0.38, 0.18, 0.1], [side * bodyWidth * 0.34, 0.86, frontZ * 0.96], lightMaterial);
    addBox(car, [0.43, 0.22, 0.1], [side * bodyWidth * 0.36, 0.88, rearZ * 0.91], brakeLightMaterial);
  }
  addBox(car, [0.7, 0.23, 0.08], [0, 0.79, frontZ * 0.96], trimMaterial);
  addBox(car, [0.78, 0.12, 0.08], [0, 0.66, frontZ * 0.97], trimMaterial);
  addBox(car, [0.45, 0.11, 0.08], [0, 0.66, rearZ * 0.93], trimMaterial);

  if (isTaxi) {
    const signBase = addBox(car, [0.58, 0.12, 0.3], [0, roofY + 0.12, roofZ], new THREE.MeshStandardMaterial({ color: 0xf0c928, roughness: 0.38 }));
    addBox(car, [0.48, 0.08, 0.2], [0, roofY + 0.21, roofZ], trimMaterial);
    const taxiYellow = new THREE.MeshStandardMaterial({ color: 0xf0c928 });
    for (const x of [-0.18, 0.18]) {
      addBox(car, [0.12, 0.09, 0.22], [x, roofY + 0.21, roofZ], taxiYellow);
    }
    signBase.castShadow = true;
  }

  const wheelGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.27, 20);
  const hubGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.29, 16);
  car.userData.wheels = [];
  for (const x of [-bodyWidth * 0.48, bodyWidth * 0.48]) {
    for (const z of [frontWheelZ, rearWheelZ]) {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(x, 0.43, z);
      const tire = new THREE.Mesh(wheelGeometry, tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelAssembly.add(tire);
      const rim = new THREE.Mesh(hubGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelAssembly.add(rim);
      const spokeGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.28);
      for (let spoke = 0; spoke < 5; spoke += 1) {
        const bar = new THREE.Mesh(spokeGeometry, rimMaterial);
        bar.position.x = x < 0 ? -0.16 : 0.16;
        bar.rotation.x = (spoke / 5) * Math.PI;
        wheelAssembly.add(bar);
      }
      car.add(wheelAssembly);
      car.userData.wheels.push({ assembly: wheelAssembly, front: z === frontWheelZ });
    }
  }

  car.position.copy(makeOvalPoint(startAngle));
  const tangent = trackTangent(startAngle);
  car.rotation.y = Math.atan2(-tangent.x, -tangent.z);
  scene.add(car);
  return car;
}

function animateCarWheels(vehicleCar, distance, steering = 0) {
  for (const wheel of vehicleCar.userData.wheels || []) {
    wheel.assembly.rotation.x += distance / 0.38;
    wheel.assembly.rotation.y = wheel.front ? steering * 0.32 : 0;
  }
}

const startAngle = -Math.PI / 2;
const vehicleCatalog = {
  rally: {
    name: "City Hatchback",
    topSpeed: 180 / 3.6,
    acceleration: 24,
    handling: 0.88,
    hillTraction: 0.48,
    hillSpeedLimit: 21,
    appearance: {
      bodyColor: 0x477457,
      trimColor: 0x27332b,
      glassColor: 0x6d8993,
      vehicleType: "hatchback",
    },
  },
  taxi: {
    name: "Yellow Taxi",
    topSpeed: 180 / 3.6,
    acceleration: 24,
    handling: 0.88,
    hillTraction: 0.48,
    hillSpeedLimit: 21,
    appearance: {
      bodyColor: 0xf0c928,
      trimColor: 0x28352c,
      glassColor: 0x526c75,
      vehicleType: "taxi",
    },
  },
  sports: {
    name: "Sports Coupe",
    topSpeed: 210 / 3.6,
    acceleration: 25,
    handling: 0.62,
    hillTraction: 0.28,
    hillSpeedLimit: 16,
    appearance: {
      bodyColor: 0xb93831,
      trimColor: 0x252b30,
      glassColor: 0x4d6671,
      vehicleType: "coupe",
    },
  },
  truck: {
    name: "Pickup Truck",
    topSpeed: 130 / 3.6,
    acceleration: 34,
    handling: 0.72,
    hillTraction: 0.82,
    hillSpeedLimit: 32,
    appearance: {
      bodyColor: 0x547c91,
      trimColor: 0x30363a,
      glassColor: 0x526c75,
      vehicleType: "truck",
    },
  },
};
let selectedVehicleId = "rally";
let car = createCar(vehicleCatalog[selectedVehicleId].appearance);
const opponents = [
  {
    car: createCar({ bodyColor: 0xd4ae32, trimColor: 0x25312a, glassColor: 0x526c75, vehicleType: "taxi" }),
    startProgress: -0.25,
    progress: -0.25,
    laneOffset: -4.5,
    speed: 31,
    finished: false,
    finishTime: null,
  },
  {
    car: createCar({ bodyColor: 0x48788b, trimColor: 0x283238, glassColor: 0x526c75, vehicleType: "hatchback" }),
    startProgress: -0.52,
    progress: -0.52,
    laneOffset: 4.5,
    speed: 36,
    finished: false,
    finishTime: null,
  },
  {
    car: createCar({ bodyColor: 0x9b3930, trimColor: 0x292d30, glassColor: 0x526c75, vehicleType: "coupe" }),
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
const startTangent = trackTangent(startAngle);
const carState = {
  speed: 0,
  heading: Math.atan2(-startTangent.x, -startTangent.z),
};
let audioContext;
let engineOscillator;
let engineHarmonic;
let engineGain;
let engineHarmonicGain;
let tireGain;
let cityAmbienceGain;
const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const forward = new THREE.Vector3();
const lapDisplay = document.querySelector("#lap");
const positionDisplay = document.querySelector("#position");
const vehicleCards = document.querySelectorAll(".vehicle-card");
let currentLap = 1;
let totalAngle = 0;
let nextLapCheckpoint = 1;
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
let checkpointTarget = checkpointSpacing;
let lastCityCheckpointAngle = startAngle;
let lastHillRecoveryProgress = 0;
let activeGhostRecord = null;
let ghostCar = null;
let runPath = [];
let pathSampleRemaining = 0;

function positionCheckpointGate() {
  if (!checkpointGate) return;
  if (gameMode === "checkpoint") {
    const progress = Math.min(checkpointTarget, hillLength);
    const tangent = hillCurve.getTangentAt(progress / hillLength);
    checkpointGate.position.copy(hillRoadPoint(progress));
    checkpointGate.rotation.y = Math.atan2(-tangent.x, -tangent.z);
    return;
  }
  const angle = startAngle + checkpointTarget;
  const tangent = trackTangent(angle);
  checkpointGate.position.copy(makeOvalPoint(angle));
  checkpointGate.rotation.y = Math.atan2(-tangent.x, -tangent.z);
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
  if (gameMode === "hill" || gameMode === "checkpoint") {
    const tangent = hillCurve.getTangentAt(0);
    car.position.copy(hillRoadPoint(0, hillLaneOffset));
    carState.heading = Math.atan2(-tangent.x, -tangent.z);
    car.rotation.set(Math.asin(THREE.MathUtils.clamp(tangent.y, -1, 1)), carState.heading, 0);
    return;
  }
  car.position.copy(makeOvalPoint(startAngle));
  const tangent = trackTangent(startAngle);
  carState.heading = Math.atan2(-tangent.x, -tangent.z);
  car.rotation.set(0, carState.heading, 0);
}

function setGameMode(mode) {
  if (!["circuit", "hill", "ghost", "checkpoint"].includes(mode) || raceState !== "ready") return;
  gameMode = mode;
  const climbing = mode === "hill";
  const checkpointRush = mode === "checkpoint";
  const ghostRide = mode === "ghost";
  for (const opponent of opponents) opponent.car.visible = !climbing && !ghostRide && !checkpointRush;
  lapCard.hidden = climbing || checkpointRush;
  positionCard.hidden = climbing || checkpointRush || ghostRide;
  hillProgressCard.hidden = !climbing;
  checkpointCard.hidden = !checkpointRush;
  modeStatus.textContent = climbing ? "HILL CLIMB" : ghostRide ? "GHOST RIDE" : checkpointRush ? "CHECKPOINT RUSH" : "CIRCUIT RACE";
  trackStatus.textContent = climbing ? "SUMMIT RUN" : checkpointRush ? "TIME ATTACK" : ghostRide ? "PERSONAL BEST" : "TRACK 01";
  trackName.textContent = climbing ? "MOUNTAIN ASCENT" : checkpointRush ? "DESERT CHECKPOINTS" : ghostRide ? "DOWNTOWN GHOST LAP" : "DOWNTOWN CIRCUIT";
  trackCoordinate.textContent = climbing || checkpointRush ? `${Math.round(hillLength)} M CLIMB` : "35° 41' N — 139° 41' E";
  timerLabel.textContent = climbing ? "CLIMB TIME" : checkpointRush ? "TIME" : "RACE TIME";
  steerHint.textContent = climbing || checkpointRush ? "Move across the road as you climb" : "Guide your car around the circuit";
  startIntro.textContent = climbing
    ? "Climb a winding mountain road through pine forest and rocky cliffs to the summit viewpoint."
    : checkpointRush
      ? "Race the mountain pass in desert heat. Reach each glowing checkpoint before time runs out; every gate adds five seconds."
      : ghostRide
        ? "Race your personal best around the same figure-eight city circuit. Your best run is saved for next time."
        : "Pick a machine for three laps around the figure-eight downtown circuit.";
  startButtonText.nodeValue = climbing ? "START CLIMB " : checkpointRush ? "START RUSH " : ghostRide ? "START GHOST RIDE " : "START RACE ";
  for (const card of modeCards) {
    const selected = card.dataset.mode === mode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  }
  hillProgress = 0;
  hillLaneOffset = 0;
  lastCityCheckpointAngle = startAngle;
  lastHillRecoveryProgress = 0;
  activeGhostRecord = null;
  checkpointCount = 0;
  checkpointTimer = 20;
  checkpointTarget = checkpointSpacing;
  nextLapCheckpoint = 1;
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
    tireGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
  }
  hillProgress = 0;
  hillLaneOffset = 0;
  checkpointCount = 0;
  checkpointTimer = 20;
  checkpointTarget = checkpointSpacing;
  nextLapCheckpoint = 1;
  lastCityCheckpointAngle = startAngle;
  lastHillRecoveryProgress = 0;
  runPath = [];
  pathSampleRemaining = 0;
  setCarAtStart();
  carState.speed = 0;
  camera.position.copy(car.position).add(new THREE.Vector3(0, 8, gameMode === "hill" || gameMode === "checkpoint" ? 12 : 19));
  camera.lookAt(car.position);
  for (const opponent of opponents) {
    opponent.progress = opponent.startProgress;
    opponent.finished = false;
    opponent.finishTime = null;
    updateOpponentPose(opponent);
  }
  currentLap = 1;
  totalAngle = 0;
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

function recoverCarToLastCheckpoint() {
  carState.speed = 0;
  if (gameMode === "hill" || gameMode === "checkpoint") {
    hillProgress = lastHillRecoveryProgress;
    hillLaneOffset = 0;
    const progress = Math.min(hillProgress, hillLength - 0.001);
    const tangent = hillCurve.getTangentAt(progress / hillLength);
    car.position.copy(hillRoadPoint(hillProgress));
    carState.heading = Math.atan2(-tangent.x, -tangent.z);
    car.rotation.set(
      Math.asin(THREE.MathUtils.clamp(tangent.y, -1, 1)),
      carState.heading,
      0,
    );
  } else {
    car.position.copy(makeOvalPoint(lastCityCheckpointAngle));
    const tangent = trackTangent(lastCityCheckpointAngle);
    carState.heading = Math.atan2(-tangent.x, -tangent.z);
    const slope = (
      trackElevation(lastCityCheckpointAngle + 0.005) - trackElevation(lastCityCheckpointAngle - 0.005)
    ) / (0.01 * Math.hypot(tangent.x, tangent.z));
    car.rotation.set(Math.atan(slope), carState.heading, 0);
    const checkpointIndex = Math.round(
      (((lastCityCheckpointAngle - startAngle) % (Math.PI * 2)) + Math.PI * 2)
      / (Math.PI * 2 / lapCheckpointCount),
    ) % lapCheckpointCount;
    totalAngle = (Math.PI * 2 * checkpointIndex) / lapCheckpointCount;
  }
  camera.position.copy(car.position).add(new THREE.Vector3(
    0,
    8,
    gameMode === "hill" || gameMode === "checkpoint" ? 12 : 19,
  ));
  camera.lookAt(car.position);
  keys.clear();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (raceState === "paused") resumeRace();
    else if (startScreen.hidden && finishScreen.hidden) pauseRace();
    return;
  }
  if (event.key.toLowerCase() === "r") {
    if (["countdown", "go", "racing", "paused"].includes(raceState)) {
      event.preventDefault();
      recoverCarToLastCheckpoint();
    }
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
playButton.addEventListener("click", initializeAudio);
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
    tireGain = audioContext.createGain();
    cityAmbienceGain = audioContext.createGain();
    engineOscillator.type = "sawtooth";
    engineHarmonic.type = "triangle";
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 440;
    harmonicFilter.type = "lowpass";
    harmonicFilter.frequency.value = 900;
    const tireFilter = audioContext.createBiquadFilter();
    tireFilter.type = "bandpass";
    tireFilter.frequency.value = 1050;
    tireFilter.Q.value = 0.7;
    const cityFilter = audioContext.createBiquadFilter();
    cityFilter.type = "lowpass";
    cityFilter.frequency.value = 500;
    const distantTrafficFilter = audioContext.createBiquadFilter();
    distantTrafficFilter.type = "bandpass";
    distantTrafficFilter.frequency.value = 260;
    distantTrafficFilter.Q.value = 0.45;
    const makeNoiseSource = () => {
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        channel[i] = Math.random() * 2 - 1;
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      return source;
    };
    const cityNoise = makeNoiseSource();
    const trafficNoise = makeNoiseSource();
    engineGain.gain.value = 0;
    engineHarmonicGain.gain.value = 0;
    tireGain.gain.value = 0;
    cityAmbienceGain.gain.value = 0.008;
    const distantTrafficGain = audioContext.createGain();
    distantTrafficGain.gain.value = 0.004;
    engineOscillator.connect(engineFilter);
    engineHarmonic.connect(harmonicFilter);
    cityNoise.connect(cityFilter);
    cityFilter.connect(cityAmbienceGain);
    trafficNoise.connect(distantTrafficFilter);
    distantTrafficFilter.connect(distantTrafficGain);
    engineFilter.connect(engineGain);
    harmonicFilter.connect(engineHarmonicGain);
    tireGain.connect(tireFilter);
    tireFilter.connect(audioContext.destination);
    engineGain.connect(audioContext.destination);
    engineHarmonicGain.connect(audioContext.destination);
    cityAmbienceGain.connect(audioContext.destination);
    distantTrafficGain.connect(audioContext.destination);
    cityNoise.start();
    trafficNoise.start();
    engineOscillator.start();
    engineHarmonic.start();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function setDrivingAudio(engineLevel, tireLevel = 0) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  engineGain.gain.setTargetAtTime(engineLevel, now, 0.12);
  engineHarmonicGain.gain.setTargetAtTime(engineLevel * 0.4, now, 0.12);
  tireGain.gain.setTargetAtTime(tireLevel, now, 0.1);
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
    if (part.material) {
      part.material = part.material.clone();
      part.material.transparent = true;
      part.material.opacity = 0.58;
      part.material.emissive.set(0x0e6b7a);
      part.material.emissiveIntensity = 0.5;
      part.material.depthWrite = false;
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
  loadingLabel.textContent = gameMode === "checkpoint"
    ? "PREPARING THE DESERT PASS"
    : gameMode === "hill"
      ? "PREPARING THE MOUNTAIN PASS"
      : gameMode === "ghost"
        ? "PREPARING THE SUNSET CITY"
        : "PREPARING THE CITY";
  loading.hidden = false;
  loading.classList.remove("hidden");
  startScreen.hidden = true;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    createEnvironment(gameMode);
    const response = await fetch(`/api/records?mode=${encodeURIComponent(gameMode)}&vehicle=${encodeURIComponent(selectedVehicleId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load your saved runs.");
    activeGhostRecord = result.records.find((record) =>
      record.mode === gameMode && record.vehicle === selectedVehicleId
    ) || null;
    createGhostCar(vehicleCatalog[selectedVehicleId]);
    setGhostLabel(activeGhostRecord);
  } catch (error) {
    disposeEnvironment();
    loading.hidden = true;
    startScreen.hidden = false;
    runMessage.textContent = error.message;
    runMessage.hidden = false;
    startButton.disabled = false;
    for (const card of modeCards) card.disabled = false;
    for (const card of vehicleCards) card.disabled = false;
    return;
  }
  loading.hidden = true;
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
  setDrivingAudio(0);
  raceState = "ready";
  carState.speed = 0;
  disposeEnvironment();
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
  setDrivingAudio(0);
  pauseScreen.hidden = false;
  resumeButton.focus();
}

function resumeRace() {
  if (raceState !== "paused") return;
  raceState = pausedRaceState;
  pauseScreen.hidden = true;
  countdownDisplay.hidden = raceState === "racing";
  if (audioContext && raceState === "racing") setDrivingAudio(0.035);
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
      setDrivingAudio(0.035);
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
  setDrivingAudio(0);
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
  const tangent = trackTangent(angle);
  opponent.car.rotation.set(
    Math.atan2(trackElevation(angle + 0.005) - trackElevation(angle - 0.005), Math.hypot(tangent.x, tangent.z) * 0.01),
    Math.atan2(-tangent.x, -tangent.z),
    0,
  );
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
    const tangent = trackTangent(angle);
    const tangentLength = Math.hypot(tangent.x, tangent.z);
    const nextProgress = Math.min(
      Math.PI * 6,
      opponent.progress + (opponent.speed / tangentLength) * deltaTime,
    );
    const nextAngle = startAngle + nextProgress;
    const nextPosition = makeOvalPoint(nextAngle, opponent.laneOffset);
    if (isCityPathBlocked(opponent.car.position, nextPosition)) continue;

    opponent.progress = nextProgress;
    if (opponent.progress >= Math.PI * 6) {
      opponent.finished = true;
      opponent.finishTime = raceTime;
    }
    updateOpponentPose(opponent);
    animateCarWheels(opponent.car, opponent.speed * deltaTime);
  }
}

function updateLap() {
  if (carState.speed <= 0) return;
  const angle = startAngle + (Math.PI * 2 * nextLapCheckpoint) / lapCheckpointCount;
  const checkpoint = makeOvalPoint(angle);
  const distance = Math.hypot(car.position.x - checkpoint.x, car.position.z - checkpoint.z);
  if (distance > 12 || Math.abs(car.position.y - checkpoint.y) > 3.5) return;

  if (nextLapCheckpoint === 0) return;
  lastCityCheckpointAngle = angle;
  if (nextLapCheckpoint === lapCheckpointCount) {
    const lapTime = raceTime - lapStartedAt;
    bestLapTime = Math.min(bestLapTime, lapTime);
    lapStartedAt = raceTime;
    nextLapCheckpoint = 1;
    totalAngle = 0;
    if (currentLap === 3) {
      finishRace();
    } else {
      currentLap += 1;
      lapDisplay.textContent = String(currentLap).padStart(2, "0");
    }
    return;
  }
  totalAngle = (Math.PI * 2 * nextLapCheckpoint) / lapCheckpointCount;
  nextLapCheckpoint += 1;
}

function updateCheckpointRush() {
  if (carState.speed <= 0 || hillProgress < checkpointTarget) return;
  while (hillProgress >= checkpointTarget) {
    checkpointCount += 1;
    lastHillRecoveryProgress = checkpointTarget;
    checkpointTimer += 5;
    checkpointCountDisplay.textContent = String(checkpointCount);
    checkpointTimeDisplay.textContent = String(Math.ceil(checkpointTimer));
    if (checkpointTarget >= hillLength) {
      hillProgress = 0;
      lastHillRecoveryProgress = 0;
      checkpointTarget = checkpointSpacing;
      break;
    }
    checkpointTarget = Math.min(checkpointTarget + checkpointSpacing, hillLength);
  }
  positionCheckpointGate();
  playTone(640, 0.2);
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

function updateGhost(deltaTime) {
  if (!ghostCar || raceState !== "racing") return;
  if (!activeGhostRecord || !activeGhostRecord.path) {
    if (gameMode !== "ghost") return;
    const angle = findNearestTrackAngle(car.position.x, car.position.z, car.position.y) + 0.045;
    const position = makeOvalPoint(angle, 3.2);
    const tangent = trackTangent(angle);
    const previousX = ghostCar.position.x;
    const previousZ = ghostCar.position.z;
    if (!isCityPathBlocked(ghostCar.position, position)) ghostCar.position.copy(position);
    const slope = (
      trackElevation(angle + 0.005) - trackElevation(angle - 0.005)
    ) / (0.01 * Math.hypot(tangent.x, tangent.z));
    ghostCar.rotation.set(
      Math.atan(slope),
      Math.atan2(-tangent.x, -tangent.z),
      0,
    );
    ghostCar.visible = true;
    animateCarWheels(ghostCar, Math.hypot(ghostCar.position.x - previousX, ghostCar.position.z - previousZ));
    return;
  }
  const points = activeGhostRecord.path;
  if (points.length < 2) return;
  const progress = THREE.MathUtils.clamp(raceTime / activeGhostRecord.bestTime, 0, 1) * (points.length - 1);
  const firstIndex = Math.floor(progress);
  const secondIndex = Math.min(firstIndex + 1, points.length - 1);
  const fraction = progress - firstIndex;
  const first = points[firstIndex];
  const second = points[secondIndex];
  const previousX = ghostCar.position.x;
  const previousZ = ghostCar.position.z;
  const nextPosition = new THREE.Vector3(
    THREE.MathUtils.lerp(first.x, second.x, fraction),
    THREE.MathUtils.lerp(first.y, second.y, fraction),
    THREE.MathUtils.lerp(first.z, second.z, fraction),
  );
  const headingDelta = Math.atan2(Math.sin(second.heading - first.heading), Math.cos(second.heading - first.heading));
  if (!isCityPathBlocked(ghostCar.position, nextPosition)) {
    ghostCar.position.copy(nextPosition);
    ghostCar.rotation.y = first.heading + headingDelta * fraction;
  }
  if (ghostCar.visible) {
    const distance = Math.hypot(ghostCar.position.x - previousX, ghostCar.position.z - previousZ);
    animateCarWheels(ghostCar, distance);
  }
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

  if (gameMode === "hill" || gameMode === "checkpoint") {
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
    const nextLaneOffset = THREE.MathUtils.clamp(hillLaneOffset + steering * 7 * deltaTime, -5.3, 5.3);
    const nextProgress = racing
      ? Math.min(hillLength, hillProgress + carState.speed * deltaTime)
      : hillProgress;
    const safeProgress = Math.min(nextProgress, hillLength - 0.001);
    const safePosition = hillRoadPoint(safeProgress, nextLaneOffset);
    if (!isPathBlocked(
      car.position,
      safePosition,
      (_x, _z, fraction) => THREE.MathUtils.lerp(car.position.y, safePosition.y, fraction),
    )) {
      hillProgress = nextProgress;
      hillLaneOffset = nextLaneOffset;
    } else {
      carState.speed *= 0.25;
    }
    const progress = Math.min(hillProgress, hillLength - 0.001);
    const tangent = hillCurve.getTangentAt(progress / hillLength);
    const slopeAngle = Math.asin(THREE.MathUtils.clamp(tangent.y, -1, 1));
    forward.copy(tangent);
    car.position.copy(hillRoadPoint(progress, hillLaneOffset));
    carState.heading = Math.atan2(-tangent.x, -tangent.z);
    const steeringStrength = THREE.MathUtils.clamp(carState.speed / 9, 0, 1);
    car.rotation.set(slopeAngle, carState.heading, -steering * steeringStrength * 0.065);
    if (gameMode === "hill") {
      lastHillRecoveryProgress = Math.floor(hillProgress / checkpointSpacing) * checkpointSpacing;
      const progressPercent = Math.floor((hillProgress / hillLength) * 100);
      hillProgressDisplay.textContent = String(progressPercent);
      hillProgressFill.style.width = `${progressPercent}%`;
      if (hillProgress >= hillLength) finishRace();
    }
  } else {
    if (racing && throttle) carState.speed += vehicle.acceleration * deltaTime;
    else if (racing && brake) carState.speed -= 37 * deltaTime;
    else carState.speed *= Math.exp(-0.85 * deltaTime);
    carState.speed = THREE.MathUtils.clamp(carState.speed, -15, maxSpeed);
    if (!racing || (Math.abs(carState.speed) < 0.08 && !throttle && !brake)) carState.speed = 0;

    const steeringStrength = THREE.MathUtils.clamp(Math.abs(carState.speed) / 9, 0, 1);
    carState.heading -= steering * steeringStrength * vehicle.handling * 1.8 * deltaTime * Math.sign(carState.speed || 1);
    forward.set(-Math.sin(carState.heading), 0, -Math.cos(carState.heading));
    const collided = moveCarWithCollisions(
      car,
      forward.x * carState.speed * deltaTime,
      forward.z * carState.speed * deltaTime,
      (x, z) => {
        const roadPosition = getCityRoadPosition(x, z, car.position.y);
        return roadPosition.distance <= trackWidth + 2 ? roadPosition.point.y : 0;
      },
    );
    if (collided) carState.speed *= 0.25;
    car.rotation.y = carState.heading;
    car.rotation.z = -steering * steeringStrength * 0.065;
    const { angle: roadAngle, point: roadPoint, distance: roadDistance } = getCityRoadPosition(
      car.position.x,
      car.position.z,
      car.position.y,
    );
    if (roadDistance <= trackWidth + 2) {
      const tangent = trackTangent(roadAngle);
      const sampleAngle = 0.005;
      const slope = (
        trackElevation(roadAngle + sampleAngle) - trackElevation(roadAngle - sampleAngle)
      ) / (sampleAngle * 2 * Math.hypot(tangent.x, tangent.z));
      car.position.y = roadPoint.y;
      car.rotation.x = Math.atan(slope);
    } else {
      car.position.y = 0;
      car.rotation.x = Math.sin(clock.elapsedTime * 2.4) * Math.min(Math.abs(carState.speed) / maxSpeed, 1) * 0.008;
    }
  }
  animateCarWheels(car, carState.speed * deltaTime, steering);

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
    tireGain.gain.setTargetAtTime(
      speedFraction * (Math.abs(steering) > 0 ? 0.025 + Math.abs(steering) * 0.025 : 0.0015),
      audioContext.currentTime,
      0.1,
    );
  } else if (audioContext) {
    tireGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
  }
  if (racing && (gameMode === "circuit" || gameMode === "ghost")) updateLap();
  if (racing && gameMode === "checkpoint") updateCheckpointRush();
  if (gameMode === "circuit" && (raceState === "racing" || raceState === "finished")) updateOpponents(deltaTime);
  if (gameMode === "circuit") updatePosition();
  sampleRunPath(deltaTime);
  updateGhost(deltaTime);

  cameraTarget.copy(car.position);
  const mountainMode = gameMode === "hill" || gameMode === "checkpoint";
  cameraTarget.y += mountainMode ? 5 : 3.8;
  cameraDesired.copy(car.position).addScaledVector(forward, mountainMode ? -15 : -11);
  cameraDesired.y += mountainMode ? 8 : 6.8;
  camera.position.lerp(cameraDesired, 1 - Math.exp(-4.2 * deltaTime));
  camera.lookAt(cameraTarget);
}

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  update(deltaTime);
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

animate();

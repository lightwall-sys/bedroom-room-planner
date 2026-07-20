const MODEL = window.BEDROOM_MODEL;
const C = {
  dusted_fondant: "#c3b3b8",
  raspberry_diva: "#b27782",
  wall_white: "#f1efeb",
  trim_white: "#fffdfa",
  floor_placeholder: "#c2bbb3",
  glass: "#a9d5e8",
  heater: "#ddd9d2",
  fixture: "#efece6",
  dark_detail: "#5c5f62",
  mattress: "#efebe6",
  bed_white: "#f7f5ef",
  bed_ash: "#c7aa7e",
  metal: "#9ea2a6",
};
const POLY = [
  [0, 0],
  [320.04, 0],
  [320.04, 205.74],
  [369.57, 205.74],
  [369.57, 339.09],
  [0, 339.09],
];
const D = {
  W1: 320.04,
  W2: 205.74,
  W5: 369.57,
  W6: 339.09,
  H: 229.235,
  window: {
    left_from_w56: 114.3,
    w: 172.72,
    h: 99.06,
    top: 206.25,
    bottom: 107.19,
  },
  bed: { w: 160, l: 210, gap: 2 },
};
const BASE_CENTER = { x: D.W1 / 2, z: D.bed.gap + D.bed.l / 2 };
const stage = document.getElementById("stage");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe3dfd9);
scene.fog = new THREE.Fog(0xe3dfd9, 760, 1320);
const camera = new THREE.PerspectiveCamera(
  34,
  innerWidth / innerHeight,
  1,
  2500,
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
  alpha: false,
  depth: true,
  stencil: false,
});
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 0.96;
renderer.autoClear = true;
stage.appendChild(renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 180;
controls.maxDistance = 1150;
controls.maxPolarAngle = Math.PI * 0.495;
controls.screenSpacePanning = true;
controls.enableKeys = false;

function texture(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  if (kind === "ash") {
    x.fillStyle = "#c7aa7e";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 190; i++) {
      const y = Math.random() * 256;
      x.strokeStyle = `rgba(${72 + Math.random() * 42},${50 + Math.random() * 34},${29 + Math.random() * 25},${0.025 + Math.random() * 0.055})`;
      x.lineWidth = 0.45 + Math.random() * 1.25;
      x.beginPath();
      x.moveTo(0, y);
      for (let q = 0; q <= 256; q += 16)
        x.lineTo(q, y + Math.sin(q * 0.024 + i) * 2.7 + Math.random() * 1.7);
      x.stroke();
    }
  }
  if (kind === "carpet") {
    x.fillStyle = "#bdb6ad";
    x.fillRect(0, 0, 256, 256);
    const im = x.getImageData(0, 0, 256, 256);
    for (let i = 0; i < im.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 15;
      im.data[i] += n;
      im.data[i + 1] += n;
      im.data[i + 2] += n;
    }
    x.putImageData(im, 0, 0);
  }
  if (kind === "oak") {
    x.fillStyle = "#caa77b";
    x.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 64) {
      x.fillStyle =
        y % 128 === 0 ? "rgba(255,255,255,.05)" : "rgba(50,30,14,.035)";
      x.fillRect(0, y, 256, 64);
      x.strokeStyle = "rgba(70,43,22,.18)";
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(256, y);
      x.stroke();
    }
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * 256;
      x.strokeStyle = "rgba(86,52,25,.09)";
      x.beginPath();
      x.moveTo(0, y);
      for (let q = 0; q < 256; q += 12)
        x.lineTo(q, y + Math.sin(q * 0.035 + i) * 2);
      x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const ash = texture("ash"),
  carpet = texture("carpet"),
  oak = texture("oak");
ash.repeat.set(3, 8);
carpet.repeat.set(7, 7);
oak.repeat.set(3, 5);
const materialCache = {};
function baseMaterial(i) {
  const k = i.category + "|" + i.color_key;
  if (materialCache[k] && i.category !== "wall") return materialCache[k];
  const base = new THREE.Color(C[i.color_key] || "#eee");
  const p = { color: base.clone(), roughness: 0.84, metalness: 0 };
  if (i.category === "wall") {
    // Deliberately plain paint: no generated texture, low specular response and
    // material dithering to avoid visible colour steps on large flat surfaces.
    p.color = new THREE.Color(C.wall_white);
    p.roughness = 1;
    p.metalness = 0;
    p.side = THREE.DoubleSide;
    p.emissive = new THREE.Color(C.wall_white);
    p.emissiveIntensity = 0.022;
    p.dithering = true;
  }
  if (i.category === "trim" || i.category === "fixture") p.roughness = 0.76;
  if (i.category === "detail") {
    p.roughness = 0.55;
    p.metalness = 0.035;
  }
  if (i.category === "glass") {
    p.transparent = true;
    p.opacity = 0.28;
    p.roughness = 0.08;
    p.side = THREE.DoubleSide;
    p.depthWrite = false;
  }
  if (i.category === "bed" || i.category === "bed_detail") {
    p.map = ash;
    p.color = new THREE.Color(0xffffff);
    p.roughness = 0.78;
    p.emissive = new THREE.Color("#4f3825");
    p.emissiveIntensity = 0.012;
  }
  if (i.category === "mattress") {
    p.color = new THREE.Color("#eeeae3");
    p.roughness = 1;
  }
  const m = new THREE.MeshStandardMaterial(p);
  if (i.category === "wall") {
    // Render both faces for cutaway viewing, but use one controlled face when
    // writing the shadow map. This prevents double-sided self-shadow striping.
    m.shadowSide = THREE.FrontSide;
  }
  if (i.category !== "wall") materialCache[k] = m;
  return m;
}
function wallNumber(name) {
  if (/^Wall_1/.test(name)) return 1;
  if (/^Wall_2/.test(name)) return 2;
  if (/^Wall_3/.test(name)) return 3;
  if (/^Wall_4/.test(name)) return 4;
  if (/^Wall_5/.test(name)) return 5;
  if (/^Wall_6/.test(name)) return 6;
  return null;
}
function portalGroup(name) {
  if (/^(Wall_1|Skirting_W1|Coving_W1)/.test(name)) return "w1";
  if (/^(Wall_5|Skirting_W5|Coving_W5|Wall5_)/.test(name)) return "w5";
  if (
    /^(Wall_6|Skirting_W6|Coving_W6|Window_|Curtain_|Storage_Heater|Heater_|Airbrick_|Corner_Trunking)/.test(
      name,
    )
  )
    return "w6";
  if (
    /^(Wall_2|Wall_3|Wall_4|Skirting_W2|Skirting_W3|Skirting_W4|Coving_W2|Coving_W3|Coving_W4|Door_|Wall2_|Wall3_)/.test(
      name,
    )
  )
    return "w234";
  return null;
}
const roomGroup = new THREE.Group(),
  bedGroup = new THREE.Group();
scene.add(roomGroup, bedGroup);
const bedMeshes = [],
  wallMeshes = [],
  portalMeshes = { w1: [], w234: [], w5: [], w6: [] };

function modelSection(name) {
  if (/^(Wall_1|Skirting_W1|Coving_W1)/.test(name)) return 1;
  if (/^(Wall_2|Skirting_W2|Coving_W2|Wall2_)/.test(name)) return 2;
  if (/^(Wall_3|Skirting_W3|Coving_W3|Wall3_)/.test(name)) return 3;
  if (/^(Wall_4|Skirting_W4|Coving_W4|Door_)/.test(name)) return 4;
  if (/^(Wall_5|Skirting_W5|Coving_W5|Wall5_)/.test(name)) return 5;
  if (/^(Wall_6|Skirting_W6|Coving_W6|Window_|Curtain_|Storage_Heater|Heater_|Airbrick_|Corner_Trunking)/.test(name)) return 6;
  return 0;
}
function shouldSkipModelPart(part) {
  return part.category === "floor" || /^(Storage_Heater$|Heater_Grille_|Heater_Switch_)/.test(part.name);
}
const modelBatches = new Map();
for (const part of MODEL) {
  if (shouldSkipModelPart(part)) continue;
  const isBed = ["bed", "bed_detail", "mattress"].includes(part.category);
  const section = isBed ? 0 : modelSection(part.name);
  const wallNo = part.category === "wall" ? wallNumber(part.name) || 0 : 0;
  const key = [isBed ? "bed" : "room", section, wallNo, part.category, part.color_key, part.alpha].join("|");
  if (!modelBatches.has(key)) modelBatches.set(key, { parts: [], isBed, section, wallNo, source: part });
  modelBatches.get(key).parts.push(part);
}
for (const [key, batch] of modelBatches) {
  const positions = [];
  const indices = [];
  let vertexOffset = 0;
  for (const part of batch.parts) {
    const verts = part.vertices;
    for (let q = 0; q < verts.length; q += 3) {
      positions.push(
        verts[q] - (batch.isBed ? BASE_CENTER.x : 0),
        verts[q + 1],
        verts[q + 2] - (batch.isBed ? BASE_CENTER.z : 0),
      );
    }
    for (const index of part.indices) indices.push(index + vertexOffset);
    vertexOffset += verts.length / 3;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  let material = baseMaterial(batch.source);
  if (batch.source.category === "wall") material = material.clone();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `Batch_${batch.isBed ? "Bed" : "Room"}_${key.replace(/[^a-z0-9]+/gi, "_")}`;
  mesh.userData.category = batch.source.category;
  mesh.userData.wallSection = batch.section;
  mesh.castShadow = batch.source.category !== "glass";
  mesh.receiveShadow = batch.source.category !== "glass";
  if (batch.isBed) {
    bedGroup.add(mesh);
    bedMeshes.push(mesh);
  } else {
    roomGroup.add(mesh);
  }
  if (batch.wallNo) {
    mesh.userData.wallNumber = batch.wallNo;
    wallMeshes.push(mesh);
  }
}

// Replace the generic storage-heater block with a dimension-matched Dimplex Quantum casing.
// The measured room object is approximately 105.4 x 73.7 x 19.1 cm; the nearest official
// Quantum casing is 106.9 x 73.0 x 18.5 cm (used by QM125RF and QM150RF).
for (const m of [...roomGroup.children]) {
  if (/^(Storage_Heater$|Heater_Grille_|Heater_Switch_)/.test(m.name)) {
    roomGroup.remove(m);
    m.geometry?.dispose();
  }
}
const quantumHeater = new THREE.Group();
quantumHeater.name = "Storage_Heater_Quantum_1069";
const qWhite = new THREE.MeshStandardMaterial({
  color: 0xf0efeb,
  roughness: 0.7,
  metalness: 0.02,
});
const qEdge = new THREE.MeshStandardMaterial({
  color: 0xd6d5d1,
  roughness: 0.72,
});
const qDark = new THREE.MeshStandardMaterial({
  color: 0x4f5254,
  roughness: 0.48,
  metalness: 0.05,
});
const qScreen = new THREE.MeshStandardMaterial({
  color: 0x202426,
  roughness: 0.18,
  metalness: 0.18,
  emissive: 0x15202a,
  emissiveIntensity: 0.16,
});
const qBuckets = new Map();
function qPart(name, geometry, material, x, y, z) {
  // Three.js r124 still returns legacy Geometry for classes such as BoxGeometry.
  // The batching path below requires BufferGeometry, so normalise every part here.
  if (!geometry?.isBufferGeometry) {
    const legacyGeometry = geometry;
    geometry = new THREE.BufferGeometry().fromGeometry(legacyGeometry);
    legacyGeometry?.dispose?.();
  }
  if (!qBuckets.has(material)) qBuckets.set(material, []);
  qBuckets.get(material).push({ name, geometry, x, y, z });
}
const qBaseY = 7.62,
  qCentreZ = (76.2 + 181.61) / 2,
  qW = 106.9,
  qH = 73,
  qD = 18.5;
qPart(
  "Main_Case",
  new THREE.BoxGeometry(qD - 1.4, 58, qW - 1.8),
  qWhite,
  qD / 2 - 0.7,
  qBaseY + 38.5,
  qCentreZ,
);
qPart(
  "Top_Cap",
  new THREE.BoxGeometry(qD - 1.0, 7.2, qW),
  qEdge,
  qD / 2 - 0.5,
  qBaseY + 69.4,
  qCentreZ,
);
qPart(
  "Front_Panel",
  new THREE.BoxGeometry(1.2, 48.5, qW - 5.2),
  qWhite,
  qD - 0.1,
  qBaseY + 42.2,
  qCentreZ,
);
qPart(
  "Lower_Grille_Back",
  new THREE.BoxGeometry(1.0, 12.8, qW - 3.5),
  qDark,
  qD - 0.05,
  qBaseY + 13.8,
  qCentreZ,
);
for (let i = 0; i < 6; i++)
  qPart(
    "Lower_Grille_" + i,
    new THREE.BoxGeometry(0.75, 0.72, qW - 5.1),
    qEdge,
    qD + 0.48,
    qBaseY + 9.2 + i * 2.05,
    qCentreZ,
  );
for (let i = 0; i < 8; i++) {
  const z = qCentreZ - qW * 0.39 + i * ((qW * 0.78) / 7);
  qPart(
    "Front_Rib_" + i,
    new THREE.BoxGeometry(0.55, 39, 0.72),
    qEdge,
    qD + 0.48,
    qBaseY + 43,
    z,
  );
}
qPart(
  "Left_End",
  new THREE.BoxGeometry(qD, 61, 2.1),
  qEdge,
  qD / 2,
  qBaseY + 38.5,
  qCentreZ - qW / 2 + 1.05,
);
qPart(
  "Right_End",
  new THREE.BoxGeometry(qD, 61, 2.1),
  qEdge,
  qD / 2,
  qBaseY + 38.5,
  qCentreZ + qW / 2 - 1.05,
);
for (const side of [-1, 1])
  for (let i = 0; i < 3; i++)
    qPart(
      "Side_Vent_" + side + "_" + i,
      new THREE.BoxGeometry(4.1, 0.8, 0.6),
      qDark,
      qD - 2.7,
      qBaseY + 57 + i * 2.15,
      qCentreZ + side * (qW / 2 + 0.02),
    );
for (const z of [qCentreZ - 35, qCentreZ + 35])
  qPart(
    "Foot",
    new THREE.BoxGeometry(11, 7.2, 8.2),
    qEdge,
    7.2,
    qBaseY + 3.6,
    z,
  );
qPart(
  "Control_Pod",
  new THREE.BoxGeometry(12.5, 2.8, 18),
  qEdge,
  8.8,
  qBaseY + 71.1,
  qCentreZ + 40.1,
);
qPart(
  "Control_Display",
  new THREE.BoxGeometry(5.8, 0.8, 8.8),
  qScreen,
  9.8,
  qBaseY + 72.65,
  qCentreZ + 40.1,
);
for (const [material, parts] of qBuckets) {
  const positions = [];
  const normals = [];
  const indices = [];
  let vertexOffset = 0;
  for (const part of parts) {
    const position = part.geometry.getAttribute("position");
    const normal = part.geometry.getAttribute("normal");
    for (let i = 0; i < position.count; i++) {
      positions.push(
        position.getX(i) + part.x,
        position.getY(i) + part.y,
        position.getZ(i) + part.z,
      );
      normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
    }
    if (part.geometry.index) {
      for (let i = 0; i < part.geometry.index.count; i++)
        indices.push(part.geometry.index.getX(i) + vertexOffset);
    } else {
      for (let i = 0; i < position.count; i++) indices.push(i + vertexOffset);
    }
    vertexOffset += position.count;
    part.geometry.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Storage_Heater_Quantum_Batch";
  mesh.userData.wallSection = 6;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  quantumHeater.add(mesh);
}
quantumHeater.userData.wallSection = 6;
roomGroup.add(quantumHeater);

const floorShape = new THREE.Shape();
POLY.forEach((p, i) =>
  i ? floorShape.lineTo(p[0], p[1]) : floorShape.moveTo(p[0], p[1]),
);
const floorGeometry = new THREE.ShapeGeometry(floorShape);
floorGeometry.rotateX(Math.PI / 2);
const floorMaterial = new THREE.MeshStandardMaterial({
  map: carpet,
  color: 0xffffff,
  roughness: 1,
  side: THREE.DoubleSide,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = 0.05;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(800, 80, 0x827a73, 0xb8b0a8);
grid.position.set(D.W5 / 2, 0.45, D.W6 / 2);
for (const m of Array.isArray(grid.material)
  ? grid.material
  : [grid.material]) {
  m.transparent = true;
  m.opacity = 0.22;
  m.depthWrite = false;
}
scene.add(grid);

const sky = document.createElement("canvas");
sky.width = 512;
sky.height = 320;
const sx = sky.getContext("2d");
const skyTexture = new THREE.CanvasTexture(sky);
skyTexture.encoding = THREE.sRGBEncoding;
const windowZ = D.W6 - (D.window.left_from_w56 + D.window.w / 2),
  outside = new THREE.Mesh(
    new THREE.PlaneGeometry(D.window.w - 6, D.window.h - 6),
    new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
outside.rotation.y = Math.PI / 2;
outside.position.set(-7, (D.window.bottom + D.window.top) / 2, windowZ);
scene.add(outside);
portalMeshes.w6.push(outside);

const ambient = new THREE.AmbientLight(0xfffbf5, 0.06);
scene.add(ambient);
const daylight = new THREE.SpotLight(
  0xe7f2ff,
  1.1,
  980,
  Math.PI * 0.3,
  0.62,
  1.15,
);
daylight.position.set(-230, 245, windowZ);
daylight.target.position.set(155, 88, windowZ);
daylight.castShadow = true;
daylight.shadow.mapSize.set(2048, 2048);
daylight.shadow.camera.near = 20;
daylight.shadow.camera.far = 980;
daylight.shadow.bias = 0.00018;
daylight.shadow.normalBias = 0.55;
scene.add(daylight, daylight.target);
const overheadLight = new THREE.SpotLight(
  0xffc982,
  1.35,
  620,
  Math.PI * 0.43,
  0.68,
  1.35,
);
overheadLight.position.set(D.W1 / 2, D.H - 28, D.W6 / 2);
overheadLight.target.position.set(D.W1 / 2, 35, D.W6 / 2);
overheadLight.castShadow = true;
overheadLight.shadow.mapSize.set(1024, 1024);
overheadLight.shadow.camera.near = 5;
overheadLight.shadow.camera.far = 640;
overheadLight.shadow.bias = 0.00022;
overheadLight.shadow.normalBias = 0.48;
scene.add(overheadLight, overheadLight.target);
const ceilingBlocker = new THREE.Mesh(
  new THREE.BoxGeometry(D.W5 + 36, 5, D.W6 + 36),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    colorWrite: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
);
ceilingBlocker.position.set(D.W5 / 2, D.H + 2, D.W6 / 2);
ceilingBlocker.castShadow = true;
ceilingBlocker.receiveShadow = false;
scene.add(ceilingBlocker);

const lightingState = { time: 14, daylightLevel: 1.1, overheadLevel: 1.35 };
const timeCycle = [6.5, 9, 12.5, 16, 19.5, 22];
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function formatTime(hours) {
  let total = Math.round(hours * 60),
    h = Math.floor(total / 60) % 24,
    m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function colourAt(stops, hours) {
  if (hours <= stops[0][0]) return new THREE.Color(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (hours <= stops[i][0]) {
      const a = stops[i - 1],
        b = stops[i],
        t = (hours - a[0]) / (b[0] - a[0]);
      return new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), t);
    }
  }
  return new THREE.Color(stops[stops.length - 1][1]);
}
function numberAt(stops, hours) {
  if (hours <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (hours <= stops[i][0]) {
      const a = stops[i - 1],
        b = stops[i],
        t = (hours - a[0]) / (b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * t;
    }
  }
  return stops[stops.length - 1][1];
}
function timeLabel(h) {
  if (h < 7.5) return "Dawn";
  if (h < 11) return "Morning";
  if (h < 14.5) return "Midday";
  if (h < 18) return "Afternoon";
  if (h < 20.75) return "Sunset";
  return "Night";
}
function repaintSky(hours) {
  const top = colourAt(
      [
        [6, "#667e9c"],
        [8.5, "#9fc2d8"],
        [12.5, "#bddbea"],
        [16.5, "#a7c8dc"],
        [19.5, "#716f91"],
        [22, "#172235"],
      ],
      hours,
    ),
    mid = colourAt(
      [
        [6, "#c38f91"],
        [8.5, "#dce7e9"],
        [12.5, "#e8f2f1"],
        [16.5, "#e2d8cf"],
        [19.5, "#c47e79"],
        [22, "#29354a"],
      ],
      hours,
    ),
    horizon = colourAt(
      [
        [6, "#f0a16f"],
        [8.5, "#d7dfc7"],
        [12.5, "#94aa88"],
        [16.5, "#b7aa86"],
        [19.5, "#ef985f"],
        [22, "#253b40"],
      ],
      hours,
    );
  const grad = sx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, `#${top.getHexString()}`);
  grad.addColorStop(0.56, `#${mid.getHexString()}`);
  grad.addColorStop(1, `#${horizon.getHexString()}`);
  sx.fillStyle = grad;
  sx.fillRect(0, 0, 512, 320);
  const night = clamp01((hours - 19.5) / 2.5);
  if (night > 0.08) {
    for (let i = 0; i < 38; i++) {
      const x = (i * 79) % 503,
        y = 12 + ((i * 47) % 165),
        r = 0.45 + ((i * 11) % 7) / 10;
      sx.fillStyle = `rgba(255,248,224,${night * (0.18 + ((i * 13) % 6) / 16)})`;
      sx.beginPath();
      sx.arc(x, y, r, 0, Math.PI * 2);
      sx.fill();
    }
  }
  for (let i = 0; i < 34; i++) {
    const seed = (i * 91) % 511,
      height = 218 + ((i * 37) % 102),
      radius = 18 + ((i * 23) % 54);
    sx.fillStyle = `rgba(38,72,42,${0.05 + ((i * 17) % 8) / 100})`;
    sx.beginPath();
    sx.arc(seed, height, radius, 0, Math.PI * 2);
    sx.fill();
  }
  skyTexture.needsUpdate = true;
}
function applyTimeOfDay(hours, announce = false) {
  hours = Math.max(6, Math.min(22, Number(hours) || 14));
  lightingState.time = hours;
  const sunT = clamp01((hours - 6) / 13.5),
    arc = Math.sin(Math.PI * sunT),
    dayFactor = numberAt(
      [
        [6, 0.18],
        [8.5, 0.78],
        [12.5, 1],
        [16.5, 0.82],
        [19.5, 0.24],
        [22, 0.025],
      ],
      hours,
    );
  daylight.position.set(
    -235,
    45 + Math.pow(Math.max(0, arc), 0.72) * 325,
    -105 + sunT * (D.W6 + 210),
  );
  daylight.target.position.set(D.W1 * 0.52, 84, windowZ + (sunT - 0.5) * 45);
  daylight.color.copy(
    colourAt(
      [
        [6, "#ff9a62"],
        [8.5, "#ffd2aa"],
        [12.5, "#e7f2ff"],
        [16.5, "#ffd9ae"],
        [19.5, "#ff8858"],
        [22, "#7082aa"],
      ],
      hours,
    ),
  );
  daylight.intensity = lightingState.daylightLevel * dayFactor;
  ambient.color.copy(
    colourAt(
      [
        [6, "#c8a5a0"],
        [12.5, "#fffaf2"],
        [19.5, "#b7979d"],
        [22, "#67718a"],
      ],
      hours,
    ),
  );
  ambient.intensity = 0.025 + 0.065 * dayFactor;
  const bg = colourAt(
    [
      [6, "#b7aaa5"],
      [9, "#ddd9d3"],
      [12.5, "#e3dfd9"],
      [17, "#d8d1c9"],
      [19.5, "#a9999a"],
      [22, "#555d70"],
    ],
    hours,
  );
  scene.background.copy(bg);
  scene.fog.color.copy(bg);
  renderer.toneMappingExposure = 0.84 + 0.12 * dayFactor;
  repaintSky(hours);
  const formatted = formatTime(hours),
    label = timeLabel(hours);
  document.getElementById("timeSlider").value = String(hours);
  document.getElementById("timeValue").textContent = formatted;
  document.getElementById("timeFact").textContent = formatted;
  document.getElementById("lightingLabel").textContent =
    `Warm overhead + ${label.toLowerCase()} daylight`;
  const orb = document.getElementById("lightingOrb");
  if (orb) {
    const c = `#${daylight.color.getHexString()}`;
    orb.style.background = `radial-gradient(circle,#fff8d9 0,#efc782 30%,${c} 67%,rgba(0,0,0,0) 76%)`;
  }
  document
    .querySelectorAll("[data-time]")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        Math.abs(Number(b.dataset.time) - hours) < 0.01,
      ),
    );
  if (announce) toast(`${label} lighting · ${formatted}`);
}
function cycleTimeOfDay() {
  let idx = timeCycle.findIndex((v) => v > lightingState.time + 0.05);
  if (idx < 0) idx = 0;
  applyTimeOfDay(timeCycle[idx], true);
}

const lightFittingGroup = new THREE.Group();
lightFittingGroup.position.set(D.W1 / 2, D.H, D.W6 / 2);
scene.add(lightFittingGroup);
function fittingMaterial(color, extra = {}) {
  return new THREE.MeshStandardMaterial(
    Object.assign({ color, roughness: 0.6, metalness: 0 }, extra),
  );
}
function addFitMesh(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  lightFittingGroup.add(m);
  return m;
}
function setLightFitting(kind) {
  state.lightFitting = kind;
  while (lightFittingGroup.children.length)
    lightFittingGroup.remove(lightFittingGroup.children[0]);
  const brass = fittingMaterial(0xb18a4d, { metalness: 0.55, roughness: 0.35 }),
    white = fittingMaterial(0xf4f1e9),
    bamboo = fittingMaterial(0xb9935e, { roughness: 0.78 }),
    glass = fittingMaterial(0xd9d4ca, {
      transparent: true,
      opacity: 0.42,
      roughness: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  if (kind === "barlast") {
    addFitMesh(
      new THREE.CylinderGeometry(12.5, 12.5, 6.7, 32),
      white,
      0,
      -3.35,
      0,
    );
    overheadLight.position.y = D.H - 15;
  } else if (kind === "solklint") {
    addFitMesh(new THREE.CylinderGeometry(8, 8, 4, 24), brass, 0, -2, 0);
    addFitMesh(
      new THREE.SphereGeometry(13.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.72),
      glass,
      0,
      -11,
      0,
    );
    overheadLight.position.y = D.H - 25;
  } else if (kind === "vindkast") {
    const cloud = fittingMaterial(0xf5f2ed, {
      transparent: true,
      opacity: 0.88,
      roughness: 1,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2,
        r = 8 + Math.sin(i * 2.3) * 5;
      addFitMesh(
        new THREE.SphereGeometry(9 + ((i * 7) % 5), 14, 10),
        cloud,
        Math.cos(a) * r,
        -18 + Math.sin(i) * 5,
        Math.sin(a) * r,
      );
    }
    addFitMesh(new THREE.CylinderGeometry(0.45, 0.45, 18, 8), white, 0, -6, 0);
    overheadLight.position.y = D.H - 37;
  } else {
    addFitMesh(new THREE.CylinderGeometry(0.45, 0.45, 18, 8), white, 0, -9, 0);
    addFitMesh(
      new THREE.CylinderGeometry(16, 22.5, 40, 18, 1, true),
      fittingMaterial(0xb9935e, {
        transparent: true,
        opacity: 0.72,
        roughness: 0.8,
        side: THREE.DoubleSide,
      }),
      0,
      -38,
      0,
    );
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 42, 6),
        bamboo,
      );
      strut.position.set(Math.cos(a) * 19, -38, Math.sin(a) * 19);
      strut.rotation.z = Math.sin(a) * 0.13;
      strut.rotation.x = Math.cos(a) * 0.13;
      strut.castShadow = true;
      lightFittingGroup.add(strut);
    }
    overheadLight.position.y = D.H - 55;
  }
  overheadLight.intensity = lightingState.overheadLevel;
  const selector = document.getElementById("lightFitting");
  if (selector) selector.value = kind;
  requestRender(true);
}

// Door swing sector: hinge at the open-door end, radius includes a 10 cm margin.
const hinge = { x: 369.57, z: 319.56 },
  doorRadius = 104;
const doorPts = [[hinge.x, hinge.z]];
for (let i = 0; i <= 32; i++) {
  const a = -Math.PI / 2 - (Math.PI / 2) * (i / 32);
  doorPts.push([
    hinge.x + doorRadius * Math.cos(a),
    hinge.z + doorRadius * Math.sin(a),
  ]);
}
const doorShape = new THREE.Shape();
doorPts.forEach((p, i) =>
  i ? doorShape.lineTo(p[0], p[1]) : doorShape.moveTo(p[0], p[1]),
);
doorShape.closePath();
const doorSweep = new THREE.Mesh(
  new THREE.ShapeGeometry(doorShape),
  new THREE.MeshBasicMaterial({
    color: 0xb65e50,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
);
doorSweep.geometry.rotateX(Math.PI / 2);
doorSweep.position.y = 0.55;
scene.add(doorSweep);

// Intelligent camera cutaway. Walls remain complete until they genuinely block a sight line.
let currentView = "design";
let state = {
  x: BASE_CENTER.x,
  z: BASE_CENTER.z,
  rotation: 0,
  snap: true,
  gridSize: 5,
  showGrid: true,
  accentFollow: true,
  accentWall: 1,
  accentColour: "dusted_fondant",
  presetWall: 1,
  wallMode: "cutaway",
  floor: "carpet",
  quality: "adaptive",
  lightFitting: "solklint",
};
const wallSections = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
function sectionNumber(name) {
  if (/^(Wall_1|Skirting_W1|Coving_W1)/.test(name)) return 1;
  if (/^(Wall_2|Skirting_W2|Coving_W2|Wall2_)/.test(name)) return 2;
  if (/^(Wall_3|Skirting_W3|Coving_W3|Wall3_)/.test(name)) return 3;
  if (/^(Wall_4|Skirting_W4|Coving_W4|Door_)/.test(name)) return 4;
  if (/^(Wall_5|Skirting_W5|Coving_W5|Wall5_)/.test(name)) return 5;
  if (
    /^(Wall_6|Skirting_W6|Coving_W6|Window_|Curtain_|Storage_Heater|Heater_|Airbrick_|Corner_Trunking)/.test(
      name,
    )
  )
    return 6;
  return null;
}
roomGroup.traverse((m) => {
  if (!m.isMesh) return;
  const n = m.userData.wallSection || sectionNumber(m.name);
  if (n) wallSections[n].push(m);
});
wallSections[6].push(outside);
let lastCutawayKey = "",
  lastCutawaySide = "w5";
const cutawaySections = {
  w1: [1],
  w234: [2, 3, 4],
  w5: [5],
  w6: [6],
};
function directionalCutawaySide() {
  // Use the camera-to-target direction rather than camera height. Looking down
  // from above must never be interpreted as a request to remove every wall.
  const dx = (camera.position.x - controls.target.x) / (D.W5 / 2),
    dz = (camera.position.z - controls.target.z) / (D.W6 / 2),
    ax = Math.abs(dx),
    az = Math.abs(dz),
    xSide = dx < 0 ? "w6" : "w234",
    zSide = dz < 0 ? "w1" : "w5",
    lastAxis = lastCutawaySide === "w6" || lastCutawaySide === "w234" ? "x" : "z",
    axisHysteresis = 0.14,
    signDeadZone = 0.055;

  // Keep the current axis close to the diagonal boundary. This avoids walls
  // flickering between adjacent sections while OrbitControls damping settles.
  let axis;
  if (lastAxis === "x" && ax + axisHysteresis >= az) axis = "x";
  else if (lastAxis === "z" && az + axisHysteresis >= ax) axis = "z";
  else axis = ax > az ? "x" : "z";

  if (axis === "x") {
    if (Math.abs(dx) < signDeadZone && lastAxis === "x") return lastCutawaySide;
    return xSide;
  }
  if (Math.abs(dz) < signDeadZone && lastAxis === "z") return lastCutawaySide;
  return zSide;
}
function hiddenWallsForCamera() {
  if (state.wallMode === "down" || currentView === "plan")
    return new Set([1, 2, 3, 4, 5, 6]);
  if (state.wallMode === "up") return new Set();
  lastCutawaySide = directionalCutawaySide();
  return new Set(cutawaySections[lastCutawaySide]);
}
function updateCutaway(force = false) {
  const hidden = hiddenWallsForCamera(),
    key =
      [...hidden].sort().join(",") + "|" + state.wallMode + "|" + currentView;
  if (!force && key === lastCutawayKey) return false;
  lastCutawayKey = key;
  for (let n = 1; n <= 6; n++) {
    const visible = !hidden.has(n);
    for (const m of wallSections[n]) m.visible = visible;
  }
  // Wall sections cast shadows. Refresh once when the chosen section changes,
  // not continuously while the camera moves.
  shadowDirty = true;
  return true;
}
function setWallMode(mode, announce = true) {
  state.wallMode = mode;
  lastCutawayKey = "";
  document
    .querySelectorAll("[data-wall-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.wallMode === mode));
  const labels = {
    cutaway: "Cutaway walls",
    up: "Walls up",
    down: "Walls down",
  };
  const b = document.getElementById("wallModeToggle");
  if (b) {
    b.textContent = labels[mode];
    b.classList.toggle("active", mode === "cutaway");
  }
  updateCutaway(true);
  requestRender(false);
  if (announce) toast(labels[mode]);
}
function cycleWallMode() {
  const modes = ["cutaway", "up", "down"];
  setWallMode(modes[(modes.indexOf(state.wallMode) + 1) % modes.length]);
}
function renderScene() {
  camera.layers.set(0);
  renderer.render(scene, camera);
}
const views = {
  design: { p: [D.W5 / 2, 285, D.W6 + 455], t: [D.W5 / 2, 82, D.W6 * 0.47] },
  doorway: {
    p: [D.W5 + 170, 165, D.W6 + 25],
    t: [D.W1 * 0.55, 80, D.W6 * 0.4],
  },
  plan: { p: [D.W5 / 2, 770, D.W6 / 2 + 0.01], t: [D.W5 / 2, 0, D.W6 / 2] },
};
function accentView(w) {
  const v = {
    1: { p: [D.W1 / 2, 145, D.W6 + 175], t: [D.W1 / 2, 92, 0] },
    2: { p: [-185, 145, D.W2 / 2], t: [D.W1, 92, D.W2 / 2] },
    3: { p: [100, 145, D.W2 - 185], t: [344, 92, D.W2] },
    4: { p: [D.W5 / 2, 145, D.W6 - 185], t: [D.W5, 92, D.W6 * 0.79] },
    5: { p: [D.W1 / 2, 145, -190], t: [D.W1 / 2, 92, D.W6] },
    6: { p: [D.W1 + 190, 145, D.W6 / 2], t: [0, 92, D.W6 / 2] },
  };
  return v[w] || v[1];
}
function moveCamera(key, instant = false) {
  currentView = key;
  const v = key === "accent" ? accentView(state.accentWall) : views[key];
  const a = camera.position.clone(),
    b = controls.target.clone(),
    e = new THREE.Vector3(...v.p),
    f = new THREE.Vector3(...v.t);
  if (instant) {
    camera.position.copy(e);
    controls.target.copy(f);
    controls.update();
    updateGrid();
    return;
  }
  const start = performance.now();
  function go(now) {
    let q = Math.min(1, (now - start) / 650);
    q = 1 - Math.pow(1 - q, 3);
    camera.position.lerpVectors(a, e, q);
    controls.target.lerpVectors(b, f, q);
    controls.update();
    if (q < 1) requestAnimationFrame(go);
  }
  requestAnimationFrame(go);
  updateGrid();
}

function snapValue(v) {
  return state.snap ? Math.round(v / state.gridSize) * state.gridSize : v;
}
function normalizeAngle(d) {
  d = ((d % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}
function applyBedTransform() {
  bedGroup.position.set(state.x, 0, state.z);
  bedGroup.rotation.y = THREE.MathUtils.degToRad(state.rotation);
  updateFields();
  updateChecks();
  state.presetWall = null;
  document
    .querySelectorAll("[data-place-wall]")
    .forEach((b) => b.classList.remove("active"));
}
function placeBed(w, announce = true) {
  if (w === 1) {
    state.x = D.W1 / 2;
    state.z = D.bed.gap + D.bed.l / 2;
    state.rotation = 0;
  } else if (w === 2) {
    state.x = D.W1 - D.bed.gap - D.bed.l / 2;
    state.z = D.W2 / 2;
    state.rotation = -90;
  } else if (w === 5) {
    state.x = D.W1 / 2;
    state.z = D.W6 - D.bed.gap - D.bed.l / 2;
    state.rotation = 180;
  }
  state.presetWall = w;
  bedGroup.position.set(state.x, 0, state.z);
  bedGroup.rotation.y = THREE.MathUtils.degToRad(state.rotation);
  document
    .querySelectorAll("[data-place-wall]")
    .forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.placeWall) === w),
    );
  if (state.accentFollow) setAccentWall(w, false);
  updateFields();
  updateChecks();
  if (announce) toast(`Bed placed on Wall ${w}`);
}
function updateFields() {
  document.getElementById("bedX").value = state.x.toFixed(1);
  document.getElementById("bedZ").value = state.z.toFixed(1);
  document.getElementById("bedRotation").value = normalizeAngle(
    state.rotation,
  ).toFixed(0);
  document.getElementById("bedPositionFact").textContent = state.presetWall
    ? `Wall ${state.presetWall}`
    : `${state.x.toFixed(0)}, ${state.z.toFixed(0)} cm`;
}
function accentName() {
  return state.accentColour === "raspberry_diva"
    ? "Raspberry Diva"
    : "Dusted Fondant";
}
function setAccentWall(w, announce = true) {
  state.accentWall = Number(w);
  const accentHex = C[state.accentColour] || C.dusted_fondant;
  for (const m of wallMeshes) {
    const accent = m.userData.wallNumber === state.accentWall;
    const col = new THREE.Color(accent ? accentHex : C.wall_white);
    m.material.color.copy(col);
    if (m.material.emissive) m.material.emissive.copy(col);
  }
  const wallSelect = document.getElementById("accentWall");
  if (wallSelect) wallSelect.value = String(state.accentWall);
  document.getElementById("paintLabel").textContent =
    `Wall ${state.accentWall} · click to change`;
  document.getElementById("paintName").textContent = `Dulux ${accentName()}`;
  document.getElementById("paintSwatch").style.background = accentHex;
  requestRender(false);
  if (announce) toast(`${accentName()} moved to Wall ${state.accentWall}`);
}
function setAccentColour(key, announce = true) {
  state.accentColour = key in C ? key : "dusted_fondant";
  const select = document.getElementById("accentColour");
  if (select) select.value = state.accentColour;
  document
    .querySelectorAll("[data-accent-colour]")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        b.dataset.accentColour === state.accentColour,
      ),
    );
  setAccentWall(state.accentWall, false);
  if (announce) toast(`Accent colour: ${accentName()}`);
}
function setFov(v) {
  camera.fov = Math.max(24, Math.min(72, Number(v)));
  camera.updateProjectionMatrix();
  document.getElementById("fovSlider").value = String(camera.fov);
  document.getElementById("fovValue").textContent = `${camera.fov.toFixed(0)}°`;
  document.getElementById("fovFact").textContent = `${camera.fov.toFixed(0)}°`;
  requestRender(false);
}
function updateGrid() {
  grid.visible = state.showGrid && currentView === "plan";
}

function bedPolygon() {
  const hw = D.bed.w / 2,
    hl = D.bed.l / 2,
    a = THREE.MathUtils.degToRad(state.rotation),
    c = Math.cos(a),
    s = Math.sin(a);
  return [
    [-hw, -hl],
    [hw, -hl],
    [hw, hl],
    [-hw, hl],
  ].map(([x, z]) => [state.x + x * c + z * s, state.z - x * s + z * c]);
}
function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      zi = poly[i][1],
      xj = poly[j][0],
      zj = poly[j][1];
    const hit =
      zi > p[1] !== zj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi + 1e-9) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}
function orient(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function segmentsIntersect(a, b, c, d) {
  const o1 = orient(a, b, c),
    o2 = orient(a, b, d),
    o3 = orient(c, d, a),
    o4 = orient(c, d, b);
  return (
    ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) &&
    ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))
  );
}
function polygonsOverlap(a, b) {
  if (a.some((p) => pointInPoly(p, b)) || b.some((p) => pointInPoly(p, a)))
    return true;
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++)
      if (
        segmentsIntersect(
          a[i],
          a[(i + 1) % a.length],
          b[j],
          b[(j + 1) % b.length],
        )
      )
        return true;
  return false;
}
function polygonInsideRoom(poly) {
  if (
    !poly.every(
      (p) =>
        pointInPoly(p, POLY) ||
        POLY.some((v) => Math.hypot(v[0] - p[0], v[1] - p[1]) < 0.01),
    )
  )
    return false;
  for (let i = 0; i < poly.length; i++)
    for (let j = 0; j < POLY.length; j++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        c = POLY[j],
        d = POLY[(j + 1) % POLY.length];
      if (segmentsIntersect(a, b, c, d)) return false;
    }
  return true;
}
function updateChecks() {
  const bed = bedPolygon(),
    inside = polygonInsideRoom(bed),
    doorHit = polygonsOverlap(bed, doorPts);
  const roomEl = document.getElementById("roomStatus"),
    doorEl = document.getElementById("doorStatus");
  roomEl.className = "status-line " + (inside ? "good" : "warn");
  roomEl.querySelector("b").textContent = inside
    ? "Inside room"
    : "Crosses wall";
  doorEl.className = "status-line " + (!doorHit ? "good" : "warn");
  doorEl.querySelector("b").textContent = doorHit ? "Overlap" : "Clear";
  document.getElementById("clearanceFact").textContent = doorHit
    ? "Warning"
    : "Clear";
  document.getElementById("clearanceFact").style.color = doorHit
    ? "var(--warn)"
    : "";
  doorSweep.material.opacity = doorHit ? 0.28 : 0.14;
  doorSweep.visible = currentView === "plan" || doorHit;
}
function nudge(dx, dz) {
  state.x = snapValue(state.x + dx);
  state.z = snapValue(state.z + dz);
  applyBedTransform();
}
function rotateBed(dir) {
  const step = state.snap ? 15 : 1;
  state.rotation = normalizeAngle(state.rotation + dir * step);
  applyBedTransform();
}

const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2(),
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  dragPoint = new THREE.Vector3(),
  dragOffset = new THREE.Vector3();
let dragging = false,
  placementMode = false,
  dragTarget = null;
function pointerNDC(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

function renderModeBanner({
  show = false,
  placing = false,
  invalid = false,
  title = "",
  text = "",
  rotate = false,
  orientation = false,
} = {}) {
  const banner = document.getElementById("modeBanner");
  banner.classList.toggle("show", show);
  banner.classList.toggle("placing", placing);
  banner.classList.toggle("invalid", invalid);
  banner.classList.toggle("has-actions", rotate || orientation);
  const actions = orientation
    ? '<span class="mode-banner-actions"><button type="button" data-quick-rotate="1">↔ Switch orientation</button></span>'
    : rotate
      ? '<span class="mode-banner-actions"><button type="button" data-quick-rotate="-1">↺ Rotate left</button><button type="button" data-quick-rotate="1">Rotate right ↻</button></span>'
      : "";
  banner.innerHTML = `<i></i><span class="mode-banner-copy"><b>${title}</b> ${text}</span>${actions}`;
  banner.querySelectorAll("[data-quick-rotate]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const direction = Number(button.dataset.quickRotate) || 1;
      if (pendingPlacement) rotatePending(direction);
      else rotateSelectedItem(direction);
    });
  });
}
function refreshMoveBanner() {
  if (!placementMode) {
    renderModeBanner();
    return;
  }
  if (!selectedPlacedItem) {
    renderModeBanner({
      show: true,
      title: "Move objects is on.",
      text: "Click furniture to select it, then drag. Press Esc or P when finished.",
    });
    return;
  }
  const wallMounted = selectedPlacedItem.mount === "wall";
  const detail = wallMounted
    ? "Use Switch orientation here, or adjust its exact wall position in Add furniture."
    : `Drag to move. Current angle ${normalizeAngle(selectedPlacedItem.rotation).toFixed(0)}°.`;
  renderModeBanner({
    show: true,
    title: `${selectedPlacedItem.name} selected.`,
    text: detail,
    rotate: !wallMounted,
    orientation: wallMounted,
  });
}
function setPlacementMode(enabled, announce = true) {
  if (enabled && typeof pendingPlacement !== "undefined" && pendingPlacement)
    cancelPendingPlacement(false);
  placementMode = !!enabled;
  document.body.classList.toggle("placement-mode", placementMode);
  const b = document.getElementById("placementToggle");
  b.classList.toggle("active", placementMode);
  b.setAttribute("aria-pressed", String(placementMode));
  b.innerHTML = placementMode
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 11V6a2 2 0 0 1 4 0v4-6a2 2 0 0 1 4 0v6-4a2 2 0 0 1 4 0v8c0 4.4-3.6 8-8 8h-1.2a7 7 0 0 1-5.7-2.9L2.8 16a2 2 0 0 1 3.1-2.5L8 16"/></svg><span class="label">Finish moving</span>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 11V6a2 2 0 0 1 4 0v4-6a2 2 0 0 1 4 0v6-4a2 2 0 0 1 4 0v8c0 4.4-3.6 8-8 8h-1.2a7 7 0 0 1-5.7-2.9L2.8 16a2 2 0 0 1 3.1-2.5L8 16"/></svg><span class="label">Move objects</span>';
  document.getElementById("placementModeSwitch").checked = placementMode;
  refreshMoveBanner();
  document
    .getElementById("placementHint")
    .classList.toggle("show", placementMode);
  document.getElementById("modeNote").textContent = placementMode
    ? "Move objects is active. Click furniture to select it; drag only the selected object."
    : "Cutaway walls are automatic. Ordinary dragging moves the camera, not the furniture.";
  if (!placementMode && dragTarget) finishPlacementDrag();
  if (!placementMode && typeof updateSelectionHighlight === "function")
    updateSelectionHighlight(null);
  requestRender(false);
  if (announce)
    toast(placementMode ? "Move objects enabled" : "Camera mode restored");
}

const proxyMaterials = {
  wood: new THREE.MeshStandardMaterial({ color: 0xd6c2a7, roughness: 0.82 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf0eee9, roughness: 0.75 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x3d3936, roughness: 0.72 }),
  mirror: new THREE.MeshStandardMaterial({
    color: 0xb8c3c8,
    roughness: 0.12,
    metalness: 0.72,
  }),
  art: new THREE.MeshStandardMaterial({ color: 0xa27d83, roughness: 0.9 }),
};
const itemDefs = {
  hemnes: {
    name: "HEMNES bedside table",
    category: "Bedside furniture",
    mount: "floor",
    w: 46,
    d: 35,
    h: 70,
    source: "IKEA 506.107.39",
  },
  malm: {
    name: "MALM 6-drawer chest",
    category: "Chest of drawers",
    mount: "floor",
    w: 80,
    d: 48,
    h: 123,
    source: "IKEA 604.036.02",
  },
  pax: {
    name: "PAX wardrobe frame",
    category: "Wardrobe",
    mount: "floor",
    w: 100,
    d: 58,
    h: 201.2,
    source: "IKEA 704.582.03",
  },
  brimnes: {
    name: "BRIMNES 3-door wardrobe",
    category: "Mirrored wardrobe",
    mount: "floor",
    w: 117,
    d: 50,
    h: 190,
    source: "IKEA 404.079.22",
  },
  nissedal: {
    name: "NISSEDAL mirror",
    category: "Mirror",
    mount: "wall",
    w: 65,
    d: 2,
    h: 150,
    source: "IKEA 006.054.86",
  },
  knoppang: {
    name: "KNOPPÄNG frame",
    category: "Wall art",
    mount: "wall",
    w: 52,
    d: 2,
    h: 72,
    source: "IKEA 703.871.40",
  },
};
const placedItems = [],
  itemMeshes = [];
let selectedPlacedItem = null,
  itemDragState = null,
  itemCounter = 0;
const selectionHelper = new THREE.BoxHelper(bedGroup, 0x8b695b);
selectionHelper.visible = false;
selectionHelper.material.depthTest = false;
selectionHelper.renderOrder = 20;
scene.add(selectionHelper);
function updateSelectionHighlight(obj) {
  if (!obj) {
    selectionHelper.visible = false;
    requestRender(false);
    return;
  }
  selectionHelper.setFromObject(obj);
  selectionHelper.visible = true;
  requestRender(false);
}
let proxyMeshRegistration = true;
function addProxyBox(group, w, h, d, x, y, z, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material.clone());
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  if (proxyMeshRegistration) itemMeshes.push(m);
  return m;
}
function buildProxy(def, key, registerMeshes = true) {
  const previousRegistration = proxyMeshRegistration;
  proxyMeshRegistration = registerMeshes;
  const g = new THREE.Group();
  if (key === "hemnes") {
    addProxyBox(g, def.w, 4, def.d, 0, def.h - 2, 0, proxyMaterials.wood);
    addProxyBox(g, def.w, 4, def.d, 0, 28, 0, proxyMaterials.wood);
    for (const x of [-def.w / 2 + 3, def.w / 2 - 3])
      for (const z of [-def.d / 2 + 3, def.d / 2 - 3])
        addProxyBox(g, 5, def.h, 5, x, def.h / 2, z, proxyMaterials.wood);
    addProxyBox(g, def.w - 8, 18, def.d - 5, 0, 52, 0, proxyMaterials.white);
  } else if (key === "malm") {
    addProxyBox(g, def.w, def.h, def.d, 0, def.h / 2, 0, proxyMaterials.white);
    for (let i = 1; i < 6; i++)
      addProxyBox(
        g,
        def.w - 2,
        0.8,
        def.d + 1,
        0,
        (i * def.h) / 6,
        def.d / 2 + 0.3,
        proxyMaterials.dark,
      );
  } else if (key === "pax") {
    addProxyBox(g, def.w, def.h, def.d, 0, def.h / 2, 0, proxyMaterials.white);
    addProxyBox(
      g,
      2,
      def.h - 6,
      def.d + 1,
      0,
      def.h / 2,
      def.d / 2 + 0.3,
      proxyMaterials.dark,
    );
    addProxyBox(
      g,
      def.w - 6,
      2,
      def.d - 5,
      0,
      def.h - 6,
      0,
      proxyMaterials.dark,
    );
  } else if (key === "brimnes") {
    addProxyBox(g, def.w, def.h, def.d, 0, def.h / 2, 0, proxyMaterials.white);
    for (const x of [-def.w / 6, def.w / 6])
      addProxyBox(
        g,
        1.2,
        def.h - 4,
        def.d + 1,
        x,
        def.h / 2,
        def.d / 2 + 0.3,
        proxyMaterials.dark,
      );
    addProxyBox(
      g,
      def.w / 3 - 4,
      def.h - 10,
      1.2,
      0,
      def.h / 2,
      def.d / 2 + 1,
      proxyMaterials.mirror,
    );
  } else if (key === "nissedal") {
    addProxyBox(g, def.w, def.h, def.d, 0, 0, 0, proxyMaterials.dark);
    addProxyBox(
      g,
      def.w - 5,
      def.h - 5,
      def.d + 1,
      0,
      0,
      1,
      proxyMaterials.mirror,
    );
  } else {
    addProxyBox(g, def.w, def.h, def.d, 0, 0, 0, proxyMaterials.dark);
    addProxyBox(
      g,
      def.w - 5,
      def.h - 5,
      def.d + 1,
      0,
      0,
      1,
      proxyMaterials.art,
    );
  }
  proxyMeshRegistration = previousRegistration;
  return g;
}
function objectPolygon(item, x = item.x, z = item.z, rotation = item.rotation) {
  const hw = item.w / 2,
    hd = item.d / 2,
    a = THREE.MathUtils.degToRad(rotation),
    c = Math.cos(a),
    s = Math.sin(a);
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([px, pz]) => [x + px * c + pz * s, z - px * s + pz * c]);
}
function validateFloorItem(
  item,
  x = item.x,
  z = item.z,
  rotation = item.rotation,
) {
  const poly = objectPolygon(item, x, z, rotation);
  if (!polygonInsideRoom(poly))
    return { hard: true, message: "Crosses the room boundary" };
  if (polygonsOverlap(poly, bedPolygon()))
    return { hard: true, message: "Overlaps the bed" };
  const heaterPoly = [
    [0, qCentreZ - qW / 2],
    [qD, qCentreZ - qW / 2],
    [qD, qCentreZ + qW / 2],
    [0, qCentreZ + qW / 2],
  ];
  if (polygonsOverlap(poly, heaterPoly))
    return { hard: true, message: "Overlaps the Dimplex Quantum heater" };
  for (const other of placedItems) {
    if (other === item || other.mount !== "floor") continue;
    if (polygonsOverlap(poly, objectPolygon(other)))
      return { hard: true, message: `Overlaps ${other.name}` };
  }
  const door = polygonsOverlap(poly, doorPts);
  return {
    hard: false,
    warning: door,
    message: door ? "Inside the door-swing margin" : "Valid placement",
  };
}
const wallMeta = {
  1: { length: D.W1 },
  2: { length: D.W2 },
  3: { length: D.W5 - D.W1 },
  4: { length: D.W6 - D.W2 },
  5: { length: D.W5 },
  6: { length: D.W6 },
};
function wallDims(item) {
  return item.orientation === "landscape"
    ? { w: item.h, h: item.w }
    : { w: item.w, h: item.h };
}
function wallPosition(item) {
  const dims = wallDims(item),
    o = item.offset,
    y = item.height,
    w = item.wall;
  item.group.rotation.set(
    0,
    0,
    item.orientation === "landscape" ? Math.PI / 2 : 0,
  );
  if (w === 1) {
    item.group.position.set(o, y, 2);
    item.group.rotation.y = 0;
  } else if (w === 2) {
    item.group.position.set(D.W1 - 2, y, o);
    item.group.rotation.y = -Math.PI / 2;
  } else if (w === 3) {
    item.group.position.set(D.W1 + o, y, D.W2 + 2);
    item.group.rotation.y = Math.PI;
  } else if (w === 4) {
    item.group.position.set(D.W5 - 2, y, D.W2 + o);
    item.group.rotation.y = -Math.PI / 2;
  } else if (w === 5) {
    item.group.position.set(o, y, D.W6 - 2);
    item.group.rotation.y = Math.PI;
  } else {
    item.group.position.set(2, y, o);
    item.group.rotation.y = Math.PI / 2;
  }
  return dims;
}
function validateWallItem(item) {
  const dims = wallDims(item),
    meta = wallMeta[item.wall],
    lo = item.offset - dims.w / 2,
    hi = item.offset + dims.w / 2,
    bottom = item.height - dims.h / 2,
    top = item.height + dims.h / 2;
  if (lo < 4 || hi > meta.length - 4 || bottom < 5 || top > D.H - 5)
    return { hard: true, message: "Extends beyond the usable wall area" };
  if (item.wall === 4 && hi > 21.59 && lo < 115.57 && bottom < 204.47)
    return { hard: true, message: "Overlaps the doorway" };
  if (
    item.wall === 6 &&
    hi > 52.07 &&
    lo < 224.79 &&
    top > 107.19 &&
    bottom < 206.25
  )
    return { hard: true, message: "Overlaps the window" };
  const itemBox = new THREE.Box3()
      .setFromObject(item.group)
      .expandByScalar(0.35),
    bedBox = new THREE.Box3().setFromObject(bedGroup);
  if (itemBox.intersectsBox(bedBox))
    return {
      hard: true,
      message: "Cannot mount an item on the bed or headboard",
    };
  const heaterBox = new THREE.Box3().setFromObject(quantumHeater);
  if (itemBox.intersectsBox(heaterBox))
    return { hard: true, message: "Cannot mount an item over the heater" };
  for (const other of placedItems) {
    if (other === item || other.mount !== "wall" || other.wall !== item.wall)
      continue;
    const od = wallDims(other),
      olo = other.offset - od.w / 2,
      ohi = other.offset + od.w / 2,
      ob = other.height - od.h / 2,
      ot = other.height + od.h / 2;
    if (lo < ohi && hi > olo && bottom < ot && top > ob)
      return { hard: true, message: `Overlaps ${other.name}` };
  }
  return { hard: false, message: "Valid wall placement" };
}
function recolourItem(item, status) {
  item.group.traverse((m) => {
    if (!m.isMesh || !m.material) return;
    if (!m.userData.baseEmissive) {
      m.userData.baseEmissive = m.material.emissive
        ? m.material.emissive.clone()
        : new THREE.Color(0);
      m.userData.baseEI = m.material.emissiveIntensity || 0;
    }
    if (!m.material.emissive) return;
    if (status === "error") {
      m.material.emissive.set(0x8d241d);
      m.material.emissiveIntensity = 0.38;
    } else if (status === "selected") {
      m.material.emissive.set(0x3f6c51);
      m.material.emissiveIntensity = 0.14;
    } else {
      m.material.emissive.copy(m.userData.baseEmissive);
      m.material.emissiveIntensity = m.userData.baseEI;
    }
  });
}
function itemValidation(item) {
  return item.mount === "floor"
    ? validateFloorItem(item)
    : validateWallItem(item);
}
function updateSelectedPanel() {
  const card = document.getElementById("selectedItemCard"),
    floor = document.getElementById("floorItemControls"),
    wall = document.getElementById("wallItemControls");
  for (const item of placedItems)
    recolourItem(item, item === selectedPlacedItem ? "selected" : "normal");
  if (!selectedPlacedItem) {
    card.querySelector("h4").textContent = "Nothing selected";
    card.querySelector("p").textContent =
      "Enable Placement mode, then click a dummy item. The bed keeps its own controls in the Room panel.";
    floor.classList.add("hidden");
    wall.classList.add("hidden");
    document.getElementById("itemStatus").className = "status-line good";
    document.getElementById("itemStatus").querySelector("b").textContent =
      "Ready";
    return;
  }
  const item = selectedPlacedItem;
  card.querySelector("h4").textContent = item.name;
  card.querySelector("p").textContent =
    `${item.category} · ${item.source} · approximate planning proxy`;
  if (item.mount === "floor") {
    floor.classList.remove("hidden");
    wall.classList.add("hidden");
    document.getElementById("itemX").value = item.x.toFixed(1);
    document.getElementById("itemZ").value = item.z.toFixed(1);
    document.getElementById("itemRotation").value = normalizeAngle(
      item.rotation,
    ).toFixed(0);
  } else {
    floor.classList.add("hidden");
    wall.classList.remove("hidden");
    document.getElementById("itemWall").value = item.wall;
    document.getElementById("itemHeight").value = item.height.toFixed(0);
    document.getElementById("itemOffset").value = item.offset.toFixed(0);
    document.getElementById("itemOrientation").value = item.orientation;
  }
  const v = itemValidation(item),
    status = document.getElementById("itemStatus");
  status.className =
    "status-line " + (v.hard ? "error" : v.warning ? "warning" : "good");
  status.querySelector("b").textContent = v.message;
  recolourItem(item, v.hard ? "error" : "selected");
}
function updatePlacedList() {
  const el = document.getElementById("placedItemsList");
  if (!placedItems.length) {
    el.innerHTML =
      '<div class="status-line"><span>No dummy items yet</span><b>0</b></div>';
    return;
  }
  el.innerHTML = placedItems
    .map(
      (item, i) =>
        `<button class="status-line" data-select-index="${i}" style="width:100%;border:0;text-align:left;cursor:pointer"><span>${item.name}</span><b>${item.mount === "wall" ? `Wall ${item.wall}` : `${item.x.toFixed(0)}, ${item.z.toFixed(0)}`}</b></button>`,
    )
    .join("");
  el.querySelectorAll("[data-select-index]").forEach(
    (b) =>
      (b.onclick = () => {
        selectPlacedItem(placedItems[Number(b.dataset.selectIndex)]);
        setPlacementMode(true, false);
      }),
  );
}
function selectPlacedItem(item) {
  selectedPlacedItem = item;
  updateSelectionHighlight(item ? item.group : null);
  updateSelectedPanel();
  updatePlacedList();
  if (placementMode) refreshMoveBanner();
}
function findSpawn(item) {
  const candidates = [
    [D.W1 - 35, 55],
    [35, D.W6 - 35],
    [D.W1 - 35, D.W6 - 35],
    [D.W5 - 35, D.W2 + 45],
    [55, D.W6 / 2],
  ];
  for (let z = 25; z < D.W6 - 20; z += 10)
    for (let x = 25; x < D.W5 - 20; x += 10) candidates.push([x, z]);
  for (const [x, z] of candidates) {
    const v = validateFloorItem(item, x, z, 0);
    if (!v.hard) return { x, z };
  }
  return { x: D.W1 / 2, z: D.W6 / 2 };
}
let pendingPlacement = null;
const GHOST_GREEN = 0x42ff7b,
  GHOST_RED = 0xff5d52;
function disposeGroup(group) {
  group.traverse((m) => {
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) mat?.dispose?.();
  });
}
function ghostMessage(text, invalid = false) {
  const item = pendingPlacement?.item;
  renderModeBanner({
    show: true,
    placing: true,
    invalid,
    title: `${item?.name || "Place item"}.`,
    text,
    rotate: item?.mount !== "wall",
    orientation: item?.mount === "wall",
  });
}
function setGhostAppearance(valid, message) {
  if (!pendingPlacement) return;
  pendingPlacement.valid = valid;
  pendingPlacement.message = message;
  const colour = valid ? GHOST_GREEN : GHOST_RED;
  pendingPlacement.group.traverse((m) => {
    if (m.isMesh && m.material?.color) m.material.color.setHex(colour);
  });
  pendingPlacement.outline.material.color.setHex(colour);
  pendingPlacement.outline.setFromObject(pendingPlacement.group);
  ghostMessage(
    valid ? "Rotate here if needed, then click to place · Esc cancels" : message,
    !valid,
  );
  requestRender(false, 1);
}
function prepareGhost(group) {
  const mat = new THREE.MeshBasicMaterial({
    color: GHOST_GREEN,
    transparent: true,
    opacity: 0.43,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  group.traverse((m) => {
    if (!m.isMesh) return;
    const old = Array.isArray(m.material) ? m.material : [m.material];
    for (const x of old) x?.dispose?.();
    m.material = mat;
    m.castShadow = false;
    m.receiveShadow = false;
    m.renderOrder = 28;
  });
  return mat;
}
function beginItemPlacement(key) {
  cancelPendingPlacement(false);
  const def = itemDefs[key];
  if (!def) return;
  setPlacementMode(false, false);
  selectPlacedItem(null);
  const group = buildProxy(def, key, false),
    item = {
      id: itemCounter + 1,
      key,
      name: def.name,
      category: def.category,
      source: def.source,
      mount: def.mount,
      w: def.w,
      d: def.d,
      h: def.h,
      rotation: 0,
      group,
    };
  prepareGhost(group);
  group.visible = false;
  scene.add(group);
  const outline = new THREE.BoxHelper(group, GHOST_GREEN);
  outline.visible = false;
  outline.material.depthTest = false;
  outline.material.transparent = true;
  outline.material.opacity = 0.96;
  outline.renderOrder = 40;
  scene.add(outline);
  pendingPlacement = {
    key,
    def,
    item,
    group,
    outline,
    valid: false,
    hasPosition: false,
    message: "Move the pointer over a valid surface",
  };
  document.body.classList.add("placing-new-item");
  toggleLibrary(false);
  ghostMessage(
    "Move the pointer over the floor or a wall. Green means valid; red means blocked.",
  );
  toast(`Position the ${def.name} ghost`);
  requestRender(false, 1);
}
function cancelPendingPlacement(announce = true) {
  if (!pendingPlacement) return;
  scene.remove(pendingPlacement.group, pendingPlacement.outline);
  disposeGroup(pendingPlacement.group);
  pendingPlacement.outline.geometry?.dispose();
  pendingPlacement.outline.material?.dispose();
  pendingPlacement = null;
  document.body.classList.remove("placing-new-item");
  setPlacementMode(placementMode, false);
  if (announce) toast("Placement cancelled");
  requestRender(false, 1);
}
function wallHitToItem(item, hit) {
  const w = hit.object.userData.wallNumber,
    p = hit.point;
  if (!w) return false;
  item.wall = w;
  item.orientation = item.orientation || "portrait";
  item.height = state.snap ? snapValue(p.y) : p.y;
  if (w === 1) item.offset = state.snap ? snapValue(p.x) : p.x;
  else if (w === 2) item.offset = state.snap ? snapValue(p.z) : p.z;
  else if (w === 3)
    item.offset = state.snap ? snapValue(p.x - D.W1) : p.x - D.W1;
  else if (w === 4)
    item.offset = state.snap ? snapValue(p.z - D.W2) : p.z - D.W2;
  else if (w === 5) item.offset = state.snap ? snapValue(p.x) : p.x;
  else item.offset = state.snap ? snapValue(p.z) : p.z;
  wallPosition(item);
  return true;
}
function updatePendingPlacement(e) {
  if (!pendingPlacement) return;
  pointerNDC(e);
  raycaster.setFromCamera(pointer, camera);
  const item = pendingPlacement.item;
  if (item.mount === "floor") {
    if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      pendingPlacement.group.visible = false;
      pendingPlacement.outline.visible = false;
      return;
    }
    item.x = snapValue(dragPoint.x);
    item.z = snapValue(dragPoint.z);
    item.group.position.set(item.x, 0, item.z);
    item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    pendingPlacement.hasPosition = true;
  } else {
    const hits = raycaster.intersectObjects(
      wallMeshes.filter((m) => m.visible),
      false,
    );
    if (!hits.length || !wallHitToItem(item, hits[0])) {
      pendingPlacement.group.visible = false;
      pendingPlacement.outline.visible = false;
      pendingPlacement.hasPosition = false;
      ghostMessage("Point at a visible wall surface.");
      requestRender(false, 1);
      return;
    }
    pendingPlacement.hasPosition = true;
  }
  pendingPlacement.group.visible = true;
  pendingPlacement.outline.visible = true;
  const v = itemValidation(item);
  setGhostAppearance(!v.hard, v.message);
}
function rotatePending(dir = 1) {
  if (!pendingPlacement) return;
  const item = pendingPlacement.item;
  if (item.mount === "wall") {
    item.orientation =
      item.orientation === "portrait" ? "landscape" : "portrait";
    if (pendingPlacement.hasPosition) wallPosition(item);
  } else {
    item.rotation = normalizeAngle(item.rotation + dir * (state.snap ? 15 : 1));
    item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  }
  if (pendingPlacement.hasPosition) {
    const v = itemValidation(item);
    setGhostAppearance(!v.hard, v.message);
  } else requestRender(false, 1);
}
function nudgePending(dx, dz) {
  if (!pendingPlacement || !pendingPlacement.hasPosition) return;
  const item = pendingPlacement.item;
  if (item.mount === "floor") {
    item.x = snapValue(item.x + dx);
    item.z = snapValue(item.z + dz);
    item.group.position.set(item.x, 0, item.z);
  } else {
    item.offset = snapValue(item.offset + dx);
    item.height = snapValue(item.height - dz);
    wallPosition(item);
  }
  const v = itemValidation(item);
  setGhostAppearance(!v.hard, v.message);
}
function confirmPendingPlacement(e) {
  if (!pendingPlacement) return;
  if (e?.button != null && e.button !== 0) return;
  e?.preventDefault?.();
  e?.stopPropagation?.();
  if (!pendingPlacement.hasPosition) {
    toast("Move the green ghost into the room first");
    return;
  }
  if (!pendingPlacement.valid) {
    toast(pendingPlacement.message || "That position is blocked");
    return;
  }
  const p = pendingPlacement,
    temp = p.item;
  scene.remove(p.group, p.outline);
  disposeGroup(p.group);
  p.outline.geometry?.dispose();
  p.outline.material?.dispose();
  pendingPlacement = null;
  document.body.classList.remove("placing-new-item");
  const group = buildProxy(p.def, p.key, true),
    item = {
      id: ++itemCounter,
      key: p.key,
      name: p.def.name,
      category: p.def.category,
      source: p.def.source,
      mount: p.def.mount,
      w: p.def.w,
      d: p.def.d,
      h: p.def.h,
      rotation: temp.rotation || 0,
      group,
    };
  group.userData.itemRef = item;
  group.traverse((m) => {
    if (m.isMesh) m.userData.itemRef = item;
  });
  scene.add(group);
  placedItems.push(item);
  if (item.mount === "floor") {
    item.x = temp.x;
    item.z = temp.z;
    group.position.set(item.x, 0, item.z);
    group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  } else {
    item.wall = temp.wall;
    item.orientation = temp.orientation || "portrait";
    item.offset = temp.offset;
    item.height = temp.height;
    wallPosition(item);
  }
  const banner = document.getElementById("modeBanner");
  banner.classList.remove("placing", "invalid");
  selectPlacedItem(item);
  setPlacementMode(true, false);
  updateSelectedPanel();
  updatePlacedList();
  queueHistory();
  toast(`${item.name} placed`);
  requestRender(true, 2);
}
function addItem(key) {
  beginItemPlacement(key);
}
function removeSelectedItem() {
  if (!selectedPlacedItem) return;
  const item = selectedPlacedItem;
  scene.remove(item.group);
  item.group.traverse((m) => {
    const i = itemMeshes.indexOf(m);
    if (i >= 0) itemMeshes.splice(i, 1);
  });
  placedItems.splice(placedItems.indexOf(item), 1);
  selectedPlacedItem = null;
  updateSelectedPanel();
  updatePlacedList();
  refreshMoveBanner();
  toast(`${item.name} removed`);
}
function moveSelectedItem(dx, dz) {
  if (!selectedPlacedItem || selectedPlacedItem.mount !== "floor") {
    nudge(dx, dz);
    return;
  }
  const item = selectedPlacedItem,
    old = { x: item.x, z: item.z };
  item.x = snapValue(item.x + dx);
  item.z = snapValue(item.z + dz);
  const v = validateFloorItem(item);
  if (v.hard) {
    item.x = old.x;
    item.z = old.z;
    toast(v.message);
  }
  item.group.position.set(item.x, 0, item.z);
  updateSelectedPanel();
  updatePlacedList();
}
function rotateSelectedItem(dir) {
  if (!selectedPlacedItem) {
    rotateBed(dir);
    return;
  }
  const item = selectedPlacedItem;
  if (item.mount === "wall") {
    const old = item.orientation;
    item.orientation =
      item.orientation === "portrait" ? "landscape" : "portrait";
    wallPosition(item);
    if (validateWallItem(item).hard) {
      item.orientation = old;
      wallPosition(item);
      toast("That orientation does not fit here");
    }
  } else {
    const old = item.rotation;
    item.rotation = normalizeAngle(item.rotation + dir * (state.snap ? 15 : 1));
    if (validateFloorItem(item).hard) {
      item.rotation = old;
      toast("Rotation would create an impossible overlap");
    }
    item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  }
  updateSelectedPanel();
  updatePlacedList();
  refreshMoveBanner();
}
function activeNudge(dx, dz) {
  if (placementMode && selectedPlacedItem) moveSelectedItem(dx, dz);
  else nudge(dx, dz);
}
function activeRotate(dir) {
  if (placementMode && selectedPlacedItem) rotateSelectedItem(dir);
  else rotateBed(dir);
}

function placementPointerDown(e) {
  if (pendingPlacement) {
    confirmPendingPlacement(e);
    return;
  }
  if (!placementMode || e.button !== 0) return;
  pointerNDC(e);
  raycaster.setFromCamera(pointer, camera);
  const targets = [...bedMeshes, ...itemMeshes],
    hits = raycaster.intersectObjects(targets, false);
  if (!hits.length) return;
  const item = hits[0].object.userData.itemRef || null;
  e.preventDefault();
  e.stopPropagation();
  controls.enabled = false;
  renderer.domElement.setPointerCapture(e.pointerId);
  if (item) {
    selectPlacedItem(item);
    if (item.mount === "wall") {
      controls.enabled = true;
      renderer.domElement.releasePointerCapture(e.pointerId);
      return;
    }
    dragTarget = item;
    itemDragState = { x: item.x, z: item.z, lastX: item.x, lastZ: item.z };
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint))
      dragOffset.set(item.x - dragPoint.x, 0, item.z - dragPoint.z);
  } else {
    selectPlacedItem(null);
    updateSelectionHighlight(bedGroup);
    dragTarget = "bed";
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint))
      dragOffset.set(state.x - dragPoint.x, 0, state.z - dragPoint.z);
  }
  dragging = true;
  renderer.domElement.style.cursor = "grabbing";
}
function placementPointerMove(e) {
  if (pendingPlacement) {
    updatePendingPlacement(e);
    return;
  }
  if (!dragging || !dragTarget) return;
  pointerNDC(e);
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
  const x = snapValue(dragPoint.x + dragOffset.x),
    z = snapValue(dragPoint.z + dragOffset.z);
  if (dragTarget === "bed") {
    state.x = x;
    state.z = z;
    applyBedTransform();
  } else {
    dragTarget.x = x;
    dragTarget.z = z;
    dragTarget.group.position.set(x, 0, z);
    const v = validateFloorItem(dragTarget);
    if (!v.hard) {
      itemDragState.lastX = x;
      itemDragState.lastZ = z;
    }
    recolourItem(dragTarget, v.hard ? "error" : "selected");
    updateSelectedPanel();
  }
}
function finishPlacementDrag(e) {
  if (!dragging) return;
  if (dragTarget && dragTarget !== "bed") {
    const v = validateFloorItem(dragTarget);
    if (v.hard) {
      dragTarget.x = itemDragState.lastX;
      dragTarget.z = itemDragState.lastZ;
      dragTarget.group.position.set(dragTarget.x, 0, dragTarget.z);
      toast(v.message);
    } else if (v.warning) toast(v.message);
  }
  dragging = false;
  dragTarget = null;
  itemDragState = null;
  controls.enabled = true;
  renderer.domElement.style.cursor = placementMode ? "grab" : "";
  if (e?.pointerId != null)
    try {
      renderer.domElement.releasePointerCapture(e.pointerId);
    } catch (_) {}
  updateSelectedPanel();
  updatePlacedList();
  requestRender(true, 1);
}
renderer.domElement.addEventListener("pointerdown", placementPointerDown, true);
renderer.domElement.addEventListener("pointermove", placementPointerMove, true);
renderer.domElement.addEventListener("pointerup", finishPlacementDrag, true);
renderer.domElement.addEventListener(
  "pointercancel",
  finishPlacementDrag,
  true,
);

function toggleLibrary(open) {
  const d = document.getElementById("libraryDrawer");
  const next = open ?? !d.classList.contains("open");
  d.classList.toggle("open", next);
  d.setAttribute("aria-hidden", String(!next));
  document
    .getElementById("libraryToggle")
    .setAttribute("aria-expanded", String(next));
  if (next) {
    toggleDrawer(false);
    toggleHotkeys(false);
  }
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1500);
}
function toggleDrawer(open) {
  const d = document.getElementById("layoutDrawer");
  const next = open ?? !d.classList.contains("open");
  d.classList.toggle("open", next);
  d.setAttribute("aria-hidden", String(!next));
  document
    .getElementById("layoutToggle")
    .setAttribute("aria-expanded", String(next));
  if (next) {
    toggleHotkeys(false);
    toggleLibrary(false);
  }
}
function toggleHotkeys(open) {
  const d = document.getElementById("hotkeysPanel");
  const next = open ?? !d.classList.contains("open");
  d.classList.toggle("open", next);
  d.setAttribute("aria-hidden", String(!next));
  document
    .getElementById("hotkeysToggle")
    .setAttribute("aria-expanded", String(next));
  if (next) {
    toggleDrawer(false);
    toggleLibrary(false);
  }
}

document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll("[data-view]")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      moveCamera(b.dataset.view);
      updateChecks();
    }),
);
function setFloorMaterial(key, announce = true) {
  state.floor = key === "oak" ? "oak" : "carpet";
  document
    .querySelectorAll("[data-floor]")
    .forEach((x) =>
      x.classList.toggle("active", x.dataset.floor === state.floor),
    );
  floorMaterial.map = state.floor === "oak" ? oak : carpet;
  floorMaterial.roughness = state.floor === "oak" ? 0.82 : 1;
  floorMaterial.needsUpdate = true;
  document.getElementById("floorName").textContent =
    state.floor === "oak" ? "Light oak" : "Carpet";
  document.getElementById("floorSwatch").style.background =
    state.floor === "oak"
      ? "linear-gradient(90deg,#caa77b,#b78f62,#d4b78d)"
      : "#bdb6ad";
  requestRender(false);
  if (announce)
    toast(`Floor: ${state.floor === "oak" ? "Light oak" : "Carpet"}`);
}
document
  .querySelectorAll("[data-floor]")
  .forEach((b) => (b.onclick = () => setFloorMaterial(b.dataset.floor)));
document
  .querySelectorAll("[data-place-wall]")
  .forEach((b) => (b.onclick = () => placeBed(Number(b.dataset.placeWall))));
document
  .querySelectorAll("[data-accent-colour]")
  .forEach((b) => (b.onclick = () => setAccentColour(b.dataset.accentColour)));
document.querySelectorAll("[data-nudge]").forEach(
  (b) =>
    (b.onclick = () => {
      const step = state.snap ? state.gridSize : 1,
        n = b.dataset.nudge;
      activeNudge(
        n === "x-" ? -step : n === "x+" ? step : 0,
        n === "z-" ? -step : n === "z+" ? step : 0,
      );
    }),
);
document
  .querySelectorAll("[data-rotate]")
  .forEach((b) => (b.onclick = () => activeRotate(Number(b.dataset.rotate))));
document
  .querySelectorAll("[data-wall-mode]")
  .forEach((b) => (b.onclick = () => setWallMode(b.dataset.wallMode)));
document
  .querySelectorAll("[data-add-item]")
  .forEach((b) => (b.onclick = () => addItem(b.dataset.addItem)));
document.getElementById("wallModeToggle").onclick = cycleWallMode;
document.getElementById("placementToggle").onclick = () =>
  setPlacementMode(!placementMode);
document.getElementById("placementModeSwitch").onchange = (e) =>
  setPlacementMode(e.target.checked);
document.getElementById("layoutToggle").onclick = () => toggleDrawer();
document.getElementById("layoutClose").onclick = () => toggleDrawer(false);
document.getElementById("libraryToggle").onclick = () => toggleLibrary();
document.getElementById("libraryClose").onclick = () => toggleLibrary(false);
document.getElementById("hotkeysToggle").onclick = () => toggleHotkeys();
document.getElementById("hotkeysClose").onclick = () => toggleHotkeys(false);
document.getElementById("snapToggle").onchange = (e) => {
  state.snap = e.target.checked;
  toast(state.snap ? `Snapping on (${state.gridSize} cm)` : "Snapping off");
};
document.getElementById("gridToggle").onchange = (e) => {
  state.showGrid = e.target.checked;
  updateGrid();
};
document.getElementById("gridSize").onchange = (e) => {
  state.gridSize = Number(e.target.value);
  toast(`Grid set to ${state.gridSize} cm`);
};
document.getElementById("accentFollow").onchange = (e) => {
  state.accentFollow = e.target.checked;
  document.getElementById("accentWall").disabled = state.accentFollow;
  if (state.accentFollow && state.presetWall)
    setAccentWall(state.presetWall, false);
  toast(
    state.accentFollow ? "Accent follows bed presets" : "Accent wall unlocked",
  );
};
document.getElementById("accentWall").onchange = (e) =>
  setAccentWall(Number(e.target.value));
document.getElementById("accentColour").onchange = (e) =>
  setAccentColour(e.target.value);
document.getElementById("accentWall").disabled = true;
document.getElementById("fovSlider").oninput = (e) => setFov(e.target.value);
document.getElementById("lightFitting").onchange = (e) =>
  setLightFitting(e.target.value);
document.getElementById("timeSlider").oninput = (e) =>
  applyTimeOfDay(e.target.value, false);
document
  .querySelectorAll("[data-time]")
  .forEach(
    (b) => (b.onclick = () => applyTimeOfDay(Number(b.dataset.time), true)),
  );
document.getElementById("overheadSlider").oninput = (e) => {
  lightingState.overheadLevel = Number(e.target.value);
  overheadLight.intensity = lightingState.overheadLevel;
  document.getElementById("overheadValue").textContent =
    lightingState.overheadLevel.toFixed(2);
};
document.getElementById("daylightSlider").oninput = (e) => {
  lightingState.daylightLevel = Number(e.target.value);
  document.getElementById("daylightValue").textContent =
    lightingState.daylightLevel.toFixed(2);
  applyTimeOfDay(lightingState.time, false);
};
for (const [id, key] of [
  ["bedX", "x"],
  ["bedZ", "z"],
  ["bedRotation", "rotation"],
])
  document.getElementById(id).addEventListener("change", (e) => {
    state[key] = Number(e.target.value) || 0;
    if (key !== "rotation") state[key] = snapValue(state[key]);
    else state[key] = normalizeAngle(state[key]);
    applyBedTransform();
  });
for (const [id, key] of [
  ["itemX", "x"],
  ["itemZ", "z"],
  ["itemRotation", "rotation"],
])
  document.getElementById(id).addEventListener("change", (e) => {
    if (!selectedPlacedItem || selectedPlacedItem.mount !== "floor") return;
    const old = selectedPlacedItem[key];
    selectedPlacedItem[key] = Number(e.target.value) || 0;
    if (key !== "rotation")
      selectedPlacedItem[key] = snapValue(selectedPlacedItem[key]);
    else selectedPlacedItem[key] = normalizeAngle(selectedPlacedItem[key]);
    const v = validateFloorItem(selectedPlacedItem);
    if (v.hard) {
      selectedPlacedItem[key] = old;
      toast(v.message);
    }
    selectedPlacedItem.group.position.set(
      selectedPlacedItem.x,
      0,
      selectedPlacedItem.z,
    );
    selectedPlacedItem.group.rotation.y = THREE.MathUtils.degToRad(
      selectedPlacedItem.rotation,
    );
    updateSelectedPanel();
    updatePlacedList();
  });
document.getElementById("itemWall").onchange = (e) => {
  if (!selectedPlacedItem || selectedPlacedItem.mount !== "wall") return;
  const old = selectedPlacedItem.wall;
  selectedPlacedItem.wall = Number(e.target.value);
  selectedPlacedItem.offset = wallMeta[selectedPlacedItem.wall].length / 2;
  wallPosition(selectedPlacedItem);
  if (validateWallItem(selectedPlacedItem).hard) {
    selectedPlacedItem.wall = old;
    selectedPlacedItem.offset = wallMeta[old].length / 2;
    wallPosition(selectedPlacedItem);
    toast("That wall does not have a valid central position");
  }
  updateSelectedPanel();
  updatePlacedList();
};
document.getElementById("itemHeight").onchange = (e) => {
  if (!selectedPlacedItem || selectedPlacedItem.mount !== "wall") return;
  const old = selectedPlacedItem.height;
  selectedPlacedItem.height = Number(e.target.value) || old;
  wallPosition(selectedPlacedItem);
  if (validateWallItem(selectedPlacedItem).hard) {
    selectedPlacedItem.height = old;
    wallPosition(selectedPlacedItem);
    toast("That height is not valid");
  }
  updateSelectedPanel();
};
document.getElementById("itemOffset").onchange = (e) => {
  if (!selectedPlacedItem || selectedPlacedItem.mount !== "wall") return;
  const old = selectedPlacedItem.offset;
  selectedPlacedItem.offset = Number(e.target.value) || old;
  wallPosition(selectedPlacedItem);
  if (validateWallItem(selectedPlacedItem).hard) {
    selectedPlacedItem.offset = old;
    wallPosition(selectedPlacedItem);
    toast("That wall position is not valid");
  }
  updateSelectedPanel();
  updatePlacedList();
};
document.getElementById("itemOrientation").onchange = (e) => {
  if (!selectedPlacedItem || selectedPlacedItem.mount !== "wall") return;
  const old = selectedPlacedItem.orientation;
  selectedPlacedItem.orientation = e.target.value;
  wallPosition(selectedPlacedItem);
  if (validateWallItem(selectedPlacedItem).hard) {
    selectedPlacedItem.orientation = old;
    wallPosition(selectedPlacedItem);
    toast("That orientation does not fit");
  }
  updateSelectedPanel();
};
document.getElementById("itemRotateLeft").onclick = () =>
  rotateSelectedItem(-1);
document.getElementById("itemRotateRight").onclick = () =>
  rotateSelectedItem(1);
document.getElementById("itemDelete").onclick = removeSelectedItem;
document.getElementById("itemDeleteWall").onclick = removeSelectedItem;

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
  let handled = true,
    step = state.snap ? state.gridSize : 1;
  switch (e.key) {
    case "ArrowLeft":
      pendingPlacement ? nudgePending(-step, 0) : activeNudge(-step, 0);
      break;
    case "ArrowRight":
      pendingPlacement ? nudgePending(step, 0) : activeNudge(step, 0);
      break;
    case "ArrowUp":
      pendingPlacement ? nudgePending(0, -step) : activeNudge(0, -step);
      break;
    case "ArrowDown":
      pendingPlacement ? nudgePending(0, step) : activeNudge(0, step);
      break;
    case "q":
    case "Q":
      pendingPlacement ? rotatePending(-1) : activeRotate(-1);
      break;
    case "e":
    case "E":
      pendingPlacement ? rotatePending(1) : activeRotate(1);
      break;
    case "r":
    case "R":
      if (pendingPlacement) rotatePending(1);
      else handled = false;
      break;
    case "Enter":
      if (pendingPlacement) confirmPendingPlacement();
      else handled = false;
      break;
    case "1":
      placeBed(1);
      break;
    case "2":
      placeBed(2);
      break;
    case "5":
      placeBed(5);
      break;
    case "0":
      document.querySelector('[data-view="plan"]').click();
      break;
    case "g":
    case "G":
      document.getElementById("snapToggle").click();
      break;
    case "p":
    case "P":
      pendingPlacement
        ? cancelPendingPlacement(true)
        : setPlacementMode(!placementMode);
      break;
    case "v":
    case "V":
      cycleWallMode();
      break;
    case "c":
    case "C":
      document.getElementById("accentFollow").click();
      break;
    case "t":
    case "T":
      cycleTimeOfDay();
      break;
    case "[":
      setFov(camera.fov - 2);
      break;
    case "]":
      setFov(camera.fov + 2);
      break;
    case "l":
    case "L":
      toggleDrawer();
      break;
    case "i":
    case "I":
      toggleLibrary();
      break;
    case "?":
      toggleHotkeys();
      break;
    case "Delete":
    case "Backspace":
      if (selectedPlacedItem) removeSelectedItem();
      else handled = false;
      break;
    case "Escape":
      if (pendingPlacement) cancelPendingPlacement(true);
      else {
        toggleDrawer(false);
        toggleLibrary(false);
        toggleHotkeys(false);
        setPlacementMode(false, false);
      }
      break;
    default:
      handled = false;
  }
  if (handled) e.preventDefault();
});

let renderQueued = false,
  renderInProgress = false,
  settleFrames = 0,
  shadowDirty = true,
  interactionTimer = 0,
  scheduledRenderFrames = 0,
  completedRenderFrames = 0;
function scheduleRenderFrame() {
  if (renderQueued || renderInProgress) return;
  renderQueued = true;
  scheduledRenderFrames++;
  requestAnimationFrame(renderFrame);
}
function requestRender(shadows = false, frames = 1) {
  if (shadows) shadowDirty = true;
  settleFrames = Math.max(settleFrames, Math.max(0, frames));
  scheduleRenderFrame();
}
function renderFrame() {
  renderQueued = false;
  renderInProgress = true;
  const changed = controls.enableDamping ? controls.update() : false;
  if (shadowDirty) renderer.shadowMap.needsUpdate = true;
  renderScene();
  completedRenderFrames++;
  shadowDirty = false;
  if (settleFrames > 0) settleFrames--;
  const needsAnotherFrame = changed || settleFrames > 0;
  renderInProgress = false;
  if (needsAnotherFrame) scheduleRenderFrame();
}
function beginInteraction() {
  clearTimeout(interactionTimer);
  document.body.classList.add("is-interacting");
  requestRender(false, 1);
}
function endInteraction() {
  clearTimeout(interactionTimer);
  interactionTimer = setTimeout(() => document.body.classList.remove("is-interacting"), 120);
  updateCutaway();
  requestRender(false, 2);
}
controls.addEventListener("start", beginInteraction);
controls.addEventListener("change", () => {
  updateCutaway();
  requestRender(false, 1);
});
controls.addEventListener("end", endInteraction);
renderer.domElement.addEventListener("pointerdown", beginInteraction, { passive: true });
renderer.domElement.addEventListener("pointerup", endInteraction, { passive: true });
renderer.domElement.addEventListener("pointercancel", endInteraction, { passive: true });
renderer.domElement.addEventListener(
  "pointermove",
  () => {
    if (placementMode && dragging) {
      if (selectionHelper.visible) selectionHelper.update();
      requestRender(false, 1);
    }
  },
  true,
);
document.addEventListener("input", () => requestRender(false, 1), true);
document.addEventListener("change", () => requestRender(false, 1), true);
document.addEventListener("click", () => requestRender(false, 1), true);

const qualityProfiles = {
  adaptive: {
    ratio: 1,
    day: 512,
    overhead: 768,
    shadow: THREE.PCFShadowMap,
    daylightShadow: false,
    overheadShadow: true,
    label: "Adaptive",
  },
  low: {
    ratio: 0.85,
    day: 256,
    overhead: 512,
    shadow: THREE.BasicShadowMap,
    daylightShadow: false,
    overheadShadow: true,
    label: "Low",
  },
  balanced: {
    ratio: Math.min(devicePixelRatio, 1.15),
    day: 512,
    overhead: 1024,
    shadow: THREE.PCFShadowMap,
    daylightShadow: false,
    overheadShadow: true,
    label: "Balanced",
  },
  high: {
    ratio: Math.min(devicePixelRatio, 1.5),
    day: 1024,
    overhead: 1024,
    shadow: THREE.PCFSoftShadowMap,
    daylightShadow: true,
    overheadShadow: true,
    label: "High",
  },
};
function resetShadowMap(light, size) {
  light.shadow.mapSize.set(size, size);
  if (light.shadow.map) {
    light.shadow.map.dispose();
    light.shadow.map = null;
  }
}
function setQuality(key, announce = true) {
  state.quality = qualityProfiles[key] ? key : "adaptive";
  const q = qualityProfiles[state.quality];
  renderer.setPixelRatio(q.ratio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.type = q.shadow;
  daylight.castShadow = q.daylightShadow;
  overheadLight.castShadow = q.overheadShadow;
  resetShadowMap(daylight, q.day);
  resetShadowMap(overheadLight, q.overhead);
  document.getElementById("qualitySelect").value = state.quality;
  requestRender(true, 2);
  if (announce) toast(`${q.label} quality`);
}
document.getElementById("qualitySelect").onchange = (e) =>
  setQuality(e.target.value);

function openRoomSection(id) {
  toggleDrawer(true);
  setTimeout(() => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.classList.add("flash");
    setTimeout(() => el?.classList.remove("flash"), 1200);
  }, 80);
}
document.getElementById("paintSummaryButton").onclick = () =>
  openRoomSection("paintSection");
document.getElementById("floorSummaryButton").onclick = () =>
  openRoomSection("floorSection");

const history = [];
let historyIndex = -1,
  historySuppressed = false,
  historyTimer = null;
function serializePlanner() {
  return JSON.stringify({
    state: {
      x: state.x,
      z: state.z,
      rotation: state.rotation,
      snap: state.snap,
      gridSize: state.gridSize,
      showGrid: state.showGrid,
      accentFollow: state.accentFollow,
      accentWall: state.accentWall,
      accentColour: state.accentColour,
      presetWall: state.presetWall,
      wallMode: state.wallMode,
      floor: state.floor,
      quality: state.quality,
      lightFitting: state.lightFitting,
    },
    lighting: {
      time: lightingState.time,
      daylightLevel: lightingState.daylightLevel,
      overheadLevel: lightingState.overheadLevel,
    },
    fov: camera.fov,
    items: placedItems.map((i) =>
      i.mount === "floor"
        ? { key: i.key, mount: i.mount, x: i.x, z: i.z, rotation: i.rotation }
        : {
            key: i.key,
            mount: i.mount,
            wall: i.wall,
            height: i.height,
            offset: i.offset,
            orientation: i.orientation,
          },
    ),
  });
}
function updateHistoryButtons() {
  document.getElementById("undoButton").disabled = historyIndex <= 0;
  document.getElementById("redoButton").disabled =
    historyIndex >= history.length - 1;
}
function commitHistory() {
  if (historySuppressed) return;
  const snap = serializePlanner();
  if (history[historyIndex] === snap) return;
  history.splice(historyIndex + 1);
  history.push(snap);
  if (history.length > 40) history.shift();
  historyIndex = history.length - 1;
  updateHistoryButtons();
}
function queueHistory() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(commitHistory, 80);
}
function rebuildItems(items) {
  for (const item of placedItems) scene.remove(item.group);
  placedItems.length = 0;
  itemMeshes.length = 0;
  selectedPlacedItem = null;
  itemCounter = 0;
  for (const saved of items) {
    const def = itemDefs[saved.key];
    if (!def) continue;
    const group = buildProxy(def, saved.key),
      item = {
        id: ++itemCounter,
        key: saved.key,
        name: def.name,
        category: def.category,
        source: def.source,
        mount: def.mount,
        w: def.w,
        d: def.d,
        h: def.h,
        rotation: saved.rotation || 0,
        group,
      };
    group.userData.itemRef = item;
    group.traverse((m) => {
      if (m.isMesh) m.userData.itemRef = item;
    });
    scene.add(group);
    placedItems.push(item);
    if (def.mount === "floor") {
      item.x = saved.x;
      item.z = saved.z;
      group.position.set(item.x, 0, item.z);
      group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    } else {
      item.wall = saved.wall;
      item.height = saved.height;
      item.offset = saved.offset;
      item.orientation = saved.orientation || "portrait";
      wallPosition(item);
    }
  }
  updateSelectedPanel();
  updatePlacedList();
}
function restorePlanner(serialized) {
  cancelPendingPlacement(false);
  historySuppressed = true;
  const snap = JSON.parse(serialized),
    s = snap.state;
  Object.assign(state, s);
  bedGroup.position.set(state.x, 0, state.z);
  bedGroup.rotation.y = THREE.MathUtils.degToRad(state.rotation);
  document
    .querySelectorAll("[data-place-wall]")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        Number(b.dataset.placeWall) === state.presetWall,
      ),
    );
  setAccentColour(state.accentColour, false);
  setAccentWall(state.accentWall, false);
  setFloorMaterial(state.floor, false);
  setWallMode(state.wallMode, false);
  setLightFitting(state.lightFitting || "solklint");
  lightingState.daylightLevel = snap.lighting.daylightLevel;
  lightingState.overheadLevel = snap.lighting.overheadLevel;
  document.getElementById("daylightSlider").value = lightingState.daylightLevel;
  document.getElementById("daylightValue").textContent =
    lightingState.daylightLevel.toFixed(2);
  document.getElementById("overheadSlider").value = lightingState.overheadLevel;
  document.getElementById("overheadValue").textContent =
    lightingState.overheadLevel.toFixed(2);
  overheadLight.intensity = lightingState.overheadLevel;
  applyTimeOfDay(snap.lighting.time, false);
  setFov(snap.fov);
  setQuality(state.quality || "adaptive", false);
  document.getElementById("snapToggle").checked = state.snap;
  document.getElementById("gridToggle").checked = state.showGrid;
  document.getElementById("gridSize").value = state.gridSize;
  document.getElementById("accentFollow").checked = state.accentFollow;
  document.getElementById("accentWall").disabled = state.accentFollow;
  rebuildItems(snap.items || []);
  updateFields();
  updateChecks();
  updateGrid();
  historySuppressed = false;
  requestRender(true, 2);
}
function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restorePlanner(history[historyIndex]);
  updateHistoryButtons();
  toast("Undone");
}
function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  restorePlanner(history[historyIndex]);
  updateHistoryButtons();
  toast("Redone");
}
document.getElementById("undoButton").onclick = undo;
document.getElementById("redoButton").onclick = redo;
document.addEventListener("change", queueHistory, true);
renderer.domElement.addEventListener("pointerup", queueHistory, true);
document.addEventListener("keyup", (e) => {
  if (!e.ctrlKey && !e.metaKey) queueHistory();
});

document.addEventListener(
  "keydown",
  (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const tag = document.activeElement?.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    }
  },
  true,
);

const coachSteps = [
  {
    title: "Look around",
    copy: "Drag empty space in the room to orbit. Use the mouse wheel to zoom and right-drag to pan.",
    target: null,
  },
  {
    title: "Move furniture deliberately",
    copy: "Furniture is locked during normal viewing. Choose Move objects only when you intend to select and drag something.",
    target: "placementToggle",
  },
  {
    title: "Change the room",
    copy: "The paint and floor cards are controls. Click either one to jump directly to that setting.",
    target: "paintSummaryButton",
  },
  {
    title: "Add planning furniture",
    copy: "Choose an item, move its luminous green ghost to the exact position and click to place. Red means the position is blocked.",
    target: "libraryToggle",
  },
];
let coachIndex = 0;
function showCoach(index = 0) {
  coachIndex = Math.max(0, Math.min(coachSteps.length - 1, index));
  document
    .querySelectorAll(".coach-highlight")
    .forEach((e) => e.classList.remove("coach-highlight"));
  const s = coachSteps[coachIndex];
  document.getElementById("coachNumber").textContent = coachIndex + 1;
  document.getElementById("coachTitle").textContent = s.title;
  document.getElementById("coachCopy").textContent = s.copy;
  document.getElementById("coachBack").disabled = coachIndex === 0;
  document.getElementById("coachNext").textContent =
    coachIndex === coachSteps.length - 1 ? "Finish" : "Next";
  document.getElementById("coachmark").classList.add("show");
  if (s.target)
    document.getElementById(s.target)?.classList.add("coach-highlight");
}
function closeCoach() {
  document.getElementById("coachmark").classList.remove("show");
  document
    .querySelectorAll(".coach-highlight")
    .forEach((e) => e.classList.remove("coach-highlight"));
  try {
    localStorage.setItem("bedroomPlannerV202Tour", "done");
  } catch (e) {}
}
document.getElementById("coachNext").onclick = () =>
  coachIndex === coachSteps.length - 1
    ? closeCoach()
    : showCoach(coachIndex + 1);
document.getElementById("coachBack").onclick = () => showCoach(coachIndex - 1);
document.getElementById("coachSkip").onclick = closeCoach;
document.getElementById("restartTour").onclick = () => {
  toggleHotkeys(false);
  showCoach(0);
};

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  requestRender(false, 2);
});
moveCamera("design", true);
setWallMode("cutaway", false);
setPlacementMode(false, false);
setAccentColour("dusted_fondant", false);
setAccentWall(1, false);
placeBed(1, false);
setFloorMaterial("carpet", false);
setLightFitting("solklint");
applyTimeOfDay(14, false);
setFov(34);
setQuality("adaptive", false);
updateGrid();
updatePlacedList();
setTimeout(() => {
  window.BedroomPlannerStartup?.markReady();
  if (!window.BedroomPlannerStartup) document.getElementById("loading")?.classList.add("done");
  requestRender(true, 2);
  commitHistory();
  let done = false;
  try {
    done = localStorage.getItem("bedroomPlannerV202Tour") === "done";
  } catch (e) {}
  if (!done) setTimeout(() => showCoach(0), 380);
}, 350);


window.BedroomPlannerDiagnostics = {
  version: "2.02",
  renderer,
  scene,
  camera,
  get drawCalls() { return renderer.info.render.calls; },
  get triangles() { return renderer.info.render.triangles; },
  get pixelRatio() { return renderer.getPixelRatio(); },
  get scheduledRenderFrames() { return scheduledRenderFrames; },
  get completedRenderFrames() { return completedRenderFrames; },
  get renderPending() { return renderQueued || renderInProgress; },
  get cutawaySide() { return lastCutawaySide; },
  get hiddenWalls() { return [...hiddenWallsForCamera()].sort(); },
  renderOnce() { requestRender(false, 1); },
};

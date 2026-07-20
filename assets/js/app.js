const MODEL = window.BEDROOM_MODEL;
const C = {
  dusted_fondant: "#c3b3b8",
  raspberry_diva: "#b27782",
  wall_white: "#fffdfa",
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
renderer.toneMappingExposure = 1.0;
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
    p.emissiveIntensity = 0.035;
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
  mesh.castShadow = !["glass", "wall"].includes(batch.source.category);
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

// Replace the generic storage-heater block with a recognisable late-2010s Dimplex Quantum casing.
// The measured room object is approximately 105.4 x 73.7 x 19.1 cm. The planning proxy
// uses the 106.9 x 73.0 x 18.5 cm casing shared by the nearest Quantum variants, while
// matching the generation's white bowed-edge case, subtle vertical front channels,
// low-level fan grille, cylindrical feet and closed top-right control lid.
for (const m of [...roomGroup.children]) {
  if (/^(Storage_Heater$|Heater_Grille_|Heater_Switch_)/.test(m.name)) {
    roomGroup.remove(m);
    m.geometry?.dispose();
  }
}
const quantumHeater = new THREE.Group();
quantumHeater.name = "Storage_Heater_Dimplex_Quantum_Late_2010s";
const qWhite = new THREE.MeshStandardMaterial({
  color: 0xf8f8f5,
  roughness: 0.76,
  metalness: 0.01,
});
const qSoftWhite = new THREE.MeshStandardMaterial({
  color: 0xe9e9e5,
  roughness: 0.8,
  metalness: 0.01,
});
const qEdge = new THREE.MeshStandardMaterial({
  color: 0xd2d3d1,
  roughness: 0.7,
  metalness: 0.08,
});
const qDark = new THREE.MeshStandardMaterial({
  color: 0x303336,
  roughness: 0.58,
  metalness: 0.08,
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

// Main insulated case and gently stepped front shell.
qPart(
  "Main_Case",
  new THREE.BoxGeometry(qD - 1.3, 61.5, qW - 2.0),
  qWhite,
  qD / 2 - 0.65,
  qBaseY + 39.0,
  qCentreZ,
);
qPart(
  "Front_Panel",
  new THREE.BoxGeometry(1.05, 50.5, qW - 5.2),
  qWhite,
  qD - 0.05,
  qBaseY + 45.0,
  qCentreZ,
);
qPart(
  "Top_Cap",
  new THREE.BoxGeometry(qD - 0.8, 4.8, qW - 1.0),
  qWhite,
  qD / 2 - 0.4,
  qBaseY + 70.4,
  qCentreZ,
);
qPart(
  "Lower_Case_Rail",
  new THREE.BoxGeometry(qD - 0.6, 5.0, qW - 1.4),
  qEdge,
  qD / 2 - 0.3,
  qBaseY + 8.9,
  qCentreZ,
);

// Quantum's front is mostly plain, with restrained vertical pressed channels.
for (let i = 0; i < 6; i++) {
  const z = qCentreZ - 41.5 + i * 16.6;
  qPart(
    `Front_Channel_${i}`,
    new THREE.BoxGeometry(0.22, 39.5, 0.8),
    qSoftWhite,
    qD + 0.49,
    qBaseY + 45.0,
    z,
  );
}

// Low fan-assisted outlet: a silver-toned rail containing repeated dark slots.
qPart(
  "Outlet_Frame",
  new THREE.BoxGeometry(1.0, 8.6, qW - 4.2),
  qEdge,
  qD + 0.1,
  qBaseY + 12.4,
  qCentreZ,
);
for (let row = 0; row < 2; row++) {
  for (let i = 0; i < 12; i++) {
    const z = qCentreZ - 46.0 + i * (92.0 / 11);
    qPart(
      `Outlet_Slot_${row}_${i}`,
      new THREE.BoxGeometry(0.48, 1.55, 5.6),
      qDark,
      qD + 0.66,
      qBaseY + 10.4 + row * 3.6,
      z,
    );
  }
}

// White end cheeks and small side ventilation details.
for (const side of [-1, 1]) {
  const z = qCentreZ + side * (qW / 2 - 1.1);
  qPart(
    `End_Cheek_${side}`,
    new THREE.BoxGeometry(qD, 62.0, 2.2),
    qSoftWhite,
    qD / 2,
    qBaseY + 39.0,
    z,
  );
  for (let i = 0; i < 3; i++)
    qPart(
      `Side_Vent_${side}_${i}`,
      new THREE.BoxGeometry(4.4, 0.85, 0.55),
      qDark,
      qD - 3.0,
      qBaseY + 57.4 + i * 2.2,
      qCentreZ + side * (qW / 2 + 0.03),
    );
}

// The normal room view sees the closed hinged control lid rather than an exposed screen.
qPart(
  "Control_Lid",
  new THREE.BoxGeometry(qD - 3.4, 1.25, 24.0),
  qWhite,
  qD / 2 - 0.3,
  qBaseY + qH - 0.1,
  qCentreZ + 37.5,
);
qPart(
  "Control_Lid_Seam",
  new THREE.BoxGeometry(qD - 4.2, 0.18, 22.0),
  qEdge,
  qD / 2 - 0.3,
  qBaseY + qH + 0.54,
  qCentreZ + 37.5,
);

// Two rounded floor feet, matching the visible Quantum installation style.
for (const z of [qCentreZ - 34.5, qCentreZ + 34.5])
  qPart(
    "Foot",
    new THREE.CylinderGeometry(4.1, 4.1, 7.2, 20),
    qSoftWhite,
    6.5,
    qBaseY + 3.6,
    z,
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
  mesh.name = "Storage_Heater_Dimplex_Quantum_Batch";
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

const ambient = new THREE.AmbientLight(0xfffdf9, 0.11);
const hemisphere = new THREE.HemisphereLight(0xf6fbff, 0xc9beb0, 0.32);
scene.add(ambient, hemisphere);
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
  ambient.intensity = 0.07 + 0.08 * dayFactor;
  hemisphere.color.copy(
    colourAt(
      [
        [6, "#d8dcea"],
        [12.5, "#f7fbff"],
        [19.5, "#d8c8cf"],
        [22, "#78839a"],
      ],
      hours,
    ),
  );
  hemisphere.groundColor.copy(
    colourAt(
      [
        [6, "#a68f84"],
        [12.5, "#d7cfc4"],
        [19.5, "#9b7f78"],
        [22, "#4b4e5c"],
      ],
      hours,
    ),
  );
  hemisphere.intensity = 0.2 + 0.18 * dayFactor;
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
  renderer.toneMappingExposure = 0.94 + 0.08 * dayFactor;
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
const ROTATE_SNAP_DEGREES = 90;
const ROTATE_FINE_DEGREES = 5;
function rotationStep(fine = false) {
  return fine ? ROTATE_FINE_DEGREES : ROTATE_SNAP_DEGREES;
}
function nearestRightAngle(angle) {
  return normalizeAngle(Math.round(angle / ROTATE_SNAP_DEGREES) * ROTATE_SNAP_DEGREES);
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
  requestRender(true, 2);
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
function rotateBed(dir, fine = false) {
  state.rotation = normalizeAngle(state.rotation + dir * rotationStep(fine));
  applyBedTransform();
  requestRender(true, 2);
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
  deletable = false,
  wallSnap = "",
} = {}) {
  const banner = document.getElementById("modeBanner");
  banner.classList.toggle("show", show);
  banner.classList.toggle("placing", placing);
  banner.classList.toggle("invalid", invalid);
  banner.classList.toggle("has-actions", rotate || orientation || deletable || wallSnap);
  let actionButtons = "";
  if (orientation)
    actionButtons += '<button type="button" data-quick-rotate="1" data-fine="false">↔ Switch orientation</button>';
  if (rotate)
    actionButtons += '<button type="button" data-quick-rotate="-1" data-fine="false">↺ 90° <kbd>Q</kbd></button><button type="button" data-quick-rotate="1" data-fine="false">90° <kbd>E</kbd> ↻</button><button type="button" class="fine" data-quick-rotate="-1" data-fine="true">↺ 5° <kbd>Shift Q</kbd></button><button type="button" class="fine" data-quick-rotate="1" data-fine="true">5° <kbd>Shift E</kbd> ↻</button>';
  if (wallSnap)
    actionButtons += `<button type="button" data-quick-wall-snap="true">${wallSnap}</button>`;
  if (deletable)
    actionButtons += '<button type="button" class="delete" data-quick-delete="true">Delete <kbd>Del</kbd></button>';
  const actions = actionButtons ? `<span class="mode-banner-actions">${actionButtons}</span>` : "";
  banner.innerHTML = `<i></i><span class="mode-banner-copy"><b>${title}</b> ${text}</span>${actions}`;
  banner.querySelectorAll("[data-quick-rotate]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const direction = Number(button.dataset.quickRotate) || 1;
      const fine = button.dataset.fine === "true";
      if (pendingPlacement) rotatePending(direction, fine);
      else rotateSelectedItem(direction, fine);
    });
  });
  banner.querySelector("[data-quick-wall-snap]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleActiveWallSnap();
  });
  banner.querySelector("[data-quick-delete]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeSelectedItem();
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
      text: "Click furniture to select it, then drag. P or Esc finishes.",
    });
    return;
  }
  const wallMounted = selectedPlacedItem.mount === "wall";
  const autoSnap = supportsAutoWallSnap(selectedPlacedItem);
  const detail = wallMounted
    ? "Switch orientation or delete here. Right-drag only pans the camera."
    : `Drag or use arrows to move. Angle ${normalizeAngle(selectedPlacedItem.rotation).toFixed(0)}°. Q/E rotate 90°; Shift gives 5°.${autoSnap ? " Wardrobes align their backs to nearby walls unless manually overridden." : ""}`;
  renderModeBanner({
    show: true,
    title: `${selectedPlacedItem.name} selected.`,
    text: detail,
    rotate: !wallMounted,
    orientation: wallMounted,
    deletable: true,
    wallSnap: wallMounted ? "" : wallSnapLabel(selectedPlacedItem),
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
  idanasWhite: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.82 }),
  idanasInset: new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.88 }),
  idanasHardware: new THREE.MeshStandardMaterial({ color: 0x6b665f, roughness: 0.5, metalness: 0.12 }),
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
  idanaes: {
    name: "IDANÄS folding-door wardrobe",
    category: "Folding-door wardrobe",
    mount: "floor",
    w: 121,
    d: 59,
    h: 211,
    source: "IKEA 604.588.35",
    sourceUrl: "https://www.ikea.com/gb/en/p/idanaes-wardrobe-white-60458835/",
    autoWallSnap: true,
  },
  pax: {
    name: "PAX wardrobe frame",
    category: "Wardrobe",
    mount: "floor",
    w: 100,
    d: 58,
    h: 201.2,
    source: "IKEA 704.582.03",
    autoWallSnap: true,
  },
  brimnes: {
    name: "BRIMNES 3-door wardrobe",
    category: "Mirrored wardrobe",
    mount: "floor",
    w: 117,
    d: 50,
    h: 190,
    source: "IKEA 404.079.22",
    autoWallSnap: true,
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
function addProxySphere(group, radius, x, y, z, material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material.clone());
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
  } else if (key === "idanaes") {
    // Closed planning model based on the white IDANÄS bifold-door wardrobe.
    // The overall bounding volume remains exactly 121 × 59 × 211 cm.
    const frontZ = def.d / 2 - 1;
    const doorBottom = 21;
    const doorHeight = 181;
    const doorTop = doorBottom + doorHeight;
    const innerWidth = def.w - 10;
    const doorGap = 0.6;
    const leafWidth = (innerWidth - doorGap * 3) / 4;
    const firstLeafX = -innerWidth / 2 + leafWidth / 2;

    // Full-depth cap fixes the exact outer dimensions; the remaining pieces sit within it.
    addProxyBox(g, def.w, 5, def.d, 0, def.h - 2.5, 0, proxyMaterials.idanasWhite);
    addProxyBox(g, def.w - 6, 6, def.d - 4, 0, 18, 0, proxyMaterials.idanasWhite);
    addProxyBox(g, def.w - 8, 184, 1.4, 0, 111, -def.d / 2 + 0.7, proxyMaterials.idanasInset);

    for (const x of [-def.w / 2 + 1.5, def.w / 2 - 1.5])
      addProxyBox(g, 3, 188, def.d - 4, x, 112, 0, proxyMaterials.idanasWhite);

    for (const x of [-def.w / 2 + 4.5, def.w / 2 - 4.5])
      for (const z of [-def.d / 2 + 4.5, def.d / 2 - 4.5])
        addProxyBox(g, 4.5, 12, 4.5, x, 6, z, proxyMaterials.idanasWhite);

    addProxyBox(g, def.w - 5, 4.5, def.d - 4, 0, doorBottom - 1.5, 0, proxyMaterials.idanasWhite);

    for (let i = 0; i < 4; i++) {
      const x = firstLeafX + i * (leafWidth + doorGap);
      addProxyBox(g, leafWidth, doorHeight, 2, x, doorBottom + doorHeight / 2, frontZ, proxyMaterials.idanasWhite);
      addProxyBox(g, leafWidth - 4.2, doorHeight - 12, 0.55, x, doorBottom + doorHeight / 2, def.d / 2 - 0.28, proxyMaterials.idanasInset);
      addProxyBox(g, 1.3, doorHeight - 7, 0.45, x - leafWidth / 2 + 2.1, doorBottom + doorHeight / 2, def.d / 2 - 0.23, proxyMaterials.idanasWhite);
      addProxyBox(g, 1.3, doorHeight - 7, 0.45, x + leafWidth / 2 - 2.1, doorBottom + doorHeight / 2, def.d / 2 - 0.23, proxyMaterials.idanasWhite);
      addProxyBox(g, leafWidth - 3.2, 2, 0.45, x, doorTop - 3, def.d / 2 - 0.23, proxyMaterials.idanasWhite);
      addProxyBox(g, leafWidth - 3.2, 2, 0.45, x, doorBottom + 3, def.d / 2 - 0.23, proxyMaterials.idanasWhite);
      addProxySphere(g, 0.68, x, 106, def.d / 2 - 0.68, proxyMaterials.idanasHardware);
    }
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
const AUTO_WALL_SNAP_GAP = 0.8;
const AUTO_WALL_SNAP_DISTANCE = 38;
function supportsAutoWallSnap(item) {
  return item?.mount === "floor" && !!item.autoWallSnap;
}
function floorWallSnapCandidates(item, rawX, rawZ) {
  const halfAlong = item.w / 2;
  const halfDepth = item.d / 2;
  const edgeMargin = 2;
  const candidates = [];
  function add(wall, axis, start, end, fixed, rotation) {
    const lo = start + halfAlong + edgeMargin;
    const hi = end - halfAlong - edgeMargin;
    if (lo > hi) return;
    const along = THREE.MathUtils.clamp(axis === "x" ? rawX : rawZ, lo, hi);
    const x = axis === "x" ? along : fixed;
    const z = axis === "z" ? along : fixed;
    const poly = objectPolygon(item, x, z, rotation);
    if (!polygonInsideRoom(poly)) return;
    candidates.push({
      wall,
      x,
      z,
      rotation,
      distance: Math.hypot(x - rawX, z - rawZ),
    });
  }
  add(1, "x", 0, D.W1, halfDepth + AUTO_WALL_SNAP_GAP, 0);
  add(2, "z", 0, D.W2, D.W1 - halfDepth - AUTO_WALL_SNAP_GAP, -90);
  add(3, "x", D.W1, D.W5, D.W2 + halfDepth + AUTO_WALL_SNAP_GAP, 0);
  add(4, "z", D.W2, D.W6, D.W5 - halfDepth - AUTO_WALL_SNAP_GAP, -90);
  add(5, "x", 0, D.W5, D.W6 - halfDepth - AUTO_WALL_SNAP_GAP, 180);
  add(6, "z", 0, D.W6, halfDepth + AUTO_WALL_SNAP_GAP, 90);
  return candidates.sort((a, b) => a.distance - b.distance);
}
function nearestFloorWallSnap(item, rawX, rawZ) {
  if (!supportsAutoWallSnap(item) || item.wallSnapOverride) return null;
  const candidate = floorWallSnapCandidates(item, rawX, rawZ)[0];
  return candidate && candidate.distance <= AUTO_WALL_SNAP_DISTANCE ? candidate : null;
}
function applyFloorItemPosition(item, rawX, rawZ, allowWallSnap = true) {
  const x = snapValue(rawX);
  const z = snapValue(rawZ);
  const candidate = allowWallSnap ? nearestFloorWallSnap(item, x, z) : null;
  if (candidate) {
    item.x = candidate.x;
    item.z = candidate.z;
    item.rotation = candidate.rotation;
    item.snappedWall = candidate.wall;
  } else {
    item.x = x;
    item.z = z;
    item.snappedWall = null;
  }
  item.group.position.set(item.x, 0, item.z);
  item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  return candidate;
}
function wallNormalExtent(item, rotation, wall) {
  const angle = THREE.MathUtils.degToRad(rotation);
  const xExtent = Math.abs(Math.cos(angle)) * item.w / 2 + Math.abs(Math.sin(angle)) * item.d / 2;
  const zExtent = Math.abs(Math.sin(angle)) * item.w / 2 + Math.abs(Math.cos(angle)) * item.d / 2;
  return wall === 1 || wall === 3 || wall === 5 ? zExtent : xExtent;
}
function detachFromSnappedWall(item, wall, oldRotation, newRotation) {
  if (!wall) return;
  const oldExtent = wallNormalExtent(item, oldRotation, wall);
  const newExtent = wallNormalExtent(item, newRotation, wall);
  const shift = Math.max(0, newExtent - oldExtent) + 0.8;
  if (wall === 1 || wall === 3) item.z += shift;
  else if (wall === 2 || wall === 4) item.x -= shift;
  else if (wall === 5) item.z -= shift;
  else if (wall === 6) item.x += shift;
}
function wallSnapLabel(item) {
  if (!supportsAutoWallSnap(item)) return "";
  if (item.wallSnapOverride) return "Restore wall snap <kbd>W</kbd>";
  return item.snappedWall
    ? `Wall ${item.snappedWall} snapped <kbd>W</kbd>`
    : "Auto wall snap on <kbd>W</kbd>";
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
      "Enable Move objects, then click furniture. Rotation and deletion are also shown in the selection banner. The bed keeps its own controls in Room settings.";
    floor.classList.add("hidden");
    wall.classList.add("hidden");
    document.getElementById("itemStatus").className = "status-line good";
    document.getElementById("itemStatus").querySelector("b").textContent =
      "Ready";
    return;
  }
  const item = selectedPlacedItem;
  card.querySelector("h4").textContent = item.name;
  card.querySelector("p").textContent = item.key === "idanaes"
    ? `${item.category} · ${item.source} · exact 121 × 59 × 211 cm outer dimensions`
    : `${item.category} · ${item.source} · approximate planning proxy`;
  if (item.mount === "floor") {
    floor.classList.remove("hidden");
    wall.classList.add("hidden");
    document.getElementById("itemX").value = item.x.toFixed(1);
    document.getElementById("itemZ").value = item.z.toFixed(1);
    document.getElementById("itemRotation").value = normalizeAngle(
      item.rotation,
    ).toFixed(0);
    const wallSnapControl = document.getElementById("itemWallSnapControl");
    const wallSnapButton = document.getElementById("itemWallSnapToggle");
    wallSnapControl.classList.toggle("hidden", !supportsAutoWallSnap(item));
    if (supportsAutoWallSnap(item)) {
      wallSnapButton.innerHTML = wallSnapLabel(item);
      wallSnapButton.classList.toggle("active", !item.wallSnapOverride);
      document.getElementById("itemWallSnapStatus").textContent = item.wallSnapOverride
        ? "Manual angle override is active. Press W to restore automatic wall alignment."
        : item.snappedWall
          ? `Back aligned flush to Wall ${item.snappedWall}. Rotate manually to override.`
          : "Move near a wall and the wardrobe back will align and sit flush automatically.";
    }
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
    wallSnap: item?.mount === "floor" ? wallSnapLabel(item) : "",
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
    valid
      ? `${supportsAutoWallSnap(pendingPlacement.item) ? "Wardrobe backs snap to nearby walls. " : ""}Rotate 90° with Q/E, fine-tune 5° with Shift, then click to place · Esc cancels`
      : message,
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
      autoWallSnap: !!def.autoWallSnap,
      wallSnapOverride: false,
      snappedWall: null,
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
    applyFloorItemPosition(item, dragPoint.x, dragPoint.z, true);
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
function rotatePending(dir = 1, fine = false) {
  if (!pendingPlacement) return;
  const item = pendingPlacement.item;
  if (item.mount === "wall") {
    item.orientation =
      item.orientation === "portrait" ? "landscape" : "portrait";
    if (pendingPlacement.hasPosition) wallPosition(item);
  } else {
    const oldRotation = item.rotation;
    const oldWall = item.snappedWall;
    item.rotation = normalizeAngle(item.rotation + dir * rotationStep(fine));
    if (supportsAutoWallSnap(item)) {
      item.wallSnapOverride = true;
      detachFromSnappedWall(item, oldWall, oldRotation, item.rotation);
      item.snappedWall = null;
    }
    item.group.position.set(item.x, 0, item.z);
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
    applyFloorItemPosition(item, item.x + dx, item.z + dz, true);
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
      autoWallSnap: !!p.def.autoWallSnap,
      wallSnapOverride: !!temp.wallSnapOverride,
      snappedWall: temp.snappedWall || null,
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
  updateSelectionHighlight(null);
  scene.remove(item.group);
  item.group.traverse((m) => {
    const i = itemMeshes.indexOf(m);
    if (i >= 0) itemMeshes.splice(i, 1);
  });
  placedItems.splice(placedItems.indexOf(item), 1);
  disposeGroup(item.group);
  selectedPlacedItem = null;
  updateSelectedPanel();
  updatePlacedList();
  refreshMoveBanner();
  shadowDirty = true;
  renderer.shadowMap.needsUpdate = true;
  requestRender(true, 3);
  queueHistory();
  toast(`${item.name} removed`);
}
function moveSelectedItem(dx, dz) {
  if (!selectedPlacedItem || selectedPlacedItem.mount !== "floor") {
    nudge(dx, dz);
    return;
  }
  const item = selectedPlacedItem,
    old = { x: item.x, z: item.z, rotation: item.rotation, snappedWall: item.snappedWall };
  applyFloorItemPosition(item, item.x + dx, item.z + dz, true);
  const v = validateFloorItem(item);
  if (v.hard) {
    Object.assign(item, old);
    toast(v.message);
  }
  item.group.position.set(item.x, 0, item.z);
  item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  updateSelectedPanel();
  updatePlacedList();
  requestRender(true, 2);
}
function rotateSelectedItem(dir, fine = false) {
  if (!selectedPlacedItem) {
    rotateBed(dir, fine);
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
    const old = {
      rotation: item.rotation,
      x: item.x,
      z: item.z,
      snappedWall: item.snappedWall,
      wallSnapOverride: item.wallSnapOverride,
    };
    item.rotation = normalizeAngle(item.rotation + dir * rotationStep(fine));
    if (supportsAutoWallSnap(item)) {
      item.wallSnapOverride = true;
      detachFromSnappedWall(item, old.snappedWall, old.rotation, item.rotation);
      item.snappedWall = null;
    }
    if (validateFloorItem(item).hard) {
      Object.assign(item, old);
      toast("Rotation would create an impossible overlap");
    }
    item.group.position.set(item.x, 0, item.z);
    item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  }
  updateSelectedPanel();
  updatePlacedList();
  refreshMoveBanner();
  requestRender(true, 2);
}
function toggleActiveWallSnap() {
  const item = pendingPlacement?.item || selectedPlacedItem;
  if (!supportsAutoWallSnap(item)) {
    toast("Wall snap is available for wardrobes");
    return;
  }
  item.wallSnapOverride = !item.wallSnapOverride;
  if (!item.wallSnapOverride && Number.isFinite(item.x) && Number.isFinite(item.z)) {
    const old = { x: item.x, z: item.z, rotation: item.rotation, snappedWall: item.snappedWall };
    applyFloorItemPosition(item, item.x, item.z, true);
    if (!pendingPlacement && validateFloorItem(item).hard) {
      Object.assign(item, old);
      item.group.position.set(item.x, 0, item.z);
      item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    }
  } else if (item.wallSnapOverride) {
    item.snappedWall = null;
  }
  if (pendingPlacement?.hasPosition) {
    const v = itemValidation(item);
    setGhostAppearance(!v.hard, v.message);
  } else {
    updateSelectedPanel();
    refreshMoveBanner();
    requestRender(true, 2);
  }
  toast(item.wallSnapOverride ? "Manual wardrobe rotation enabled" : "Automatic wardrobe wall snap enabled");
}

function snapActiveRotation() {
  if (pendingPlacement) {
    const item = pendingPlacement.item;
    if (item.mount !== "floor") return;
    item.rotation = nearestRightAngle(item.rotation);
    item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    if (pendingPlacement.hasPosition) {
      const v = itemValidation(item);
      setGhostAppearance(!v.hard, v.message);
    } else requestRender(false, 1);
    return;
  }
  if (placementMode && selectedPlacedItem) {
    if (selectedPlacedItem.mount !== "floor") return;
    const old = selectedPlacedItem.rotation;
    selectedPlacedItem.rotation = nearestRightAngle(old);
    if (validateFloorItem(selectedPlacedItem).hard) {
      selectedPlacedItem.rotation = old;
      toast("The nearest 90° angle does not fit here");
    }
    selectedPlacedItem.group.rotation.y = THREE.MathUtils.degToRad(selectedPlacedItem.rotation);
    updateSelectedPanel();
    updatePlacedList();
    refreshMoveBanner();
    requestRender(true, 2);
    return;
  }
  state.rotation = nearestRightAngle(state.rotation);
  applyBedTransform();
  requestRender(true, 2);
}
function activeNudge(dx, dz) {
  if (placementMode && selectedPlacedItem) moveSelectedItem(dx, dz);
  else nudge(dx, dz);
}
function activeRotate(dir, fine = false) {
  if (placementMode && selectedPlacedItem) rotateSelectedItem(dir, fine);
  else rotateBed(dir, fine);
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
    itemDragState = {
      x: item.x,
      z: item.z,
      rotation: item.rotation,
      snappedWall: item.snappedWall,
      lastX: item.x,
      lastZ: item.z,
      lastRotation: item.rotation,
      lastSnappedWall: item.snappedWall,
    };
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
  const x = dragPoint.x + dragOffset.x,
    z = dragPoint.z + dragOffset.z;
  if (dragTarget === "bed") {
    state.x = snapValue(x);
    state.z = snapValue(z);
    applyBedTransform();
  } else {
    applyFloorItemPosition(dragTarget, x, z, true);
    const v = validateFloorItem(dragTarget);
    if (!v.hard) {
      itemDragState.lastX = dragTarget.x;
      itemDragState.lastZ = dragTarget.z;
      itemDragState.lastRotation = dragTarget.rotation;
      itemDragState.lastSnappedWall = dragTarget.snappedWall;
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
      dragTarget.rotation = itemDragState.lastRotation;
      dragTarget.snappedWall = itemDragState.lastSnappedWall;
      dragTarget.group.position.set(dragTarget.x, 0, dragTarget.z);
      dragTarget.group.rotation.y = THREE.MathUtils.degToRad(dragTarget.rotation);
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
  .forEach((b) =>
    (b.onclick = () =>
      activeRotate(Number(b.dataset.rotate), b.dataset.rotateFine === "true")),
  );
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
    const old = {
      x: selectedPlacedItem.x,
      z: selectedPlacedItem.z,
      rotation: selectedPlacedItem.rotation,
      snappedWall: selectedPlacedItem.snappedWall,
      wallSnapOverride: selectedPlacedItem.wallSnapOverride,
    };
    const value = Number(e.target.value) || 0;
    if (key === "rotation") {
      selectedPlacedItem.rotation = normalizeAngle(value);
      if (supportsAutoWallSnap(selectedPlacedItem)) {
        selectedPlacedItem.wallSnapOverride = true;
        detachFromSnappedWall(
          selectedPlacedItem,
          old.snappedWall,
          old.rotation,
          selectedPlacedItem.rotation,
        );
        selectedPlacedItem.snappedWall = null;
      }
    } else {
      applyFloorItemPosition(
        selectedPlacedItem,
        key === "x" ? value : selectedPlacedItem.x,
        key === "z" ? value : selectedPlacedItem.z,
        true,
      );
    }
    const v = validateFloorItem(selectedPlacedItem);
    if (v.hard) {
      Object.assign(selectedPlacedItem, old);
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
    requestRender(true, 2);
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
  requestRender(true, 2);
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
  requestRender(true, 2);
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
  requestRender(true, 2);
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
  requestRender(true, 2);
};
document.getElementById("itemRotateLeft").onclick = () =>
  rotateSelectedItem(-1, false);
document.getElementById("itemRotateRight").onclick = () =>
  rotateSelectedItem(1, false);
document.getElementById("itemRotateFineLeft").onclick = () =>
  rotateSelectedItem(-1, true);
document.getElementById("itemRotateFineRight").onclick = () =>
  rotateSelectedItem(1, true);
document.getElementById("itemWallSnapToggle").onclick = toggleActiveWallSnap;
document.getElementById("itemDelete").onclick = removeSelectedItem;
document.getElementById("itemDeleteWall").onclick = removeSelectedItem;

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
  let handled = true,
    step = e.shiftKey ? 1 : state.snap ? state.gridSize : 1;
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
      pendingPlacement ? rotatePending(-1, e.shiftKey) : activeRotate(-1, e.shiftKey);
      break;
    case "e":
    case "E":
      pendingPlacement ? rotatePending(1, e.shiftKey) : activeRotate(1, e.shiftKey);
      break;
    case "r":
    case "R":
      snapActiveRotation();
      break;
    case "w":
    case "W":
      toggleActiveWallSnap();
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
        ? {
            key: i.key,
            mount: i.mount,
            x: i.x,
            z: i.z,
            rotation: i.rotation,
            wallSnapOverride: !!i.wallSnapOverride,
            snappedWall: i.snappedWall || null,
          }
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
        autoWallSnap: !!def.autoWallSnap,
        wallSnapOverride: !!saved.wallSnapOverride,
        snappedWall: saved.snappedWall || null,
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
    copy: "Choose an item, move its luminous green ghost and click to place. Wardrobes align to nearby walls automatically; rotate manually to override. Red means the position is blocked.",
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
    localStorage.setItem("bedroomPlannerV205Tour", "done");
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

/* Bedroom Room Planner v2.05 enhancement layer. */
(() => {
  const VERSION_205 = "2.05";
  state.floor = "cotton";
  state.floorDirection = 0;
  state.showClearances = false;
  state.showMeasurements = true;
  state.lightScene = "day";

  renderer.getContext().canvas.setAttribute("data-version", VERSION_205);
  proxyMaterials.idanasHardware.color.setHex(0x202020);
  proxyMaterials.idanasHardware.roughness = 0.42;
  proxyMaterials.idanasHardware.metalness = 0.16;

  function disposeObject3D(object) {
    object.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose?.();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        material?.map?.dispose?.();
        material?.dispose?.();
      }
    });
  }

  /* Non-overlapping room shell: one interior face per wall section, with
     separate reveals and mitred-profile trim. This removes coplanar corner
     geometry rather than relying on depth offsets. */
  function removeLegacyShell() {
    for (const child of [...roomGroup.children]) {
      if (!child.isMesh) continue;
      if (!["wall", "trim"].includes(child.userData.category)) continue;
      roomGroup.remove(child);
      disposeObject3D(child);
    }
    wallMeshes.length = 0;
  }

  const trimMaterial205 = new THREE.MeshStandardMaterial({
    color: 0xfffefa,
    roughness: 0.9,
    metalness: 0,
  });
  const revealMaterial205 = trimMaterial205.clone();
  const wallMaterials205 = new Map();
  function wallMaterial205(wall) {
    if (wallMaterials205.has(wall)) return wallMaterials205.get(wall);
    const material = new THREE.MeshStandardMaterial({
      color: 0xfffefa,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      dithering: true,
    });
    material.shadowSide = THREE.FrontSide;
    wallMaterials205.set(wall, material);
    return material;
  }
  function registerShellMesh(mesh, wall, category = "fixture") {
    mesh.userData.wallSection = wall;
    mesh.userData.category = category;
    mesh.castShadow = category === "wall";
    mesh.receiveShadow = true;
    roomGroup.add(mesh);
    return mesh;
  }
  function addWallFace(wall, name, length, height, x, y, z, rotationY = 0) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(length, height, 1, 1),
      wallMaterial205(wall).clone(),
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.userData.wallNumber = wall;
    registerShellMesh(mesh, wall, "wall");
    wallMeshes.push(mesh);
    return mesh;
  }
  function addTrimBox(wall, name, w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trimMaterial205.clone());
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return registerShellMesh(mesh, wall, "trim");
  }
  function covingGeometry(length, height = 6, depth = 4) {
    const x0 = -length / 2, x1 = length / 2;
    const vertices = new Float32Array([
      x0, 0, 0, x0, height, 0, x0, height, depth,
      x1, 0, 0, x1, height, 0, x1, height, depth,
    ]);
    const indices = [
      0, 3, 4, 0, 4, 1,
      1, 4, 5, 1, 5, 2,
      2, 5, 3, 2, 3, 0,
      0, 1, 2,
      3, 5, 4,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  function addCoving(wall, name, length, x, z, rotationY = 0) {
    const mesh = new THREE.Mesh(covingGeometry(length), trimMaterial205.clone());
    mesh.name = name;
    mesh.position.set(x, D.H - 6, z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    return registerShellMesh(mesh, wall, "trim");
  }
  function addReveal(wall, name, w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), revealMaterial205.clone());
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return registerShellMesh(mesh, wall, "fixture");
  }
  function rebuildRoomShell205() {
    removeLegacyShell();
    const eps = 0.018;
    addWallFace(1, "Wall_1_Interior", D.W1, D.H, D.W1 / 2, D.H / 2, eps, 0);
    addWallFace(2, "Wall_2_Interior", D.W2, D.H, D.W1 - eps, D.H / 2, D.W2 / 2, -Math.PI / 2);
    addWallFace(3, "Wall_3_Interior", D.W5 - D.W1, D.H, (D.W1 + D.W5) / 2, D.H / 2, D.W2 + eps, 0);
    const doorStart = 227.33, doorEnd = 321.31, doorTop = 204.47;
    addWallFace(4, "Wall_4_Interior_A", doorStart - D.W2, D.H, D.W5 - eps, D.H / 2, (D.W2 + doorStart) / 2, -Math.PI / 2);
    addWallFace(4, "Wall_4_Interior_B", D.W6 - doorEnd, D.H, D.W5 - eps, D.H / 2, (doorEnd + D.W6) / 2, -Math.PI / 2);
    addWallFace(4, "Wall_4_Interior_Header", doorEnd - doorStart, D.H - doorTop, D.W5 - eps, (D.H + doorTop) / 2, (doorStart + doorEnd) / 2, -Math.PI / 2);
    addWallFace(5, "Wall_5_Interior", D.W5, D.H, D.W5 / 2, D.H / 2, D.W6 - eps, Math.PI);
    const winStart = 52.07, winEnd = 224.79;
    addWallFace(6, "Wall_6_Interior_A", winStart, D.H, eps, D.H / 2, winStart / 2, Math.PI / 2);
    addWallFace(6, "Wall_6_Interior_B", D.W6 - winEnd, D.H, eps, D.H / 2, (winEnd + D.W6) / 2, Math.PI / 2);
    addWallFace(6, "Wall_6_Interior_Below", winEnd - winStart, D.window.bottom, eps, D.window.bottom / 2, (winStart + winEnd) / 2, Math.PI / 2);
    addWallFace(6, "Wall_6_Interior_Above", winEnd - winStart, D.H - D.window.top, eps, (D.H + D.window.top) / 2, (winStart + winEnd) / 2, Math.PI / 2);

    const s = 1.5, sh = 7.62;
    addTrimBox(1, "Skirting_W1_Refined", D.W1 - s * 2, sh, s, D.W1 / 2, sh / 2, s / 2);
    addTrimBox(2, "Skirting_W2_Refined", s, sh, D.W2 - s * 2, D.W1 - s / 2, sh / 2, D.W2 / 2);
    addTrimBox(3, "Skirting_W3_Refined", D.W5 - D.W1 - s * 2, sh, s, (D.W1 + D.W5) / 2, sh / 2, D.W2 + s / 2);
    addTrimBox(4, "Skirting_W4_A_Refined", s, sh, Math.max(2, doorStart - D.W2 - s), D.W5 - s / 2, sh / 2, (D.W2 + doorStart - s) / 2);
    addTrimBox(4, "Skirting_W4_B_Refined", s, sh, Math.max(2, D.W6 - doorEnd - s), D.W5 - s / 2, sh / 2, (doorEnd + D.W6 + s) / 2);
    addTrimBox(5, "Skirting_W5_Refined", D.W5 - s * 2, sh, s, D.W5 / 2, sh / 2, D.W6 - s / 2);
    addTrimBox(6, "Skirting_W6_Refined", s, sh, D.W6 - s * 2, s / 2, sh / 2, D.W6 / 2);

    addCoving(1, "Coving_W1_Refined", D.W1, D.W1 / 2, 0, 0);
    addCoving(2, "Coving_W2_Refined", D.W2, D.W1, D.W2 / 2, -Math.PI / 2);
    addCoving(3, "Coving_W3_Refined", D.W5 - D.W1, (D.W1 + D.W5) / 2, D.W2, 0);
    addCoving(4, "Coving_W4_Refined", D.W6 - D.W2, D.W5, (D.W2 + D.W6) / 2, -Math.PI / 2);
    addCoving(5, "Coving_W5_Refined", D.W5, D.W5 / 2, D.W6, Math.PI);
    addCoving(6, "Coving_W6_Refined", D.W6, 0, D.W6 / 2, Math.PI / 2);

    addReveal(4, "Door_Reveal_Left", 10, doorTop, 1.6, D.W5 + 5, doorTop / 2, doorStart);
    addReveal(4, "Door_Reveal_Right", 10, doorTop, 1.6, D.W5 + 5, doorTop / 2, doorEnd);
    addReveal(4, "Door_Reveal_Header", 10, 1.6, doorEnd - doorStart, D.W5 + 5, doorTop, (doorStart + doorEnd) / 2);
    addReveal(6, "Window_Reveal_Bottom", 10, 1.6, winEnd - winStart, -5, D.window.bottom, (winStart + winEnd) / 2);
    addReveal(6, "Window_Reveal_Top", 10, 1.6, winEnd - winStart, -5, D.window.top, (winStart + winEnd) / 2);
    addReveal(6, "Window_Reveal_Left", 10, D.window.h, 1.6, -5, (D.window.bottom + D.window.top) / 2, winStart);
    addReveal(6, "Window_Reveal_Right", 10, D.window.h, 1.6, -5, (D.window.bottom + D.window.top) / 2, winEnd);

    for (let n = 1; n <= 6; n++) wallSections[n].length = 0;
    roomGroup.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const n = mesh.userData.wallSection || sectionNumber(mesh.name);
      if (n) wallSections[n].push(mesh);
    });
    wallSections[6].push(outside);
    lastCutawayKey = "";
  }
  rebuildRoomShell205();

  /* More dimensional heater switch and trunking details. */
  const heaterElectrical = new THREE.Group();
  heaterElectrical.name = "Heater_Electrical_Refined";
  heaterElectrical.userData.wallSection = 6;
  const electricalWhite = new THREE.MeshStandardMaterial({ color: 0xf2f0eb, roughness: 0.72 });
  const switchFace = new THREE.MeshStandardMaterial({ color: 0xe6e3dd, roughness: 0.68 });
  function eBox(w, h, d, x, y, z, mat = electricalWhite) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.clone());
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    heaterElectrical.add(mesh);
    return mesh;
  }
  eBox(3.2, 4.5, 18, 1.8, 10, 67);
  eBox(3.2, 14, 4, 1.8, 18, 62.2);
  eBox(3.2, 14, 4, 1.8, 18, 72.0);
  eBox(4.5, 9.2, 8.4, 2.3, 29.4, 62.2, switchFace);
  eBox(4.5, 9.2, 8.4, 2.3, 29.4, 72.0, switchFace);
  eBox(0.7, 4.2, 3.3, 4.7, 29.4, 62.2, proxyMaterials.dark);
  eBox(0.7, 4.2, 3.3, 4.7, 29.4, 72.0, proxyMaterials.dark);
  roomGroup.add(heaterElectrical);
  wallSections[6].push(...heaterElectrical.children);

  function seeded(seed) {
    let value = seed >>> 0;
    return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  function makeWoodTexture({ base, line, plankLength, plankWidth, seed }) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const random = seeded(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rows = 4;
    const rowH = canvas.height / rows;
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 ? canvas.width * 0.42 : 0;
      ctx.fillStyle = row % 2 ? "rgba(255,255,255,.035)" : "rgba(45,27,15,.025)";
      ctx.fillRect(0, row * rowH, canvas.width, rowH);
      ctx.strokeStyle = "rgba(61,42,27,.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, row * rowH + 1);
      ctx.lineTo(canvas.width, row * rowH + 1);
      ctx.stroke();
      for (let joint = offset; joint < canvas.width; joint += canvas.width) {
        ctx.beginPath();
        ctx.moveTo(joint, row * rowH);
        ctx.lineTo(joint, (row + 1) * rowH);
        ctx.stroke();
      }
      for (let i = 0; i < 28; i++) {
        const y = row * rowH + 8 + random() * (rowH - 16);
        ctx.strokeStyle = `rgba(${line},${0.025 + random() * 0.08})`;
        ctx.lineWidth = 0.5 + random() * 1.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= canvas.width; x += 26) {
          ctx.lineTo(x, y + Math.sin(x * 0.018 + i * 1.7) * (1 + random() * 2));
        }
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.userData = { plankLength, plankWidth, rows };
    return texture;
  }
  const floorTextures205 = {
    cotton: makeWoodTexture({ base: "#d6c8b8", line: "83,61,42", plankLength: 149.4, plankWidth: 20.9, seed: 40200 }),
    coast: makeWoodTexture({ base: "#bda17f", line: "70,45,25", plankLength: 125.1, plankWidth: 18.9, seed: 40322 }),
  };
  function applyFloorDirection205() {
    const texture = floorMaterial.map;
    if (!texture) return;
    const meta = texture.userData;
    texture.center.set(0.5, 0.5);
    texture.rotation = state.floorDirection ? Math.PI / 2 : 0;
    if (!state.floorDirection) {
      texture.repeat.set(D.W5 / meta.plankLength, D.W6 / (meta.plankWidth * meta.rows));
    } else {
      texture.repeat.set(D.W6 / meta.plankLength, D.W5 / (meta.plankWidth * meta.rows));
    }
    texture.needsUpdate = true;
  }
  setFloorMaterial = function setFloorMaterial205(key, announce = true) {
    state.floor = key === "coast" ? "coast" : "cotton";
    floorMaterial.map = floorTextures205[state.floor];
    floorMaterial.color.setHex(0xffffff);
    floorMaterial.roughness = state.floor === "coast" ? 0.82 : 0.88;
    floorMaterial.needsUpdate = true;
    applyFloorDirection205();
    document.querySelectorAll("[data-floor]").forEach((button) =>
      button.classList.toggle("active", button.dataset.floor === state.floor));
    const name = state.floor === "coast" ? "Coast oak sand" : "Cotton oak white blush";
    const code = state.floor === "coast" ? "Blos · AVSPU40322" : "Bloom · AVMPU40200";
    document.getElementById("floorName").textContent = name;
    document.getElementById("floorLabel").textContent = `${code} · click to change`;
    document.getElementById("floorSwatch").style.background = state.floor === "coast"
      ? "linear-gradient(90deg,#b49570,#c5ad8e,#9d7e5d)"
      : "linear-gradient(90deg,#d8cbbc,#c8b49f,#e0d6cb)";
    requestRender(true, 2);
    if (announce) toast(`Floor: ${name}`);
  };

  const PRODUCT_COLOURS_205 = {
    white: { name: "White", hex: "#f3f1eb" },
    whiteStain: { name: "White stain", hex: "#eee9df" },
    brownWalnut: { name: "Brown walnut effect", hex: "#604331", wood: true },
    darkGrey: { name: "Dark grey", hex: "#4b4a48" },
    beige: { name: "Beige", hex: "#c9baa4" },
    darkGreyBlue: { name: "Dark grey-blue", hex: "#52606d" },
    paleLilac: { name: "Pale lilac", hex: "#c8bad0" },
    whiteOak: { name: "White stained oak effect", hex: "#d8cbbb", wood: true },
    brassWhite: { name: "Brass / white", hex: "#b29458" },
    nickelWhite: { name: "Nickel-plated / white", hex: "#a8abad" },
    lightBeige: { name: "Light beige", hex: "#d7cdbb" },
    greyGreen: { name: "Grey-green", hex: "#718176" },
    ashWhite: { name: "Ash / white", hex: "#c4a47d", wood: true },
  };
  const walnutTexture205 = makeWoodTexture({ base: "#5c3c2a", line: "32,18,11", plankLength: 90, plankWidth: 25, seed: 74588 });
  walnutTexture205.repeat.set(1.2, 2.2);
  const oakTexture205 = makeWoodTexture({ base: "#d6c9b8", line: "92,68,44", plankLength: 90, plankWidth: 25, seed: 28852 });
  oakTexture205.repeat.set(1.2, 2.2);
  function materialForColour205(key, options = {}) {
    const variant = PRODUCT_COLOURS_205[key] || PRODUCT_COLOURS_205.white;
    const material = new THREE.MeshStandardMaterial({
      color: variant.wood ? 0xffffff : new THREE.Color(variant.hex),
      roughness: options.roughness ?? 0.78,
      metalness: options.metalness ?? 0,
    });
    if (key === "brownWalnut") material.map = walnutTexture205;
    if (key === "whiteOak") material.map = oakTexture205;
    return material;
  }
  const glassMaterial205 = new THREE.MeshPhysicalMaterial({
    color: 0xdbe6e8,
    roughness: 0.12,
    metalness: 0.02,
    transparent: true,
    opacity: 0.28,
    transmission: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const blackHardware205 = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.4, metalness: 0.18 });
  const whiteShade205 = new THREE.MeshStandardMaterial({ color: 0xf5f1e8, roughness: 0.72, side: THREE.DoubleSide });
  const glowingShade205 = new THREE.MeshStandardMaterial({
    color: 0xfff4d6,
    emissive: 0xffd79a,
    emissiveIntensity: 0.15,
    roughness: 0.72,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  Object.assign(itemDefs, {
    hemnes: {
      name: "HEMNES chest of 2 drawers",
      category: "Bedside furniture",
      catalogueGroup: "Bedside tables & cabinets",
      mount: "floor", w: 54, d: 38, h: 66,
      source: "IKEA 802.426.27",
      sourceUrl: "https://www.ikea.com/gb/en/p/hemnes-chest-of-2-drawers-white-stain-80242627/",
      exact: true, supportsSurface: true,
      colours: ["whiteStain"], defaultColour: "whiteStain",
    },
    songesand: {
      name: "SONGESAND bedside table",
      category: "Bedside furniture",
      catalogueGroup: "Bedside tables & cabinets",
      mount: "floor", w: 42, d: 40, h: 55,
      source: "IKEA 303.674.41",
      sourceUrl: "https://www.ikea.com/gb/en/p/songesand-bedside-table-white-30367441/",
      exact: true, supportsSurface: true, doorSide: true,
      colours: ["white"], defaultColour: "white",
    },
    eketGlass: {
      name: "EKET wall cabinet with glass door",
      category: "Wall cabinet",
      catalogueGroup: "EKET modular storage",
      mount: "wall", w: 35, d: 35, h: 35,
      source: "IKEA 795.330.19",
      sourceUrl: "https://www.ikea.com/gb/en/p/eket-wall-cabinet-with-glass-door-brown-walnut-effect-s79533019/",
      exact: true, wallCabinet: true, isEket: true, supportsSurface: true,
      colours: ["brownWalnut", "darkGrey", "beige", "darkGreyBlue", "paleLilac", "whiteOak"],
      defaultColour: "brownWalnut",
    },
    eketDrawers: {
      name: "EKET wall cabinet with 2 drawers",
      category: "Wall cabinet",
      catalogueGroup: "EKET modular storage",
      mount: "wall", w: 35, d: 35, h: 35,
      source: "IKEA 693.293.87",
      sourceUrl: "https://www.ikea.com/gb/en/p/eket-wall-cabinet-with-2-drawers-white-s69329387/",
      exact: true, wallCabinet: true, isEket: true, supportsSurface: true,
      colours: ["white", "darkGrey", "brownWalnut"], defaultColour: "white",
    },
    eketTall: {
      name: "EKET cabinet with door and shelf",
      category: "Wall cabinet",
      catalogueGroup: "EKET modular storage",
      mount: "wall", w: 35, d: 35, h: 70,
      source: "IKEA 005.745.88",
      sourceUrl: "https://www.ikea.com/gb/en/p/eket-cabinet-w-door-and-1-shelf-brown-walnut-effect-00574588/",
      exact: true, wallCabinet: true, isEket: true, supportsSurface: true,
      colours: ["brownWalnut", "white", "darkGrey"], defaultColour: "brownWalnut",
    },
    fado: {
      name: "FADO table lamp",
      category: "Table lamp",
      catalogueGroup: "Table lamps",
      mount: "surface", w: 25, d: 25, h: 24,
      source: "IKEA 100.963.75",
      sourceUrl: "https://www.ikea.com/gb/en/p/fado-table-lamp-white-10096375/",
      exact: true, lamp: true, colours: ["white"], defaultColour: "white",
    },
    arstid: {
      name: "ÅRSTID table lamp",
      category: "Table lamp",
      catalogueGroup: "Table lamps",
      mount: "surface", w: 22, d: 22, h: 55,
      source: "IKEA 603.213.76 / 002.806.37",
      sourceUrl: "https://www.ikea.com/gb/en/p/arstid-table-lamp-brass-white-60321376/",
      exact: true, lamp: true, colours: ["brassWhite", "nickelWhite"], defaultColour: "brassWhite",
    },
    rodflik: {
      name: "RÖDFLIK floor reading lamp",
      category: "Floor lamp",
      catalogueGroup: "Floor lamps",
      mount: "floor", w: 40, d: 25, h: 140,
      source: "IKEA 805.619.40 / 805.635.76",
      sourceUrl: "https://www.ikea.com/gb/en/p/roedflik-floor-reading-lamp-light-beige-80561940/",
      exact: true, lamp: true, autoWallSnap: false,
      colours: ["lightBeige", "greyGreen"], defaultColour: "lightBeige",
    },
    lauters: {
      name: "LAUTERS floor lamp",
      category: "Floor lamp",
      catalogueGroup: "Floor lamps",
      mount: "floor", w: 62, d: 62, h: 151,
      source: "IKEA 404.050.46",
      sourceUrl: "https://www.ikea.com/gb/en/p/lauters-floor-lamp-ash-white-40405046/",
      exact: true, lamp: true, autoWallSnap: false,
      colours: ["ashWhite"], defaultColour: "ashWhite",
    },
  });
  itemDefs.malm.supportsSurface = true;
  itemDefs.idanaes.colours = ["white"];
  itemDefs.idanaes.defaultColour = "white";
  itemDefs.pax.colours = ["white"];
  itemDefs.pax.defaultColour = "white";
  itemDefs.brimnes.colours = ["white"];
  itemDefs.brimnes.defaultColour = "white";
  itemDefs.nissedal.colours = ["white"];
  itemDefs.nissedal.defaultColour = "white";
  itemDefs.knoppang.colours = ["white"];
  itemDefs.knoppang.defaultColour = "white";
  itemDefs.malm.catalogueGroup = "Chests of drawers";
  itemDefs.idanaes.catalogueGroup = "Wardrobes";
  itemDefs.pax.catalogueGroup = "Wardrobes";
  itemDefs.brimnes.catalogueGroup = "Wardrobes";
  itemDefs.nissedal.catalogueGroup = "Wall decoration";
  itemDefs.knoppang.catalogueGroup = "Wall decoration";

  function addProxyCylinder205(group, radiusTop, radiusBottom, height, x, y, z, material, radial = 20, rotation = null) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), material.clone());
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (proxyMeshRegistration) itemMeshes.push(mesh);
    return mesh;
  }
  function addProxyTorus205(group, radius, tube, x, y, z, material, rotation = null) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 24), material.clone());
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = true;
    group.add(mesh);
    if (proxyMeshRegistration) itemMeshes.push(mesh);
    return mesh;
  }
  function addLampShade205(group, topRadius, bottomRadius, height, x, y, z, material) {
    const mesh = addProxyCylinder205(group, topRadius, bottomRadius, height, x, y, z, material, 32);
    mesh.material.side = THREE.DoubleSide;
    mesh.userData.lampShade = true;
    return mesh;
  }
  function buildEket205(def, key, colourKey) {
    const g = new THREE.Group();
    const body = materialForColour205(colourKey);
    const inner = materialForColour205(colourKey, { roughness: 0.88 });
    const t = 2.7, frontZ = def.d / 2 - 0.7;
    addProxyBox(g, def.w, t, def.d, 0, def.h / 2 - t / 2, 0, body);
    addProxyBox(g, def.w, t, def.d, 0, -def.h / 2 + t / 2, 0, body);
    addProxyBox(g, t, def.h - t * 2, def.d, -def.w / 2 + t / 2, 0, 0, body);
    addProxyBox(g, t, def.h - t * 2, def.d, def.w / 2 - t / 2, 0, 0, body);
    addProxyBox(g, def.w - t * 2, def.h - t * 2, 0.8, 0, 0, -def.d / 2 + 0.4, inner);
    if (key === "eketGlass") {
      addProxyBox(g, def.w - 4.6, def.h - 4.6, 0.65, 0, 0, frontZ, glassMaterial205);
      addProxyBox(g, 1.1, def.h - 5, 1.1, -def.w / 2 + 3.2, 0, frontZ - 0.8, blackHardware205);
      addProxyBox(g, 1.1, def.h - 5, 1.1, def.w / 2 - 3.2, 0, frontZ - 0.8, blackHardware205);
    } else if (key === "eketDrawers") {
      addProxyBox(g, def.w - 4.2, def.h / 2 - 2.7, 1.4, 0, def.h / 4 - 0.7, frontZ, body);
      addProxyBox(g, def.w - 4.2, def.h / 2 - 2.7, 1.4, 0, -def.h / 4 + 0.7, frontZ, body);
      addProxyBox(g, def.w - 5.2, 0.55, 1.7, 0, 0, frontZ - 0.15, inner);
    } else {
      addProxyBox(g, def.w - 4.2, def.h - 4.2, 1.4, 0, 0, frontZ, body);
      addProxyBox(g, def.w - 5.4, 1.3, def.d - 5.2, 0, 0, 0, inner);
      addProxyBox(g, 0.7, def.h - 8, 1.8, def.w / 2 - 3.3, 0, frontZ - 0.2, inner);
    }
    return g;
  }
  function buildHemnes205(def, colourKey) {
    const g = new THREE.Group();
    const body = materialForColour205(colourKey, { roughness: 0.86 });
    addProxyBox(g, def.w, 3.4, def.d, 0, def.h - 1.7, 0, body);
    addProxyBox(g, def.w - 5, 46, def.d - 3, 0, 37, 0, body);
    for (const x of [-def.w / 2 + 3, def.w / 2 - 3])
      for (const z of [-def.d / 2 + 3, def.d / 2 - 3])
        addProxyBox(g, 5, 11, 5, x, 5.5, z, body);
    for (const y of [49.5, 29.5]) {
      addProxyBox(g, def.w - 7, 17.3, 1.5, 0, y, def.d / 2 - 0.75, body);
      for (const x of [-8, 8]) addProxySphere(g, 1.15, x, y, def.d / 2 - 1.15, blackHardware205);
    }
    return g;
  }
  function buildSongesand205(def, colourKey, doorSide = "right") {
    const g = new THREE.Group();
    const body = materialForColour205(colourKey, { roughness: 0.82 });
    addProxyBox(g, def.w, 3.5, def.d, 0, def.h - 1.75, 0, body);
    addProxyBox(g, 3, def.h - 6, def.d - 2, -def.w / 2 + 1.5, def.h / 2, 0, body);
    addProxyBox(g, 3, def.h - 6, def.d - 2, def.w / 2 - 1.5, def.h / 2, 0, body);
    addProxyBox(g, def.w - 6, 2.5, def.d - 2, 0, 39, 0, body);
    addProxyBox(g, def.w - 6, 2.5, def.d - 2, 0, 15, 0, body);
    addProxyBox(g, def.w - 3, 8, def.d - 2, 0, 4, 0, body);
    addProxyBox(g, def.w - 7, 21, 1.4, 0, 27, def.d / 2 - 0.7, body);
    const handleX = doorSide === "left" ? def.w / 2 - 7 : -def.w / 2 + 7;
    addProxyBox(g, 1.4, 8.5, 2, handleX, 28, def.d / 2 - 1, blackHardware205);
    return g;
  }
  function buildFado205(def) {
    const g = new THREE.Group();
    const shade = glowingShade205.clone();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(12.5, 32, 20), shade);
    sphere.scale.y = 0.92;
    sphere.position.y = 12.5;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.userData.lampShade = true;
    g.add(sphere);
    if (proxyMeshRegistration) itemMeshes.push(sphere);
    addProxyCylinder205(g, 5.2, 5.8, 1.1, 0, 0.55, 0, proxyMaterials.dark, 24);
    return g;
  }
  function buildArstid205(def, colourKey) {
    const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: colourKey === "nickelWhite" ? 0xa7aaac : 0xb39153,
      roughness: 0.35,
      metalness: 0.68,
    });
    addProxyCylinder205(g, 7.5, 7.5, 1.8, 0, 0.9, 0, metal, 32);
    addProxyCylinder205(g, 1.15, 1.15, 39, 0, 20.3, 0, metal, 16);
    addProxyCylinder205(g, 2.1, 2.1, 3.8, 0, 40.5, 0, metal, 16);
    addLampShade205(g, 7.8, 11, 20, 0, 45, 0, glowingShade205);
    addProxySphere(g, 0.7, 7.5, 40, 0, metal);
    return g;
  }
  function addPlanningFootprint205(group, width, depth) {
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.01, depth), material);
    mesh.position.y = 0.005;
    mesh.visible = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    return mesh;
  }
  function buildRodflik205(def, colourKey) {
    const g = new THREE.Group();
    addPlanningFootprint205(g, def.w, def.d);
    const paint = materialForColour205(colourKey, { roughness: 0.42, metalness: 0.18 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xb28c50, roughness: 0.34, metalness: 0.62 });
    addProxyCylinder205(g, 12.5, 12.5, 2.4, 0, 1.2, 0, paint, 32);
    addProxyCylinder205(g, 1.2, 1.2, 116, -3, 59, 0, paint, 18);
    addProxyCylinder205(g, 1.05, 1.05, 29, 6.5, 122, 0, brass, 16, { z: -0.72 });
    const head = addProxyCylinder205(g, 4.5, 8, 13, 13.5, 132, 0, glowingShade205, 28, { z: -Math.PI / 2 });
    head.userData.lampShade = true;
    return g;
  }
  function buildLauters205(def) {
    const g = new THREE.Group();
    addPlanningFootprint205(g, def.w, def.d);
    const wood = materialForColour205("ashWhite", { roughness: 0.72 });
    for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
      const x = Math.cos(angle) * 19, z = Math.sin(angle) * 19;
      const leg = addProxyCylinder205(g, 1.7, 2.3, 113, x / 2, 56.5, z / 2, wood, 14);
      leg.rotation.z = Math.sin(angle) * 0.18;
      leg.rotation.x = -Math.cos(angle) * 0.18;
    }
    addProxyCylinder205(g, 2, 2, 31, 0, 126.5, 0, wood, 16);
    addLampShade205(g, 15, 18.5, 28, 0, 137, 0, glowingShade205);
    return g;
  }

  const buildProxy204 = buildProxy;
  buildProxy = function buildProxy205(def, key, registerMeshes = true, options = {}) {
    if (typeof options === "string") options = { colourKey: options };
    const previousRegistration = proxyMeshRegistration;
    proxyMeshRegistration = registerMeshes;
    const colourKey = options.colourKey || def.defaultColour || def.colours?.[0] || "white";
    let group;
    if (key === "hemnes") group = buildHemnes205(def, colourKey);
    else if (key === "songesand") group = buildSongesand205(def, colourKey, options.doorSide || "right");
    else if (["eketGlass", "eketDrawers", "eketTall"].includes(key)) group = buildEket205(def, key, colourKey);
    else if (key === "fado") group = buildFado205(def);
    else if (key === "arstid") group = buildArstid205(def, colourKey);
    else if (key === "rodflik") group = buildRodflik205(def, colourKey);
    else if (key === "lauters") group = buildLauters205(def);
    else {
      group = buildProxy204(def, key, registerMeshes);
      if (key === "idanaes") {
        group.traverse((mesh) => {
          if (!mesh.isMesh || !mesh.material?.color) return;
          const c = mesh.material.color;
          if (c.r < 0.55 && c.g < 0.55 && c.b < 0.55) mesh.material.color.setHex(0x202020);
        });
      }
    }
    proxyMeshRegistration = previousRegistration;
    group.userData.productColour = colourKey;
    return group;
  };

  /* Visible wall faces receive shadows but do not write into the daylight
     shadow map. Dedicated invisible wall blockers provide physically useful
     occlusion without reintroducing self-shadow striping. */
  for (const mesh of wallMeshes) mesh.castShadow = false;
  const shellBlockerMaterial205 = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    colorWrite: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  function addShellBlocker205(w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shellBlockerMaterial205.clone());
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.userData.category = "light-blocker";
    roomGroup.add(mesh);
    return mesh;
  }
  const ws205 = 52.07, we205 = 224.79;
  addShellBlocker205(5, D.H, ws205, -2.5, D.H / 2, ws205 / 2);
  addShellBlocker205(5, D.H, D.W6 - we205, -2.5, D.H / 2, (we205 + D.W6) / 2);
  addShellBlocker205(5, D.window.bottom, we205 - ws205, -2.5, D.window.bottom / 2, (ws205 + we205) / 2);
  addShellBlocker205(5, D.H - D.window.top, we205 - ws205, -2.5, (D.H + D.window.top) / 2, (ws205 + we205) / 2);

  qualityProfiles.adaptive.daylightShadow = true;
  qualityProfiles.adaptive.day = 1024;
  qualityProfiles.balanced.daylightShadow = true;
  qualityProfiles.balanced.day = 1024;
  daylight.shadow.bias = 0.00032;
  daylight.shadow.normalBias = 0.85;
  overheadLight.shadow.bias = 0.00032;
  overheadLight.shadow.normalBias = 0.7;

  const originalWallDims205 = wallDims;
  wallDims = function wallDims205(item) {
    const def = itemDefs[item.key];
    if (def?.wallCabinet) return { w: item.w, h: item.h };
    return originalWallDims205(item);
  };
  wallPosition = function wallPosition205(item) {
    const dims = wallDims(item);
    const depth = Math.max(2, item.d || 2);
    const inset = itemDefs[item.key]?.wallCabinet ? depth / 2 + 0.12 : 1.15;
    const o = item.offset, y = item.height, w = item.wall;
    item.group.rotation.set(0, 0, item.orientation === "landscape" && !itemDefs[item.key]?.wallCabinet ? Math.PI / 2 : 0);
    if (w === 1) {
      item.group.position.set(o, y, inset);
      item.group.rotation.y = 0;
    } else if (w === 2) {
      item.group.position.set(D.W1 - inset, y, o);
      item.group.rotation.y = -Math.PI / 2;
    } else if (w === 3) {
      item.group.position.set(D.W1 + o, y, D.W2 + inset);
      item.group.rotation.y = 0;
    } else if (w === 4) {
      item.group.position.set(D.W5 - inset, y, D.W2 + o);
      item.group.rotation.y = -Math.PI / 2;
    } else if (w === 5) {
      item.group.position.set(o, y, D.W6 - inset);
      item.group.rotation.y = Math.PI;
    } else {
      item.group.position.set(inset, y, o);
      item.group.rotation.y = Math.PI / 2;
    }
    return dims;
  };

  function attachItemReferences205(item) {
    item.group.userData.itemRef = item;
    item.group.traverse((mesh) => {
      if (mesh.isMesh) mesh.userData.itemRef = item;
    });
  }
  function unregisterItemMeshes205(group) {
    group.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const index = itemMeshes.indexOf(mesh);
      if (index >= 0) itemMeshes.splice(index, 1);
    });
  }
  function defFor205(itemOrKey) {
    return itemDefs[typeof itemOrKey === "string" ? itemOrKey : itemOrKey?.key];
  }
  function createItem205(key, saved = {}, registerMeshes = true) {
    const def = itemDefs[key];
    if (!def) return null;
    const colourKey = saved.colourKey || def.defaultColour || def.colours?.[0] || "white";
    const group = buildProxy(def, key, registerMeshes, {
      colourKey,
      doorSide: saved.doorSide || "right",
    });
    const item = {
      id: saved.id || ++itemCounter,
      key,
      name: def.name,
      category: def.category,
      source: def.source,
      sourceUrl: def.sourceUrl || "",
      mount: def.mount,
      w: def.w,
      d: def.d,
      h: def.h,
      rotation: Number(saved.rotation) || 0,
      autoWallSnap: !!def.autoWallSnap,
      wallSnapOverride: !!saved.wallSnapOverride,
      snappedWall: saved.snappedWall || null,
      colourKey,
      locked: !!saved.locked,
      doorSide: saved.doorSide || "right",
      lightOn: saved.lightOn !== false,
      eketSnap: saved.eketSnap !== false,
      group,
    };
    attachItemReferences205(item);
    return item;
  }

  function supportFor205(id) {
    return placedItems.find((item) => item.id === id) || null;
  }
  function supportTop205(item) {
    if (!item) return 0;
    return item.mount === "wall" ? (Number(item.h) || 0) / 2 : Number(item.h) || 0;
  }
  function positionSurfaceItem205(item) {
    const support = supportFor205(item.supportId);
    if (!support) return false;
    if (item.group.parent !== support.group) support.group.add(item.group);
    item.group.position.set(item.localX || 0, supportTop205(support), item.localZ || 0);
    item.group.rotation.set(0, THREE.MathUtils.degToRad(item.rotation || 0), 0);
    return true;
  }
  function surfaceValidation205(item) {
    const support = supportFor205(item.supportId);
    if (!support || !defFor205(support)?.supportsSurface) return { hard: true, message: "Point at a suitable cabinet or table" };
    const margin = 1.2;
    if (Math.abs(item.localX || 0) + item.w / 2 > support.w / 2 - margin ||
        Math.abs(item.localZ || 0) + item.d / 2 > support.d / 2 - margin) {
      return { hard: true, message: "The lamp base would hang over the edge" };
    }
    for (const other of placedItems) {
      if (other === item || other.mount !== "surface" || other.supportId !== item.supportId) continue;
      const dx = Math.abs((other.localX || 0) - (item.localX || 0));
      const dz = Math.abs((other.localZ || 0) - (item.localZ || 0));
      if (dx < (other.w + item.w) / 2 && dz < (other.d + item.d) / 2)
        return { hard: true, message: `Overlaps ${other.name}` };
    }
    return { hard: false, message: `Placed on ${support.name}` };
  }
  const originalValidateFloor205 = validateFloorItem;
  validateFloorItem = function validateFloorItem205(item, x = item.x, z = item.z, rotation = item.rotation) {
    const result = originalValidateFloor205(item, x, z, rotation);
    if (result.hard) return result;
    const itemBox = new THREE.Box3().setFromObject(item.group);
    for (const wallItem of placedItems) {
      if (wallItem === item || wallItem.mount !== "wall" || !defFor205(wallItem)?.wallCabinet) continue;
      const wallBox = new THREE.Box3().setFromObject(wallItem.group).expandByScalar(0.25);
      if (itemBox.intersectsBox(wallBox)) return { hard: true, message: `Overlaps ${wallItem.name}` };
    }
    return result;
  };
  itemValidation = function itemValidation205(item) {
    if (item.mount === "surface") return surfaceValidation205(item);
    return item.mount === "floor" ? validateFloorItem(item) : validateWallItem(item);
  };

  function snapEket205(item) {
    const def = defFor205(item);
    if (!def?.isEket || !item.eketSnap) return false;
    const candidates = [];
    for (const other of placedItems) {
      if (other === item || other.wall !== item.wall || !defFor205(other)?.isEket) continue;
      const horizontal = (item.w + other.w) / 2;
      const vertical = (item.h + other.h) / 2;
      candidates.push(
        { offset: other.offset - horizontal, height: other.height, distance: Math.hypot(item.offset - (other.offset - horizontal), item.height - other.height) },
        { offset: other.offset + horizontal, height: other.height, distance: Math.hypot(item.offset - (other.offset + horizontal), item.height - other.height) },
        { offset: other.offset, height: other.height - vertical, distance: Math.hypot(item.offset - other.offset, item.height - (other.height - vertical)) },
        { offset: other.offset, height: other.height + vertical, distance: Math.hypot(item.offset - other.offset, item.height - (other.height + vertical)) },
      );
    }
    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates[0] && candidates[0].distance <= 14) {
      item.offset = candidates[0].offset;
      item.height = candidates[0].height;
      wallPosition(item);
      return true;
    }
    return false;
  }

  function addLampLight205(item) {
    removeLampLight205(item);
    if (!defFor205(item)?.lamp || !item.lightOn) return;
    const light = new THREE.PointLight(0xffd39a, item.key === "fado" ? 0.58 : 0.78, item.mount === "surface" ? 235 : 310, 2);
    light.position.set(0, item.h * 0.78, 0);
    light.castShadow = false;
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = 0.0006;
    item.group.add(light);
    item.lampLight = light;
  }
  function removeLampLight205(item) {
    if (!item?.lampLight) return;
    item.group.remove(item.lampLight);
    item.lampLight.shadow?.map?.dispose?.();
    item.lampLight = null;
  }
  function refreshLampShadows205() {
    const lit = placedItems.filter((item) => item.lightOn && item.lampLight);
    lit.sort((a, b) => a.group.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.position) - b.group.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.position));
    lit.forEach((item, index) => {
      item.lampLight.castShadow = index < 2 && state.quality !== "low";
    });
    requestRender(true, 2);
  }

  function addPlacedItem205(item, saved = {}) {
    if (!item) return null;
    if (item.mount === "floor") {
      item.x = Number.isFinite(saved.x) ? saved.x : D.W1 / 2;
      item.z = Number.isFinite(saved.z) ? saved.z : D.W6 / 2;
      scene.add(item.group);
      item.group.position.set(item.x, 0, item.z);
      item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    } else if (item.mount === "wall") {
      item.wall = Number(saved.wall) || 1;
      item.height = Number.isFinite(saved.height) ? saved.height : Math.min(D.H - item.h / 2 - 6, Math.max(item.h / 2 + 10, 90));
      item.offset = Number.isFinite(saved.offset) ? saved.offset : wallMeta[item.wall].length / 2;
      item.orientation = saved.orientation || "portrait";
      scene.add(item.group);
      wallPosition(item);
    } else {
      item.supportId = Number(saved.supportId) || null;
      item.localX = Number(saved.localX) || 0;
      item.localZ = Number(saved.localZ) || 0;
      if (!positionSurfaceItem205(item)) scene.add(item.group);
    }
    placedItems.push(item);
    addLampLight205(item);
    return item;
  }

  rebuildItems = function rebuildItems205(items) {
    for (const item of placedItems) {
      removeLampLight205(item);
      unregisterItemMeshes205(item.group);
      item.group.parent?.remove(item.group);
      disposeGroup(item.group);
    }
    placedItems.length = 0;
    itemMeshes.length = 0;
    selectedPlacedItem = null;
    itemCounter = 0;
    const records = Array.isArray(items) ? items : [];
    for (const saved of records.filter((record) => (itemDefs[record.key]?.mount || record.mount) !== "surface")) {
      const item = createItem205(saved.key, saved, true);
      if (item) addPlacedItem205(item, saved);
    }
    for (const saved of records.filter((record) => (itemDefs[record.key]?.mount || record.mount) === "surface")) {
      const item = createItem205(saved.key, saved, true);
      if (item && supportFor205(Number(saved.supportId))) addPlacedItem205(item, saved);
      else if (item) {
        unregisterItemMeshes205(item.group);
        disposeGroup(item.group);
      }
    }
    refreshLampShadows205();
    updateSelectedPanel();
    updatePlacedList();
    updateOverlays205();
  };

  function replaceItemModel205(item, colourKey = item.colourKey, doorSide = item.doorSide) {
    const def = defFor205(item);
    if (!def) return;
    const oldGroup = item.group;
    const parent = oldGroup.parent;
    const position = oldGroup.position.clone();
    const rotation = oldGroup.rotation.clone();
    unregisterItemMeshes205(oldGroup);
    removeLampLight205(item);
    parent?.remove(oldGroup);
    disposeGroup(oldGroup);
    item.colourKey = colourKey;
    item.doorSide = doorSide;
    item.group = buildProxy(def, item.key, true, { colourKey, doorSide });
    attachItemReferences205(item);
    if (item.mount === "surface") positionSurfaceItem205(item);
    else {
      (parent || scene).add(item.group);
      item.group.position.copy(position);
      item.group.rotation.copy(rotation);
    }
    addLampLight205(item);
    updateSelectionHighlight(item.group);
    refreshLampShadows205();
  }

  const originalBeginPlacement205 = beginItemPlacement;
  beginItemPlacement = function beginItemPlacement205(key, colourKey = null, preset = null) {
    cancelPendingPlacement(false);
    const def = itemDefs[key];
    if (!def) return;
    setPlacementMode(false, false);
    selectPlacedItem(null);
    const options = preset || {};
    const item = createItem205(key, {
      colourKey: colourKey || options.colourKey || def.defaultColour,
      doorSide: options.doorSide,
      rotation: options.rotation,
      eketSnap: options.eketSnap,
      lightOn: options.lightOn,
      wallSnapOverride: options.wallSnapOverride,
    }, false);
    item.id = itemCounter + 1;
    prepareGhost(item.group);
    item.group.visible = false;
    scene.add(item.group);
    const outline = new THREE.BoxHelper(item.group, GHOST_GREEN);
    outline.visible = false;
    outline.material.depthTest = false;
    outline.material.transparent = true;
    outline.material.opacity = 0.96;
    outline.renderOrder = 40;
    scene.add(outline);
    pendingPlacement = { key, def, item, group: item.group, outline, valid: false, hasPosition: false, message: "Move the pointer over a valid surface", preset };
    document.body.classList.add("placing-new-item");
    toggleLibrary(false);
    ghostMessage(def.mount === "surface" ? "Point at a suitable tabletop or cabinet top." : def.mount === "wall" ? "Point at a visible wall. Compatible EKET cabinets join into modular groups." : "Move the pointer over the floor. Green means valid; red means blocked.");
    toast(`Position the ${def.name}`);
    requestRender(false, 1);
  };

  const originalWallHit205 = wallHitToItem;
  wallHitToItem = function wallHitToItem205(item, hit) {
    if (!originalWallHit205(item, hit)) return false;
    if (defFor205(item)?.wallCabinet) item.orientation = "portrait";
    snapEket205(item);
    wallPosition(item);
    return true;
  };
  function surfaceHit205(item, event) {
    pointerNDC(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(itemMeshes, false);
    for (const hit of hits) {
      const support = hit.object.userData.itemRef;
      if (!support || !defFor205(support)?.supportsSurface || support === item) continue;
      const world = hit.point.clone();
      const local = support.group.worldToLocal(world);
      if (item.group.parent !== support.group) {
        item.group.parent?.remove(item.group);
        support.group.add(item.group);
      }
      item.supportId = support.id;
      item.localX = state.snap ? snapValue(local.x) : local.x;
      item.localZ = state.snap ? snapValue(local.z) : local.z;
      positionSurfaceItem205(item);
      return true;
    }
    return false;
  }
  updatePendingPlacement = function updatePendingPlacement205(event) {
    if (!pendingPlacement) return;
    const item = pendingPlacement.item;
    if (item.mount === "surface") {
      if (!surfaceHit205(item, event)) {
        item.group.visible = false;
        pendingPlacement.outline.visible = false;
        pendingPlacement.hasPosition = false;
        ghostMessage("Point at the top of a bedside table, chest or cabinet.");
        requestRender(false, 1);
        return;
      }
      pendingPlacement.hasPosition = true;
    } else if (item.mount === "floor") {
      pointerNDC(event);
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      applyFloorItemPosition(item, dragPoint.x, dragPoint.z, true);
      pendingPlacement.hasPosition = true;
    } else {
      pointerNDC(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(wallMeshes.filter((mesh) => mesh.visible), false);
      if (!hits.length || !wallHitToItem(item, hits[0])) {
        item.group.visible = false;
        pendingPlacement.outline.visible = false;
        pendingPlacement.hasPosition = false;
        ghostMessage("Point at a visible wall surface.");
        requestRender(false, 1);
        return;
      }
      pendingPlacement.hasPosition = true;
    }
    item.group.visible = true;
    pendingPlacement.outline.visible = true;
    const validity = itemValidation(item);
    setGhostAppearance(!validity.hard, validity.message);
  };
  rotatePending = function rotatePending205(direction = 1, fine = false) {
    if (!pendingPlacement) return;
    const item = pendingPlacement.item;
    if (item.mount === "wall") {
      if (defFor205(item)?.wallCabinet) {
        item.eketSnap = false;
        toast("Modular snapping temporarily overridden");
      } else {
        item.orientation = item.orientation === "portrait" ? "landscape" : "portrait";
      }
      wallPosition(item);
    } else {
      const oldRotation = item.rotation;
      const oldWall = item.snappedWall;
      item.rotation = normalizeAngle(item.rotation + direction * rotationStep(fine));
      if (supportsAutoWallSnap(item)) {
        item.wallSnapOverride = true;
        detachFromSnappedWall(item, oldWall, oldRotation, item.rotation);
        item.snappedWall = null;
      }
      if (item.mount === "surface") positionSurfaceItem205(item);
      else {
        item.group.position.set(item.x, 0, item.z);
        item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
      }
    }
    if (pendingPlacement.hasPosition) {
      const validity = itemValidation(item);
      setGhostAppearance(!validity.hard, validity.message);
    }
  };
  nudgePending = function nudgePending205(dx, dz) {
    if (!pendingPlacement?.hasPosition) return;
    const item = pendingPlacement.item;
    if (item.mount === "floor") applyFloorItemPosition(item, item.x + dx, item.z + dz, true);
    else if (item.mount === "surface") {
      item.localX += dx;
      item.localZ += dz;
      positionSurfaceItem205(item);
    } else {
      item.offset = snapValue(item.offset + dx);
      item.height = snapValue(item.height - dz);
      snapEket205(item);
      wallPosition(item);
    }
    const validity = itemValidation(item);
    setGhostAppearance(!validity.hard, validity.message);
  };
  confirmPendingPlacement = function confirmPendingPlacement205(event) {
    if (!pendingPlacement) return;
    if (event?.button != null && event.button !== 0) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const pending = pendingPlacement;
    if (!pending.hasPosition || !pending.valid) {
      toast(pending.message || "Choose a valid position first");
      return;
    }
    const saved = {
      x: pending.item.x, z: pending.item.z, rotation: pending.item.rotation,
      wall: pending.item.wall, height: pending.item.height, offset: pending.item.offset,
      orientation: pending.item.orientation, supportId: pending.item.supportId,
      localX: pending.item.localX, localZ: pending.item.localZ,
      colourKey: pending.item.colourKey, doorSide: pending.item.doorSide,
      lightOn: pending.item.lightOn, eketSnap: pending.item.eketSnap,
      wallSnapOverride: pending.item.wallSnapOverride, snappedWall: pending.item.snappedWall,
    };
    pending.group.parent?.remove(pending.group);
    scene.remove(pending.outline);
    disposeGroup(pending.group);
    pending.outline.geometry?.dispose();
    pending.outline.material?.dispose();
    pendingPlacement = null;
    document.body.classList.remove("placing-new-item");
    const item = createItem205(pending.key, saved, true);
    addPlacedItem205(item, saved);
    selectPlacedItem(item);
    setPlacementMode(true, false);
    updateSelectedPanel();
    updatePlacedList();
    refreshLampShadows205();
    queueHistory();
    toast(`${item.name} placed`);
    requestRender(true, 2);
  };

  function itemRecord205(item) {
    return {
      id: item.id, key: item.key, mount: item.mount,
      x: item.x, z: item.z, rotation: item.rotation,
      wall: item.wall, height: item.height, offset: item.offset,
      orientation: item.orientation, supportId: item.supportId,
      localX: item.localX, localZ: item.localZ,
      wallSnapOverride: !!item.wallSnapOverride, snappedWall: item.snappedWall || null,
      colourKey: item.colourKey, locked: !!item.locked, doorSide: item.doorSide,
      lightOn: item.lightOn !== false, eketSnap: item.eketSnap !== false,
    };
  }
  serializePlanner = function serializePlanner205() {
    return JSON.stringify({
      version: VERSION_205,
      state: {
        x: state.x, z: state.z, rotation: state.rotation, snap: state.snap,
        gridSize: state.gridSize, showGrid: state.showGrid,
        accentFollow: state.accentFollow, accentWall: state.accentWall,
        accentColour: state.accentColour, presetWall: state.presetWall,
        wallMode: state.wallMode, floor: state.floor, floorDirection: state.floorDirection,
        quality: state.quality, lightFitting: state.lightFitting,
        showClearances: state.showClearances, showMeasurements: state.showMeasurements,
        lightScene: state.lightScene,
      },
      lighting: {
        time: lightingState.time, daylightLevel: lightingState.daylightLevel,
        overheadLevel: lightingState.overheadLevel,
      },
      fov: camera.fov,
      items: placedItems.map(itemRecord205),
    });
  };

  const restorePlanner204 = restorePlanner;
  restorePlanner = function restorePlanner205(serialized) {
    const snap = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    snap.state ||= {};
    snap.state.floor ||= "cotton";
    snap.state.floorDirection ||= 0;
    snap.state.showClearances = !!snap.state.showClearances;
    snap.state.showMeasurements = snap.state.showMeasurements !== false;
    snap.state.lightScene ||= "day";
    restorePlanner204(JSON.stringify(snap));
    state.floorDirection = snap.state.floorDirection || 0;
    state.showClearances = !!snap.state.showClearances;
    state.showMeasurements = snap.state.showMeasurements !== false;
    state.lightScene = snap.state.lightScene || "day";
    setFloorMaterial(state.floor, false);
    updateFloorDirection205(false);
    document.getElementById("clearanceToggle").checked = state.showClearances;
    document.getElementById("measurementToggle").checked = state.showMeasurements;
    applyLightScene205(state.lightScene, false);
    updateOverlays205();
    updateSelectedPanel();
    scheduleAutosave205();
  };

  function dimensionsLabel205(def) {
    return `${def.w} × ${def.d} × ${def.h} cm`;
  }
  function swatchHtml205(key, active = false, attribute = "data-colour") {
    const colour = PRODUCT_COLOURS_205[key] || PRODUCT_COLOURS_205.white;
    const background = colour.wood
      ? "linear-gradient(135deg,#5c402e,#8a674d 45%,#4b3327 100%)"
      : colour.hex;
    return `<button class="colour-swatch${active ? " active" : ""}" ${attribute}="${key}" type="button" title="${(colour.label || colour.name)}" aria-label="${(colour.label || colour.name)}" style="--swatch:${background}"><i></i><span>${(colour.label || colour.name)}</span></button>`;
  }
  const catalogueOrder205 = [
    "Wardrobes", "EKET modular storage", "Bedside tables & cabinets",
    "Chests of drawers", "Table lamps", "Floor lamps", "Wall decoration",
  ];
  function renderCatalogue205() {
    const root = document.getElementById("catalogueRoot");
    const filterRoot = document.getElementById("catalogueFilters");
    const groups = new Map();
    for (const [key, def] of Object.entries(itemDefs)) {
      const group = def.catalogueGroup || def.category || "Other";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push([key, def]);
    }
    const availableGroups = catalogueOrder205.filter((group) => groups.has(group));
    filterRoot.innerHTML = ['<button class="active" type="button" data-catalogue-filter="all">All</button>', ...availableGroups.map((group) => `<button type="button" data-catalogue-filter="${group}">${group.replace(" & ", " &amp; ")}</button>`)].join("");
    root.innerHTML = availableGroups.map((group) => {
      const cards = groups.get(group).map(([key, def]) => {
        const colourKeys = def.colours || [def.defaultColour || "white"];
        return `<article class="product-card" data-product-card data-group="${group}" data-search="${`${def.name} ${def.category} ${def.source}`.toLowerCase()}">
          <div class="product-card-head"><div><b>${def.name}</b><small>${def.category} · ${dimensionsLabel205(def)}</small></div><span>${def.exact ? "Exact size" : "Planning proxy"}</span></div>
          <div class="product-card-colours" data-card-colours="${key}">${colourKeys.map((colour, index) => swatchHtml205(colour, index === 0, "data-card-colour")).join("")}</div>
          <div class="product-card-actions"><button class="btn primary" type="button" data-place-product="${key}">Add to room</button>${def.sourceUrl ? `<a class="btn" href="${def.sourceUrl}" target="_blank" rel="noopener">Product page</a>` : ""}</div>
        </article>`;
      }).join("");
      return `<section class="catalogue-group" data-catalogue-group="${group}"><div class="section-title-row"><h3>${group}</h3><span>${groups.get(group).length}</span></div><div class="catalogue-grid">${cards}</div></section>`;
    }).join("");
    root.querySelectorAll("[data-card-colour]").forEach((button) => {
      button.onclick = () => {
        const wrapper = button.closest("[data-card-colours]");
        wrapper.querySelectorAll("[data-card-colour]").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      };
    });
    root.querySelectorAll("[data-place-product]").forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.placeProduct;
        const colour = button.closest("[data-product-card]").querySelector("[data-card-colour].active")?.dataset.cardColour;
        beginItemPlacement(key, colour || itemDefs[key].defaultColour);
      };
    });
    let activeFilter = "all";
    function applyCatalogueFilter205() {
      const query = document.getElementById("librarySearch").value.trim().toLowerCase();
      root.querySelectorAll("[data-product-card]").forEach((card) => {
        const visible = (activeFilter === "all" || card.dataset.group === activeFilter) && (!query || card.dataset.search.includes(query));
        card.hidden = !visible;
      });
      root.querySelectorAll("[data-catalogue-group]").forEach((section) => {
        section.hidden = ![...section.querySelectorAll("[data-product-card]")].some((card) => !card.hidden);
      });
    }
    filterRoot.querySelectorAll("[data-catalogue-filter]").forEach((button) => {
      button.onclick = () => {
        activeFilter = button.dataset.catalogueFilter;
        filterRoot.querySelectorAll("button").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
        applyCatalogueFilter205();
      };
    });
    document.getElementById("librarySearch").oninput = applyCatalogueFilter205;
  }
  renderCatalogue205();

  const updateSelectedPanel204 = updateSelectedPanel;
  function applySelectedExtras205(item) {
    const colourControl = document.getElementById("selectedColourControl");
    const colourSwatches = document.getElementById("selectedColourSwatches");
    const surfaceControls = document.getElementById("surfaceItemControls");
    document.getElementById("duplicateButton").disabled = !item;
    document.getElementById("deleteButton").disabled = !item;
    if (!item) {
      colourControl.classList.add("hidden");
      surfaceControls.classList.add("hidden");
      document.getElementById("eketSnapControl").classList.add("hidden");
      document.getElementById("orientationField").classList.remove("hidden");
      document.getElementById("itemLock").classList.remove("active");
      const row = document.getElementById("songesandDoorControl");
      if (row) row.hidden = true;
      updateMeasurements205();
      return;
    }
    const def = defFor205(item);
    const colours = def?.colours || [];
    colourControl.classList.toggle("hidden", colours.length < 2);
    colourSwatches.innerHTML = colours.map((key) => swatchHtml205(key, key === item.colourKey, "data-selected-colour")).join("");
    colourSwatches.querySelectorAll("[data-selected-colour]").forEach((button) => {
      button.onclick = () => {
        replaceItemModel205(item, button.dataset.selectedColour, item.doorSide);
        updateSelectedPanel();
        updatePlacedList();
        queueHistory();
        const variant = PRODUCT_COLOURS_205[button.dataset.selectedColour];
        toast(`${variant?.label || variant?.name || "Colour"} applied`);
      };
    });
    surfaceControls.classList.toggle("hidden", item.mount !== "surface");
    const eketControl = document.getElementById("eketSnapControl");
    const eketButton = document.getElementById("eketSnapToggle");
    const eketStatus = document.getElementById("eketSnapStatus");
    const isEket = Boolean(def?.isEket && item.mount === "wall");
    eketControl.classList.toggle("hidden", !isEket);
    document.getElementById("orientationField").classList.toggle("hidden", Boolean(def?.wallCabinet || def?.isEket));
    if (isEket) {
      eketButton.classList.toggle("active", item.eketSnap !== false);
      eketButton.innerHTML = `${item.eketSnap === false ? "Enable modular joining" : "Disable modular joining"} <kbd>W</kbd>`;
      eketStatus.textContent = item.eketSnap === false
        ? "Free positioning is active. Press W to rejoin nearby EKET units."
        : "Move close to another EKET to join beside, above or below it in 35 cm modules.";
    }
    if (item.mount === "surface") {
      const support = supportFor205(item.supportId);
      document.getElementById("surfaceSupportStatus").textContent = support ? `Placed on ${support.name}. It moves with the supporting furniture.` : "No supporting surface selected.";
      const lampButton = document.getElementById("surfaceLampToggle");
      lampButton.innerHTML = `${item.lightOn ? "Switch lamp off" : "Switch lamp on"} <kbd>B</kbd>`;
      lampButton.classList.toggle("active", item.lightOn);
    }
    const lockButton = document.getElementById("itemLock");
    lockButton.classList.toggle("active", item.locked);
    lockButton.innerHTML = item.locked ? 'Unlock item <kbd>K</kbd>' : 'Lock item <kbd>K</kbd>';
    let row = document.getElementById("songesandDoorControl");
    if (def?.doorSide) {
      if (!row) {
        row = document.createElement("div");
        row.id = "songesandDoorControl";
        row.className = "selected-option";
        row.innerHTML = '<label>Door hinges</label><div class="segmented"><button type="button" data-door-side="left">Left</button><button type="button" data-door-side="right">Right</button></div>';
        document.getElementById("selectedItemCard").appendChild(row);
      }
      row.hidden = false;
      row.querySelectorAll("[data-door-side]").forEach((button) => {
        button.classList.toggle("active", button.dataset.doorSide === item.doorSide);
        button.onclick = () => {
          replaceItemModel205(item, item.colourKey, button.dataset.doorSide);
          updateSelectedPanel();
          queueHistory();
        };
      });
    } else if (row) row.hidden = true;
    if (item.locked) {
      const status = document.getElementById("itemStatus");
      status.className = "status-line good";
      status.querySelector("b").textContent = "Locked in place";
    }
    updateMeasurements205();
  }
  updateSelectedPanel = function updateSelectedPanel205() {
    const item = selectedPlacedItem;
    if (item?.mount !== "surface") {
      updateSelectedPanel204();
      if (item) {
        const def = defFor205(item);
        if (def?.exact) {
          document.getElementById("selectedItemCard").querySelector("p").textContent =
            `${item.category} · ${item.source} · exact ${item.w} × ${item.d} × ${item.h} cm planning envelope`;
        }
      }
      applySelectedExtras205(item);
      return;
    }
    const card = document.getElementById("selectedItemCard");
    for (const candidate of placedItems) recolourItem(candidate, candidate === item ? "selected" : "normal");
    card.querySelector("h4").textContent = item.name;
    card.querySelector("p").textContent = `${item.category} · ${item.source} · exact ${item.w} × ${item.d} × ${item.h} cm planning envelope`;
    document.getElementById("floorItemControls").classList.add("hidden");
    document.getElementById("wallItemControls").classList.add("hidden");
    const validity = surfaceValidation205(item);
    const status = document.getElementById("itemStatus");
    status.className = `status-line ${validity.hard ? "error" : "good"}`;
    status.querySelector("b").textContent = validity.message;
    recolourItem(item, validity.hard ? "error" : "selected");
    applySelectedExtras205(item);
  };

  updatePlacedList = function updatePlacedList205() {
    const root = document.getElementById("placedItemsList");
    if (!placedItems.length) {
      root.innerHTML = '<div class="status-line"><span>No planning items yet</span><b>0</b></div>';
      return;
    }
    root.innerHTML = placedItems.map((item, index) => {
      let location = item.mount === "wall" ? `Wall ${item.wall}` : item.mount === "surface" ? `On ${supportFor205(item.supportId)?.name || "surface"}` : `${item.x.toFixed(0)}, ${item.z.toFixed(0)}`;
      if (item.locked) location += " · Locked";
      return `<button class="status-line" data-select-index="${index}" style="width:100%;border:0;text-align:left;cursor:pointer"><span>${item.name}</span><b>${location}</b></button>`;
    }).join("");
    root.querySelectorAll("[data-select-index]").forEach((button) => {
      button.onclick = () => {
        selectPlacedItem(placedItems[Number(button.dataset.selectIndex)]);
        setPlacementMode(true, false);
      };
    });
  };

  function removeItem205(item, silent = false) {
    if (!item) return;
    const supported = placedItems.filter((candidate) => candidate.mount === "surface" && candidate.supportId === item.id);
    if (supported.length && !silent) {
      const okay = window.confirm(`This item supports ${supported.length} lamp${supported.length === 1 ? "" : "s"}. Delete the supporting item and ${supported.length === 1 ? "the lamp" : "those lamps"}?`);
      if (!okay) return;
    }
    for (const child of supported) removeItem205(child, true);
    removeLampLight205(item);
    unregisterItemMeshes205(item.group);
    item.group.parent?.remove(item.group);
    disposeGroup(item.group);
    const index = placedItems.indexOf(item);
    if (index >= 0) placedItems.splice(index, 1);
    if (selectedPlacedItem === item) selectedPlacedItem = null;
  }
  removeSelectedItem = function removeSelectedItem205() {
    if (!selectedPlacedItem) return;
    const name = selectedPlacedItem.name;
    removeItem205(selectedPlacedItem);
    updateSelectionHighlight(null);
    updateSelectedPanel();
    updatePlacedList();
    refreshMoveBanner();
    refreshLampShadows205();
    queueHistory();
    toast(`${name} removed`);
  };

  function validDuplicatePosition205(item, saved) {
    const temp = createItem205(item.key, saved, false);
    Object.assign(temp, saved);
    if (temp.mount === "floor") {
      scene.add(temp.group);
      temp.group.position.set(temp.x, 0, temp.z);
      temp.group.rotation.y = THREE.MathUtils.degToRad(temp.rotation);
    } else if (temp.mount === "wall") {
      scene.add(temp.group);
      wallPosition(temp);
    } else {
      const support = supportFor205(temp.supportId);
      if (support) support.group.add(temp.group);
      positionSurfaceItem205(temp);
    }
    const validity = itemValidation(temp);
    temp.group.parent?.remove(temp.group);
    disposeGroup(temp.group);
    return !validity.hard;
  }
  function duplicateSelected205() {
    const source = selectedPlacedItem;
    if (!source) return;
    const saved = itemRecord205(source);
    delete saved.id;
    if (source.mount === "floor") {
      const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      cameraRight.y = 0;
      cameraRight.normalize();
      const distance = Math.max(source.w, source.d) + 8;
      saved.x = source.x + cameraRight.x * distance;
      saved.z = source.z + cameraRight.z * distance;
      saved.wallSnapOverride = source.wallSnapOverride;
    } else if (source.mount === "wall") {
      const candidates = defFor205(source)?.isEket
        ? [
            [source.offset + source.w, source.height], [source.offset - source.w, source.height],
            [source.offset, source.height + source.h], [source.offset, source.height - source.h],
          ]
        : [[source.offset + source.w + 5, source.height], [source.offset - source.w - 5, source.height]];
      let chosen = null;
      for (const [offset, height] of candidates) {
        const candidate = { ...saved, offset, height };
        if (validDuplicatePosition205(source, candidate)) { chosen = candidate; break; }
      }
      if (chosen) Object.assign(saved, chosen);
      else {
        beginItemPlacement(source.key, source.colourKey, saved);
        toast("Move the duplicate to a free position");
        return;
      }
    } else {
      saved.localX = (source.localX || 0) + source.w + 3;
      if (!validDuplicatePosition205(source, saved)) saved.localX = (source.localX || 0) - source.w - 3;
      if (!validDuplicatePosition205(source, saved)) {
        beginItemPlacement(source.key, source.colourKey, saved);
        toast("Choose a free position for the duplicate");
        return;
      }
    }
    if (!validDuplicatePosition205(source, saved)) {
      beginItemPlacement(source.key, source.colourKey, saved);
      toast("Choose a free position for the duplicate");
      return;
    }
    const item = createItem205(source.key, saved, true);
    addPlacedItem205(item, saved);
    selectPlacedItem(item);
    setPlacementMode(true, false);
    updateSelectedPanel();
    updatePlacedList();
    refreshLampShadows205();
    queueHistory();
    toast(`${source.name} duplicated`);
  }

  function isEketItem205(item) {
    return Boolean(item && defFor205(item)?.isEket);
  }
  function toggleEketSnap205(item = pendingPlacement?.item || selectedPlacedItem) {
    if (!isEketItem205(item)) {
      toast("Modular joining is available for EKET cabinets");
      return;
    }
    item.eketSnap = item.eketSnap === false;
    if (item.eketSnap) {
      snapEket205(item);
      wallPosition(item);
      if (pendingPlacement?.hasPosition) {
        const validity = itemValidation(item);
        setGhostAppearance(!validity.hard, validity.message);
      } else {
        updateSelectedPanel();
        updatePlacedList();
        requestRender(true, 2);
      }
    } else {
      updateSelectedPanel();
      requestRender(true, 2);
    }
    queueHistory();
    toast(item.eketSnap ? "EKET modular joining enabled" : "EKET free positioning enabled");
  }

  function toggleItemLock205() {
    if (!selectedPlacedItem) return;
    selectedPlacedItem.locked = !selectedPlacedItem.locked;
    updateSelectedPanel();
    updatePlacedList();
    queueHistory();
    toast(selectedPlacedItem.locked ? "Item locked" : "Item unlocked");
  }
  function toggleLamp205() {
    if (!selectedPlacedItem || !defFor205(selectedPlacedItem)?.lamp) {
      toast("Select a lamp first");
      return;
    }
    selectedPlacedItem.lightOn = !selectedPlacedItem.lightOn;
    addLampLight205(selectedPlacedItem);
    refreshLampShadows205();
    updateSelectedPanel();
    queueHistory();
    toast(selectedPlacedItem.lightOn ? "Lamp switched on" : "Lamp switched off");
  }

  document.getElementById("duplicateButton").onclick = duplicateSelected205;
  document.getElementById("deleteButton").onclick = removeSelectedItem;
  document.getElementById("itemDuplicate").onclick = duplicateSelected205;
  document.getElementById("itemLock").onclick = toggleItemLock205;
  document.getElementById("itemDelete").onclick = removeSelectedItem;
  document.getElementById("itemDeleteWall").onclick = removeSelectedItem;
  document.getElementById("surfaceLampToggle").onclick = toggleLamp205;
  document.getElementById("eketSnapToggle").onclick = () => toggleEketSnap205();

  function cameraAxes205() {
    const forward = controls.target.clone().sub(camera.position);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    return { forward, right };
  }
  function cameraRelativeNudge205(key, step) {
    const item = pendingPlacement?.item || (placementMode ? selectedPlacedItem : null);
    if (item?.locked) { toast("Unlock this item before moving it"); return; }
    if (item?.mount === "wall") {
      const along = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
      const vertical = key === "ArrowUp" ? step : key === "ArrowDown" ? -step : 0;
      if (pendingPlacement) nudgePending(along, -vertical);
      else {
        const old = { offset: item.offset, height: item.height };
        item.offset += along;
        item.height += vertical;
        snapEket205(item);
        wallPosition(item);
        if (validateWallItem(item).hard) { Object.assign(item, old); wallPosition(item); }
        updateSelectedPanel(); updatePlacedList(); requestRender(true, 2);
      }
      return;
    }
    if (item?.mount === "surface") {
      const { forward, right } = cameraAxes205();
      const direction = key === "ArrowLeft" ? right.clone().multiplyScalar(-1) : key === "ArrowRight" ? right : key === "ArrowUp" ? forward : forward.clone().multiplyScalar(-1);
      const support = supportFor205(item.supportId);
      if (!support) return;
      const localDirection = support.group.worldToLocal(support.group.getWorldPosition(new THREE.Vector3()).add(direction)).sub(support.group.worldToLocal(support.group.getWorldPosition(new THREE.Vector3()))).normalize();
      const old = { localX: item.localX, localZ: item.localZ };
      item.localX += localDirection.x * step;
      item.localZ += localDirection.z * step;
      positionSurfaceItem205(item);
      if (surfaceValidation205(item).hard) { Object.assign(item, old); positionSurfaceItem205(item); }
      if (pendingPlacement) {
        const validity = itemValidation(item); setGhostAppearance(!validity.hard, validity.message);
      } else { updateSelectedPanel(); requestRender(true, 2); }
      return;
    }
    const { forward, right } = cameraAxes205();
    const direction = key === "ArrowLeft" ? right.clone().multiplyScalar(-1) : key === "ArrowRight" ? right : key === "ArrowUp" ? forward : forward.clone().multiplyScalar(-1);
    const dx = direction.x * step, dz = direction.z * step;
    if (pendingPlacement) nudgePending(dx, dz);
    else if (item) moveSelectedItem(dx, dz);
    else nudge(dx, dz);
  }

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
    const key = event.key;
    const command = event.ctrlKey || event.metaKey;
    let handled = false;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) {
      cameraRelativeNudge205(key, event.shiftKey ? 1 : state.snap ? state.gridSize : 1);
      handled = true;
    } else if (command && key.toLowerCase() === "d") {
      duplicateSelected205(); handled = true;
    } else if (command && key.toLowerCase() === "s") {
      toggleSavePanel205(true); handled = true;
    } else if (key.toLowerCase() === "w" && isEketItem205(pendingPlacement?.item || selectedPlacedItem)) {
      toggleEketSnap205(); handled = true;
    } else if (key.toLowerCase() === "b") {
      toggleLamp205(); handled = true;
    } else if (key.toLowerCase() === "k") {
      toggleItemLock205(); handled = true;
    } else if (key.toLowerCase() === "h") {
      setClearView205(true); handled = true;
    }
    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      queueHistory();
    }
  }, true);

  const moveSelectedItem204 = moveSelectedItem;
  moveSelectedItem = function moveSelectedItem205(dx, dz) {
    const item = selectedPlacedItem;
    if (!item) { nudge(dx, dz); return; }
    if (item.locked) { toast("Unlock this item before moving it"); return; }
    if (item.mount === "surface") {
      const old = { localX: item.localX, localZ: item.localZ };
      item.localX += dx; item.localZ += dz;
      positionSurfaceItem205(item);
      const validity = surfaceValidation205(item);
      if (validity.hard) { Object.assign(item, old); positionSurfaceItem205(item); toast(validity.message); }
      updateSelectedPanel(); updatePlacedList(); requestRender(true, 2); return;
    }
    moveSelectedItem204(dx, dz);
  };
  const rotateSelectedItem204 = rotateSelectedItem;
  rotateSelectedItem = function rotateSelectedItem205(direction, fine = false) {
    const item = selectedPlacedItem;
    if (item?.locked) { toast("Unlock this item before rotating it"); return; }
    if (item?.mount === "surface") {
      const old = item.rotation;
      item.rotation = normalizeAngle(item.rotation + direction * rotationStep(fine));
      positionSurfaceItem205(item);
      if (surfaceValidation205(item).hard) { item.rotation = old; positionSurfaceItem205(item); toast("That angle does not fit on the surface"); }
      updateSelectedPanel(); requestRender(true, 2); return;
    }
    rotateSelectedItem204(direction, fine);
  };

  const oldPointerDown205 = placementPointerDown;
  const oldPointerMove205 = placementPointerMove;
  const oldPointerUp205 = finishPlacementDrag;
  renderer.domElement.removeEventListener("pointerdown", oldPointerDown205, true);
  renderer.domElement.removeEventListener("pointermove", oldPointerMove205, true);
  renderer.domElement.removeEventListener("pointerup", oldPointerUp205, true);
  renderer.domElement.removeEventListener("pointercancel", oldPointerUp205, true);

  placementPointerDown = function placementPointerDown205(event) {
    if (pendingPlacement) { confirmPendingPlacement(event); return; }
    if (!placementMode || event.button !== 0) return;
    pointerNDC(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...bedMeshes, ...itemMeshes], false);
    if (!hits.length) return;
    const item = hits[0].object.userData.itemRef || null;
    event.preventDefault(); event.stopPropagation();
    if (item?.locked) { selectPlacedItem(item); toast("This item is locked"); return; }
    controls.enabled = false;
    renderer.domElement.setPointerCapture(event.pointerId);
    if (item) {
      selectPlacedItem(item);
      dragTarget = item;
      itemDragState = item.mount === "floor"
        ? { x: item.x, z: item.z, rotation: item.rotation, snappedWall: item.snappedWall, lastX: item.x, lastZ: item.z, lastRotation: item.rotation, lastSnappedWall: item.snappedWall }
        : item.mount === "wall"
          ? { wall: item.wall, offset: item.offset, height: item.height, lastWall: item.wall, lastOffset: item.offset, lastHeight: item.height }
          : { supportId: item.supportId, localX: item.localX, localZ: item.localZ, lastSupportId: item.supportId, lastLocalX: item.localX, lastLocalZ: item.localZ };
      if (item.mount === "floor" && raycaster.ray.intersectPlane(dragPlane, dragPoint)) dragOffset.set(item.x - dragPoint.x, 0, item.z - dragPoint.z);
    } else {
      selectPlacedItem(null);
      updateSelectionHighlight(bedGroup);
      dragTarget = "bed";
      if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) dragOffset.set(state.x - dragPoint.x, 0, state.z - dragPoint.z);
    }
    dragging = true;
    renderer.domElement.style.cursor = "grabbing";
  };
  placementPointerMove = function placementPointerMove205(event) {
    if (pendingPlacement) { updatePendingPlacement(event); return; }
    if (!dragging || !dragTarget) return;
    pointerNDC(event);
    raycaster.setFromCamera(pointer, camera);
    if (dragTarget === "bed") {
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      state.x = snapValue(dragPoint.x + dragOffset.x);
      state.z = snapValue(dragPoint.z + dragOffset.z);
      applyBedTransform(); return;
    }
    const item = dragTarget;
    if (item.mount === "floor") {
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      applyFloorItemPosition(item, dragPoint.x + dragOffset.x, dragPoint.z + dragOffset.z, true);
      const validity = validateFloorItem(item);
      if (!validity.hard) Object.assign(itemDragState, { lastX: item.x, lastZ: item.z, lastRotation: item.rotation, lastSnappedWall: item.snappedWall });
      recolourItem(item, validity.hard ? "error" : "selected");
    } else if (item.mount === "wall") {
      const hits = raycaster.intersectObjects(wallMeshes.filter((mesh) => mesh.visible), false);
      if (hits.length && wallHitToItem(item, hits[0])) {
        const validity = validateWallItem(item);
        if (!validity.hard) Object.assign(itemDragState, { lastWall: item.wall, lastOffset: item.offset, lastHeight: item.height });
        recolourItem(item, validity.hard ? "error" : "selected");
      }
    } else {
      const hits = raycaster.intersectObjects(itemMeshes, false);
      const hit = hits.find((candidate) => defFor205(candidate.object.userData.itemRef)?.supportsSurface);
      if (hit) {
        const support = hit.object.userData.itemRef;
        const local = support.group.worldToLocal(hit.point.clone());
        if (item.group.parent !== support.group) { item.group.parent?.remove(item.group); support.group.add(item.group); }
        item.supportId = support.id;
        item.localX = state.snap ? snapValue(local.x) : local.x;
        item.localZ = state.snap ? snapValue(local.z) : local.z;
        positionSurfaceItem205(item);
        const validity = surfaceValidation205(item);
        if (!validity.hard) Object.assign(itemDragState, { lastSupportId: item.supportId, lastLocalX: item.localX, lastLocalZ: item.localZ });
        recolourItem(item, validity.hard ? "error" : "selected");
      }
    }
    updateSelectedPanel();
    requestRender(true, 1);
  };
  finishPlacementDrag = function finishPlacementDrag205(event) {
    if (!dragging) return;
    if (dragTarget && dragTarget !== "bed") {
      const item = dragTarget;
      const validity = itemValidation(item);
      if (validity.hard) {
        if (item.mount === "floor") {
          item.x = itemDragState.lastX; item.z = itemDragState.lastZ; item.rotation = itemDragState.lastRotation; item.snappedWall = itemDragState.lastSnappedWall;
          item.group.position.set(item.x, 0, item.z); item.group.rotation.y = THREE.MathUtils.degToRad(item.rotation);
        } else if (item.mount === "wall") {
          item.wall = itemDragState.lastWall; item.offset = itemDragState.lastOffset; item.height = itemDragState.lastHeight; wallPosition(item);
        } else {
          item.supportId = itemDragState.lastSupportId; item.localX = itemDragState.lastLocalX; item.localZ = itemDragState.lastLocalZ; positionSurfaceItem205(item);
        }
        toast(validity.message);
      }
    }
    dragging = false; dragTarget = null; itemDragState = null;
    controls.enabled = true;
    renderer.domElement.style.cursor = placementMode ? "grab" : "";
    if (event?.pointerId != null) try { renderer.domElement.releasePointerCapture(event.pointerId); } catch (_) {}
    updateSelectedPanel(); updatePlacedList(); refreshLampShadows205(); queueHistory(); requestRender(true, 2);
  };
  renderer.domElement.addEventListener("pointerdown", placementPointerDown, true);
  renderer.domElement.addEventListener("pointermove", placementPointerMove, true);
  renderer.domElement.addEventListener("pointerup", finishPlacementDrag, true);
  renderer.domElement.addEventListener("pointercancel", finishPlacementDrag, true);

  const clearanceGroup205 = new THREE.Group();
  clearanceGroup205.name = "Planning_Clearances";
  scene.add(clearanceGroup205);
  const clearanceMaterial205 = new THREE.MeshBasicMaterial({ color: 0xe1a447, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide });
  const heaterClearance205 = new THREE.Mesh(new THREE.BoxGeometry(62, 0.8, qW + 30), clearanceMaterial205.clone());
  heaterClearance205.position.set(31, 0.45, qCentreZ);
  clearanceGroup205.add(heaterClearance205);
  const selectedClearance205 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 1), clearanceMaterial205.clone());
  selectedClearance205.material.color.setHex(0x4b8ed6);
  clearanceGroup205.add(selectedClearance205);
  function updateOverlays205() {
    clearanceGroup205.visible = !!state.showClearances;
    doorSweep.visible = state.showClearances || currentView === "plan" || polygonsOverlap(bedPolygon(), doorPts);
    const item = selectedPlacedItem;
    selectedClearance205.visible = !!(state.showClearances && item && item.mount === "floor" && ["idanaes", "pax", "brimnes"].includes(item.key));
    if (selectedClearance205.visible) {
      const depth = item.d + 65;
      selectedClearance205.geometry.dispose();
      selectedClearance205.geometry = new THREE.BoxGeometry(item.w, 0.7, depth);
      selectedClearance205.position.set(item.x, 0.4, item.z + Math.cos(THREE.MathUtils.degToRad(item.rotation)) * 32.5);
      selectedClearance205.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    }
    updateMeasurements205();
    requestRender(false, 1);
  }
  function updateMeasurements205() {
    const hud = document.getElementById("measurementHud");
    const item = selectedPlacedItem;
    if (!state.showMeasurements || !item || document.body.classList.contains("clear-room-view")) { hud.hidden = true; return; }
    let text;
    if (item.mount === "floor") {
      const left = Math.max(0, item.x - item.w / 2);
      const right = Math.max(0, D.W5 - (item.x + item.w / 2));
      const front = Math.max(0, item.z - item.d / 2);
      const back = Math.max(0, D.W6 - (item.z + item.d / 2));
      text = `<b>${item.name}</b><span>${item.w} × ${item.d} × ${item.h} cm</span><span>Nearest room edges: ${Math.min(left, right).toFixed(0)} cm side · ${Math.min(front, back).toFixed(0)} cm front/back</span>`;
    } else if (item.mount === "wall") {
      const dims = wallDims(item);
      text = `<b>${item.name}</b><span>Wall ${item.wall} · ${item.offset.toFixed(0)} cm along</span><span>Bottom ${(item.height - dims.h / 2).toFixed(0)} cm · top ${(item.height + dims.h / 2).toFixed(0)} cm</span>`;
    } else {
      text = `<b>${item.name}</b><span>On ${supportFor205(item.supportId)?.name || "surface"}</span><span>${item.localX.toFixed(0)} cm across · ${item.localZ.toFixed(0)} cm deep</span>`;
    }
    hud.innerHTML = text;
    hud.hidden = false;
  }
  document.getElementById("clearanceToggle").onchange = (event) => { state.showClearances = event.target.checked; updateOverlays205(); queueHistory(); };
  document.getElementById("measurementToggle").onchange = (event) => { state.showMeasurements = event.target.checked; updateMeasurements205(); queueHistory(); };

  function updateFloorDirection205(announce = true) {
    state.floorDirection = state.floorDirection ? 1 : 0;
    applyFloorDirection205();
    document.getElementById("floorDirectionButton").textContent = state.floorDirection ? "Planks run across the room" : "Planks run along the room";
    requestRender(true, 2);
    if (announce) toast("Floor direction rotated");
  }
  document.getElementById("floorDirectionButton").onclick = () => {
    state.floorDirection = state.floorDirection ? 0 : 1;
    updateFloorDirection205(true);
    queueHistory();
  };
  document.querySelectorAll("[data-floor]").forEach((button) => {
    button.onclick = () => { setFloorMaterial(button.dataset.floor); queueHistory(); };
  });

  function applyLightScene205(sceneKey, announce = true) {
    state.lightScene = sceneKey === "evening" ? "evening" : "day";
    if (state.lightScene === "evening") {
      lightingState.daylightLevel = 0.16;
      lightingState.overheadLevel = 0.72;
      applyTimeOfDay(19.2, false);
    } else {
      lightingState.daylightLevel = 1.0;
      lightingState.overheadLevel = 0.18;
      applyTimeOfDay(13.2, false);
    }
    overheadLight.intensity = lightingState.overheadLevel;
    document.getElementById("daylightSlider").value = lightingState.daylightLevel;
    document.getElementById("daylightValue").textContent = lightingState.daylightLevel.toFixed(2);
    document.getElementById("overheadSlider").value = lightingState.overheadLevel;
    document.getElementById("overheadValue").textContent = lightingState.overheadLevel.toFixed(2);
    document.querySelectorAll("[data-light-scene]").forEach((button) => button.classList.toggle("active", button.dataset.lightScene === state.lightScene));
    refreshLampShadows205();
    if (announce) toast(state.lightScene === "evening" ? "Evening lighting" : "Daylight lighting");
  }
  document.querySelectorAll("[data-light-scene]").forEach((button) => {
    button.onclick = () => { applyLightScene205(button.dataset.lightScene); queueHistory(); };
  });

  function setClearView205(enabled) {
    document.body.classList.toggle("clear-room-view", !!enabled);
    document.getElementById("showControlsButton").hidden = !enabled;
    if (enabled) {
      toggleDrawer(false); toggleLibrary(false); toggleHotkeys(false); toggleSavePanel205(false);
      updateSelectionHighlight(null);
      document.getElementById("imageMenu").hidden = true;
    } else if (selectedPlacedItem && placementMode) updateSelectionHighlight(selectedPlacedItem.group);
    updateMeasurements205();
    requestRender(false, 2);
  }
  document.getElementById("clearViewButton").onclick = () => setClearView205(true);
  document.getElementById("showControlsButton").onclick = () => setClearView205(false);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("clear-room-view")) {
      event.preventDefault(); event.stopImmediatePropagation(); setClearView205(false);
    }
  }, true);

  const SAVE_KEY_205 = "bedroom-room-planner-v2.05-autosave";
  const SLOT_KEY_205 = "bedroom-room-planner-v2.05-slots";
  let autosaveTimer205 = null;
  function scheduleAutosave205() {
    clearTimeout(autosaveTimer205);
    autosaveTimer205 = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY_205, serializePlanner()); } catch (_) {}
    }, 250);
  }
  const queueHistory204 = queueHistory;
  queueHistory = function queueHistory205() {
    queueHistory204();
    scheduleAutosave205();
  };
  function readSlots205() {
    try {
      const value = JSON.parse(localStorage.getItem(SLOT_KEY_205) || "[]");
      return Array.isArray(value) ? value.slice(0, 3) : [];
    } catch (_) { return []; }
  }
  function writeSlots205(slots) {
    localStorage.setItem(SLOT_KEY_205, JSON.stringify(slots.slice(0, 3)));
    renderSaveSlots205();
  }
  function renderSaveSlots205() {
    const root = document.getElementById("saveSlots");
    const slots = readSlots205();
    root.innerHTML = [0, 1, 2].map((index) => {
      const slot = slots[index];
      return `<article class="save-slot${slot ? " filled" : ""}"><div><b>${slot ? slot.name : `Empty slot ${index + 1}`}</b><small>${slot ? new Date(slot.savedAt).toLocaleString() : "Save a layout here"}</small></div><div class="save-slot-actions">${slot ? `<button type="button" data-load-slot="${index}">Load</button><button type="button" data-overwrite-slot="${index}">Overwrite</button><button type="button" data-rename-slot="${index}">Rename</button><button type="button" data-delete-slot="${index}">Delete</button>` : `<button type="button" data-save-slot="${index}">Save here</button>`}</div></article>`;
    }).join("");
    root.querySelectorAll("[data-save-slot]").forEach((button) => button.onclick = () => saveSlot205(Number(button.dataset.saveSlot)));
    root.querySelectorAll("[data-load-slot]").forEach((button) => button.onclick = () => {
      const slot = readSlots205()[Number(button.dataset.loadSlot)];
      if (slot?.layout) { restorePlanner(slot.layout); commitHistory(); toggleSavePanel205(false); toast(`${slot.name} loaded`); }
    });
    root.querySelectorAll("[data-overwrite-slot]").forEach((button) => button.onclick = () => saveSlot205(Number(button.dataset.overwriteSlot), true));
    root.querySelectorAll("[data-rename-slot]").forEach((button) => button.onclick = () => {
      const index = Number(button.dataset.renameSlot), slots = readSlots205();
      const name = window.prompt("Rename this layout", slots[index]?.name || "Bedroom layout");
      if (name?.trim()) { slots[index].name = name.trim().slice(0, 48); writeSlots205(slots); }
    });
    root.querySelectorAll("[data-delete-slot]").forEach((button) => button.onclick = () => {
      const index = Number(button.dataset.deleteSlot), slots = readSlots205();
      if (!window.confirm(`Delete “${slots[index]?.name || "this layout"}”?`)) return;
      slots.splice(index, 1); writeSlots205(slots); toast("Saved layout deleted");
    });
  }
  function saveSlot205(index, overwrite = false) {
    const slots = readSlots205();
    if (slots[index] && !overwrite && !window.confirm("Replace the existing layout in this slot?")) return;
    const input = document.getElementById("saveLayoutName");
    const fallback = slots[index]?.name || `Bedroom layout ${index + 1}`;
    const name = (input.value.trim() || fallback).slice(0, 48);
    slots[index] = { name, savedAt: new Date().toISOString(), layout: serializePlanner() };
    writeSlots205(slots);
    input.value = "";
    toast(`${name} saved`);
  }
  function toggleSavePanel205(open) {
    const panel = document.getElementById("savePanel");
    const next = open ?? panel.getAttribute("aria-hidden") === "true";
    panel.setAttribute("aria-hidden", String(!next));
    panel.classList.toggle("open", next);
    if (next) { toggleDrawer(false); toggleLibrary(false); renderSaveSlots205(); }
  }
  document.getElementById("saveLayoutButton").onclick = () => toggleSavePanel205(true);
  document.getElementById("savePanelClose").onclick = () => toggleSavePanel205(false);
  document.getElementById("saveNewSlot").onclick = () => {
    const slots = readSlots205();
    const index = slots.length < 3 ? slots.length : -1;
    if (index < 0) { toast("Choose a slot to overwrite"); return; }
    saveSlot205(index);
  };
  document.getElementById("exportLayout").onclick = () => {
    const blob = new Blob([JSON.stringify(JSON.parse(serializePlanner()), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bedroom-layout-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  document.getElementById("importLayout").onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.state || !Array.isArray(parsed.items)) throw new Error("Not a Bedroom Room Planner layout");
      restorePlanner(JSON.stringify(parsed)); commitHistory(); toast("Layout imported");
    } catch (error) { toast(error.message || "Could not import layout"); }
    event.target.value = "";
  };
  renderSaveSlots205();

  async function saveScreenshot205(view) {
    const previousView = currentView;
    const previousClear = document.body.classList.contains("clear-room-view");
    const previousSelection = selectedPlacedItem;
    const previousQuality = state.quality || "adaptive";
    setClearView205(true);
    if (view === "plan" && previousView !== "plan") moveCamera("plan");
    setQuality("high", false);
    refreshLampShadows205();
    requestRender(true, 5);
    await new Promise((resolve) => setTimeout(resolve, 220));
    renderScene();
    const link = document.createElement("a");
    link.download = `bedroom-room-planner-${view}-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
    if (view === "plan" && previousView !== "plan") moveCamera(previousView || "design");
    if (!previousClear) setClearView205(false);
    if (previousSelection) selectPlacedItem(previousSelection);
    setQuality(previousQuality, false);
    toast("Image saved");
  }
  document.getElementById("saveImageButton").onclick = () => {
    const menu = document.getElementById("imageMenu");
    menu.hidden = !menu.hidden;
  };
  document.querySelectorAll("[data-image-view]").forEach((button) => {
    button.onclick = () => { document.getElementById("imageMenu").hidden = true; saveScreenshot205(button.dataset.imageView); };
  });


  cancelPendingPlacement = function cancelPendingPlacement205(announce = true) {
    if (!pendingPlacement) return;
    pendingPlacement.group.parent?.remove(pendingPlacement.group);
    scene.remove(pendingPlacement.outline);
    disposeGroup(pendingPlacement.group);
    pendingPlacement.outline.geometry?.dispose();
    pendingPlacement.outline.material?.dispose();
    pendingPlacement = null;
    document.body.classList.remove("placing-new-item");
    setPlacementMode(placementMode, false);
    if (announce) toast("Placement cancelled");
    requestRender(false, 1);
  };

  setAccentWall = function setAccentWall205(wall, announce = true) {
    state.accentWall = Number(wall);
    const accentHex = C[state.accentColour] || C.dusted_fondant;
    for (const mesh of wallMeshes) {
      const accent = mesh.userData.wallNumber === state.accentWall;
      mesh.material.color.set(accent ? accentHex : C.wall_white);
      if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
      mesh.material.needsUpdate = true;
    }
    document.getElementById("accentWall").value = String(state.accentWall);
    document.getElementById("paintLabel").textContent = `Wall ${state.accentWall} · click to change`;
    document.getElementById("paintName").textContent = `Dulux ${accentName()}`;
    document.getElementById("paintSwatch").style.background = accentHex;
    requestRender(false, 2);
    if (announce) toast(`${accentName()} moved to Wall ${state.accentWall}`);
  };

  const originalSetQuality205 = setQuality;
  setQuality = function setQuality205(key, announce = true) {
    originalSetQuality205(key, announce);
    refreshLampShadows205();
  };

  const startupSnapshot205 = (() => {
    try { return localStorage.getItem(SAVE_KEY_205); } catch (_) { return null; }
  })();
  if (startupSnapshot205) {
    const restoreBar = document.createElement("button");
    restoreBar.type = "button";
    restoreBar.className = "autosave-restore glass";
    restoreBar.textContent = "Restore the last locally saved layout";
    restoreBar.onclick = () => {
      try { restorePlanner(startupSnapshot205); commitHistory(); toast("Last layout restored"); }
      catch (_) { toast("The previous local layout could not be restored"); }
      restoreBar.remove();
    };
    document.body.appendChild(restoreBar);
    setTimeout(() => restoreBar.remove(), 12000);
  }

  setFloorMaterial("cotton", false);
  updateFloorDirection205(false);
  applyLightScene205("day", false);
  document.getElementById("clearanceToggle").checked = state.showClearances;
  document.getElementById("measurementToggle").checked = state.showMeasurements;
  updateSelectedPanel();
  updatePlacedList();
  updateOverlays205();
  requestRender(true, 3);
})();


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
    done = localStorage.getItem("bedroomPlannerV205Tour") === "done";
  } catch (e) {}
  if (!done) setTimeout(() => showCoach(0), 380);
}, 350);


window.BedroomPlannerDiagnostics = {
  version: "2.05",
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

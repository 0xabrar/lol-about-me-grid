const viewerCatalog = {
  champion: "Teemo",
  skins: [
    {
      id: "17000",
      name: "Classic Teemo",
      asset: "assets/models/teemo-default/model.glb",
      size: 9238056,
    },
    {
      id: "17001",
      name: "Happy Elf Teemo",
      asset: "assets/models/teemo-happy-elf/model.glb",
      size: 9531708,
    },
    {
      id: "17002",
      name: "Recon Teemo",
      asset: "assets/models/teemo-recon/model.glb",
      size: 8943444,
    },
    {
      id: "17003",
      name: "Badger Teemo",
      asset: "assets/models/teemo-badger/model.glb",
      size: 8825496,
    },
    {
      id: "17004",
      name: "Astronaut Teemo",
      asset: "assets/models/teemo-astronaut/model.glb",
      size: 8892844,
    },
    {
      id: "17005",
      name: "Cottontail Teemo",
      asset: "assets/models/teemo-cottontail/model.glb",
      size: 8265928,
    },
    {
      id: "17006",
      name: "Super Teemo",
      asset: "assets/models/teemo-super/model.glb",
      size: 7651788,
    },
    {
      id: "17007",
      name: "Panda Teemo",
      asset: "assets/models/teemo-panda/model.glb",
      size: 9245360,
    },
    {
      id: "17008",
      name: "Omega Squad Teemo",
      asset: "assets/models/teemo-omega-squad/model.glb",
      size: 3779064,
    },
    {
      id: "17014",
      name: "Little Devil Teemo",
      asset: "assets/models/teemo-little-devil/model.glb",
      size: 10806816,
    },
    {
      id: "17018",
      name: "Beemo",
      asset: "assets/models/teemo-beemo/model.glb",
      size: 8070764,
    },
    {
      id: "17025",
      name: "Spirit Blossom Teemo",
      asset: "assets/models/teemo-spirit-blossom/model.glb",
      size: 7867208,
    },
    {
      id: "17027",
      name: "Prestige Spirit Blossom Teemo",
      asset: "assets/models/teemo-prestige-spirit-blossom/model.glb",
      size: 7709484,
    },
    {
      id: "17037",
      name: "Firecracker Teemo",
      asset: "assets/models/teemo-firecracker/model.glb",
      size: 8009144,
    },
    {
      id: "17047",
      name: "Space Groove Teemo",
      asset: "assets/models/teemo-space-groove/model.glb",
      size: 13468724,
    },
    {
      id: "17054",
      name: "Spirit Blossom Springs Teemo",
      asset: "assets/models/teemo-spirit-blossom-springs/model.glb",
      size: 9417100,
    },
  ],
};

const categoryRules = [
  {
    label: "Death / Spawn",
    patterns: [
      /(^|[._\-\s])(death|die|dead|died|defeat|slain|spawn|respawn)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Recall / Base",
    patterns: [
      /(^|[._\-\s])(recall|base|teleport|return|intro|outro|enter|exit|arrival)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Abilities",
    patterns: [
      /(^|[._\-\s])(spell[1-4]?|ability|passive|cast|channel)([._\-\s\d]|$)/,
      /(^|[._\-\s])(q|w|e|r)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Combat: Attack / Crit",
    patterns: [
      /(^|[._\-\s])(crit|critical|critattack|attack|basicattack|autoattack|aa|melee|ranged|shoot|strike|stab|swing|combo)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Idle",
    patterns: [
      /(^|[._\-\s])(idle|stand|rest|neutral|breathe|breathing|wait)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Movement",
    patterns: [
      /(^|[._\-\s])(run|walk|strafe|turn|jump|leap|dash|dodge|fall|land|flip|spin|air)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Emotes",
    patterns: [
      /(^|[._\-\s])(joke|taunt|dance|laugh|emote|wave|point|victory|clap|cheer|celebrate)([._\-\s\d]|$)/,
    ],
  },
];

const categoryDisplayOrder = [
  "Idle",
  "Combat: Attack / Crit",
  "Death / Spawn",
  "Abilities",
  "Movement",
  "Emotes",
  "Recall / Base",
  "Other",
];

const model = document.querySelector("#skin-model");
const status = document.querySelector("#viewer-status");
const title = document.querySelector("#viewer-skin-title");
const skinSelect = document.querySelector("#skin-select");
const skinCount = document.querySelector("#skin-count");
const skinMark = document.querySelector("#skin-mark");
const currentSkinName = document.querySelector("#current-skin-name");
const currentSkinMeta = document.querySelector("#current-skin-meta");
const progressFill = document.querySelector("#model-progress-fill");
const animationSelect = document.querySelector("#animation-select");
const animationCount = document.querySelector("#animation-count");
const playToggle = document.querySelector("#play-toggle");
const resetCamera = document.querySelector("#reset-camera");
const autoRotate = document.querySelector("#auto-rotate");
const toneToggle = document.querySelector("#tone-toggle");
const animationTime = document.querySelector("#animation-time");
const animationTimeLabel = document.querySelector("#animation-time-label");

const defaultCamera = {
  orbit: "24deg 72deg 6m",
  target: "0m 1m 0m",
  fieldOfView: "30deg",
};

let activeSkin = viewerCatalog.skins[0];
let isModelLoading = false;

function setStatus(value) {
  status.textContent = value;
}

function formatSeconds(value) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}s`;
}

function formatBytes(value) {
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function normalizeAnimationName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^\w.-]+/g, "_")
    .toLowerCase();
}

function categoryForAnimation(name) {
  const normalized = normalizeAnimationName(name);
  const matched = categoryRules.find((group) =>
    group.patterns.some((pattern) => pattern.test(normalized)),
  );

  return matched ? matched.label : "Other";
}

function preferredAnimationName(names) {
  return (
    names.find((name) => categoryForAnimation(name) === "Idle") ||
    names.find((name) => /idle/i.test(name)) ||
    names[0] ||
    ""
  );
}

function syncPlayButton() {
  playToggle.textContent = model.paused ? "Play" : "Pause";
}

function resetAnimationControls(message = "Loading animations...") {
  animationSelect.textContent = "";
  const option = document.createElement("option");
  option.textContent = message;
  animationSelect.append(option);
  animationSelect.disabled = true;
  animationCount.textContent = "0";
  playToggle.disabled = true;
  animationTime.disabled = true;
  animationTime.value = "0";
  animationTimeLabel.textContent = "0.0s / 0.0s";
  syncPlayButton();
}

function updateSkinDetails(skin) {
  title.textContent = skin.name;
  skinSelect.value = skin.id;
  skinMark.textContent = skin.name === "Beemo" ? "B" : viewerCatalog.champion[0];
  currentSkinName.textContent = skin.name;
  currentSkinMeta.textContent = `Skin ${skin.id} - ${formatBytes(skin.size)} GLB`;
  model.alt = `${skin.name} 3D model`;
}

function selectSkin(skinId) {
  const nextSkin = viewerCatalog.skins.find((skin) => skin.id === skinId) || viewerCatalog.skins[0];
  activeSkin = nextSkin;

  model.pause();
  model.animationName = "";
  progressFill.style.transform = "scaleX(0)";
  isModelLoading = true;
  setStatus("Loading");
  resetAnimationControls();
  updateSkinDetails(nextSkin);
  model.setAttribute("src", nextSkin.asset);
}

function applyDefaultCamera() {
  try {
    const center = model.getBoundingBoxCenter();
    const dimensions = model.getDimensions();
    const rect = model.getBoundingClientRect();
    const isNarrow = rect.width / Math.max(rect.height, 1) < 1.2;
    const radius = Math.max(dimensions.x, dimensions.y, dimensions.z) * (isNarrow ? 3.6 : 3.1);

    defaultCamera.target = `${center.x}m ${center.y}m ${center.z}m`;
    defaultCamera.orbit = `28deg 68deg ${Math.max(4.1, radius).toFixed(2)}m`;
    defaultCamera.fieldOfView = "28deg";
  } catch {
    defaultCamera.orbit = "24deg 72deg 6m";
    defaultCamera.target = "0m 1m 0m";
    defaultCamera.fieldOfView = "30deg";
  }

  model.cameraOrbit = defaultCamera.orbit;
  model.cameraTarget = defaultCamera.target;
  model.fieldOfView = defaultCamera.fieldOfView;
  model.jumpCameraToGoal();
}

function populateAnimations() {
  const animations = model.availableAnimations || [];
  const groupedAnimations = new Map(categoryDisplayOrder.map((label) => [label, []]));
  animationSelect.textContent = "";
  animationCount.textContent = `${animations.length}`;

  if (!animations.length) {
    resetAnimationControls("No animations");
    return;
  }

  animations.forEach((name) => {
    const label = categoryForAnimation(name);
    groupedAnimations.get(label).push(name);
  });

  categoryDisplayOrder.forEach((label) => {
    const names = groupedAnimations.get(label);

    if (!names.length) {
      return;
    }

    const group = document.createElement("optgroup");
    group.label = `${label} (${names.length})`;

    names.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      group.append(option);
    });

    animationSelect.append(group);
  });

  const initialAnimation = preferredAnimationName(animations);
  model.animationName = initialAnimation;
  animationSelect.value = initialAnimation;
  animationSelect.disabled = false;
  playToggle.disabled = false;
  animationTime.disabled = false;
  model.play();
  syncPlayButton();
}

function populateSkins() {
  skinSelect.textContent = "";
  skinCount.textContent = `${viewerCatalog.skins.length} skins`;

  viewerCatalog.skins.forEach((skin) => {
    const option = document.createElement("option");
    option.value = skin.id;
    option.textContent = skin.name;
    skinSelect.append(option);
  });
}

model.addEventListener("progress", (event) => {
  const progress = Math.max(0, Math.min(1, event.detail.totalProgress || 0));
  progressFill.style.transform = `scaleX(${progress})`;

  if (isModelLoading && progress < 1) {
    setStatus(`${Math.round(progress * 100)}%`);
  }
});

model.addEventListener("load", () => {
  isModelLoading = false;
  progressFill.style.transform = "scaleX(1)";
  setStatus("Ready");
  updateSkinDetails(activeSkin);
  applyDefaultCamera();
  populateAnimations();
});

model.addEventListener("error", () => {
  isModelLoading = false;
  setStatus("Model failed");
  resetAnimationControls("Model failed");
});

skinSelect.addEventListener("change", () => {
  selectSkin(skinSelect.value);
});

animationSelect.addEventListener("change", () => {
  model.animationName = animationSelect.value;
  model.currentTime = 0;
  model.play();
  syncPlayButton();
});

playToggle.addEventListener("click", () => {
  if (model.paused) {
    model.play();
  } else {
    model.pause();
  }

  syncPlayButton();
});

resetCamera.addEventListener("click", () => {
  model.cameraOrbit = defaultCamera.orbit;
  model.cameraTarget = defaultCamera.target;
  model.fieldOfView = defaultCamera.fieldOfView;
  model.jumpCameraToGoal();
});

autoRotate.addEventListener("change", () => {
  if (autoRotate.checked) {
    model.setAttribute("auto-rotate", "");
  } else {
    model.removeAttribute("auto-rotate");
  }
});

toneToggle.addEventListener("change", () => {
  model.exposure = toneToggle.checked ? "1.02" : "0.82";
  model.shadowIntensity = toneToggle.checked ? "0.7" : "0.35";
});

animationTime.addEventListener("input", () => {
  if (!model.duration) {
    return;
  }

  model.currentTime = (Number(animationTime.value) / 1000) * model.duration;
});

function updateTimeControls() {
  const duration = model.duration || 0;
  const currentTime = model.currentTime || 0;

  if (duration > 0 && !animationTime.matches(":active")) {
    animationTime.value = String(Math.round((currentTime / duration) * 1000));
  }

  animationTimeLabel.textContent = `${formatSeconds(currentTime)} / ${formatSeconds(duration)}`;
  syncPlayButton();
  requestAnimationFrame(updateTimeControls);
}

populateSkins();
selectSkin(viewerCatalog.skins[0].id);
updateTimeControls();

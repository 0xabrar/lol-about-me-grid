const viewerCatalog = {
  champion: "Teemo",
  artBaseUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/loading",
  skins: [
    {
      id: "17000",
      num: 0,
      name: "Classic Teemo",
      asset: "assets/models/teemo-default/model.glb",
      size: 9238056,
    },
    {
      id: "17001",
      num: 1,
      name: "Happy Elf Teemo",
      asset: "assets/models/teemo-happy-elf/model.glb",
      size: 9531708,
    },
    {
      id: "17002",
      num: 2,
      name: "Recon Teemo",
      asset: "assets/models/teemo-recon/model.glb",
      size: 8943444,
    },
    {
      id: "17003",
      num: 3,
      name: "Badger Teemo",
      asset: "assets/models/teemo-badger/model.glb",
      size: 8825496,
    },
    {
      id: "17004",
      num: 4,
      name: "Astronaut Teemo",
      asset: "assets/models/teemo-astronaut/model.glb",
      size: 8892844,
    },
    {
      id: "17005",
      num: 5,
      name: "Cottontail Teemo",
      asset: "assets/models/teemo-cottontail/model.glb",
      size: 8265928,
    },
    {
      id: "17006",
      num: 6,
      name: "Super Teemo",
      asset: "assets/models/teemo-super/model.glb",
      size: 7651788,
    },
    {
      id: "17007",
      num: 7,
      name: "Panda Teemo",
      asset: "assets/models/teemo-panda/model.glb",
      size: 9245360,
    },
    {
      id: "17008",
      num: 8,
      name: "Omega Squad Teemo",
      asset: "assets/models/teemo-omega-squad/model.glb",
      size: 3779064,
    },
    {
      id: "17014",
      num: 14,
      name: "Little Devil Teemo",
      asset: "assets/models/teemo-little-devil/model.glb",
      size: 10806816,
    },
    {
      id: "17018",
      num: 18,
      name: "Beemo",
      asset: "assets/models/teemo-beemo/model.glb",
      size: 8070764,
    },
    {
      id: "17025",
      num: 25,
      name: "Spirit Blossom Teemo",
      asset: "assets/models/teemo-spirit-blossom/model.glb",
      size: 7867208,
    },
    {
      id: "17027",
      num: 27,
      name: "Prestige Spirit Blossom Teemo",
      asset: "assets/models/teemo-prestige-spirit-blossom/model.glb",
      size: 7709484,
    },
    {
      id: "17037",
      num: 37,
      name: "Firecracker Teemo",
      asset: "assets/models/teemo-firecracker/model.glb",
      size: 8009144,
    },
    {
      id: "17047",
      num: 47,
      name: "Space Groove Teemo",
      asset: "assets/models/teemo-space-groove/model.glb",
      size: 13468724,
    },
    {
      id: "17054",
      num: 54,
      name: "Spirit Blossom Springs Teemo",
      asset: "assets/models/teemo-spirit-blossom-springs/model.glb",
      size: 9417100,
    },
  ],
};

const categoryRules = [
  {
    label: "Idle",
    patterns: [
      /(^|[._\-\s])(idle|stand|rest|neutral|breathe|breathing|wait)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Combat: Attack / Crit",
    patterns: [
      /(^|[._\-\s])(crit|critical|critattack|attack|basicattack|autoattack|aa|melee|ranged|shoot|strike|stab|swing|combo)([._\-\s\d]|$)/,
    ],
  },
  {
    label: "Death / Spawn",
    patterns: [
      /(^|[._\-\s])(death|die|dead|died|defeat|slain|spawn|respawn)([._\-\s\d]|$)/,
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
  {
    label: "Recall / Base",
    patterns: [
      /(^|[._\-\s])(recall|teleport|return|intro|outro|enter|exit|arrival)([._\-\s\d]|$)/,
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
const skinArt = document.querySelector("#skin-art");
const currentSkinName = document.querySelector("#current-skin-name");
const currentSkinMeta = document.querySelector("#current-skin-meta");
const progressFill = document.querySelector("#model-progress-fill");
const modelLoader = document.querySelector("#model-loader");
const modelLoaderLabel = document.querySelector("#model-loader-label");
const modelLoaderFill = document.querySelector("#model-loader-fill");
const modelLoaderPercent = document.querySelector("#model-loader-percent");
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
let activeAnimationDuration = 0;
const prefetchedAssets = new Set();
let loaderFrame = 0;
let loaderStartedAt = 0;
let measuredLoadProgress = 0;
let displayedLoadProgress = 0;

function setStatus(value) {
  status.textContent = value;
}

function paintLoaderProgress(progress) {
  const clamped = Math.max(0, Math.min(1, progress));
  const percent = Math.round(clamped * 100);
  modelLoaderFill.style.transform = `scaleX(${clamped})`;
  modelLoaderPercent.textContent = `${percent}%`;
}

function resetLoaderProgress() {
  modelLoaderFill.classList.add("is-resetting");
  paintLoaderProgress(0);
  modelLoaderFill.getBoundingClientRect();
  modelLoaderFill.classList.remove("is-resetting");
}

function stopLoaderProgress() {
  if (loaderFrame) {
    cancelAnimationFrame(loaderFrame);
    loaderFrame = 0;
  }
}

function runLoaderProgress() {
  if (!isModelLoading) {
    return;
  }

  const elapsed = performance.now() - loaderStartedAt;
  const simulatedProgress = Math.min(0.92, (1 - Math.exp(-elapsed / 2600)) * 0.92);
  const measuredTarget = Math.min(measuredLoadProgress * 0.96, 0.96);
  const target = Math.max(simulatedProgress, measuredTarget);
  const nextProgress = displayedLoadProgress + (target - displayedLoadProgress) * 0.06;
  displayedLoadProgress = Math.max(displayedLoadProgress, Math.min(target, nextProgress));

  paintLoaderProgress(displayedLoadProgress);
  const percent = Math.floor(displayedLoadProgress * 100);
  setStatus(`${percent}%`);
  modelLoaderLabel.textContent = `Loading ${activeSkin.name}...`;
  loaderFrame = requestAnimationFrame(runLoaderProgress);
}

function setModelLoading(isLoading, label = "Loading skin...") {
  stopLoaderProgress();
  isModelLoading = isLoading;
  modelLoaderLabel.textContent = label;
  skinSelect.disabled = isLoading;

  if (isLoading) {
    loaderStartedAt = performance.now();
    measuredLoadProgress = 0;
    displayedLoadProgress = 0;
    resetLoaderProgress();
    modelLoader.classList.add("is-visible");
    loaderFrame = requestAnimationFrame(runLoaderProgress);
  } else {
    displayedLoadProgress = 1;
    paintLoaderProgress(1);
    modelLoader.classList.remove("is-visible");
  }
}

function prefetchModelAsset(skin) {
  if (!skin || prefetchedAssets.has(skin.asset)) {
    return;
  }

  prefetchedAssets.add(skin.asset);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
  link.href = skin.asset;
  link.crossOrigin = "anonymous";
  document.head.append(link);
}

function prefetchNeighborSkins(skin) {
  const index = viewerCatalog.skins.findIndex((entry) => entry.id === skin.id);

  if (index < 0) {
    return;
  }

  const queuePrefetch = () => {
    prefetchModelAsset(viewerCatalog.skins[index + 1]);
    prefetchModelAsset(viewerCatalog.skins[index - 1]);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(queuePrefetch, { timeout: 1800 });
  } else {
    window.setTimeout(queuePrefetch, 450);
  }
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
  const isStableIdle = (name) => {
    const normalized = normalizeAnimationName(name);
    return (
      categoryForAnimation(name) === "Idle" &&
      !/(^|[._\-\s])(idle_in|idle_out|.*_in|.*_out|.*_to_|to_.*)([._\-\s]|$)/.test(normalized) &&
      !/(stealth|campfire)/.test(normalized)
    );
  };

  return (
    names.find((name) => /(^|[._\-\s])idle\d*_base([._\-\s.]|$)/i.test(name)) ||
    names.find(isStableIdle) ||
    names.find((name) => /idle/i.test(name)) ||
    names[0] ||
    ""
  );
}

function syncPlayButton() {
  playToggle.textContent = model.paused ? "Play" : "Pause";
}

function isAdditionalModelMaterial(name) {
  return /^(mushroom|harmonica|recall_|teemo_recall_|teemo_joke)|discoball|boombox|boogie/i.test(name);
}

function hideAdditionalModelMaterials() {
  if (!model.model) {
    return [];
  }

  const hiddenMaterials = [];

  model.model.materials.forEach((material) => {
    if (!isAdditionalModelMaterial(material.name)) {
      return;
    }

    material.setAlphaMode("BLEND");
    material.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0]);
    hiddenMaterials.push(material.name);
  });

  return hiddenMaterials;
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

function syncAnimationDuration() {
  activeAnimationDuration = model.duration || 0;
  animationTime.max = activeAnimationDuration > 0 ? String(Math.round(activeAnimationDuration * 1000)) : "0";
}

function updateSkinDetails(skin) {
  title.textContent = skin.name;
  skinSelect.value = skin.id;
  skinArt.src = `${viewerCatalog.artBaseUrl}/${viewerCatalog.champion}_${skin.num}.jpg`;
  skinArt.alt = `${skin.name} artwork`;
  currentSkinName.textContent = skin.name;
  currentSkinMeta.textContent = `Skin ${skin.id} - ${formatBytes(skin.size)} GLB`;
  model.alt = `${skin.name} 3D model`;
}

function selectSkin(skinId) {
  if (isModelLoading) {
    return;
  }

  const nextSkin = viewerCatalog.skins.find((skin) => skin.id === skinId) || viewerCatalog.skins[0];
  activeSkin = nextSkin;

  model.pause();
  model.animationName = "";
  progressFill.style.transform = "scaleX(0)";
  setModelLoading(true, `Loading ${nextSkin.name}...`);
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
  model.currentTime = 0;
  syncAnimationDuration();
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
  measuredLoadProgress = Math.max(measuredLoadProgress, progress);
});

model.addEventListener("load", () => {
  stopLoaderProgress();
  paintLoaderProgress(1);
  progressFill.style.transform = "scaleX(1)";
  setStatus("Ready");
  updateSkinDetails(activeSkin);
  hideAdditionalModelMaterials();
  applyDefaultCamera();
  populateAnimations();
  prefetchNeighborSkins(activeSkin);
  window.setTimeout(() => {
    setModelLoading(false);
  }, 180);
});

model.addEventListener("error", () => {
  setModelLoading(false);
  setStatus("Model failed");
  resetAnimationControls("Model failed");
});

skinSelect.addEventListener("change", () => {
  selectSkin(skinSelect.value);
});

animationSelect.addEventListener("change", () => {
  model.animationName = animationSelect.value;
  model.currentTime = 0;
  syncAnimationDuration();
  animationTime.value = "0";
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
  if (!activeAnimationDuration) {
    return;
  }

  model.currentTime = Math.min(Number(animationTime.value) / 1000, activeAnimationDuration);
});

function updateTimeControls() {
  syncAnimationDuration();
  const duration = activeAnimationDuration;
  const currentTime = model.currentTime || 0;

  if (duration > 0 && !animationTime.matches(":active")) {
    animationTime.value = String(Math.min(Math.round(currentTime * 1000), Number(animationTime.max)));
  }

  animationTimeLabel.textContent = `${formatSeconds(currentTime)} / ${formatSeconds(duration)}`;
  syncPlayButton();
  requestAnimationFrame(updateTimeControls);
}

populateSkins();
selectSkin(viewerCatalog.skins[0].id);
updateTimeControls();

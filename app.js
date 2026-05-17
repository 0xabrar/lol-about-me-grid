const filters = [
  { label: "All", test: () => true },
  { label: "Top", test: (champion) => champion.positions.includes("Top") },
  { label: "Jungle", test: (champion) => champion.positions.includes("Jungle") },
  { label: "Mid", test: (champion) => champion.positions.includes("Mid") },
  { label: "Bot", test: (champion) => champion.positions.includes("Bot") },
  { label: "Support", test: (champion) => champion.positions.includes("Support") },
];

const slots = [
  { id: "first-main", label: "First Main" },
  { id: "current-main", label: "Current Main" },
  { id: "favorite-champ", label: "Favorite Champ" },
  { id: "most-hated", label: "Most Hated Champ" },
  { id: "favorite-skin", label: "Favorite Skin" },
  { id: "perma-ban", label: "Perma-ban" },
  { id: "unexpected-favorite", label: "Unexpected Favorite" },
  { id: "pocket-pick", label: "Pocket Pick" },
  { id: "best-designed", label: "Best Designed" },
  { id: "worst-designed", label: "Worst Designed" },
  { id: "highest-mastery", label: "Highest Mastery" },
  { id: "want-to-learn", label: "Want to Learn" },
  { id: "comfort-pick", label: "Comfort Pick" },
  { id: "guilty-pleasure", label: "Guilty Pleasure" },
  { id: "needs-rework", label: "Needs a Rework" },
  { id: "good-design-bad-gameplay", label: "Good Design / Bad Gameplay" },
  { id: "bad-design-good-gameplay", label: "Bad Design / Good Gameplay" },
  { id: "wants-to-be-good", label: "Wants to be Good at but Can't" },
];

const state = {
  champions: Array.isArray(window.CHAMPIONS) ? window.CHAMPIONS : [],
  version: window.CHAMPION_DATA_VERSION || "bundled",
  selectedSlotId: slots[0].id,
  activeFilter: "All",
  search: "",
  picks: {},
};

const shareAlphabet = "0123456789abcdefghjkmnpqrstvwxyz";

const elements = {
  championCount: document.querySelector("#champion-count"),
  championList: document.querySelector("#champion-list"),
  championSearch: document.querySelector("#champion-search"),
  championFilters: document.querySelector("#champion-filters"),
  profileGrid: document.querySelector("#profile-grid"),
  selectedSlotName: document.querySelector("#selected-slot-name"),
  progressCount: document.querySelector("#progress-count"),
  clearSlot: document.querySelector("#clear-slot"),
  copyLink: document.querySelector("#copy-link"),
  exportPng: document.querySelector("#export-png"),
  toast: document.querySelector("#toast"),
};

function championImageUrl(champion) {
  return champion.image;
}

function showToast(message, champion = null, detail = "") {
  elements.toast.textContent = "";

  if (champion) {
    const portrait = document.createElement("img");
    portrait.className = "toast-portrait";
    portrait.src = championImageUrl(champion);
    portrait.alt = "";
    elements.toast.append(portrait);
  }

  const copy = document.createElement("div");
  copy.className = "toast-copy";

  const title = document.createElement("span");
  title.className = "toast-title";
  title.textContent = message;
  copy.append(title);

  if (detail) {
    const meta = document.createElement("span");
    meta.className = "toast-meta";
    meta.textContent = detail;
    copy.append(meta);
  }

  elements.toast.append(copy);

  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 1500);
}

function selectedSlot() {
  return slots.find((slot) => slot.id === state.selectedSlotId) || slots[0];
}

function championById(id) {
  return state.champions.find((champion) => champion.id === id);
}

function championIndexById(id) {
  return state.champions.findIndex((champion) => champion.id === id);
}

function obfuscationByte(index) {
  let value = (index + 1) * 1103515245 + 12345;
  value ^= value >>> 16;
  value = Math.imul(value, 2246822519);
  value ^= value >>> 13;
  return value & 255;
}

function obfuscateBytes(bytes) {
  return bytes.map((byte, index) => byte ^ obfuscationByte(index));
}

function deobfuscateBytes(bytes) {
  return obfuscateBytes(bytes);
}

function groupCode(value) {
  return value;
}

function toFriendlyCode(bytes) {
  if (shareAlphabet.length !== 32) {
    throw new Error("Share alphabet must contain exactly 32 characters");
  }

  let buffer = 0;
  let bits = 0;
  let output = "";

  bytes.forEach((byte) => {
    buffer = (buffer << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += shareAlphabet[(buffer >> (bits - 5)) & 31];
      bits -= 5;
    }
  });

  if (bits > 0) {
    output += shareAlphabet[(buffer << (5 - bits)) & 31];
  }

  return groupCode(output);
}

function fromFriendlyCode(value) {
  if (shareAlphabet.length !== 32) {
    throw new Error("Share alphabet must contain exactly 32 characters");
  }

  const cleanValue = value.toLowerCase().replace(/-/g, "");
  let buffer = 0;
  let bits = 0;
  const bytes = [];

  for (const char of cleanValue) {
    const index = shareAlphabet.indexOf(char);
    if (index === -1) {
      throw new Error("Unknown share code character");
    }

    buffer = (buffer << 5) | index;
    bits += 5;

    while (bits >= 8 && bytes.length < slots.length) {
      bytes.push((buffer >> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  if (bytes.length < slots.length) {
    throw new Error("Share code is too short");
  }

  return Uint8Array.from(bytes.slice(0, slots.length));
}

function fromLegacyBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function encodePicks() {
  const bytes = slots.map((slot) => {
    const championId = state.picks[slot.id];
    if (!championId) {
      return 0;
    }

    const index = championIndexById(championId);
    return index >= 0 ? index + 1 : 0;
  });

  return toFriendlyCode(obfuscateBytes(bytes));
}

function decodePicks(value) {
  state.picks = {};

  try {
    let bytes;
    try {
      bytes = deobfuscateBytes(fromFriendlyCode(value));
    } catch {
      bytes = fromLegacyBase64Url(value);
    }

    slots.forEach((slot, index) => {
      const championIndex = bytes[index] - 1;
      if (championIndex >= 0 && state.champions[championIndex]) {
        state.picks[slot.id] = state.champions[championIndex].id;
      }
    });
  } catch {
    state.picks = {};
  }
}

function decodeLegacyPicks(value) {
  state.picks = {};
  const ids = value.split(".");
  slots.forEach((slot, index) => {
    const championId = ids[index];
    if (championId && championById(championId)) {
      state.picks[slot.id] = championId;
    }
  });
}

function shareUrl() {
  const encoded = encodePicks();
  const hasPicks = slots.some((slot) => state.picks[slot.id]);
  return hasPicks ? `${location.origin}/g/${encoded}` : `${location.origin}/`;
}

function saveState({ updateHash = true } = {}) {
  localStorage.setItem("lol-about-me-grid", JSON.stringify(state.picks));
  if (updateHash) {
    history.replaceState(null, "", shareUrl());
  }
}

function loadState() {
  const pathMatch = location.pathname.match(/^\/g\/([^/]+)\/?$/);
  if (pathMatch) {
    decodePicks(pathMatch[1]);
    saveState({ updateHash: true });
    return;
  }

  const rawHash = location.hash.replace(/^#/, "");
  const hashParams = new URLSearchParams(rawHash);
  const compactGrid = hashParams.get("g");
  if (compactGrid) {
    decodePicks(compactGrid);
    return;
  }

  const legacyGrid = hashParams.get("grid");
  if (legacyGrid) {
    decodeLegacyPicks(legacyGrid);
    return;
  }

  if (rawHash) {
    decodePicks(rawHash);
    return;
  }

  try {
    state.picks = JSON.parse(localStorage.getItem("lol-about-me-grid") || "{}");
  } catch {
    state.picks = {};
  }
}

function renderChampionFilters() {
  elements.championFilters.innerHTML = "";
  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `champion-filter${state.activeFilter === filter.label ? " is-active" : ""}`;
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      state.activeFilter = filter.label;
      renderChampionFilters();
      renderChampionList();
    });
    elements.championFilters.append(button);
  });
}

function visibleChampions() {
  const query = state.search.trim().toLowerCase();
  const activeFilter = filters.find((filter) => filter.label === state.activeFilter) || filters[0];
  return state.champions.filter((champion) => {
    const matchesFilter = activeFilter.test(champion);
    const matchesSearch = !query || champion.name.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
}

function pickCounts() {
  const counts = {};
  Object.values(state.picks).forEach((id) => {
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}

function applyPickedBadge(tile, count) {
  tile.classList.toggle("is-picked", count > 0);
  let badge = tile.querySelector(".tile-count");
  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "tile-count";
      tile.append(badge);
    }
    badge.textContent = String(count);
  } else if (badge) {
    badge.remove();
  }
}

function updatePickedBadges() {
  const counts = pickCounts();
  elements.championList.querySelectorAll(".champion-tile").forEach((tile) => {
    applyPickedBadge(tile, counts[tile.dataset.championId] || 0);
  });
}

function renderChampionList() {
  const champions = visibleChampions();
  const counts = pickCounts();
  elements.championList.replaceChildren();

  if (!champions.length) {
    const empty = document.createElement("div");
    empty.className = "champion-empty";
    empty.innerHTML = `
      <strong>No champions found</strong>
      <span>Try a different search or position.</span>
    `;
    elements.championList.append(empty);
    return;
  }

  champions.forEach((champion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "champion-tile";
    button.title = `Place ${champion.name} in ${selectedSlot().label}`;
    button.dataset.championId = champion.id;
    button.innerHTML = `
      <img src="${championImageUrl(champion)}" alt="">
      <span>${champion.name}</span>
    `;
    applyPickedBadge(button, counts[champion.id] || 0);
    button.addEventListener("click", () => {
      state.picks[state.selectedSlotId] = champion.id;
      saveState();
      renderGrid();
      showToast(champion.name, champion, `Placed in ${selectedSlot().label}`);
    });
    elements.championList.append(button);
  });
}

function renderGrid() {
  elements.profileGrid.innerHTML = "";
  elements.selectedSlotName.textContent = selectedSlot().label;
  elements.progressCount.textContent = slots.filter((slot) => state.picks[slot.id]).length;
  updatePickedBadges();

  slots.forEach((slot) => {
    const champion = championById(state.picks[slot.id]);
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "grid-slot",
      state.selectedSlotId === slot.id ? "is-selected" : "",
      champion ? "has-champion" : "",
    ].filter(Boolean).join(" ");
    button.setAttribute("aria-label", `${slot.label}${champion ? `: ${champion.name}` : ": empty"}`);
    button.innerHTML = `
      <div class="slot-art">
        ${
          champion
            ? `<img src="${championImageUrl(champion)}" alt=""><span class="slot-champion-name">${champion.name}</span>`
            : `<span class="empty-text">Click to Add</span>`
        }
      </div>
      <div class="slot-label">${slot.label}</div>
    `;
    button.addEventListener("click", () => {
      state.selectedSlotId = slot.id;
      renderGrid();
    });
    elements.profileGrid.append(button);
  });
}

function canvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });

  if (line) {
    lines.push(line);
  }

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, startY + index * lineHeight);
  });
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function exportGridPng() {
  const scale = 2;
  const width = 1800;
  const titleHeight = 132;
  const columns = 6;
  const rows = Math.ceil(slots.length / columns);
  const cellWidth = width / columns;
  const imageHeight = cellWidth;
  const labelHeight = 64;
  const cellHeight = imageHeight + labelHeight;
  const height = titleHeight + rows * cellHeight;
  const artPadding = 18;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#080b10");
  gradient.addColorStop(0.52, "#111821");
  gradient.addColorStop(1, "#050607");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#f4efe3";
  ctx.font = "900 46px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("About Me: League of Legends", width / 2, 58);

  ctx.strokeStyle = "rgba(200, 155, 60, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, titleHeight - 12);
  ctx.lineTo(width - 44, titleHeight - 12);
  ctx.stroke();

  const imageCache = new Map();
  for (const championId of Object.values(state.picks)) {
    const champion = championById(championId);
    if (champion && !imageCache.has(champion.id)) {
      imageCache.set(champion.id, await loadCanvasImage(championImageUrl(champion)));
    }
  }

  slots.forEach((slot, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = col * cellWidth;
    const y = titleHeight + row * cellHeight;
    const champion = championById(state.picks[slot.id]);
    const artX = x;
    const artY = y;
    const imageX = artX + artPadding;
    const imageY = artY + artPadding;
    const imageSize = cellWidth - artPadding * 2;

    ctx.fillStyle = champion ? "#07090d" : "#303a47";
    ctx.fillRect(artX, artY, cellWidth, imageHeight);

    if (champion) {
      const image = imageCache.get(champion.id);
      const size = Math.min(image.width, image.height);
      const sourceX = (image.width - size) / 2;
      const sourceY = (image.height - size) / 2;
      ctx.drawImage(image, sourceX, sourceY, size, size, imageX, imageY, imageSize, imageSize);

      ctx.font = "900 16px Trebuchet MS, sans-serif";
      const chipWidth = Math.min(imageSize - 12, ctx.measureText(champion.name).width + 26);
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.fillRect(imageX + 8, imageY + 8, chipWidth, 30);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(champion.name, imageX + 21, imageY + 28);
    } else {
      ctx.fillStyle = "#d1d8df";
      ctx.font = "900 26px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Click to Add", artX + cellWidth / 2, artY + imageHeight / 2);
    }

    ctx.fillStyle = "rgba(5, 6, 8, 0.96)";
    ctx.fillRect(x, y + imageHeight, cellWidth, labelHeight);
    ctx.fillStyle = "#fffaf0";
    ctx.font = "900 20px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    canvasText(ctx, slot.label, x + cellWidth / 2, y + imageHeight + labelHeight / 2, cellWidth - 28, 21);

    ctx.strokeStyle = "#050607";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
  });

  const link = document.createElement("a");
  link.download = "league-about-me-grid.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function bindEvents() {
  elements.championSearch.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderChampionList();
  });

  elements.clearSlot.addEventListener("click", () => {
    delete state.picks[state.selectedSlotId];
    saveState();
    renderGrid();
    showToast(`${selectedSlot().label} cleared.`);
  });

  elements.copyLink.addEventListener("click", async () => {
    saveState();
    await navigator.clipboard.writeText(shareUrl());
    showToast("Share link copied.");
  });

  elements.exportPng.addEventListener("click", async () => {
    elements.exportPng.disabled = true;
    elements.exportPng.textContent = "Exporting...";
    try {
      await exportGridPng();
      showToast("PNG exported.");
    } catch (error) {
      console.error(error);
      showToast("Export failed. Try again after portraits finish loading.");
    } finally {
      elements.exportPng.disabled = false;
      elements.exportPng.textContent = "Export PNG";
    }
  });
}

function init() {
  bindEvents();
  renderChampionFilters();
  loadState();
  elements.championCount.textContent = `${state.champions.length} champions`;
  renderGrid();
  renderChampionList();
}

init();

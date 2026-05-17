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

const championsById = new Map(state.champions.map((champion) => [champion.id, champion]));
const championIndexesById = new Map(
  state.champions.map((champion, index) => [champion.id, index])
);
const slotsById = new Map(slots.map((slot) => [slot.id, slot]));

const shareAlphabet = "0123456789abcdefghjkmnpqrstvwxyz";

const elements = {
  championCount: document.querySelector("#champion-count"),
  championList: document.querySelector("#champion-list"),
  championSearch: document.querySelector("#champion-search"),
  championFilters: document.querySelector("#champion-filters"),
  profileGrid: document.querySelector("#profile-grid"),
  progressCount: document.querySelector("#progress-count"),
  copyLink: document.querySelector("#copy-link"),
  copyImage: document.querySelector("#copy-image"),
  toast: document.querySelector("#toast"),
};

function championImageUrl(champion) {
  return champion.image;
}

let toastPreviewUrl = "";

function clearToastPreviewUrl() {
  if (toastPreviewUrl) {
    URL.revokeObjectURL(toastPreviewUrl);
    toastPreviewUrl = "";
  }
}

function showToast(message, champion = null, detail = "") {
  clearToastPreviewUrl();
  elements.toast.textContent = "";
  elements.toast.classList.remove("has-preview");

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

function showClipboardPreviewToast(previewUrl) {
  clearToastPreviewUrl();
  toastPreviewUrl = previewUrl;
  elements.toast.textContent = "";

  const preview = document.createElement("img");
  preview.className = "toast-preview";
  preview.src = previewUrl;
  preview.alt = "";
  elements.toast.append(preview);

  const copy = document.createElement("div");
  copy.className = "toast-copy";

  const title = document.createElement("span");
  title.className = "toast-title";
  title.textContent = "Grid copied";
  copy.append(title);

  const meta = document.createElement("span");
  meta.className = "toast-meta";
  meta.textContent = "Ready to paste as an image.";
  copy.append(meta);

  elements.toast.append(copy);

  elements.toast.classList.add("is-visible", "has-preview");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible", "has-preview");
    clearToastPreviewUrl();
  }, 2400);
}

const actionFeedbackTimers = new WeakMap();

function defaultButtonLabel(button) {
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent.trim();
  }

  return button.dataset.defaultLabel;
}

function clearActionFeedback(button) {
  const timeout = actionFeedbackTimers.get(button);
  if (timeout) {
    window.clearTimeout(timeout);
    actionFeedbackTimers.delete(button);
  }
}

function restoreActionButton(button) {
  button.disabled = false;
  button.classList.remove("is-confirmed");
  button.textContent = defaultButtonLabel(button);
  button.removeAttribute("aria-label");
}

function setActionButtonBusy(button, label) {
  defaultButtonLabel(button);
  clearActionFeedback(button);
  button.classList.remove("is-confirmed");
  button.removeAttribute("aria-label");
  button.disabled = true;
  button.textContent = label;
}

function showActionSuccess(button, successLabel, accessibleLabel) {
  defaultButtonLabel(button);
  clearActionFeedback(button);
  button.disabled = false;
  button.textContent = successLabel;
  button.setAttribute("aria-label", accessibleLabel || successLabel);
  button.classList.add("is-confirmed");

  const timeout = window.setTimeout(() => {
    button.classList.remove("is-confirmed");
    button.removeAttribute("aria-label");
    button.textContent = button.dataset.defaultLabel || button.textContent;
    actionFeedbackTimers.delete(button);
  }, 1500);

  actionFeedbackTimers.set(button, timeout);
}

function selectedSlot() {
  return slotsById.get(state.selectedSlotId) || slots[0];
}

function championById(id) {
  return championsById.get(id);
}

function championIndexById(id) {
  return championIndexesById.has(id) ? championIndexesById.get(id) : -1;
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
  const fragment = document.createDocumentFragment();
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
    fragment.append(button);
  });
  elements.championFilters.replaceChildren(fragment);
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

function placeChampion(championId) {
  const champion = championById(championId);
  if (!champion) return;

  const slot = selectedSlot();
  state.picks[state.selectedSlotId] = champion.id;
  saveState();
  renderGrid();
  showToast(champion.name, champion, `Placed in ${slot.label}`);
}

function selectGridSlot(slotId) {
  if (!slotsById.has(slotId)) return;

  state.selectedSlotId = slotId;
  renderGrid();
  const newSelected = elements.profileGrid.querySelector(
    ".grid-slot.is-selected.has-champion"
  );
  newSelected?.classList.add("just-selected");
}

function clearGridSlot(slotId) {
  const slot = slotsById.get(slotId);
  if (!slot) return;

  delete state.picks[slot.id];
  saveState();
  renderGrid();
  showToast(slot.label, null, "Slot cleared");
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

  const fragment = document.createDocumentFragment();
  champions.forEach((champion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "champion-tile";
    button.title = `Place ${champion.name} in ${selectedSlot().label}`;
    button.dataset.championId = champion.id;
    button.innerHTML = `
      <img src="${championImageUrl(champion)}" alt="" loading="lazy" decoding="async" width="120" height="120">
      <span class="champion-name">${champion.name}</span>
    `;
    applyPickedBadge(button, counts[champion.id] || 0);
    fragment.append(button);
  });
  elements.championList.append(fragment);
}

function renderGrid() {
  elements.progressCount.textContent = slots.filter((slot) => state.picks[slot.id]).length;
  updatePickedBadges();
  const fragment = document.createDocumentFragment();

  slots.forEach((slot) => {
    const champion = championById(state.picks[slot.id]);
    const cell = document.createElement("div");
    cell.className = [
      "grid-slot",
      state.selectedSlotId === slot.id ? "is-selected" : "",
      champion ? "has-champion" : "",
    ].filter(Boolean).join(" ");
    cell.setAttribute("role", "button");
    cell.tabIndex = 0;
    cell.dataset.slotId = slot.id;
    cell.setAttribute("aria-label", `${slot.label}${champion ? `: ${champion.name}` : ": empty"}`);
    cell.innerHTML = `
      <div class="slot-art">
        ${
          champion
            ? `<img src="${championImageUrl(champion)}" alt="" decoding="async" width="240" height="240">
              <span class="slot-champion-name">${champion.name}</span>
              ${
                state.selectedSlotId === slot.id
                  ? `<button class="slot-clear" type="button" aria-label="Clear ${slot.label}" title="Clear ${slot.label}">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 3h6l1 2h4v2H4V5h4l1-2Z"></path>
                        <path d="M6 9h12l-1 11H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"></path>
                      </svg>
                    </button>`
                  : ""
              }`
            : `<span class="empty-text">Click to add</span>`
        }
      </div>
      <div class="slot-label">
        <span>${slot.label}</span>
      </div>
    `;

    fragment.append(cell);
  });
  elements.profileGrid.replaceChildren(fragment);
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

const canvasFontFamilies = {
  display: "'Marcellus', Optima, Georgia, serif",
  ui: "'Source Sans 3', 'Segoe UI', sans-serif",
};

const clipboardImage = {
  width: 1200,
  titleHeight: 88,
  columns: 6,
  labelHeight: 44,
  artPadding: 12,
};

function canvasFont(weight, size, family = canvasFontFamilies.ui) {
  return `${weight} ${size}px ${family}`;
}

async function createGridPng() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const width = clipboardImage.width;
  const titleHeight = clipboardImage.titleHeight;
  const columns = clipboardImage.columns;
  const rows = Math.ceil(slots.length / columns);
  const cellWidth = width / columns;
  const imageHeight = cellWidth;
  const labelHeight = clipboardImage.labelHeight;
  const cellHeight = imageHeight + labelHeight;
  const height = titleHeight + rows * cellHeight;
  const artPadding = clipboardImage.artPadding;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#080b10");
  gradient.addColorStop(0.52, "#111821");
  gradient.addColorStop(1, "#050607");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#f4efe3";
  ctx.font = canvasFont(400, 34, canvasFontFamilies.display);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("About Me: League of Legends", width / 2, 38);

  ctx.strokeStyle = "rgba(200, 155, 60, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, titleHeight - 8);
  ctx.lineTo(width - 30, titleHeight - 8);
  ctx.stroke();

  const imageCache = new Map();
  const championIds = [...new Set(Object.values(state.picks).filter(Boolean))];
  await Promise.all(championIds.map(async (championId) => {
    const champion = championById(championId);
    if (champion && !imageCache.has(champion.id)) {
      imageCache.set(champion.id, await loadCanvasImage(championImageUrl(champion)));
    }
  }));

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

      ctx.font = canvasFont(700, 12);
      const chipWidth = Math.min(imageSize - 8, ctx.measureText(champion.name).width + 18);
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.fillRect(imageX + 6, imageY + 6, chipWidth, 21);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(champion.name, imageX + 15, imageY + 20);
    } else {
      ctx.fillStyle = "#d1d8df";
      ctx.font = canvasFont(700, 17);
      ctx.textAlign = "center";
      ctx.fillText("Click to add", artX + cellWidth / 2, artY + imageHeight / 2);
    }

    ctx.fillStyle = "rgba(5, 6, 8, 0.96)";
    ctx.fillRect(x, y + imageHeight, cellWidth, labelHeight);
    ctx.fillStyle = "#fffaf0";
    ctx.font = canvasFont(700, 14);
    ctx.textAlign = "center";
    canvasText(ctx, slot.label, x + cellWidth / 2, y + imageHeight + labelHeight / 2, cellWidth - 20, 15);

    ctx.strokeStyle = "#050607";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
  });

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Could not export PNG"));
      }
    }, "image/png");
  });

  return {
    blob,
  };
}

async function copyGridImageToClipboard() {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Image clipboard is not supported in this browser");
  }

  const imagePromise = createGridPng();
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": imagePromise.then((image) => image.blob),
    }),
  ]);

  const image = await imagePromise;
  return {
    blob: image.blob,
    previewUrl: URL.createObjectURL(image.blob),
  };
}

function bindEvents() {
  elements.championList.addEventListener("click", (event) => {
    const tile = event.target.closest(".champion-tile");
    if (!tile || !elements.championList.contains(tile)) return;
    placeChampion(tile.dataset.championId);
  });

  elements.profileGrid.addEventListener("click", (event) => {
    const cell = event.target.closest(".grid-slot");
    if (!cell || !elements.profileGrid.contains(cell)) return;

    if (event.target.closest(".slot-clear")) {
      clearGridSlot(cell.dataset.slotId);
      return;
    }

    selectGridSlot(cell.dataset.slotId);
  });

  elements.profileGrid.addEventListener("keydown", (event) => {
    if (event.target.closest(".slot-clear")) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    const cell = event.target.closest(".grid-slot");
    if (!cell || !elements.profileGrid.contains(cell)) return;

    event.preventDefault();
    selectGridSlot(cell.dataset.slotId);
  });

  elements.championSearch.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderChampionList();
  });

  elements.copyLink.addEventListener("click", async () => {
    try {
      saveState();
      await navigator.clipboard.writeText(shareUrl());
      showActionSuccess(elements.copyLink, "Copied", "Share link copied");
    } catch (error) {
      console.error(error);
      restoreActionButton(elements.copyLink);
      showToast("Copy failed. Try again from your browser.");
    }
  });

  elements.copyImage.addEventListener("click", async () => {
    setActionButtonBusy(elements.copyImage, "Copying...");
    try {
      const image = await copyGridImageToClipboard();
      showActionSuccess(elements.copyImage, "Copied", "Grid image copied");
      showClipboardPreviewToast(image.previewUrl);
    } catch (error) {
      console.error(error);
      restoreActionButton(elements.copyImage);
      showToast("Copy image failed. Try again after portraits finish loading.");
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

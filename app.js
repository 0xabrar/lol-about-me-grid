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

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2400);
}

function selectedSlot() {
  return slots.find((slot) => slot.id === state.selectedSlotId) || slots[0];
}

function championById(id) {
  return state.champions.find((champion) => champion.id === id);
}

function encodePicks() {
  return slots.map((slot) => state.picks[slot.id] || "").join(".");
}

function decodePicks(value) {
  const ids = value.split(".");
  state.picks = {};
  slots.forEach((slot, index) => {
    if (ids[index]) {
      state.picks[slot.id] = ids[index];
    }
  });
}

function saveState({ updateHash = true } = {}) {
  localStorage.setItem("lol-about-me-grid", JSON.stringify(state.picks));
  if (updateHash) {
    const encoded = encodePicks();
    const hash = encoded.replace(/\./g, "") ? `grid=${encodeURIComponent(encoded)}` : "";
    history.replaceState(null, "", hash ? `#${hash}` : location.pathname + location.search);
  }
}

function loadState() {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  const sharedGrid = hashParams.get("grid");
  if (sharedGrid) {
    decodePicks(sharedGrid);
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

function renderChampionList() {
  const champions = visibleChampions();
  elements.championList.innerHTML = "";

  if (!champions.length) {
    const empty = document.createElement("p");
    empty.className = "panel-meta";
    empty.textContent = "No champions match that search.";
    elements.championList.append(empty);
    return;
  }

  champions.forEach((champion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "champion-tile";
    button.title = `Place ${champion.name} in ${selectedSlot().label}`;
    button.innerHTML = `
      <img src="${championImageUrl(champion)}" alt="">
      <span>${champion.name}</span>
    `;
    button.addEventListener("click", () => {
      state.picks[state.selectedSlotId] = champion.id;
      saveState();
      renderGrid();
      showToast(`${champion.name} added to ${selectedSlot().label}.`);
    });
    elements.championList.append(button);
  });
}

function renderGrid() {
  elements.profileGrid.innerHTML = "";
  elements.selectedSlotName.textContent = selectedSlot().label;
  elements.progressCount.textContent = slots.filter((slot) => state.picks[slot.id]).length;

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
      renderChampionList();
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
  const width = 1440;
  const titleHeight = 116;
  const columns = 6;
  const rows = Math.ceil(slots.length / columns);
  const cellWidth = width / columns;
  const imageHeight = 196;
  const labelHeight = 56;
  const cellHeight = imageHeight + labelHeight;
  const height = titleHeight + rows * cellHeight;

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

    ctx.fillStyle = champion ? "#07090d" : "#303a47";
    ctx.fillRect(x, y, cellWidth, imageHeight);

    if (champion) {
      const image = imageCache.get(champion.id);
      const size = Math.min(image.width, image.height);
      const sourceX = (image.width - size) / 2;
      const sourceY = (image.height - size) / 2;
      ctx.drawImage(image, sourceX, sourceY, size, size, x, y, cellWidth, imageHeight);

      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.fillRect(x + 8, y + 8, Math.min(cellWidth - 16, ctx.measureText(champion.name).width + 24), 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 14px Trebuchet MS, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(champion.name, x + 20, y + 27);
    } else {
      ctx.fillStyle = "#d1d8df";
      ctx.font = "900 22px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Click to Add", x + cellWidth / 2, y + imageHeight / 2);
    }

    ctx.fillStyle = "rgba(5, 6, 8, 0.96)";
    ctx.fillRect(x, y + imageHeight, cellWidth, labelHeight);
    ctx.fillStyle = "#fffaf0";
    ctx.font = "900 18px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    canvasText(ctx, slot.label, x + cellWidth / 2, y + imageHeight + labelHeight / 2, cellWidth - 22, 18);

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
    await navigator.clipboard.writeText(location.href);
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

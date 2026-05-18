const fields = [
  "Win delta vs baseline",
  "Gold / XP / CS at 15",
  "Kills, deaths, damage",
  "Role, region, patch",
  "Runes and items"
];

const elements = {
  lane: document.querySelector("#lane-select"),
  select: document.querySelector("#target-select"),
  title: document.querySelector("#board-title"),
  status: document.querySelector("#data-status"),
  list: document.querySelector("#counter-list"),
  fields: document.querySelector("#available-fields")
};

let payload = null;

const laneLabels = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support"
};

function signed(value, suffix = "") {
  const number = Number(value) || 0;
  const sign = number > 0 ? "+" : "";
  return `${sign}${number}${suffix}`;
}

function tone(value) {
  return Number(value) >= 0 ? "positive" : "negative";
}

function matchupType(row) {
  if (row.type) return row.type;
  if (row.laneScore >= 68 && row.gameScore < 64) return "Lane Bully";
  if (row.laneScore < 45 && row.gameScore >= 70) return "Scaling Counter";
  if (row.laneScore >= 60 && row.gameScore >= 68) return "Complete Counter";
  if (row.laneScore >= 54) return "Stability Pick";
  return "Thin Sample";
}

function lanes(matchups) {
  const order = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
  const present = new Set(matchups.map((row) => row.lane || "MIDDLE"));
  return order.filter((lane) => present.has(lane));
}

function targetChampions(matchups, lane) {
  return [
    ...new Set(
      matchups
        .filter((row) => (row.lane || "MIDDLE") === lane)
        .map((row) => row.opponent)
    )
  ].sort((a, b) => a.localeCompare(b));
}

function renderFields() {
  elements.fields.innerHTML = fields.map((field) => `<li>${field}</li>`).join("");
}

function renderLaneSelect() {
  const available = lanes(payload.matchups);
  const preferred = available.includes("MIDDLE") ? "MIDDLE" : available[0];

  elements.lane.innerHTML = available
    .map((lane) => `<option value="${lane}">${laneLabels[lane] || lane}</option>`)
    .join("");
  elements.lane.value = preferred;
}

function renderSelect() {
  const targets = targetChampions(payload.matchups, elements.lane.value);
  const preferred = targets.includes("Zed") ? "Zed" : targets[0];

  elements.select.innerHTML = targets
    .map((target) => `<option value="${target}">${target}</option>`)
    .join("");
  elements.select.value = preferred;
}

function renderCounters() {
  const lane = elements.lane.value;
  const target = elements.select.value;
  const rows = payload.matchups
    .filter((row) => (row.lane || "MIDDLE") === lane && row.opponent === target)
    .sort((a, b) => b.counterScore - a.counterScore);

  elements.title.textContent = `Best ${laneLabels[lane] || lane} counters into ${target}`;

  if (!rows.length) {
    elements.list.innerHTML = `
      <article class="counter-card">
        <div class="champion-pair">
          <div class="champion-name">No sample yet</div>
          <span class="counter-type">Needs data</span>
        </div>
        <p class="read">
          Run the data builder against GPTilt or local Riot matches to populate this champion.
        </p>
      </article>
    `;
    return;
  }

  elements.list.innerHTML = rows
    .map((row) => {
      const gold15 = row.gold15Delta ?? row.finalGoldDeltaVsBaseline ?? 0;
      const xp15 = row.xp15Delta ?? row.finalXpDeltaVsBaseline ?? 0;
      const cs15 = row.cs15Delta ?? row.finalCsDeltaVsBaseline ?? 0;
      const sample = row.sample ?? row.sampleSize ?? 0;

      return `
        <article class="counter-card">
          <div class="champion-pair">
            <div>
              <div class="champion-name">${row.champion}</div>
              <div class="counter-type">${laneLabels[row.lane] || row.lane || "Mid"} · ${matchupType(row)}</div>
            </div>
            <div class="metric">
              <b>${sample}</b>
              <span>sample games</span>
            </div>
          </div>

          <div class="score-block">
            <div class="score-ring">${row.counterScore}</div>
            <p class="read">${row.read || "Ranked by baseline-adjusted lane and game deltas."}</p>
          </div>

          <div class="metric-grid">
            <div class="metric">
              <b class="${tone(row.winDelta)}">${signed(row.winDelta, "%")}</b>
              <span>win delta</span>
            </div>
            <div class="metric">
              <b class="${tone(gold15)}">${signed(gold15)}</b>
              <span>gold delta</span>
            </div>
            <div class="metric">
              <b class="${tone(xp15)}">${signed(xp15)}</b>
              <span>XP delta</span>
            </div>
            <div class="metric">
              <b class="${tone(cs15)}">${signed(cs15)}</b>
              <span>CS delta</span>
            </div>
            <div class="metric">
              <b>${row.laneScore}</b>
              <span>lane score</span>
            </div>
            <div class="metric">
              <b>${row.gameScore}</b>
              <span>game score</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadData() {
  const response = await fetch("data/generated-counter-matchups.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Counter dataset is missing. Run scripts/build-counter-sample.mjs.");
  }

  payload = await response.json();
  elements.status.textContent = "Generated GPTilt data";

  renderFields();
  renderLaneSelect();
  renderSelect();
  renderCounters();
}

elements.lane.addEventListener("change", () => {
  renderSelect();
  renderCounters();
});
elements.select.addEventListener("change", renderCounters);

loadData().catch((error) => {
  elements.status.textContent = "Data failed";
  elements.list.innerHTML = `<article class="counter-card"><p class="read">${error.message}</p></article>`;
});

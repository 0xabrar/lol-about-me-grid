import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const outputPath = resolve(root, "data/generated-counter-matchups.json");
const localDataRoot = resolve(root, ".hf-data/lol-basic-matches-challenger-10k");

const remote = "https://huggingface.co/datasets/gptilt/lol-basic-matches-challenger-10k/resolve/main";
const regions = ["region_americas", "region_asia", "region_europe"];

function parquetPaths(table) {
  if (existsSync(localDataRoot)) {
    return regions.map((region) => `${localDataRoot}/${table}/${region}-00000.parquet`);
  }

  return regions.map((region) => `${remote}/${table}/${region}-00000.parquet`);
}

function sqlList(paths) {
  return `[${paths.map((path) => `'${path.replaceAll("'", "''")}'`).join(",")}]`;
}

const participantFiles = sqlList(parquetPaths("participants"));
const eventPaths = parquetPaths("events");
const hasEventFiles = eventPaths.every((path) => existsSync(path));
const eventFiles = sqlList(eventPaths);

const sql = `
LOAD httpfs;

WITH p AS (
  SELECT *
  FROM read_parquet(${participantFiles})
  WHERE teamPosition IN ('TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY')
),
frames15 AS (
  ${
    hasEventFiles
      ? `
  SELECT
    matchId,
    participantId,
    totalGold AS gold15,
    xp AS xp15,
    minionsKilled + jungleMinionsKilled AS cs15
  FROM (
    SELECT
      matchId,
      participantId,
      totalGold,
      xp,
      minionsKilled,
      jungleMinionsKilled,
      row_number() OVER (
        PARTITION BY matchId, participantId
        ORDER BY abs(timestamp - 900000)
      ) AS frameRank
    FROM read_parquet(${eventFiles})
    WHERE type = 'PARTICIPANT_FRAME'
      AND timestamp BETWEEN 840000 AND 960000
  )
  WHERE frameRank = 1
      `
      : `
  SELECT
    matchId,
    participantId,
    NULL::BIGINT AS gold15,
    NULL::BIGINT AS xp15,
    NULL::BIGINT AS cs15
  FROM p
  WHERE false
      `
  }
),
pairs AS (
  SELECT
    a.teamPosition AS lane,
    a.championName AS champion,
    b.championName AS opponent,
    a.win AS win,
    a.goldEarned - b.goldEarned AS goldDiff,
    a.champExperience - b.champExperience AS xpDiff,
    (a.totalMinionsKilled + a.neutralMinionsKilled)
      - (b.totalMinionsKilled + b.neutralMinionsKilled) AS csDiff,
    COALESCE(af.gold15 - bf.gold15, a.goldEarned - b.goldEarned) AS gold15Diff,
    COALESCE(af.xp15 - bf.xp15, a.champExperience - b.champExperience) AS xp15Diff,
    COALESCE(af.cs15 - bf.cs15, (a.totalMinionsKilled + a.neutralMinionsKilled)
      - (b.totalMinionsKilled + b.neutralMinionsKilled)) AS cs15Diff,
    a.kills - b.kills AS killDiff,
    a.deaths - b.deaths AS deathDiff,
    a.totalDamageDealtToChampions - b.totalDamageDealtToChampions AS damageDiff
  FROM p a
  JOIN p b
    ON a.matchId = b.matchId
    AND a.teamId <> b.teamId
    AND a.teamPosition = b.teamPosition
  LEFT JOIN frames15 af
    ON a.matchId = af.matchId
    AND a.participantId = af.participantId
  LEFT JOIN frames15 bf
    ON b.matchId = bf.matchId
    AND b.participantId = bf.participantId
),
base AS (
  SELECT
    champion,
    lane,
    avg(CASE WHEN win THEN 1.0 ELSE 0.0 END) AS baseWr,
    avg(goldDiff) AS baseGold,
    avg(xpDiff) AS baseXp,
    avg(csDiff) AS baseCs,
    avg(gold15Diff) AS baseGold15,
    avg(xp15Diff) AS baseXp15,
    avg(cs15Diff) AS baseCs15,
    avg(killDiff) AS baseKill,
    avg(deathDiff) AS baseDeath,
    avg(damageDiff) AS baseDamage
  FROM pairs
  GROUP BY champion, lane
),
agg AS (
  SELECT
    lane,
    champion,
    opponent,
    count(*) AS n,
    avg(CASE WHEN win THEN 1.0 ELSE 0.0 END) AS wr,
    avg(goldDiff) AS goldDiff,
    avg(xpDiff) AS xpDiff,
    avg(csDiff) AS csDiff,
    avg(gold15Diff) AS gold15Diff,
    avg(xp15Diff) AS xp15Diff,
    avg(cs15Diff) AS cs15Diff,
    avg(killDiff) AS killDiff,
    avg(deathDiff) AS deathDiff,
    avg(damageDiff) AS damageDiff
  FROM pairs
  GROUP BY lane, champion, opponent
  HAVING count(*) >= 2
),
scored AS (
  SELECT
    lane,
    agg.champion,
    opponent,
    n AS sampleSize,
    round(wr * 100, 1) AS winRate,
    round(baseWr * 100, 1) AS baselineWinRate,
    round((wr - baseWr) * 100, 1) AS winDelta,
    round(goldDiff, 0) AS finalGoldDiff,
    round(goldDiff - baseGold, 0) AS finalGoldDeltaVsBaseline,
    round(xpDiff, 0) AS finalXpDiff,
    round(xpDiff - baseXp, 0) AS finalXpDeltaVsBaseline,
    round(csDiff, 1) AS finalCsDiff,
    round(csDiff - baseCs, 1) AS finalCsDeltaVsBaseline,
    round(gold15Diff, 0) AS gold15Diff,
    round(gold15Diff - baseGold15, 0) AS gold15Delta,
    round(xp15Diff, 0) AS xp15Diff,
    round(xp15Diff - baseXp15, 0) AS xp15Delta,
    round(cs15Diff, 1) AS cs15Diff,
    round(cs15Diff - baseCs15, 1) AS cs15Delta,
    round(killDiff, 2) AS killDiff,
    round(deathDiff, 2) AS deathDiff,
    round(damageDiff, 0) AS damageDiff,
    least(100, greatest(0,
      50
      + (gold15Diff - baseGold15) / 140
      + (xp15Diff - baseXp15) / 220
      + (cs15Diff - baseCs15) * 1.8
      + (killDiff - baseKill) * 4
      - (deathDiff - baseDeath) * 3
    )) AS laneScoreRaw,
    least(100, greatest(0,
      50
      + (wr - baseWr) * 90
      + (damageDiff - baseDamage) / 1000
    )) AS gameScoreRaw
  FROM agg
  JOIN base USING (lane, champion)
)
SELECT
  *
FROM (
  SELECT
    champion,
    lane,
    opponent,
    sampleSize,
    winRate,
    baselineWinRate,
    winDelta,
    finalGoldDiff,
    finalGoldDeltaVsBaseline,
    finalXpDiff,
    finalXpDeltaVsBaseline,
    finalCsDiff,
    finalCsDeltaVsBaseline,
    gold15Diff,
    gold15Delta,
    xp15Diff,
    xp15Delta,
    cs15Diff,
    cs15Delta,
    killDiff,
    deathDiff,
    damageDiff,
    round(laneScoreRaw, 0) AS laneScore,
    round(gameScoreRaw, 0) AS gameScore,
    round(least(100, greatest(0, laneScoreRaw * 0.62 + gameScoreRaw * 0.38)), 0) AS counterScore,
    CASE
      WHEN laneScoreRaw >= 68 AND gameScoreRaw < 64 THEN 'Lane Bully'
      WHEN laneScoreRaw < 45 AND gameScoreRaw >= 70 THEN 'Scaling Counter'
      WHEN laneScoreRaw >= 60 AND gameScoreRaw >= 68 THEN 'Complete Counter'
      WHEN laneScoreRaw >= 54 THEN 'Stability Pick'
      ELSE 'Thin Sample'
    END AS type,
    CASE
      WHEN laneScoreRaw >= 68 AND gameScoreRaw < 64 THEN 'Lane metrics are stronger than the win result. This is a lane counter, not necessarily a game counter.'
      WHEN laneScoreRaw < 45 AND gameScoreRaw >= 70 THEN 'Bad lane, strong outcome. Raw win rate would overstate this as a lane counter.'
      WHEN laneScoreRaw >= 60 AND gameScoreRaw >= 68 THEN 'Both lane and game deltas are above baseline.'
      WHEN laneScoreRaw >= 54 THEN 'Makes the lane more playable, but the edge is modest.'
      ELSE 'Treat cautiously until the sample grows.'
    END AS read,
    row_number() OVER (
      PARTITION BY lane, opponent
      ORDER BY least(100, greatest(0, laneScoreRaw * 0.62 + gameScoreRaw * 0.38)) DESC, sampleSize DESC
    ) AS targetRank
  FROM scored
)
WHERE targetRank <= 8
ORDER BY lane, opponent, targetRank;
`;

const rows = JSON.parse(execFileSync("duckdb", ["-json", "-c", sql], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 20
}));

const payload = {
  meta: {
    dataset: "gptilt/lol-basic-matches-challenger-10k",
    sourceUrl: "https://huggingface.co/datasets/gptilt/lol-basic-matches-challenger-10k",
    rows: "10k matches, 100k participants, 15.1M total rows including events",
    fileSize: "2.51 GB",
    license: "CC BY-NC 4.0",
    status: existsSync(localDataRoot)
      ? `Generated from local GPTilt Parquet files (${hasEventFiles ? "15-minute event frames enabled" : "participant rows only"}).`
      : "Generated from remote GPTilt participant Parquet files.",
    warning: hasEventFiles
      ? "Uses same-lane opponent joins plus PARTICIPANT_FRAME snapshots at 15 minutes for lane gold/XP/CS deltas; final-game metrics remain available for context."
      : "This first aggregate uses final-game participant rows. Add events/PARTICIPANT_FRAME extraction for true gold/XP/CS at 15."
  },
  matchups: rows
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${rows.length} matchup rows to ${outputPath}`);

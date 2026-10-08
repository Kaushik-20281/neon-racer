const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const dataDirectory = process.env.COAST_RALLY_DATA_DIR || path.join(__dirname, ".data");
const leaderboardFile = path.join(dataDirectory, "leaderboard.json");
const recordsFile = path.join(dataDirectory, "records.json");

app.use(express.json({ limit: "256kb" }));

const validModes = new Set(["circuit", "hill", "ghost", "checkpoint"]);
const validVehicles = new Set(["sports", "rally", "taxi", "truck"]);

function readRecords() {
  try {
    const contents = fs.readFileSync(recordsFile, "utf8");
    const records = JSON.parse(contents);
    if (!Array.isArray(records)) throw new Error("Run records are invalid.");
    return records;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function saveRecords(records) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryFile = `${recordsFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, recordsFile);
}

function validatePath(pathData) {
  return Array.isArray(pathData)
    && pathData.length >= 2
    && pathData.length <= 1800
    && pathData.every((point) =>
      point && Number.isFinite(point.x) && Number.isFinite(point.y)
      && Number.isFinite(point.z) && Number.isFinite(point.heading)
      && Math.abs(point.x) <= 10000 && Math.abs(point.y) <= 10000
      && Math.abs(point.z) <= 10000
    );
}

function readLeaderboard() {
  let contents;
  try {
    contents = fs.readFileSync(leaderboardFile, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const entries = JSON.parse(contents);
  if (!Array.isArray(entries) || entries.some((entry) =>
    typeof entry.name !== "string"
    || !Number.isFinite(entry.bestLapTime)
    || entry.bestLapTime <= 0
  )) {
    throw new Error("Leaderboard data is invalid.");
  }
  return entries;
}

function saveLeaderboard(entries) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryFile = `${leaderboardFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, leaderboardFile);
}

function sortedLeaderboard(entries) {
  return [...entries].sort((first, second) => first.bestLapTime - second.bestLapTime);
}

app.get("/api/leaderboard", (request, response) => {
  try {
    response.json({ entries: sortedLeaderboard(readLeaderboard()).slice(0, 5) });
  } catch (error) {
    console.error("Could not read the leaderboard:", error);
    response.status(500).json({ error: "Could not load the leaderboard." });
  }
});

app.post("/api/leaderboard", (request, response) => {
  const body = request.body && typeof request.body === "object" ? request.body : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const bestLapTime = body.bestLapTime;
  if (!name || name.length > 20 || /[\u0000-\u001f\u007f]/.test(name)) {
    response.status(400).json({ error: "Enter a name with 1 to 20 visible characters." });
    return;
  }
  if (typeof bestLapTime !== "number" || !Number.isFinite(bestLapTime) || bestLapTime <= 0 || bestLapTime > 600) {
    response.status(400).json({ error: "The best lap time is invalid." });
    return;
  }

  try {
    const entries = sortedLeaderboard([
      ...readLeaderboard(),
      { name, bestLapTime: Math.round(bestLapTime * 100) / 100 },
    ]).slice(0, 5);
    saveLeaderboard(entries);
    response.status(201).json({ entries });
  } catch (error) {
    console.error("Could not save the leaderboard:", error);
    response.status(500).json({ error: "Could not save your lap time." });
  }
});

app.get("/api/records", (request, response) => {
  try {
    const { mode, vehicle } = request.query;
    if ((mode && !validModes.has(mode)) || (vehicle && !validVehicles.has(vehicle))) {
      response.status(400).json({ error: "The requested mode or vehicle is invalid." });
      return;
    }
    const records = readRecords().filter((record) =>
      (!mode || record.mode === mode) && (!vehicle || record.vehicle === vehicle)
    );
    response.json({ records });
  } catch (error) {
    console.error("Could not read run records:", error);
    response.status(500).json({ error: "Could not load run records." });
  }
});

app.post("/api/records", (request, response) => {
  const body = request.body && typeof request.body === "object" ? request.body : {};
  if (!validModes.has(body.mode) || !validVehicles.has(body.vehicle)) {
    response.status(400).json({ error: "Choose a valid mode and vehicle." });
    return;
  }
  if (typeof body.time !== "number" || !Number.isFinite(body.time) || body.time <= 0 || body.time > 3600) {
    response.status(400).json({ error: "The run time is invalid." });
    return;
  }
  if (!Number.isInteger(body.score) || body.score < 0 || body.score > 10000) {
    response.status(400).json({ error: "The run score is invalid." });
    return;
  }
  if (!validatePath(body.path)) {
    response.status(400).json({ error: "The recorded run path is invalid." });
    return;
  }

  try {
    const records = readRecords();
    const index = records.findIndex((record) =>
      record.mode === body.mode && record.vehicle === body.vehicle
    );
    const previous = index === -1 ? null : records[index];
    const bestTime = !previous || body.time < previous.bestTime;
    const bestScore = body.score > (previous ? previous.bestScore : 0);
    const record = {
      mode: body.mode,
      vehicle: body.vehicle,
      bestTime: bestTime ? Math.round(body.time * 100) / 100 : previous.bestTime,
      bestScore: bestScore ? body.score : previous ? previous.bestScore : 0,
      path: bestTime ? body.path : previous.path,
    };
    if (index === -1) records.push(record);
    else records[index] = record;
    saveRecords(records);
    response.status(201).json({ record, improvedTime: bestTime, improvedScore: bestScore });
  } catch (error) {
    console.error("Could not save run records:", error);
    response.status(500).json({ error: "Could not save this run." });
  }
});

app.use(express.static(__dirname));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Metro Drive is ready at http://localhost:${port}`);
  });
}

module.exports = app;

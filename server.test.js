const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "coast-rally-records-"));
process.env.COAST_RALLY_DATA_DIR = dataDirectory;
const app = require("./server");
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  fs.rmSync(dataDirectory, { recursive: true, force: true });
});

test("run records reject invalid modes and malformed paths", async () => {
  const response = await fetch(`${baseUrl}/api/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "unknown",
      vehicle: "truck",
      time: 42,
      score: 0,
      path: [{ x: 0, y: 0, z: 0, heading: 0 }],
    }),
  });
  assert.equal(response.status, 400);
});

test("records retain the fastest path and the separate best checkpoint score", async () => {
  const pathForRun = (x) => [
    { x, y: 0, z: 0, heading: 0 },
    { x: x + 1, y: 0, z: 1, heading: 0.2 },
  ];
  const postRecord = (time, score, runPath) => fetch(`${baseUrl}/api/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "checkpoint", vehicle: "truck", time, score, path: runPath }),
  });

  const firstResponse = await postRecord(50, 3, pathForRun(0));
  assert.equal(firstResponse.status, 201);
  const secondResponse = await postRecord(60, 5, pathForRun(10));
  assert.equal(secondResponse.status, 201);
  const { record } = await secondResponse.json();
  assert.equal(record.bestTime, 50);
  assert.equal(record.bestScore, 5);
  assert.deepEqual(record.path, pathForRun(0));

  const lookup = await fetch(`${baseUrl}/api/records?mode=checkpoint&vehicle=truck`);
  const result = await lookup.json();
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].bestScore, 5);
});

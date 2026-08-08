const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflowPath =
  process.argv[2] ||
  path.join(__dirname, "..", ".github", "workflows", "deploy.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");

const forbiddenBoundaries = [
  {
    pattern: /tj-actions\/changed-files/i,
    description: "the retired third-party changed-files action",
  },
  {
    pattern: /steps\.changed-files\.outputs\.all_changed_files/,
    description: "raw action output embedded in a shell run block",
  },
  {
    pattern: /all_changed_files\.json/,
    description: "an unneeded changed-filename artifact",
  },
];

for (const boundary of forbiddenBoundaries) {
  assert.equal(
    boundary.pattern.test(workflow),
    false,
    `deploy.yml must not contain ${boundary.description}`,
  );
}

assert.equal(
  (workflow.match(/^  deploy(?:_v2)?:$/gm) || []).length,
  2,
  "the guard must cover both deployment jobs",
);

console.log("Deployment changed-file boundary is absent in both jobs.");

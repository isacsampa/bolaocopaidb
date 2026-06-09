const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlPath = path.join(__dirname, "..", "index.html");
const content = fs.readFileSync(htmlPath, "utf8");

// Extract content of <script> tag
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let count = 0;
let errors = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  const code = match[1];
  const index = match.index;
  const lineNo = content.substring(0, index).split("\n").length;
  count++;
  try {
    new vm.Script(code);
    console.log(`✅ Script #${count} (Line ${lineNo}): Syntax is OK`);
  } catch (err) {
    errors++;
    console.error(`❌ Script #${count} (Line ${lineNo}) has syntax error:`, err.message);
  }
}

console.log(`\nSyntax check completed. Total scripts: ${count}, Errors: ${errors}`);
process.exit(errors > 0 ? 1 : 0);

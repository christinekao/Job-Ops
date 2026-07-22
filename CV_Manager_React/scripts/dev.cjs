const { spawn } = require("child_process");
const { createServerConfig } = require("../serverConfig.cjs");

const config = createServerConfig();

const children = [
  spawn(process.execPath, ["server.cjs"], { stdio: "inherit" }),
  spawn(process.execPath, ["./node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(config.uiPort)], {
    stdio: "inherit"
  })
];

function stopAll(signal) {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopAll("SIGTERM");
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(0);
});

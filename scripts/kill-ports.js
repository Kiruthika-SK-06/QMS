import { execSync } from "child_process";

const ports = [5000, 5173];

for (const port of ports) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"]
      });
      const lines = output.trim().split("\n");
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[parts.length - 2];
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== "0" && pid !== String(process.pid) && (state === "LISTENING" || parts.length >= 5)) {
          pids.add(pid);
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`✅ Stopped process on port ${port} (PID ${pid})`);
        } catch {
          // Process may have already exited
        }
      }
    } else {
      try {
        execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: "ignore" });
        console.log(`✅ Stopped process on port ${port}`);
      } catch {}
    }
  } catch {
    // No process listening on this port
  }
}

console.log("Ports 5000 & 5173 are now free.");

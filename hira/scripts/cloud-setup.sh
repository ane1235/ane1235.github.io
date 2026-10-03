#!/usr/bin/env bash
set -euo pipefail
set +x
task_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 - "$task_root" <<'PY'
import json, os, pathlib, subprocess, sys, tomllib
root = pathlib.Path(sys.argv[1])
probe = root / "diagnostics/mcp_probe.py"
requests = [
    {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05"}},
    {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
    {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "hira_runtime_probe", "arguments": {}}}
]
run = subprocess.run([sys.executable, str(probe)], input="".join(json.dumps(r)+"\n" for r in requests),
                     text=True, capture_output=True, check=True, timeout=10)
responses = [json.loads(line) for line in run.stdout.splitlines()]
assert responses[1]["result"]["tools"][0]["name"] == "hira_runtime_probe"
assert json.loads(responses[2]["result"]["content"][0]["text"])["medical_query"] is False
config = pathlib.Path(os.environ.get("CODEX_HOME", str(pathlib.Path.home()/".codex"))) / "config.toml"
config.parent.mkdir(parents=True, exist_ok=True)
old = config.read_text() if config.exists() else ""
data = tomllib.loads(old)
expected = {"command": sys.executable, "args": [str(probe)], "enabled": True}
existing = data.get("mcp_servers", {}).get("hira-diagnostic")
if existing is not None and existing != expected:
    raise SystemExit("Existing hira-diagnostic configuration differs; no overwrite")
if existing is None:
    addition = "\n[mcp_servers.hira-diagnostic]\ncommand = " + json.dumps(sys.executable)
    addition += "\nargs = [" + json.dumps(str(probe)) + "]\nenabled = true\n"
    config.write_text(old + addition)
print(json.dumps({"step": "HIRA_SETUP", "status": "PASS", "workspace": str(root),
                  "diagnostic_stdio": "PASS", "native_tool_exposure": "NOT_YET_VERIFIED"}))
PY

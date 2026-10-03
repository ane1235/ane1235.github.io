#!/usr/bin/env python3
"""Network-free MCP diagnostic. A fresh nonce proves the actual call."""
import json
import sys
import uuid

for line in sys.stdin:
    try:
        request = json.loads(line)
        if "id" not in request:
            continue
        method = request.get("method")
        if method == "initialize":
            result = {"protocolVersion": request.get("params", {}).get("protocolVersion", "2024-11-05"),
                      "capabilities": {"tools": {}},
                      "serverInfo": {"name": "hira-diagnostic", "version": "1.0.0"}}
        elif method == "tools/list":
            result = {"tools": [{"name": "hira_runtime_probe",
                "description": "Verify native HIRA MCP tool registration. Diagnostic only; no medical query.",
                "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
                "annotations": {"readOnlyHint": True, "destructiveHint": False, "openWorldHint": False}}]}
        elif method == "tools/call" and request.get("params", {}).get("name") == "hira_runtime_probe":
            result = {"content": [{"type": "text", "text": json.dumps({
                "status": "DIAGNOSTIC_ONLY", "nonce": uuid.uuid4().hex,
                "medical_query": False})}], "isError": False}
        elif method == "ping":
            result = {}
        else:
            print(json.dumps({"jsonrpc": "2.0", "id": request["id"],
                              "error": {"code": -32601, "message": "Method not found"}}), flush=True)
            continue
        print(json.dumps({"jsonrpc": "2.0", "id": request["id"], "result": result}), flush=True)
    except (ValueError, TypeError):
        print(json.dumps({"jsonrpc": "2.0", "id": None,
                          "error": {"code": -32700, "message": "Parse error"}}), flush=True)

import os
from pathlib import Path
from .base_tool import Tool

class ReadFileTool(Tool):
    @property
    def schema(self):
        return {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Read the contents of a file in the workspace",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Relative path to file"}
                    },
                    "required": ["path"]
                }
            }
        }

    async def execute(self, arguments: dict, workspace: Path) -> str:
        path = workspace / arguments["path"]
        if not path.is_file():
            return f"Error: File not found: {arguments['path']}"
        try:
            return path.read_text(encoding="utf-8")
        except Exception as e:
            return f"Error reading file: {str(e)}"
from pathlib import Path
from typing import Any

from .base_tool import Tool


class WriteFileTool(Tool):
    @property
    def schema(self):
        return {
            "type": "function",
            "function": {
                "name": "write_file",
                "description": (
                    "Create or overwrite a file with the given content. "
                    "Use this to create new files, update existing code, "
                    "write configuration files, documentation, etc."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Relative path to the file (from workspace root)"
                        },
                        "content": {
                            "type": "string",
                            "description": "The full content to write to the file"
                        },
                        "mode": {
                            "type": "string",
                            "enum": ["w", "a"],
                            "description": "Write mode: 'w' = overwrite (default), 'a' = append",
                            "default": "w"
                        }
                    },
                    "required": ["path", "content"]
                }
            }
        }

    async def execute(self, arguments: dict[str, Any], workspace: Path) -> str:
        rel_path = arguments.get("path", "").strip()
        content = arguments.get("content", "")
        mode = arguments.get("mode", "w")

        if not rel_path:
            return "Error: No file path provided"

        full_path = (workspace / rel_path).resolve()

        # Basic security - prevent path traversal
        if not full_path.is_relative_to(workspace.resolve()):
            return "Error: Path traversal attempt detected - operation blocked"

        try:
            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)

            write_mode = "w" if mode == "w" else "a"
            with full_path.open(write_mode, encoding="utf-8") as f:
                f.write(content)

            action = "Overwritten" if write_mode == "w" else "Appended to"
            return f"{action} file successfully: {rel_path}\nSize: {len(content)} characters"

        except PermissionError:
            return f"Permission denied: cannot write to {rel_path}"
        except Exception as e:
            return f"Failed to write file {rel_path}: {str(e)}"
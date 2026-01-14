from pathlib import Path
from app.tools.base_tool import Tool

class ListFilesTool(Tool):
    """Tool to list files and directories in a given path"""

    @property
    def schema(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": "list_files",
                "description": "List all files and directories in the workspace or a specific subdirectory",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Relative path within workspace (leave empty for root)"
                        }
                    },
                    "required": []
                }
            }
        }

    async def execute(self, arguments: dict, workspace: Path) -> str:
        rel_path = arguments.get("path", "")

        if rel_path:
            target = workspace / rel_path
        else:
            target = workspace

        # Validate path is within workspace (security)
        try:
            target = target.resolve()
            if not str(target).startswith(str(workspace.resolve())):
                return "Error: Path is outside workspace"
        except Exception:
            return "Error: Invalid path"

        if not target.exists():
            return f"Error: Path does not exist: {rel_path or '.'}"

        if not target.is_dir():
            return f"Error: Path is not a directory: {rel_path}"

        # List files and directories
        try:
            items = []
            for item in sorted(target.iterdir()):
                try:
                    relative = item.relative_to(workspace)
                    is_dir = item.is_dir()
                    size = item.stat().st_size if not is_dir else None

                    items.append({
                        "name": item.name,
                        "path": str(relative),
                        "type": "directory" if is_dir else "file",
                        "size": size
                    })
                except Exception:
                    continue  # Skip items we can't access

            # Format output
            result = f"Contents of {rel_path or 'workspace root'}:\n\n"
            for item in items:
                icon = "📁" if item["type"] == "directory" else "📄"
                size_str = f" ({item['size']} bytes)" if item.get('size') is not None else ""
                result += f"{icon} {item['name']}{size_str}\n"

            return result if items else "Directory is empty"

        except PermissionError:
            return f"Error: Permission denied accessing {rel_path or 'workspace'}"
        except Exception as e:
            return f"Error listing files: {str(e)}"

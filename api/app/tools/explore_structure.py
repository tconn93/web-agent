from pathlib import Path
from app.tools.base_tool import Tool
import os

class ExploreStructureTool(Tool):
    """Tool to explore and display the project structure as a file tree"""

    @property
    def schema(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": "explore_project_structure",
                "description": "Explore and display the complete file tree structure of the workspace or a specific directory. Shows all files and folders in a tree format.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Relative path within workspace to explore (leave empty for entire workspace)"
                        },
                        "max_depth": {
                            "type": "integer",
                            "description": "Maximum depth to traverse (default: 5, max: 10)",
                            "default": 5
                        },
                        "show_hidden": {
                            "type": "boolean",
                            "description": "Whether to show hidden files/folders (starting with .)",
                            "default": False
                        }
                    },
                    "required": []
                }
            }
        }

    async def execute(self, arguments: dict, workspace: Path) -> str:
        rel_path = arguments.get("path", "")
        max_depth = min(arguments.get("max_depth", 5), 10)
        show_hidden = arguments.get("show_hidden", False)

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

        # Common directories to ignore
        ignore_dirs = {
            'node_modules', '__pycache__', '.git', '.venv', 'venv',
            'env', '.pytest_cache', '.mypy_cache', 'dist', 'build',
            '.next', '.nuxt', 'coverage', '.coverage', 'htmlcov'
        }

        def build_tree(path: Path, prefix: str = "", depth: int = 0) -> list[str]:
            """Recursively build file tree"""
            if depth > max_depth:
                return []

            lines = []
            try:
                # Get all items in directory
                items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))

                # Filter out hidden files if needed
                if not show_hidden:
                    items = [item for item in items if not item.name.startswith('.')]

                # Filter out common ignore directories
                items = [item for item in items if item.name not in ignore_dirs]

                for idx, item in enumerate(items):
                    is_last = idx == len(items) - 1
                    current_prefix = "└── " if is_last else "├── "
                    next_prefix = "    " if is_last else "│   "

                    # Format item name
                    if item.is_dir():
                        name = f"📁 {item.name}/"
                    else:
                        # Add file size
                        try:
                            size = item.stat().st_size
                            if size < 1024:
                                size_str = f"{size}B"
                            elif size < 1024 * 1024:
                                size_str = f"{size/1024:.1f}KB"
                            else:
                                size_str = f"{size/(1024*1024):.1f}MB"
                            name = f"📄 {item.name} ({size_str})"
                        except:
                            name = f"📄 {item.name}"

                    lines.append(f"{prefix}{current_prefix}{name}")

                    # Recursively process directories
                    if item.is_dir():
                        sublines = build_tree(item, prefix + next_prefix, depth + 1)
                        lines.extend(sublines)

            except PermissionError:
                lines.append(f"{prefix}    [Permission Denied]")
            except Exception as e:
                lines.append(f"{prefix}    [Error: {str(e)}]")

            return lines

        try:
            # Build the tree
            result = [f"Project Structure: {target.name}/\n"]
            tree_lines = build_tree(target)
            result.extend(tree_lines)

            if not tree_lines:
                result.append("(Empty directory)")

            # Add summary
            total_files = len([line for line in tree_lines if "📄" in line])
            total_dirs = len([line for line in tree_lines if "📁" in line])
            result.append(f"\nSummary: {total_dirs} directories, {total_files} files")

            return "\n".join(result)

        except Exception as e:
            return f"Error exploring structure: {str(e)}"

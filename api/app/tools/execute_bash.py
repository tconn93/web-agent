import subprocess
import shlex
from pathlib import Path
from typing import Any

from .base_tool import Tool
from ..models import ToolResultMessage


class ExecuteBashTool(Tool):
    @property
    def schema(self):
        return {
            "type": "function",
            "function": {
                "name": "execute_bash",
                "description": (
                    "Execute a bash/shell command in the current workspace directory. "
                    "Use this tool when you need to run commands, scripts, git operations, "
                    "package managers (npm/pip/uv), tests, builds, etc. "
                    "The command runs in a non-interactive shell."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "The bash command to execute. Can be multi-line."
                        },
                        "timeout_seconds": {
                            "type": "integer",
                            "description": "Maximum time the command is allowed to run (default: 60)",
                            "default": 60
                        }
                    },
                    "required": ["command"]
                }
            }
        }

    async def execute(self, arguments: dict[str, Any], workspace: Path) -> str:
        command = arguments.get("command", "").strip()
        timeout = arguments.get("timeout_seconds", 60)

        if not command:
            return "Error: No command provided"

        try:
            # Run with timeout and capture output
            result = subprocess.run(
                command,
                shell=True,
                cwd=str(workspace),
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace"
            )

            output = []
            if result.stdout.strip():
                output.append("STDOUT:\n" + result.stdout.rstrip())
            if result.stderr.strip():
                output.append("STDERR:\n" + result.stderr.rstrip())

            output_text = "\n\n".join(output) if output else "(no output)"

            if result.returncode == 0:
                return f"Command completed successfully (exit code 0):\n{output_text}"
            else:
                return (
                    f"Command failed with exit code {result.returncode}:\n"
                    f"{output_text}"
                )

        except subprocess.TimeoutExpired:
            return f"Command timed out after {timeout} seconds"
        except subprocess.SubprocessError as e:
            return f"Failed to execute command: {str(e)}"
        except Exception as e:
            return f"Unexpected error while running bash command: {str(e)}"
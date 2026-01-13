# app/tools/__init__.py

from .base_tool import Tool
from .read_file import ReadFileTool
from .write_file import WriteFileTool
from .execute_bash import ExecuteBashTool

# Optional: you can also import other tools here when you add them later
# from .some_other_tool import SomeOtherTool

def get_all_tools() -> list[Tool]:
    """
    Returns the list of all available tools that will be passed to Grok.
    Add new tools here when you create them.
    """
    return [
        ReadFileTool(),
        WriteFileTool(),
        ExecuteBashTool(),
        # SomeOtherTool(),   # ← add new ones here
    ]
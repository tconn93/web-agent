# app/tools/__init__.py

from .base_tool import Tool
from .read_file import ReadFileTool
from .write_file import WriteFileTool
from .execute_bash import ExecuteBashTool
from .list_files import ListFilesTool
from .web_search import WebSearchTool
from .explore_structure import ExploreStructureTool

def get_all_tools() -> list[Tool]:
    """
    Returns the list of all available tools that will be passed to Grok.
    Add new tools here when you create them.
    """
    return [
        ReadFileTool(),
        WriteFileTool(),
        ExecuteBashTool(),
        ListFilesTool(),
        WebSearchTool(),
        ExploreStructureTool(),
    ]
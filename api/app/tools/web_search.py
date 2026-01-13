import httpx
from app.tools.base_tool import Tool
from app.config import settings
from pathlib import Path

class WebSearchTool(Tool):
    """Tool to search the web using Google Custom Search API"""

    @property
    def schema(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "Search the web using Google Search API. Returns top search results with titles, snippets, and URLs.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query string"
                        },
                        "num_results": {
                            "type": "integer",
                            "description": "Number of results to return (default: 5, max: 10)",
                            "default": 5
                        }
                    },
                    "required": ["query"]
                }
            }
        }

    async def execute(self, arguments: dict, workspace: Path) -> str:
        query = arguments.get("query", "").strip()
        num_results = min(arguments.get("num_results", 5), 10)

        if not query:
            return "Error: Search query is required"

        # Check if API keys are configured
        if not settings.google_api_key or not settings.google_search_engine_id:
            return "Error: Google Search API not configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env file"

        try:
            async with httpx.AsyncClient() as client:
                # Google Custom Search API endpoint
                url = "https://www.googleapis.com/customsearch/v1"
                params = {
                    "key": settings.google_api_key,
                    "cx": settings.google_search_engine_id,
                    "q": query,
                    "num": num_results
                }

                response = await client.get(url, params=params, timeout=30.0)

                if response.status_code == 400:
                    return f"Error: Invalid API request - {response.text}"
                elif response.status_code == 403:
                    return "Error: API key invalid or quota exceeded"
                elif response.status_code != 200:
                    return f"Error: Search API returned status {response.status_code}"

                data = response.json()

                # Check if we have results
                if "items" not in data or not data["items"]:
                    return f"No results found for query: {query}"

                # Format results
                results = []
                for idx, item in enumerate(data["items"], 1):
                    title = item.get("title", "No title")
                    link = item.get("link", "")
                    snippet = item.get("snippet", "No description available")

                    results.append(f"{idx}. {title}\n   URL: {link}\n   {snippet}\n")

                output = f"Search results for '{query}':\n\n"
                output += "\n".join(results)

                return output

        except httpx.TimeoutException:
            return "Error: Search request timed out"
        except httpx.RequestError as e:
            return f"Error: Network error during search - {str(e)}"
        except Exception as e:
            return f"Error: Failed to perform search - {str(e)}"

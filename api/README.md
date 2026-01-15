# Web Agent API

Backend API for the Web Agent project, powered by xAI's Grok models.

## Quick Start

### 1. Create Environment File

Copy the example environment file and configure it with your API keys:

```bash
cd api
cp .env.example .env
```

### 2. Configure Your API Key

Edit the `.env` file and add your Grok API key:

```bash
GROK_API_KEY=your_actual_api_key_here
```

Get your API key from [https://console.x.ai/](https://console.x.ai/)

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the API

```bash
cd api
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Important: Model Configuration

### ⚠️ 422 Error Fix

If you're getting a **422 Unprocessable Entity** error, it's because you're using a model that doesn't support function calling.

**The Issue:**
- The `grok-beta` model does NOT support function calling/tools
- This project requires function calling to work with the agent tools

**The Solution:**
Update your `.env` file to use a model that supports function calling:

```bash
# Recommended (best for tool calling)
GROK_MODEL=grok-4-1-fast

# Other options:
# GROK_MODEL=grok-4-1-fast-non-reasoning  # Fast responses
# GROK_MODEL=grok-4-1-fast-reasoning      # Maximum intelligence
# GROK_MODEL=grok-3-beta                  # Beta model with tool support
```

### Models That Support Function Calling

✅ **Supported:**
- `grok-4-1-fast` (Recommended - 2M context, optimized for tool calling)
- `grok-4-1-fast-reasoning`
- `grok-4-1-fast-non-reasoning`
- `grok-4-fast-reasoning`
- `grok-4-fast-non-reasoning`
- `grok-4`
- `grok-3-beta`
- `grok-3-mini-beta`
- `grok-code-fast-1`

❌ **NOT Supported:**
- `grok-beta` (will cause 422 errors)
- `grok-vision-beta` (vision model, not for tool calling)

For more information, see the [xAI Function Calling Documentation](https://docs.x.ai/docs/guides/function-calling).

## Configuration Options

### Required Settings

- `GROK_API_KEY` - Your xAI API key
- `GROK_MODEL` - The model to use (must support function calling)

### Optional Settings

- `MAX_ITERATIONS=10` - Maximum agent iterations per request
- `DEFAULT_WORKSPACE=../workspaces/default-project` - Default workspace directory
- `INPUT_PRICE=5.0` - Price per 1M input tokens (for cost tracking)
- `OUTPUT_PRICE=15.0` - Price per 1M output tokens (for cost tracking)

### Google Search (Optional)

For the web search tool, configure Google Search API:

- `GOOGLE_API_KEY` - Your Google API key
- `GOOGLE_SEARCH_ENGINE_ID` - Your custom search engine ID

Get credentials from [Google Cloud Console](https://console.cloud.google.com/)

### Database (Optional)

For session persistence:

- `DATABASE_URL=postgresql://webagent:webagent@localhost:5432/webagent`
- `DB_ECHO=false`

Run the PostgreSQL database using Docker:

```bash
docker-compose up -d
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for more details.

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /sessions` - Create a new agent session
- `POST /sessions/{session_id}/resume` - Resume an existing session
- `WS /ws/{session_id}` - WebSocket connection for agent interaction
- `GET /sessions/{session_id}/files` - List files in session workspace
- `GET /sessions/{session_id}/changes` - Get file changes for a session

## Development

### Running Tests

```bash
python test_websocket.py
```

### Available Tools

The agent has access to the following tools:

1. **ReadFileTool** - Read file contents
2. **WriteFileTool** - Write/modify files
3. **ExecuteBashTool** - Execute bash commands
4. **ListFilesTool** - List files in a directory
5. **WebSearchTool** - Search the web (requires Google API)
6. **ExploreStructureTool** - View project file structure

## Troubleshooting

### 422 Unprocessable Entity Error

**Cause:** Using a model that doesn't support function calling (e.g., `grok-beta`)

**Fix:** Update `GROK_MODEL` in your `.env` file to `grok-4-1-fast` or another supported model.

### Missing API Key Error

**Cause:** `GROK_API_KEY` not set in `.env` file

**Fix:** Add your API key to the `.env` file.

### Module Import Errors

**Cause:** Dependencies not installed

**Fix:** Run `pip install -r requirements.txt`

## Learn More

- [xAI API Documentation](https://docs.x.ai/docs)
- [Function Calling Guide](https://docs.x.ai/docs/guides/function-calling)
- [Available Models](https://docs.x.ai/docs/models)
- [Grok 4.1 Fast Announcement](https://x.ai/news/grok-4-1-fast)

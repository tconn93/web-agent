# TODO list - Active task for Claude Code
Last updated: 2026-01-13  
Status: In Progress  
Total remaining: ? tasks

## Guiding Rules for this file (Claude — read this every time!)
- Treat this file as **source of truth** for what to work on next
- Work on **one top-level task at a time** unless explicitly told otherwise
- For each task:
  1. Think step-by-step
  2. Create your own internal sub-todo list (use TodoWrite tool)
  3. Implement, test, lint, commit
  4. Update this file: change [ ] → [x] when **really** done
  5. Move to the next uncompleted task automatically
- Prefer small, atomic commits (Conventional Commits style)
- Always run tests / typecheck / lint after changes
- If blocked: write why in comment and leave task unchecked
- After finishing a task → say "Task X completed ✓ — moving to next"  


## Priority 1

- [x] Have the WebUI show the Agent's markdown style response prettier.
- [x] Set it up where multiple agents can run concurrently. Each agent will have it's own session.
- [x]  Different types of Agents. A Planning agent and Building agent will work for now. 

## Priority 2

- [x] Display and Track token usage
    - Have an INPUT_PRICE and OUTPUT_PRICE in the backend .env file
    - Calculate the estimated Usage cost
- [x] Add a tab on the right of the screen of the entire file system.
- [x] Add a tab on the right to keep track of the changes.



## Priority 3

- [x] Add a Web Search Tool, that implements Google Search API.
- [x] Add an Explore Project Structure tool that the LLM a File Tree of the particular project.
- [x] Create Models for Messages, Tasks, tool calls, etc
    - Setup connection with a postgres DB to store this data.
- [x] Add a login page and add Auth to the project. 

# Database Setup Guide

This guide will help you set up PostgreSQL database for the Web Agent Hub.

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Start PostgreSQL database
docker-compose up -d

# Wait for database to be ready (about 5 seconds)
# Then initialize the database tables
python -m app.init_db
```

## Manual PostgreSQL Setup

If you prefer to install PostgreSQL manually:

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE webagent;
CREATE USER webagent WITH PASSWORD 'webagent';
GRANT ALL PRIVILEGES ON DATABASE webagent TO webagent;
\q
```

### 3. Update .env File

Make sure your `.env` file has the correct database URL:

```env
DATABASE_URL=postgresql://webagent:webagent@localhost:5432/webagent
```

### 4. Initialize Database Tables

```bash
cd api
python -m app.init_db
```

## Database Schema

The application uses the following tables:

- **sessions** - Agent session information
- **messages** - Conversation history
- **tool_calls** - Tool execution history
- **file_changes** - File modification tracking
- **token_usage** - Token usage and cost tracking
- **users** - User accounts (for future authentication)

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Check if PostgreSQL is running:
   ```bash
   # Docker
   docker ps

   # Manual installation
   sudo systemctl status postgresql
   ```

2. Verify credentials in `.env` match your PostgreSQL setup

3. Make sure the database exists:
   ```bash
   psql -U webagent -d webagent
   ```

### Port Conflicts

If port 5432 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Use port 5433 instead
```

Then update your `DATABASE_URL` accordingly:
```env
DATABASE_URL=postgresql://webagent:webagent@localhost:5433/webagent
```

## Migration (Future)

For production deployments, consider using Alembic for database migrations:

```bash
# Initialize Alembic
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

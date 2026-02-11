# AI RAG Chat Assistant – Setup

This app adds an admin panel for knowledge files, chatbot configuration, and a RAG-based chat assistant using the [Laravel AI SDK](https://laravel.com/docs/12.x/ai-sdk) and PostgreSQL (pgvector) for embeddings.

## Requirements

- **PHP 8.2+** with Laravel 12
- **PostgreSQL** (with [pgvector](https://github.com/pgvector/pgvector) extension) at `127.0.0.1` for storing embeddings
- **OpenAI API key** for embeddings and chat

## 1. Environment

Copy from `.env.example` and set:

```env
# OpenAI (required for embeddings and chat)
OPENAI_API_KEY=sk-...

# Vector DB – PostgreSQL with pgvector at 127.0.0.1
VECTOR_DB_HOST=127.0.0.1
VECTOR_DB_PORT=5432
VECTOR_DB_DATABASE=laravel_vectors
VECTOR_DB_USERNAME=your_pg_username   # e.g. your system user, not "root"
VECTOR_DB_PASSWORD=
```

Create the vector database and enable pgvector:

```bash
createdb laravel_vectors
psql laravel_vectors -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

**Laravel Forge / managed PostgreSQL:** If you see `permission denied to create extension "vector"`, the Laravel DB user lacks superuser privileges. Run as the `postgres` superuser before migrations:

```bash
sudo -u postgres psql -d laravel_vectors -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

On local/dev, migrations can create the extension; on Forge or managed servers, create it manually as above.

## 2. Migrations

Run migrations (default DB + vector DB):

```bash
php artisan migrate
```

If the vector connection is not configured or PostgreSQL is not running, the vector migrations will fail. Configure `VECTOR_DB_*` and ensure PostgreSQL is up, then run `php artisan migrate` again.

## 3. Queue (for background embedding)

Processing uploaded files into embeddings runs in a job. Use the database queue (default) and run a worker:

```bash
php artisan queue:work
```

Or set `QUEUE_CONNECTION=sync` in `.env` to process immediately (slower for large files).

## 4. Usage

1. **Knowledge files** (Admin → Knowledge files): upload `.txt`, `.md`, or `.csv` files. They are chunked and embedded into PostgreSQL. A pre-built markdown knowledge base scraped from fakharkhan.com is in `docs/knowledge-base-fakharkhan-com.md`—upload that file to give the chat agent context about Fakhar Khan and SoftPyramid.
2. **Chat config** (Admin → Chat config): set system prompt and OpenAI model (e.g. `gpt-4o-mini`, `gpt-4o`). For suggested prompts, see `docs/chat-agent-system-prompt.md`. New installs get a default prompt tuned for the Fakhar Khan/SoftPyramid knowledge base.
3. **Chat** (Chat): ask questions; answers use the uploaded knowledge base when relevant.

## 5. Testing

Feature tests hit the app with the shared Inertia routes. If the `vector` connection is configured in `.env` / `.env.testing`, ensure PostgreSQL is running and the vector DB/user exist, then:

```bash
php artisan test
```

To run only tests that do not depend on the vector DB, you can filter tests; the admin and chat index tests require the app to boot, which may open the vector connection if configured.

# Laravel AI RAG Chat Assistant

A Laravel application that lets you upload knowledge files, embed them with OpenAI, store vectors in PostgreSQL (pgvector), and chat with an AI assistant that answers using your content. Built with the [Laravel AI SDK](https://laravel.com/ai), [Inertia.js](https://inertiajs.com/) (React), and [pgvector](https://github.com/pgvector/pgvector).

## Features

- **Knowledge base upload** – Upload `.txt`, `.md`, or `.csv` files; they are chunked and embedded in the background.
- **Vector store** – Embeddings are stored in PostgreSQL using the pgvector extension for semantic search.
- **Chat configuration** – Configure the system prompt and OpenAI model (e.g. `gpt-4o`, `gpt-4o-mini`) in the admin panel.
- **RAG chat** – Chat with an assistant that uses your uploaded documents as context (retrieval-augmented generation).
- **Streaming responses** – Chat replies stream in real time.

## Requirements

- **PHP 8.2+**
- **Composer**
- **Node.js 18+** and npm
- **PostgreSQL 13+** with the **pgvector** extension
- **OpenAI API key**

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/laravel-ai-rag-agent-demo.git
cd laravel-ai-rag-agent-demo
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install Node dependencies and build assets

```bash
npm install
npm run build
```

### 4. Environment configuration

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set at least:

**Application & main database (PostgreSQL or SQLite)**

- For **PostgreSQL** as the main app database:
  ```env
  DB_CONNECTION=pgsql
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_DATABASE=your_app_database
  DB_USERNAME=your_pg_username
  DB_PASSWORD=your_pg_password
  ```
- Or keep **SQLite** (default in some setups):
  ```env
  DB_CONNECTION=sqlite
  # DB_DATABASE is path to database/database.sqlite
  ```

**OpenAI (required for chat and embeddings)**

```env
OPENAI_API_KEY=sk-your-openai-api-key
```

**Vector database (PostgreSQL with pgvector)**

The app uses a separate PostgreSQL database (or the same server with a different database) for storing embeddings. Create the database and set:

```env
VECTOR_DB_HOST=127.0.0.1
VECTOR_DB_PORT=5432
VECTOR_DB_DATABASE=laravel_vectors
VECTOR_DB_USERNAME=your_pg_username
VECTOR_DB_PASSWORD=your_pg_password
```

Create the database and (if needed) the extension:

```bash
createdb laravel_vectors
psql laravel_vectors -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

**On Laravel Forge / managed servers:** The Laravel DB user often lacks superuser privileges. Run the extension creation as the `postgres` superuser *before* migrations:

```bash
sudo -u postgres psql -d laravel_vectors -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

(Use your actual vector database name if different from `laravel_vectors`.)

If the extension is not installed, see [Installing pgvector](#installing-pgvector) below.

### 5. Run migrations

```bash
php artisan migrate
```

This runs migrations for the main database and the vector database. If you see an error about the `vector` extension, install pgvector first (see below).

### 6. (Optional) Queue worker for background processing

Uploaded files are processed in a queue job. Run a worker so embeddings are generated after upload:

```bash
php artisan queue:work
```

Keep this running in a separate terminal, or set `QUEUE_CONNECTION=sync` in `.env` to process uploads in the same request (simpler but slower for large files).

### 7. Start the application

Using PHP’s built-in server:

```bash
php artisan serve
```

Then open `http://localhost:8000` in your browser. Or use [Laravel Herd](https://herd.laravel.com/), [Valet](https://laravel.com/docs/valet), or your preferred setup.

---

## Installing pgvector

If migrations fail with an error about the `vector` extension, follow the steps below.

### Permission denied (must be superuser)

If you see `permission denied to create extension "vector"` / `Must be superuser to create this extension` (e.g. on **Laravel Forge** or managed PostgreSQL), the Laravel DB user lacks superuser privileges. Create the extension as the `postgres` superuser *before* running migrations:

```bash
sudo -u postgres psql -d YOUR_DATABASE_NAME -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

Replace `YOUR_DATABASE_NAME` with your vector database (e.g. `laravel_vectors` or the value of `VECTOR_DB_DATABASE` in `.env`). If you use a single database for both app and vectors, use that database name. Then run `php artisan migrate` again.

### Extension not installed (control file missing)

If you see an error about the extension control file, install the pgvector package for your PostgreSQL version:

**macOS (Homebrew)**

```bash
brew install pgvector
```

If you use a specific PostgreSQL version (e.g. `postgresql@14`) and the extension is not found, build from source:

```bash
cd /tmp
git clone --branch v0.8.1 https://github.com/pgvector/pgvector.git
cd pgvector
export PG_CONFIG=/opt/homebrew/opt/postgresql@14/bin/pg_config   # adjust path for your version
make
make install
```

**Ubuntu / Debian**

```bash
sudo apt install postgresql-14-pgvector   # or your PG version
```

**Other systems**  
See [pgvector – Installation](https://github.com/pgvector/pgvector#installation).

Then run `php artisan migrate` again.

---

## Usage

1. **Register or log in** at the app URL.
2. **Knowledge files** (sidebar → “Knowledge files”):
   - Upload `.txt`, `.md`, or `.csv` files (max 10 MB).
   - Wait until status is **completed** (ensure `php artisan queue:work` is running if you use the queue).
3. **Chat config** (sidebar → “Chat config”):
   - Set the **system prompt** and choose an **OpenAI model** (e.g. `gpt-4o-mini`).
   - Save.
4. **Chat** (sidebar → “Chat”):
   - Ask questions; the assistant uses your uploaded knowledge when relevant.

---

## Documentation

- [docs/ai-rag-setup.md](docs/ai-rag-setup.md) – Detailed setup and configuration.
- [docs/chat-agent-system-prompt.md](docs/chat-agent-system-prompt.md) – Optional guide for system prompts (if present in the repo).

---

## Testing

```bash
php artisan test
```

Ensure the vector database is configured and PostgreSQL (with pgvector) is running so migrations and tests that use the vector connection can succeed.

---

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

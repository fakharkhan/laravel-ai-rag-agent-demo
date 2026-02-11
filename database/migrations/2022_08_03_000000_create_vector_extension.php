<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'vector';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::connection('vector')->statement('CREATE EXTENSION IF NOT EXISTS vector');
        } catch (\Throwable $e) {
            if (str_contains($e->getMessage(), 'extension control file') || str_contains($e->getMessage(), 'vector.control')) {
                throw new \RuntimeException(
                    'The pgvector extension is not installed for your PostgreSQL version. '
                    .'Install it first, then run migrate again. '
                    .'On macOS with Homebrew PostgreSQL 14: brew install pgvector, or build from source: '
                    .'https://github.com/pgvector/pgvector#installation',
                    0,
                    $e
                );
            }
            throw $e;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('vector')->statement('DROP EXTENSION vector');
    }
};

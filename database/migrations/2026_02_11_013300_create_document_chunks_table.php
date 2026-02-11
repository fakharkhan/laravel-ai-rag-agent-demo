<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'vector';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        Schema::connection('vector')->create('document_chunks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('knowledge_file_id');
            $table->text('content');
            $table->vector('embedding', 1536); // OpenAI text-embedding-3-small dimensions
            $table->timestamps();
        });

        Schema::connection('vector')->table('document_chunks', function (Blueprint $table) {
            $table->index('knowledge_file_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        Schema::connection('vector')->dropIfExists('document_chunks');
    }
};

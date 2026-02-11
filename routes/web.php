<?php

use App\Models\ChatConfig;
use App\Models\KnowledgeFile;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    $knowledgeFilesCount = KnowledgeFile::query()->count();
    $knowledgeFilesCompleted = KnowledgeFile::query()->where('status', KnowledgeFile::StatusCompleted)->count();
    $config = ChatConfig::current();

    return Inertia::render('dashboard', [
        'stats' => [
            'knowledge_files_total' => $knowledgeFilesCount,
            'knowledge_files_ready' => $knowledgeFilesCompleted,
            'chat_model' => $config->model,
        ],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('knowledge-files', [App\Http\Controllers\Admin\KnowledgeFileController::class, 'index'])->name('knowledge-files.index');
    Route::post('knowledge-files', [App\Http\Controllers\Admin\KnowledgeFileController::class, 'store'])->name('knowledge-files.store');
    Route::delete('knowledge-files/{knowledgeFile}', [App\Http\Controllers\Admin\KnowledgeFileController::class, 'destroy'])->name('knowledge-files.destroy');
    Route::post('knowledge-files/{knowledgeFile}/reprocess', [App\Http\Controllers\Admin\KnowledgeFileController::class, 'reprocess'])->name('knowledge-files.reprocess');

    Route::get('chat-config', [App\Http\Controllers\Admin\ChatConfigController::class, 'index'])->name('chat-config.index');
    Route::put('chat-config', [App\Http\Controllers\Admin\ChatConfigController::class, 'update'])->name('chat-config.update');
});

Route::middleware(['auth', 'verified'])->prefix('chat')->name('chat.')->group(function () {
    Route::get('/', [App\Http\Controllers\ChatController::class, 'index'])->name('index');
    Route::post('stream', [App\Http\Controllers\ChatController::class, 'stream'])->name('stream');
});

require __DIR__.'/settings.php';

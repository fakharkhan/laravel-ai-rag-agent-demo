<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreKnowledgeFileRequest;
use App\Jobs\ProcessKnowledgeFileJob;
use App\Models\KnowledgeFile;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeFileController extends Controller
{
    public function index(): Response
    {
        $files = KnowledgeFile::query()
            ->latest()
            ->get();

        return Inertia::render('admin/knowledge-files/Index', [
            'knowledgeFiles' => $files,
        ]);
    }

    public function store(StoreKnowledgeFileRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $path = $file->store('knowledge', 'local');
        $name = $file->getClientOriginalName();

        $knowledgeFile = KnowledgeFile::query()->create([
            'name' => $name,
            'path' => $path,
            'disk' => 'local',
            'status' => KnowledgeFile::StatusPending,
        ]);

        ProcessKnowledgeFileJob::dispatch($knowledgeFile);

        return redirect()->route('admin.knowledge-files.index')
            ->with('success', 'File uploaded. Embedding is being processed.');
    }

    public function destroy(KnowledgeFile $knowledgeFile): RedirectResponse
    {
        $knowledgeFile->delete();
        \App\Models\DocumentChunk::on('vector')
            ->where('knowledge_file_id', $knowledgeFile->id)
            ->delete();

        return redirect()->route('admin.knowledge-files.index')
            ->with('success', 'File removed.');
    }

    public function reprocess(KnowledgeFile $knowledgeFile): RedirectResponse
    {
        if (! $knowledgeFile->isCompleted() && ! $knowledgeFile->isFailed()) {
            return redirect()->route('admin.knowledge-files.index')
                ->with('error', 'File is still processing.');
        }

        $knowledgeFile->update([
            'status' => KnowledgeFile::StatusPending,
            'error_message' => null,
        ]);
        ProcessKnowledgeFileJob::dispatch($knowledgeFile);

        return redirect()->route('admin.knowledge-files.index')
            ->with('success', 'Re-processing started.');
    }
}

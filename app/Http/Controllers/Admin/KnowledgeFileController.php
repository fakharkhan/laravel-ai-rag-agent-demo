<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreKnowledgeFileRequest;
use App\Jobs\ProcessKnowledgeFileJob;
use App\Models\DocumentChunk;
use App\Models\KnowledgeFile;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeFileController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $files = KnowledgeFile::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return Inertia::render('admin/knowledge-files/Index', [
            'knowledgeFiles' => $files,
        ]);
    }

    public function store(StoreKnowledgeFileRequest $request): RedirectResponse
    {
        $userId = $request->user()->id;
        $files = $request->file('files');

        foreach ($files as $file) {
            $path = $file->store("knowledge/{$userId}", 'local');
            $name = $file->getClientOriginalName();

            $knowledgeFile = KnowledgeFile::query()->create([
                'user_id' => $userId,
                'name' => $name,
                'path' => $path,
                'disk' => 'local',
                'status' => KnowledgeFile::StatusPending,
            ]);

            ProcessKnowledgeFileJob::dispatch($knowledgeFile);
        }

        $count = count($files);

        return redirect()->route('admin.knowledge-files.index')
            ->with('success', $count === 1
                ? 'File uploaded. Embedding is being processed.'
                : "{$count} files uploaded. Embeddings are being processed.");
    }

    public function destroy(KnowledgeFile $knowledgeFile): RedirectResponse
    {
        $this->authorize('delete', $knowledgeFile);

        $knowledgeFile->delete();
        DocumentChunk::on('vector')
            ->where('knowledge_file_id', $knowledgeFile->id)
            ->delete();

        return redirect()->route('admin.knowledge-files.index')
            ->with('success', 'File removed.');
    }

    public function reprocess(KnowledgeFile $knowledgeFile): RedirectResponse
    {
        $this->authorize('update', $knowledgeFile);

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

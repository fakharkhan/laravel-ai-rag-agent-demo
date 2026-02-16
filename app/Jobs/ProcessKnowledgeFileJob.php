<?php

namespace App\Jobs;

use App\Models\ChatConfig;
use App\Models\DocumentChunk;
use App\Models\KnowledgeFile;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Embeddings;
use Pgvector\Laravel\Vector;
use Smalot\PdfParser\Parser as PdfParser;

class ProcessKnowledgeFileJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public KnowledgeFile $knowledgeFile
    ) {}

    public function handle(): void
    {
        $this->knowledgeFile->update([
            'status' => KnowledgeFile::StatusProcessing,
            'error_message' => null,
        ]);

        $user = $this->knowledgeFile->user;
        $openAiKey = $user ? ChatConfig::effectiveOpenAiKey($user) : config('ai.providers.openai.key');
        if (! empty($openAiKey)) {
            Config::set('ai.providers.openai.key', $openAiKey);
        }

        try {
            $content = $this->extractText();
            $chunks = $this->chunkText($content, 600, 80);

            DocumentChunk::on('vector')
                ->where('knowledge_file_id', $this->knowledgeFile->id)
                ->delete();

            if (count($chunks) === 0) {
                $this->knowledgeFile->update([
                    'status' => KnowledgeFile::StatusCompleted,
                    'chunks_count' => 0,
                ]);

                return;
            }

            $batchSize = 20;
            $allChunks = array_chunk($chunks, $batchSize);
            $totalInserted = 0;

            foreach ($allChunks as $batch) {
                $response = Embeddings::for($batch)->generate();
                foreach ($batch as $i => $text) {
                    $embedding = $response->embeddings[$i] ?? null;
                    if (is_array($embedding)) {
                        DocumentChunk::on('vector')->create([
                            'knowledge_file_id' => $this->knowledgeFile->id,
                            'content' => $text,
                            'embedding' => new Vector($embedding),
                        ]);
                        $totalInserted++;
                    }
                }
            }

            $this->knowledgeFile->update([
                'status' => KnowledgeFile::StatusCompleted,
                'chunks_count' => $totalInserted,
                'error_message' => null,
            ]);
        } catch (\Throwable $e) {
            $this->knowledgeFile->update([
                'status' => KnowledgeFile::StatusFailed,
                'error_message' => $this->userFacingErrorMessage($e),
            ]);
        }
    }

    protected function userFacingErrorMessage(\Throwable $e): string
    {
        $message = $e->getMessage();

        if (str_contains($message, 'Secured pdf') || str_contains($message, 'password') || str_contains($message, 'encrypted')) {
            return 'This PDF is password-protected or secured. Use an unsecured PDF or remove the password first.';
        }

        return $message;
    }

    protected function extractText(): string
    {
        $path = $this->knowledgeFile->path;
        $disk = $this->knowledgeFile->disk;

        if (! Storage::disk($disk)->exists($path)) {
            throw new \RuntimeException("File not found: {$path}");
        }

        $fullPath = Storage::disk($disk)->path($path);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'txt', 'md', 'markdown', 'csv' => Storage::disk($disk)->get($path),
            'pdf' => (new PdfParser)->parseFile($fullPath)->getText(),
            default => throw new \RuntimeException("Unsupported file type: .{$extension}. Use .txt, .md, .csv, or .pdf"),
        };
    }

    /**
     * @return array<int, string>
     */
    protected function chunkText(string $text, int $chunkSize = 600, int $overlap = 80): array
    {
        $text = trim(preg_replace('/\s+/', ' ', $text));
        if ($text === '') {
            return [];
        }

        $chunks = [];
        $start = 0;
        $length = mb_strlen($text);

        while ($start < $length) {
            $chunk = mb_substr($text, $start, $chunkSize);
            $chunks[] = $chunk;
            $start += $chunkSize - $overlap;
        }

        return $chunks;
    }
}

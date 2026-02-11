<?php

namespace App\Http\Controllers;

use App\Ai\ChatAgent;
use App\Models\ChatConfig;
use App\Models\DocumentChunk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Responses\StreamableAgentResponse;
use Symfony\Component\HttpFoundation\Response;

use function Laravel\Ai\agent;

class ChatController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('chat/Index');
    }

    public function stream(Request $request): Response|JsonResponse|StreamableAgentResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:10000'],
            'memory_enabled' => ['sometimes', 'boolean'],
        ]);

        $message = $request->input('message');
        $memoryEnabled = $request->boolean('memory_enabled');
        $config = ChatConfig::current();

        try {
            $context = $this->getRagContext($message);
            $instructions = $this->buildInstructions($config->system_prompt ?? '', $context);

            if ($memoryEnabled && $request->user()) {
                $agent = (new ChatAgent($instructions))
                    ->continueLastConversation($request->user());

                $stream = $agent->stream($message, provider: $config->provider, model: $config->model);
            } else {
                $stream = agent($instructions, [], [])
                    ->stream($message, provider: $config->provider, model: $config->model);
            }

            return $stream->usingVercelDataProtocol();
        } catch (\Throwable $e) {
            Log::error('Chat stream failed', [
                'message' => $e->getMessage(),
                'exception' => $e::class,
                'trace' => $e->getTraceAsString(),
            ]);

            $userMessage = $this->userFacingErrorMessage($e);

            return response()->json(['error' => $userMessage], 503);
        }
    }

    protected function userFacingErrorMessage(\Throwable $e): string
    {
        $message = $e->getMessage();

        if (str_contains($message, 'API key') || str_contains($message, 'OPENAI') || str_contains($message, 'authentication')) {
            return 'OpenAI API key is missing or invalid. Set OPENAI_API_KEY in .env and in Admin → Chat config choose a valid model.';
        }

        if (str_contains($message, 'connection') || str_contains($message, 'SQLSTATE') || str_contains($message, 'vector')) {
            return 'Vector database is unavailable. Ensure PostgreSQL with pgvector is running and VECTOR_DB_* are set in .env.';
        }

        if (str_contains($message, 'model') || str_contains($message, '404') || str_contains($message, 'not found')) {
            return 'Invalid or unsupported model. Check Admin → Chat config and choose a valid OpenAI model (e.g. gpt-4o-mini).';
        }

        return 'Chat is temporarily unavailable. Please try again or check the server logs.';
    }

    protected function getRagContext(string $query): string
    {
        $embeddingResponse = Embeddings::for([$query])->generate();
        $queryEmbedding = $embeddingResponse->embeddings[0] ?? [];
        if ($queryEmbedding === []) {
            return 'No knowledge base content has been uploaded yet.';
        }

        $nearest = DocumentChunk::nearestTo($queryEmbedding, 5)->get();
        if ($nearest->isEmpty()) {
            return 'No knowledge base content has been uploaded yet.';
        }

        $parts = $nearest->map(fn ($c) => $c->content)->all();

        return implode("\n\n---\n\n", $parts);
    }

    protected function buildInstructions(string $systemPrompt, string $context): string
    {
        $base = $systemPrompt ?: 'You are a helpful assistant.';
        $contextBlock = "Use the following context from the knowledge base when relevant to answer the user. If the context does not contain relevant information, say so.\n\nContext:\n".$context;

        return $base."\n\n".$contextBlock;
    }
}

<?php

namespace App\Http\Controllers;

use App\Ai\ChatAgent;
use App\Models\ChatConfig;
use App\Models\DocumentChunk;
use App\Models\KnowledgeFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Responses\StreamableAgentResponse;
use Symfony\Component\HttpFoundation\Response;

use function Laravel\Ai\agent;

class ChatController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $conversations = $this->getConversationsForUser($user->id);
        $requestedConversationId = $request->query('conversation');
        $messages = [];
        $currentConversationId = null;

        if ($requestedConversationId) {
            $messages = $this->getMessagesForConversation($requestedConversationId, $user->id);
            if ($messages !== [] || $this->conversationBelongsToUser($requestedConversationId, $user->id)) {
                $currentConversationId = $requestedConversationId;
            }
        }

        return Inertia::render('chat/Index', [
            'conversations' => $conversations,
            'currentConversationId' => $currentConversationId,
            'messages' => $messages,
        ]);
    }

    /**
     * @return array<int, array{id: string, title: string, updated_at: string}>
     */
    protected function getConversationsForUser(int $userId): array
    {
        return DB::table('agent_conversations')
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get(['id', 'title', 'updated_at'])
            ->map(fn ($row) => [
                'id' => $row->id,
                'title' => $row->title,
                'updated_at' => $row->updated_at,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{role: string, content: string}>
     */
    protected function conversationBelongsToUser(string $conversationId, int $userId): bool
    {
        return DB::table('agent_conversations')
            ->where('id', $conversationId)
            ->where('user_id', $userId)
            ->exists();
    }

    protected function getMessagesForConversation(string $conversationId, int $userId): array
    {
        if (! $this->conversationBelongsToUser($conversationId, $userId)) {
            return [];
        }

        $rows = DB::table('agent_conversation_messages')
            ->where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->whereIn('role', ['user', 'assistant'])
            ->orderBy('created_at')
            ->get(['role', 'content']);

        return $rows->map(fn ($row) => [
            'role' => $row->role,
            'content' => $row->content ?? '',
        ])->values()->all();
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $conversations = $this->getConversationsForUser($user->id);

        return response()->json(['conversations' => $conversations]);
    }

    public function destroyConversation(Request $request, string $conversationId): RedirectResponse
    {
        $user = $request->user();

        if (! $this->conversationBelongsToUser($conversationId, $user->id)) {
            abort(404);
        }

        DB::table('agent_conversation_messages')->where('conversation_id', $conversationId)->delete();
        DB::table('agent_conversations')->where('id', $conversationId)->delete();

        return redirect()->route('chat.index');
    }

    public function stream(Request $request): Response|JsonResponse|StreamableAgentResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:10000'],
            'memory_enabled' => ['sometimes', 'boolean'],
            'conversation_id' => ['sometimes', 'nullable', 'string', 'uuid'],
        ]);

        $message = $request->input('message');
        $memoryEnabled = $request->boolean('memory_enabled');
        $conversationId = $request->input('conversation_id');
        $user = $request->user();
        $config = ChatConfig::forUser($user);

        if ($conversationId && $user) {
            $exists = DB::table('agent_conversations')
                ->where('id', $conversationId)
                ->where('user_id', $user->id)
                ->exists();
            if (! $exists) {
                $conversationId = null;
            }
        }

        try {
            $context = $this->getRagContext($message, $user);
            $instructions = $this->buildInstructions($config->system_prompt ?? '', $context);

            if ($memoryEnabled && $user) {
                $agent = new ChatAgent($instructions);
                if ($conversationId) {
                    $agent->continue($conversationId, $user);
                } else {
                    $agent->forUser($user);
                }
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

    protected function getRagContext(string $query, \App\Models\User $user): string
    {
        $knowledgeFileIds = KnowledgeFile::query()
            ->where('user_id', $user->id)
            ->pluck('id')
            ->all();

        if ($knowledgeFileIds === []) {
            return 'No knowledge base content has been uploaded yet.';
        }

        $embeddingResponse = Embeddings::for([$query])->generate();
        $queryEmbedding = $embeddingResponse->embeddings[0] ?? [];
        if ($queryEmbedding === []) {
            return 'No knowledge base content has been uploaded yet.';
        }

        $nearest = DocumentChunk::nearestTo($queryEmbedding, 5, $knowledgeFileIds)->get();
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

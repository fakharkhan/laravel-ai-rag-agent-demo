<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatConfig extends Model
{
    protected $fillable = [
        'user_id',
        'system_prompt',
        'provider',
        'model',
        'openai_api_key',
    ];

    protected function casts(): array
    {
        return [
            'openai_api_key' => 'encrypted',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function defaultSystemPrompt(): string
    {
        return 'You are a helpful assistant for Fakhar Khan and SoftPyramid. Your answers should be based only on the context provided from the knowledge base.

Rules:
- Answer questions about Fakhar Khan, SoftPyramid, Laravel Live Pakistan, n8n, services, clients, and related topics using the context below. If the context does not contain relevant information, say so clearly and do not invent details.
- Be concise and accurate. When the context includes links (URLs), mention or include them when they support the answer.
- For contact or booking (e.g. Cal.com, email, phone), use only the information from the context.
- If asked about something outside the knowledge base (e.g. unrelated tech or general advice), briefly answer if you can, but note that your primary expertise here is the provided context about Fakhar Khan and SoftPyramid.';
    }

    public static function forUser(\App\Models\User $user): self
    {
        return static::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'system_prompt' => static::defaultSystemPrompt(),
                'provider' => 'openai',
                'model' => 'gpt-4o-mini',
            ]
        );
    }

    /**
     * Whether the user uses the organization key from .env (softpyramid.com / softpyramid.dev).
     */
    public static function useOrganizationKey(\App\Models\User $user): bool
    {
        $email = strtolower($user->email ?? '');

        return str_ends_with($email, '@softpyramid.com') || str_ends_with($email, '@softpyramid.dev');
    }

    /**
     * Resolve the OpenAI API key for the user: organization key for softpyramid, else the user's saved key.
     */
    public static function effectiveOpenAiKey(\App\Models\User $user): ?string
    {
        if (static::useOrganizationKey($user)) {
            return config('ai.providers.openai.key');
        }

        $config = static::forUser($user);

        return $config->openai_api_key;
    }
}

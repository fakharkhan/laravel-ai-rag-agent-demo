<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatConfig extends Model
{
    protected $fillable = [
        'system_prompt',
        'provider',
        'model',
    ];

    public static function defaultSystemPrompt(): string
    {
        return 'You are a helpful assistant for Fakhar Khan and SoftPyramid. Your answers should be based only on the context provided from the knowledge base.

Rules:
- Answer questions about Fakhar Khan, SoftPyramid, Laravel Live Pakistan, n8n, services, clients, and related topics using the context below. If the context does not contain relevant information, say so clearly and do not invent details.
- Be concise and accurate. When the context includes links (URLs), mention or include them when they support the answer.
- For contact or booking (e.g. Cal.com, email, phone), use only the information from the context.
- If asked about something outside the knowledge base (e.g. unrelated tech or general advice), briefly answer if you can, but note that your primary expertise here is the provided context about Fakhar Khan and SoftPyramid.';
    }

    public static function current(): self
    {
        $config = static::query()->first();

        if (! $config) {
            $config = static::query()->create([
                'system_prompt' => static::defaultSystemPrompt(),
                'provider' => 'openai',
                'model' => 'gpt-4o-mini',
            ]);
        }

        return $config;
    }
}

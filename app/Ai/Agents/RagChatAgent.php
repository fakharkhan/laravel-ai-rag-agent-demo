<?php

namespace App\Ai\Agents;

use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;
use Stringable;

class RagChatAgent implements Agent, Conversational, HasTools
{
    use Promptable, RemembersConversations;

    public function __construct(
        protected string $instructions = 'You are a helpful assistant.'
    ) {}

    public function withInstructions(string $instructions): static
    {
        $this->instructions = $instructions;

        return $this;
    }

    public function instructions(): Stringable|string
    {
        return $this->instructions;
    }

    public function tools(): iterable
    {
        return [];
    }
}

<?php

namespace App\Ai;

use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;

class ChatAgent implements Agent, Conversational, HasTools
{
    use Promptable, RemembersConversations;

    public function __construct(
        public string $instructions
    ) {}

    public function instructions(): string
    {
        return $this->instructions;
    }

    public function tools(): iterable
    {
        return [];
    }
}

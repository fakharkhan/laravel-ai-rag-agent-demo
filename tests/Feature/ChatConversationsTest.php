<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('guests cannot access chat conversations', function () {
    $response = $this->getJson(route('chat.conversations'));
    $response->assertUnauthorized();
});

test('chat index returns conversations and messages for current user', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $conversationId = (string) \Illuminate\Support\Str::uuid7();
    DB::table('agent_conversations')->insert([
        'id' => $conversationId,
        'user_id' => $user->id,
        'title' => 'Test conversation',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('agent_conversation_messages')->insert([
        'id' => (string) \Illuminate\Support\Str::uuid7(),
        'conversation_id' => $conversationId,
        'user_id' => $user->id,
        'agent' => 'TestAgent',
        'role' => 'user',
        'content' => 'Hello',
        'attachments' => '[]',
        'tool_calls' => '[]',
        'tool_results' => '[]',
        'usage' => '[]',
        'meta' => '[]',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->get(route('chat.index', ['conversation' => $conversationId]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('chat/Index')
        ->has('conversations', 1)
        ->where('currentConversationId', $conversationId)
        ->has('messages', 1)
        ->where('messages.0.role', 'user')
        ->where('messages.0.content', 'Hello')
    );
});

test('conversations API returns only current user conversations', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $conversationA = (string) \Illuminate\Support\Str::uuid7();
    $conversationB = (string) \Illuminate\Support\Str::uuid7();
    DB::table('agent_conversations')->insert([
        ['id' => $conversationA, 'user_id' => $userA->id, 'title' => 'A chat', 'created_at' => now(), 'updated_at' => now()],
        ['id' => $conversationB, 'user_id' => $userB->id, 'title' => 'B chat', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->actingAs($userA);

    $response = $this->getJson(route('chat.conversations'));

    $response->assertOk();
    $response->assertJsonCount(1, 'conversations');
    expect($response->json('conversations.0.id'))->toBe($conversationA);
    expect($response->json('conversations.0.title'))->toBe('A chat');
});

test('user cannot load another user conversation messages', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $conversationB = (string) \Illuminate\Support\Str::uuid7();
    DB::table('agent_conversations')->insert([
        'id' => $conversationB,
        'user_id' => $userB->id,
        'title' => 'B chat',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($userA);

    $response = $this->get(route('chat.index', ['conversation' => $conversationB]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('currentConversationId', null)
        ->where('messages', [])
    );
});

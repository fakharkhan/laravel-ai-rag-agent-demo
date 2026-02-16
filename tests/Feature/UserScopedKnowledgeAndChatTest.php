<?php

use App\Models\ChatConfig;
use App\Models\KnowledgeFile;
use App\Models\User;

test('user only sees their own knowledge files on index', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    KnowledgeFile::query()->create([
        'user_id' => $userA->id,
        'name' => 'a-file.txt',
        'path' => 'knowledge/1/a-file.txt',
        'disk' => 'local',
        'status' => KnowledgeFile::StatusCompleted,
    ]);
    KnowledgeFile::query()->create([
        'user_id' => $userB->id,
        'name' => 'b-file.txt',
        'path' => 'knowledge/2/b-file.txt',
        'disk' => 'local',
        'status' => KnowledgeFile::StatusCompleted,
    ]);

    $this->actingAs($userA);

    $response = $this->get(route('admin.knowledge-files.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/knowledge-files/Index')
        ->has('knowledgeFiles.data', 1)
        ->where('knowledgeFiles.data.0.name', 'a-file.txt')
        ->where('knowledgeFiles.data.0.user_id', $userA->id)
    );
});

test('user cannot delete another user knowledge file', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $fileB = KnowledgeFile::query()->create([
        'user_id' => $userB->id,
        'name' => 'b-file.txt',
        'path' => 'knowledge/2/b-file.txt',
        'disk' => 'local',
        'status' => KnowledgeFile::StatusCompleted,
    ]);

    $this->actingAs($userA);

    $response = $this->delete(route('admin.knowledge-files.destroy', $fileB));

    $response->assertForbidden();
    expect(KnowledgeFile::query()->where('id', $fileB->id)->exists())->toBeTrue();
});

test('user cannot reprocess another user knowledge file', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $fileB = KnowledgeFile::query()->create([
        'user_id' => $userB->id,
        'name' => 'b-file.txt',
        'path' => 'knowledge/2/b-file.txt',
        'disk' => 'local',
        'status' => KnowledgeFile::StatusCompleted,
    ]);

    $this->actingAs($userA);

    $response = $this->post(route('admin.knowledge-files.reprocess', $fileB));

    $response->assertForbidden();
});

test('each user gets their own chat config', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $this->actingAs($userA);
    $this->get(route('admin.chat-config.index'));

    $this->actingAs($userB);
    $this->get(route('admin.chat-config.index'));

    expect(ChatConfig::query()->count())->toBe(2);
    expect(ChatConfig::query()->where('user_id', $userA->id)->exists())->toBeTrue();
    expect(ChatConfig::query()->where('user_id', $userB->id)->exists())->toBeTrue();
});

test('dashboard shows only current user stats', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    KnowledgeFile::query()->create([
        'user_id' => $userB->id,
        'name' => 'b-file.txt',
        'path' => 'knowledge/2/b-file.txt',
        'disk' => 'local',
        'status' => KnowledgeFile::StatusCompleted,
    ]);

    $this->actingAs($userA);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('stats.knowledge_files_total', 0)
        ->where('stats.knowledge_files_ready', 0)
    );
});

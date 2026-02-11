<?php

use App\Models\User;

test('guests are redirected from knowledge files index', function () {
    $response = $this->get(route('admin.knowledge-files.index'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit knowledge files index', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('admin.knowledge-files.index'));
    $response->assertOk();
});

test('authenticated users can visit chat config index', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('admin.chat-config.index'));
    $response->assertOk();
});

test('authenticated users can visit chat index', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('chat.index'));
    $response->assertOk();
});

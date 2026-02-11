<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateChatConfigRequest;
use App\Models\ChatConfig;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ChatConfigController extends Controller
{
    public function index(): Response
    {
        $config = ChatConfig::current();

        return Inertia::render('admin/chat-config/Index', [
            'chatConfig' => [
                'id' => $config->id,
                'system_prompt' => $config->system_prompt,
                'provider' => $config->provider,
                'model' => $config->model,
            ],
            'openAiModels' => [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-4',
                'gpt-3.5-turbo',
            ],
        ]);
    }

    public function update(UpdateChatConfigRequest $request): RedirectResponse
    {
        $config = ChatConfig::current();
        $config->update($request->validated());

        return redirect()->route('admin.chat-config.index')
            ->with('success', 'Chat configuration saved.');
    }
}

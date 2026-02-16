<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateChatConfigRequest;
use App\Models\ChatConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatConfigController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $config = ChatConfig::forUser($user);
        $useOrganizationKey = ChatConfig::useOrganizationKey($user);

        return Inertia::render('admin/chat-config/Index', [
            'chatConfig' => [
                'id' => $config->id,
                'system_prompt' => $config->system_prompt,
                'provider' => $config->provider,
                'model' => $config->model,
                'has_openai_key' => ! $useOrganizationKey && ! empty($config->openai_api_key),
            ],
            'useOrganizationKey' => $useOrganizationKey,
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
        $config = ChatConfig::forUser($request->user());
        $data = $request->validated();

        if (ChatConfig::useOrganizationKey($request->user())) {
            unset($data['openai_api_key']);
        } else {
            if (array_key_exists('openai_api_key', $data) && $data['openai_api_key'] === '') {
                unset($data['openai_api_key']);
            }
        }

        $config->update($data);

        return redirect()->route('admin.chat-config.index')
            ->with('success', 'Chat configuration saved.');
    }
}

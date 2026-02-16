<?php

namespace App\Http\Requests\Admin;

use App\Models\ChatConfig;
use Illuminate\Foundation\Http\FormRequest;

class UpdateChatConfigRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'system_prompt' => ['nullable', 'string', 'max:16000'],
            'provider' => ['required', 'string', 'in:openai'],
            'model' => ['required', 'string', 'max:128'],
        ];

        if (! ChatConfig::useOrganizationKey($this->user())) {
            $rules['openai_api_key'] = ['nullable', 'string', 'max:1024', 'starts_with:sk-'];
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('openai_api_key') && is_string($this->openai_api_key)) {
            $this->merge(['openai_api_key' => trim($this->openai_api_key)]);
        }
    }
}

<?php

namespace App\Http\Requests\Admin;

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
        return [
            'system_prompt' => ['nullable', 'string', 'max:16000'],
            'provider' => ['required', 'string', 'in:openai'],
            'model' => ['required', 'string', 'max:128'],
        ];
    }
}

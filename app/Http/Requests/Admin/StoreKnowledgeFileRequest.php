<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreKnowledgeFileRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:txt,md,csv', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'The file must be a .txt, .md, or .csv file.',
            'file.max' => 'The file may not be greater than 10 MB.',
        ];
    }
}

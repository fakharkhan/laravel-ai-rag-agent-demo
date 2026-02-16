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
            'files' => ['required', 'array'],
            'files.*' => ['required', 'file', 'mimes:txt,md,csv,pdf', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least one file.',
            'files.*.mimes' => 'Each file must be a .txt, .md, .csv, or .pdf file.',
            'files.*.max' => 'Each file may not be greater than 10 MB.',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeFile extends Model
{
    public const string StatusPending = 'pending';

    public const string StatusProcessing = 'processing';

    public const string StatusCompleted = 'completed';

    public const string StatusFailed = 'failed';

    protected $fillable = [
        'name',
        'path',
        'disk',
        'status',
        'error_message',
        'chunks_count',
    ];

    protected function casts(): array
    {
        return [
            'chunks_count' => 'integer',
        ];
    }

    public function isPending(): bool
    {
        return $this->status === self::StatusPending;
    }

    public function isProcessing(): bool
    {
        return $this->status === self::StatusProcessing;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::StatusCompleted;
    }

    public function isFailed(): bool
    {
        return $this->status === self::StatusFailed;
    }
}

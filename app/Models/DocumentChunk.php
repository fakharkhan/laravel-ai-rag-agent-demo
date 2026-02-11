<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Pgvector\Laravel\Distance;
use Pgvector\Laravel\HasNeighbors;
use Pgvector\Laravel\Vector;

class DocumentChunk extends Model
{
    use HasNeighbors;

    protected $connection = 'vector';

    protected $fillable = [
        'knowledge_file_id',
        'content',
        'embedding',
    ];

    protected function casts(): array
    {
        return [
            'embedding' => Vector::class,
        ];
    }

    public function knowledgeFile(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(KnowledgeFile::class);
    }

    public static function nearestTo(vector|array $embedding, int $limit = 5, ?array $knowledgeFileIds = null): \Illuminate\Database\Eloquent\Builder
    {
        $vector = is_array($embedding) ? new Vector($embedding) : $embedding;

        $query = static::query()->nearestNeighbors('embedding', $vector, Distance::Cosine);

        if ($knowledgeFileIds !== null && $knowledgeFileIds !== []) {
            $query->whereIn('knowledge_file_id', $knowledgeFileIds);
        }

        return $query->limit($limit);
    }
}

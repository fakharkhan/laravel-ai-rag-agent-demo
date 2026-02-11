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

    public static function nearestTo(vector|array $embedding, int $limit = 5): \Illuminate\Database\Eloquent\Builder
    {
        $vector = is_array($embedding) ? new Vector($embedding) : $embedding;

        return static::query()
            ->nearestNeighbors('embedding', $vector, Distance::Cosine)
            ->limit($limit);
    }
}

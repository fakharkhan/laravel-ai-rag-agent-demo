<?php

namespace App\Policies;

use App\Models\KnowledgeFile;
use App\Models\User;

class KnowledgeFilePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, KnowledgeFile $knowledgeFile): bool
    {
        return $knowledgeFile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, KnowledgeFile $knowledgeFile): bool
    {
        return $knowledgeFile->user_id === $user->id;
    }

    public function delete(User $user, KnowledgeFile $knowledgeFile): bool
    {
        return $knowledgeFile->user_id === $user->id;
    }

    public function restore(User $user, KnowledgeFile $knowledgeFile): bool
    {
        return $knowledgeFile->user_id === $user->id;
    }

    public function forceDelete(User $user, KnowledgeFile $knowledgeFile): bool
    {
        return $knowledgeFile->user_id === $user->id;
    }
}

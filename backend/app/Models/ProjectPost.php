<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPost extends Model
{
    protected $table = 'project_posts';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];

    protected $casts = [
        'likesCount' => 'integer',
        'commentsCount' => 'integer',
        'tags' => 'array',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function images()
    {
        return $this->hasMany(ProjectImage::class, 'postId', 'id')->orderBy('orderIndex', 'asc');
    }

    public function likes()
    {
        return $this->hasMany(ProjectLike::class, 'postId', 'id');
    }

    public function bookmarks()
    {
        return $this->hasMany(ProjectBookmark::class, 'postId', 'id');
    }

    public function comments()
    {
        return $this->hasMany(ProjectComment::class, 'postId', 'id')->orderBy('createdAt', 'asc');
    }

    public function reports()
    {
        return $this->hasMany(ProjectReport::class, 'postId', 'id');
    }
}

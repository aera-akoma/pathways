<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectImage extends Model
{
    protected $table = 'project_images';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = [
        'orderIndex' => 'integer',
        'createdAt' => 'datetime',
    ];

    public function post()
    {
        return $this->belongsTo(ProjectPost::class, 'postId', 'id');
    }
}

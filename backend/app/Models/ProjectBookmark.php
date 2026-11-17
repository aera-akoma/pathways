<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectBookmark extends Model
{
    protected $table = 'project_bookmarks';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = [
        'createdAt' => 'datetime',
    ];
}

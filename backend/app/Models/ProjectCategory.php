<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectCategory extends Model
{
    protected $table = 'project_categories';
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
}

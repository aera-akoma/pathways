<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectReport extends Model
{
    protected $table = 'project_reports';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = [
        'createdAt' => 'datetime',
    ];

    public function post()
    {
        return $this->belongsTo(ProjectPost::class, 'postId', 'id');
    }
}

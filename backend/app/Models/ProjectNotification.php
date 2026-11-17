<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectNotification extends Model
{
    protected $table = 'project_notifications';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = [
        'isRead' => 'boolean',
        'createdAt' => 'datetime',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Model
{
    use HasApiTokens;

    protected $table = 'admins';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];

    protected $hidden = [
        'passwordHash',
        'salt',
    ];

    protected $casts = [
        'permissions' => 'array',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function isMainAdmin(): bool
    {
        return in_array($this->id, ['admin-jatp-main', 'admin-root', 'admin-podar-root'], true)
            || in_array(strtolower(trim($this->email)), ['jatp22316@gmail.com', 'admin@podar.edu'], true);
    }
}

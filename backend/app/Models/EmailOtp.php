<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailOtp extends Model
{
    protected $table = 'email_otps';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'isUsed' => 'boolean',
        'attempts' => 'integer',
        'createdAt' => 'integer',
        'expiresAt' => 'integer',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $table = 'programs';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];

    protected $casts = [
        'rewardPoints' => 'integer',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function clicks()
    {
        return $this->hasMany(ProgramClick::class, 'programId', 'id');
    }
}

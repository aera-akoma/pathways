<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    protected $table = 'tests';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];

    protected $casts = [
        'durationMinutes' => 'integer',
        'totalMarks' => 'integer',
        'passingMarks' => 'integer',
        'rewardPoints' => 'integer',
        'questions' => 'array',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function submissions()
    {
        return $this->hasMany(TestSubmission::class, 'testId', 'id');
    }
}

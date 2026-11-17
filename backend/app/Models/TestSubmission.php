<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestSubmission extends Model
{
    protected $table = 'test_submissions';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'submittedAt';
    const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = [
        'score' => 'integer',
        'totalMarks' => 'integer',
        'percentage' => 'integer',
        'timeSpentSeconds' => 'integer',
        'answers' => 'array',
        'submittedAt' => 'datetime',
        'checkedAt' => 'datetime',
    ];

    public function test()
    {
        return $this->belongsTo(Test::class, 'testId', 'id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentId', 'id');
    }
}

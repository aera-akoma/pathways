<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table = 'attendance';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'markedAt';
    const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = [
        'markedAt' => 'datetime',
    ];

    public function schedule()
    {
        return $this->belongsTo(ScheduleEvent::class, 'scheduleId', 'id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentId', 'id');
    }
}

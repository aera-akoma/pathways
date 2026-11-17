<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleEvent extends Model
{
    protected $table = 'schedules';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];

    protected $casts = [
        'isMandatory' => 'boolean',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function attendance()
    {
        return $this->hasMany(Attendance::class, 'scheduleId', 'id');
    }
}

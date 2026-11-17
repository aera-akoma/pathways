<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Student extends Model
{
    use HasApiTokens;

    protected $table = 'students';
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
        'addedByAdmin' => 'boolean',
        'isRegistered' => 'boolean',
        'score' => 'integer',
        'completion' => 'integer',
        'applications' => 'integer',
        'projects' => 'integer',
        'certificates' => 'integer',
        'dob' => 'date',
        'profileCompletedAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    public function projectPosts()
    {
        return $this->hasMany(ProjectPost::class, 'studentId', 'id');
    }

    public function projectLikes()
    {
        return $this->hasMany(ProjectLike::class, 'studentId', 'id');
    }

    public function projectBookmarks()
    {
        return $this->hasMany(ProjectBookmark::class, 'studentId', 'id');
    }

    public function testSubmissions()
    {
        return $this->hasMany(TestSubmission::class, 'studentId', 'id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(Attendance::class, 'studentId', 'id');
    }
}

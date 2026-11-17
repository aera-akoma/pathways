<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramClick extends Model
{
    protected $table = 'program_clicks';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'clickedAt' => 'datetime',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class, 'programId', 'id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'settings';
    protected $primaryKey = 'setting_key';
    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'setting_key',
        'setting_value',
    ];

    public static function getVal(string $key, ?string $default = null): ?string
    {
        $setting = static::find($key);
        return $setting ? $setting->setting_value : $default;
    }

    public static function setVal(string $key, string $value): void
    {
        static::updateOrCreate(['setting_key' => $key], ['setting_value' => $value]);
    }
}

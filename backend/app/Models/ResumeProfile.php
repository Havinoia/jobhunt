<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ResumeProfile Model — JobHunt
 *
 * Stores the extracted skills and text from a user's
 * uploaded CV/Resume PDF. One user has one profile.
 */
class ResumeProfile extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'original_filename',
        'file_path',
        'category',
        'extracted_text',
        'extracted_skills',
        'report',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'extracted_skills' => 'array',
            'report'           => 'array',
        ];
    }

    /* ─── Relationships ─── */

    /**
     * The user who owns this resume profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

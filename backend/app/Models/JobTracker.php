<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * JobTracker Model — JobHunt
 *
 * Tracks job postings saved by a user with their
 * AI match scores, skill gaps, and application status.
 */
class JobTracker extends Model
{
    use HasFactory, HasUuids;

    /**
     * Valid status transitions for the tracker.
     */
    public const STATUSES = [
        'saved',
        'applied',
        'interview',
        'rejected',
        'offering',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'job_title',
        'company_name',
        'linkedin_job_url',
        'match_score',
        'skill_gap',
        'status',
        'applied_date',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'skill_gap'    => 'array',
            'match_score'  => 'integer',
            'applied_date' => 'datetime',
        ];
    }

    /* ─── Relationships ─── */

    /**
     * The user who owns this tracker entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* ─── Scopes ─── */

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to order by match score (highest first).
     */
    public function scopeTopMatches($query)
    {
        return $query->orderByDesc('match_score');
    }
}

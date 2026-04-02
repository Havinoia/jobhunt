<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * User Model — JobHunt
 *
 * Represents an authenticated user of the platform.
 * Uses UUID primary keys and Sanctum API tokens
 * for Chrome Extension authentication.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar_url',
        'password',
        'google_auth_id',
        'tier',
        'daily_analysis_count',
        'last_analysis_date',
        'verification_code',
        'verification_sent_at',
    ];

    /**
     * Send a 6‑digit verification code to the user's email.
     */
    public function sendVerificationCode(): void
    {
        $code = random_int(100000, 999999);
        $this->verification_code = (string) $code;
        $this->verification_sent_at = now();
        $this->save();

        \Illuminate\Support\Facades\Mail::to($this->email)->send(new \App\Mail\VerificationCodeMail($code));
    }

    /* ─── Usage Limit Constants ─── */
    public const FREEMIUM_DAILY_LIMIT = 5;
    public const PREMIUM_DAILY_LIMIT  = 20;

    /** Admin emails — unlimited access, no restrictions */
    public const ADMIN_EMAILS = [
        // 'antonleonardo65@gmail.com',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_auth_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /* ─── Relationships ─── */

    /**
     * The user's resume profile (one-to-one).
     */
    public function resumeProfile(): HasOne
    {
        return $this->hasOne(ResumeProfile::class);
    }

    /**
     * The user's tracked jobs (one-to-many).
     */
    public function jobTrackers(): HasMany
    {
        return $this->hasMany(JobTracker::class);
    }

    /* ─── Helpers ─── */

    public function isPremium(): bool
    {
        return strtolower($this->tier) === 'premium' || $this->isAdmin();
    }

    public function isAdmin(): bool
    {
        return in_array($this->email, self::ADMIN_EMAILS, true);
    }

    /**
     * Get the daily analysis limit based on tier.
     */
    public function getDailyLimit(): int
    {
        return $this->isPremium()
            ? self::PREMIUM_DAILY_LIMIT
            : self::FREEMIUM_DAILY_LIMIT;
    }

    /**
     * Get remaining analyses for today.
     */
    public function getRemainingAnalyses(): int
    {
        $this->resetDailyCountIfNeeded();
        return max(0, $this->getDailyLimit() - $this->daily_analysis_count);
    }

    /**
     * Check if user can perform analysis.
     */
    public function canAnalyze(): bool
    {
        if ($this->isAdmin()) return true;
        return $this->getRemainingAnalyses() > 0;
    }

    /**
     * Consume one analysis credit.
     */
    public function consumeAnalysis(): void
    {
        $this->resetDailyCountIfNeeded();
        $this->increment('daily_analysis_count');
    }

    /**
     * Get a formatted usage data object for API responses.
     */
    public function getUsageData(): array
    {
        return [
            'used'      => $this->daily_analysis_count,
            'limit'     => $this->getDailyLimit(),
            'remaining' => $this->getRemainingAnalyses(),
            'resetAt'  => now()->tomorrow()->startOfDay()->toIso8601String(),
        ];
    }

    /**
     * Reset counter if it's a new day.
     */
    private function resetDailyCountIfNeeded(): void
    {
        $today = now()->toDateString();
        if ($this->last_analysis_date !== $today) {
            $this->update([
                'daily_analysis_count' => 0,
                'last_analysis_date'   => $today,
            ]);
        }
    }

    /**
     * Ensure tier is always lowercase for consistency.
     */
    public function setTierAttribute($value)
    {
        $this->attributes['tier'] = strtolower(trim($value));
    }
}

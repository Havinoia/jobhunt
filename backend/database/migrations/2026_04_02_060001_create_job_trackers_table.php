<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: job_trackers
 *
 * Tracks job postings saved by users with their
 * AI-generated match scores and skill gap analysis.
 * Supports Kanban-style status tracking.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_trackers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->string('job_title');
            $table->string('company_name');
            $table->string('linkedin_job_url');
            $table->unsignedTinyInteger('match_score')->nullable(); // 0-100
            $table->json('skill_gap')->nullable();
            $table->enum('status', [
                'saved',
                'applied',
                'interview',
                'rejected',
                'offering',
            ])->default('saved');
            $table->timestamp('applied_date')->nullable();
            $table->timestamps();

            // Indexes for common queries
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'match_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_trackers');
    }
};

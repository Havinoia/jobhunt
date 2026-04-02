<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: resume_profiles
 *
 * Stores extracted CV/Resume data for each user.
 * The AI processes the uploaded PDF and stores the
 * extracted text and skill list as structured data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resume_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->string('original_filename');
            $table->text('extracted_text')->nullable();
            $table->json('extracted_skills')->nullable();
            $table->timestamps();

            // Each user has at most one resume profile
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resume_profiles');
    }
};

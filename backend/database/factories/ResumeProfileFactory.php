<?php

namespace Database\Factories;

use App\Models\ResumeProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResumeProfile>
 */
class ResumeProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id'          => User::factory(),
            'original_filename' => fake()->word() . '.pdf',
            'file_path'         => 'resumes/' . fake()->uuid() . '.pdf',
            'category'          => fake()->word(),
            'extracted_text'    => fake()->paragraph(),
            'extracted_skills'  => [fake()->word(), fake()->word()],
            'report'            => ['summary' => fake()->sentence()],
        ];
    }
}

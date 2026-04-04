<?php

namespace Database\Factories;

use App\Models\JobTracker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobTracker>
 */
class JobTrackerFactory extends Factory
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
            'job_title'        => fake()->jobTitle(),
            'company_name'     => fake()->company(),
            'linkedin_job_url' => fake()->url(),
            'match_score'      => fake()->numberBetween(0, 100),
            'skill_gap'        => [fake()->word(), fake()->word()],
            'status'           => fake()->randomElement(JobTracker::STATUSES),
        ];
    }
}

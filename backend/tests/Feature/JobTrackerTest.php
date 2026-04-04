<?php

namespace Tests\Feature;

use App\Models\JobTracker;
use App\Models\ResumeProfile;
use App\Models\User;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobTrackerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_analyze_job()
    {
        $user = User::factory()->create(['tier' => 'freemium']);
        \App\Models\ResumeProfile::factory()->create([
            'user_id'          => $user->id,
            'extracted_skills' => ['PHP', 'Laravel', 'React'],
        ]);

        $this->mock(GeminiService::class, function ($mock) {
            $mock->shouldReceive('analyzeMatch')->andReturn([
                'match_score'    => 85,
                'matched_skills' => ['PHP', 'Laravel'],
                'missing_skills' => ['Docker'],
                'summary'       => 'Good match but missing Docker.',
            ]);
        });

        $response = $this->actingAs($user)->postJson('/api/jobs/analyze', [
            'jobData' => [
                'jobTitle'       => 'Software Engineer',
                'companyName'    => 'Google',
                'jobDescription' => 'We need someone with PHP and Laravel.',
                'linkedinJobUrl' => 'https://linkedin.com/jobs/123',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['matchResult', 'skillGaps', 'usage']);
        
        $this->assertEquals(1, $user->fresh()->daily_analysis_count);
    }

    public function test_user_can_track_job()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/jobs/track', [
            'jobData' => [
                'jobTitle'       => 'Senior PHP Developer',
                'companyName'    => 'Meta',
                'linkedinJobUrl' => 'https://linkedin.com/jobs/456',
            ],
            'matchScore' => 90,
            'skillGap'   => ['AWS'],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'jobTitle', 'companyName', 'matchScore']);

        $this->assertDatabaseHas('job_trackers', [
            'user_id'   => $user->id,
            'job_title' => 'Senior PHP Developer',
        ]);
    }

    public function test_user_can_list_tracked_jobs()
    {
        $user = User::factory()->create();
        JobTracker::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/jobs/tracker');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_user_can_update_job_status()
    {
        $user = User::factory()->create();
        $tracker = JobTracker::factory()->create(['user_id' => $user->id, 'status' => 'saved']);

        $response = $this->actingAs($user)->putJson("/api/jobs/tracker/{$tracker->id}", [
            'status' => 'applied',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('applied', $tracker->fresh()->status);
    }

    public function test_user_can_delete_job()
    {
        $user = User::factory()->create();
        $tracker = JobTracker::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/jobs/tracker/{$tracker->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('job_trackers', ['id' => $tracker->id]);
    }
}

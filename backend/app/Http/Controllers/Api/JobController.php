<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobTracker;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * JobController — JobHunt
 *
 * Handles job analysis (AI match scoring) and
 * CRUD operations for the job tracker board.
 */
class JobController extends Controller
{
    public function __construct(
        private readonly GeminiService $geminiService
    ) {}

    /**
     * Analyze a job posting against the user's CV skills.
     * Sends data to Gemini AI for match scoring.
     *
     * POST /api/jobs/analyze
     */
    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'jobData'                => 'required|array',
            'jobData.jobTitle'       => 'required|string',
            'jobData.companyName'    => 'required|string',
            'jobData.jobDescription' => 'required|string',
            'jobData.linkedinJobUrl' => 'required|string',
        ]);

        $user    = $request->user();
        $jobData = $request->input('jobData');

        // Check usage limit
        if (!$user->canAnalyze()) {
            return response()->json([
                'message' => 'Daily analysis limit reached. Upgrade to Premium for unlimited analyses.',
                'usage'   => [
                    'used'      => $user->daily_analysis_count,
                    'limit'     => $user->getDailyLimit(),
                    'remaining' => 0,
                ],
            ], 429);
        }

        // Get user's extracted skills from their resume profile
        $profile = $user->resumeProfile;

        if (!$profile || empty($profile->extracted_skills)) {
            return response()->json([
                'message' => 'Please upload your CV first to enable match analysis.',
            ], 422);
        }

        // Call Gemini AI for match scoring
        $analysisResult = $this->geminiService->analyzeMatch(
            $profile->extracted_skills,
            $jobData['jobDescription']
        );

        // Consume one analysis credit
        $user->consumeAnalysis();

        return response()->json([
            'matchResult' => [
                'matchScore'    => $analysisResult['match_score'],
                'matchedSkills' => $analysisResult['matched_skills'],
                'missingSkills' => $analysisResult['missing_skills'],
                'summary'       => $analysisResult['summary'],
            ],
            'skillGaps' => collect($analysisResult['missing_skills'] ?? [])
                ->map(fn(string $skill) => [
                    'skill'      => $skill,
                    'importance' => 'medium',
                    'suggestion' => "Consider learning {$skill} to improve your match.",
                ])
                ->values()
                ->all(),
            'usage'     => $user->getUsageData(),
        ]);
    }

    /**
     * Save a job posting to the user's tracker.
     *
     * POST /api/jobs/track
     */
    public function store(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Save Job Payload:', $request->all());
        try {
            $request->validate([
                'jobData'                => 'required|array',
                'jobData.jobTitle'       => 'required|string',
                'jobData.companyName'    => 'nullable|string',
                'jobData.linkedinJobUrl' => 'nullable|string',
                'matchScore'             => 'nullable|integer|min:0|max:100',
                'skillGap'               => 'nullable|array',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Job Tracker Validation Failed:', $e->errors());
            throw $e;
        }

        $user    = $request->user();
        $jobData = $request->input('jobData');

        $tracker = JobTracker::create([
            'user_id'          => $user->id,
            'job_title'        => $jobData['jobTitle'],
            'company_name'     => $jobData['companyName'] ?? 'Unknown',
            'linkedin_job_url' => $jobData['linkedinJobUrl'] ?? '',
            'match_score'      => $request->input('matchScore'),
            'skill_gap'        => $request->input('skillGap'),
            'status'           => 'saved',
        ]);

        return response()->json($this->formatTracker($tracker), 201);
    }

    /**
     * List all tracked jobs for the authenticated user.
     *
     * GET /api/jobs/tracker
     */
    public function index(Request $request): JsonResponse
    {
        $trackers = $request->user()
            ->jobTrackers()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(JobTracker $t) => $this->formatTracker($t));

        return response()->json($trackers);
    }

    /**
     * Update a tracked job's status.
     *
     * PUT /api/jobs/tracker/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(JobTracker::STATUSES)],
        ]);

        $tracker = $request->user()
            ->jobTrackers()
            ->findOrFail($id);

        $tracker->update([
            'status'       => $request->input('status'),
            'applied_date' => $request->input('status') === 'applied'
                ? now()
                : $tracker->applied_date,
        ]);

        return response()->json($this->formatTracker($tracker->fresh()));
    }

    /**
     * Delete a tracked job.
     *
     * DELETE /api/jobs/tracker/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $tracker = $request->user()
            ->jobTrackers()
            ->findOrFail($id);

        $tracker->delete();

        return response()->json(null, 204);
    }

    /**
     * Format a JobTracker model for API response.
     */
    private function formatTracker(JobTracker $tracker): array
    {
        return [
            'id'             => $tracker->id,
            'userId'         => $tracker->user_id,
            'jobTitle'       => $tracker->job_title,
            'companyName'    => $tracker->company_name,
            'linkedinJobUrl' => $tracker->linkedin_job_url,
            'matchScore'     => $tracker->match_score,
            'skillGap'       => $tracker->skill_gap,
            'status'         => $tracker->status,
            'appliedDate'    => $tracker->applied_date?->toISOString(),
            'createdAt'      => $tracker->created_at->toISOString(),
            'updatedAt'      => $tracker->updated_at->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResumeProfile;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ResumeController — JobHunt
 *
 * Handles CV/Resume upload and AI-powered skill extraction.
 * PDF text is extracted and sent to Google Gemini for
 * structured skill identification.
 */
class ResumeController extends Controller
{
    public function __construct(
        private readonly GeminiService $geminiService
    ) {}

    /**
     * Upload a resume PDF and extract skills via AI.
     *
     * POST /api/resume/upload
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'resume' => 'required|file|mimes:pdf|max:2048', // Max 2MB
        ]);

        $user = $request->user();

        // Check usage limit
        if (!$user->canAnalyze()) {
            $message = $user->tier === 'premium' 
                ? 'Daily analysis limit reached.'
                : 'Daily analysis limit reached. Upgrade to Premium for 20x higher limits.';

            return response()->json([
                'message' => $message,
                'usage'   => $user->getUsageData(),
            ], 429);
        }

        $file = $request->file('resume');

        // Extract text from PDF
        $extractedText = $this->extractTextFromPdf($file);

        if (empty($extractedText)) {
            return response()->json([
                'message' => 'Could not extract text from the PDF. Please ensure the file is not image-based.',
            ], 422);
        }

        // Use Career Intelligence Engine to analyze the CV
        $report = $this->geminiService->extractSkills($extractedText);
        
        // Map data for legacy compatibility
        $extractedSkills = $report['extracted_data']['skills_hard'] ?? [];
        $category = $report['analysis_metadata']['primary_domain'] ?? 'General Professional';

        // Store physical PDF file
        $path = $file->store('resumes', 'public');

        // Create or update the user's resume profile
        $profile = ResumeProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'original_filename' => $file->getClientOriginalName(),
                'file_path'         => $path,
                'category'          => $category,
                'extracted_text'    => $extractedText,
                'extracted_skills'  => $extractedSkills,
                'report'            => $report,
            ]
        );

        // Consume one analysis credit
        $user->consumeAnalysis();

        return response()->json([
            'id'               => $profile->id,
            'userId'           => $profile->user_id,
            'originalFilename' => $profile->original_filename,
            'pdf_url'          => asset('storage/' . $profile->file_path),
            'category'         => $profile->category,
            'extractedSkills'  => $profile->extracted_skills,
            'report'           => $profile->report,
            'updatedAt'        => $profile->updated_at->toISOString(),
            'usage' => $user->getUsageData(),
        ]);
    }

    /**
     * Get the authenticated user's extracted skills.
     *
     * GET /api/resume/skills
     */
    public function skills(Request $request): JsonResponse
    {
        $profile = $request->user()->resumeProfile;

        if (!$profile) {
            return response()->json([
                'message' => 'No resume profile found. Please upload your CV first.',
            ], 404);
        }

        return response()->json([
            'id'               => $profile->id,
            'userId'           => $profile->user_id,
            'originalFilename' => $profile->original_filename,
            'pdf_url'          => $profile->file_path ? asset('storage/' . $profile->file_path) : null,
            'category'         => $profile->category,
            'extractedSkills'  => $profile->extracted_skills,
            'report'           => $profile->report,
            'updatedAt'        => $profile->updated_at->toISOString(),
        ]);
    }

    /**
     * Delete the authenticated user's resume profile.
     *
     * DELETE /api/resume
     */
    public function destroy(Request $request): JsonResponse
    {
        $profile = $request->user()->resumeProfile;

        if ($profile) {
            $profile->delete();
        }

        return response()->json(null, 204);
    }

    /**
     * Extract raw text from a PDF file using Smalot PDF Parser.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @return string
     */
    private function extractTextFromPdf($file): string
    {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($file->getRealPath());
            $text = $pdf->getText();

            // Cleanup the extracted text
            $text = preg_replace('/\s+/', ' ', $text);
            $text = trim($text);

            return $text;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('[ResumeController] PDF extraction failed', [
                'error' => $e->getMessage(),
            ]);
            return '';
        }
    }
}

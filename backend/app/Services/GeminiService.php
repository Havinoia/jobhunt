<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GeminiService — JobHunt (Groq Backend)
 *
 * Uses Groq's OpenAI-compatible API for:
 * 1. Extracting structured skills from CV/Resume text
 * 2. Analyzing match scores between user skills and job descriptions
 */
class GeminiService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey  = config('services.groq.api_key', '');
        $this->model   = config('services.groq.model', 'llama-3.3-70b-versatile');
        $this->baseUrl = config('services.groq.base_url', 'https://api.groq.com/openai/v1');
    }

    /**
     * Extract structured skills from CV/Resume text.
     */
    public function extractSkills(string $resumeText): array
    {
        $systemPrompt = 'Anda adalah "Career Intelligence Engine" untuk ekstensi Chrome JobHunt. Tugas Anda adalah melakukan audit kompetensi pada CV APAPUN dan memetakan jalur karier yang akurat. Kembalikan HANYA JSON murni tanpa markdown atau penjelasan.';

        $userPrompt = <<<PROMPT
Gunakan LOGIKA FILTERING berikut agar tidak memberikan rekomendasi ngawur:

1. CORE COMPETENCY MAPPING:
   - Ekstrak "Hard Skills" (Alat, Software, Metodologi).
   - Ekstrak "Domain Knowledge" (Industri: Manufaktur, Edukasi, Retail, Tech, dll).
   - Ekstrak "Senioritas" (Fresh Graduate, Junior, Mid, Senior) berdasarkan durasi dan kompleksitas tugas.

2. BILINGUAL SEMANTIC CROSS-CHECK:
   - Hubungkan istilah Indonesia ke standar Global (Contoh: "Bendahara" -> "Treasury/Finance", "Guru" -> "Educator/Trainer").
   - Jika ada publikasi/artikel ilmiah, kategorikan sebagai "Research & Analytical Skills".

3. ANTI-NGWUR RECOMMENDATION RULES:
   - JANGAN merekomendasikan posisi Senior jika pengalaman < 5 tahun.
   - JANGAN merekomendasikan posisi Medis jika tidak ada latar belakang kesehatan.
   - JANGAN hanya mengandalkan Nama Jurusan, tapi lihat "Tugas Spesifik" di pengalaman kerja.

Analisis teks CV berikut tanpa bias jurusan, fokus pada "Functional Skills" dan "Experience Facts":

---
{$resumeText}
---

Hasilkan struktur data JSON berikut:
{
  "analysis_metadata": {
    "detected_language": "Indonesian/English/Mixed",
    "career_level": "Entry/Junior/Senior/Lead",
    "primary_domain": "Field of work"
  },
  "extracted_data": {
    "skills_hard": ["Skill teknis"],
    "skills_soft": ["Skill interpersonal"],
    "tools_and_apps": ["Software/Tools"],
    "credentials": ["Sertifikasi/Lisensi"]
  },
  "job_recommendations": [
    {
      "role_title": "Jabatan Spesifik",
      "relevance_score": 95,
      "logic_reasoning": "Reason connecting skills to role",
      "market_demand": "High/Medium",
      "search_keywords": ["kw1", "kw2"]
    }
  ],
  "skill_gap_analysis": {
    "missing_common_skills": ["Commonly expected skills for these roles"],
    "upskilling_suggestion": "Suggested courses or certifications"
  }
}
PROMPT;

        $response = $this->callApi($systemPrompt, $userPrompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * Analyze match between user skills and a job description.
     */
    public function analyzeMatch(array $userSkills, string $jobDescription): array
    {
        $skillsList = implode(', ', $userSkills);

        $systemPrompt = 'You are an expert career advisor. Analyze skill matches and return ONLY valid JSON. No markdown, no explanation.';

        $userPrompt = <<<PROMPT
Compare candidate skills with job requirements.

CANDIDATE SKILLS: {$skillsList}

JOB DESCRIPTION:
---
{$jobDescription}
---

Return JSON:
{"match_score": 85, "matched_skills": ["React", "TypeScript"], "missing_skills": ["GraphQL"], "summary": "Brief assessment."}

Rules:
- match_score: 0-100, be realistic
- 70+ = good fit, 85+ = excellent fit
PROMPT;

        $response = $this->callApi($systemPrompt, $userPrompt);
        $data = $this->parseJsonResponse($response);

        return [
            'match_score'    => min(100, max(0, (int) ($data['match_score'] ?? 0))),
            'matched_skills' => $data['matched_skills'] ?? [],
            'missing_skills' => $data['missing_skills'] ?? [],
            'summary'        => $data['summary'] ?? 'Analysis complete.',
        ];
    }

    /**
     * Call the Groq OpenAI-compatible API.
     */
    private function callApi(string $systemPrompt, string $userPrompt): string
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException(
                'Groq API key is not configured. Set GROQ_API_KEY in your .env file.'
            );
        }

        $url = "{$this->baseUrl}/chat/completions";

        try {
            $response = Http::timeout(30)
                ->retry(2, 1000)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type'  => 'application/json',
                ])
                ->post($url, [
                    'model'    => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user',   'content' => $userPrompt],
                    ],
                    'temperature'      => 0.3,
                    'max_tokens'       => 2048,
                    'response_format'  => ['type' => 'json_object'],
                ]);

            if (!$response->successful()) {
                Log::error('[AI Service] API error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                throw new \RuntimeException(
                    "AI API returned status {$response->status()}: {$response->body()}"
                );
            }

            $body = $response->json();
            return $body['choices'][0]['message']['content'] ?? '';

        } catch (\Exception $e) {
            Log::error('[AI Service] Request failed', [
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException(
                'Failed to communicate with AI service: ' . $e->getMessage()
            );
        }
    }

    /**
     * Parse JSON response, stripping any markdown code blocks.
     */
    private function parseJsonResponse(string $response): array
    {
        $cleaned = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($response));
        $data = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('[AI Service] Failed to parse JSON', [
                'response' => $response,
                'error'    => json_last_error_msg(),
            ]);
            return [];
        }

        return $data;
    }
}

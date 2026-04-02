<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\VerificationCodeMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Exchange a Google OAuth access token for a Sanctum API token.
     *
     * POST /api/auth/google
     */
    public function loginWithGoogle(Request $request): JsonResponse
    {
        $request->validate([
            'access_token' => 'required|string',
        ]);

        $googleUser = $this->getGoogleUserInfo($request->access_token);
        if (! $googleUser) {
            return response()->json(['message' => 'Invalid Google access token.'], 401);
        }

        $user = User::updateOrCreate(
            ['google_auth_id' => $googleUser['id']],
            ['name' => $googleUser['name'], 'email' => $googleUser['email']]
        );

        $user->tokens()->where('name', 'chrome-extension')->delete();

        $token = $user->createToken('chrome-extension')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'tier' => $user->tier,
            ],
            'usage' => $user->getUsageData(),
        ]);
    }

    /**
     * Register a new user with email and password (Freemium).
     *
     * POST /auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required',
                'string',
                'min:8',
                // Must contain at least one symbol
                'regex:/[!@#$%^&*(),.?\":{}|<>]/',
            ],
        ]);

        $user = User::create([
            'name' => explode('@', $request->email)[0],
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'tier' => 'freemium',
        ]);

        $user->sendVerificationCode();

        return response()->json(['message' => 'verification_sent'], 201);
    }

    /**
     * Verify the email with the 6‑digit code.
     *
     * POST /auth/verify
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user || $user->verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code.'], 400);
        }

        if ($user->verification_sent_at && now()->diffInMinutes($user->verification_sent_at) > 10) {
            return response()->json(['message' => 'Verification code expired.'], 400);
        }

        $user->email_verified_at = now();
        $user->verification_code = null;
        $user->verification_sent_at = null;
        $user->save();

        $token = $user->createToken('chrome-extension')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'tier' => $user->tier,
            ],
            'usage' => $user->getUsageData(),
        ]);
    }

    /**
     * Login with email and password (Freemium).
     *
     * POST /auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->email_verified_at) {
            return response()->json(['message' => 'Email not verified.'], 403);
        }

        $token = $user->createToken('chrome-extension')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'tier' => $user->tier,
            ],
            'usage' => $user->getUsageData(),
        ]);
    }

    /**
     * Get the authenticated user's profile.
     *
     * GET /api/user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'tier' => $user->tier,
            'usage' => $user->getUsageData(),
        ]);
    }

    /**
     * Revoke the current API token (logout).
     *
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Validate a Google access token and retrieve user info.
     *
     * @param  string  $accessToken
     * @return array|null
     */
    private function getGoogleUserInfo(string $accessToken): ?array
    {
        try {
            $response = Http::withToken($accessToken)
                ->get('https://www.googleapis.com/oauth2/v2/userinfo');

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'id' => $data['id'] ?? null,
                    'name' => $data['name'] ?? 'Unknown',
                    'email' => $data['email'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            report($e);
        }

        return null;
    }
}
?>

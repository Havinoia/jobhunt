<?php
  
namespace App\Http\Controllers\Api;
  
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\User;
  
class SubscriptionController extends Controller
{
    protected $projectSlug;
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->projectSlug = config('services.pakasir.project_slug');
        $this->apiKey = config('services.pakasir.api_key');
        $this->baseUrl = config('services.pakasir.base_url', 'https://app.pakasir.com/api');
    }

    public function checkout(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            if ($user->tier === 'premium') {
                return response()->json(['message' => 'You are already a Premium user.'], 400);
            }

            $orderId = 'PREMIUM_' . $user->id . '_' . time();
            $amount = 40000;

            // Construct the Pakasir Hosted Checkout URL 
            // Pattern: https://app.pakasir.com/pay/{project_slug}/{amount}?order_id={order_id}
            $checkoutUrl = sprintf(
                'https://app.pakasir.com/pay/%s/%d?order_id=%s&qris_only=1',
                $this->projectSlug,
                $amount,
                $orderId
            );

            return response()->json([
                'token' => $orderId,
                'redirect_url' => $checkoutUrl
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function webhook(Request $request)
    {
        $payload = $request->all();
        
        // Robust check: If payload is empty or malformed (happens in some CLI tools), try raw content
        if (empty($payload) || (count($payload) === 1 && array_values($payload)[0] === null)) {
            $raw = $request->getContent();
            $decoded = json_decode($raw, true);
            if ($decoded) $payload = $decoded;
        }

        \Illuminate\Support\Facades\Log::info('Pakasir Webhook Payload Received:', $payload);
        
        $orderId = $payload['order_id'] ?? '';
        $status = $payload['status'] ?? ''; // 'success', 'completed', etc.

        if (strpos($orderId, 'PREMIUM_') === 0) {
            if ($status === 'success' || $status === 'completed') {
                $parts = explode('_', $orderId);
                $userId = $parts[1] ?? '';
                if ($userId) {
                    $user = \App\Models\User::find($userId);
                    if ($user) {
                        $user->update(['tier' => 'premium']);
                        \Illuminate\Support\Facades\Log::info("User {$userId} upgraded to premium successfully.");
                    }
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}

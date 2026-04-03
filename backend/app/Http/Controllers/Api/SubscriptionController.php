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

        \Illuminate\Support\Facades\Log::info('[Pakasir Webhook] Received:', $payload);
        
        $orderId = $payload['order_id'] ?? null;
        $status = $payload['status'] ?? null; // 'success', 'completed', etc.
        $amount = $payload['amount'] ?? null;

        if (!$orderId || !$status) {
            \Illuminate\Support\Facades\Log::warning('[Pakasir Webhook] Incomplete payload.', ['payload' => $payload]);
            return response()->json(['status' => 'error', 'message' => 'Incomplete payload'], 400);
        }

        // Process only PREMIUM subscription orders
        if (strpos($orderId, 'PREMIUM_') === 0) {
            if ($status === 'success' || $status === 'completed') {
                $parts = explode('_', $orderId);
                $userId = $parts[1] ?? null;

                if ($userId) {
                    try {
                        \Illuminate\Support\Facades\DB::transaction(function () use ($userId, $orderId) {
                            $user = \App\Models\User::lockForUpdate()->find($userId);
                            if ($user && $user->tier !== 'premium') {
                                $user->update(['tier' => 'premium']);
                                \Illuminate\Support\Facades\Log::info("[Pakasir Webhook] User {$userId} upgraded to premium. Order ID: {$orderId}");
                            }
                        });
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error("[Pakasir Webhook] Database error for user {$userId}: " . $e->getMessage());
                        return response()->json(['status' => 'error', 'message' => 'Database error'], 500);
                    }
                } else {
                    \Illuminate\Support\Facades\Log::warning("[Pakasir Webhook] Valid status but no User ID found in Order ID: {$orderId}");
                }
            } else {
                \Illuminate\Support\Facades\Log::info("[Pakasir Webhook] Order {$orderId} status: {$status}. No action taken.");
            }
        }

        return response()->json(['status' => 'ok']);
    }
}

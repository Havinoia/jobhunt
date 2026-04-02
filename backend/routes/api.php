<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| JobHunt API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically.
| Authentication uses Laravel Sanctum token-based auth.
|
*/

/* ─── Public Routes ─── */
Route::post('/auth/google', [AuthController::class, 'loginWithGoogle']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/verify', [AuthController::class, 'verify']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/webhooks/pakasir', [SubscriptionController::class, 'webhook']);

/* ─── Protected Routes (Sanctum Auth) ─── */
Route::middleware('auth:sanctum')->group(function () {

    /* ── Authentication & Profile ── */
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/user/avatar', [AuthController::class, 'updateAvatar']);
    Route::post('/user/password/request', [AuthController::class, 'requestPasswordChange']);
    Route::post('/user/password/confirm', [AuthController::class, 'confirmPasswordChange']);

    /* ── Subscription ── */
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout']);

    /* ── Resume / CV Management ── */
    Route::post('/resume/upload', [ResumeController::class, 'upload']);
    Route::get('/resume/skills', [ResumeController::class, 'skills']);
    Route::delete('/resume', [ResumeController::class, 'destroy']);

    /* ── Job Analysis & Tracking ── */
    Route::post('/jobs/analyze', [JobController::class, 'analyze']);
    Route::post('/jobs/track', [JobController::class, 'store']);
    Route::get('/jobs/tracker', [JobController::class, 'index']);
    Route::put('/jobs/tracker/{id}', [JobController::class, 'update']);
    Route::delete('/jobs/tracker/{id}', [JobController::class, 'destroy']);
});

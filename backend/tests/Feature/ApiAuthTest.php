<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ApiAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/register', [
            'name'     => 'Test User',
            'email'    => 'test@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'verification_sent']);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name'  => 'Test User',
        ]);
        
        $user = User::where('email', 'test@example.com')->first();
        $this->assertNotNull($user->verification_code);
    }

    public function test_user_can_verify_email()
    {
        $user = User::factory()->create([
            'email'             => 'test@example.com',
            'verification_code' => '123456',
            'verification_sent_at' => now(),
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/auth/verify', [
            'email' => 'test@example.com',
            'code'  => '123456',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user', 'usage']);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_user_can_login()
    {
        $user = User::factory()->create([
            'email'             => 'test@example.com',
            'password'          => \Illuminate\Support\Facades\Hash::make('Password123!'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'test@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user', 'usage']);
    }

    public function test_user_can_login_with_google()
    {
        Http::fake([
            'https://www.googleapis.com/oauth2/v2/userinfo' => Http::response([
                'id'    => 'google-id-123',
                'name'  => 'Google User',
                'email' => 'google@example.com',
            ], 200),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'access_token' => 'fake-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user', 'usage']);

        $this->assertDatabaseHas('users', [
            'google_auth_id' => 'google-id-123',
            'email'          => 'google@example.com',
        ]);
    }

    public function test_user_can_get_profile()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson([
                'email' => $user->email,
            ]);
    }
}

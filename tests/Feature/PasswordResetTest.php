<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Hash, Notification, Password};
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_recovery_pages_render_and_link_contains_token(): void
    {
        $this->get('/forgot-password')->assertInertia(fn (Assert $page) => $page->component('PasswordReset'));
        $this->get('/reset-password/example?email=owner%40example.com')
            ->assertInertia(fn (Assert $page) => $page->component('PasswordReset')->where('token', 'example')->where('email', 'owner@example.com'));
        Notification::fake();
        $user = User::factory()->create();
        $this->from('/forgot-password')->post('/forgot-password', ['email' => $user->email])->assertRedirect('/forgot-password')->assertSessionHas('status');
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;
            return str_contains($url, '/reset-password/'.$notification->token) && str_contains($url, urlencode($user->email));
        });
        $message = session('status');
        $this->post('/forgot-password', ['email' => 'unknown@example.com'])->assertSessionHas('status', $message);
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHas('status', $message);
        Notification::assertSentToTimes($user, ResetPassword::class, 1);
    }

    public function test_reset_changes_password_rotates_remember_token_and_consumes_token(): void
    {
        $user = User::factory()->create();
        $oldRememberToken = $user->remember_token;
        $token = Password::createToken($user);
        $data = ['email' => $user->email, 'token' => $token, 'password' => 'NewPassword12345', 'password_confirmation' => 'NewPassword12345'];
        $this->post('/reset-password', $data)->assertRedirect('/login')->assertSessionHas('success');
        $this->assertTrue(Hash::check($data['password'], $user->fresh()->password));
        $this->assertNotEquals($oldRememberToken, $user->fresh()->remember_token);
        $this->assertGuest();
        $this->post('/reset-password', $data)->assertSessionHasErrors('email');
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => $user->email, 'password' => $data['password']])->assertRedirect('/dashboard');
    }

    public function test_invalid_expired_tokens_and_invalid_passwords_are_rejected(): void
    {
        $user = User::factory()->create();
        $original = $user->password;
        $data = ['email' => $user->email, 'token' => 'invalid', 'password' => 'NewPassword12345', 'password_confirmation' => 'NewPassword12345'];
        $this->post('/reset-password', $data)->assertSessionHasErrors('email');
        $data['token'] = Password::createToken($user);
        $this->post('/reset-password', [...$data, 'password' => 'short', 'password_confirmation' => 'short'])->assertSessionHasErrors('password');
        $this->post('/reset-password', [...$data, 'password_confirmation' => 'different'])->assertSessionHasErrors('password');
        $this->travel(61)->minutes();
        $this->post('/reset-password', $data)->assertSessionHasErrors('email');
        $this->assertSame($original, $user->fresh()->password);
    }

    public function test_request_validation_and_rate_limit(): void
    {
        Notification::fake();
        $this->post('/forgot-password', ['email' => 'invalid'])->assertSessionHasErrors('email');
        for ($i = 0; $i < 2; $i++) {
            $this->post('/forgot-password', ['email' => 'unknown@example.com'])->assertRedirect();
        }
        $this->post('/forgot-password', ['email' => 'unknown@example.com'])->assertStatus(429);
    }
}

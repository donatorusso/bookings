<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreventOverlappingBookingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Client $client1;
    protected Client $client2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user         = User::factory()->create();
        $this->client1      = Client::factory()->create();
        $this->client2      = Client::factory()->create();
    }

    public function test_prevents_overlapping_bookings_for_same_user(): void
    {
        Booking::create([
            'user_id' => $this->user->id,
            'client_id' => $this->client1->id,
            'title' => 'Existing',
            'start_time' => now()->setTime(10, 0),
            'end_time'   => now()->setTime(11, 0),
        ]);

        // Try to create an overlapping one: 10:30–11:30
        $payload = [
            'user_id'     => $this->user->id,
            'client_id'   => $this->client2->id,
            'title'       => 'Overlap',
            'description' => null,
            'start_time' => now()->setTime(10, 30)->toISOString(),
            'end_time'   => now()->setTime(11, 30)->toISOString(),
        ];

        $response = $this->postJson('/api/bookings', $payload);

        $response->assertStatus(422)                 
                 ->assertJsonValidationErrors(['start_time']);

        // Ensure NOT persisted
        $this->assertDatabaseMissing('bookings', [
            'user_id'    => $this->user->id,
            'title'      => 'Overlap',
            'start_time' => now()->setTime(10, 30)->toISOString(),
            'end_time'   => now()->setTime(11, 30)->toISOString(),
        ]);
    }

    public function test_allows_adjacent_bookings_for_same_user(): void
    {
        Booking::create([
            'user_id' => $this->user->id,
            'client_id' => $this->client1->id,
            'title' => 'A',
            'start_time' => now()->setTime(10, 0),
            'end_time'   => now()->setTime(11, 0),
        ]);

        // Adjacent (11:00 starts where previous ends) -> allowed
        $res = $this->postJson('/api/bookings', [
            'user_id'    => $this->user->id,
            'client_id'  => $this->client2->id,
            'title'      => 'B',
            'start_time' => now()->setTime(11, 0)->toISOString(),
            'end_time'   => now()->setTime(12, 0)->toISOString(),
        ]);

        $res->assertCreated();
    }

    public function test_prevents_updating_booking_to_overlapping_time_for_same_user(): void
    {
        // Existing booking: 10:00–11:00
        $existing = Booking::create([
            'user_id'    => $this->user->id,
            'client_id'  => $this->client1->id,
            'title'      => 'Existing Booking',
            'start_time' => now()->setTime(10, 0)->toISOString(),
            'end_time'   => now()->setTime(11, 0)->toISOString(),
        ]);

        // Another booking: 12:00–13:00
        $target = Booking::create([
            'user_id'    => $this->user->id,
            'client_id'  => $this->client2->id,
            'title'      => 'To Be Updated',
            'start_time' => now()->setTime(12, 0)->toISOString(),
            'end_time'   => now()->setTime(13, 0)->toISOString(),
        ]);

        // Try to update target to overlap with existing (10:30–11:30)
        $payload = [
            'user_id'    => $this->user->id,
            'client_id'  => $this->client2->id,
            'title'      => 'To Be Updated',
            'start_time' => now()->setTime(10, 30)->toISOString(),
            'end_time'   => now()->setTime(11, 30)->toISOString(),
        ];

        $response = $this->putJson("/api/bookings/{$target->id}", $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['start_time']);

        // Ensure booking NOT updated in DB
        $this->assertDatabaseHas('bookings', [
            'id'         => $target->id,
            'start_time' => now()->setTime(12, 0)->toDateTimeString(),
            'end_time'   => now()->setTime(13, 0)->toDateTimeString(),
        ]);
    }
}

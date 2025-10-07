<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_booking(): void
    {
        $user   = User::factory()->create();
        $client = Client::factory()->create();

        $res = $this->postJson('/api/bookings', [
            'user_id'    => $user->id,
            'client_id'  => $client->id,
            'title'      => 'Test',
            'description'=> null,
            'start_time' => now()->addHour()->toISOString(),
            'end_time'   => now()->addHours(2)->toISOString(),
        ]);

        $res->assertCreated();
        $this->assertDatabaseCount('bookings', 1);
    }

}

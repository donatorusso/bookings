<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RetrieveWeeklyBookingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_weekly_bookings(): void
    {
        $user   = User::factory()->create();
        $client = Client::factory()->create();

        Booking::factory()->create([
            'user_id' => $user->id,
            'client_id' => $client->id,
            'title' => 'Week item',
            'start_time' => now()->startOfWeek()->addHours(10),
            'end_time'   => now()->startOfWeek()->addHours(11),
        ]);

        $res = $this->getJson('/api/bookings?week='.now()->toDateString());
        $res->assertOk()->assertJsonStructure(['week'=>['start','end'],'data']);
        $this->assertNotEmpty($res->json('data'));
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Booking;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a default user if none exist
        $user = User::first() ?? User::factory()->create([
            'name' => 'Demo User',
            'username' => 'demouser',
            'email' => 'demo@example.com',
            'password' => bcrypt('password'),
        ]);

        // Create new clients - I want at least 10 clients into the DB
        $needed = max(0, 10 - Client::count());
        if ($needed > 0) {
            Client::factory()->count($needed)->create();
        }
        $clients = Client::all();

        // Scheduling parameters
        $target       = 10;   // how many bookings to create
        $created      = 0;
        $duration     = 60;   // minutes per booking 
        $dayStartHour = 9;    // day starts at 09:00
        $dayEndHour   = 19;   // day ends at 19:00 (exclusive)
        $cursor       = now()->startOfWeek()->setTime($dayStartHour, 0); // Monday 09:00

        // Safety limit to avoid infinite loops
        $safeLimit = now()->addWeeks(4);

        while ($created < $target && $cursor->lt($safeLimit)) {
            $start = $cursor->copy();
            $end   = $start->copy()->addMinutes($duration);

            // Overlap rule: existing.start < new.end AND existing.end > new.start
            $overlap = Booking::query()
                ->where('user_id', $user->id)
                ->where('start_time', '<', $end)
                ->where('end_time',   '>', $start)
                ->exists();

            if (! $overlap) {
                Booking::create([
                    'user_id'     => $user->id,
                    'client_id'   => $clients->random()->id,
                    'title'       => 'Booking #' . ($created + 1),
                    'description' => 'Seeded booking',
                    'start_time'  => $start,
                    'end_time'    => $end,
                ]);
                $created++;
            }

            // Move to the next 1-hour slot
            $cursor->addHour();

            // If we reached the end of the workday, jump to the next day at 09:00
            if ($cursor->hour >= $dayEndHour) {
                $cursor = $cursor->copy()->addDay()->setTime($dayStartHour, 0);
            }
        }

        $this->command?->info("Seed completed.");
    
    }
}

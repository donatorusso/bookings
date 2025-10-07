<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = now()->addDays(rand(0,6))->setTime(rand(8,16), 0);
        return [
            'user_id' => User::factory(),
            'client_id' => Client::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->sentence(8),
            'start_time' => $start,
            'end_time'   => (clone $start)->addHour(),
        ];
    }
}

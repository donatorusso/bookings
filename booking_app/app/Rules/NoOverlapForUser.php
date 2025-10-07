<?php

namespace App\Rules;

use App\Models\Booking;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Carbon;

class NoOverlapForUser implements ValidationRule, DataAwareRule
{
    protected array $data = [];

    public function __construct(
        private int $userId,
        private ?int $ignoreId = null // pass current booking id on update
    ) {}

    public function setData(array $data): static
    {
        $this->data = $data;
        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            $start = Carbon::parse($value);
            $end   = Carbon::parse($this->data['end_time'] ?? null);
        } catch (\Throwable $e) {
            $fail('Invalid date/time format.');
            return;
        }

        if ($end->lte($start)) {
            $fail('End time must be after start time.');
            return;
        }

        // Overlap if existing.start < new.end AND existing.end > new.start
        // (adjacent ranges like 10:00–11:00 and 11:00–12:00 are allowed)
        $overlap = Booking::query()
            ->where('user_id', $this->userId)
            ->when($this->ignoreId, fn($q) => $q->where('id', '!=', $this->ignoreId))
            ->where('start_time', '<', $end)
            ->where('end_time',   '>', $start)
            ->exists();

        if ($overlap) {
            $fail('This user already has a booking overlapping the selected time range.');
        }
    }
}

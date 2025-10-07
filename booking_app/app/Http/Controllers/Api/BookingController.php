<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Client;
use App\Rules\NoOverlapForUser;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    // GET /api/bookings?week=YYYY-MM-DD (any date in that week, Monday–Sunday)
    public function index(Request $request)
    {
        $date = $request->query('week') ? CarbonImmutable::parse($request->query('week')) : now()->toImmutable();
        $monday = $date->startOfWeek(CarbonImmutable::MONDAY);
        $sunday = $date->endOfWeek(CarbonImmutable::SUNDAY);

        $bookings = Booking::with(['user:id,name','client:id,name,email'])
            ->whereBetween('start_time', [$monday, $sunday])
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'week' => [
                'start' => $monday->toISOString(),
                'end'   => $sunday->toISOString(),
            ],
            'data' => $bookings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'    => ['required','integer','exists:users,id'],
            'client_id'  => ['required','integer','exists:clients,id'],
            'title'      => ['required','string','max:255'],
            'description'=> ['nullable','string'],
            'start_time' => ['required','date','before:end_time', new NoOverlapForUser((int)$request->input('user_id'))],
            'end_time'   => ['required','date','after:start_time'],
        ]);

        $validated['start_time'] = Carbon::parse($validated['start_time'])->seconds(0);
        $validated['end_time']   = Carbon::parse($validated['end_time'])->seconds(0);

        $exists = Booking::query()
            ->where('user_id', $validated['user_id'])
            ->where('start_time', '<', $validated['end_time'])
            ->where('end_time',   '>', $validated['start_time'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This user already has a booking overlapping the selected time range.',
                'errors'  => ['start_time' => ['Overlapping booking for this user.']],
            ], 422);
        }

        $booking = Booking::create($validated);

        return response()->json($booking->load('user:id,name','client:id,name,email'), 201);
    }

    public function update(Request $request, Booking $booking)
    {
        $validator = Validator::make($request->all(), [
            'user_id'     => ['required', 'integer', 'exists:users,id'],
            'client_id'   => ['required', 'integer', 'exists:clients,id'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_time'  => [
                'required',
                'date',
                'before:end_time',
                new NoOverlapForUser((int)$request->input('user_id'), $booking->id),
            ],
            'end_time'    => ['required', 'date', 'after:start_time'],
        ], [
            'start_time.before' => 'End time must be after start time.',
            'end_time.after'    => 'End time must be after start time.',
        ]);

        $validator->after(function ($v) {
            if ($v->errors()->has('start_time')) {
                foreach ($v->errors()->get('start_time') as $msg) {
                    $v->errors()->add('end_time', $msg);
                }
            }
        });

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $validated = $validator->validated();
        $booking->update($validated);

        return response()->json($booking->fresh()->load('user:id,name', 'client:id,name,email'));
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->noContent(); // 204
    }
}

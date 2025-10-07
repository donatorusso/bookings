<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BookingController;

use App\Models\Client;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/bookings', [BookingController::class, 'index']);
Route::post('/bookings', [BookingController::class, 'store']);
Route::put('/bookings/{booking}', [BookingController::class, 'update']);   
Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']); 

Route::get('/clients', function () {
    return Client::query()
        ->orderBy('name')
        ->get(['id','name','email']);
});
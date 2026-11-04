<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{AuthController,ProfileController};
Route::get('/',[ProfileController::class,'show'])->name('profile');
Route::middleware('guest')->group(function() {
 Route::get('/login',[AuthController::class,'login'])->name('login');
 Route::post('/login',[AuthController::class,'authenticate'])->middleware('throttle:5,1');
 Route::get('/register',[AuthController::class,'register']);
 Route::post('/register',[AuthController::class,'store'])->middleware('throttle:3,1');
});
Route::middleware('auth')->group(function() {
 Route::get('/dashboard',[ProfileController::class,'edit'])->name('dashboard');
 Route::post('/dashboard/profile',[ProfileController::class,'save'])->middleware('throttle:30,1');
 Route::post('/dashboard/publish',[ProfileController::class,'publish']);
 Route::post('/logout',[AuthController::class,'logout']);
});
Route::get('/media/stream/{filename}',[ProfileController::class,'streamAudio'])->where('filename','[A-Za-z0-9_\-\.]+')->name('media.stream');


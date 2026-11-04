<?php
namespace App\Http\Controllers;
use App\Models\{User,Profile};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth,DB,Hash};
use Illuminate\Validation\{ValidationException,Rules\Password};
use Inertia\Inertia;
class AuthController extends Controller {
 public function login() { return Inertia::render('Auth',['register'=>false,'registrationOpen'=>!User::exists() && (bool)config('profile.setup_token')]); }
 public function register() { abort_if(User::exists() || !config('profile.setup_token'),404); return Inertia::render('Auth',['register'=>true,'registrationOpen'=>true]); }
 public function store(Request $request) {
  $data=$request->validate(['name'=>'required|string|max:80','email'=>'required|email|max:255','password'=>['required','confirmed',Password::min(12)],'setup_token'=>'required|string']);
  abort_unless(config('profile.setup_token') && hash_equals(config('profile.setup_token'),$data['setup_token']),403);
  $user=DB::transaction(function() use($data) {
   $profile=Profile::lockForUpdate()->findOrFail(1);
   abort_if($profile->user_id || User::exists(),403);
   $user=User::create(['name'=>$data['name'],'email'=>$data['email'],'password'=>Hash::make($data['password'])]);
   $profile->update(['user_id'=>$user->id,'draft'=>array_replace(Profile::defaults(),['name'=>$data['name']])]);
   return $user;
  });
  Auth::login($user); $request->session()->regenerate(); return redirect('/dashboard');
 }
 public function authenticate(Request $request) {
  $data=$request->validate(['email'=>'required|email','password'=>'required|string']);
  if(!Auth::attempt($data)) throw ValidationException::withMessages(['email'=>'Email atau password tidak sesuai.']);
  $request->session()->regenerate(); return redirect()->intended('/dashboard');
 }
 public function logout(Request $request) { Auth::logout(); $request->session()->invalidate(); $request->session()->regenerateToken(); return redirect('/login'); }
}

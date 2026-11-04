<?php
namespace Tests\Feature;
use App\Models\{Profile,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class ProfileStudioTest extends TestCase {
 use RefreshDatabase;
 protected function setUp(): void { parent::setUp(); $this->withoutVite(); }
 private function owner(): User { $u=User::factory()->create(); Profile::findOrFail(1)->update(['user_id'=>$u->id]); return $u; }
 public function test_guest_cannot_edit_or_publish(): void {
  $this->get('/dashboard')->assertRedirect('/login');
  $this->post('/dashboard/profile',[])->assertRedirect('/login');
  $this->post('/dashboard/publish')->assertRedirect('/login');
 }
 public function test_draft_is_not_exposed_until_publish(): void {
  $u=$this->owner(); $draft=Profile::defaults(); $draft['name']='Private draft';
  $this->actingAs($u)->post('/dashboard/profile',$draft)->assertSessionHasNoErrors();
  $this->get('/')->assertInertia(fn(Assert $page)=>$page->component('PublicProfile')->where('profile',null));
  $this->post('/dashboard/publish')->assertSessionHasNoErrors();
  $this->get('/')->assertInertia(fn(Assert $page)=>$page->where('profile.name','Private draft'));
  $draft['name']='New unpublished name';
  $this->post('/dashboard/profile',$draft)->assertSessionHasNoErrors();
  $this->get('/')->assertInertia(fn(Assert $page)=>$page->where('profile.name','Private draft'));
 }
 public function test_registration_requires_setup_token_and_closes_after_owner(): void {
  config(['profile.setup_token'=>'local-test-token']);
  $data=['name'=>'Owner','email'=>'owner@example.com','password'=>'TestPassword12345','password_confirmation'=>'TestPassword12345','setup_token'=>'wrong'];
  $this->post('/register',$data)->assertForbidden();
  $data['setup_token']='local-test-token';
  $this->post('/register',$data)->assertRedirect('/dashboard');
  $this->assertDatabaseCount('users',1); $this->post('/logout');
  $this->get('/register')->assertNotFound();
  $this->post('/register',$data)->assertForbidden();
  $this->assertDatabaseCount('users',1);
 }
 public function test_login_and_logout(): void {
  $u=$this->owner();
  $this->post('/login',['email'=>$u->email,'password'=>'wrong'])->assertSessionHasErrors('email');
  $this->post('/login',['email'=>$u->email,'password'=>'password'])->assertRedirect('/dashboard');
  $this->assertAuthenticatedAs($u); $this->post('/logout')->assertRedirect('/login'); $this->assertGuest();
 }
 public function test_another_account_cannot_change_owner_profile(): void {
  $this->owner(); $other=User::factory()->create();
  $this->actingAs($other)->post('/dashboard/profile',Profile::defaults())->assertNotFound();
  $this->post('/dashboard/publish')->assertNotFound();
 }
 public function test_unsafe_links_and_untrusted_asset_paths_are_rejected_or_ignored(): void {
  $u=$this->owner(); $data=Profile::defaults();$data['links']=[['label'=>'Bad','url'=>'javascript:alert(1)']];
  $this->actingAs($u)->post('/dashboard/profile',$data)->assertSessionHasErrors('links.0.url');
  $data['links']=[];$data['avatar']='https://untrusted.test/pixel';
  $this->post('/dashboard/profile',$data)->assertSessionHasNoErrors();
  $this->assertNull(Profile::findOrFail(1)->draft['avatar']);
 }
 public function test_uploaded_avatar_is_saved_and_invalid_upload_is_rejected(): void {
  Storage::fake('public'); $u=$this->owner(); $data=Profile::defaults();
  $data['avatarFile']=UploadedFile::fake()->create('payload.html',1,'text/html');
  $this->actingAs($u)->post('/dashboard/profile',$data)->assertSessionHasErrors('avatarFile');
  $data['avatarFile']=UploadedFile::fake()->image('avatar.jpg');
  $this->post('/dashboard/profile',$data)->assertSessionHasNoErrors();
  Storage::disk('public')->assertExists(str_replace('/storage/','',Profile::findOrFail(1)->draft['avatar']));
 }
 public function test_new_customization_fields_can_be_saved_to_draft_and_published(): void {
  $u=$this->owner();
  $data=Profile::defaults();
  $data['visualizerEnabled']=true;
  $data['visualizerColorMode']='custom';
  $data['visualizerColor']='#123456';
  $data['visualizerGlow']=85;

  $data['backgroundEffect']='gold_particles';
  $data['particleColor']='#ffcc00';
  $data['particleDensity']=60;
  $data['particleSize']=5;
  $data['particleSpeed']=4;
  $data['particleGlow']=70;
  $data['particleOpacity']=90;

  $data['cursorEffect']='crosshair';
  $data['cursorColorMode']='custom';
  $data['cursorColor']='#abcdef';
  $data['cursorSize']=24;
  $data['cursorGlow']=80;
  $data['cursorTrail']=true;

  $data['nameEffect']='glitch';
  $data['introEnabled']=true;

  $this->actingAs($u)->post('/dashboard/profile',$data)->assertSessionHasNoErrors();

  $profile=Profile::findOrFail(1);
  $this->assertEquals('gold_particles',$profile->draft['backgroundEffect']);
  $this->assertEquals('#ffcc00',$profile->draft['particleColor']);
  $this->assertEquals('crosshair',$profile->draft['cursorEffect']);
  $this->assertTrue($profile->draft['cursorTrail']);
  $this->assertEquals('custom',$profile->draft['visualizerColorMode']);
  $this->assertEquals('glitch',$profile->draft['nameEffect']);
  $this->assertTrue($profile->draft['introEnabled']);

  $this->post('/dashboard/publish')->assertSessionHasNoErrors();

  $this->get('/')->assertInertia(fn(Assert $page)=>$page
    ->where('profile.backgroundEffect','gold_particles')
    ->where('profile.cursorEffect','crosshair')
    ->where('profile.visualizerColorMode','custom')
    ->where('profile.cursorTrail',true)
    ->where('profile.nameEffect','glitch')
    ->where('profile.introEnabled',true)
  );
 }

 public function test_legacy_profile_without_new_fields_is_safely_normalized_with_defaults(): void {
  $u=$this->owner();
  $legacyDraft=[
    'name'=>'Old Profile',
    'bio'=>'Old Bio',
    'quote'=>'Old Quote',
    'accent'=>'#b6a2ff',
    'backgroundColor'=>'#11101b',
    'opacity'=>70,
    'blur'=>16,
    'radius'=>28,
    'glow'=>true,
    'entrance'=>true,
    'avatar'=>null,
    'background'=>null,
    'backgroundType'=>'color',
    'audio'=>null,
    'songTitle'=>'Old Song',
    'links'=>[],
  ];
  Profile::findOrFail(1)->update(['draft'=>$legacyDraft,'published'=>$legacyDraft,'published_at'=>now()]);

  $this->actingAs($u)->get('/dashboard')->assertInertia(fn(Assert $page)=>$page
    ->where('profile.name','Old Profile')
    ->where('profile.backgroundEffect','none')
    ->where('profile.cursorEffect','default')
    ->where('profile.visualizerEnabled',true)
    ->where('profile.nameEffect','none')
    ->where('profile.introEnabled',false)
  );

  $this->get('/')->assertInertia(fn(Assert $page)=>$page
    ->where('profile.name','Old Profile')
    ->where('profile.backgroundEffect','none')
    ->where('profile.cursorEffect','default')
    ->where('profile.visualizerEnabled',true)
    ->where('profile.nameEffect','none')
    ->where('profile.introEnabled',false)
  );
 }

 public function test_validation_rejects_invalid_customization_options(): void {
  $u=$this->owner();
  $data=Profile::defaults();

  $data['backgroundEffect']='invalid_effect';
  $this->actingAs($u)->post('/dashboard/profile',$data)->assertSessionHasErrors('backgroundEffect');

  $data['backgroundEffect']='gold_particles';
  $data['cursorEffect']='invalid_cursor';
  $this->post('/dashboard/profile',$data)->assertSessionHasErrors('cursorEffect');

  $data['cursorEffect']='ring';
  $data['visualizerColor']='not-a-hex';
  $this->post('/dashboard/profile',$data)->assertSessionHasErrors('visualizerColor');

  $data['visualizerColor']='#123456';
  $data['nameEffect']='invalid_name_effect';
  $this->post('/dashboard/profile',$data)->assertSessionHasErrors('nameEffect');
 }

 public function test_audio_stream_supports_http_range_requests(): void {
  Storage::fake('public');
  Storage::disk('public')->put('profile/sample.mp3', str_repeat('M', 5000));

  $response = $this->withHeaders(['Range' => 'bytes=500-1500'])->get('/media/stream/sample.mp3');
  $response->assertStatus(206);
  $response->assertHeader('Content-Range', 'bytes 500-1500/5000');
 }
}

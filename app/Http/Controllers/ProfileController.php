<?php
namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProfileController extends Controller {
    private function owned(Request $request): Profile {
        return Profile::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function show() {
        $p = Profile::findOrFail(1);
        return Inertia::render('PublicProfile', [
            'profile' => Profile::normalize($p->published)
        ]);
    }

    public function edit(Request $request) {
        $p = $this->owned($request);
        return Inertia::render('Dashboard', [
            'profile' => Profile::normalize($p->draft) ?? Profile::defaults(),
            'publishedAt' => $p->published_at?->toIso8601String()
        ]);
    }

    public function save(Request $request) {
        $p = $this->owned($request);
        $defaults = Profile::defaults();

        $request->merge([
            'links' => $request->input('links', []),
            'visualizerEnabled' => $request->has('visualizerEnabled') ? $request->boolean('visualizerEnabled') : $defaults['visualizerEnabled'],
            'visualizerColorMode' => $request->input('visualizerColorMode', $defaults['visualizerColorMode']),
            'visualizerColor' => $request->input('visualizerColor', $defaults['visualizerColor']),
            'visualizerGlow' => (int) $request->input('visualizerGlow', $defaults['visualizerGlow']),
            'backgroundEffect' => $request->input('backgroundEffect', $defaults['backgroundEffect']),
            'particleColor' => $request->input('particleColor', $defaults['particleColor']),
            'particleDensity' => (int) $request->input('particleDensity', $defaults['particleDensity']),
            'particleSize' => (int) $request->input('particleSize', $defaults['particleSize']),
            'particleSpeed' => (int) $request->input('particleSpeed', $defaults['particleSpeed']),
            'particleGlow' => (int) $request->input('particleGlow', $defaults['particleGlow']),
            'particleOpacity' => (int) $request->input('particleOpacity', $defaults['particleOpacity']),
            'cursorEffect' => $request->input('cursorEffect', $defaults['cursorEffect']),
            'cursorColorMode' => $request->input('cursorColorMode', $defaults['cursorColorMode']),
            'cursorColor' => $request->input('cursorColor', $defaults['cursorColor']),
            'cursorSize' => (int) $request->input('cursorSize', $defaults['cursorSize']),
            'cursorGlow' => (int) $request->input('cursorGlow', $defaults['cursorGlow']),
            'cursorTrail' => $request->has('cursorTrail') ? $request->boolean('cursorTrail') : $defaults['cursorTrail'],
            'nameEffect' => $request->input('nameEffect', $defaults['nameEffect']),
            'introEnabled' => $request->has('introEnabled') ? $request->boolean('introEnabled') : $defaults['introEnabled'],
        ]);

        $data = $request->validate([
            'name' => 'required|string|max:80',
            'bio' => 'nullable|string|max:240',
            'quote' => 'nullable|string|max:400',
            'accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'backgroundColor' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'opacity' => 'required|integer|min:20|max:100',
            'blur' => 'required|integer|min:0|max:30',
            'radius' => 'required|integer|min:0|max:48',
            'glow' => 'required|boolean',
            'entrance' => 'required|boolean',
            'backgroundType' => 'required|in:color,image,video',
            'songTitle' => 'nullable|string|max:100',
            'links' => 'present|array|max:12',
            'links.*.label' => 'required|string|max:40',
            'links.*.url' => 'required|url:http,https|max:2048',
            'avatarFile' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            'backgroundFile' => 'nullable|file|mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm|max:25600',
            'audioFile' => 'nullable|file|mimetypes:audio/mpeg,audio/mp3,audio/x-m4a,audio/mp4,audio/aac|max:10240',

            // Audio Visualizer
            'visualizerEnabled' => 'required|boolean',
            'visualizerColorMode' => 'required|in:accent,custom',
            'visualizerColor' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'visualizerGlow' => 'required|integer|min:0|max:100',

            // Background Effect
            'backgroundEffect' => 'required|in:none,gold_particles',
            'particleColor' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'particleDensity' => 'required|integer|min:5|max:150',
            'particleSize' => 'required|integer|min:1|max:20',
            'particleSpeed' => 'required|integer|min:1|max:20',
            'particleGlow' => 'required|integer|min:0|max:100',
            'particleOpacity' => 'required|integer|min:10|max:100',

            // Cursor Effect
            'cursorEffect' => 'required|in:default,dot,ring,crosshair',
            'cursorColorMode' => 'required|in:accent,custom',
            'cursorColor' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'cursorSize' => 'required|integer|min:6|max:60',
            'cursorGlow' => 'required|integer|min:0|max:100',
            'cursorTrail' => 'required|boolean',

            // Username Effect
            'nameEffect' => 'required|in:none,glitch,typewriter,rainbow',

            // Intro Overlay
            'introEnabled' => 'required|boolean',
        ]);

        foreach (['avatarFile' => 'avatar', 'backgroundFile' => 'background', 'audioFile' => 'audio'] as $field => $key) {
            unset($data[$field]);
            $data[$key] = $p->draft[$key] ?? null;
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $data[$key] = '/storage/' . $file->store('profile', 'public');
                if ($key === 'background') {
                    $data['backgroundType'] = str_starts_with($file->getMimeType(), 'video/') ? 'video' : 'image';
                }
            }
        }

        $data['links'] = array_map(fn($link) => ['label' => $link['label'], 'url' => $link['url']], $data['links']);
        $data['glow'] = $request->boolean('glow');
        $data['entrance'] = $request->boolean('entrance');
        $data['visualizerEnabled'] = $request->boolean('visualizerEnabled');
        $data['cursorTrail'] = $request->boolean('cursorTrail');
        $data['introEnabled'] = $request->boolean('introEnabled');

        $p->update(['draft' => $data]);
        return back()->with('success', 'Draf berhasil disimpan.');
    }

    public function publish(Request $request) {
        DB::transaction(function() use ($request) {
            $p = Profile::where('user_id', $request->user()->id)->lockForUpdate()->firstOrFail();
            $p->update(['published' => $p->draft, 'published_at' => now()]);
        });
        return back()->with('success', 'Profil berhasil dipublikasikan.');
    }

    public function streamAudio(string $filename) {
        $cleanName = basename($filename);
        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        if (!$disk->exists('profile/' . $cleanName)) {
            abort(404);
        }
        $path = $disk->path('profile/' . $cleanName);
        $mime = mime_content_type($path) ?: 'audio/mpeg';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Accept-Ranges' => 'bytes',
        ]);
    }
}

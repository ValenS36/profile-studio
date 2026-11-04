<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model {
    protected $guarded = [];

    protected function casts(): array {
        return [
            'draft' => 'array',
            'published' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public static function defaults(): array {
        return [
            'name' => 'Your name',
            'bio' => 'A little space on the internet.',
            'quote' => 'Make room for the things that make you, you.',
            'accent' => '#b6a2ff',
            'backgroundColor' => '#11101b',
            'opacity' => 70,
            'blur' => 16,
            'radius' => 28,
            'glow' => true,
            'entrance' => true,
            'avatar' => null,
            'background' => null,
            'backgroundType' => 'color',
            'audio' => null,
            'songTitle' => 'My soundtrack',
            'links' => [],

            // Audio Visualizer
            'visualizerEnabled' => true,
            'visualizerColorMode' => 'accent',
            'visualizerColor' => '#b6a2ff',
            'visualizerGlow' => 60,

            // Background Effect
            'backgroundEffect' => 'none',
            'particleColor' => '#d4af37',
            'particleDensity' => 40,
            'particleSize' => 4,
            'particleSpeed' => 3,
            'particleGlow' => 50,
            'particleOpacity' => 80,

            // Cursor Effect
            'cursorEffect' => 'default',
            'cursorColorMode' => 'accent',
            'cursorColor' => '#b6a2ff',
            'cursorSize' => 20,
            'cursorGlow' => 50,
            'cursorTrail' => false,

            // Username Effect
            'nameEffect' => 'none',

            // Intro Overlay
            'introEnabled' => false,
        ];
    }

    public static function normalize(?array $data): ?array {
        if ($data === null) {
            return null;
        }
        return array_merge(static::defaults(), $data);
    }
}

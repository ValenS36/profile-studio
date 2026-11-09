import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
  UserRound,
  Image,
  Sparkles,
  Music2,
  MousePointer,
  Link2,
  Sliders,
  Type,
  Play,
  LogOut,
  ExternalLink,
  Save,
  Upload,
  Plus,
  Trash2,
  Monitor,
  Smartphone,
  ArrowUp,
  ArrowDown,
  Crop,
} from 'lucide-react';
import ProfileCard from '../components/ProfileCard';
import ImageCropperModal from '../components/ImageCropperModal';
import { Button } from '../components/ui/button';
import type { Profile } from '../types';

const sections = [
  { id: 'profile', title: 'Profil', icon: UserRound },
  { id: 'background', title: 'Background', icon: Image },
  { id: 'bg-effect', title: 'Background Effect', icon: Sparkles },
  { id: 'music', title: 'Musik', icon: Music2 },
  { id: 'name-effect', title: 'Username Effect', icon: Type },
  { id: 'cursor-effect', title: 'Cursor Effect', icon: MousePointer },
  { id: 'intro', title: 'Animasi Masuk', icon: Play },
  { id: 'links', title: 'Media sosial', icon: Link2 },
  { id: 'appearance', title: 'Tampilan kartu', icon: Sliders },
];

type Draft = Profile & {
  avatarFile: File | null;
  backgroundFile: File | null;
  audioFile: File | null;
};

export default function Dashboard({
  profile,
  publishedAt,
}: {
  profile: Profile;
  publishedAt: string | null;
}) {
  const [tab, setTab] = useState('profile');
  const [mobile, setMobile] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Avatar cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperFileName, setCropperFileName] = useState<string>('avatar.jpg');

  const form = useForm<Draft>({
    ...profile,
    tagline: profile.tagline ?? 'MY LITTLE CORNER OF THE INTERNET',
    avatarFile: null,
    backgroundFile: null,
    audioFile: null,
  });

  const [media, setMedia] = useState<{ avatar?: string; background?: string; audio?: string }>({});
  const flash = usePage().props.flash as { success?: string } | undefined;

  useEffect(() => {
    const urls: typeof media = {};
    if (form.data.avatarFile) urls.avatar = URL.createObjectURL(form.data.avatarFile);
    if (form.data.backgroundFile) urls.background = URL.createObjectURL(form.data.backgroundFile);
    if (form.data.audioFile) urls.audio = URL.createObjectURL(form.data.audioFile);
    setMedia(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [form.data.avatarFile, form.data.backgroundFile, form.data.audioFile]);

  useEffect(() => {
    if (!form.isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [form.isDirty]);

  const preview = {
    ...form.data,
    ...media,
    backgroundType: form.data.backgroundFile
      ? ((form.data.backgroundFile.type.startsWith('video/') ? 'video' : 'image') as Profile['backgroundType'])
      : form.data.backgroundType,
  };

  const save = () =>
    form.post('/dashboard/profile', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: (page) => {
        const saved = page.props.profile as Profile;
        const next = { ...saved, avatarFile: null, backgroundFile: null, audioFile: null };
        form.setData(next);
        form.setDefaults(next);
      },
    });

  const fileInput = (
    field: 'avatarFile' | 'backgroundFile' | 'audioFile',
    accept: string,
    label: string,
    hint: string
  ) => {
    if (field === 'avatarFile') {
      return (
        <label className="upload-zone">
          <Upload size={24} />
          <strong>{label}</strong>
          <span>{form.data.avatarFile?.name || hint}</span>
          <input
            key={form.data.avatarFile?.name || 'empty-avatar'}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              setCropperImageSrc(url);
              setCropperFileName(file.name);
              setShowCropper(true);
              e.target.value = '';
            }}
          />
        </label>
      );
    }

    return (
      <label className="upload-zone">
        <Upload size={24} />
        <strong>{label}</strong>
        <span>{form.data[field]?.name || hint}</span>
        <input
          key={form.data[field]?.name || 'empty'}
          type="file"
          accept={accept}
          onChange={(e) => form.setData(field, e.target.files?.[0] || null)}
        />
      </label>
    );
  };

  const move = (i: number, d: number) => {
    const links = [...form.data.links];
    [links[i], links[i + d]] = [links[i + d], links[i]];
    form.setData('links', links);
  };

  return (
    <div className="dashboard">
      <Head title="Dashboard" />

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <a href="/dashboard" className="brand">
          <span>✳</span> profile studio
        </a>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav>
          {sections.map((s) => (
            <button
              key={s.id}
              className={tab === s.id ? 'active' : ''}
              onClick={() => setTab(s.id)}
            >
              <s.icon size={18} />
              {s.title}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="owner-dot">
            {form.data.name.slice(0, 1)}
            <div>
              <strong>{form.data.name}</strong>
              <small>Akun pemilik</small>
            </div>
          </div>
          <button
            onClick={() => {
              if (!form.isDirty || window.confirm('Keluar tanpa menyimpan perubahan?')) {
                router.post('/logout');
              }
            }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="editor-main">
        <header className="topbar">
          <span>
            Workspace <span className="muted">/ Editor profil</span>
          </span>
          <a href="/" target="_blank" rel="noreferrer">
            Lihat profil <ExternalLink size={14} />
          </a>
        </header>

        <div className="editor-heading">
          <div>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h1>Ruangmu, ceritamu.</h1>
            <p className="muted">Atur detail kecil. Buat kesan yang berbeda.</p>
          </div>
          <span className="status-dot">
            {publishedAt ? 'Sudah dipublikasikan' : 'Belum dipublikasikan'}
          </span>
        </div>

        <div className="editor-grid">
          {/* Settings Panel */}
          <section className="settings-panel">
            <div className="panel-heading">
              <h2>{sections.find((s) => s.id === tab)?.title}</h2>
              <span>0{sections.findIndex((s) => s.id === tab) + 1}</span>
            </div>

            <div className="settings-body">
              {/* Tab: Profile */}
              {tab === 'profile' && (
                <>
                  {fileInput(
                    'avatarFile',
                    'image/png,image/jpeg,image/webp,image/gif',
                    'Foto profil',
                    'PNG, JPG, WebP, GIF · maksimal 5 MB'
                  )}

                  {(form.data.avatarFile || preview.avatar) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        const src = preview.avatar;
                        if (src) {
                          setCropperImageSrc(src);
                          setCropperFileName(form.data.avatarFile?.name || 'avatar.jpg');
                          setShowCropper(true);
                        }
                      }}
                    >
                      <Crop size={14} /> Sesuaikan potongan foto profil
                    </Button>
                  )}

                  <label>
                    Nama tampilan
                    <input
                      maxLength={80}
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                    />
                  </label>
                  <label>
                    Teks di atas nama
                    <input
                      maxLength={100}
                      value={form.data.tagline}
                      onChange={(e) => form.setData('tagline', e.target.value)}
                      placeholder="MY LITTLE CORNER OF THE INTERNET"
                    />
                    <small>Kosongkan untuk menyembunyikan teks ini.</small>
                  </label>
                  <label>
                    Bio singkat
                    <textarea
                      maxLength={240}
                      rows={2}
                      value={form.data.bio || ''}
                      onChange={(e) => form.setData('bio', e.target.value)}
                      placeholder="Ceritakan sedikit tentang dirimu"
                    />
                  </label>
                  <label>
                    Quote
                    <textarea
                      maxLength={400}
                      rows={3}
                      value={form.data.quote || ''}
                      onChange={(e) => form.setData('quote', e.target.value)}
                    />
                    <small>Kosongkan untuk menyembunyikan quote.</small>
                  </label>
                </>
              )}

              {/* Tab: Background */}
              {tab === 'background' && (
                <>
                  <label>
                    Jenis background
                    <select
                      value={form.data.backgroundType}
                      onChange={(e) =>
                        form.setData('backgroundType', e.target.value as Profile['backgroundType'])
                      }
                    >
                      <option value="color">Warna</option>
                      <option value="image">Gambar</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                  <label>
                    Warna dasar
                    <input
                      type="color"
                      value={form.data.backgroundColor}
                      onChange={(e) => form.setData('backgroundColor', e.target.value)}
                    />
                  </label>
                  {fileInput(
                    'backgroundFile',
                    'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm',
                    'Upload background',
                    'Gambar / video MP4 atau WebM · maksimal 25 MB'
                  )}
                  <p className="helper">
                    Video berulang tanpa suara. Jenis background akan mengikuti file baru yang diunggah.
                  </p>
                </>
              )}

              {/* Tab: Background Effect */}
              {tab === 'bg-effect' && (
                <>
                  <label>
                    Pilihan Efek Background
                    <select
                      value={form.data.backgroundEffect}
                      onChange={(e) =>
                        form.setData('backgroundEffect', e.target.value as Profile['backgroundEffect'])
                      }
                    >
                      <option value="none">None (Tanpa Efek)</option>
                      <option value="gold_particles">Gold Falling Particles (Serpihan Emas Jatuh)</option>
                    </select>
                    <small>
                      Efek ditampilkan melayang di atas semua background dan di belakang kartu profil.
                    </small>
                  </label>

                  {form.data.backgroundEffect === 'gold_particles' && (
                    <>
                      <label>
                        Warna partikel
                        <input
                          type="color"
                          value={form.data.particleColor}
                          onChange={(e) => form.setData('particleColor', e.target.value)}
                        />
                      </label>
                      <label>
                        Kepadatan partikel
                        <span className="range-value">{form.data.particleDensity}</span>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={form.data.particleDensity}
                          onChange={(e) => form.setData('particleDensity', Number(e.target.value))}
                        />
                      </label>
                      <label>
                        Ukuran partikel
                        <span className="range-value">{form.data.particleSize}px</span>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={form.data.particleSize}
                          onChange={(e) => form.setData('particleSize', Number(e.target.value))}
                        />
                      </label>
                      <label>
                        Kecepatan jatuh
                        <span className="range-value">{form.data.particleSpeed}</span>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={form.data.particleSpeed}
                          onChange={(e) => form.setData('particleSpeed', Number(e.target.value))}
                        />
                      </label>
                      <label>
                        Intensitas glow
                        <span className="range-value">{form.data.particleGlow}%</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={form.data.particleGlow}
                          onChange={(e) => form.setData('particleGlow', Number(e.target.value))}
                        />
                      </label>
                      <label>
                        Transparansi (Opacity)
                        <span className="range-value">{form.data.particleOpacity}%</span>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={form.data.particleOpacity}
                          onChange={(e) => form.setData('particleOpacity', Number(e.target.value))}
                        />
                      </label>
                    </>
                  )}
                  <p className="helper">
                    Partikel serpihan emas melayang lembut menggunakan Canvas 2D murni tanpa membebani interaksi klik atau scroll.
                  </p>
                </>
              )}

              {/* Tab: Musik */}
              {tab === 'music' && (
                <>
                  {fileInput(
                    'audioFile',
                    'audio/mpeg,audio/mp4,audio/aac,audio/x-m4a',
                    'Tambahkan soundtrack',
                    'MP3, M4A, AAC · maksimal 10 MB'
                  )}
                  <label>
                    Judul lagu
                    <input
                      maxLength={100}
                      value={form.data.songTitle || ''}
                      onChange={(e) => form.setData('songTitle', e.target.value)}
                    />
                  </label>
                  <label className="toggle-row">
                    <span>
                      Audio Visualizer
                      <small>Batang visualizer frekuensi audio custom yang bergerak mengikuti lagu.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.data.visualizerEnabled}
                      onChange={(e) => form.setData('visualizerEnabled', e.target.checked)}
                    />
                  </label>

                  {form.data.visualizerEnabled && (
                    <>
                      <label>
                        Warna Visualizer
                        <select
                          value={form.data.visualizerColorMode}
                          onChange={(e) =>
                            form.setData(
                              'visualizerColorMode',
                              e.target.value as 'accent' | 'custom'
                            )
                          }
                        >
                          <option value="accent">
                            Mengikuti warna aksen ({form.data.accent})
                          </option>
                          <option value="custom">Warna custom</option>
                        </select>
                      </label>

                      {form.data.visualizerColorMode === 'custom' && (
                        <label>
                          Pilih warna custom visualizer
                          <input
                            type="color"
                            value={form.data.visualizerColor}
                            onChange={(e) => form.setData('visualizerColor', e.target.value)}
                          />
                        </label>
                      )}

                      <label>
                        Intensitas glow visualizer
                        <span className="range-value">{form.data.visualizerGlow}%</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={form.data.visualizerGlow}
                          onChange={(e) => form.setData('visualizerGlow', Number(e.target.value))}
                        />
                      </label>
                    </>
                  )}
                  <p className="helper">
                    Pengunjung memulai lagu dengan tombol play. Visualizer frekuensi diolah melalui Web Audio API AnalyserNode dan Canvas 2D.
                  </p>
                </>
              )}

              {/* Tab: Username Effect */}
              {tab === 'name-effect' && (
                <>
                  <label>
                    Efek Nama Tampilan
                    <select
                      value={form.data.nameEffect}
                      onChange={(e) =>
                        form.setData('nameEffect', e.target.value as Profile['nameEffect'])
                      }
                    >
                      <option value="none">None (Tanpa Efek)</option>
                      <option value="glitch">Glitch</option>
                      <option value="typewriter">Typewriter</option>
                      <option value="rainbow">Rainbow (RGB)</option>
                    </select>
                    <small>Pilih efek visual untuk nama tampilan di profil.</small>
                  </label>

                  {form.data.nameEffect === 'glitch' && (
                    <p className="helper">
                      Huruf utama terbelah menjadi tiga bagian yang bergeser berlawanan, miring, dan meregang dalam hentakan singkat. Warna pink–cyan menjadi aksen distorsi; nama kembali utuh di antara hentakan.
                    </p>
                  )}

                  {form.data.nameEffect === 'typewriter' && (
                    <p className="helper">
                      Nama diketik, berhenti sejenak, lalu dihapus dan diulang dengan kursor bercahaya. Teks tetap di tengah selama mengetik dan menghapus, dengan ruang nama stabil termasuk untuk emoji.
                    </p>
                  )}

                  {form.data.nameEffect === 'rainbow' && (
                    <p className="helper">
                      Seluruh warna font berganti bersama melalui spektrum RGB dengan transisi ease-in-out yang halus dan berulang.
                    </p>
                  )}

                  <p className="helper">
                    Perubahan langsung terlihat pada live preview di samping. Jika pengurangan gerakan aktif di perangkat, efek tetap terlihat dengan animasi lebih lembut.
                  </p>
                </>
              )}

              {/* Tab: Cursor Effect */}
              {tab === 'cursor-effect' && (
                <>
                  <label>
                    Jenis Kursor
                    <select
                      value={form.data.cursorEffect}
                      onChange={(e) =>
                        form.setData('cursorEffect', e.target.value as Profile['cursorEffect'])
                      }
                    >
                      <option value="default">Default (Kursor Sistem)</option>
                      <option value="dot">Dot (Titik)</option>
                      <option value="ring">Ring (Lingkaran Outline)</option>
                      <option value="crosshair">Crosshair (Garis Silang)</option>
                    </select>
                    <small>Kursor custom hanya aktif di area profil publik dan frame preview.</small>
                  </label>

                  {form.data.cursorEffect !== 'default' && (
                    <>
                      <label>
                        Warna Kursor
                        <select
                          value={form.data.cursorColorMode}
                          onChange={(e) =>
                            form.setData(
                              'cursorColorMode',
                              e.target.value as 'accent' | 'custom'
                            )
                          }
                        >
                          <option value="accent">
                            Mengikuti warna aksen ({form.data.accent})
                          </option>
                          <option value="custom">Warna custom</option>
                        </select>
                      </label>

                      {form.data.cursorColorMode === 'custom' && (
                        <label>
                          Pilih warna custom kursor
                          <input
                            type="color"
                            value={form.data.cursorColor}
                            onChange={(e) => form.setData('cursorColor', e.target.value)}
                          />
                        </label>
                      )}

                      <label>
                        Ukuran kursor
                        <span className="range-value">{form.data.cursorSize}px</span>
                        <input
                          type="range"
                          min={8}
                          max={48}
                          value={form.data.cursorSize}
                          onChange={(e) => form.setData('cursorSize', Number(e.target.value))}
                        />
                      </label>

                      <label>
                        Intensitas glow
                        <span className="range-value">{form.data.cursorGlow}%</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={form.data.cursorGlow}
                          onChange={(e) => form.setData('cursorGlow', Number(e.target.value))}
                        />
                      </label>

                      <label className="toggle-row">
                        <span>
                          Jejak pergerakan (Trail)
                          <small>Jejak halus mengalir saat kursor digerakkan.</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={form.data.cursorTrail}
                          onChange={(e) => form.setData('cursorTrail', e.target.checked)}
                        />
                      </label>
                    </>
                  )}
                  <p className="helper">
                    Kursor custom otomatis dimatikan pada perangkat layar sentuh. Kursor sistem I-beam tetap dipertahankan pada input teks.
                  </p>
                </>
              )}

              {/* Tab: Intro / Animasi Masuk */}
              {tab === 'intro' && (
                <>
                  <label className="toggle-row">
                    <span>
                      Aktifkan Animasi Masuk
                      <small>
                        Tampilkan layar pembuka dengan blur background dan tombol "Click here to enter" saat pengunjung pertama kali membuka profil publik.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.data.introEnabled}
                      onChange={(e) => form.setData('introEnabled', e.target.checked)}
                    />
                  </label>
                  <p className="helper">
                    Saat diaktifkan, pengunjung akan melihat background yang blur dengan ikon brand di tengah. Setelah mengklik, blur akan hilang dengan transisi halus dan profil lengkap ditampilkan. Animasi ini hanya muncul di halaman profil publik, bukan di preview dashboard.
                  </p>
                </>
              )}

              {/* Tab: Social Links */}
              {tab === 'links' && (
                <>
                  <p className="helper">Tambahkan Discord, Roblox, Instagram, atau tautan lainnya. Profil menampilkan ikon saja, dikenali dari URL atau nama platform. Nama tetap muncul saat ikon disorot.</p>
                  {form.data.links.map((link, i) => (
                    <div className="link-editor" key={i}>
                      <label>
                        Nama platform
                        <input
                          maxLength={40}
                          value={link.label}
                          onChange={(e) =>
                            form.setData(
                              'links',
                              form.data.links.map((l, n) =>
                                n === i ? { ...l, label: e.target.value } : l
                              )
                            )
                          }
                        />
                      </label>
                      <label>
                        URL
                        <input
                          type="url"
                          placeholder="https://…"
                          value={link.url}
                          onChange={(e) =>
                            form.setData(
                              'links',
                              form.data.links.map((l, n) =>
                                n === i ? { ...l, url: e.target.value } : l
                              )
                            )
                          }
                        />
                      </label>
                      <div className="link-actions">
                        <button
                          aria-label="Naik"
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          aria-label="Turun"
                          disabled={i === form.data.links.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          aria-label="Hapus tautan"
                          onClick={() =>
                            form.setData(
                              'links',
                              form.data.links.filter((_, n) => n !== i)
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    disabled={form.data.links.length >= 12}
                    onClick={() => form.setData('links', [...form.data.links, { label: '', url: '' }])}
                  >
                    <Plus size={16} />
                    Tambah tautan
                  </Button>
                </>
              )}

              {/* Tab: Appearance */}
              {tab === 'appearance' && (
                <>
                  <label>
                    Warna aksen
                    <input
                      type="color"
                      value={form.data.accent}
                      onChange={(e) => form.setData('accent', e.target.value)}
                    />
                  </label>
                  {(
                    [
                      { key: 'opacity', label: 'Opacity kartu', min: 20, max: 100, unit: '%' },
                      { key: 'blur', label: 'Blur kaca', min: 0, max: 30, unit: 'px' },
                      { key: 'radius', label: 'Sudut kartu', min: 0, max: 48, unit: 'px' },
                    ] as const
                  ).map((s) => (
                    <label key={s.key}>
                      {s.label}
                      <span className="range-value">
                        {form.data[s.key]}
                        {s.unit}
                      </span>
                      <input
                        type="range"
                        min={s.min}
                        max={s.max}
                        value={form.data[s.key]}
                        onChange={(e) => form.setData(s.key, Number(e.target.value))}
                      />
                    </label>
                  ))}
                  <label className="toggle-row">
                    <span>
                      Glow kartu
                      <small>Cahaya lembut mengikuti warna aksen.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.data.glow}
                      onChange={(e) => form.setData('glow', e.target.checked)}
                    />
                  </label>
                  <label className="toggle-row">
                    <span>
                      Animasi masuk kartu
                      <small>Transisi lembut saat kartu profil muncul.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.data.entrance}
                      onChange={(e) => form.setData('entrance', e.target.checked)}
                    />
                  </label>
                </>
              )}

              {Object.entries(form.errors).map(([key, value]) => (
                <p className="error" role="alert" key={key}>
                  {value}
                </p>
              ))}
              {form.progress && <p role="status">Upload {form.progress.percentage}%</p>}
            </div>

            <footer className="save-bar">
              <Button
                variant="ghost"
                disabled={!form.isDirty || form.processing}
                onClick={() => form.reset()}
              >
                Batalkan
              </Button>
              <Button onClick={save} disabled={form.processing || !form.isDirty}>
                <Save size={16} />
                {form.processing ? 'Menyimpan…' : 'Simpan draf'}
              </Button>
            </footer>
          </section>

          {/* Live Preview Panel */}
          <aside className="preview-panel">
            <div className="preview-toolbar">
              <span>
                <i /> LIVE PREVIEW
              </span>
              <div>
                <button
                  aria-label="Preview desktop"
                  className={!mobile ? 'selected' : ''}
                  onClick={() => setMobile(false)}
                >
                  <Monitor size={17} />
                </button>
                <button
                  aria-label="Preview mobile"
                  className={mobile ? 'selected' : ''}
                  onClick={() => setMobile(true)}
                >
                  <Smartphone size={17} />
                </button>
              </div>
            </div>

            <div className={mobile ? 'preview-frame mobile' : 'preview-frame'}>
              <ProfileCard profile={preview} preview />
            </div>

            <p className="preview-note">
              {form.isDirty ? 'Ada perubahan yang belum disimpan.' : 'Preview sesuai draf tersimpan.'}
            </p>

            <Button
              variant="outline"
              className="publish-button"
              disabled={form.isDirty || form.processing || publishing}
              onClick={() => {
                setPublishing(true);
                router.post(
                  '/dashboard/publish',
                  {},
                  { preserveScroll: true, onFinish: () => setPublishing(false) }
                );
              }}
            >
              {publishing ? 'Mempublikasikan…' : 'Publikasikan draf'}
              <ExternalLink size={15} />
            </Button>
            <small className="publish-hint">Simpan perubahan sebelum mempublikasikan.</small>
          </aside>
        </div>

        {flash?.success && (
          <p className="toast" role="status">
            {flash.success}
          </p>
        )}
      </main>

      {/* Avatar Image Cropper Modal */}
      {showCropper && cropperImageSrc && (
        <ImageCropperModal
          imageSrc={cropperImageSrc}
          fileName={cropperFileName}
          onApply={(croppedFile) => {
            form.setData('avatarFile', croppedFile);
            setShowCropper(false);
          }}
          onCancel={() => {
            setShowCropper(false);
          }}
        />
      )}
    </div>
  );
}

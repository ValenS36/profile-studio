import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function PasswordReset({ token, email = '', status }: { token?: string; email?: string; status?: string }) {
  const reset = Boolean(token);
  const form = useForm({ email, token: token ?? '', password: '', password_confirmation: '' });
  return <main className="auth-shell">
    <Head title={reset ? 'Reset password' : 'Lupa password'} />
    <aside className="auth-art">
      <div className="brand"><span>✳</span> profile studio</div>
      <div><p className="eyebrow">YOUR SPACE. YOUR RULES.</p><h1>Kembali ke<br /><em>ruang pribadimu.</em></h1><p>Pulihkan akses dan lanjutkan ceritamu.</p></div>
      <small>PERSONAL PROFILE STUDIO / ACCOUNT RECOVERY</small>
    </aside>
    <section className="auth-form">
      <div className="lock-icon"><LockKeyhole size={22} /></div>
      <p className="eyebrow">ACCOUNT RECOVERY</p>
      <h1>{reset ? 'Buat password baru.' : 'Lupa password?'}</h1>
      <p className="muted">{reset ? 'Gunakan minimal 12 karakter untuk password barumu.' : 'Masukkan email akun pemilik. Kami akan mengirim tautan untuk mengatur ulang password.'}</p>
      {status && <p className="auth-status" role="status">{status}</p>}
      <form onSubmit={e => {
        e.preventDefault();
        form.post(reset ? '/reset-password' : '/forgot-password', {
          onFinish: () => form.reset('password', 'password_confirmation'),
        });
      }}>
        <label>Email<input type="email" required maxLength={255} autoComplete="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} /></label>
        {reset && <>
          <label>Password baru<input type="password" required minLength={12} autoComplete="new-password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} /></label>
          <label>Konfirmasi password<input type="password" required minLength={12} autoComplete="new-password" value={form.data.password_confirmation} onChange={e => form.setData('password_confirmation', e.target.value)} /></label>
        </>}
        {Object.values(form.errors).map((error, i) => <p role="alert" className="error" key={i}>{error}</p>)}
        <Button type="submit" disabled={form.processing}>{form.processing ? 'Memproses…' : reset ? 'Simpan password baru' : 'Kirim tautan reset'}<ArrowUpRight size={17} /></Button>
      </form>
      {reset && <Link href="/forgot-password" className="text-link">Minta tautan reset baru</Link>}
      <Link href="/login" className="text-link">Kembali ke login</Link>
    </section>
  </main>;
}

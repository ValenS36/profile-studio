import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Button } from '../components/ui/button';
export default function Auth({register,registrationOpen}:{register:boolean;registrationOpen:boolean}) {
 const { flash } = usePage<{ flash: { success?: string } }>().props;
 const form=useForm({name:'',email:'',password:'',password_confirmation:'',setup_token:''});
 return <main className="auth-shell"><Head title={register?'Buat akun pemilik':'Login'}/><aside className="auth-art"><div className="brand"><span>✳</span> profile studio</div><div><p className="eyebrow">YOUR SPACE. YOUR RULES.</p><h1>Everything you.<br/><em>In one place.</em></h1><p>Musik, cerita, dan semua hal yang membuatmu berbeda.</p></div><small>PERSONAL PROFILE STUDIO / 01</small></aside><section className="auth-form"><div className="lock-icon"><LockKeyhole size={22}/></div><p className="eyebrow">OWNER ACCESS</p><h1>{register?'Mulai ruang pribadimu.':'Selamat datang kembali.'}</h1><p className="muted">{register?'Buat satu akun untuk mengelola profilmu.':'Masuk untuk mengatur tampilan dan cerita profilmu.'}</p><>{flash?.success && <p className="auth-status" role="status">{flash.success}</p>}</><form onSubmit={e=>{e.preventDefault();form.post(register?'/register':'/login');}}>
 {register&&<label>Nama<input value={form.data.name} onChange={e=>form.setData('name',e.target.value)} required autoComplete="name"/></label>}
 <label>Email<input type="email" value={form.data.email} onChange={e=>form.setData('email',e.target.value)} required autoComplete="email"/></label>
 <label>Password<input type="password" minLength={register?12:undefined} value={form.data.password} onChange={e=>form.setData('password',e.target.value)} required autoComplete={register?'new-password':'current-password'}/></label>
 {register&&<><label>Konfirmasi password<input type="password" value={form.data.password_confirmation} onChange={e=>form.setData('password_confirmation',e.target.value)} required autoComplete="new-password"/></label><label>Token setup pemilik<input type="password" value={form.data.setup_token} onChange={e=>form.setData('setup_token',e.target.value)} required autoComplete="off"/><small>Token dari OWNER_SETUP_TOKEN pada .env.</small></label></>}
 {Object.values(form.errors).map((error,i)=><p role="alert" className="error" key={i}>{error}</p>)}<Button disabled={form.processing} type="submit">{form.processing?'Memproses…':register?'Buat akun':'Masuk ke dashboard'}<ArrowUpRight size={17}/></Button></form>
 {!register&&<Link className="text-link" href="/forgot-password">Lupa password?</Link>}
 {!register&&registrationOpen&&<Link className="text-link" href="/register">Setup akun pemilik →</Link>}<Link className="text-link" href="/">Kembali ke profil</Link></section></main>;
}

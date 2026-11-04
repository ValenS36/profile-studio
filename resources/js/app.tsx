import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
createInertiaApp({title: title => `${title} · Profile Studio`,resolve: name => resolvePageComponent(`./pages/${name}.tsx`,import.meta.glob('./pages/**/*.tsx')),setup({el,App,props}) {createRoot(el).render(<App {...props}/>);},progress:{color:'#b6a2ff'}});

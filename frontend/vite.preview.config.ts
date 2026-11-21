import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const sha=process.env.PREVIEW_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const branch=process.env.PREVIEW_BRANCH || execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();
export default defineConfig({
  base: process.env.PREVIEW_BASE || '/',
  build: { outDir: '../dist', emptyOutDir: true },
  plugins:[{
    name:'isolated-env-preview',enforce:'pre',
    resolveId(source,importer) {
      if(!importer?.includes('/src/')) return;
      if(/(^|\/)supabase$/.test(source)) return path.resolve('preview/client.ts');
      if(/(^|\/)sw-register$/.test(source)) return path.resolve('preview/no-service-worker.ts');
    },
    transform(code,id) {if(id.endsWith('/src/main.tsx')) return `import '../preview/boot';\n${code}`;},
    transformIndexHtml(html) {
      return html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="connect-src \'self\'; form-action \'none\'; object-src \'none\'; base-uri \'self\'">').replace('<title>','<title>พรีวิวข้อมูลจำลอง | ');
    },
  },react()],
  resolve:{alias:{'@':path.resolve('src')}},
  define:{__PREVIEW_SHA__:JSON.stringify(sha),__PREVIEW_BRANCH__:JSON.stringify(branch),__PREVIEW_BUILT__:JSON.stringify(new Date().toISOString())},
});

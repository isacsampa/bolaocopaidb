const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = ['index.html','app.html','login.html','participar.html','server.js','app.js','style.css'];
let errors = [];
let warnings = [];

// Check all files exist
files.forEach(f => {
  if(!fs.existsSync(path.join(ROOT, f))) {
    errors.push('MISSING FILE: ' + f);
  }
});

// Check broken links in HTML files
const htmlFiles = ['index.html','app.html','login.html','participar.html'];
htmlFiles.forEach(f => {
  const fpath = path.join(ROOT, f);
  if(!fs.existsSync(fpath)) return;
  const content = fs.readFileSync(fpath,'utf8');

  // Check for classificacao.html references
  if(content.includes('classificacao.html')) {
    errors.push(f + ': references classificacao.html (file does not exist!)');
  }

  // Check href references (local files only)
  const hrefRe = /href="([^"#?][^"?]*)"/g;
  let m;
  while ((m = hrefRe.exec(content)) !== null) {
    const val = m[1].split('?')[0].split('#')[0];
    if (val.startsWith('http') || val.startsWith('/') || val === '' || val.startsWith('mailto')) continue;
    if (val.includes('fonts.googleapis') || val.includes('fonts.gstatic')) continue;
    const target = path.join(ROOT, val);
    if (!fs.existsSync(target)) {
      errors.push(f + ': broken href -> ' + val);
    }
  }

  // Check src references (local files only)
  const srcRe = /src="([^"?#]+)"/g;
  while ((m = srcRe.exec(content)) !== null) {
    const val = m[1].split('?')[0].split('#')[0];
    if (val.startsWith('http') || val.startsWith('/') || val === '' || val.startsWith('data:')) continue;
    const target = path.join(ROOT, val);
    if (!fs.existsSync(target)) {
      errors.push(f + ': broken src -> ' + val);
    }
  }
});

// Check server.js syntax by looking for common issues
const serverPath = path.join(ROOT, 'server.js');
if (fs.existsSync(serverPath)) {
  const content = fs.readFileSync(serverPath, 'utf8');
  if (!content.includes('app.listen')) errors.push('server.js: missing app.listen');
  if (!content.includes('SUPABASE_URL')) warnings.push('server.js: SUPABASE_URL not referenced');
}

// Check .env exists and has required vars
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  if (!env.includes('SUPABASE_URL')) errors.push('.env: missing SUPABASE_URL');
  if (!env.includes('SUPABASE_KEY')) errors.push('.env: missing SUPABASE_KEY');
} else {
  warnings.push('.env file not found');
}

// Check package.json
const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  ['express','cors','@supabase/supabase-js','dotenv'].forEach(d => {
    if (!deps.includes(d)) errors.push('package.json: missing dependency ' + d);
  });
}

// Summary
console.log('\n========== DIAGNOSTICO DO PROJETO ==========\n');
if (errors.length === 0) {
  console.log('✅ Sem erros criticos encontrados!');
} else {
  console.log('❌ ERROS (' + errors.length + '):');
  errors.forEach(e => console.log('  • ' + e));
}
if (warnings.length > 0) {
  console.log('\n⚠️  AVISOS (' + warnings.length + '):');
  warnings.forEach(w => console.log('  • ' + w));
}
console.log('\n============================================\n');

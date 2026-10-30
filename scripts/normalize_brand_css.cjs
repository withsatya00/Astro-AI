// Keep arbitrary Tailwind colour classes in sync with the shared theme after a rebuild.
// Only declarations change; selectors still match the existing templates.
const fs=require('node:fs'),path=require('node:path'),postcss=require('postcss');
const root=path.resolve(__dirname,'..');
const tokens=fs.readFileSync(path.join(root,'website/frontend/src/styles/tokens.css'),'utf8');
const token=name=>{const value=tokens.match(new RegExp(name+':\\s*(#[0-9a-f]{6})','i'))?.[1];if(!value)throw new Error('Missing theme token '+name);return value.slice(1);};
const palette={'4a1b9a':token('--brand-primary'),'3b1580':token('--brand-hover'),'1e0b44':token('--brand-deep'),'6b3fc4':token('--brand-highlight'),'f4eefb':token('--brand-soft'),'211d50':token('--text-primary'),'1e1b4b':token('--color-navy-deep'),'e3d8f3':'edd9dc','0d0b24':'2b1019','2d1b41':'4b1727'};
const file=path.join(root,'website/frontend/css/tailwind.css');
const css=postcss.parse(fs.readFileSync(file,'utf8'));
css.walkDecls(decl=>{
  decl.value=decl.value.replace(/#([a-f0-9]{6})([a-f0-9]{2})?\b/gi,(whole,rgb,alpha)=>palette[rgb.toLowerCase()]?'#'+palette[rgb.toLowerCase()]+(alpha||''):whole);
  // Tailwind emits opacity-aware utility colours as space-separated RGB values.
  decl.value=decl.value.replace(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?=[\s/)])/g,(whole,r,g,b)=>{
    const key=[r,g,b].map(n=>Number(n).toString(16).padStart(2,'0')).join('');
    const replacement=palette[key];
    return replacement?'rgb('+[0,2,4].map(at=>parseInt(replacement.slice(at,at+2),16)).join(' '):whole;
  });
});
fs.writeFileSync(file,css.toString());
console.log('Tailwind colour declarations synced with theme tokens.');

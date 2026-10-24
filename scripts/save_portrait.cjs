// Export a generated portrait for web delivery; no face manipulation or recoloring.
const fs=require('node:fs'), path=require('node:path'), sharp=require('sharp');
const [source,slug]=process.argv.slice(2);
if (!source || !/^[a-z0-9-]+$/.test(slug||'')) throw new Error('Source and profile slug required');
const output=path.resolve('website/frontend/assets/portraits/individual',slug+'.webp');
fs.mkdirSync(path.dirname(output),{recursive:true});
sharp(source).rotate().resize(640,640,{fit:'cover',position:'centre'}).webp({quality:88}).toFile(output)
 .then(info=>console.log(JSON.stringify({slug,output,bytes:info.size}))).catch(error=>{console.error(error);process.exitCode=1;});

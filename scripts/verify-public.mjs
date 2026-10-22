import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const release=JSON.parse(await fs.readFile(path.join(root,'release.json'),'utf8'));
for(const file of release.files){
 const target=path.resolve(root,file.path);
 if(!target.startsWith(root+path.sep)||file.path.includes('..'))throw new Error('Unsafe release path');
 const bytes=await fs.readFile(target);
 if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error('Changed release asset: '+file.path);
}
async function list(dir,prefix=''){
 const result=[];
 for(const item of await fs.readdir(dir,{withFileTypes:true})){
  if(item.name==='.git'||item.name==='.netlify')continue;
  const name=prefix+item.name;
  if(item.isDirectory())result.push(...await list(path.join(dir,item.name),name+'/'));else result.push(name);
 }
 return result;
}
const names=await list(root),allowed=new Set([...release.files.map(f=>f.path),'release.json']);
if(names.some(n=>!allowed.has(n)))throw new Error('Unlisted files in publication repository');
if(names.filter(n=>/(^|\/)README[^/]*\.md$/i.test(n)).join()!=='README.md')throw new Error('Expected exactly one public README');
if(names.some(n=>/(^|\/)(docs|tests|prototypes|node_modules)(\/|$)|\.env|review-access|\.(?:parquet|wasm|map)$/.test(n)))throw new Error('Development/private files in public repository');
console.log('Verified publication repository: '+names.length+' files, '+release.generation+'.');

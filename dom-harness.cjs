// Minimal DOM contract harness, not a real browser. No third-party implementation.
const vm=require('node:vm'),fs=require('node:fs');
module.exports=function app(storage=new Map()){
 class Element{constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';this.value='';this.files=[];this.disabled=false;this.hidden=false;this.checked=false;}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this.children=xs;}addEventListener(k,f){this[k]=f;}click(){downloads.push({name:this.download,blob:urls.get(this.href)});}focus(){}scrollIntoView(){}}
 const downloads=[],urls=new Map(),events={},confirms=[];let answer=true,n=0;
 const html=fs.readFileSync('index.html','utf8'),ids={};for(const m of html.matchAll(/id="([^"]+)"/g))ids[m[1]]=new Element();ids.filter.value='all';ids.editor.hidden=true;ids['restore-box'].hidden=true;
 const c={document:{getElementById:id=>{if(!ids[id])throw Error('Missing HTML id '+id);return ids[id];},createElement:t=>new Element(t)},Tool:require('./core'),CSV:require('./csv'),SAMPLE:require('./sample.json'),Blob,TextEncoder,Date,console,setTimeout:fn=>fn(),confirm:message=>{confirms.push(message);return answer;},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},URL:{createObjectURL:b=>{const u='blob:'+ ++n;urls.set(u,b);return u;},revokeObjectURL:u=>urls.delete(u)},addEventListener:(k,f)=>events[k]=f};vm.runInNewContext(fs.readFileSync('app.js','utf8'),c);
 const all=e=>[e,...e.children.flatMap(all)];
 function edit(k,v){ids[k].value=v;ids[k].oninput();}
 function button(text){return all(ids.list).find(e=>e.tagName==='BUTTON'&&e.textContent===text);}
 return {ids,downloads,storage,events,confirms,edit,button,setConfirm:v=>answer=v,flatten:all,submit:()=>ids['edit-form'].onsubmit({preventDefault(){}}),getReport:()=>ids.output.textContent?JSON.parse(ids.output.textContent):null};
};

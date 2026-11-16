const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Tool=require('./core'),sample=require('./sample.json');
function app(){
 const downloads=[],urls=new Map();let next=0;
 class Element{constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';this.value='';this.files=[];this.disabled=false;}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this.children=xs;}addEventListener(k,fn){this[k]=fn;}click(){downloads.push({name:this.download,blob:urls.get(this.href)});}}
 const ids={};for(const id of ['input','output','download','status','sample','file','run','save','form'])ids[id]=new Element();
 const context={document:{getElementById:id=>ids[id],createElement:t=>new Element(t)},Tool,SAMPLE:sample,Blob,TextEncoder,setTimeout:fn=>fn(),URL:{createObjectURL:blob=>{const k='blob:test'+(++next);urls.set(k,blob);return k;},revokeObjectURL:k=>urls.delete(k)}};
 vm.runInNewContext(fs.readFileSync('form.js','utf8'),context);vm.runInNewContext(fs.readFileSync('app.js','utf8'),context);
 function flatten(e){return [e,...e.children.flatMap(flatten)];}
 function field(label){let els=flatten(ids.form),l=els.find(e=>e.tagName==='LABEL'&&e.textContent===label);return els.find(e=>e.id===l.htmlFor);}
 return {ids,downloads,field};
}
test('save list -> new page -> import -> edit -> report full cycle',async()=>{
 const first=app();first.ids.sample.onclick();let owner=first.field('负责人');owner.value='测试负责人改动';owner.oninput();first.ids.save.onclick();assert.equal(first.downloads[0].name,'subscription-list.json');const content=await first.downloads[0].blob.text();
 const second=app();assert.equal(JSON.parse(second.ids.input.value).subscriptions.length,0);second.ids.file.files=[{size:Buffer.byteLength(content),text:async()=>content}];await second.ids.file.onchange();assert.equal(second.field('负责人').value,'测试负责人改动');assert.equal(second.ids.download.disabled,true);
 second.field('负责人').value='恢复后继续编辑';second.field('负责人').oninput();second.ids.run.onclick();assert.equal(JSON.parse(second.ids.output.textContent).items[0].owner,'恢复后继续编辑');second.ids.save.onclick();const saved=JSON.parse(await second.downloads[0].blob.text());assert.equal(saved.subscriptions[0].owner,'恢复后继续编辑');assert.equal(saved.subscriptions[0].currency,sample.subscriptions[0].currency);assert.equal(saved.subscriptions[1].decision,sample.subscriptions[1].decision);
});
test('report file cannot replace existing list',async()=>{const a=app();a.ids.sample.onclick();const old=a.ids.input.value;const content=JSON.stringify(Tool.analyze(sample));a.ids.file.files=[{size:content.length,text:async()=>content}];await a.ids.file.onchange();assert.equal(a.ids.input.value,old);assert.match(a.ids.status.textContent,/报告不能/);});
test('incomplete list can be saved as draft and restored',()=>{const draft={asOf:'',subscriptions:[]};assert.deepEqual(Tool.readList(Tool.serializeList(JSON.stringify(draft))),draft);});
test('unicode saved bytes limited to import size',()=>{const s=JSON.stringify({asOf:'',subscriptions:[],notes:'中'.repeat(340000)});assert.ok(s.length<1000000);assert.throws(()=>Tool.serializeList(s),/1 MB/);});
test('invalid file leaves current list and report intact',async()=>{const a=app();a.ids.sample.onclick();a.ids.run.onclick();const old=a.ids.input.value,report=a.ids.output.textContent;a.ids.file.files=[{size:1,text:async()=>'{'}];await a.ids.file.onchange();assert.equal(a.ids.input.value,old);assert.equal(a.ids.output.textContent,report);});
test('new manual edit wins over pending restore',async()=>{const a=app();let resolve;a.ids.sample.onclick();a.ids.file.files=[{size:10,text:()=>new Promise(r=>resolve=r)}];const task=a.ids.file.onchange();a.field('负责人').value='新输入';a.field('负责人').oninput();resolve(JSON.stringify(sample));await task;assert.equal(JSON.parse(a.ids.input.value).subscriptions[0].owner,'新输入');});
test('save malformed data makes no download',()=>{const a=app();a.ids.input.value='{';a.ids.save.onclick();assert.equal(a.downloads.length,0);assert.match(a.ids.status.textContent,/未保存/);});

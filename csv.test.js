const {test}=require('node:test'),a=require('node:assert/strict'),CSV=require('./csv'),Tool=require('./core'),sample=require('./sample.json');
test('CSV export import preserves ordinary sample fields',()=>{const r=CSV.parseCSV(CSV.exportCSV(sample),'2026-01-01',Tool);a.deepEqual(r,sample);});
test('BOM quotes commas and embedded newlines',()=>{const x=structuredClone(sample);x.subscriptions[0].name='a,"b"';x.subscriptions[0].purpose='line1\nline2';a.deepEqual(CSV.parseCSV(CSV.exportCSV(x),x.asOf,Tool),x);});
test('formula export is neutralized',()=>{const x=structuredClone(sample);x.subscriptions[0].name='=SUM(A1:A2)';a.ok(CSV.exportCSV(x).includes("'=SUM"));});
test('unknown or duplicate headers rejected',()=>{a.throws(()=>CSV.parseCSV('name,name\nx,x','2026-01-01',Tool));a.throws(()=>CSV.parseCSV('unknown\nx','2026-01-01',Tool));});
test('unclosed quote rejected',()=>a.throws(()=>CSV.rows('name\n"x')));
test('numeric blank not silently zero',()=>{const x=CSV.exportCSV(sample).replace('"39"','""');a.throws(()=>CSV.parseCSV(x,sample.asOf,Tool),/金额/);});
test('absent ids generated without collision',()=>{const x=structuredClone(sample);x.subscriptions[0].id='';x.subscriptions[1].id='sub-1';const r=CSV.parseCSV(CSV.exportCSV(x),x.asOf,Tool);a.equal(r.subscriptions[0].id,'sub-2');});
test('CSV dates must agree',()=>{const x=CSV.exportCSV(sample).replace(/"2026-11-16"/,'"2026-11-15"');a.throws(()=>CSV.parseCSV(x,sample.asOf,Tool),/日期不一致/);});

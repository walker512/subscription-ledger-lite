'use strict';
const $=id=>document.getElementById(id),DRAFT_KEY='subscription-ledger-draft-v1',CONSENT_KEY='subscription-ledger-autosave-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
let model={schemaVersion:1,asOf:today(),subscriptions:[]},report=null,dirty=false,seq=0,editing=null,editDirty=false,undo=null,restoreCandidate=null,autoSaved=false,backupSnapshot=null,storageBlocked=false;
const currencyLabels={monthly:'每月',quarterly:'每季',yearly:'每年'},decisionLabels={review:'待复核',retain:'保留',cancel_candidate:'考虑取消'};
const fields=['name','amount','currency','cadence','subscription-status','nextRenewal','noticeDays','owner','purpose','decision'];
const say=s=>{$('status').textContent=s;};
function el(tag,txt,cls){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;}
function amount(n){return Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});}
function backupText(){return Tool.serializeList(JSON.stringify(model));}
function canReplace(reason){if(editDirty||dirty||model.subscriptions.length)return globalThis.confirm(reason+' 当前内容将被替换。未保存的改动会丢失，是否继续？');return true;}
function persist(){autoSaved=false;if(!$('autosave').checked){$('save-status').textContent=dirty?'有未备份改动，请保存清单备份。':'清单没有新的未备份改动。';return;}if(storageBlocked){$('save-status').textContent='本机旧草稿无法读取，已停止自动保存以避免覆盖。请先备份文件，再删除本机旧草稿。';return;}if(restoreCandidate){$('save-status').textContent='存在尚未恢复的旧草稿，当前改动暂未自动保存。请先恢复旧草稿或删除它。';return;}try{const content=backupText();localStorage.setItem(DRAFT_KEY,JSON.stringify({format:1,at:new Date().toISOString(),data:JSON.parse(content)}));autoSaved=true;$('save-status').textContent='已存本机自动草稿；建议另外保存文件备份。';}catch(e){$('save-status').textContent='本机草稿保存失败，请下载清单备份。';}}
function changed(){seq++;dirty=true;persist();render();}
function render(){
 $('asOf').value=model.asOf;$('count').textContent='共 '+model.subscriptions.length+' 项';$('add').disabled=model.subscriptions.length>=500;
 $('summary').replaceChildren();$('warnings').replaceChildren();$('download').disabled=true;$('output').textContent='';report=null;
 try{report=Tool.analyze(model);$('download').disabled=false;$('output').textContent=JSON.stringify(report,null,2);
  if(!report.totals.length)$('summary').append(el('p','还没有有效订阅。点击“添加订阅”，或载入虚构示例了解流程。','empty'));
  for(const t of report.totals){const card=el('article',undefined,'card');card.append(el('h3',t.currency),el('p','月等值','card-kicker'),el('p',amount(t.monthlyEquivalent),'big'),el('p','年化 '+amount(t.annualized)+' '+t.currency,'annual'));const candidate=report.cancellationScenario.find(c=>c.currency===t.currency);if(candidate?.annualizedCandidateAmount)card.append(el('p','考虑取消：年化 '+amount(candidate.annualizedCandidateAmount)+'（不是已省金额）','help'));$('summary').append(card);}
  const due=report.items.filter(i=>i.status==='active'&&i.daysUntilNoticeDeadline<=30);if(due.length)$('warnings').append(el('p',due.length+' 项需要近期复核（包括已过通知期限）。本工具不会发送系统提醒。','notice'));
  if(report.possibleDuplicates.length)$('warnings').append(el('p','发现同名有效订阅：'+report.possibleDuplicates.map(d=>d.name).join('、')+'。只是线索，请核实是否不同账号或计划。','notice'));
 }catch(e){$('warnings').append(el('p','清单尚未完整，暂不计算总额：'+e.message,'error'));}
 renderList();$('undo-box').hidden=!undo;if(undo)$('undo-text').textContent='已删除“'+(undo.row.name||'未命名订阅')+'”。可撤销上一次删除。';
}
function renderList(){const box=$('list');box.replaceChildren();let items=report?Tool.sortedItems(report.items,$('search').value,$('filter').value):model.subscriptions.filter(r=>($('filter').value==='all'||r.status===$('filter').value)&&(!($('search').value.trim())||[r.name,r.owner,r.purpose].some(v=>String(v||'').toLowerCase().includes($('search').value.trim().toLowerCase()))));
 if(!items.length){box.append(el('p',model.subscriptions.length?'没有匹配结果，试试清空搜索或切换“全部”。':'清单为空。先添加一项真实订阅。','empty'));return;}
 for(const r of items){
  const card=el('article',undefined,'subcard'),info=el('div',undefined,'row-info'),top=el('div',undefined,'row-top'),identity=el('div',undefined,'row-identity');identity.append(el('h3',r.name||'未命名订阅'));
  const meta=el('div',undefined,'metadata');meta.append(el('span',(r.currency||'未填币种')+' '+(typeof r.amount==='number'?amount(r.amount):'待填金额')+' / '+(currencyLabels[r.cadence]||'待填周期')),el('span',r.status==='cancelled'?'已取消':'有效'),el('span',decisionLabels[r.decision]||'待复核'));identity.append(meta);top.append(identity);
  if(r.status!=='cancelled'){const timeline=el('div',undefined,'timeline'),renew=el('div'),notice=el('div');renew.append(el('span','下次续订','date-label'),el('span',r.nextRenewal||'待填写','date-value'));notice.append(el('span','通知截止日','date-label'),el('span',r.noticeDeadline||'待校验',r.daysUntilNoticeDeadline!==null&&r.daysUntilNoticeDeadline<=30?'date-value urgent':'date-value'));timeline.append(renew,notice);top.append(timeline);}else top.append(el('p','不计总额 · 请核实实际取消状态','help'));
  info.append(top);
  if(r.status==='active'&&r.daysUntilNoticeDeadline!==null&&r.daysUntilNoticeDeadline<=30)info.append(el('p',r.action||'请核对截止日','row-alert'));
  const detail=el('details',undefined,'row-details');detail.append(el('summary','负责人、用途与计算明细'));detail.append(el('p','负责人：'+(r.owner||'未填写')+' ｜ 用途：'+(r.purpose||'未填写'),'help'));if(r.formula)detail.append(el('p','年化公式：'+r.formula+' = '+amount(r.annualized)+' '+r.currency,'help'));info.append(detail);
  const actions=el('div',undefined,'toolbar'),edit=el('button','编辑','secondary'),del=el('button','删除','danger');edit.onclick=()=>openEditor(r.id);del.onclick=()=>removeRow(r.id);actions.append(edit,del);card.append(info,actions);box.append(card);
 }

}
function setEditorStatus(){$('date-required').textContent=$('subscription-status').value==='active'?'*':'';$('nextRenewal').required=$('subscription-status').value==='active';}
function openEditor(id=null){if(editDirty&&!globalThis.confirm('放弃尚未加入清单的编辑？'))return;const r=id===null?{name:'',amount:'',currency:'CNY',cadence:'monthly',status:'active',nextRenewal:'',noticeDays:0,owner:'',purpose:'',decision:'review'}:model.subscriptions.find(r=>r.id===id);if(!r)return;editing=id;editDirty=false;$('editor-title').textContent=id===null?'添加订阅':'编辑订阅';$('commit').textContent=id===null?'加入清单':'保存修改';for(const k of fields)$(k).value=String(r[k==='subscription-status'?'status':k]??'');$('editor-error').textContent='';setEditorStatus();$('editor').hidden=false;$('name').focus?.();$('editor').scrollIntoView?.({behavior:'auto',block:'start'});}
function closeEditor(){$('editor').hidden=true;editing=null;editDirty=false;$('editor-error').textContent='';}
function editorRow(){const r={id:editing??Tool.nextId(model.subscriptions.concat(undo?[undo.row]:[]))};for(const k of fields){const v=$(k).value;r[k==='subscription-status'?'status':k]=['amount','noticeDays'].includes(k)?(v.trim()===''?null:Number(v)):v.trim();}if(r.noticeDays===null)r.noticeDays=0;r.currency=r.currency.toUpperCase();return r;}
$('edit-form').onsubmit=e=>{e.preventDefault();try{const row=editorRow();Tool.analyze({asOf:model.asOf||today(),subscriptions:[row]});const i=model.subscriptions.findIndex(r=>r.id===editing);if(editing!==null&&i<0)throw Error('该条目已不存在，请重新选择');if(i>=0)model.subscriptions[i]=row;else{if(model.subscriptions.length>=500)throw Error('最多500项');model.subscriptions.push(row);}closeEditor();changed();say('已保存到当前清单。'+($('autosave').checked?'':'请下载备份以便下次恢复。'));}catch(e){$('editor-error').textContent=e.message;}};
for(const k of fields)$(k).oninput=()=>{editDirty=true;seq++;if(k==='subscription-status')setEditorStatus();};
$('cancel-edit').onclick=()=>{if(editDirty&&!globalThis.confirm('放弃尚未保存到清单的编辑？'))return;closeEditor();};
$('add').onclick=()=>openEditor();
function removeRow(id){if(editDirty&&!globalThis.confirm('删除前需要放弃尚未加入清单的编辑，继续？'))return;const i=model.subscriptions.findIndex(r=>r.id===id);if(i<0)return;closeEditor();undo={row:clone(model.subscriptions[i]),index:i};model.subscriptions.splice(i,1);changed();say('已删除一项，可点击撤销。');}
$('undo').onclick=()=>{if(!undo)return;if(model.subscriptions.length>=500||model.subscriptions.some(r=>r.id===undo.row.id)){say('无法撤销：编号冲突或清单已满。');return;}model.subscriptions.splice(Math.min(undo.index,model.subscriptions.length),0,undo.row);undo=null;changed();say('已撤销删除。');};
$('asOf').oninput=()=>{model.asOf=$('asOf').value;changed();};$('search').oninput=renderList;$('filter').onchange=renderList;
function replace(next){model=next;undo=null;closeEditor();$('search').value='';$('filter').value='all';changed();}
$('sample').onclick=()=>{if(!canReplace('载入示例？'))return;replace(clone(SAMPLE));say('已载入虚构示例，不是你的实际账单。');};
$('new').onclick=()=>{if(!canReplace('新建空清单？'))return;replace({schemaVersion:1,asOf:today(),subscriptions:[]});say('已新建空清单。');};
function download(content,name,type='application/json;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('save').onclick=()=>{if(editDirty){say('请先将当前编辑“加入清单”或“保存修改”，再备份。');return;}try{backupSnapshot=backupText();download(backupSnapshot,'subscription-list.json');$('confirm-backup').hidden=false;$('save-status').textContent='已请求下载清单备份，请确认下载完成后点击下方确认。';say('此JSON文件可恢复编辑。');}catch(e){say('备份失败：'+e.message);}};
$('confirm-backup').onclick=()=>{try{if(backupSnapshot===backupText()){dirty=false;$('confirm-backup').hidden=true;$('save-status').textContent='你已确认备份文件，当前没有新增未备份改动。';}else say('下载后清单又有改动，请重新备份。');}catch(e){say('无法确认备份：'+e.message);}};
$('csv').onclick=()=>{if(editDirty){say('请先保存当前编辑到清单。');return;}try{Tool.analyze(model);download(CSV.exportCSV(model),'subscription-list.csv','text/csv;charset=utf-8');say('CSV已请求下载；公式前缀会加单引号防护。完整恢复请使用JSON备份。');}catch(e){say('CSV导出失败：'+e.message);}};
$('template').onclick=()=>download(CSV.exportCSV(SAMPLE),'subscription-template.csv','text/csv;charset=utf-8');
$('download').onclick=()=>{if(!report)return;download(JSON.stringify(report,null,2)+'\n','subscription-report.json');say('报告不可恢复编辑，备份请选“保存清单备份”。');};
$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;const n=++seq;if(file.size>1000000){say('文件超过1 MB，当前内容保留。');$('file').value='';return;}say('正在读取…');try{const raw=await file.text();if(n!==seq)return;const next=/\.csv$/i.test(file.name||'')?CSV.parseCSV(raw,model.asOf,Tool):Tool.readList(raw);const used=new Set();for(const row of next.subscriptions){if(row.id){if(used.has(row.id))throw Error('重复编号：'+row.id);used.add(row.id);}}for(const row of next.subscriptions)if(!row.id){row.id=Tool.nextId(next.subscriptions);}
 if(!canReplace('导入清单？')){say('已取消导入，当前内容保留。');return;}replace(next);say('已恢复清单，可以继续编辑。无效草稿字段需修正后才会计算。');}catch(e){if(n===seq)say('未导入，当前内容保留：'+e.message);}finally{$('file').value='';}};
$('autosave').onchange=()=>{if($('autosave').checked){try{localStorage.setItem(CONSENT_KEY,'yes');persist();}catch(e){$('autosave').checked=false;say('浏览器不允许本机存储，请用文件备份。');}}else{try{localStorage.removeItem(CONSENT_KEY);}catch{}autoSaved=false;$('save-status').textContent='自动保存已关闭。已有草稿仍保留，需删除请点“删除本机草稿”。';}};
$('forget').onclick=()=>{if(!globalThis.confirm('删除这个工具在本浏览器保存的草稿并关闭自动保存？已下载的备份和当前清单不受影响。'))return;try{localStorage.removeItem(DRAFT_KEY);localStorage.removeItem(CONSENT_KEY);restoreCandidate=null;storageBlocked=false;$('restore-box').hidden=true;$('autosave').checked=false;autoSaved=false;$('save-status').textContent='本机草稿已删除，自动保存已关闭。';}catch{say('浏览器拒绝删除，请在浏览器设置中处理站点数据。');}};
$('restore').onclick=()=>{if(!restoreCandidate)return;if(!canReplace('恢复本机草稿？'))return;const next=restoreCandidate;restoreCandidate=null;$('restore-box').hidden=true;replace(next);say('已恢复本机草稿。请另存文件备份。');};
function init(){try{$('autosave').checked=localStorage.getItem(CONSENT_KEY)==='yes';const raw=localStorage.getItem(DRAFT_KEY);if(raw){const draft=JSON.parse(raw);if(draft.format!==1)throw Error('unsupported');restoreCandidate=Tool.readList(JSON.stringify(draft.data));$('restore-box').hidden=false;}}catch(e){storageBlocked=true;$('save-status').textContent='本机草稿无法读取；没有覆盖它，可导入文件备份。';}render();}
globalThis.addEventListener?.('beforeunload',e=>{if(editDirty||(dirty&&!autoSaved)){e.preventDefault();e.returnValue='';}});
init();

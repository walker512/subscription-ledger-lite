'use strict';
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const MAX_BYTES=1000000;
function text(x,name,max=5000){if(typeof x!=='string'||!x.trim()||x.length>max)throw Error(name+'必须是非空文本（最多 '+max+' 字符）');return x.trim();}
function array(x,name,max=500){if(!Array.isArray(x)||x.length>max)throw Error(name+'必须是数组，最多 '+max+' 项');return x;}
function date(x){if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x)||!Number.isFinite(Date.parse(x+'T00:00:00Z'))||new Date(x+'T00:00:00Z').toISOString().slice(0,10)!==x||Number(x.slice(0,4))<1900)throw Error('日期需为1900年起的有效 YYYY-MM-DD');return x;}
function money(x){if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>1e9||Math.abs(x*100-Math.round(x*100))>0.00001)throw Error('金额必须是0至10亿的数值，最多两位小数');return Math.round(x*100);}
function parse(s){if(typeof s!=='string'||new TextEncoder().encode(s).length>MAX_BYTES)throw Error('文件或输入超过1 MB');let x=JSON.parse(s);if(!object(x))throw Error('顶层须为JSON对象');return x;}
function analyze(x){
 if(!object(x))throw Error('需要清单对象');const asOf=date(x.asOf),rows=array(x.subscriptions,'订阅清单');const ids=new Set(),groups=new Map(),items=[];
 rows.forEach((r,index)=>{try{
  if(!object(r))throw Error('订阅必须为对象');const id=text(r.id,'编号',100);if(ids.has(id))throw Error('重复订阅编号: '+id);ids.add(id);
  const name=text(r.name,'服务名称',200),currency=text(r.currency,'币种',3).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error('币种需三字母代码，如 CNY');
  const cents=money(r.amount),amount=cents/100,decision=r.decision??'review';if(!['retain','review','cancel_candidate'].includes(decision))throw Error('复核意向不合法');
  if(!['monthly','quarterly','yearly'].includes(r.cadence))throw Error('计费周期需每月、每季或每年');if(!['active','cancelled'].includes(r.status))throw Error('状态需有效或已取消');
  const notice=r.noticeDays??0;if(!Number.isInteger(notice)||notice<0||notice>365)throw Error('提前通知天数需0至365整数');
  const owner=r.owner??'',purpose=r.purpose??'';if(typeof owner!=='string'||owner.length>200||typeof purpose!=='string'||purpose.length>2000)throw Error('负责人最多200字符，用途最多2000字符');
  const next=r.nextRenewal||'';if(next)date(next);if(r.status==='active'&&!next)throw Error('有效订阅需填写下次续订日期');
  const factor={monthly:12,quarterly:4,yearly:1}[r.cadence],annualCents=cents*factor;
  let deadline=null,days=null;if(r.status==='active'){let d=new Date(next+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-notice);deadline=d.toISOString().slice(0,10);days=Math.round((Date.parse(deadline)-Date.parse(asOf))/86400000);}
  const item={id,name,currency,decision,owner:owner.trim(),purpose:purpose.trim(),amount,cadence:r.cadence,nextRenewal:next,noticeDays:notice,status:r.status,annualized:annualCents/100,monthlyEquivalent:annualCents/1200,formula:amount+' × '+factor,noticeDeadline:deadline,daysUntilNoticeDeadline:days,action:r.status==='cancelled'?'已标记取消，需自行核实':days<0?'通知期限已过，核实下一周期':days===0?'今天是通知截止日':days<=30?'30天内复核续订':'稍后复核',missingOwner:!owner.trim(),missingPurpose:!purpose.trim()};
  items.push(item);if(r.status==='active')groups.set(currency,(groups.get(currency)||0)+annualCents);
 }catch(e){throw Error('第 '+(index+1)+' 项：'+e.message);}});
 const names=new Map();for(const i of items.filter(i=>i.status==='active')){let k=i.name.toLocaleLowerCase();if(!names.has(k))names.set(k,[]);names.get(k).push(i.id);}
 return {asOf,warning:'按固定周期年化，不是实际现金流预测。币种分别汇总，不换汇、不计税、不自动取消。候选取消金额不是实际已省金额。',cancellationScenario:[...groups.keys()].map(currency=>({currency,annualizedCandidateAmount:items.filter(i=>i.status==='active'&&i.currency===currency&&i.decision==='cancel_candidate').reduce((n,i)=>n+Math.round(i.annualized*100),0)/100,meaning:'候选项年化金额，不是立即可省金额；须核查合同与实际取消'})),totals:[...groups].map(([currency,cents])=>({currency,annualized:cents/100,monthlyEquivalent:cents/1200})),possibleDuplicates:[...names].filter(([,v])=>v.length>1).map(([name,ids])=>({name,ids})),items};
}
function readList(s){
 const x=parse(s);if(typeof x.asOf!=='string'||!Array.isArray(x.subscriptions))throw Error('请选择清单JSON（需要 asOf 和 subscriptions）；分析报告不能恢复编辑');
 if(Object.keys(x).some(k=>!['asOf','subscriptions','schemaVersion'].includes(k)))throw Error('清单含不支持的顶层字段，请检查文件来源');
 if(x.schemaVersion!==undefined&&x.schemaVersion!==1)throw Error('不支持此清单版本');array(x.subscriptions,'订阅清单');
 const fields={id:100,name:200,currency:3,cadence:20,status:20,nextRenewal:10,owner:200,purpose:2000,decision:30};
 for(const r of x.subscriptions){if(!object(r))throw Error('订阅条目必须是对象');for(const k of Object.keys(r)){if(k==='amount'||k==='noticeDays'){if(r[k]!==null&&(typeof r[k]!=='number'||!Number.isFinite(r[k])))throw Error(k+'需为数值');}else if(!Object.hasOwn(fields,k)||typeof r[k]!=='string'||r[k].length>fields[k])throw Error('不支持或格式错误的清单字段：'+k);}}
 return x;
}
function serializeList(s){const x=readList(s),out=JSON.stringify(x,null,2)+'\n';if(new TextEncoder().encode(out).length>MAX_BYTES)throw Error('清单超过1 MB，请缩减后保存');return out;}
function nextId(rows){const ids=new Set(rows.map(r=>r.id));let n=1;while(ids.has('sub-'+n))n++;return 'sub-'+n;}
function sortedItems(items,query='',status='all'){const q=query.trim().toLocaleLowerCase();return items.filter(i=>(status==='all'||i.status===status)&&(!q||[i.name,i.owner,i.purpose].some(x=>(x||'').toLocaleLowerCase().includes(q)))).slice().sort((a,b)=>{if(a.status!==b.status)return a.status==='active'?-1:1;const ad=a.noticeDeadline||'9999-12-31',bd=b.noticeDeadline||'9999-12-31';return ad.localeCompare(bd)||a.name.localeCompare(b.name);});}
const API={parse,analyze,readList,serializeList,nextId,sortedItems};if(typeof module!=='undefined')module.exports=API;else globalThis.Tool=API;

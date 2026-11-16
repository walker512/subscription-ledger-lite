"use strict";
const $=id=>document.getElementById(id);let report=null,seq=0;
function form(){if(!globalThis.FormEditor)return;try{let v=Tool.parse($('input').value);FormEditor.render($('form'),v,SAMPLE,data=>{seq++;clear();$('input').value=JSON.stringify(data,null,2);$('status').textContent='表单已修改，请重新生成';});}catch(e){$('form').replaceChildren();}}
function clear(){report=null;$('download').disabled=true;$('output').textContent='';}
$('input').addEventListener('input',()=>{seq++;clear();form();$('status').textContent='输入已改变，请重新生成';});
$('sample').onclick=()=>{seq++;clear();$('input').value=JSON.stringify(SAMPLE,null,2);form();$('status').textContent='已载入虚构示例';};
$('file').onchange=async()=>{
 const n=++seq,f=$('file').files[0];if(!f)return;
 if(f.size>1000000){$('status').textContent='未导入：文件超过1 MB，当前内容保留';return;}
 $('status').textContent='正在读取清单…';
 try{const raw=await f.text();if(n!==seq)return;const data=Tool.readList(raw);clear();$('input').value=JSON.stringify(data,null,2);form();$('status').textContent='清单已恢复，可以继续编辑；请重新生成报告';}
 catch(e){if(n===seq)$('status').textContent='未导入，当前内容保留：'+e.message;}
 finally{if(n===seq)$('file').value='';}
};
function downloadText(content,filename){const u=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('save').onclick=()=>{try{const content=Tool.serializeList($('input').value);downloadText(content,'subscription-list.json');$('status').textContent='已请求保存清单，请确认浏览器下载完成；可用此文件重新导入（草稿可能尚未通过检查）';}catch(e){$('status').textContent='未保存：'+e.message;}};
$('run').onclick=()=>{clear();try{report=Tool.analyze(Tool.parse($('input').value));$('output').textContent=JSON.stringify(report,null,2);$('download').disabled=false;$('status').textContent='已生成，仅供人工复核';}catch(e){$('status').textContent='无法生成：'+e.message;}};
$('download').onclick=()=>{if(!report)return;downloadText(JSON.stringify(report,null,2)+'\n','subscription-report.json');};

if(globalThis.FormEditor){$('input').value=JSON.stringify(FormEditor.blank(SAMPLE),null,2);form();}

/* Small local notebook. No remote account or data transfer. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpotNotebookModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const KEY='oceanbuddy_spot_notebook_v1',LIMIT=3,NOTE_LIMIT=1800;
  function clean(raw,ids){
    const valid=new Set(ids),obj=raw&&typeof raw==='object'?raw:{};
    const compare=[...new Set(Array.isArray(obj.compare)?obj.compare:[])].filter(id=>valid.has(id)).slice(0,LIMIT);
    const notes={};if(obj.notes&&typeof obj.notes==='object'&&!Array.isArray(obj.notes))for(const [id,note] of Object.entries(obj.notes))if(valid.has(id)&&typeof note==='string'&&note.trim())notes[id]=note.slice(0,NOTE_LIMIT);
    return {compare,notes};
  }
  function load(storage,ids){try{return clean(JSON.parse(storage.getItem(KEY)),ids);}catch(_){return clean(null,ids);}}
  function toggle(state,id,ids){
    if(!ids.includes(id))throw Error('Ce spot est introuvable.');
    const next=clean(state,ids),index=next.compare.indexOf(id);
    if(index>=0)next.compare.splice(index,1);
    else {if(next.compare.length===LIMIT)throw Error('Tu peux comparer trois spots. Retire un lieu pour en ajouter un autre.');next.compare.push(id);}
    return next;
  }
  function note(state,id,value,ids){if(!ids.includes(id))throw Error('Ce spot est introuvable.');const next=clean(state,ids);if(String(value).trim())next.notes[id]=String(value).slice(0,NOTE_LIMIT);else delete next.notes[id];return next;}
  function save(storage,state){storage.setItem(KEY,JSON.stringify(state));}
  return {KEY,LIMIT,NOTE_LIMIT,clean,load,toggle,note,save};
});

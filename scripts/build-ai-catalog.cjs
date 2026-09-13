const fs=require('fs'),vm=require('vm');
const app=fs.readFileSync('app.js','utf8');
const base=vm.runInNewContext(app.slice(app.indexOf('const SPOTS='),app.indexOf('const SCORES='))+';SPOTS');
const rules=app.slice(app.indexOf('const SPORTS='),app.indexOf('function spotCard'))+'\n'+app.slice(app.indexOf('const FAUNA='),app.indexOf('const ZONES='));
const activityFor=vm.runInNewContext(rules+';spotSports');
const data=JSON.parse(fs.readFileSync('data/catalog-expansion.json'));
const extras=data.spots.map(s=>({...s,source:data.sources[s.sourceKey]}));
const catalog=[...base,...extras].map(s=>({id:s.id,name:s.name,location:s.loc,activities:activityFor(s),level:s.level,description:s.desc,source:s.source?.url||null,waterType:s.waterType||(['annecy','verdon','gardalake','hoodriver','silfra','cenote_dosojos'].includes(s.id)?'inland':'sea')}));
fs.writeFileSync('netlify/functions/lib/catalog.json',JSON.stringify(catalog));console.log(catalog.length+' destinations in the assistant catalogue');

"""Build a read-only migration index for destinations removed from public search."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'data/legacy-bonus-spots.json').read_text())
rows = data['spots']
if len(rows) != 44 or [row['id'] for row in rows] != [f'bonus-{i}' for i in range(44)]:
    raise SystemExit('Legacy bonus index must preserve all 44 original IDs')
source = json.dumps({row['id']: row for row in rows}, ensure_ascii=False, separators=(',', ':'))
(ROOT / 'legacy-spots.js').write_text('''/* Hidden migration index. These entries are not part of the public catalogue. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanLegacySpots=api})(typeof window!=='undefined'?window:globalThis,function(){
  const rows=__ROWS__;
  const get=id=>rows[id]||null;
  const canonicalId=id=>get(id)?.canonicalId||null;
  const archive=id=>{const row=get(id);return row?{id:row.id,name:row.name,loc:row.loc,world:row.world,coords:row.coords}:null;};
  return Object.freeze({get,canonicalId,archive,ids:Object.freeze(Object.keys(rows))});
});
'''.replace('__ROWS__', source))
print(len(rows), 'legacy destinations indexed')

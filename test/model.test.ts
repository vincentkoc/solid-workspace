import {test} from 'node:test';
import assert from 'node:assert/strict';
import {close,groups,move,parseLayout,resize,select,type Layout} from '../src/model';
const base = ():Layout => ({version:1,root:{kind:'split',id:'root',axis:'horizontal',ratio:.5,first:{kind:'group',id:'a',tabs:[{id:'one',title:'One'},{id:'two',title:'Two'}],selected:'one'},second:{kind:'group',id:'b',tabs:[{id:'three',title:'Three'}],selected:'three'}}});
test('cross-group moves conserve tab identity and remove empty source',()=>{
 const before=base(), tab=groups(before.root)[1].tabs[0], after=move(before,'three',{group:'a',index:1});
 assert.equal(after.root.kind,'group');assert.deepEqual(groups(after.root)[0].tabs.map(t=>t.id),['one','three','two']);assert.equal(groups(after.root)[0].tabs[1],tab);assert.equal(groups(before.root).length,2);
});
test('reorder uses original insertion slots',()=>{assert.deepEqual(groups(move(base(),'one',{group:'a',index:2}).root)[0].tabs.map(t=>t.id),['two','one']);});
test('edge splitting and close collapse preserve tree and selected fallback',()=>{
 const split=move(base(),'two',{group:'b',edge:'bottom',groupId:'c',splitId:'s'});
 assert.equal(split.root.kind,'split');assert.deepEqual(groups(split.root).map(g=>g.selected),['one','three','two']);
 assert.deepEqual(parseLayout(JSON.parse(JSON.stringify(split))),split);
 const after=close(close(split,'one'),'two');assert.equal(after.root.kind,'group');assert.equal(groups(after.root)[0].selected,'three');
});
test('invalid moves are atomic no-ops; pinned and locked constraints apply',()=>{
 const b=base();assert.equal(move(b,'one',{group:'missing'}),b);assert.equal(move(b,'one',{group:'b',edge:'left',groupId:'a',splitId:'new'}),b);assert.equal(move(b,'one',{group:'a',index:-1}),b);
 const p=base();groups(p.root)[0].tabs[0].pinned=true;assert.equal(close(p,'one'),p);assert.equal(move(p,'one',{group:'b'}),p);assert.equal(move(p,'three',{group:'a',index:0}),p);
 groups(p.root)[1].locked=true;assert.equal(move(p,'two',{group:'b'}),p);
});
test('selected tab changes, resize clamps and nonfinite input is rejected',()=>{const b=base();assert.equal(groups(select(b,'two').root)[0].selected,'two');assert.equal((resize(b,'root',10).root as {ratio:number}).ratio,.9);assert.equal(resize(b,'root',NaN),b);});
test('persistence rejects invalid selection, duplicates and unsupported versions',()=>{
 const b=base();groups(b.root)[1].tabs[0].id='one';assert.throws(()=>parseLayout(b));assert.throws(()=>parseLayout({...base(),version:2}));
 const c=base();groups(c.root)[0].selected='missing';assert.throws(()=>parseLayout(c));
});
test('long operation sequence conserves valid serialization and unique tabs',()=>{
 let b=base();for(let i=0;i<200;i++){const gs=groups(b.root), tab=gs[0].tabs[0];b=move(b,tab.id,{group:gs.at(-1)!.id,edge:i%3?'left':undefined,groupId:`g${i}`,splitId:`s${i}`});b=parseLayout(JSON.parse(JSON.stringify(b)));assert.equal(new Set(groups(b.root).flatMap(g=>g.tabs.map(t=>t.id))).size,3);}
});

import {createSignal,onCleanup} from 'solid-js';
import {render} from '@solidjs/web';
import {Workspace,parseLayout,type Layout,type Tab} from '../src';
import '../src/style.css';
const initial:Layout={version:1,root:{kind:'split',id:'main',axis:'horizontal',ratio:.6,first:{kind:'group',id:'editor',selected:'notes',tabs:[{id:'notes',title:'Notes'},{id:'counter',title:'Counter'}]},second:{kind:'group',id:'preview',selected:'frame',tabs:[{id:'frame',title:'Live frame'}]}}};
let mounts=0,disposals=0;
function Content(p:{tab:Tab}) {
 mounts++;onCleanup(()=>{disposals++;});
 const [count,setCount]=createSignal(0);
 return <section style={{padding:'16px'}}>
 {p.tab.id==='notes'?<><h2>Scratchpad</h2><textarea aria-label="Notes" placeholder="Type here, then move this tab" style={{width:'90%',height:'160px'}}/></>:p.tab.id==='counter'?<button onClick={()=>setCount(c=>c+1)}>Count: {count()}</button>:<iframe title="Live frame" srcdoc={'<body style="color:white;background:#161923"><p>Independent iframe state</p><input aria-label="Frame text"><script>window.bootId=crypto.randomUUID()</script>'}/>}
 </section>;
}
function App(){
 const [layout,setLayout]=createSignal(initial);
 Object.assign(window,{workspaceTest:{get layout(){return layout()},get mounts(){return mounts},get disposals(){return disposals}}});
 return <><header style={{padding:'12px',color:'white',background:'#10131c'}}>Solid 2 Workspace <button onClick={()=>localStorage.setItem('workspace',JSON.stringify(layout()))}>Save layout</button><button onClick={()=>{const saved=localStorage.getItem('workspace');if(saved)setLayout(parseLayout(JSON.parse(saved)));}}>Restore layout</button></header><div style={{height:'calc(100vh - 50px)'}}><Workspace layout={layout()} onChange={setLayout} renderTab={tab=><Content tab={tab()}/>}/></div></>;
}
render(()=><App/>,document.getElementById('app')!);

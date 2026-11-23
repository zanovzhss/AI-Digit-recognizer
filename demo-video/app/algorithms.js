(function(root){
'use strict';
function astar(rows,cols,walls,start,goal){
 const key=([r,c])=>r*cols+c, h=([r,c])=>Math.abs(r-goal[0])+Math.abs(c-goal[1]);
 const s=key(start),t=key(goal); if(walls.has(s)||walls.has(t))return {path:[],steps:[],cost:null};
 const open=new Set([s]),g=new Map([[s,0]]),parent=new Map(),closed=new Set(),steps=[];
 while(open.size){let u=[...open].sort((a,b)=>(g.get(a)+h([Math.floor(a/cols),a%cols]))-(g.get(b)+h([Math.floor(b/cols),b%cols]))||a-b)[0];
 open.delete(u);closed.add(u);steps.push({node:u,g:g.get(u),h:h([Math.floor(u/cols),u%cols]),frontier:[...open]});
 if(u===t){const path=[u];while(parent.has(path[0]))path.unshift(parent.get(path[0]));return {path,steps,cost:g.get(u)};}
 const r=Math.floor(u/cols),c=u%cols;
 for(const [nr,nc] of [[r-1,c],[r,c+1],[r+1,c],[r,c-1]]){if(nr<0||nc<0||nr>=rows||nc>=cols)continue;const v=nr*cols+nc;if(walls.has(v)||closed.has(v))continue;const ng=g.get(u)+1;if(ng<(g.get(v)??Infinity)){g.set(v,ng);parent.set(v,u);open.add(v);}}
 }
 return {path:[],steps,cost:null};
}
function hill(values,start){if(!Array.isArray(values)||values.length<2||!values.every(Number.isFinite)||!Number.isInteger(start)||start<0||start>=values.length)throw Error('Жарамсыз мәндер');let i=start;const path=[i];while(true){const neighbors=[i-1,i+1].filter(j=>j>=0&&j<values.length);const next=neighbors.sort((a,b)=>values[b]-values[a]||a-b)[0];if(values[next]<=values[i])break;i=next;path.push(i);}const global=Math.max(...values);return {path,index:i,value:values[i],global,isGlobal:values[i]===global};}
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function winner(b){for(const [a,c,d] of lines)if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?'draw':null;}
function minimax(board,turn='O',options={}){
 const limit=options.depth??9;let nodes=0;
 function heuristic(b){let score=0;for(const line of lines){const cells=line.map(i=>b[i]);if(!cells.includes('X'))score+=cells.filter(x=>x==='O').length;if(!cells.includes('O'))score-=cells.filter(x=>x==='X').length;}return score/100;}
 function solve(b,p,depth,replies){nodes++;const w=winner(b);if(w)return w==='O'?10-depth:w==='X'?depth-10:0;if(depth>=limit)return heuristic(b);const scores=[];for(let i=0;i<9;i++)if(!b[i]){b[i]=p;const score=solve(b,p==='O'?'X':'O',depth+1);b[i]=null;scores.push(score);if(replies)replies.push({move:i,score});}return p==='O'?Math.max(...scores):Math.min(...scores);}
 if(winner(board))return {move:null,scores:[],nodes:0};const b=[...board],scores=[];for(let i=0;i<9;i++)if(!b[i]){b[i]=turn;const replies=[];const score=solve(b,turn==='O'?'X':'O',1,replies);b[i]=null;scores.push({move:i,score,replies});}const sorted=[...scores].sort((a,b)=>(turn==='O'?b.score-a.score:a.score-b.score)||a.move-b.move);return {move:sorted[0].move,scores,nodes};
}
function bfs(rows,cols,walls,start,goal){
 const s=start[0]*cols+start[1],t=goal[0]*cols+goal[1],queue=[s],seen=new Set([s]),parent=new Map(),g=new Map([[s,0]]),steps=[];
 if(walls.has(s)||walls.has(t))return {path:[],steps:[],cost:null};
 for(let k=0;k<queue.length;k++){const u=queue[k],r=Math.floor(u/cols),c=u%cols;steps.push({node:u,g:g.get(u),h:0});if(u===t){const path=[u];while(parent.has(path[0]))path.unshift(parent.get(path[0]));return {path,steps,cost:g.get(u)};}for(const [nr,nc] of [[r-1,c],[r,c+1],[r+1,c],[r,c-1]])if(nr>=0&&nc>=0&&nr<rows&&nc<cols){const v=nr*cols+nc;if(!seen.has(v)&&!walls.has(v)){seen.add(v);parent.set(v,u);g.set(v,g.get(u)+1);queue.push(v);}}}return {path:[],steps,cost:null};
}
// Iterative depth-first graph search. Neighbor priority: up, right, down, left.
function dfs(rows,cols,walls,start,goal){
 const s=start[0]*cols+start[1],t=goal[0]*cols+goal[1],stack=[{node:s,parent:null,depth:0}],seen=new Set(),parent=new Map(),steps=[];
 if(walls.has(s)||walls.has(t))return {path:[],steps:[],cost:null};
 while(stack.length){const item=stack.pop(),u=item.node;if(seen.has(u))continue;seen.add(u);if(item.parent!==null)parent.set(u,item.parent);steps.push({node:u,g:item.depth,h:0});
 if(u===t){const path=[u];while(parent.has(path[0]))path.unshift(parent.get(path[0]));return {path,steps,cost:path.length-1};}
 const r=Math.floor(u/cols),c=u%cols;for(const [nr,nc]of [[r,c-1],[r+1,c],[r,c+1],[r-1,c]])if(nr>=0&&nc>=0&&nr<rows&&nc<cols){const v=nr*cols+nc;if(!walls.has(v)&&!seen.has(v))stack.push({node:v,parent:u,depth:item.depth+1});}
 }return {path:[],steps,cost:null};
}
function randomRestart(values,count=5,seed=42){
 if(!Number.isInteger(count)||count<1||count>20)throw Error('Restart саны 1–20 болуы керек');
 const random=seededRandom(seed),runs=Array.from({length:count},()=>{const start=Math.floor(random()*values.length);return {start,...hill(values,start)};});
 const best=runs.reduce((a,b)=>b.value>a.value?b:a);return {runs,best};
}
function seededRandom(seed){let state=Number(seed)>>>0;return ()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};}
function maze(rows,cols,start,goal,density=.25,seed=42){
 const random=seededRandom(seed),walls=new Set(),s=start[0]*cols+start[1],t=goal[0]*cols+goal[1];for(let i=0;i<rows*cols;i++)if(i!==s&&i!==t&&random()<density)walls.add(i);return walls;
}
const api={astar,bfs,dfs,hill,randomRestart,seededRandom,maze,winner,minimax};if(typeof module!=='undefined')module.exports=api;else root.AI=api;
})(typeof window!=='undefined'?window:globalThis);

import SVGPathCommander from 'svg-path-commander'
import { readFileSync } from 'node:fs'
const id = process.argv[2]
const src = readFileSync('features/qr-code/styles/background-shapes.ts','utf8')
const re = new RegExp('id: "'+id+'",[\\s\\S]*?viewBox: \\{ width: ([\\d.]+), height: ([\\d.]+) \\},[\\s\\S]*?path: "([^"]+)"')
const m = src.match(re)
const vb = {w:+m[1],h:+m[2]}
const cp = SVGPathCommander.pathToCurve(SVGPathCommander.parsePathString(m[3]))
const total = SVGPathCommander.getTotalLength(cp)
const step = Math.max(0.02, Math.min(vb.w,vb.h)/300)
const poly=[]
for(let l=0;l<total;l+=step){const p=SVGPathCommander.getPointAtLength(cp,l);const last=poly.at(-1);if(!last||p.x!==last[0]||p.y!==last[1])poly.push([p.x,p.y])}
function pip(x,y){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if(yi>y!==yj>y&&x<((xj-xi)*(y-yi))/(yj-yi)+xi)inside=!inside}return inside}
function pass(cx,cy,h){for(let i=0;i<=16;i++){const r=i/16;if(!pip(cx-h+2*h*r,cy-h)||!pip(cx-h+2*h*r,cy+h)||!pip(cx-h,cy-h+2*h*r)||!pip(cx+h,cy-h+2*h*r))return false}return true}
function maxH(cx,cy){let lo=0,hi=Math.min(vb.w,vb.h)/2;for(let i=0;i<14;i++){const mid=(lo+hi)/2;if(pass(cx,cy,mid))lo=mid;else hi=mid}return lo}
let best={cx:0,cy:0,h:0}
const G=25
for(let gy=0;gy<G;gy++)for(let gx=0;gx<G;gx++){const cx=vb.w*(gx+.5)/G,cy=vb.h*(gy+.5)/G;const h=maxH(cx,cy);if(h>best.h)best={cx,cy,h}}
console.log(id+': ['+(best.cx-best.h).toFixed(2)+', '+(best.cy-best.h).toFixed(2)+', '+(2*best.h).toFixed(2)+'],')

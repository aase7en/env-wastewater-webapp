import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ComponentRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ASSETS, EMPTY_SNAPSHOT, LAYOUT, SITE, readableMetric, readableMode,
  type AssetId, type WWTPViewSnapshot, type TankFootprint,
} from './wwtp-model';
import './WWTPDigitalTwin.css';

export interface WWTPDigitalTwinProps {
  snapshot?: WWTPViewSnapshot;
  className?: string;
  style?: CSSProperties;
  onAssetSelect?: (assetId: AssetId) => void;
  /** Visual annotations/equipment animation are illustrative, not operating state. */
  previewAnimation?: boolean;
}

type View = 'overview'|'plan'|'pump'|'aeration'|'clarifier'|'chlorine'|'drying'|'section'|'pipes';
type LayerName = 'terrain'|'concrete'|'water'|'pipes'|'equipment'|'building'|'labels';
type PipeColor = 'inflow'|'force'|'bypass'|'overflow'|'effluent'|'sludge'|'return'|'underdrain'|'dosing';
interface Slicer {enabled:boolean;x:number;y:number;z:number;useX:boolean;useY:boolean;useZ:boolean;cutaway:boolean}
interface ScenePalette {
 concrete: THREE.MeshStandardMaterial; inner: THREE.MeshStandardMaterial; rim: THREE.MeshStandardMaterial;
 terrain: THREE.MeshStandardMaterial; steel: THREE.MeshStandardMaterial; metal: THREE.MeshStandardMaterial;
 pump: THREE.MeshStandardMaterial; sand: THREE.MeshStandardMaterial; gravel: THREE.MeshStandardMaterial;
 roof: THREE.MeshStandardMaterial; walls: THREE.MeshStandardMaterial; glass: THREE.MeshStandardMaterial;
 water: THREE.MeshStandardMaterial; bubbles: THREE.MeshStandardMaterial; sludge: THREE.MeshStandardMaterial;
 pipes: Record<PipeColor,THREE.MeshStandardMaterial>;
}
const PIPE_COLORS:Record<PipeColor,number>={
 inflow:0x627787,force:0x1d59b3,bypass:0xff973f,overflow:0x18d0e6,
 effluent:0x89cafd,sludge:0xa16b43,return:0xd45e50,underdrain:0x9ba6b0,dosing:0xf4d46a,
};
const VIEWS:Record<View,{position:[number,number,number];target:[number,number,number];cutY?:number}>={
 overview:{position:[20,20,23],target:[0,-.5,0]},
 plan:{position:[.01,30,.01],target:[0,0,0]},
 pump:{position:[-8.5,5,.7],target:[-9.5,-1.3,-5.45]},
 aeration:{position:[12.5,5.6,-.2],target:[7.2,-.1,-5.1]},
 clarifier:{position:[12.6,6.4,7],target:[7.2,-1.5,.45],cutY:-1},
 chlorine:{position:[11.4,5.2,11.7],target:[8.1,-.4,5.95]},
 drying:{position:[5.1,6.7,12.2],target:[2.4,-.4,5.6]},
 section:{position:[18,11,23],target:[2,-1.4,1],cutY:-.35},
 pipes:{position:[9,13,20],target:[0,-1.8,0],cutY:-.12},
};
const FLOW: {name: string; view: View}[]=[
 {name:'ภาพรวม',view:'overview'}, {name:'บ่อสูบน้ำเสีย',view:'pump'}, {name:'บ่อเติมอากาศ',view:'aeration'},
 {name:'บ่อตกตะกอน',view:'clarifier'}, {name:'บ่อคลอรีน',view:'chlorine'}, {name:'ลานทราย',view:'drying'},
 {name:'หน้าตัด',view:'section'},
];

function useReducedMotion(){
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(mq.matches);mq.addEventListener('change',update);return()=>mq.removeEventListener('change',update);},[]);
 return reduced;
}

function useWebGL2(){
 const [supported,setSupported]=useState<boolean|null>(null);
 useEffect(()=>{
  const canvas=document.createElement('canvas');
  try{setSupported(!!canvas.getContext('webgl2'));}catch{setSupported(false);}
 },[]);
 return supported;
}

function createPalette(planes:THREE.Plane[]):ScenePalette{
 const standard=(color:number,extra:Record<string,unknown>={})=>new THREE.MeshStandardMaterial({
  color,roughness:.88,side:THREE.DoubleSide,clippingPlanes:planes,clipShadows:true,...extra
 });
 const translucent=(color:number,opacity:number)=>standard(color,{transparent:true,opacity,depthWrite:false,roughness:.16});
 const pipes={} as Record<PipeColor,THREE.MeshStandardMaterial>;
 (Object.keys(PIPE_COLORS) as PipeColor[]).forEach(key=>{pipes[key]=standard(PIPE_COLORS[key],{roughness:.35,metalness:.24});});
 return {
  concrete:standard(0xbac5c8),inner:standard(0x96aab3),rim:standard(0xe2e8e8),terrain:standard(0x82969e),
  steel:standard(0x657e8c,{roughness:.45,metalness:.68}),metal:standard(0xc9d6d9,{roughness:.28,metalness:.8}),
  pump:standard(0x176d9d,{roughness:.35,metalness:.5}),sand:standard(0xc8b27d,{roughness:1}),gravel:standard(0x7a8585),
  roof:standard(0x395465),walls:standard(0xd5d2c7),glass:translucent(0x74c3e8,.6),
  water:translucent(0x168bc5,.31),bubbles:translucent(0xb9f2ff,.62),sludge:translucent(0x806140,.51),pipes,
 };
}
function usePalette(planes:THREE.Plane[]){
 const m=useMemo(()=>createPalette(planes),[planes]);
 useEffect(()=>()=>{
  Object.values(m).forEach(v=>{
   if(v instanceof THREE.Material)v.dispose();
   else if(typeof v==='object')Object.values(v).forEach(x=>x.dispose());
  });
 },[m]);
 return m;
}

function Block({pos,size,mat,onHover}: {pos:[number,number,number];size:[number,number,number];mat:THREE.Material;onHover?: (e:ThreeEvent<PointerEvent>)=>void}){
 return <mesh position={pos} material={mat} castShadow receiveShadow onPointerOver={onHover}>
  <boxGeometry args={size}/>
 </mesh>;
}
function Cyl({pos,r,h,mat,onHover}: {pos:[number,number,number];r:number;h:number;mat:THREE.Material;onHover?:(e:ThreeEvent<PointerEvent>)=>void}){
 return <mesh position={pos} material={mat} castShadow onPointerOver={onHover}>
  <cylinderGeometry args={[r,r,h,22]}/>
 </mesh>;
}
function Segment({a,b,r,mat}: {a:[number,number,number];b:[number,number,number];r:number;mat:THREE.Material}){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
 const mid=start.clone().add(end).multiplyScalar(.5);
 const len=start.distanceTo(end);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());
 return <mesh position={mid} quaternion={q} material={mat} castShadow>
  <cylinderGeometry args={[r,r,len,12]}/>
 </mesh>;
}

function RectTank({layout,id,mat,cutaway,onHover,withFloor=true}:{layout:TankFootprint;id:AssetId;mat:ScenePalette;cutaway:boolean;onHover:(id:AssetId,e:ThreeEvent<PointerEvent>)=>void;withFloor?:boolean}){
 const {x,z,w,d,depth}=layout,wall=.19,parapet=.78;
 const wallH=depth+parapet,wallY=(parapet-depth)/2;
 const over=(e:ThreeEvent<PointerEvent>)=>onHover(id,e);
 return <group>
  {!cutaway&&<Block pos={[x,wallY,z-d/2+wall/2]} size={[w-2*wall,wallH,wall]} mat={mat.concrete} onHover={over}/>}
  <Block pos={[x,wallY,z+d/2-wall/2]} size={[w-2*wall,wallH,wall]} mat={mat.concrete} onHover={over}/>
  <Block pos={[x-w/2+wall/2,wallY,z]} size={[wall,wallH,d]} mat={mat.concrete} onHover={over}/>
  <Block pos={[x+w/2-wall/2,wallY,z]} size={[wall,wallH,d]} mat={mat.concrete} onHover={over}/>
  {withFloor&&<Block pos={[x,-depth+.1,z]} size={[w,.2,d]} mat={mat.concrete} onHover={over}/>}
  <Block pos={[x,parapet+.04,z+d/2-wall/2]} size={[w,.08,wall+.04]} mat={mat.rim}/>
  <Block pos={[x-w/2+wall/2,parapet+.04,z]} size={[wall+.04,.08,d]} mat={mat.rim}/>
  <Block pos={[x+w/2-wall/2,parapet+.04,z]} size={[wall+.04,.08,d]} mat={mat.rim}/>
  {!cutaway&&<Block pos={[x,parapet+.04,z-d/2+wall/2]} size={[w,.08,wall+.04]} mat={mat.rim}/>}
 </group>;
}
function Water({pos,size,mat,run,aeration=false}:{pos:[number,number,number];size:[number,number,number];mat:ScenePalette;run:boolean;aeration?:boolean}){
 return <group>
  <Block pos={pos} size={size} mat={mat.water}/>
  <WaveSurface x={pos[0]} z={pos[2]} width={size[0]} depth={size[2]} y={pos[1]+size[1]/2+.018} aeration={aeration} run={run} mat={mat}/>
 </group>;
}
function WaveSurface({x,z,width,depth,y,aeration,run,mat}:{x:number;z:number;width:number;depth:number;y:number;aeration:boolean;run:boolean;mat:ScenePalette}){
 const geo=useMemo(()=>{const g=new THREE.PlaneGeometry(width,depth,32,32);g.rotateX(-Math.PI/2);return g;},[width,depth]);
 const base=useMemo(()=>geo.attributes.position.array.slice(),[geo]);
 const ref=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{
  if(!ref.current)return;
  const attr=geo.attributes.position;
  const positions=attr.array;
  const elapsed=clock.elapsedTime;
  const amp=aeration?.095:.032;
  for(let i=0;i<positions.length;i+=3){
   const xx=base[i],zz=base[i+2];
   positions[i+1]=run?amp*(Math.sin(xx*3.2+elapsed*1.8)*Math.cos(zz*2.9+elapsed*1.25)+.4*Math.sin(Math.hypot(xx,zz)*7.1-elapsed*2.2)):0;
  }
  attr.needsUpdate=true;
  geo.computeVertexNormals();
 });
 useEffect(()=>()=>geo.dispose(),[geo]);
 const surfaceMaterial=useMemo(()=>new THREE.MeshPhysicalMaterial({
  color:aeration?0x34a9d8:0x4db9d8,metalness:.12,roughness:.19,clearcoat:.72,
  clearcoatRoughness:.1,transparent:true,opacity:.86,side:THREE.DoubleSide,
  clippingPlanes:mat.water.clippingPlanes,clipShadows:true,
 }),[aeration,mat.water]);
 useEffect(()=>()=>surfaceMaterial.dispose(),[surfaceMaterial]);
 return <mesh ref={ref} geometry={geo} material={surfaceMaterial} position={[x,y,z]} receiveShadow/>;
}

function Terrain({mat}:{mat:ScenePalette}){
 // Cell subdivision keeps the ground open above the underground basins.
 const cells=useMemo(()=>{
  const tanks=Object.values(LAYOUT);
  const xs=[-SITE.width/2,SITE.width/2,...tanks.flatMap(t=>[t.x-t.w/2,t.x+t.w/2])].sort((a,b)=>a-b);
  const zs=[-SITE.depth/2,SITE.depth/2,...tanks.flatMap(t=>[t.z-t.d/2,t.z+t.d/2])].sort((a,b)=>a-b);
  const out:{x:number;z:number;w:number;d:number}[]=[];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
   const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2,w=xs[i+1]-xs[i],d=zs[j+1]-zs[j];
   if(w<.001||d<.001||tanks.some(t=>x>t.x-t.w/2&&x<t.x+t.w/2&&z>t.z-t.d/2&&z<t.z+t.d/2))continue;
   out.push({x,z,w,d});
  }
  return out;
 },[]);
 return <group>
  {cells.map((c,i)=><Block key={i} pos={[c.x,-.13,c.z]} size={[c.w,.26,c.d]} mat={mat.terrain}/>)}
  {[-SITE.depth/2,SITE.depth/2].map(z=><Block key={`z${z}`} pos={[0,.04,z]} size={[SITE.width,.13,.18]} mat={mat.steel}/>)}
  {[-SITE.width/2,SITE.width/2].map(x=><Block key={`x${x}`} pos={[x,.04,0]} size={[.18,.13,SITE.depth]} mat={mat.steel}/>)}
 </group>;
}

function frustumGeometry(top:number,bottom:number,yTop:number,yBottom:number,cx:number,cz:number,solid:boolean):THREE.BufferGeometry{
 const corners=(w:number,y:number)=>[[-w/2,y,-w/2],[w/2,y,-w/2],[w/2,y,w/2],[-w/2,y,w/2]];
 const a=corners(top,yTop),b=corners(bottom,yBottom),tri:number[]=[];
 const push=(p:number[],q:number[],r:number[],s:number[])=>{[p,q,r,p,r,s].forEach(v=>tri.push(v[0]+cx,v[1],v[2]+cz));};
 for(let i=0;i<4;i++){const j=(i+1)%4;push(a[i],a[j],b[j],b[i]);}
 if(solid){push(a[0],a[3],a[2],a[1]);push(b[3],b[0],b[1],b[2]);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(tri,3));g.computeVertexNormals();return g;
}
function ClarifierHopper({mat,onHover}:{mat:ScenePalette;onHover:(id:AssetId,e:ThreeEvent<PointerEvent>)=>void}){
 const t=LAYOUT.T004;
 const outer=useMemo(()=>frustumGeometry(3.6,.56,-1.2,-3.7,t.x,t.z,false),[t.x,t.z]);
 const inner=useMemo(()=>frustumGeometry(3.2,.23,-1.2,-3.63,t.x,t.z,false),[t.x,t.z]);
 const fluid=useMemo(()=>frustumGeometry(3.18,.23,-1.2,-3.55,t.x,t.z,true),[t.x,t.z]);
 const sludge=useMemo(()=>frustumGeometry(.73,.20,-3.10,-3.55,t.x,t.z,true),[t.x,t.z]);
 useEffect(()=>()=>{outer.dispose();inner.dispose();fluid.dispose();sludge.dispose();},[outer,inner,fluid,sludge]);
 const over=(e:ThreeEvent<PointerEvent>)=>onHover('T004',e);
 return <group>
  <mesh geometry={outer} material={mat.concrete} onPointerOver={over}/>
  <mesh geometry={inner} material={mat.inner} onPointerOver={over}/>
  <mesh geometry={fluid} material={mat.water} onPointerOver={over}/>
  <mesh geometry={sludge} material={mat.sludge} onPointerOver={over}/>
 </group>;
}
function Aspirator({pos,lean,mat,onHover}:{pos:[number,number,number];lean:[number,number];mat:ScenePalette;onHover:(id:AssetId,e:ThreeEvent<PointerEvent>)=>void}){
 const id:AssetId=pos[0]<6?'AER1':'AER2';const end:[number,number,number]=[pos[0]+lean[0],-1.2,pos[2]+lean[1]];
 return <group onPointerOver={e=>onHover(id,e)}>
  <Segment a={pos} b={end} r={.11} mat={mat.metal}/>
  <Cyl pos={pos} r={.24} h={.40} mat={mat.pump}/>
  <Cyl pos={end} r={.15} h={.20} mat={mat.steel}/>
 </group>;
}
function HopperWeir({mat}:{mat:ScenePalette}){
 const {x,z}=LAYOUT.T004;
 return <group>
  {[-1,1].flatMap(s=>[
   <Block key={`x${s}`} pos={[x+s*1.46,-.35,z]} size={[.15,.10,3.02]} mat={mat.metal}/>,
   <Block key={`z${s}`} pos={[x,-.35,z+s*1.46]} size={[3.02,.10,.15]} mat={mat.metal}/>,
  ])}
  {Array.from({length:15},(_,i)=>{
   const u=(i-7)*.19;
   return [-1,1].map(s=><Block key={`${i}-${s}`} pos={[x+u,-.26,z+s*1.37]} size={[.06,.08,.04]} mat={mat.metal}/>);
  })}
  <Cyl pos={[x,-.72,z]} r={.30} h={1.52} mat={mat.metal}/>
  <Block pos={[x,.17,z+1.12]} size={[.55,.09,1.12]} mat={mat.steel}/>
 </group>;
}
function HipRoof({mat}:{mat:ScenePalette}){
 const x=-2.75,z=-5.3;
 const geo=useMemo(()=>{
  const e=3.13,h=4.1;
  const fl=[x-2.72,e,z-1.79],fr=[x+2.72,e,z-1.79],br=[x+2.72,e,z+1.79],bl=[x-2.72,e,z+1.79],r1=[x-1.28,h,z],r2=[x+1.28,h,z];
  const p:number[]=[];
  const q=(a:number[],b:number[],c:number[],d:number[])=>[a,b,c,a,c,d].forEach(v=>p.push(...v));
  q(fl,fr,r2,r1);q(br,bl,r1,r2);[fl,r1,bl,fr,br,r2].forEach(v=>p.push(...v));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
 },[]);
 useEffect(()=>()=>geo.dispose(),[geo]);
 return <mesh geometry={geo} material={mat.roof} castShadow/>;
}

const PIPES:{key:string;type:PipeColor;diameter:number;points:[number,number,number][]}[]=[
 {key:'raw',type:'inflow',diameter:.15,points:[[-11.7,-.45,-5.45],[-10.70,-.58,-5.45],[-10.20,-1.03,-5.45]]},
 {key:'pA',type:'force',diameter:.075,points:[[-10.28,-2.65,-5.45],[-10.28,-.22,-5.45],[-9.3,-.22,-5.45]]},
 {key:'pB',type:'force',diameter:.075,points:[[-9.72,-2.65,-5.45],[-9.72,-.22,-5.45],[-9.3,-.22,-5.45]]},
 {key:'force',type:'force',diameter:.075,points:[[-9.30,-.22,-5.45],[-6.6,-.22,-5.45],[-.2,-.22,-5.45],[3.46,-.22,-5.45],[4.67,-.19,-5.45],[4.92,.16,-5.43]]},
 {key:'bypass',type:'bypass',diameter:.075,points:[[-10.6,-1.13,-5.45],[-11.35,-.92,-5.45],[-11.35,-.92,7.82],[-4.0,-.92,7.82],[7.72,-.92,7.82],[8.10,-.45,7.35]]},
 {key:'overflow',type:'overflow',diameter:.15,points:[[7.20,.16,-2.70],[7.20,-.32,-2.26],[7.20,-.47,-1.42],[7.20,-.63,.45]]},
 {key:'clarified',type:'effluent',diameter:.15,points:[[8.6,.12,1.40],[9.55,-.15,1.4],[9.55,-.25,3.27],[8.10,-.35,4.30]]},
 {key:'out',type:'effluent',diameter:.15,points:[[8.10,-.45,7.40],[8.10,-.50,8.12],[10.65,-.51,8.12],[11.7,-.54,8.12]]},
 {key:'sludge',type:'sludge',diameter:.075,points:[[7.20,-3.78,.45],[6.40,-3.0,.45],[5.25,-1.55,1.45],[4.25,-1.25,1.45]]},
 {key:'ras',type:'return',diameter:.075,points:[[4.23,-1.25,1.46],[3.67,-1.24,.68],[3.67,-.65,-3.65],[4.82,-.49,-4.65]]},
 {key:'was',type:'sludge',diameter:.075,points:[[4.23,-1.25,1.46],[3.45,-1.15,2.70],[3.45,-.42,4.08],[3.20,-.20,4.43]]},
 {key:'drying',type:'sludge',diameter:.075,points:[[1.25,-.21,4.43],[2.40,-.21,4.43],[3.56,-.21,4.43]]},
 {key:'drain',type:'underdrain',diameter:.10,points:[[1.26,-1.05,6.55],[2.4,-1.05,6.55],[3.55,-1.05,6.55],[-.1,-1.10,7.48],[-10.15,-1.23,7.48],[-10.15,-1.35,-4.65]]},
 {key:'dose',type:'dosing',diameter:.02,points:[[8.40,.75,4.73],[8.72,.54,4.73],[8.72,-.34,5.2]]}
];
function PipeMesh({line,mat,run,speed}:{line:typeof PIPES[number];mat:ScenePalette;run:boolean;speed:number}){
 const shape=useMemo(()=>{
  const curve=new THREE.CatmullRomCurve3(line.points.map(p=>new THREE.Vector3(...p)),false,'centripetal',.06);
  const len=line.points.reduce((s,p,i)=>i?s+new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...line.points[i-1])):0,0);
  return {curve,len,geo:new THREE.TubeGeometry(curve,Math.max(24,Math.ceil(len*12)),line.diameter/2,10,false)};
 },[line]);
 useEffect(()=>()=>shape.geo.dispose(),[shape]);
 const arrows=useRef<THREE.InstancedMesh>(null);
 const dummy=useMemo(()=>new THREE.Object3D(),[]);
 const count=line.type==='dosing'?0:Math.min(16,Math.max(2,Math.floor(shape.len/1.55)));
 useFrame(({clock})=>{
  if(!arrows.current||!count)return;
  for(let i=0;i<count;i++){
   const t=(i/count + (run?clock.elapsedTime*speed*.7/Math.max(.1,shape.len):0))%1;
   const pos=shape.curve.getPointAt(t),tangent=shape.curve.getTangentAt(t).normalize();
   dummy.position.copy(pos);
   dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);
   dummy.scale.setScalar(1);
   dummy.updateMatrix();
   arrows.current.setMatrixAt(i,dummy.matrix);
  }
  arrows.current.instanceMatrix.needsUpdate=true;
 });
 return <group>
  <mesh geometry={shape.geo} material={mat.pipes[line.type]} castShadow/>
  {count>0&&<instancedMesh ref={arrows} args={[undefined,undefined,count]} material={mat.pipes[line.type]} frustumCulled={false}>
   <coneGeometry args={[.105,.32,10]}/>
  </instancedMesh>}
 </group>;
}

function BubbleField({mat,run}:{mat:ScenePalette;run:boolean}){
 const mesh=useRef<THREE.InstancedMesh>(null);
 const dummy=useMemo(()=>new THREE.Object3D(),[]);
 const seeds=useMemo(()=>Array.from({length:36},(_,i)=>({x:5.2+((i*0.73)%4),z:-7.1+((i*.51)%3.9),offset:((i*.19)%1),speed:.12+(i%5)*.04})),[]);
 useFrame(({clock})=>{
  if(!mesh.current)return;
  seeds.forEach((s,i)=>{
   const progress=run?((s.offset+clock.elapsedTime*s.speed)%1):s.offset;
   dummy.position.set(s.x,-2.10+progress*1.58,s.z);
   dummy.scale.setScalar(.035+(i%4)*.01);
   dummy.updateMatrix();mesh.current?.setMatrixAt(i,dummy.matrix);
  });
  mesh.current.instanceMatrix.needsUpdate=true;
 });
 return <instancedMesh ref={mesh} args={[undefined,undefined,seeds.length]} material={mat.bubbles}>
  <sphereGeometry args={[1,8,6]}/>
 </instancedMesh>;
}

function CameraRig({view}:{view:View}){
 const {camera}=useThree();
 const orbit=useRef<ComponentRef<typeof OrbitControls>>(null);
 const state=useRef<{from:THREE.Vector3;to:THREE.Vector3;fromTarget:THREE.Vector3;toTarget:THREE.Vector3;t:number}|null>(null);
 useEffect(()=>{
  const next=VIEWS[view];
  if(!orbit.current)return;
  camera.up.set(0,view==='plan'?0:1,view==='plan'?-1:0);
  state.current={from:camera.position.clone(),to:new THREE.Vector3(...next.position),fromTarget:orbit.current.target.clone(),toTarget:new THREE.Vector3(...next.target),t:0};
 },[view,camera]);
 useFrame((_,delta)=>{
  const a=state.current;if(!a||!orbit.current)return;
  a.t=Math.min(1,a.t+Math.min(delta,.05)/1.1);
  const s=a.t*a.t*(3-2*a.t);
  camera.position.lerpVectors(a.from,a.to,s);
  orbit.current.target.lerpVectors(a.fromTarget,a.toTarget,s);
  orbit.current.update();
  if(a.t===1)state.current=null;
 });
 return <OrbitControls ref={orbit} makeDefault enableDamping dampingFactor={.07} minDistance={1} maxDistance={85} maxPolarAngle={Math.PI*.96} onStart={()=>{state.current=null;}}/>;
}

function Scene({snapshot,slicer,layers,view,previewAnimation,reducedMotion,flowSpeed,onHover,onLeave,onSelect}:{
 snapshot:WWTPViewSnapshot;slicer:Slicer;layers:Record<LayerName,boolean>;view:View;previewAnimation:boolean;reducedMotion:boolean;flowSpeed:number;
 onHover:(id:AssetId,e:ThreeEvent<PointerEvent>)=>void;onLeave:()=>void;onSelect:(id:AssetId)=>void;
}){
 const planes=useMemo(()=>[new THREE.Plane(new THREE.Vector3(-1,0,0),12),new THREE.Plane(new THREE.Vector3(0,-1,0),5),new THREE.Plane(new THREE.Vector3(0,0,-1),9)],[]);
 useEffect(()=>{
  planes[0].constant=slicer.x;planes[1].constant=slicer.y;planes[2].constant=slicer.z;
 },[planes,slicer.x,slicer.y,slicer.z]);
 const active=useMemo(()=>slicer.enabled?[...(slicer.useX?[planes[0]]:[]),...(slicer.useY?[planes[1]]:[]),...(slicer.useZ?[planes[2]]:[])]:[],[slicer.enabled,slicer.useX,slicer.useY,slicer.useZ,planes]);
 const materials=usePalette(active);
 const onAsset=(id:AssetId)=>(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();onHover(id,event);};
 const aer=LAYOUT.T003,clar=LAYOUT.T004,contact=LAYOUT.T005,beds=LAYOUT.T006;
 return <>
  <color attach="background" args={['#0a1724']}/>
  <ambientLight intensity={1.0}/>
  <hemisphereLight args={['#d6efff','#456070',2]}/>
  <directionalLight position={[-16,24,14]} intensity={3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-23} shadow-camera-right={23} shadow-camera-top={23} shadow-camera-bottom={-23}/>
  <CameraRig view={view}/>
  <group visible={layers.terrain}><Terrain mat={materials}/></group>
  <group visible={layers.concrete} onPointerOut={onLeave}>
   <RectTank id="T001" layout={LAYOUT.T001} mat={materials} cutaway={slicer.cutaway} onHover={onHover}/>
   <RectTank id="T008" layout={LAYOUT.T008} mat={materials} cutaway={slicer.cutaway} onHover={onHover}/>
   <RectTank id="T003" layout={aer} mat={materials} cutaway={slicer.cutaway} onHover={onHover}/>
   <RectTank id="T004" layout={{...clar,depth:1.2}} mat={materials} withFloor={false} cutaway={slicer.cutaway} onHover={onHover}/>
   <ClarifierHopper mat={materials} onHover={onHover}/>
   <Block pos={[clar.x,-4.04,clar.z]} size={[.6,.16,.6]} mat={materials.concrete}/>
   <RectTank id="T005" layout={contact} mat={materials} cutaway={slicer.cutaway} onHover={onHover}/>
   <RectTank id="T006" layout={beds} mat={materials} cutaway={slicer.cutaway} onHover={onHover}/>
   <Block pos={[beds.x,-.62,beds.z]} size={[.14,1.25,beds.d-.34]} mat={materials.concrete}/>
  </group>
  <group visible={layers.water} onPointerOut={onLeave}>
   <Water pos={[-10,-1.45,-5.45]} size={[1.1,2.1,1.1]} mat={materials} run={previewAnimation&&!reducedMotion}/>
   <Water pos={[aer.x,-1.03,aer.z]} size={[4.56,2.42,4.56]} mat={materials} run={previewAnimation&&!reducedMotion} aeration/>
   <Water pos={[clar.x,-.53,clar.z]} size={[3.18,1.31,3.18]} mat={materials} run={previewAnimation&&!reducedMotion}/>
   <Water pos={[contact.x,-.52,contact.z]} size={[1.14,1.32,2.60]} mat={materials} run={previewAnimation&&!reducedMotion}/>
   <BubbleField mat={materials} run={previewAnimation&&!reducedMotion}/>
  </group>
  <group visible={layers.equipment} onPointerOut={onLeave}>
   <Cyl pos={[-10.28,-2.93,-5.45]} r={.18} h={.48} mat={materials.pump} onHover={onAsset('P001A')}/>
   <Cyl pos={[-9.72,-2.93,-5.45]} r={.18} h={.48} mat={materials.pump} onHover={onAsset('P001B')}/>
   {Array.from({length:9},(_,i)=><Segment key={i} a={[-10.55,-3.1,-5.99+i*.11]} b={[-10.55,-.25,-5.99+i*.11]} r={.013} mat={materials.metal}/>)}
   <Aspirator pos={[5.85,.55,-6.25]} lean={[.6,.6]} mat={materials} onHover={onHover}/>
   <Aspirator pos={[8.40,.55,-3.95]} lean={[-.6,-.58]} mat={materials} onHover={onHover}/>
   <Block pos={[aer.x,.24,aer.z-1.78]} size={[4.54,.09,.55]} mat={materials.steel}/>
   <Block pos={[aer.x+1.78,.24,aer.z]} size={[.55,.09,4.05]} mat={materials.steel}/>
   <HopperWeir mat={materials}/>
   {[1.25,3.55].map(x=><group key={x}>
     <Block pos={[x,-.75,beds.z]} size={[1.7,.32,2.82]} mat={materials.gravel}/>
     <Block pos={[x,-.31,beds.z]} size={[1.7,.48,2.82]} mat={materials.sand}/>
   </group>)}
   <Block pos={[4.22,-1.36,1.46]} size={[1.1,.17,.65]} mat={materials.steel}/>
   <Cyl pos={[4.02,-1.12,1.46]} r={.15} h={.31} mat={materials.pump} onHover={onAsset('SP001')}/>
   <Cyl pos={[4.48,-1.12,1.46]} r={.15} h={.31} mat={materials.pump} onHover={onAsset('SP001')}/>
   <Block pos={[8.1,.28,4.73]} size={[.95,.12,.8]} mat={materials.steel}/>
   <Cyl pos={[8.1,.70,4.73]} r={.32} h={.73} mat={materials.metal} onHover={onAsset('CL001')}/>
  </group>
  <group visible={layers.pipes}>{PIPES.map(line=><PipeMesh key={line.key} line={line} mat={materials} run={previewAnimation&&!reducedMotion} speed={flowSpeed}/>)}</group>
  <group visible={layers.building} onPointerOver={onAsset('CTRL')} onPointerOut={onLeave}>
   <Block pos={[-2.75,1.55,-5.3]} size={[5,3,3]} mat={materials.walls}/>
   <Block pos={[-3.6,1.16,-6.84]} size={[1.1,2.23,.08]} mat={materials.steel}/>
   <Block pos={[-1.65,1.7,-6.84]} size={[1.45,1.13,.07]} mat={materials.glass}/>
   <HipRoof mat={materials}/>
  </group>
  <group visible={layers.labels}>
   {(['T001','T008','T003','T004','T005','T006','CTRL'] as const).map(id=>{
    const asset=ASSETS[id],data=snapshot.assets[id];
    return <Html key={id} position={[asset.center[0],asset.labelY,asset.center[2]]} center distanceFactor={14} zIndexRange={[10,0]}>
      <button className="wwtp-pin" type="button" onMouseEnter={e=>onHover(id,{nativeEvent:e.nativeEvent} as unknown as ThreeEvent<PointerEvent>)} onMouseLeave={onLeave} onFocus={e=>onHover(id,{nativeEvent:e.nativeEvent} as unknown as ThreeEvent<PointerEvent>)} onBlur={onLeave} onClick={()=>onSelect(id)}>
       <strong>{asset.code} · {asset.name}</strong>
       <small>{asset.short}</small>
       <span>{asset.metrics.slice(0,2).map(m=>`${m.label}: ${readableMetric(data?.[m.key])}`).join('  ·  ')||'รายละเอียดจุดงาน'}</span>
      </button>
    </Html>;
   })}
  </group>
 </>;
}

export default function WWTPDigitalTwin({snapshot=EMPTY_SNAPSHOT,className='',style,onAssetSelect,previewAnimation=true}:WWTPDigitalTwinProps){
 const supported=useWebGL2();
 const reducedMotion=useReducedMotion();
 const [view,setView]=useState<View>('overview');
 const [motionEnabled,setMotionEnabled]=useState(previewAnimation);
 const [flowSpeed,setFlowSpeed]=useState(1);
 const [hovered,setHovered]=useState<AssetId|null>(null);
 const [pointer,setPointer]=useState<[number,number]>([0,0]);
 const [layers,setLayers]=useState<Record<LayerName,boolean>>({terrain:true,concrete:true,water:true,pipes:true,equipment:true,building:true,labels:true});
 const [slicer,setSlicer]=useState<Slicer>({enabled:false,x:12,y:-.4,z:9,useX:false,useY:true,useZ:false,cutaway:false});
 const mode=readableMode(snapshot.mode);
 const hover=(id:AssetId,e:ThreeEvent<PointerEvent>)=>{
  const native=e.nativeEvent as PointerEvent|MouseEvent;
  setHovered(id);setPointer([native.clientX??window.innerWidth/2,native.clientY??window.innerHeight/2]);
 };
 const select=(id:AssetId)=>{onAssetSelect?.(id);setHovered(id);};
 const changeView=(v:View)=>{
  setView(v);
  setSlicer(prev=>({...prev,enabled:VIEWS[v].cutY!==undefined,useY:true,useX:false,useZ:false,y:VIEWS[v].cutY??prev.y,cutaway:['section','clarifier','pipes'].includes(v)}));
 };
 const metrics=hovered?ASSETS[hovered].metrics.map(m=>({label:m.label,value:readableMetric(snapshot.assets[hovered]?.[m.key])})):[];
 const x=Math.min(Math.max(pointer[0]+15,12),Math.max(12,window.innerWidth-345));
 const y=Math.min(Math.max(pointer[1]+15,12),Math.max(12,window.innerHeight-400));
 const wrapperClasses=`wwtp-twin ${className}`.trim();
 return <div className={wrapperClasses} style={style}>
  <header className="wwtp-head">
   <span className="wwtp-kicker">UTH[AI] · ENV DIGITAL TWIN</span>
   <h2>ระบบบำบัดน้ำเสีย · Activated Sludge</h2>
   <div>Activated Sludge · Animated Process Digital Twin · Site Concept Layout</div>
   <span className="wwtp-source">{mode} · {snapshot.date??'ยังไม่มีวันที่บันทึก'} · {snapshot.mode==='live'?'ข้อมูลจาก Sensor':'ไม่ใช่สถานะ Sensor สด'}</span>
  </header>
  <div className="wwtp-stage">
   {supported===false?<div className="wwtp-fallback" role="status"><h3>ไม่รองรับ WebGL 2</h3><p>ยังใช้งานข้อมูลแบบข้อความได้ กระบวนการหลักคือ บ่อสูบน้ำเสีย → เติมอากาศ → ตกตะกอน → สัมผัสคลอรีน → ระบายน้ำทิ้ง</p></div>
   : supported===null?<div className="wwtp-fallback" role="status">กำลังตรวจสอบ WebGL…</div>
   : <Canvas shadows camera={{position:[19,17,22],fov:46,near:.03,far:200}} dpr={[1,1.8]} onCreated={({gl})=>{gl.localClippingEnabled=true;gl.outputColorSpace=THREE.SRGBColorSpace;}}>
      <Suspense fallback={null}>
       <Scene snapshot={snapshot} slicer={slicer} layers={layers} view={view} previewAnimation={motionEnabled} reducedMotion={reducedMotion} flowSpeed={flowSpeed} onHover={hover} onLeave={()=>setHovered(null)} onSelect={select}/>
      </Suspense>
     </Canvas>}
  </div>
  <aside className="wwtp-tools" aria-label="ตัวควบคุมโมเดล">
   <details open><summary>Cross-section · ตัดหน้าตัด</summary>
    <label><input type="checkbox" checked={slicer.enabled} onChange={e=>setSlicer(s=>({...s,enabled:e.target.checked}))}/> เปิด Clipping</label>
    {([['x','useX',-12,12],['y','useY',-5,5],['z','useZ',-9,9]] as const).map(([axis,toggle,min,max])=><div className="wwtp-slider" key={axis}>
     <label><input type="checkbox" checked={slicer[toggle]} onChange={e=>setSlicer(s=>({...s,[toggle]:e.target.checked}))}/> Cut {axis.toUpperCase()} {slicer[axis].toFixed(2)} m</label>
     <input aria-label={`Cut ${axis.toUpperCase()}`} type="range" min={min} max={max} step="0.05" value={slicer[axis]} onChange={e=>setSlicer(s=>({...s,[axis]:Number(e.target.value)}))}/>
    </div>)}
    <label><input type="checkbox" checked={slicer.cutaway} onChange={e=>setSlicer(s=>({...s,cutaway:e.target.checked}))}/> ซ่อนผนังด้านหน้า</label>
   </details>
   <details open><summary>Animation · การเคลื่อนไหว</summary>
    <label><input type="checkbox" checked={motionEnabled} onChange={e=>setMotionEnabled(e.target.checked)}/> น้ำกระเพื่อม / ฟอง / ลูกศรตามท่อ</label>
    <label>ความเร็วแสดงทิศทาง {flowSpeed.toFixed(1)}×</label>
    <input aria-label="ความเร็วลูกศรตามท่อ" type="range" min={0.2} max={2.5} step={0.1} value={flowSpeed} onChange={e=>setFlowSpeed(Number(e.target.value))}/>
   </details>
   <details><summary>Layers · การแสดงผล</summary>
    {(['terrain','concrete','water','pipes','equipment','building','labels'] as LayerName[]).map(key=><label key={key}><input type="checkbox" checked={layers[key]} onChange={e=>setLayers(s=>({...s,[key]:e.target.checked}))}/>{({terrain:'พื้นดิน',concrete:'โครงสร้างบ่อ',water:'ปริมาตรน้ำ',pipes:'ท่อ',equipment:'เครื่องจักร',building:'อาคาร',labels:'ป้ายภาษาไทย'} as Record<LayerName,string>)[key]}</label>)}
   </details>
   <details><summary>Camera · มุมกล้อง</summary>
    {(['overview','plan','pump','aeration','clarifier','chlorine','drying','section','pipes'] as View[]).map(v=><button type="button" key={v} onClick={()=>changeView(v)}>{({overview:'ภาพรวม',plan:'ผังด้านบน',pump:'บ่อสูบน้ำเสีย',aeration:'บ่อเติมอากาศ',clarifier:'กรวยตกตะกอน',chlorine:'บ่อคลอรีน',drying:'ลานทราย',section:'หน้าตัด',pipes:'เส้นทางท่อใต้ดิน'} as Record<View,string>)[v]}</button>)}
   </details>
  </aside>
  <nav className="wwtp-flow" aria-label="เลือกดูตามกระบวนการ">
   {FLOW.map(item=><button key={item.view} className={view===item.view?'active':''} onClick={()=>changeView(item.view)} type="button">{item.name}</button>)}
  </nav>
  {hovered&&<aside className="wwtp-hover-card" style={{left:x,top:y}} role="status">
   <strong>{ASSETS[hovered].code} · {ASSETS[hovered].name}</strong>
   <p>{ASSETS[hovered].purpose}</p>
   <dl>{metrics.map(m=><div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>
   <small>ต่อยอด: {ASSETS[hovered].future.join(' · ')}</small>
   <button type="button" onClick={()=>select(hovered)}>เลือกอุปกรณ์นี้</button>
  </aside>}
  <footer className="wwtp-caption">ANIMATED PROCESS DEMO · ลูกศรแสดงทิศทางกระบวนการ ไม่ใช่อัตราการไหลจริง · ข้อมูลภาพ 3D เป็นแบบจำลองอธิบายกระบวนการ ไม่ใช่ As-built BIM ที่ผ่านการรังวัด · ฟองอากาศเป็นภาพประกอบ · ค่าไม่มีข้อมูล ≠ 0 หรือ OFF</footer>
 </div>;
}

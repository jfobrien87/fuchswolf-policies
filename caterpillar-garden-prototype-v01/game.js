import { CONFIG as C } from './config.js';
import { LEVELS } from './levels.js';
import { audio, bindSoundControl } from './audio.js';

bindSoundControl(document.querySelector('#sound-toggle'));

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const STATES = Object.freeze({ ENTERING: 'ENTERING', PLAYING: 'PLAYING', COMPLETE: 'COMPLETE', GUIDE_TO_EXIT: 'GUIDE_TO_EXIT', EXITING: 'EXITING', TRANSITIONING: 'TRANSITIONING' });
const images = new Map();
let metadata, walk, paper, pieces = [], sockets = [], state = STATES.ENTERING, elapsed = 0;
let currentLevelIndex = C.INITIAL_LEVEL_INDEX;
let actorX = -C.CATERPILLAR_WIDTH, walkTime = 0, frame = 0, walking = false;
let active = null, open = false, exitedFor = 0, previous = null, cycle = 0;
let ready = false;
let guidePointerId = null, guideTargetX = C.CATERPILLAR_REST_X;
let guideMarkerFade = 0;
const guideHeadOffset = C.CATERPILLAR_WIDTH * C.GUIDE_HEAD_OFFSET_RATIO;
const guideMaxX = C.PORTAL.x + C.PORTAL.width / 2 - guideHeadOffset;
const exitEndX = C.PORTAL.occlusionX + C.EXIT_CLEARANCE;

const easeOut = t => 1 - (1 - t) ** 3;
const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
function setState(next) {
  state = next;
  elapsed = 0;
  canvas.dataset.state = state;
}
function loadLevel(index) {
  currentLevelIndex = index % LEVELS.length;
  const level = LEVELS[currentLevelIndex];
  const position = p => ({ x: p.x * C.WIDTH, y: p.y * C.HEIGHT });
  sockets = level.pieces.map((p,i) => ({
    id: `${level.id}-socket-${i}`, shape: p.shape, colour: p.colour,
    ...position(p.socket), size: (p.size ?? C.PIECE_SIZE) * C.SOCKET_SIZE / C.PIECE_SIZE,
    pieceSize: p.size ?? C.PIECE_SIZE, colourHint: level.colourHints === true,
  }));
  pieces = level.pieces.map((p,i) => {
    const start = position(p.start);
    return { id: `${level.id}-piece-${i}`, shape: p.shape, colour: p.colour,
      start, ...start, socket: sockets[i], targetId: sockets[i].id,
      size: p.size ?? C.PIECE_SIZE, placed: false, motion: null };
  });
  actorX = -C.CATERPILLAR_WIDTH;
  walkTime = 0; frame = 0; walking = false; active = null; open = false; exitedFor = 0;
  guidePointerId = null; guideTargetX = C.CATERPILLAR_REST_X;
  guideMarkerFade = 0;
  cycle++;
  setState(STATES.ENTERING);
}
function resize() {
  const host = canvas.parentElement;
  const style = getComputedStyle(host);
  const availableWidth = host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const availableHeight = host.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const scale = Math.min(availableWidth / C.WIDTH, availableHeight / C.HEIGHT);
  canvas.style.width = `${C.WIDTH * scale}px`;
  canvas.style.height = `${C.HEIGHT * scale}px`;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(C.WIDTH * scale * dpr);
  canvas.height = Math.round(C.HEIGHT * scale * dpr);
  ctx.setTransform(canvas.width / C.WIDTH, 0, 0, canvas.height / C.HEIGHT, 0, 0);
}
function makePaper() {
  const tile = document.createElement('canvas'); tile.width = tile.height = 180;
  const p = tile.getContext('2d');
  let seed = 19;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 2900; i++) {
    p.fillStyle = `rgba(122,105,70,${random() * 0.065})`;
    p.fillRect(random() * 180, random() * 180, 0.7, 0.7);
  }
  return ctx.createPattern(tile, 'repeat');
}
function arch(x, y, width, height) {
  ctx.beginPath(); ctx.moveTo(x, y + height); ctx.lineTo(x, y + width / 2);
  ctx.arc(x + width / 2, y + width / 2, width / 2, Math.PI, 0);
  ctx.lineTo(x + width, y + height); ctx.closePath();
}
function leaf(x, y, rotation, size, colour) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.fillStyle = colour;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-size * .6, -size * .5, -size * .4, -size, 0, -size);
  ctx.bezierCurveTo(size * .55, -size * .65, size * .5, -size * .25, 0, 0); ctx.fill(); ctx.restore();
}
function background() {
  ctx.fillStyle = '#f6f2e7'; ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
  ctx.fillStyle = paper; ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
  ctx.fillStyle = '#e8e9d5';
  ctx.beginPath(); ctx.moveTo(0, 687); ctx.bezierCurveTo(300, 639, 555, 691, 785, 675);
  ctx.bezierCurveTo(995, 663, 1180, 676, 1280, 651); ctx.lineTo(1280, 800); ctx.lineTo(0, 800); ctx.fill();
  ctx.fillStyle = '#e1e5cc';
  ctx.beginPath(); ctx.moveTo(0, 751); ctx.bezierCurveTo(430, 708, 810, 800, 1280, 723); ctx.lineTo(1280, 800); ctx.lineTo(0, 800); ctx.fill();
  [[56,726,-.6,31],[74,736,.6,39],[1200,751,-.6,28],[1220,760,.5,38]].forEach(a => leaf(...a, '#b4c192'));
  ctx.fillStyle = '#c7ceac';
  for (const [x,y,r] of [[293,726,4],[884,745,3],[105,765,3],[1065,702,4]]) { ctx.beginPath();ctx.ellipse(x,y,r*1.6,r,0,0,7);ctx.fill(); }
}
function doorway() {
  const p = C.PORTAL;
  ctx.save();
  ctx.fillStyle = '#d8d8b9'; arch(p.x - 13, p.y - 13, p.width + 26, p.height + 15);ctx.fill();
  ctx.fillStyle = '#bac79b'; arch(p.x - 5, p.y - 5, p.width + 10, p.height + 5);ctx.fill();
  arch(p.x, p.y, p.width, p.height);
  if (open) {
    const shade = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
    shade.addColorStop(0, '#769064');shade.addColorStop(1, '#304e3d');ctx.fillStyle = shade;ctx.fill();
    ctx.fillStyle = 'rgba(219,218,173,.3)';ctx.beginPath();ctx.ellipse(p.x+55, p.y+p.height-4, 55, 9, 0, 0, 7);ctx.fill();
  } else {
    ctx.fillStyle = '#c3cda9';ctx.fill();ctx.save();ctx.clip();
    ctx.strokeStyle = 'rgba(98,124,79,.13)';ctx.lineWidth = 2;
    for (let x=p.x+30; x < p.x+p.width; x+=31) {ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x,p.y+p.height);ctx.stroke();}
    ctx.restore();ctx.fillStyle = '#8c9e70';ctx.beginPath();ctx.arc(p.x+116,p.y+155,6,0,7);ctx.fill();
  }
  leaf(p.x+22,p.y+8,-.85,36,'#9daf7b');leaf(p.x+27,p.y+5,.4,27,'#a6b783');
  ctx.restore();
}
function fit(image, size) { const scale = size / Math.max(image.width,image.height);return { w:image.width*scale,h:image.height*scale }; }
function centered(image, x, y, size, scale = 1) {
  const {w,h} = fit(image,size);ctx.drawImage(image,x-w*scale/2,y-h*scale/2,w*scale,h*scale);
}
function drawPiece(p) {
  const image = images.get(`${p.shape}-${p.colour}`);
  const lifted = active?.piece === p;
  const bounce = p.motion?.kind === 'snap' ? Math.sin(Math.PI * p.motion.t / C.SNAP_DURATION) * .045 : 0;
  ctx.save();
  ctx.shadowColor = lifted ? 'rgba(75,63,33,.20)' : 'rgba(75,63,33,.09)';
  ctx.shadowBlur = lifted ? 15 : 3; ctx.shadowOffsetY = lifted ? 9 : 3;
  centered(image,p.x,p.y,p.size, lifted ? 1.06 : 1+bounce);
  ctx.restore();
}
function guideMarkerOpacity() {
  if(state!==STATES.GUIDE_TO_EXIT)return 0;
  return guidePointerId!==null ? 1 : guideMarkerFade/C.GUIDE_MARKER_FADE_DURATION;
}
function drawGuideMarker() {
  const opacity=guideMarkerOpacity();if(opacity<=0)return;
  const radius=C.GUIDE_MARKER_RADIUS;
  ctx.save();ctx.globalAlpha=opacity;
  ctx.translate(guideTargetX+guideHeadOffset,C.GROUND_Y-1);ctx.scale(1,.48);
  const glow=ctx.createRadialGradient(0,0,0,0,0,radius);
  glow.addColorStop(0,'rgba(255,239,162,.95)');
  glow.addColorStop(.5,'rgba(237,222,135,.65)');
  glow.addColorStop(1,'rgba(222,214,146,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(137,155,84,.75)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,radius*.62,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#fff7cf';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawActor() {
  const w=C.CATERPILLAR_WIDTH,h=w*metadata.frame_size_px.height/metadata.frame_size_px.width;
  let lift=0, stretch=1;
  if(state===STATES.COMPLETE) {
    const t=clamp((elapsed-C.COMPLETION_DELAY)/C.HAPPY_DURATION,0,1);
    lift=Math.sin(Math.PI*t)*22;stretch=1+Math.sin(Math.PI*2*t)*.035;
  }
  ctx.save();
  // The back of the open doorway occludes the character as it walks inside.
  if(open) {ctx.beginPath();ctx.rect(0,0,C.PORTAL.occlusionX,C.HEIGHT);ctx.clip();}
  ctx.fillStyle='rgba(96,94,58,.09)';ctx.beginPath();ctx.ellipse(actorX+w/2,C.GROUND_Y-2,w*.43,7,0,0,7);ctx.fill();
  const fw=metadata.frame_size_px.width,fh=metadata.frame_size_px.height;
  ctx.drawImage(walk,(frame%metadata.layout.columns)*fw,Math.floor(frame/metadata.layout.columns)*fh,fw,fh,
    actorX+(w-w/stretch)/2,C.GROUND_Y-h*stretch-lift,w/stretch,h*stretch);
  ctx.restore();
}
function debug() {
  if(!C.DEBUG)return;
  ctx.save();ctx.font='18px monospace';ctx.fillStyle='#304e3d';ctx.fillText(`${state} · level ${currentLevelIndex+1} · cycle ${cycle} · frame ${frame}`,25,35);
  ctx.lineWidth=1;ctx.strokeStyle='#be6650';
  for(const p of pieces) {
    const {w,h}=fit(images.get(`${p.shape}-${p.colour}`),p.size);
    ctx.strokeRect(p.x-w/2-C.HITBOX_PADDING,p.y-h/2-C.HITBOX_PADDING,w+C.HITBOX_PADDING*2,h+C.HITBOX_PADDING*2);
    ctx.beginPath();ctx.arc(p.socket.x,p.socket.y,C.SNAP_RADIUS,0,7);ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(C.CATERPILLAR_REST_X,420);ctx.lineTo(C.CATERPILLAR_REST_X,680);ctx.stroke();
  if(state===STATES.GUIDE_TO_EXIT) {
    const a=C.GUIDE_AREA;ctx.strokeRect(a.x,a.y,a.width,a.height);
    ctx.beginPath();ctx.arc(guideTargetX+guideHeadOffset,C.GROUND_Y-50,12,0,7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(C.DOOR_ENTRY_X,C.PORTAL.y);ctx.lineTo(C.DOOR_ENTRY_X,C.GROUND_Y);ctx.stroke();
  }
  ctx.restore();
}
function render() {
  background();doorway();
  for(const target of sockets) {
    centered(images.get(`${target.shape}-socket`),target.x,target.y,target.size);
    if(target.colourHint) {
      ctx.save();ctx.globalAlpha=C.SOCKET_COLOUR_HINT_OPACITY;
      centered(images.get(`${target.shape}-${target.colour}`),target.x,target.y,target.pieceSize);
      ctx.restore();
    }
  }
  drawGuideMarker();
  drawActor();
  for(const p of pieces) if(active?.piece!==p)drawPiece(p);
  if(active)drawPiece(active.piece);
  debug();
  if(state===STATES.TRANSITIONING) {ctx.fillStyle=`rgba(246,242,231,${Math.sin(Math.PI*clamp(elapsed/C.LEVEL_TRANSITION_DURATION,0,1))*.7})`;ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);}
}
function animatePiece(p, target, kind) {
  p.motion={from:{x:p.x,y:p.y},target,kind,t:0,duration:kind==='snap'?C.SNAP_DURATION:C.RETURN_DURATION};
}
function update(dt) {
  const previousElapsed=elapsed;
  elapsed+=dt;
  if(guidePointerId===null)guideMarkerFade=Math.max(0,guideMarkerFade-dt);
  for(const p of pieces) if(p.motion) {
    const m=p.motion;m.t+=dt;const t=easeOut(clamp(m.t/m.duration,0,1));
    p.x=m.from.x+(m.target.x-m.from.x)*t;p.y=m.from.y+(m.target.y-m.from.y)*t;
    if(m.t>=m.duration) {p.x=m.target.x;p.y=m.target.y;p.motion=null;}
  }
  walking=false;
  if(state===STATES.ENTERING && elapsed>=C.ENTRANCE_DELAY) {
    walking=true;actorX=Math.min(C.CATERPILLAR_REST_X,actorX+C.CATERPILLAR_WALK_SPEED*dt/1000);
    if(actorX===C.CATERPILLAR_REST_X) {walking=false;setState(STATES.PLAYING);}
  } else if(state===STATES.COMPLETE) {
    if(previousElapsed<C.COMPLETION_DELAY&&elapsed>=C.COMPLETION_DELAY)audio.playSfx('complete');
    if(!open&&elapsed>=C.COMPLETION_DELAY+C.HAPPY_DURATION) {open=true;audio.playSfx('door');}
    if(elapsed>=C.COMPLETION_DELAY+C.HAPPY_DURATION+C.DOOR_OPEN_DELAY) {
      guideTargetX=actorX;setState(STATES.GUIDE_TO_EXIT);
    }
  } else if(state===STATES.GUIDE_TO_EXIT) {
    const before=actorX;
    actorX=Math.min(guideTargetX,actorX+C.CATERPILLAR_WALK_SPEED*dt/1000);
    walking=actorX>before;
    if(actorX+guideHeadOffset>=C.DOOR_ENTRY_X-C.DOOR_ENTRY_TOLERANCE) {
      releaseGuide();guideMarkerFade=0;setState(STATES.EXITING);
    }
  } else if(state===STATES.EXITING) {
    // Exit has its own destination: never stop at the child's last guide target.
    if(actorX<exitEndX) {walking=true;actorX=Math.min(exitEndX,actorX+C.CATERPILLAR_WALK_SPEED*dt/1000);}
    else {exitedFor+=dt;if(exitedFor>=C.LEVEL_TRANSITION_DELAY)setState(STATES.TRANSITIONING);}
  } else if(state===STATES.TRANSITIONING && elapsed>=C.LEVEL_TRANSITION_DURATION)loadLevel(currentLevelIndex+1);
  if(walking) {walkTime+=dt;frame=Math.floor(walkTime/1000*(C.ANIMATION_FPS??metadata.recommended_fps))%metadata.frame_count;}
}
function tick(time) {
  if(!ready)return;
  const dt=previous===null?0:Math.min(time-previous,50);previous=time;
  if(!document.hidden){update(dt);render();}
  requestAnimationFrame(tick);
}
function logical(event) {
  const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*C.WIDTH/r.width,y:(event.clientY-r.top)*C.HEIGHT/r.height};
}
function setGuideTarget(event) {
  // Reversing a gesture may stop forward travel, but never moves the actor back.
  guideTargetX=clamp(logical(event).x-guideHeadOffset,actorX,guideMaxX);
  guideMarkerFade=C.GUIDE_MARKER_FADE_DURATION;
}
function releaseGuide(cancelled=false) {
  const id=guidePointerId;guidePointerId=null;
  if(cancelled) {guideTargetX=actorX;guideMarkerFade=0;}
  if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
}
function startDrag(event) {
  event.preventDefault();
  if(!ready||active||guidePointerId!==null||event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
  const pos=logical(event);
  if(state===STATES.GUIDE_TO_EXIT) {
    const a=C.GUIDE_AREA;
    if(pos.x<a.x||pos.x>a.x+a.width||pos.y<a.y||pos.y>a.y+a.height)return;
    guidePointerId=event.pointerId;setGuideTarget(event);canvas.setPointerCapture(event.pointerId);render();
    return;
  }
  if(state!==STATES.PLAYING)return;
  const candidates=pieces.filter(p=>{
    if(p.placed)return false;
    const {w,h}=fit(images.get(`${p.shape}-${p.colour}`),p.size);
    return Math.abs(pos.x-p.x)<=w/2+C.HITBOX_PADDING&&Math.abs(pos.y-p.y)<=h/2+C.HITBOX_PADDING;
  }).sort((a,b)=>Math.hypot(pos.x-a.x,pos.y-a.y)-Math.hypot(pos.x-b.x,pos.y-b.y));
  const piece=candidates[0];if(!piece)return;
  piece.motion=null;
  active={piece,id:event.pointerId,offset:{x:pos.x-piece.x,y:pos.y-piece.y}};
  audio.playSfx('pickup');
  canvas.setPointerCapture(event.pointerId);render();
}
function moveDrag(event) {
  event.preventDefault();
  if(state===STATES.GUIDE_TO_EXIT&&guidePointerId===event.pointerId) {setGuideTarget(event);render();return;}
  if(!active||active.id!==event.pointerId)return;
  const pos=logical(event),p=active.piece;
  p.x=clamp(pos.x-active.offset.x,0,C.WIDTH);p.y=clamp(pos.y-active.offset.y,0,C.HEIGHT);render();
}
function finishDrag(event,cancelled=false) {
  event.preventDefault();
  if(guidePointerId===event.pointerId) {
    if(!cancelled)setGuideTarget(event);
    releaseGuide(cancelled);return;
  }
  if(!active||active.id!==event.pointerId)return;
  if(!cancelled)moveDrag(event);
  const p=active.piece;active=null;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  const target=sockets.find(s=>s.id===p.targetId&&s.shape===p.shape&&s.colour===p.colour);
  if(!cancelled&&target&&Math.hypot(p.x-target.x,p.y-target.y)<=C.SNAP_RADIUS) {
    p.placed=true;animatePiece(p,target,'snap');
    audio.playSfx('correct');
    if(pieces.every(piece=>piece.placed))setState(STATES.COMPLETE);
  } else {
    animatePiece(p,p.start,'return');
    if(!cancelled)audio.playSfx('return');
  }
}
canvas.addEventListener('pointerdown',startDrag);
canvas.addEventListener('pointermove',moveDrag);
canvas.addEventListener('pointerup',e=>finishDrag(e));
canvas.addEventListener('pointercancel',e=>finishDrag(e,true));
canvas.addEventListener('lostpointercapture',e=>finishDrag(e,true));
canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const name of ['gesturestart','gesturechange','gestureend','touchmove'])document.addEventListener(name,e=>e.preventDefault(),{passive:false});
function suspend() {
  releaseGuide(true);
  if(active) {
    const {piece,id}=active;active=null;animatePiece(piece,piece.start,'return');
    if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  }
  previous=null;
}
document.addEventListener('visibilitychange',suspend);window.addEventListener('blur',suspend);
window.addEventListener('resize',()=>{resize();if(ready)render();});

async function loadImage(path) {
  const image=new Image();image.src=path;await image.decode();return image;
}
async function json(path) {const response=await fetch(path);if(!response.ok)throw new Error(`Cannot load ${path}`);return response.json();}
function validateLevels(manifest) {
  if(!LEVELS.length)throw new Error('At least one level is required');
  const ids=new Set();
  for(const level of LEVELS) {
    if(ids.has(level.id)||!level.pieces?.length)throw new Error(`Invalid level ${level.id}`);
    ids.add(level.id);
    for(const p of level.pieces) {
      if(!manifest.shapes[p.shape]?.[p.colour]||!manifest.shapes[p.shape]?.socket)throw new Error(`Missing artwork in level ${level.id}`);
      for(const pos of [p.start,p.socket])if(!pos||![pos.x,pos.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw new Error(`Invalid position in level ${level.id}`);
      if(p.size!==undefined&&(!Number.isFinite(p.size)||p.size<=0))throw new Error(`Invalid piece size in level ${level.id}`);
    }
  }
}
async function boot() {
  resize();paper=makePaper();background();
  const manifest=await json('./assets/manifest.json');
  validateLevels(manifest);
  metadata=await json(manifest.caterpillar.metadata);
  walk=await loadImage(manifest.caterpillar.image);
  if(walk.width!==metadata.sheet_size_px.width||walk.height!==metadata.sheet_size_px.height||metadata.frame_order!=='left-to-right, top-to-bottom')throw new Error('Walk metadata does not match sheet');
  await Promise.all(Object.entries(manifest.shapes).flatMap(([shape,colours])=>Object.entries(colours).map(async([colour,path])=>images.set(`${shape}-${colour}`,await loadImage(path)))));
  // Local-only app: every file needed for another visit is precached by the worker.
  if('serviceWorker' in navigator) {
    let timeout;
    try {
      await navigator.serviceWorker.register('./sw.js');
      await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Offline cache did not become ready')),10000);})]);
      canvas.dataset.offline='ready';
    }
    catch(error) {console.warn('Offline storage unavailable in this browser session.',error);canvas.dataset.offline='unavailable';}
    finally {clearTimeout(timeout);}
  }
  const initialIndex=C.DEBUG ? C.DEBUG_START_LEVEL-1 : C.INITIAL_LEVEL_INDEX;
  if(!Number.isInteger(initialIndex)||initialIndex<0||initialIndex>=LEVELS.length)throw new Error('Invalid starting level');
  await audio.init(manifest.audio).catch(error=>console.warn('Audio could not initialize; gameplay can continue.',error));
  ready=true;loadLevel(initialIndex);requestAnimationFrame(tick);
}

// Read-only inspection for development and repeatable browser checks; no gameplay shortcuts.
export function snapshot() {
  return {state,cycle,currentLevelIndex,levelId:LEVELS[currentLevelIndex].id,levelCount:LEVELS.length,actorX,frame,walking,open,guideTargetX,guiding:guidePointerId!==null,guideMarker:{x:guideTargetX+guideHeadOffset,opacity:guideMarkerOpacity()},actorHidden:open&&actorX>=C.PORTAL.occlusionX,active:active?.piece.shape??null,sockets:sockets.map(s=>({...s})),pieces:pieces.map(p=>({id:p.id,shape:p.shape,colour:p.colour,targetId:p.targetId,size:p.size,x:p.x,y:p.y,placed:p.placed,animating:!!p.motion}))};
}
boot().catch(error=>{console.error(error);document.querySelector('#load-error').hidden=false;});

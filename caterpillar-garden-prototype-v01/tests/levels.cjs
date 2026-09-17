const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const EXPECTED = [
  ['circle:red','square:blue','triangle:yellow','star:green'],
  ['circle:orange','square:purple','triangle:green','star:red'],
  ['heart:blue','rectangle:yellow','star:orange','circle:purple'],
  ['circle:red','square:blue','triangle:yellow','rectangle:green','star:purple','heart:orange'],
  ['circle:red','circle:blue','circle:yellow','circle:green'],
  ['circle:green','square:green','triangle:green','star:green'],
  ['heart:purple','rectangle:orange','triangle:blue','star:red','circle:yellow'],
  ['circle:orange','square:green','triangle:purple','rectangle:blue','star:red','heart:yellow'],
];

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true});
    const page=await context.newPage(), errors=[];
    let documentLoads=0;
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documentLoads++;});
    // Advance the real requestAnimationFrame loop with virtual time, without skipping states.
    const time=new Date('2026-09-18T00:00:00Z');
    await page.clock.install({time});await page.clock.pauseAt(time);
    await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765/');
    await page.locator('canvas[data-state="ENTERING"][data-offline="ready"]').waitFor();
    await page.evaluate(async()=>{window.inspectGame=(await import('./game.js')).snapshot;});
    const snapshot=()=>page.evaluate(()=>window.inspectGame());
    const advance=ms=>page.clock.runFor(ms);
    const point=async(x,y)=>{const r=await page.locator('canvas').boundingBox();return {x:r.x+x*r.width/1280,y:r.y+y*r.height/800};};
    const drag=async(piece,target)=>{
      const a=await point(piece.x,piece.y),b=await point(target.x,target.y);
      await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});await page.mouse.up();
      await advance(400);
    };
    const originalMainDocumentLoads=documentLoads;
    // All art and levels have been precached. Test the complete progression offline.
    await context.setOffline(true);
    for(let index=0;index<8;index++) {
      let s=await snapshot();
      assert.equal(s.state,'ENTERING');assert.equal(s.currentLevelIndex,index);assert.equal(s.levelCount,8);
      assert.ok(s.actorX<=-295);assert.equal(s.open,false);assert.equal(s.guiding,false);
      assert.equal(s.guideMarker.opacity,0);assert.ok(s.pieces.every(p=>!p.placed&&!p.animating));
      await advance(250);assert.equal((await snapshot()).actorX,-295,'entrance delay preserved');
      await advance(4200);s=await snapshot();
      assert.equal(s.state,'PLAYING');assert.equal(s.actorX,65);
      assert.deepEqual(s.pieces.map(p=>`${p.shape}:${p.colour}`),EXPECTED[index]);
      assert.equal(new Set(s.pieces.map(p=>p.id)).size,s.pieces.length);
      // Conservative full-size boxes ensure artwork never overlaps or reaches safe edges.
      const boxes=[...s.pieces.map(p=>({x:p.x,y:p.y,size:p.size})),...s.sockets];
      for(const a of boxes) {
        assert.ok(a.x-a.size/2>32&&a.x+a.size/2<1248&&a.y-a.size/2>32&&a.y+a.size/2<768);
        for(const b of boxes)if(a!==b)assert.ok(Math.abs(a.x-b.x)>=(a.size+b.size)/2||Math.abs(a.y-b.y)>=(a.size+b.size)/2,`overlap in level ${index+1}`);
        assert.ok(a.x-a.size/2>360||a.y+a.size/2<508,'clear of resting caterpillar');
        assert.ok(a.x+a.size/2<1089||a.y+a.size/2<410,'clear of doorway');
      }
      await page.screenshot({path:path.join(__dirname,`level-${index+1}.png`)});
      if(index===4) {
        assert.ok(s.sockets.every(t=>t.colourHint),'same-shape targets have visible colour references');
        // Each circle must reject all three wrong-colour circle sockets.
        for(const piece of s.pieces)for(const target of s.sockets.filter(t=>t.colour!==piece.colour)) {
          await drag(piece,target);
          const after=(await snapshot()).pieces.find(p=>p.id===piece.id);
          assert.equal(after.placed,false,`${piece.colour} must reject ${target.colour}`);
          assert.equal(after.x,piece.x);assert.equal(after.y,piece.y);
        }
      }
      for(const piece of s.pieces) {
        const target=s.sockets.find(t=>t.id===piece.targetId);
        assert.equal(target.shape,piece.shape);assert.equal(target.colour,piece.colour);
        await drag(piece,target);
        assert.equal((await snapshot()).pieces.find(p=>p.id===piece.id).placed,true);
      }
      assert.equal((await snapshot()).state,'COMPLETE');
      await advance(1800);s=await snapshot();assert.equal(s.state,'GUIDE_TO_EXIT');assert.equal(s.open,true);assert.equal(s.actorX,65);
      await advance(500);assert.equal((await snapshot()).actorX,65,'never auto-guides between levels');
      const target=await point(1102,620);await page.mouse.move(target.x,target.y);await page.mouse.down();
      assert.equal((await snapshot()).guideMarker.opacity,1);
      await advance(200);assert.ok((await snapshot()).actorX>65);
      await page.mouse.up();await advance(7500);
      s=await snapshot();assert.equal(s.state,'EXITING');assert.equal(s.guideMarker.opacity,0);assert.equal(s.walking,true);
      await advance(4200);s=await snapshot();assert.equal(s.state,'EXITING');assert.equal(s.actorHidden,true);
      await advance(250);assert.equal((await snapshot()).state,'TRANSITIONING');
      // Observe the next entry immediately so its offscreen starting pose can be checked.
      for(let n=0;n<30&&(await snapshot()).state==='TRANSITIONING';n++)await advance(16);
      assert.equal((await snapshot()).state,'ENTERING');
      assert.equal(documentLoads,originalMainDocumentLoads,'progression never reloads the document');
      console.log(`PASS level ${index+1}: content, spacing, matching, guided exit, offline progression.`);
    }
    const wrapped=await snapshot();assert.equal(wrapped.levelId,1);assert.equal(wrapped.currentLevelIndex,0);assert.equal(wrapped.cycle,9);
    assert.deepEqual(errors,[]);
    // A fresh offline visit starts at level 1, since progression is intentionally not saved.
    await page.reload();await page.locator('canvas[data-state="ENTERING"][data-offline="ready"]').waitFor();
    await page.evaluate(async()=>{window.inspectGame=(await import('./game.js')).snapshot;});
    assert.equal((await snapshot()).levelId,1);
    console.log('PASS: all 8 levels offline, all 12 wrong-colour circle drops rejected, level 8 wraps to 1, no page reload between levels, fresh offline start, no browser errors.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

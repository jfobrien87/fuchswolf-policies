const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const time=new Date('2026-09-18T00:00:00Z');
    await page.clock.install({time});await page.clock.pauseAt(time);
    const url=process.env.GAME_URL||'http://127.0.0.1:8765/';
    const attach=()=>page.evaluate(async()=>{
      window.inspectGame=(await import('./game.js')).snapshot;
      const {audio}=await import('./audio.js');window.inspectAudio=()=>audio.snapshot();
    });
    await page.goto(url);
    await page.locator('canvas[data-state="ENTERING"][data-offline="ready"]').waitFor();
    await attach();
    const snapshot=()=>page.evaluate(()=>window.inspectGame());
    const advance=ms=>page.clock.runFor(ms);
    const point=async(x,y)=>{const r=await page.locator('canvas').boundingBox();return {x:r.x+x*r.width/1280,y:r.y+y*r.height/800};};
    const tap=async(x,y)=>{const p=await point(x,y);await page.mouse.click(p.x,p.y);};
    await advance(2000);let s=await snapshot();assert.equal(s.walking,true);
    await tap(s.actorX+250,620);assert.equal((await snapshot()).tapHappyRemaining,0,'no greeting while entering');
    await advance(2400);s=await snapshot();assert.equal(s.state,'PLAYING');
    await context.setOffline(true);
    const resting=s,canvas=page.locator('canvas');
    const restingImage=await canvas.screenshot();
    const sounds=await page.evaluate(()=>window.inspectAudio().events);
    await tap(40,620);assert.equal((await snapshot()).tapHappyRemaining,0,'background does not greet');
    const cdp=await context.newCDPSession(page),hello=await point(315,620);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...hello,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal((await snapshot()).tapHappyRemaining,650,'a real touch triggers the existing happy reaction');
    await advance(200);const remaining=(await snapshot()).tapHappyRemaining;
    for(let i=0;i<8;i++)await tap(315,620);
    assert.equal((await snapshot()).tapHappyRemaining,remaining,'rapid taps do not stack or restart');
    assert.notDeepEqual(await canvas.screenshot(),restingImage,'greeting visibly changes the pose');
    await page.screenshot({path:path.join(__dirname,'greeting.png')});
    await advance(500);s=await snapshot();
    assert.equal(s.tapHappyRemaining,0);assert.equal(s.frame,resting.frame);assert.equal(s.actorX,resting.actorX);
    assert.deepEqual(s.pieces,resting.pieces);assert.equal(s.state,'PLAYING');
    assert.deepEqual(await canvas.screenshot(),restingImage,'the exact stationary appearance returns');
    assert.deepEqual(await page.evaluate(()=>window.inspectAudio().events),sounds,'greetings add no sound');

    // A greeting does not lock piece input, and a dragged piece over the actor wins.
    await tap(315,620);await advance(100);
    let piece=s.pieces[0],a=await point(piece.x,piece.y);
    await page.mouse.move(a.x,a.y);await page.mouse.down();await advance(100);
    assert.equal((await snapshot()).active,piece.shape);assert.ok((await snapshot()).tapHappyRemaining>0);
    await page.mouse.move(hello.x,hello.y);await page.mouse.up();await advance(700);
    s=await snapshot();assert.equal(s.tapHappyRemaining,0);assert.equal(s.pieces[0].placed,false);
    assert.deepEqual({x:s.pieces[0].x,y:s.pieces[0].y},piece.start);
    a=await point(piece.start.x,piece.start.y);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1},{...hello,id:2}]});
    assert.equal((await snapshot()).tapHappyRemaining,0,'extra fingers while dragging cannot greet');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await advance(400);
    for(const p of s.pieces) {
      const target=s.sockets.find(t=>t.id===p.targetId),from=await point(p.x,p.y),to=await point(target.x,target.y);
      if(p===s.pieces.at(-1))await tap(315,620);
      await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y);await page.mouse.up();await advance(240);
    }
    assert.equal((await snapshot()).state,'COMPLETE');assert.equal((await snapshot()).tapHappyRemaining,0);
    await tap(315,620);assert.equal((await snapshot()).tapHappyRemaining,0);
    await advance(1800);assert.equal((await snapshot()).state,'GUIDE_TO_EXIT');
    await tap(315,620);assert.equal((await snapshot()).tapHappyRemaining,0,'guide-phase touches keep their existing meaning');
    await tap(1102,620);await advance(7600);s=await snapshot();assert.equal(s.state,'EXITING');assert.equal(s.walking,true);
    await tap(s.actorX+100,620);assert.equal((await snapshot()).tapHappyRemaining,0);
    await advance(5500);assert.equal((await snapshot()).levelId,2,'normal level progression survives greetings');
    await page.reload();await page.locator('canvas[data-state="ENTERING"][data-offline="ready"]').waitFor();await attach();await advance(4400);
    await tap(315,620);assert.equal((await snapshot()).tapHappyRemaining,650,'greeting works after an offline reload');
    assert.deepEqual(errors,[]);
    await context.close();

    // This edition loops after Level 16 and has no reachable END_FREEPLAY scene.
    // Inject that state only into a test response to check the compatibility guard,
    // without adding a gameplay shortcut or changing the production ending.
    const fixture=await browser.newContext({serviceWorkers:'block'});
    await fixture.addInitScript(()=>{delete Navigator.prototype.serviceWorker;});
    const endPage=await fixture.newPage();
    const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
    await endPage.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:source+'\nexport function fixtureEnd(moving=false,pending=false){setState("END_FREEPLAY");actorX=C.CATERPILLAR_REST_X;walking=moving;guideTargetX=actorX+(pending?100:0);}\n'}));
    await endPage.clock.install({time});await endPage.clock.pauseAt(time);
    await endPage.goto(url);await endPage.waitForFunction(()=>document.querySelector('canvas').dataset.state==='ENTERING');
    await endPage.evaluate(async()=>{const g=await import('./game.js');window.fixtureEnd=g.fixtureEnd;window.inspectGame=g.snapshot;});
    const endTap=async()=>{const r=await endPage.locator('canvas').boundingBox();await endPage.mouse.click(r.x+315*r.width/1280,r.y+620*r.height/800);};
    for(const [moving,pending,expected] of [[false,false,650],[true,false,0],[false,true,0]]) {
      await endPage.evaluate(([m,p])=>window.fixtureEnd(m,p),[moving,pending]);await endTap();
      assert.equal(await endPage.evaluate(()=>window.inspectGame().tapHappyRemaining),expected);
    }
    console.log('PASS: stationary touch greeting, 650ms recovery, subtle visible bounce, rapid taps, no extra sound, drag priority/multitouch, movement exclusions, progression and offline reload. END_FREEPLAY guard checked with a test-only fixture; this edition has no final scene.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

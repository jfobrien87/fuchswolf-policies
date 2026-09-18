const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome',args:['--autoplay-policy=user-gesture-required']});
  try {
    const context=await browser.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // Headless Chrome may grant autoplay despite its flag. Force the same
    // NotAllowedError until an actual trusted pointer gesture for a deterministic recovery test.
    await page.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;
      let gestured=false;
      for(const name of ['pointerdown','pointerup'])document.addEventListener(name,e=>{if(e.isTrusted)gestured=true;},{capture:true});
      HTMLMediaElement.prototype.play=function(){
        if(!gestured)return Promise.reject(new DOMException('A user gesture is required','NotAllowedError'));
        return play.call(this);
      };
    });
    const attach=async()=>{
      await page.locator('canvas[data-state="PLAYING"][data-offline="ready"]').waitFor({timeout:20000});
      await page.evaluate(async()=>{
        const {audio}=await import('./audio.js');window.inspectAudio=()=>audio.snapshot();
        window.inspectGame=(await import('./game.js')).snapshot;
      });
    };
    await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765/');await attach();
    const audio=()=>page.evaluate(()=>window.inspectAudio());
    const game=()=>page.evaluate(()=>window.inspectGame());
    const point=async(x,y)=>{const r=await page.locator('canvas').boundingBox();return {x:r.x+x*r.width/1280,y:r.y+y*r.height/800};};
    const drag=async(from,to)=>{
      const a=await point(...from),b=await point(...to);
      await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up();
      await page.waitForTimeout(400);
    };
    const dragPiece=async(index,to)=>{
      const s=await game(),piece=s.pieces[index];
      const target=to||s.sockets.find(t=>t.id===piece.targetId);
      await drag([piece.x,piece.y],Array.isArray(target)?target:[target.x,target.y]);
    };
    const hold=async()=>{
      const r=await page.locator('#sound-toggle').boundingBox();
      await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(800);await page.mouse.up();
    };
    const initial=await audio();
    assert.equal(initial.muted,false);assert.equal(initial.musicLoop,true);
    assert.deepEqual(initial.loadedSfx.sort(),['complete','correct','door','pickup','return']);
    assert.equal(initial.musicPaused,true,'denied autoplay waits for a user gesture');
    await dragPiece(0,[200,300]);
    await page.waitForFunction(()=>window.inspectAudio().contextState==='running'&&!window.inspectAudio().musicPaused&&window.inspectAudio().musicTime>0);
    let a=await audio();assert.ok(a.events.pickup>=1&&a.events.return>=1);
    assert.ok(Math.abs(a.musicVolume-.3)<.001);
    await dragPiece(0);assert.equal((await audio()).events.correct,1);
    const placed=(await game()).pieces;
    await page.locator('#sound-toggle').click();a=await audio();
    assert.equal(a.muted,true);assert.equal(a.masterVolume,0);assert.equal(a.musicPaused,true);assert.equal(a.activeVoices,0);
    const pausePosition=a.musicTime, events=a.events;
    await page.waitForTimeout(250);assert.equal((await audio()).musicTime,pausePosition);
    await dragPiece(1,[200,300]);assert.deepEqual((await audio()).events,events,'mute suppresses all effects');
    await page.locator('#sound-toggle').click();await page.waitForTimeout(300);a=await audio();
    assert.equal(a.muted,false);assert.ok(a.musicTime>=pausePosition,'unmute resumes instead of restarting');
    assert.equal(a.generation,initial.generation,'toggle keeps one persistent player');
    // Simulate a broken/closed context, then recover with the actual hold-release control.
    await page.evaluate(async()=>{const {audio}=await import('./audio.js');await audio.context.close();});
    const beforeReset=await audio();await hold();
    await page.waitForFunction(g=>window.inspectAudio().generation===g+1&&window.inspectAudio().contextState==='running',beforeReset.generation);
    await page.waitForFunction(t=>window.inspectAudio().musicReadyState>=2&&window.inspectAudio().musicTime>=t-.1,beforeReset.musicTime);
    a=await audio();assert.equal(a.muted,false);assert.ok(a.musicTime>=beforeReset.musicTime-.1);
    assert.deepEqual((await game()).pieces,placed,'audio reset cannot change puzzle placement');
    await page.locator('#sound-toggle').click();const mutedGeneration=(await audio()).generation;await hold();
    a=await audio();assert.equal(a.generation,mutedGeneration+1);assert.equal(a.muted,true);assert.equal(a.musicPaused,true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('caterpillar-garden-muted')),'true');
    // First load has cached music and all effects. Reload and finish a level offline.
    await context.setOffline(true);await page.reload();await attach();a=await audio();
    assert.equal(a.muted,true);assert.equal(await page.locator('#sound-toggle').getAttribute('aria-label'),'Unmute sound');
    const range=await page.evaluate(async()=>{
      const r=await fetch('./assets/audio/music.mp3',{headers:{Range:'bytes=0-1'}});
      const suffix=await fetch('./assets/audio/music.mp3',{headers:{Range:'bytes=-8'}});
      const bad=await fetch('./assets/audio/music.mp3',{headers:{Range:'bytes=999999999-'}});
      return {status:r.status,length:(await r.arrayBuffer()).byteLength,range:r.headers.get('Content-Range'),suffixLength:(await suffix.arrayBuffer()).byteLength,bad:bad.status};
    });
    assert.equal(range.status,206);assert.equal(range.length,2);assert.match(range.range,/^bytes 0-1\/\d+$/);assert.equal(range.suffixLength,8);assert.equal(range.bad,416);
    // Use real touch on the sound button: one tap must toggle exactly once.
    const cdp=await context.newCDPSession(page),rect=await page.locator('#sound-toggle').boundingBox();
    const touch={x:rect.x+rect.width/2,y:rect.y+rect.height/2,id:1};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>!window.inspectAudio().muted&&!window.inspectAudio().musicPaused&&window.inspectAudio().contextState==='running');
    const running=await audio();
    for(let i=0;i<4;i++)await dragPiece(i);
    await page.waitForFunction(()=>window.inspectGame().state==='GUIDE_TO_EXIT');a=await audio();
    assert.equal(a.events.pickup,4);assert.equal(a.events.correct,4);assert.equal(a.events.complete,1);assert.equal(a.events.door,1);
    await page.screenshot({path:path.join(__dirname,'sound-control.png')});
    const door=await point(1102,620);await page.mouse.click(door.x,door.y);
    await page.waitForFunction(()=>window.inspectGame().levelId===2&&window.inspectGame().state==='PLAYING',null,{timeout:25000});
    a=await audio();assert.equal(a.generation,running.generation);assert.ok(a.musicTime>running.musicTime+10,'music continues through exit and level change');
    assert.equal(a.musicPaused,false);assert.equal(a.events.complete,1);assert.equal(a.events.door,1);
    // Exercise the actual looping media element near its endpoint, still offline.
    await page.evaluate(async()=>{const {audio}=await import('./audio.js');audio.music.currentTime=audio.music.duration-.25;});
    await page.waitForFunction(()=>window.inspectAudio().musicTime<2&&!window.inspectAudio().musicPaused,null,{timeout:5000});
    assert.equal((await audio()).lastError,null);
    assert.deepEqual(errors,[]);
    console.log('PASS: autoplay recovery, preloaded effects, correct event timing, single-tap and touch mute, frozen/resumed music position, held recovery of closed context, muted recovery, preference persistence, offline byte ranges, all audio offline, continuous music across levels and end-to-start looping. No browser errors.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

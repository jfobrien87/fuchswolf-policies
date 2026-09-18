const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  const source=fs.readFileSync(path.join(__dirname,'../levels.js'),'utf8');
  const {LEVELS,shufflePieces}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const original=JSON.stringify(LEVELS);
  let seed=12345;
  const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const four=[[435,265],[640,265],[845,265],[1050,265]];
  const six=[[475,140],[725,140],[975,140],[475,310],[725,310],[975,310]];
  const five=[...six.slice(0,3),[585,310],[860,310]];
  [four,four,four,six,four,four,five,six].forEach((expected,i)=>{
    assert.deepEqual(LEVELS[i].pieces.map(p=>[p.socket.x*1280,p.socket.y*800]),expected,'original socket layout stays fixed');
  });
  assert.notDeepEqual(LEVELS[14].pieces.map(p=>p.socket),LEVELS[10].pieces.map(p=>p.socket));
  for(const level of LEVELS) {
    assert.equal(level.startSlots.length,level.pieces.length);
    const seen=new Set();
    for(let n=0;n<1000;n++) {
      const result=shufflePieces(level.pieces,random);
      const order=result.map(p=>level.pieces.indexOf(p));
      assert.equal(new Set(result).size,level.pieces.length);
      assert.ok(order.some((value,i)=>value!==i));
      seen.add(order.join(','));
    }
    assert.ok(seen.size>10,'repeated loads have varied piece orders');
    // Force Fisher–Yates to choose identity, exercising the simple fallback.
    assert.notDeepEqual(shufflePieces(level.pieces,()=>.999999),level.pieces);
  }
  assert.equal(JSON.stringify(LEVELS),original,'shuffling never mutates shared level data');

  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
    // These checks use fresh config overrides, not the offline worker under test elsewhere.
    await context.addInitScript(()=>{delete Navigator.prototype.serviceWorker;});
    const config=fs.readFileSync(path.join(__dirname,'../config.js'),'utf8');
    const errors=[];
    for(let id=1;id<=16;id++) {
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/config.js',route=>route.fulfill({contentType:'text/javascript',body:config.replace('DEBUG: false','DEBUG: true').replace('DEBUG_START_LEVEL: 1,',`DEBUG_START_LEVEL: ${id},`)}));
      await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765/');
      await page.waitForFunction(()=>typeof window.reloadCurrentLevel==='function');
      const runs=await page.evaluate(async()=>{
        const {snapshot}=await import('./game.js');
        const results=[snapshot()];
        for(let i=0;i<30;i++){window.reloadCurrentLevel();results.push(snapshot());}
        return results;
      });
      const orders=new Set();
      for(const run of runs) {
        assert.equal(run.levelId,id);assert.equal(run.state,'ENTERING');
        assert.deepEqual(run.sockets,runs[0].sockets,'reload never moves sockets');
        assert.equal(run.active,null);assert.equal(run.guiding,false);assert.equal(run.open,false);
        for(const p of run.pieces) {
          const slot=LEVELS[id-1].startSlots[p.slotIndex];
          assert.deepEqual(p.start,{x:slot.x*1280,y:slot.y*800});
          assert.deepEqual({x:p.x,y:p.y},p.start);assert.equal(p.placed,false);
        }
        assert.equal(new Set(run.pieces.map(p=>p.slotIndex)).size,run.pieces.length);
        assert.ok(run.pieces.some((p,i)=>p.slotIndex!==i));
        orders.add(run.pieces.map(p=>p.slotIndex).join(','));
      }
      assert.ok(orders.size>1,'the debug reload reshuffles');
      await page.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: 16,000 seeded shuffles, unchanged original socket layouts/data, debug starts 1–16, 30 reloads per level with fixed sockets and fresh safe-slot assignments.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

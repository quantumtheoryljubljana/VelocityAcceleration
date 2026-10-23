/*
 * Alice in Bob: točne kinematične transformacije v ravnini.
 * Odprite index.html v isti mapi. Zunanje knjižnice niso potrebne.
 *
 * Q(theta) preslika komponente iz Bobovega sistema v Alicinega.
 * J(x,y) = (-y,x); omega in alpha sta predznačeni skalarni količini.
 * r' = Q^T (r-R)
 * v' = Q^T (v-V) - omega J r'
 * a' = Q^T (a-A) - 2 omega J v' + omega^2 r' - alpha J r'
 *
 * Vsi členi pospeška imajo enako merilo. Dolžin puščic ne normaliziramo.
 * Čas ni omejen. Preteklo trajektorijo ohranimo od t = 0; pomično okno
 * uporabljamo le za napoved gibanja. Merilo zajame tudi celotno preteklo pot.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAU = 2 * Math.PI, DEG = Math.PI / 180;
  const C = {
    alice:'#c2444c', bob:'#2455d6', R:'#138367', v:'#ad610c', a:'#8551b0',
    inertial:'#8551b0', translation:'#be4f45', coriolis:'#1e80a0',
    centrifugal:'#a77600', euler:'#238360', text:'#17212e', muted:'#677586',
    grid:'#edf1f6', axis:'#a8b3c2', particle:'#26374c', white:'#ffffff'
  };
  const SCALES = Object.freeze({v:0.6, a:0.35});
  // Debelina črte in širina konice sta v zaslonskih pikah, ne v metrih.
  // Spreminja se samo dolžina vektorja; pri kratki puščici se konica skrajša.
  const VECTOR_STYLE = Object.freeze({shaftWidth:2.8,headLength:10,headWidth:8});
  const translations={
    sl:{
      title:'Ravninske transformacije koordinatnih sistemov',language:'Jezik',
      aliceTitle:'Alice (inercialni sistem S)',bobTitle:'Bob (neinercialni sistem S′)',
      framesTitle:'Premikanje Bobovega sistema v koordinatnem sistemu Alice',
      threeViews:'Trije pogledi istega gibanja',controls:'Ukazi in nastavitve',
      aliceAlt:'Lega, hitrost in pospešek telesa v Alicinem inercialnem sistemu',
      bobAlt:'Isto telo, kot ga vidi Bob v svojem koordinatnem sistemu',
      framesAlt:'Bobovo koordinatno izhodišče in vrteči se osi v Alicinem sistemu z vektorji r, R in r′',
      play:'Zaženi',pause:'Ustavi',paused:'Ustavljeno',running:'Animacija teče',
      reset:'Na začetek',step:'Korak +0,05 s',restoreDefaults:'Začetne nastavitve',time:'Čas',playback:'Predvajanje',
      examples:'Primeri',exampleTranslation:'Enakomerna translacija',exampleAcceleration:'Pospešena translacija',
      exampleRotation:'Enakomerno vrtenje',exampleEuler:'Pospešeno vrtenje',exampleCombined:'Kombinirano gibanje',
      aliceSettings:'Gibanje telesa pri Alice',translationSettings:'Premik Bobovega izhodišča',rotationSettings:'Zasuk Bobovih osi',
      motionType:'Vrsta gibanja',translationType:'Translacija glede na Alice',rotationType:'Vrtenje glede na Alice',
      motionRest:'Mirovanje',motionLinear:'Enakomerno premočrtno gibanje',motionCircle:'Enakomerno kroženje',
      motionOscX:'Nihanje vzdolž osi x',motionOscY:'Nihanje vzdolž osi y',
      translationOffset:'Stalen premik izhodišča',translationVelocity:'Konstantna hitrost',translationAcceleration:'Konstanten pospešek',
      rotationAngle:'Stalen kot',rotationVelocity:'Konstantna kotna hitrost',rotationAcceleration:'Konstanten kotni pospešek',
      directionNote:'Pozitiven kot pomeni zasuk v nasprotni smeri urnega kazalca. Za vzporedne osi izberite stalen kot θ₀ = 0°.',
      showPosition:'Krajevna vektorja r, r′',showVelocity:'Hitrosti v, v′',showAcceleration:'Pospeška a, a′',
      showComponents:'Razcep pospeška pri Bobu',showPaths:'Poti gibanja',showAxes:'Koordinatna mreža',sameScale:'Isto merilo vseh prikazov',
      centerX:'Središče x<sub>c</sub>',centerY:'Središče y<sub>c</sub>',initialX:'Začetna lega x₀',initialY:'Začetna lega y₀',
      radius:'Polmer kroga ρ',amplitude:'Amplituda nihanja L',angularRateA:'Kotna hitrost Ω',angularFrequency:'Krožna frekvenca Ω',
      initialVx:'Začetna hitrost V₀ₓ',initialVy:'Začetna hitrost V₀ᵧ',velocityX:'Hitrost Vₓ',velocityY:'Hitrost Vᵧ',
      initialOmega:'Začetna kotna hitrost ω₀',omega:'Kotna hitrost ω',
      parameters:{aVx:'Hitrost vₓ',aVy:'Hitrost vᵧ',rX:'Začetni premik R₀ₓ',rY:'Začetni premik R₀ᵧ',bAx:'Pospešek Aₓ',bAy:'Pospešek Aᵧ',theta0:'Začetni kot θ₀',alpha:'Kotni pospešek α'},
      gridSpacing:'Razmik mreže',body:'telo',translationTerm:'translacija',totalTerm:'skupen',
      componentsHint:'Pri Bobu je skupni pospešek prikazan s črtkano puščico.',
      invalidRange:'Vnesite število med {min} in {max}.',invalidTime:'Vnesite končen nenegativen čas v sekundah.',
      runningStatus:'Animacija teče.',pausedStatus:'Animacija je ustavljena.',resetStatus:'Čas je ponastavljen na nič.',
      motionChanged:'Vrsta gibanja je spremenjena. Čas ostane {time} s.',exampleSelected:'Izbran primer: {name}.',
      defaultsRestored:'Začetne nastavitve so obnovljene.',languageChanged:'Jezik je nastavljen na slovenščino.'
    },
    en:{
      title:'Planar coordinate transformations',language:'Language',
      aliceTitle:'Alice (inertial frame S)',bobTitle:'Bob (non-inertial frame S′)',
      framesTitle:'Motion of Bob’s frame in Alice’s coordinate system',
      threeViews:'Three views of the same motion',controls:'Controls and settings',
      aliceAlt:'Position, velocity and acceleration of the body in Alice’s inertial frame',
      bobAlt:'The same body as seen by Bob in his coordinate system',
      framesAlt:'Bob’s origin and rotating axes in Alice’s frame, with the vectors r, R and r′',
      play:'Run',pause:'Pause',paused:'Paused',running:'Animation running',
      reset:'Reset time',step:'Step +0.05 s',restoreDefaults:'Default settings',time:'Time',playback:'Playback',
      examples:'Examples',exampleTranslation:'Uniform translation',exampleAcceleration:'Accelerated translation',
      exampleRotation:'Uniform rotation',exampleEuler:'Accelerated rotation',exampleCombined:'Combined motion',
      aliceSettings:'Body motion in Alice’s frame',translationSettings:'Translation of Bob’s origin',rotationSettings:'Rotation of Bob’s axes',
      motionType:'Type of motion',translationType:'Translation relative to Alice',rotationType:'Rotation relative to Alice',
      motionRest:'At rest',motionLinear:'Uniform rectilinear motion',motionCircle:'Uniform circular motion',
      motionOscX:'Oscillation along the x axis',motionOscY:'Oscillation along the y axis',
      translationOffset:'Fixed origin offset',translationVelocity:'Constant velocity',translationAcceleration:'Constant acceleration',
      rotationAngle:'Fixed angle',rotationVelocity:'Constant angular velocity',rotationAcceleration:'Constant angular acceleration',
      directionNote:'Positive angles are counterclockwise. For parallel axes, select a fixed angle θ₀ = 0°.',
      showPosition:'Position vectors r, r′',showVelocity:'Velocities v, v′',showAcceleration:'Accelerations a, a′',
      showComponents:'Acceleration components for Bob',showPaths:'Motion paths',showAxes:'Coordinate grid',sameScale:'Same scale in all views',
      centerX:'Center x<sub>c</sub>',centerY:'Center y<sub>c</sub>',initialX:'Initial position x₀',initialY:'Initial position y₀',
      radius:'Circle radius ρ',amplitude:'Oscillation amplitude L',angularRateA:'Angular velocity Ω',angularFrequency:'Angular frequency Ω',
      initialVx:'Initial velocity V₀ₓ',initialVy:'Initial velocity V₀ᵧ',velocityX:'Velocity Vₓ',velocityY:'Velocity Vᵧ',
      initialOmega:'Initial angular velocity ω₀',omega:'Angular velocity ω',
      parameters:{aVx:'Velocity vₓ',aVy:'Velocity vᵧ',rX:'Initial offset R₀ₓ',rY:'Initial offset R₀ᵧ',bAx:'Acceleration Aₓ',bAy:'Acceleration Aᵧ',theta0:'Initial angle θ₀',alpha:'Angular acceleration α'},
      gridSpacing:'Grid spacing',body:'body',translationTerm:'translation',totalTerm:'total',
      componentsHint:'In Bob’s view, the total acceleration is shown as a dashed arrow.',
      invalidRange:'Enter a number between {min} and {max}.',invalidTime:'Enter a finite, nonnegative time in seconds.',
      runningStatus:'Animation running.',pausedStatus:'Animation paused.',resetStatus:'Time has been reset to zero.',
      motionChanged:'Motion type changed. Time remains {time} s.',exampleSelected:'Selected example: {name}.',
      defaultsRestored:'Default settings restored.',languageChanged:'Language set to English.'
    }
  };
  let language='sl';
  const tr=(key,values={})=>String(translations[language][key]??key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
  const DEFAULTS = Object.freeze({
    aliceMode:'circle', translationMode:'velocity', rotationMode:'velocity',
    aX:0, aY:0, aVx:0.65, aVy:0.25, radius:2.6, omegaA:0.7,
    rX:0.8, rY:-0.5, bVx:0.3, bVy:0.15, bAx:0.18, bAy:0,
    theta0:20, omega0:0.35, alpha:0.12
  });
  const DEFAULT_DISPLAY = Object.freeze({
    showPosition:false, showVelocity:true, showAcceleration:true,
    showComponents:false, showPaths:true, showAxes:true, sameScale:false
  });
  const params = {...DEFAULTS}, display = {...DEFAULT_DISPLAY};
  let time=0, windowStart=0, running=false, raf=null, lastFrame=null, cache=null;
  let lastReadout=-Infinity, lastViews=null, bobTrail=null;
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const mul=(a,k)=>[a[0]*k,a[1]*k];
  const J=a=>[-a[1],a[0]];
  const norm=a=>Math.hypot(a[0],a[1]);
  const rotate=(a,theta)=>{
    const c=Math.cos(theta),s=Math.sin(theta);
    return [c*a[0]-s*a[1],s*a[0]+c*a[1]];
  };
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
  function fmt(n,d=2) {
    if(!Number.isFinite(n)) return '—';
    if(Math.abs(n)<0.5*10**(-d)) n=0;
    if(Math.abs(n)>=1e5) return language==='sl'?n.toExponential(1).replace('.',','):n.toExponential(1);
    return n.toLocaleString(language==='sl'?'sl-SI':'en-US',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false});
  }
  const windowSpan=()=>12;
  function followTime() {
    const span=windowSpan(),chunk=span/8;
    const start=Math.max(0,Math.floor((time-0.75*span)/chunk)*chunk);
    if(start!==windowStart){windowStart=start;invalidate();}
  }

  function aliceAt(t,p) {
    const base=[p.aX,p.aY];
    if(p.aliceMode==='rest') return {r:base,v:[0,0],a:[0,0]};
    if(p.aliceMode==='linear') {
      const v=[p.aVx,p.aVy];
      return {r:add(base,mul(v,t)),v,a:[0,0]};
    }
    const phi=p.omegaA*t; // Začetna faza je vedno nič.
    const c=Math.cos(phi),s=Math.sin(phi),amplitude=p.radius,w=p.omegaA;
    let q,dq;
    if(p.aliceMode==='circle') {
      q=[amplitude*c,amplitude*s]; dq=[-amplitude*w*s,amplitude*w*c];
    } else if(p.aliceMode==='oscX') {
      q=[amplitude*c,0]; dq=[-amplitude*w*s,0];
    } else {
      q=[0,amplitude*c]; dq=[0,-amplitude*w*s];
    }
    return {r:add(base,q),v:dq,a:mul(q,-w*w)};
  }
  function frameAt(t,p) {
    const translating=p.translationMode!=='offset';
    const accelerating=p.translationMode==='acceleration';
    const V0=translating?[p.bVx,p.bVy]:[0,0];
    const A=accelerating?[p.bAx,p.bAy]:[0,0];
    const R=add(add([p.rX,p.rY],mul(V0,t)),mul(A,0.5*t*t));
    const V=add(V0,mul(A,t));
    const w0=p.rotationMode==='angle'?0:p.omega0;
    const alpha=p.rotationMode==='acceleration'?p.alpha:0;
    const theta=p.theta0*DEG+w0*t+0.5*alpha*t*t;
    return {R,V,A,theta,omega:w0+alpha*t,alpha};
  }
  function stateAt(t,p=params) {
    const alice=aliceAt(t,p),frame=frameAt(t,p);
    const {R,V,A,theta,omega,alpha}=frame;
    const r=rotate(sub(alice.r,R),-theta);
    const v=sub(rotate(sub(alice.v,V),-theta),mul(J(r),omega));
    const terms={
      inertial:rotate(alice.a,-theta),
      translation:mul(rotate(A,-theta),-1),
      coriolis:mul(J(v),-2*omega),
      centrifugal:mul(r,omega*omega),
      euler:mul(J(r),-alpha)
    };
    const a=Object.values(terms).reduce(add,[0,0]);
    return {t,alice,frame,bob:{r,v,a,terms}};
  }

  // Bralni vmesnik za preverjanje odvodov in uporabo pri pouku.
  window.AliceBob=Object.freeze({
    evaluate:(t,overrides={})=>stateAt(t,{...params,...overrides}),
    getParameters:()=>({...params}),
    getDisplay:()=>({...display}),
    getTime:()=>time,
    getLanguage:()=>language,
    getTimeWindow:()=>({start:windowStart,end:windowStart+windowSpan(),span:windowSpan(),sampleCount:cache?cache.points.length:0}),
    getTrail:()=>bobTrail?{start:0,end:bobTrail.end,pointCount:bobTrail.count,bobBounds:{...bobTrail.bounds}}:null,
    isRunning:()=>running,
    getViews:()=>lastViews?JSON.parse(JSON.stringify(lastViews)):null
  });

  const definitions=[
    {key:'aX',group:'alice',label:'Začetna lega x₀',min:-5,max:5,step:0.05,unit:'m'},
    {key:'aY',group:'alice',label:'Začetna lega y₀',min:-5,max:5,step:0.05,unit:'m'},
    {key:'aVx',group:'alice',label:'Hitrost vₓ',min:-2,max:2,step:0.05,unit:'m/s'},
    {key:'aVy',group:'alice',label:'Hitrost vᵧ',min:-2,max:2,step:0.05,unit:'m/s'},
    {key:'radius',group:'alice',label:'Polmer / amplituda',min:0,max:5,step:0.05,unit:'m'},
    {key:'omegaA',group:'alice',label:'Kotna hitrost Ω',min:-3,max:3,step:0.05,unit:'rad/s'},
    {key:'rX',group:'translation',label:'Začetni premik R₀ₓ',min:-5,max:5,step:0.05,unit:'m'},
    {key:'rY',group:'translation',label:'Začetni premik R₀ᵧ',min:-5,max:5,step:0.05,unit:'m'},
    {key:'bVx',group:'translation',label:'Začetna hitrost V₀ₓ',min:-2,max:2,step:0.05,unit:'m/s'},
    {key:'bVy',group:'translation',label:'Začetna hitrost V₀ᵧ',min:-2,max:2,step:0.05,unit:'m/s'},
    {key:'bAx',group:'translation',label:'Pospešek Aₓ',min:-1,max:1,step:0.02,unit:'m/s²'},
    {key:'bAy',group:'translation',label:'Pospešek Aᵧ',min:-1,max:1,step:0.02,unit:'m/s²'},
    {key:'theta0',group:'rotation',label:'Začetni kot θ₀',min:-180,max:180,step:1,unit:'°'},
    {key:'omega0',group:'rotation',label:'Začetna kotna hitrost ω₀',min:-2,max:2,step:0.05,unit:'rad/s'},
    {key:'alpha',group:'rotation',label:'Kotni pospešek α',min:-0.4,max:0.4,step:0.01,unit:'rad/s²'}
  ];
  for(const d of definitions) {
    const node=document.createElement('div');
    node.className='parameter'; node.id=d.key+'Control';
    const label=document.createElement('label');
    label.className='parameter-label'; label.id=d.key+'Label';
    label.htmlFor=d.key+'Number'; label.textContent=d.label;
    const range=document.createElement('input'),number=document.createElement('input');
    for(const [input,type,suffix] of [[range,'range','Range'],[number,'number','Number']]) {
      input.type=type; input.id=d.key+suffix; input.min=d.min; input.max=d.max;
      input.step=d.step; input.value=params[d.key];
      input.setAttribute('aria-labelledby',label.id);
      if(type==='number') input.inputMode='decimal';
      input.addEventListener('input',event=>{
        const n=event.target.valueAsNumber;
        if(!Number.isFinite(n)||n<d.min||n>d.max) {
          pause(); event.target.setAttribute('aria-invalid','true');
          setStatus(tr('invalidRange',{min:fmt(d.min),max:fmt(d.max)})); return;
        }
        pause();params[d.key]=n;invalidate();
        syncInputs(event.target.id);updateLabels();render();
        clearExample();
      });
      if(type==='number') input.addEventListener('change',()=>syncInputs());
    }
    const unit=document.createElement('span');unit.className='unit';unit.textContent=d.unit;
    node.append(label,range,number,unit);
    $(d.group+'Parameters').append(node);
  }
  function invalidate(){cache=null;lastReadout=-Infinity;}
  function setStatus(message){$('status').textContent=message;}
  function syncInputs(skip='') {
    for(const d of definitions) for(const suffix of ['Range','Number']) {
      const input=$(d.key+suffix);
      if(input.id!==skip) input.value=params[d.key];
      input.removeAttribute('aria-invalid');
    }
    for(const id of ['aliceMode','translationMode','rotationMode']) $(id).value=params[id];
  }
  function visibleParameters() {
    const keys=['aX','aY','rX','rY','theta0'];
    if(params.aliceMode==='linear') keys.push('aVx','aVy');
    if(!['rest','linear'].includes(params.aliceMode)) keys.push('radius','omegaA');
    if(params.translationMode!=='offset') keys.push('bVx','bVy');
    if(params.translationMode==='acceleration') keys.push('bAx','bAy');
    if(params.rotationMode!=='angle') keys.push('omega0');
    if(params.rotationMode==='acceleration') keys.push('alpha');
    return keys;
  }
  function updateLabels() {
    document.documentElement.lang=language;document.title=tr('title');
    document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=tr(node.dataset.i18n);});
    document.querySelectorAll('[data-i18n-aria]').forEach(node=>{node.setAttribute('aria-label',tr(node.dataset.i18nAria));});
    document.querySelectorAll('[data-language]').forEach(button=>{
      const active=button.dataset.language===language;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    for(const option of $('playbackSpeed').options) option.textContent=(language==='sl'?option.value.replace('.',','):option.value)+'×';
    for(const [key,label] of Object.entries(translations[language].parameters)) $(key+'Label').textContent=label;
    const visible=visibleParameters();
    for(const d of definitions) $(d.key+'Control').hidden=!visible.includes(d.key);
    const periodic=!['rest','linear'].includes(params.aliceMode);
    $('aXLabel').innerHTML=tr(periodic?'centerX':'initialX');
    $('aYLabel').innerHTML=tr(periodic?'centerY':'initialY');
    $('radiusLabel').textContent=tr(params.aliceMode==='circle'?'radius':'amplitude');
    $('omegaALabel').textContent=tr(params.aliceMode==='circle'?'angularRateA':'angularFrequency');
    $('bVxLabel').textContent=tr(params.translationMode==='acceleration'?'initialVx':'velocityX');
    $('bVyLabel').textContent=tr(params.translationMode==='acceleration'?'initialVy':'velocityY');
    $('omega0Label').textContent=tr(params.rotationMode==='acceleration'?'initialOmega':'omega');
    for(const key of Object.keys(display)) {
      $(key).classList.toggle('active',display[key]);
      $(key).setAttribute('aria-pressed',String(display[key]));
    }
    $('showAcceleration').disabled=display.showComponents;
    $('showAcceleration').title=display.showComponents?tr('componentsHint'):'';
    updatePlay();
  }
  function updatePlay() {
    $('playText').textContent=tr(running?'pause':'play');
    $('playIcon').textContent=running?'Ⅱ':'▶';
    $('play').setAttribute('aria-pressed',String(running));
    $('stateBadge').textContent=tr(running?'running':'paused');
    $('stateBadge').classList.toggle('running',running);
  }
  function pause() {
    running=false;lastFrame=null;
    if(raf!==null) cancelAnimationFrame(raf);
    raf=null;updatePlay();
  }
  function play() {
    followTime();
    running=true;lastFrame=null;updatePlay();
    setStatus(tr('runningStatus'));
    if(raf===null) raf=requestAnimationFrame(frame);
  }
  function togglePlay() {
    if(running){pause();setStatus(tr('pausedStatus'));render();}
    else play();
  }
  function reset() {
    pause();time=0;windowStart=0;invalidate();render();updatePlay();
    setStatus(tr('resetStatus'));
  }
  function seek(t) {
    if(!Number.isFinite(t)||t<0) return false;
    const s=stateAt(t);
    if(![...s.alice.r,...s.alice.v,...s.alice.a,...s.bob.r,...s.bob.v,...s.bob.a,
      ...s.frame.R,...s.frame.V,s.frame.theta,s.frame.omega].every(Number.isFinite)) return false;
    pause();time=t;followTime();lastReadout=-Infinity;render();updatePlay();return true;
  }
  function clearExample() {
    document.querySelectorAll('[data-example]').forEach(button=>{
      button.classList.remove('active');button.setAttribute('aria-pressed','false');
    });
  }
  const examples={
    translation:{aliceMode:'rest',aX:2.6,aY:1.2,translationMode:'velocity',bVx:0.6,bVy:0,rotationMode:'angle',theta0:0},
    acceleration:{aliceMode:'rest',aX:2.6,aY:1.2,translationMode:'acceleration',bVx:0,bVy:0,bAx:0.22,bAy:0,rotationMode:'angle',theta0:0},
    rotation:{aliceMode:'rest',aX:3,aY:0,translationMode:'offset',rotationMode:'velocity',theta0:0,omega0:0.6},
    euler:{aliceMode:'rest',aX:3,aY:0,translationMode:'offset',rotationMode:'acceleration',theta0:0,omega0:0,alpha:0.15},
    combined:{...DEFAULTS}
  };
  for(const id of ['aliceMode','translationMode','rotationMode']) {
    $(id).addEventListener('change',()=>{
      pause();params[id]=$(id).value;invalidate();clearExample();updateLabels();render();
      setStatus(tr('motionChanged',{time:fmt(time)}));
    });
  }
  document.querySelectorAll('[data-example]').forEach(button=>{
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{
      pause();
      Object.assign(params,DEFAULTS,{rX:0,rY:0,bVx:0,bVy:0,bAx:0,bAy:0,theta0:0,omega0:0,alpha:0},examples[button.dataset.example]);
      clearExample();button.classList.add('active');button.setAttribute('aria-pressed','true');
      time=0;windowStart=0;invalidate();syncInputs();updateLabels();render();updatePlay();
      setStatus(tr('exampleSelected',{name:button.textContent}));
    });
  });
  $('play').addEventListener('click',togglePlay);
  $('reset').addEventListener('click',reset);
  $('step').addEventListener('click',()=>seek(Math.round((time+0.05)*1e8)/1e8));
  $('restoreDefaults').addEventListener('click',()=>{
    pause();Object.assign(params,DEFAULTS);Object.assign(display,DEFAULT_DISPLAY);
    $('playbackSpeed').value='1';time=0;windowStart=0;
    clearExample();invalidate();syncInputs();updateLabels();render();updatePlay();
    setStatus(tr('defaultsRestored'));
  });
  $('time').addEventListener('input',event=>{
    if(!seek(event.target.valueAsNumber)) {
      pause();event.target.setAttribute('aria-invalid','true');
      setStatus(tr('invalidTime'));
    } else event.target.removeAttribute('aria-invalid');
  });
  $('time').addEventListener('change',event=>{
    if(event.target.hasAttribute('aria-invalid')) {
      event.target.value=fmt(time).replace(',','.');
      event.target.removeAttribute('aria-invalid');
    }
  });
  $('playbackSpeed').addEventListener('change',()=>{lastFrame=null;});
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{
    const next=button.dataset.language;
    if(next===language||!translations[next])return;
    language=next;invalidate();updateLabels();render();setStatus(tr('languageChanged'));
  }));
  for(const key of Object.keys(display)) $(key).addEventListener('click',()=>{
    display[key]=!display[key];invalidate();updateLabels();render();
  });
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.altKey||event.metaKey||event.target.closest('input,select,textarea,button,summary,[contenteditable="true"]')) return;
    if(event.code==='Space'){event.preventDefault();togglePlay();}
    if(event.code==='KeyR'){event.preventDefault();reset();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&running){pause();render();setStatus(tr('pausedStatus'));}
  });

  const termNames=[
    {key:'inertial',name:'a_Alice',color:C.inertial},
    {key:'translation',name:'a_translacija',color:C.translation},
    {key:'coriolis',name:'a_coriolis',color:C.coriolis},
    {key:'centrifugal',name:'a_centrifugal',color:C.centrifugal},
    {key:'euler',name:'a_Euler',color:C.euler}
  ];
  function descriptors(s,kind) {
    const arrows=[];
    const push=(from,vector,factor,color,name,dash=false)=>{
      arrows.push({from,to:add(from,mul(vector,factor)),vector,factor,color,name,dash});
    };
    if(kind==='frames') {
      push([0,0],s.frame.R,1,C.R,'R');
      push([0,0],s.alice.r,1,C.alice,'r');
      push(s.frame.R,sub(s.alice.r,s.frame.R),1,C.bob,'r′');
    } else {
      const body=s[kind],prime=kind==='bob'?'′':'';
      if(kind==='bob'&&display.showComponents) {
        let corner=[...body.r];
        for(const term of termNames) {
          const vector=body.terms[term.key];
          if(norm(vector)>1e-11) {
            push(corner,vector,SCALES.a,term.color,term.key==='translation'?'a_'+tr('translationTerm'):term.name);
            corner=add(corner,mul(vector,SCALES.a));
          }
        }
        push(body.r,body.a,SCALES.a,C.a,'a_'+tr('totalTerm'),true);
      } else {
        if(display.showPosition) push([0,0],body.r,1,kind==='alice'?C.alice:C.bob,'r'+prime);
        if(display.showVelocity) push(body.r,body.v,SCALES.v,C.v,'v'+prime);
        if(display.showAcceleration) push(body.r,body.a,SCALES.a,C.a,'a'+prime);
      }
    }
    return arrows;
  }
  function boundsNew(){return {x0:0,x1:0,y0:0,y1:0};}
  function extend(b,p) {
    b.x0=Math.min(b.x0,p[0]);b.x1=Math.max(b.x1,p[0]);
    b.y0=Math.min(b.y0,p[1]);b.y1=Math.max(b.y1,p[1]);
  }
  function collectBounds(bounds,s) {
    for(const kind of ['alice','bob','frames']) {
      const b=bounds[kind];
      extend(b,kind==='frames'?s.alice.r:s[kind].r);
      if(kind==='frames') extend(b,s.frame.R);
      for(const arrow of descriptors(s,kind)){extend(b,arrow.from);extend(b,arrow.to);}
    }
  }
  function mergeBounds(target,source) {
    extend(target,[source.x0,source.y0]);extend(target,[source.x1,source.y1]);
  }
  function aliceTrail(s) {
    // Alicina pot je znana analitično. Ponavljajočega se kroga ali nihanja
    // ni treba shranjevati znova za vsak obrat.
    const path=new Path2D(),bounds=boundsNew(),initial=aliceAt(0,params).r;
    path.moveTo(initial[0],initial[1]);extend(bounds,initial);extend(bounds,s.alice.r);
    if(params.aliceMode==='circle'&&params.radius>0) {
      const phase=params.omegaA*time,sweep=Math.min(TAU,Math.abs(phase));
      if(sweep>0)path.arc(params.aX,params.aY,params.radius,0,Math.sign(phase)*sweep,phase<0);
      extend(bounds,[params.aX-params.radius,params.aY-params.radius]);
      extend(bounds,[params.aX+params.radius,params.aY+params.radius]);
    } else if(params.aliceMode==='oscX'||params.aliceMode==='oscY') {
      const minimum=Math.abs(params.omegaA*time)>=Math.PI?-params.radius:params.radius*Math.cos(params.omegaA*time);
      const end=params.aliceMode==='oscX'?[params.aX+minimum,params.aY]:[params.aX,params.aY+minimum];
      path.lineTo(end[0],end[1]);extend(bounds,end);
    } else {
      path.lineTo(s.alice.r[0],s.alice.r[1]);
    }
    return {path,bounds};
  }
  function originTrail(s) {
    const path=new Path2D(),bounds=boundsNew(),initial=frameAt(0,params);
    path.moveTo(initial.R[0],initial.R[1]);
    if(norm(initial.A)>0) {
      const control=add(initial.R,mul(initial.V,time/2));
      path.quadraticCurveTo(control[0],control[1],s.frame.R[0],s.frame.R[1]);
      for(let k=0;k<2;k++) {
        const turningTime=-initial.V[k]/initial.A[k];
        if(Number.isFinite(turningTime)&&turningTime>0&&turningTime<time)extend(bounds,frameAt(turningTime,params).R);
      }
    } else path.lineTo(s.frame.R[0],s.frame.R[1]);
    extend(bounds,initial.R);extend(bounds,s.frame.R);
    return {path,bounds};
  }
  function trajectoryHistory(s) {
    const signature=JSON.stringify(params);
    if(!bobTrail||bobTrail.signature!==signature||time<bobTrail.end) {
      const initial=stateAt(0).bob.r,path=new Path2D(),bounds=boundsNew();
      path.moveTo(initial[0],initial[1]);extend(bounds,initial);
      bobTrail={signature,path,bounds,end:0,count:1};
    }
    if(time>bobTrail.end) {
      const start=bobTrail.end,dt=time-start;
      const rotationRate=Math.max(Math.abs(frameAt(start,params).omega),Math.abs(s.frame.omega));
      // Med animacijo dodajamo točke na obstoječo pot; starih ne brišemo.
      // Pri neposrednem skoku na zelo velik čas omejimo le gostoto vzorčenja.
      const count=Math.min(50000,Math.max(1,Math.ceil(dt*Math.max(30,20*(Math.abs(params.omegaA)+rotationRate)))));
      for(let i=1;i<=count;i++) {
        const point=i===count?s.bob.r:stateAt(start+dt*i/count).bob.r;
        bobTrail.path.lineTo(point[0],point[1]);extend(bobTrail.bounds,point);
      }
      bobTrail.end=time;bobTrail.count+=count;
    }
    return {alice:aliceTrail(s),bob:bobTrail,origin:originTrail(s)};
  }
  function getData() {
    if(cache) return cache;
    const span=windowSpan(),start=windowStart,end=start+span;
    const frameEnd=frameAt(end,params);
    const rate=Math.max(Math.abs(params.omegaA),Math.abs(frameEnd.omega),Math.abs(frameAt(start,params).omega));
    const count=Math.min(2600,Math.max(400,Math.ceil(span*rate*25)));
    const points=[],bounds={alice:boundsNew(),bob:boundsNew(),frames:boundsNew()};
    for(let i=0;i<=count;i++) {
      const s=stateAt(start+span*i/count);points.push(s);collectBounds(bounds,s);
    }
    // Polni krog je viden tudi pri časovnem intervalu, krajšem od periode.
    if(params.aliceMode==='circle'&&display.showPaths) {
      extend(bounds.alice,[params.aX-params.radius,params.aY-params.radius]);
      extend(bounds.alice,[params.aX+params.radius,params.aY+params.radius]);
      extend(bounds.frames,[params.aX-params.radius,params.aY-params.radius]);
      extend(bounds.frames,[params.aX+params.radius,params.aY+params.radius]);
    }
    cache={start,end,span,points,bounds};return cache;
  }
  function prepare(canvas) {
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,3);
    const w=rect.width,h=rect.height;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)) {
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
    return {ctx,w,h};
  }
  function makeView(b,w,h,kind) {
    // Rob mora v tretjem prikazu sprejeti tudi Bobovi orientacijski osi.
    const margin=kind==='frames'?75:46;
    const dx=Math.max(2.8,(b.x1-b.x0)*1.06),dy=Math.max(2.8,(b.y1-b.y0)*1.06);
    const scale=Math.min((w-2*margin)/dx,(h-2*margin)/dy);
    return {w,h,scale,cx:(b.x0+b.x1)/2,cy:(b.y0+b.y1)/2,kind};
  }
  const screen=(p,v)=>[v.w/2+(p[0]-v.cx)*v.scale,v.h/2-(p[1]-v.cy)*v.scale];
  function line(ctx,points,color,width=1.5,dash=[]) {
    if(points.length<2) return;
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
    let connected=false;
    for(const p of points) {
      if(!p||!p.every(Number.isFinite)){connected=false;continue;}
      if(connected) ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);
      connected=true;
    }
    ctx.stroke();ctx.setLineDash([]);
  }
  function text(ctx,value,x,y,color=C.muted,align='left',font='11px system-ui, sans-serif') {
    ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
    ctx.fillText(value,x,y);
  }
  function niceStep(range,count=6) {
    const raw=range/count,power=10**Math.floor(Math.log10(Math.max(raw,1e-12))),part=raw/power;
    return (part<=1?1:part<=2?2:part<=5?5:10)*power;
  }
  function tickText(n) {
    if(Math.abs(n)<1e-10) return '0';
    if(Math.abs(n)>=1e4||Math.abs(n)<0.01) return n.toExponential(0);
    return fmt(n,Math.abs(n)>=1?1:2).replace(/[.,]0$/,'');
  }
  function grid(ctx,v) {
    const {w,h}=v,origin=screen([0,0],v);
    const x0=v.cx-(w/2-18)/v.scale,x1=v.cx+(w/2-18)/v.scale;
    const y0=v.cy-(h/2-30)/v.scale,y1=v.cy+(h/2-20)/v.scale;
    const step=niceStep(Math.max(x1-x0,y1-y0),Math.max(3,Math.floor(w/60)));
    if(display.showAxes) {
      for(let i=Math.ceil(x0/step);i<=Math.floor(x1/step);i++) {
        const x=i*step,px=screen([x,0],v)[0];
        line(ctx,[[px,18],[px,h-30]],C.grid,1);
        if(i!==0) text(ctx,tickText(x),px,clamp(origin[1]+15,31,h-17),C.muted,'center');
      }
      for(let i=Math.ceil(y0/step);i<=Math.floor(y1/step);i++) {
        const y=i*step,py=screen([0,y],v)[1];
        line(ctx,[[18,py],[w-18,py]],C.grid,1);
        if(i!==0) text(ctx,tickText(y),clamp(origin[0]-8,24,w-35),py,C.muted,'right');
      }
    }
    const color=v.kind==='bob'?C.bob:C.alice;
    const ox=clamp(origin[0],20,w-23),oy=clamp(origin[1],21,h-31);
    const prime=v.kind==='bob'?'′':'';
    line(ctx,[[18,oy],[w-17,oy]],color,1.1);
    line(ctx,[[ox,h-28],[ox,16]],color,1.1);
    line(ctx,[[w-23,oy-3],[w-17,oy],[w-23,oy+3]],color,1.1);
    line(ctx,[[ox-3,22],[ox,16],[ox+3,22]],color,1.1);
    text(ctx,'x'+prime,w-15,clamp(oy-13,14,h-18),color,'right','italic 13px Georgia, serif');
    text(ctx,'y'+prime,ox+10,18,color,'left','italic 13px Georgia, serif');
    text(ctx,tr('gridSpacing')+': '+tickText(step)+' m',16,h-10);
    return {origin,step};
  }
  function pathPart(ctx,states,pick,v,color,dash,width) {
    const points=states.map(s=>screen(pick(s),v));
    line(ctx,points,color,width,dash);
  }
  function historyPart(ctx,path,v,color,width) {
    ctx.save();
    ctx.translate(v.w/2-v.cx*v.scale,v.h/2+v.cy*v.scale);
    ctx.scale(v.scale,-v.scale);
    ctx.strokeStyle=color;ctx.lineWidth=width/v.scale;ctx.setLineDash([]);
    ctx.stroke(path);
    ctx.restore();
  }
  function paths(ctx,v,data,s,history) {
    if(!display.showPaths) return;
    const future=[s,...data.points.filter(p=>p.t>time)];
    const pick=v.kind==='bob'?p=>p.bob.r:p=>p.alice.r;
    const color=v.kind==='bob'?C.bob:C.alice;
    ctx.save();
    const pad=12;ctx.beginPath();ctx.rect(pad,pad,v.w-2*pad,v.h-35);ctx.clip();
    ctx.globalAlpha=0.28;pathPart(ctx,future,pick,v,color,[4,5],1.6);
    ctx.globalAlpha=0.85;historyPart(ctx,history[v.kind==='bob'?'bob':'alice'].path,v,color,2);
    if(params.aliceMode==='circle'&&v.kind!=='bob') {
      const circle=[];
      for(let i=0;i<=180;i++) circle.push(screen([params.aX+params.radius*Math.cos(TAU*i/180),params.aY+params.radius*Math.sin(TAU*i/180)],v));
      ctx.globalAlpha=0.16;line(ctx,circle,color,1);
    }
    if(v.kind==='frames') {
      ctx.globalAlpha=0.28;pathPart(ctx,future,p=>p.frame.R,v,C.R,[3,5],1.4);
      ctx.globalAlpha=0.7;historyPart(ctx,history.origin.path,v,C.R,1.6);
    }
    ctx.restore();
  }
  function arrowPixels(ctx,a,b,color,dash=false,width=VECTOR_STYLE.shaftWidth) {
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    if(length<0.2) return;
    line(ctx,[a,b],color,width,dash?[5,4]:[]);
    const ux=dx/length,uy=dy/length,head=Math.min(VECTOR_STYLE.headLength,length);
    const halfWidth=(width>=VECTOR_STYLE.shaftWidth?VECTOR_STYLE.headWidth:6.5)/2;
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(b[0],b[1]);
    ctx.lineTo(b[0]-head*ux+halfWidth*uy,b[1]-head*uy-halfWidth*ux);
    ctx.lineTo(b[0]-head*ux-halfWidth*uy,b[1]-head*uy+halfWidth*ux);
    ctx.closePath();ctx.fill();
  }
  function dot(ctx,p,color,radius=5) {
    ctx.beginPath();ctx.arc(p[0],p[1],radius,0,TAU);ctx.fillStyle=color;ctx.fill();
    ctx.lineWidth=1.8;ctx.strokeStyle=C.white;ctx.stroke();
  }
  function overlaps(a,b) {
    return Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
      Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  }
  function segmentDistance(p,a,b) {
    const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;
    const u=d===0?0:clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d,0,1);
    return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);
  }
  function drawLabels(ctx,labels,v,segments,obstacles) {
    const occupied=[...obstacles],metrics=[];
    for(const item of labels) {
      const font=item.font||'600 13px system-ui, sans-serif';
      const parts=/^a_([^ =]+)(.*)$/.exec(item.name);
      let contentWidth;
      if(parts) {
        ctx.font='italic 16px Georgia, serif';
        contentWidth=ctx.measureText('a').width+1;
        ctx.font='11px system-ui, sans-serif';
        contentWidth+=ctx.measureText(parts[1]).width;
        ctx.font='13px system-ui, sans-serif';
        contentWidth+=ctx.measureText(parts[2]).width;
      } else {ctx.font=font;contentWidth=ctx.measureText(item.name).width;}
      const width=contentWidth+8,height=parts?24:20;
      const candidates=[[10,-20],[10,7],[-width-10,-20],[-width-10,7],[-width/2,-30],[-width/2,14],
        [18,-9],[-width-18,-9],[23,-31],[23,18],[-width-23,-31],[-width-23,18]];
      for(const radius of [44,65,90]) for(let i=0;i<8;i++) {
        const angle=i*TAU/8;
        candidates.push([radius*Math.cos(angle)-width/2,radius*Math.sin(angle)-height/2]);
      }
      let best=null,bestScore=Infinity;
      for(let i=0;i<candidates.length;i++) {
        const [dx,dy]=candidates[i];
        const box={x:clamp(item.anchor[0]+dx,7,v.w-width-7),y:clamp(item.anchor[1]+dy,7,v.h-height-29),w:width,h:height};
        const center=[box.x+width/2,box.y+height/2];
        let score=i*0.3;
        for(const other of occupied) score+=overlaps(box,other)*30;
        for(const segment of segments) {
          const distance=segmentDistance(center,segment[0],segment[1]);
          if(distance<12) score+=(12-distance)*2;
        }
        if(score<bestScore){bestScore=score;best=box;}
      }
      const edge=[clamp(item.anchor[0],best.x,best.x+best.w),clamp(item.anchor[1],best.y,best.y+best.h)];
      if(norm(sub(edge,item.anchor))>12) {
        ctx.save();ctx.globalAlpha=0.45;line(ctx,[item.anchor,edge],item.color||C.muted,0.8);ctx.restore();
      }
      if(parts) {
        const y=best.y+height/2;
        ctx.fillStyle=item.color||C.text;ctx.textAlign='left';ctx.textBaseline='alphabetic';
        ctx.font='italic 16px Georgia, serif';ctx.fillText('a',best.x+4,y+3);
        let x=best.x+4+ctx.measureText('a').width+1;
        ctx.font='11px system-ui, sans-serif';ctx.fillText(parts[1],x,y+7);
        x+=ctx.measureText(parts[1]).width;
        ctx.font='13px system-ui, sans-serif';ctx.fillText(parts[2],x,y+3);
      } else text(ctx,item.name,best.x+4,best.y+height/2,item.color||C.text,'left',font);
      occupied.push(best);metrics.push({...best,name:item.name,subscript:parts?parts[1]:null});
    }
    return metrics;
  }
  function drawFramesAxes(ctx,v,s,labels,segments) {
    const origin=screen(s.frame.R,v),theta=s.frame.theta;
    const ex=[Math.cos(theta),-Math.sin(theta)],ey=[-Math.sin(theta),-Math.cos(theta)];
    // Osi označujeta smer; njuna narisana dolžina ni fizikalna količina.
    const length=Math.min(62,v.w*0.16),back=17;
    for(const [unit,name] of [[ex,'x′'],[ey,'y′']]) {
      const a=sub(origin,mul(unit,back)),b=add(origin,mul(unit,length));
      arrowPixels(ctx,a,b,C.bob,false,1.6);
      labels.push({name,anchor:b,color:C.bob,font:'italic 14px Georgia, serif'});
      segments.push([a,b]);
    }
    labels.push({name:'O′',anchor:origin,color:C.bob,font:'600 12px system-ui, sans-serif'});
    const base=screen([0,0],v);
    labels.push({name:'O',anchor:base,color:C.alice,font:'600 12px system-ui, sans-serif'});
    // Kot je v risbi podan modulo 2 pi, izpis spodaj pa ohranja število obratov.
    let thetaWrapped=((theta%TAU)+TAU)%TAU;
    if(thetaWrapped>Math.PI) thetaWrapped-=TAU;
    if(Math.abs(thetaWrapped)>0.03) {
      const radius=22;
      line(ctx,[origin,add(origin,[radius+6,0])],C.axis,1,[2,3]);
      ctx.beginPath();ctx.arc(origin[0],origin[1],radius,0,-thetaWrapped,thetaWrapped>0);
      ctx.strokeStyle=C.bob;ctx.lineWidth=1.2;ctx.stroke();
      labels.push({name:'θ',anchor:add(origin,[(radius+7)*Math.cos(thetaWrapped/2),-(radius+7)*Math.sin(thetaWrapped/2)]),color:C.bob,font:'italic 13px Georgia, serif'});
    }
    dot(ctx,origin,C.bob,4);
  }
  function drawScene(kind,prepared,v,s,data,history) {
    const {ctx}=prepared;
    grid(ctx,v);paths(ctx,v,data,s,history);
    const labels=[],segments=[],obstacles=[],arrowMetrics=[];
    const body=kind==='frames'?s.alice:s[kind],particle=screen(body.r,v);
    const arrows=descriptors(s,kind);
    // Telo rišemo pred vektorji, da ne zakrije zelo kratke puščice.
    dot(ctx,particle,C.particle,5.5);
    if(kind==='frames') drawFramesAxes(ctx,v,s,labels,segments);
    else {
      const origin=screen([0,0],v);
      labels.push({name:kind==='alice'?'O':'O′',anchor:origin,color:kind==='alice'?C.alice:C.bob,font:'12px system-ui, sans-serif'});
    }
    for(const arrow of arrows) {
      let a=screen(arrow.from,v),b=screen(arrow.to,v);
      const length=norm(sub(b,a)),magnitude=norm(arrow.vector);
      // Pri skupnem izhodišču bi se r in Qr′ povsem prekrila. Vzporedni
      // odmik ohrani dolžino in smer; tanki vezi označujeta pravi krajišči.
      if(kind==='frames'&&arrow.name==='r′'&&norm(s.frame.R)<1e-10&&length>1) {
        const shift=mul(J(sub(b,a)),6/length),aa=add(a,shift),bb=add(b,shift);
        line(ctx,[a,aa],C.axis,0.8);line(ctx,[b,bb],C.axis,0.8);a=aa;b=bb;
      }
      // Pri eni sami komponenti se črtkana vsota vzporedno odmakne za 5 px.
      if(arrow.dash&&arrows.length===2&&length>0.2) {
        const shift=mul(J(sub(b,a)),5/length),aa=add(a,shift),bb=add(b,shift);
        line(ctx,[a,aa],C.axis,0.8);line(ctx,[b,bb],C.axis,0.8);a=aa;b=bb;
      }
      arrowPixels(ctx,a,b,arrow.color,arrow.dash,VECTOR_STYLE.shaftWidth);
      segments.push([a,b]);
      // Ničelnih členov razcepa in ničelnega premika ne naštevamo na risbi.
      if(length>=0.2||(!(kind==='bob'&&display.showComponents)&&kind!=='frames')) {
        const name=length>=0.2?arrow.name:arrow.name+(magnitude<1e-11?' = 0':' ≈ 0');
        const anchor=(kind==='frames'||(kind==='bob'&&display.showComponents))?mul(add(a,b),0.5):b;
        labels.push({name,anchor,color:arrow.color});
      }
      arrowMetrics.push({name:arrow.name,from:a,to:b,lengthPx:length,magnitude,factor:arrow.factor,dash:arrow.dash});
    }
    obstacles.push({x:particle[0]-9,y:particle[1]-9,w:18,h:18});
    if(kind==='frames') labels.push({name:tr('body'),anchor:particle,color:C.particle,font:'11px system-ui, sans-serif'});
    else if(kind==='bob'&&display.showComponents&&norm(s.bob.a)<1e-10) {
      labels.push({name:'a_'+tr('totalTerm')+' = 0',anchor:particle,color:C.a});
    }
    const labelMetrics=drawLabels(ctx,labels,v,segments,obstacles);
    return {...v,arrows:arrowMetrics,labels:labelMetrics,particle};
  }
  function readouts(s,force=false) {
    const now=performance.now();
    if(!force&&now-lastReadout<80) return;
    lastReadout=now;
    if(document.activeElement!==$('time')) {
      $('time').value=time.toFixed(2);$('time').removeAttribute('aria-invalid');
    }
  }
  function render() {
    const s=stateAt(time),data=getData(),history=trajectoryHistory(s);
    const kinds=['alice','bob','frames'],prepared={},views={};
    // Točen trenutni položaj varuje tudi pred odstopanjem pri redkem vzorčenju.
    const bounds=Object.fromEntries(kinds.map(k=>[k,{...data.bounds[k]}]));
    collectBounds(bounds,s);
    if(display.showPaths) {
      mergeBounds(bounds.alice,history.alice.bounds);
      mergeBounds(bounds.bob,history.bob.bounds);
      mergeBounds(bounds.frames,history.alice.bounds);
      mergeBounds(bounds.frames,history.origin.bounds);
    }
    for(const kind of kinds) {
      prepared[kind]=prepare($(kind+'Canvas'));
      views[kind]=makeView(bounds[kind],prepared[kind].w,prepared[kind].h,kind);
    }
    if(display.sameScale) {
      const scale=Math.min(...Object.values(views).map(v=>v.scale));
      for(const v of Object.values(views)) v.scale=scale;
    }
    lastViews={};
    for(const kind of kinds) lastViews[kind]=drawScene(kind,prepared[kind],views[kind],s,data,history);
    readouts(s,!running);
  }
  function frame(timestamp) {
    raf=null;
    if(!running) return;
    if(lastFrame!==null) time+=Math.min(0.1,(timestamp-lastFrame)/1000)*Number($('playbackSpeed').value);
    lastFrame=timestamp;followTime();render();
    raf=requestAnimationFrame(frame);
  }
  let resizePending=false;
  const resizeObserver=new ResizeObserver(()=>{
    if(resizePending) return;
    resizePending=true;
    requestAnimationFrame(()=>{resizePending=false;render();});
  });
  for(const id of ['aliceCanvas','bobCanvas','framesCanvas']) resizeObserver.observe($(id));
  syncInputs();updateLabels();render();updatePlay();
})();

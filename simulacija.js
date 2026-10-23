/*
 * Eliptično gibanje brez zunanjih knjižnic. Odprite sosednjo datoteko index.html.
 *
 * Pot je r(t) = [rx cos(theta(t)), ry sin(theta(t))].
 * Prednastavitve določajo fazo theta(t); položajni kot phi(t) izračunamo iz lege.
 * v = theta' [-rx sin(theta), ry cos(theta)]
 * a = -theta'^2 r + theta'' [-rx sin(theta), ry cos(theta)]
 * a_parallel = ((a dot v) / (v dot v)) v; a_perp = a - a_parallel.
 * Vse puščice pospeška uporabljajo ISTO merilo. Pri ničelni hitrosti smer tangente
 * ni določena, zato takrat ne prikazujemo komponent pospeška.
 * Ničelna polos pomeni nihanje na premici. V izhodišču kot ni določen.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAU = 2 * Math.PI;
  const colors = { r:'#2455d6', v:'#b65c09', a:'#cf3541', tangent:'#138367', normal:'#8050b5', path:'#36a0d1', phi:'#6550a5', text:'#17212e', muted:'#677586', grid:'#edf1f6', axis:'#a8b3c2' };
  const params = { rx:4, ry:1, omega0:0.8, alpha:0.15, tau:3, theta0:45, mode:'uniform' };
  const display = { showPosition:false, showComponents:false, showAxes:true, showTrail:false };
  // Stalna pretvorba merskih enot puščic v metre na koordinatnih oseh.
  // Skupni pogled se sme oddaljiti; posameznih vektorjev ne normaliziramo.
  const VECTOR_SCALES=Object.freeze({v:.65,a:1});
  const CHART_SPAN=12;
  let cameraScaleLimit=Infinity,lastView=null;
  const labelLayout=new Map();
  const labelSides=new Map();
  let labelFrame=null;
  let language='sl';
  let angleUnit='deg', time=0, running=false, lastFrame=null, raf=null, revision=0, cache=null, lastReadout=-Infinity;

  const strings = {
    sl:{title:'Eliptično gibanje',subtitle:'Pot, velikosti in položajni kot.',pathTitle:'Gibanje v ravnini',pathDescription:'Enako merilo na obeh oseh · x, y v metrih',magnitudesTitle:'Velikosti vektorjev',magnitudesDescription:'Tri merila · skupna časovna os',angleTitle:'Položajni kot φ',angleDescription:'Od pozitivne osi x · z upoštevanimi obrati',tangential:'Tangencialni pospešek',normal:'Normalni pospešek',position:'Krajevni vektor r',velocity:'Hitrost v',acceleration:'Pospešek a',tangentialLegend:'Tangencialni a∥',normalLegend:'Normalni a⊥',continuousAngle:'Zvezni kot φ',withinTurn:'Znotraj enega obrata',future:'Črtkano: prihodnji potek',play:'Zaženi',pause:'Ustavi',reset:'Na začetek',step:'Korak',time:'Čas',playback:'Predvajanje',uniform:'Konstantna frekvenca',uniformCircle:'Konstantna kotna hitrost',positive:'Pozitivni kotni pospešek',negative:'Negativni kotni pospešek',positivePhase:'Naraščajoča frekvenca',negativePhase:'Padajoča frekvenca',exponential:'Eksponentno ustavljanje',ellipse:'Elipsa',circle:'Krog · rₓ = rᵧ',radiusX:'Polos rₓ',radiusY:'Polos rᵧ',initialRate:'Začetna frekvenca ω₀',initialAngularRate:'Začetna kotna hitrost ω₀',phaseAlpha:'Sprememba frekvence α',angularAlpha:'Kotni pospešek α',tau:'Čas ustavljanja τ',initialPhase:'Začetna faza θ₀',components:'Razcep pospeška',axes:'Koordinatni sistem',trail:'Sled gibanja',angleUnits:'Kot',paused:'Ustavljeno',running:'Animacija teče',invalid:'Vnesite končno število v dovoljenem območju.',resetStatus:'Čas je ponastavljen na nič.',undefined:'Ni določen pri ničelni hitrosti',undefinedShort:'Ni določen',pathAlt:'Eliptična pot s krajevnim vektorjem, hitrostjo in pospeškom.',magnitudeAlt:'Velikosti krajevnega vektorja, hitrosti in pospeška skozi čas; ločena merila.',angleAlt:'Položajni kot od pozitivne osi x skozi čas, brez preskoka po polnem obratu.',atRest:'v = 0: smer tangente ni določena'}
  };
  Object.assign(strings.sl,{
    angleTitle:'Položajni kot in odvoda',angleDescription:'φ, dφ/dt in d²φ/dt² · skupna časovna os',
    lineX:'Nihanje x · rᵧ = 0',lineY:'Nihanje y · rₓ = 0',resetView:'Obnovi pogled',
    componentPositionNote:'Pri razcepu so prikazane komponenti pospeška in njuna vsota.',
    angleAlt:'Položajni kot, njegova kotna hitrost in kotni pospešek skozi čas; tri ločena merila.',
    atOrigin:'V izhodišču kot in odvoda niso določeni.',
    language:'Jezik',simulation:'Simulacija',legend:'Legenda',settings:'Nastavitve',motionLaw:'Časovni potek',trajectory:'Pot',angularUnits:'Kotne enote',equalAxes:'Izenači polosi',totalAcceleration:'Skupni pospešek a',
    description:'Interaktivni prikaz eliptičnega gibanja: lega, hitrost, tangencialni in normalni pospešek ter položajni kot.'
  });
  strings.en={
    title:'Elliptical motion',subtitle:'Trajectory, magnitudes and polar angle.',
    pathTitle:'Motion in a plane',pathDescription:'Equal scale on both axes · x, y in metres',
    magnitudesTitle:'Vector magnitudes',magnitudesDescription:'Three scales · shared time axis',
    angleTitle:'Polar angle and derivatives',angleDescription:'φ, dφ/dt and d²φ/dt² · shared time axis',
    tangential:'Tangential acceleration',normal:'Normal acceleration',position:'Position vector r',velocity:'Velocity v',acceleration:'Acceleration a',
    tangentialLegend:'Tangential a∥',normalLegend:'Normal a⊥',continuousAngle:'Unwrapped angle φ',withinTurn:'Within one revolution',future:'Dashed: future evolution',
    play:'Run',pause:'Pause',reset:'Reset time',step:'Step',time:'Time',playback:'Playback',resetView:'Reset view',
    uniform:'Constant phase rate',uniformCircle:'Constant angular velocity',positive:'Positive angular acceleration',negative:'Negative angular acceleration',
    positivePhase:'Increasing phase rate',negativePhase:'Decreasing phase rate',exponential:'Exponential stopping',
    ellipse:'Ellipse',circle:'Circle · rₓ = rᵧ',lineX:'Oscillation x · rᵧ = 0',lineY:'Oscillation y · rₓ = 0',
    radiusX:'Semiaxis rₓ',radiusY:'Semiaxis rᵧ',initialRate:'Initial phase rate ω₀',initialAngularRate:'Initial angular velocity ω₀',
    phaseAlpha:'Phase acceleration α',angularAlpha:'Angular acceleration α',tau:'Stopping time τ',initialPhase:'Initial phase θ₀',
    components:'Acceleration components',axes:'Coordinate axes',trail:'Motion trail',angleUnits:'Angle',
    paused:'Paused',running:'Animation running',invalid:'Enter a finite number within the allowed range.',resetStatus:'Time has been reset to zero.',
    undefined:'Undefined at zero velocity',undefinedShort:'Undefined',atOrigin:'The angle and its derivatives are undefined at the origin.',atRest:'v = 0: tangent direction is undefined',
    componentPositionNote:'The acceleration components and their sum are shown in decomposition mode.',
    pathAlt:'Elliptical trajectory with position, velocity and acceleration vectors.',
    magnitudeAlt:'Magnitudes of position, velocity and acceleration versus time, with separate scales.',
    angleAlt:'Polar angle and its first and second time derivatives, with three separate scales.',
    language:'Language',simulation:'Simulation',legend:'Legend',settings:'Controls',motionLaw:'Motion law',trajectory:'Trajectory',angularUnits:'Angular units',equalAxes:'Make the semiaxes equal',totalAcceleration:'Total acceleration a',
    description:'Interactive elliptical motion: position, velocity, tangential and normal acceleration, and polar angle.'
  };
  const tr = key => strings[language][key] || key;
  const mag = v => Math.hypot(v[0],v[1]);
  const dot = (a,b) => a[0]*b[0]+a[1]*b[1];
  const mul = (v,k) => [v[0]*k,v[1]*k];
  const add = (a,b) => [a[0]+b[0],a[1]+b[1]];
  const mod = (x,n) => ((x%n)+n)%n;
  function fmt(n,digits=2){
    if(!Number.isFinite(n))return '—';
    if(Math.abs(n)<0.5*10**(-digits))n=0;
    if(Math.abs(n)>=1e6)return n.toExponential(2);
    return n.toLocaleString(language==='sl'?'sl-SI':'en-GB',{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:false});
  }
  function compact(n,digits=2){
    if(!Number.isFinite(n))return '—';
    if(n!==0&&(Math.abs(n)<.01||Math.abs(n)>=1e4))return n.toExponential(1);
    return fmt(n,digits);
  }
  function phaseAt(t,p=params){
    const theta0=p.theta0*Math.PI/180;
    if(p.mode==='exponential'){
      const decay=Math.exp(-t/p.tau),omega=p.omega0*decay;
      return {theta:theta0-p.omega0*p.tau*Math.expm1(-t/p.tau),omega,alpha:-omega/p.tau};
    }
    const alpha=p.mode==='uniform'?0:p.alpha;
    return {theta:theta0+p.omega0*t+.5*alpha*t*t,omega:p.omega0+alpha*t,alpha};
  }
  function stateAt(t,p=params){
    const phase=phaseAt(t,p);
    const reduced=mod(phase.theta+Math.PI,TAU)-Math.PI;
    const c=Math.cos(reduced),s=Math.sin(reduced);
    const linear=p.rx===0||p.ry===0;
    const r=[p.rx*c,p.ry*s],tangent=[-p.rx*s,p.ry*c];
    if(linear&&mag(r)<1e-12*Math.max(p.rx,p.ry)){r[0]=0;r[1]=0;}
    const v=mul(tangent,phase.omega),a=add(mul(r,-(phase.omega**2)),mul(tangent,phase.alpha));
    const speed=mag(v),acceleration=mag(a);
    // Relativna toleranca odstrani zaokrožitvene ostanke ob spremembi smeri.
    const threshold=1e-12*Math.max(p.rx,p.ry)*Math.max(1,Math.abs(p.omega0));
    const frenetDefined=speed>threshold;
    let tangential=null,aParallel=null,aNormal=null,normal=null;
    if(frenetDefined){
      const unitT=mul(v,1/speed);
      tangential=dot(a,unitT); // Predznačena sprememba velikosti hitrosti.
      if(Math.abs(tangential)<1e-13*Math.max(1,acceleration))tangential=0;
      aParallel=mul(unitT,tangential);
      aNormal=[a[0]-aParallel[0],a[1]-aParallel[1]];
      normal=mag(aNormal);
    }
    const radius=mag(r),phiDefined=radius>0;
    const turns=Math.round((phase.theta-reduced)/TAU);
    let phi=null,phiDot=null,phiDDot=null;
    if(phiDefined){
      phi=linear?mod(Math.atan2(r[1],r[0]),TAU):Math.atan2(r[1],r[0])+turns*TAU;
      const r2=radius*radius,crossRV=r[0]*v[1]-r[1]*v[0],crossRA=r[0]*a[1]-r[1]*a[0];
      phiDot=crossRV/r2;
      phiDDot=crossRA/r2-2*crossRV*dot(r,v)/(r2*r2);
      if(Math.abs(phiDDot)<1e-13*Math.max(1,Math.abs(phiDot)))phiDDot=0;
    }
    return {...phase,r,v,a,speed,acceleration,radius,phi,phiDot,phiDDot,phiDefined,linear,wrappedPhi:phiDefined?mod(phi,TAU):null,frenetDefined,tangential,normal,aParallel,aNormal};
  }
  // Bralni vmesnik za ponovljive numerične preizkuse in uporabo pri pouku.
  window.EllipseMotion=Object.freeze({evaluate:(t,overrides={})=>stateAt(t,{...params,...overrides}),getParameters:()=>({...params}),getTime:()=>time,isRunning:()=>running,getView:()=>lastView?JSON.parse(JSON.stringify(lastView)):null});

  const definitions=[
    {key:'rx',min:0,max:5,step:.05,unit:'m',label:'radiusX'},
    {key:'ry',min:0,max:5,step:.05,unit:'m',label:'radiusY'},
    {key:'omega0',min:-3,max:3,step:.05,unit:'rad/s',label:'initialRate'},
    {key:'alpha',min:-.5,max:.5,step:.01,unit:'rad/s²',label:'phaseAlpha'},
    {key:'tau',min:.25,max:12,step:.05,unit:'s',label:'tau'},
    {key:'theta0',min:0,max:360,step:1,unit:'°',label:'initialPhase'}
  ];
  for(const d of definitions){
    const node=document.createElement('div');node.className='parameter';node.id=d.key+'Control';
    node.innerHTML=`<label class="parameter-label" id="${d.key}Label" for="${d.key}Number"></label><input id="${d.key}Range" type="range" min="${d.min}" max="${d.max}" step="${d.step}" aria-labelledby="${d.key}Label"><input id="${d.key}Number" type="number" min="${d.min}" max="${d.max}" step="${d.step}" inputmode="decimal" aria-labelledby="${d.key}Label"><span class="unit">${d.unit}</span>`;
    $('parameterGrid').append(node);
    const onInput=e=>{
      const n=e.target.valueAsNumber;
      if(!Number.isFinite(n)||n<d.min||n>d.max){e.target.setAttribute('aria-invalid','true');setStatus('invalid');return;}
      pause();params[d.key]=n;
      if(d.key!=='rx'&&d.key!=='ry')time=0;
      invalidate();syncInputs(e.target.id);updateLabels();render();
    };
    $(d.key+'Range').addEventListener('input',onInput);
    $(d.key+'Number').addEventListener('input',onInput);
    $(d.key+'Number').addEventListener('change',()=>syncInputs());
  }
  function invalidate(){revision++;cache=null;lastReadout=-Infinity;}
  function syncInputs(skipId=null){
    for(const d of definitions){
      if(d.key+'Range'!==skipId)$(d.key+'Range').value=params[d.key];
      if(d.key+'Number'!==skipId)$(d.key+'Number').value=params[d.key];
      $(d.key+'Number').removeAttribute('aria-invalid');
    }
  }
  function setStatus(key){$('status').textContent=tr(key);}
  function updatePlay(){
    $('playText').textContent=tr(running?'pause':'play');$('playIcon').textContent=running?'Ⅱ':'▶';
    $('play').setAttribute('aria-pressed',String(running));
    $('stateBadge').textContent=tr(running?'running':'paused');$('stateBadge').classList.toggle('running',running);
  }
  function pause(){
    running=false;lastFrame=null;
    if(raf!==null)cancelAnimationFrame(raf);
    raf=null;updatePlay();
  }
  function play(){running=true;lastFrame=null;updatePlay();setStatus('running');if(raf===null)raf=requestAnimationFrame(frame);}
  function togglePlay(){if(running){pause();setStatus('paused');render();}else play();}
  function resetCamera(){cameraScaleLimit=Infinity;}
  function reset(){pause();time=0;resetCamera();invalidate();$('time').removeAttribute('aria-invalid');setStatus('resetStatus');render();}
  function seek(n){
    if(!Number.isFinite(n)||n<0)return false;
    // Preverimo morebitno prekoračitev številskega obsega pri izračunu faze.
    const state=stateAt(n);
    if(!Number.isFinite(state.theta)||!Number.isFinite(state.acceleration))return false;
    pause();time=n;cache=null;lastReadout=-Infinity;render();return true;
  }
  $('play').addEventListener('click',togglePlay);
  $('reset').addEventListener('click',reset);
  $('resetView').addEventListener('click',()=>{resetCamera();render();});
  $('step').addEventListener('click',()=>seek(time+1/30));
  $('time').addEventListener('input',e=>{
    const n=e.target.valueAsNumber;
    if(!seek(n)){pause();e.target.setAttribute('aria-invalid','true');setStatus('invalid');return;}
    e.target.removeAttribute('aria-invalid');
  });
  $('time').addEventListener('change',e=>{if(e.target.hasAttribute('aria-invalid')){e.target.value=time.toFixed(2);e.target.removeAttribute('aria-invalid');}});
  $('playbackSpeed').addEventListener('change',()=>{lastFrame=null;});
  document.querySelectorAll('[data-motion]').forEach(button=>button.addEventListener('click',()=>{
    const presets={uniform:{omega0:.8,alpha:0},positive:{omega0:.4,alpha:.15},negative:{omega0:1.2,alpha:-.2},exponential:{omega0:1.2,tau:3}};
    Object.assign(params,presets[button.dataset.motion],{mode:button.dataset.motion});
    syncInputs();updateLabels();reset();
  }));
  $('circlePreset').addEventListener('click',()=>{
    pause();params.rx=params.ry=Math.max(params.rx,params.ry)||2;resetCamera();syncInputs();updateLabels();invalidate();render();
  });
  $('ellipsePreset').addEventListener('click',()=>{
    pause();params.rx=4;params.ry=1;resetCamera();syncInputs();updateLabels();invalidate();render();
  });
  $('lineXPreset').addEventListener('click',()=>{
    pause();params.rx=params.rx||params.ry||4;params.ry=0;resetCamera();syncInputs();updateLabels();invalidate();render();
  });
  $('lineYPreset').addEventListener('click',()=>{
    pause();params.ry=params.ry||params.rx||4;params.rx=0;resetCamera();syncInputs();updateLabels();invalidate();render();
  });
  for(const key of Object.keys(display))$(key).addEventListener('click',()=>{
    if($(key).disabled)return;
    display[key]=!display[key];$(key).classList.toggle('active',display[key]);$(key).setAttribute('aria-pressed',String(display[key]));
    updateLabels();render();
  });
  document.querySelectorAll('[data-angle-unit]').forEach(b=>b.addEventListener('click',()=>{angleUnit=b.dataset.angleUnit;updateLabels();lastReadout=-Infinity;render();}));
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{
    language=button.dataset.language;updateLabels();setStatus(running?'running':'paused');lastReadout=-Infinity;render();
  }));
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,select,textarea,button,[contenteditable="true"]'))return;
    if(e.code==='Space'){e.preventDefault();togglePlay();}
    if(e.code==='KeyR'){e.preventDefault();reset();}
  });
  // Ko zavihek ni viden, čas simulacije miruje.
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){pause();setStatus('paused');render();}});
  function updateLabels(){
    document.documentElement.lang=language;document.title=tr('title');
    document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=tr(n.dataset.i18n));
    document.querySelectorAll('[data-i18n-aria]').forEach(n=>n.setAttribute('aria-label',tr(n.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(n=>n.title=tr(n.dataset.i18nTitle));
    document.querySelector('meta[name="description"]').content=tr('description');
    document.querySelectorAll('[data-language]').forEach(button=>{
      const active=button.dataset.language===language;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    for(const option of $('playbackSpeed').options)option.textContent=language==='sl'?option.value.replace('.',',')+'×':option.value+'×';
    const circular=params.rx>0&&params.ry>0&&Math.abs(params.rx-params.ry)<1e-10;
    const lineX=params.rx>0&&params.ry===0,lineY=params.ry>0&&params.rx===0;
    const linear=params.rx===0||params.ry===0;
    if(linear)display.showComponents=false;
    $('showComponents').disabled=linear;
    $('showComponents').classList.toggle('active',display.showComponents);
    $('showComponents').setAttribute('aria-pressed',String(display.showComponents));
    document.querySelector('[data-motion="uniform"]').textContent=tr(circular?'uniformCircle':'uniform');
    document.querySelector('[data-motion="positive"]').textContent=tr(circular?'positive':'positivePhase');
    document.querySelector('[data-motion="negative"]').textContent=tr(circular?'negative':'negativePhase');
    for(const d of definitions){
      let key=d.label;
      if(d.key==='omega0'&&circular)key='initialAngularRate';
      if(d.key==='alpha'&&circular)key='angularAlpha';
      $(d.key+'Label').textContent=tr(key);
    }
    $('alphaControl').hidden=params.mode==='uniform'||params.mode==='exponential';
    $('tauControl').hidden=params.mode!=='exponential';
    $('parameterGrid').style.setProperty('--count',definitions.filter(d=>!$(d.key+'Control').hidden).length);
    for(const [id,active] of [['ellipsePreset',params.rx>0&&params.ry>0&&!circular],['circlePreset',circular],['lineXPreset',lineX],['lineYPreset',lineY]]){
      $(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));
    }
    $('showPosition').disabled=display.showComponents;
    $('showPosition').title=display.showComponents?tr('componentPositionNote'):'';
    $('positionKey').hidden=display.showComponents;$('velocityKey').hidden=display.showComponents;
    $('accelerationLegend').textContent='a';
    $('accelerationKey').querySelector('.swatch').classList.toggle('sum',display.showComponents);
    document.querySelectorAll('.component-key').forEach(n=>n.hidden=!display.showComponents);
    document.querySelectorAll('[data-motion]').forEach(b=>{const active=b.dataset.motion===params.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-angle-unit]').forEach(b=>{const active=b.dataset.angleUnit===angleUnit;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('pathCanvas').setAttribute('aria-label',tr('pathAlt'));$('magnitudesCanvas').setAttribute('aria-label',tr('magnitudeAlt'));$('angleCanvas').setAttribute('aria-label',tr('angleAlt'));
    updatePlay();
  }

  const canvases=['pathCanvas','magnitudesCanvas','angleCanvas'].map($);
  function prepare(canvas){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,3);
    const w=rect.width,h=rect.height;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.font='11px system-ui, sans-serif';
    return {ctx,w,h};
  }
  function stroke(ctx,points,color,width=1.5,dash=[]){
    if(points.length<2)return;
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
    let connected=false;
    for(const p of points){
      if(!p||!p.every(Number.isFinite)){connected=false;continue;}
      if(connected)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);connected=true;
    }
    ctx.stroke();ctx.setLineDash([]);
  }
  function label(ctx,text,x,y,color=colors.muted,align='left',font='11px system-ui, sans-serif'){
    ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);
  }
  function niceStep(range,count=4){
    if(!Number.isFinite(range)||range<=0)return 1;
    const raw=range/count,power=10**Math.floor(Math.log10(raw)),fraction=raw/power;
    return (fraction<=1?1:fraction<=2?2:fraction<=2.5?2.5:fraction<=5?5:10)*power;
  }
  function ticks(lo,hi,count=4){
    const step=niceStep(hi-lo,count),out=[];
    for(let n=Math.ceil((lo-step*1e-9)/step),i=0;i<60;n++,i++){
      const value=n*step;if(value>hi+step*1e-8)break;out.push(Math.abs(value)<step*1e-8?0:value);
    }
    return out;
  }
  function tickText(n){
    if(n===0)return '0';
    if(Math.abs(n)>=1e4||Math.abs(n)<.01)return n.toExponential(0);
    return fmt(n,Math.abs(n)>=10?0:Math.abs(n)>=1?1:2).replace(/[.,]0+$/,'');
  }
  function getChartData(){
    const span=CHART_SPAN,start=time<.8*span?0:time-.8*span,end=start+span;
    const key=`${revision}/${start}/${span}`;
    if(cache&&cache.key===key)return cache;
    const first=phaseAt(start),last=phaseAt(end),maxOmega=Math.max(Math.abs(first.omega),Math.abs(last.omega));
    const maxAlpha=Math.max(Math.abs(first.alpha),Math.abs(last.alpha));
    const count=Math.min(3200,Math.max(360,Math.ceil(maxOmega*span*18)));
    const points=[];
    for(let i=0;i<=count;i++){const t=start+span*i/count;points.push({t,...stateAt(t)});}
    const radius=Math.max(params.rx,params.ry);
    const upperR=radius,upperV=radius*maxOmega,upperA=radius*(maxOmega**2+maxAlpha);
    const vScale=VECTOR_SCALES.v,aScale=VECTOR_SCALES.a;
    cache={key,start,end,span,points,upperR,upperV,upperA,vScale,aScale};return cache;
  }

  function drawPath(s,data,timestamp){
    const {ctx,w,h}=prepare($('pathCanvas'));
    const descriptors=[];
    const push=(from,vector,factor,color,name,dashed=false)=>{
      const id=name==='r'?'position':name==='v'?'velocity':color===colors.tangent?'tangent':color===colors.normal?'normal':'acceleration';
      descriptors.push({id,from,to:add(from,mul(vector,factor)),vector,factor,color,name,dashed});
    };
    if(display.showComponents){
      if(s.frenetDefined){
        const corner=add(s.r,mul(s.aParallel,VECTOR_SCALES.a));
        push(s.r,s.aParallel,VECTOR_SCALES.a,colors.tangent,'a∥');
        push(corner,s.aNormal,VECTOR_SCALES.a,colors.normal,'a⊥');
      }
      push(s.r,s.a,VECTOR_SCALES.a,colors.a,'a',true);
    }else{
      if(display.showPosition)push([0,0],s.r,1,colors.r,'r');
      push(s.r,s.v,VECTOR_SCALES.v,colors.v,'v');
      push(s.r,s.a,VECTOR_SCALES.a,colors.a,'a');
    }
    // Rezerviran rob vključuje konice, napise in črtkano vzporedno vsoto.
    let boundX=Math.max(params.rx,.3),boundY=Math.max(params.ry,.3);
    for(const item of descriptors)for(const p of [item.from,item.to]){boundX=Math.max(boundX,Math.abs(p[0]));boundY=Math.max(boundY,Math.abs(p[1]));}
    const fit=Math.min((w-88)/(2*boundX),(h-82)/(2*boundY));
    // Med tekom se pogled samo oddaljuje; krajših vektorjev ne povečujemo.
    cameraScaleLimit=Math.min(cameraScaleLimit,fit);
    const scale=cameraScaleLimit;
    const origin=[w/2,h/2],screen=p=>[origin[0]+p[0]*scale,origin[1]-p[1]*scale];
    const halfX=(w-52)/(2*scale),halfY=(h-44)/(2*scale);
    if(display.showAxes){
      const step=niceStep(Math.max(2*halfX,2*halfY),8);
      for(const x of ticks(-halfX,halfX,Math.max(3,2*halfX/step))){
        const px=screen([x,0])[0];stroke(ctx,[[px,20],[px,h-22]],colors.grid,1);
        if(Math.abs(x)>step*1e-6)label(ctx,tickText(x),px,origin[1]+14,colors.muted,'center','10px system-ui, sans-serif');
      }
      for(const y of ticks(-halfY,halfY,Math.max(3,2*halfY/step))){
        const py=screen([0,y])[1];stroke(ctx,[[25,py],[w-22,py]],colors.grid,1);
        if(Math.abs(y)>step*1e-6)label(ctx,tickText(y),origin[0]-8,py,colors.muted,'right','10px system-ui, sans-serif');
      }
      stroke(ctx,[[20,origin[1]],[w-15,origin[1]]],colors.axis,1);
      stroke(ctx,[[origin[0],h-15],[origin[0],13]],colors.axis,1);
      stroke(ctx,[[w-20,origin[1]-3],[w-15,origin[1]],[w-20,origin[1]+3]],colors.axis,1);
      stroke(ctx,[[origin[0]-3,18],[origin[0],13],[origin[0]+3,18]],colors.axis,1);
      label(ctx,'x',w-10,origin[1]+13,colors.muted,'right');label(ctx,'y',origin[0]+9,12);
    }
    const path=[];
    for(let i=0;i<=240;i++){const p=TAU*i/240;path.push(screen([params.rx*Math.cos(p),params.ry*Math.sin(p)]));}
    stroke(ctx,path,colors.path,2.2);
    if(display.showTrail&&time>0){
      const trail=[],duration=Math.min(time,1.5);
      for(let i=0;i<=100;i++)trail.push(screen(stateAt(time-duration+duration*i/100).r));
      stroke(ctx,trail,'#186e9f',4);
    }
    const particle=screen(s.r),labels=[],arrowMetrics=[];
    if(!display.showComponents&&s.phiDefined){
      const arcRadius=Math.min(27,Math.max(15,Math.max(params.rx,params.ry)*scale*.12));
      if(s.wrappedPhi>1e-5){
        ctx.beginPath();ctx.arc(origin[0],origin[1],arcRadius,0,-s.wrappedPhi,true);ctx.strokeStyle='#a99acb';ctx.lineWidth=1.4;ctx.stroke();
      }
      // Oznaka kota ostane ob izhodišču tudi ob prehodu čez polni obrat.
      labels.push({id:'phi',text:'φ',anchor:[origin[0]+arcRadius+12,origin[1]-13],color:colors.phi,font:'italic 14px Georgia, serif'});
    }
    for(const item of descriptors){
      let a=screen(item.from),b=screen(item.to);
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      // Če komponenta sovpada z vsoto, slednjo vzporedno odmaknemo za 7 px.
      // Dolžina in smer vsote ostaneta nespremenjeni; tanki črti kažeta pravi krajišči.
      if(item.dashed&&length>.25&&s.frenetDefined){
        const ratio=Math.min(mag(s.aParallel),mag(s.aNormal))/Math.max(s.acceleration,1e-15);
        const mix=Math.max(0,Math.min(1,1-ratio/.15)),amount=7*mix*mix*(3-2*mix);
        const direction=params.ry===0?[0,-1]:params.rx===0?[1,0]:[-(b[1]-a[1])/length,(b[0]-a[0])/length];
        const shift=mul(direction,amount);
        const shiftedA=add(a,shift),shiftedB=add(b,shift);
        stroke(ctx,[a,shiftedA],'#bdc7d3',1);stroke(ctx,[b,shiftedB],'#bdc7d3',1);
        a=shiftedA;b=shiftedB;
      }
      if(length>=.25){
        stroke(ctx,[a,b],item.color,item.dashed?1.9:2.6,item.dashed?[5,4]:[]);
        const ux=(b[0]-a[0])/length,uy=(b[1]-a[1])/length,head=Math.min(10,length*.28);
        ctx.fillStyle=item.color;ctx.beginPath();ctx.moveTo(b[0],b[1]);
        ctx.lineTo(b[0]-head*ux+.4*head*uy,b[1]-head*uy-.4*head*ux);
        ctx.lineTo(b[0]-head*ux-.4*head*uy,b[1]-head*uy+.4*head*ux);ctx.closePath();ctx.fill();
      }
      const physicalMagnitude=mag(item.vector);
      // Ime oznake se ob prehodu skozi ničlo ne spreminja.
      // Skupni pospešek je v obeh načinih označen z rdečim a.
      const text=item.dashed?'a':item.name;
      labels.push({id:item.id,text,anchor:display.showComponents?[(a[0]+b[0])/2,(a[1]+b[1])/2]:b,color:item.color,font:'600 14px system-ui, sans-serif'});
      arrowMetrics.push({name:item.name,from:a,to:b,lengthPx:length,physicalMagnitude,factor:item.factor,dashed:item.dashed});
    }
    ctx.beginPath();ctx.arc(particle[0],particle[1],5.6,0,TAU);ctx.fillStyle='#e53643';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.8;ctx.stroke();
    // Oznaka je trajno vezana na isti vektor. Ne izbiramo novega mesta
    // med diskretnimi kandidati pri vsaki sličici; odmike gladko prilagajamo.
    const preferred={phi:[0,0],position:[-18,-18],velocity:[18,-20],tangent:[0,-23],normal:[23,-4],acceleration:[0,24]};
    const order={phi:0,position:1,velocity:2,tangent:1,normal:2,acceleration:3};
    const bottom=h-(display.showComponents&&!s.frenetDefined?28:7);
    const clamp=(value,lo,hi)=>Math.min(hi,Math.max(lo,value));
    const targets=labels.map(item=>{
      ctx.font=item.font;
      const width=ctx.measureText(item.text).width+8,height=20;
      const offset=preferred[item.id];
      return {...item,w:width,h:height,cx:item.anchor[0]+offset[0],cy:item.anchor[1]+offset[1]};
    });
    const keepInside=item=>{
      item.cx=clamp(item.cx,7+item.w/2,w-7-item.w/2);
      item.cy=clamp(item.cy,7+item.h/2,bottom-item.h/2);
    };
    const context=`${revision}/${w}/${h}/${display.showComponents}/${display.showPosition}`;
    const snap=!labelFrame||labelFrame.context!==context||(!running&&time!==labelFrame.time);
    if(snap){labelLayout.clear();labelSides.clear();}
    const elapsed=!snap&&time!==labelFrame.time?Math.max(0,Math.min(.05,(timestamp-labelFrame.timestamp)/1000)):0;
    const blend=1-Math.exp(-elapsed/.14),maxStep=95*elapsed,labelMetrics=[];
    for(const item of targets){
      const desired=[item.cx-item.anchor[0],item.cy-item.anchor[1]],previous=labelLayout.get(item.id);
      let offset=desired;
      if(previous){
        const change=mul([desired[0]-previous[0],desired[1]-previous[1]],blend),length=mag(change);
        offset=add(previous,mul(change,length>maxStep&&length>0?maxStep/length:1));
      }
      item.cx=item.anchor[0]+offset[0];item.cy=item.anchor[1]+offset[1];keepInside(item);
    }
    // Ko se napisa približata, si zapomnimo stran odmika. Tako ne menjata
    // mest ob vsakem prehodu, tudi kadar bi bila druga stran malo bližja.
    function separation(key,first,second,padding){
      const dx=second.cx-first.cx,dy=second.cy-first.cy;
      const px=(first.w+second.w)/2+padding-Math.abs(dx),py=(first.h+second.h)/2+padding-Math.abs(dy);
      if(px<=0||py<=0){labelSides.delete(key);return null;}
      if(!labelSides.has(key)){
        const axis=px<py?'cx':'cy',delta=axis==='cx'?dx:dy;
        labelSides.set(key,{axis,sign:Math.sign(delta)||(order[second.id]>=order[first.id]?1:-1)});
      }
      return labelSides.get(key);
    }
    const obstacle={id:'particle',cx:particle[0],cy:particle[1],w:21,h:21};
    for(let pass=0;pass<8;pass++){
      for(const item of targets){
        const side=separation('particle/'+item.id,obstacle,item,3);
        if(side){
          const size=side.axis==='cx'?'w':'h';
          item[side.axis]=obstacle[side.axis]+side.sign*((item[size]+obstacle[size])/2+3);keepInside(item);
        }
      }
      for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
        const first=targets[i],second=targets[j],side=separation(first.id+'/'+second.id,first,second,5);
        if(!side)continue;
        const axis=side.axis,size=axis==='cx'?'w':'h',required=(first[size]+second[size])/2+5;
        let missing=required-side.sign*(second[axis]-first[axis]);
        first[axis]-=side.sign*missing/2;second[axis]+=side.sign*missing/2;keepInside(first);keepInside(second);
        missing=required-side.sign*(second[axis]-first[axis]);
        if(missing>0){second[axis]+=side.sign*missing;keepInside(second);}
        missing=required-side.sign*(second[axis]-first[axis]);
        if(missing>0){first[axis]-=side.sign*missing;keepInside(first);}
      }
    }
    for(const item of targets){
      const center=[item.cx,item.cy],offset=[center[0]-item.anchor[0],center[1]-item.anchor[1]];
      labelLayout.set(item.id,offset);
      const distance=mag(offset),opacity=clamp((distance-27)/18,0,.65);
      if(opacity>0){
        const inset=Math.min(distance,item.w/2+5),end=add(center,mul(offset,-inset/Math.max(distance,1)));
        stroke(ctx,[item.anchor,end],`rgba(115,133,154,${opacity})`,.8);
      }
      // Brez polnila ali obrobe: črte grafa ostanejo vidne tudi pod napisom.
      label(ctx,item.text,center[0],center[1],item.color,'center',item.font);
      labelMetrics.push({id:item.id,text:item.text,color:item.color,x:center[0]-item.w/2,y:center[1]-item.h/2,w:item.w,h:item.h,anchor:item.anchor,offset});
    }
    labelFrame={context,time,timestamp};
    if(display.showComponents&&!s.frenetDefined)label(ctx,tr('atRest'),w/2,h-10,colors.muted,'center','10px system-ui, sans-serif');
    lastView={width:w,height:h,pixelsPerMetre:scale,velocityPixelsPerUnit:scale*VECTOR_SCALES.v,accelerationPixelsPerUnit:scale*VECTOR_SCALES.a,arrows:arrowMetrics,labels:labelMetrics};
  }

  function gridTime(ctx,rect,data,withLabels=true){
    for(const t of ticks(data.start,data.end,4)){
      const x=rect.x+(t-data.start)/data.span*rect.w;
      stroke(ctx,[[x,rect.y],[x,rect.y+rect.h]],colors.grid,1);
      if(withLabels)label(ctx,tickText(t),x,rect.y+rect.h+15,colors.muted,'center','10px system-ui, sans-serif');
    }
  }
  function plotSeries(ctx,rect,data,getter,yMin,yMax,color,currentValue,options={}){
    const xy=(t,value)=>[rect.x+(t-data.start)/data.span*rect.w,rect.y+rect.h-(value-yMin)/(yMax-yMin)*rect.h];
    const now={...(options.currentState||stateAt(time)),t:time};
    const past=data.points.filter(p=>p.t<time).concat(now),future=[now,...data.points.filter(p=>p.t>time)];
    function path(samples){
      const out=[];let previous=null;
      for(const point of samples){
        const value=getter(point);
        if(!Number.isFinite(value)){out.push(null);previous=null;continue;}
        if(options.breakPhiJumps&&previous&&(!previous.phiDefined||!point.phiDefined||Math.abs(point.phi-previous.phi)>Math.PI/2))out.push(null);
        out.push(xy(point.t,value));previous=point;
      }
      return out;
    }
    ctx.save();ctx.beginPath();ctx.rect(rect.x-2,rect.y-2,rect.w+4,rect.h+4);ctx.clip();
    ctx.globalAlpha=.48;stroke(ctx,path(future),color,1.7,[4,4]);ctx.globalAlpha=1;stroke(ctx,path(past),color,2);
    const x=rect.x+(time-data.start)/data.span*rect.w;
    stroke(ctx,[[x,rect.y],[x,rect.y+rect.h]],'#a6b3c4',1,[3,4]);
    if(Number.isFinite(currentValue)){
      const position=xy(time,currentValue);ctx.beginPath();ctx.arc(position[0],position[1],3.8,0,TAU);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.3;ctx.stroke();
    }
    ctx.restore();
  }

  function magnitudeCeiling(upper){
    if(upper<=1e-12)return 1;
    const step=niceStep(upper*1.1,3);
    return Math.ceil((upper*1.1)/step)*step;
  }
  function drawMagnitudes(s,data){
    const {ctx,w,h}=prepare($('magnitudesCanvas'));
    const top=18,bottom=29,gap=25,height=(h-top-bottom-2*gap)/3;
    const configs=[{key:'radius',name:'|r|',unit:'m',color:colors.r,upper:data.upperR},{key:'speed',name:'|v|',unit:'m/s',color:colors.v,upper:data.upperV},{key:'acceleration',name:'|a|',unit:'m/s²',color:colors.a,upper:data.upperA}];
    configs.forEach((c,index)=>{
      const rect={x:47,y:top+index*(height+gap),w:w-66,h:height};
      const yMax=magnitudeCeiling(c.upper);
      gridTime(ctx,rect,data,index===2);
      for(const value of ticks(0,yMax,2)){
        const y=rect.y+rect.h-value/yMax*rect.h;stroke(ctx,[[rect.x,y],[rect.x+rect.w,y]],colors.grid,1);
        label(ctx,tickText(value),rect.x-7,y,colors.muted,'right','10px system-ui, sans-serif');
      }
      stroke(ctx,[[rect.x,rect.y],[rect.x,rect.y+rect.h],[rect.x+rect.w,rect.y+rect.h]],colors.axis,1);
      label(ctx,`${c.name} (${c.unit})`,rect.x+5,rect.y-8,c.color,'left','11px system-ui, sans-serif');
      plotSeries(ctx,rect,data,p=>p[c.key],0,yMax,c.color,s[c.key]);
    });
    label(ctx,'t (s)',w-12,h-6,colors.muted,'right','10px system-ui, sans-serif');
  }
  function drawAngle(s,data){
    const {ctx,w,h}=prepare($('angleCanvas'));
    const factor=angleUnit==='deg'?180/Math.PI:1,unit=angleUnit==='deg'?'°':'rad';
    const top=18,bottom=29,gap=25,height=(h-top-bottom-2*gap)/3;
    const configs=[
      {key:'phi',name:'φ',unit,color:colors.phi,minimum:angleUnit==='deg'?90:Math.PI/2},
      {key:'phiDot',name:'dφ/dt',unit:unit+'/s',color:'#187e89',minimum:angleUnit==='deg'?1:.1},
      {key:'phiDDot',name:'d²φ/dt²',unit:unit+'/s²',color:'#9b568a',minimum:angleUnit==='deg'?1:.1}
    ];
    configs.forEach((c,index)=>{
      const getter=p=>Number.isFinite(p[c.key])?p[c.key]*factor:null;
      const values=data.points.map(getter).filter(Number.isFinite);
      let dataLo=values.length?Math.min(...values):0,dataHi=values.length?Math.max(...values):c.minimum;
      const center=(dataLo+dataHi)/2;
      const range=Math.max(dataHi-dataLo,Math.abs(center)*.25,c.minimum);
      const step=niceStep(range*1.15,3);
      let yMin=Math.floor((center-range*.57)/step)*step,yMax=Math.ceil((center+range*.57)/step)*step;
      if(dataLo>=0&&yMin<0)yMin=0;
      if(dataHi<=0&&yMax>0)yMax=0;
      if(yMax<=yMin){yMin=-c.minimum;yMax=c.minimum;}
      const tickValues=ticks(yMin,yMax,2);
      ctx.font='10px system-ui, sans-serif';
      const widest=Math.max(...tickValues.map(v=>ctx.measureText(tickText(v)).width));
      const left=Math.max(47,widest+13),rect={x:left,y:top+index*(height+gap),w:w-left-19,h:height};
      gridTime(ctx,rect,data,index===2);
      for(const value of tickValues){
        const y=rect.y+rect.h-(value-yMin)/(yMax-yMin)*rect.h;
        stroke(ctx,[[rect.x,y],[rect.x+rect.w,y]],colors.grid,1);label(ctx,tickText(value),rect.x-7,y,colors.muted,'right','10px system-ui, sans-serif');
      }
      stroke(ctx,[[rect.x,rect.y],[rect.x,rect.y+rect.h],[rect.x+rect.w,rect.y+rect.h]],colors.axis,1);
      label(ctx,c.name+' ('+c.unit+')',rect.x+5,rect.y-8,c.color,'left','11px system-ui, sans-serif');
      plotSeries(ctx,rect,data,getter,yMin,yMax,c.color,getter(s),{currentState:s,breakPhiJumps:s.linear});
      if(!values.length)label(ctx,tr('undefinedShort'),rect.x+rect.w/2,rect.y+rect.h/2,colors.muted,'center','11px system-ui, sans-serif');
    });
    label(ctx,'t (s)',w-12,h-6,colors.muted,'right','10px system-ui, sans-serif');
  }

  function writeValue(id,value,unit,digits=2){
    const output=$(id);output.replaceChildren(document.createTextNode(compact(value,digits)));
    if(unit){const small=document.createElement('small');small.textContent=unit;output.append(small);}
  }
  function updateReadouts(s,data){
    writeValue('valueX',s.r[0],'m');writeValue('valueY',s.r[1],'m');
    writeValue('valueR',s.radius,'m');writeValue('valueV',s.speed,'m/s');writeValue('valueA',s.acceleration,'m/s²');
    for(const [id,value] of [['valueTangential',s.tangential],['valueNormal',s.normal]]){
      if(s.frenetDefined){writeValue(id,value,'m/s²');$(id).title=id==='valueTangential'?'a · v / |v|':'|a − a∥|';}
      else {$(id).textContent=tr('undefinedShort');$(id).title=tr('undefined');}
    }
    const factor=angleUnit==='deg'?180/Math.PI:1,unit=angleUnit==='deg'?'°':'rad';
    for(const [id,key,suffix] of [['valuePhi','phi',''],['valuePhiDot','phiDot','/s'],['valuePhiDDot','phiDDot','/s²']]){
      if(s.phiDefined)writeValue(id,s[key]*factor,unit+suffix,angleUnit==='deg'?1:2);
      else {$(id).textContent=tr('undefinedShort');$(id).title=tr('atOrigin');}
    }
    if(document.activeElement!==$('time'))$('time').value=time.toFixed(2);
  }
  function render(timestamp=performance.now()){
    const s=stateAt(time),data=getChartData();
    drawPath(s,data,timestamp);drawMagnitudes(s,data);drawAngle(s,data);
    if(!running||timestamp-lastReadout>75){updateReadouts(s,data);lastReadout=timestamp;}
  }
  function frame(timestamp){
    raf=null;if(!running)return;
    if(lastFrame!==null)time+=Math.min((timestamp-lastFrame)/1000,.1)*Number($('playbackSpeed').value);
    lastFrame=timestamp;render(timestamp);raf=requestAnimationFrame(frame);
  }
  const resizeObserver=new ResizeObserver(()=>{resetCamera();render();});canvases.forEach(canvas=>resizeObserver.observe(canvas));
  window.addEventListener('beforeprint',()=>render());
  syncInputs();updateLabels();render();
})();

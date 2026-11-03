const pageData = {
  tabletop: {
    index: '01 / 06', eyebrow: 'ORIGINAL TABLETOP DESIGN', title: '《羽化》 × 《栖境》', subtitle: '原创双人规则推理桌游',
    description: '两款围绕遗传规则、隐藏信息与对手推理展开的双人桌游。这里以玩法设计与迭代复盘为主内容，规则书、PNP 与通用组件作为补充资料。',
    cover: 'assets/previews/yq.webp', coverAlt: '羽化与栖境玩法设计与迭代复盘封面',
    meta: ['规则书', 'PNP 可打印原型', '设计复盘'],
    mainAction: ['在线阅读设计复盘','assets/docs/yuhua-qijing-review.pdf'],
    download: ['下载复盘 PDF','assets/docs/yuhua-qijing-review.pdf'],
    resources: [
      ['设计复盘 DOCX','可编辑文档','assets/docs/yuhua-qijing-review.docx'],
      ['《羽化》规则书','双人培育 / 规划 / 推理','assets/docs/yuhua-rulebook.pdf'],
      ['《栖境》规则书','双人生态 / 实验 / 推理','assets/docs/qijing-rulebook.pdf'],
      ['《羽化》PNP','打印版组件','assets/docs/yuhua-pnp.pdf'],
      ['《栖境》PNP','打印版组件','assets/docs/qijing-pnp.pdf'],
      ['通用组件','两款游戏共用','assets/docs/shared-pnp-components.pdf'],
      ['PNP 打印说明','打印与组件分配说明','assets/docs/pnp-print-guide.pdf']
    ]
  },
  analysis: {
    index: '02 / 06', eyebrow: 'GAME SYSTEM ANALYSIS', title: '《塔塔冒险队》', subtitle: '游戏拆解报告',
    description: '基于国际服 Android 长期实机体验完成的系统拆解。报告从核心经济、账户成长、塔塔养成、多模式战斗、限时活动、收藏社交与商业化展开，重点呈现系统结构和系统之间的连接关系。',
    cover: 'assets/previews/tata.webp', coverAlt: '塔塔冒险队系统拆解报告封面',
    mainAction: ['在线阅读拆解报告','assets/docs/tata-system-report.pdf'],
    download: ['下载完整 PDF','assets/docs/tata-system-report.pdf'],
    resources: [['分析范围','经济 / 成长 / 战斗 / 活动',''],['核心结构','七个功能层与系统框架',''],['体验基础','国际服 Android 长期实机','']]
  },
  demo: {
    index: '03 / 06', eyebrow: 'PLAYABLE STRATEGY GAME DEMO', title: '《画中灵》', subtitle: '独立游戏 Demo',
    description: '从 0 到 1 完成的数字策略桌游 Demo，围绕资源取舍、空间构筑与计划兑现建立完整双人对局流程。页面提供实际演示视频与完整策划作品集，便于快速了解玩法和设计过程。',
    cover: 'assets/previews/hzl.webp', coverAlt: '画中灵游戏策划作品集封面',
    meta: ['卡牌策略', '可运行 Demo'],
    mainAction: ['在线阅读策划作品集','assets/docs/huazhongling-design-portfolio.pdf'],
    download: ['下载策划作品集 PDF','assets/docs/huazhongling-design-portfolio.pdf'],
    resources: [['策划作品集','14 页 PDF','assets/docs/huazhongling-design-portfolio.pdf']]
  },
  'planner-cv': {
    index: '05 / 06', eyebrow: 'GAME DESIGN RESUME', title: '策划简历', subtitle: 'GAME DESIGN / SYSTEM & GAMEPLAY',
    description: '游戏策划方向简历。以项目经历、系统拆解、原创桌游与可运行 Demo 为核心，展示从玩法理解、规则设计到项目落地的完整实践。',
    cover: 'assets/previews/planner.webp', coverAlt: '游戏策划简历第一页',
    mainAction: ['在线阅读简历','assets/docs/planner-resume.pdf'],
    download: ['下载 PDF','assets/docs/planner-resume.pdf'],
    resources: [['Word 版本','可编辑简历','assets/docs/planner-resume.docx']]
  },
  'ui-cv': {
    index: '06 / 06', eyebrow: 'GAME UI RESUME', title: 'UI 简历', subtitle: 'GAME UI / VISUAL & INTERACTION',
    description: '游戏 UI 设计方向简历。重点呈现界面视觉、信息层级、卡牌与图标组件、基础交互流程，以及《画中灵》和《售货机》项目中的 UI 资产产出。',
    cover: 'assets/previews/uicv.webp', coverAlt: '游戏 UI 设计师简历第一页',
    mainAction: ['在线阅读简历','assets/docs/ui-resume.pdf'],
    download: ['下载 PDF','assets/docs/ui-resume.pdf'],
    resources: [['Word 版本','可编辑简历','assets/docs/ui-resume.docx']]
  }
};

const homeScreen = document.getElementById('home-screen');
const pageScreen = document.getElementById('page-screen');
const pageContent = document.getElementById('page-content');
const liquidWipe = document.getElementById('liquid-wipe');
const readerOverlay = document.getElementById('reader-overlay');
const readerFrame = document.getElementById('reader-frame');
const readerTitle = document.getElementById('reader-title');
const readerDownload = document.getElementById('reader-download');
let activePage = null;
let disposeUi = null;

function routeFromUrl(){
  const page = new URLSearchParams(location.search).get('page');
  return page || null;
}
function setRoute(slug, push=true){
  const url = new URL(location.href);
  if(slug) url.searchParams.set('page',slug); else url.searchParams.delete('page');
  if(push) history.pushState({page:slug},'',url);
  renderRoute(slug);
}
let transitionBusy = false;
function transitionTo(slug, event){
  if(transitionBusy) return;
  transitionBusy = true;

  // Snapshot the event synchronously: click coordinates must belong to this
  // interaction, not a previously focused button or a stale pointer position.
  const source = event?.currentTarget || document.activeElement;
  const rect = source?.getBoundingClientRect?.();
  const hasPointerPoint = event && event.isTrusted && event.detail !== 0 &&
    Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
  const x = Math.max(0,Math.min(window.innerWidth,hasPointerPoint ? event.clientX : (rect ? rect.left + rect.width/2 : window.innerWidth/2)));
  const y = Math.max(0,Math.min(window.innerHeight,hasPointerPoint ? event.clientY : (rect ? rect.top + rect.height/2 : window.innerHeight/2)));
  const farX = Math.max(x,window.innerWidth-x);
  const farY = Math.max(y,window.innerHeight-y);
  const radius = Math.ceil(Math.hypot(farX,farY)+36);

  // Reset without animating the old clip-path back to zero. Then start a fresh
  // expansion using the current click point. This prevents origin carry-over.
  liquidWipe.style.transition = 'none';
  liquidWipe.classList.remove('is-active');
  liquidWipe.style.setProperty('--wipe-x',`${x}px`);
  liquidWipe.style.setProperty('--wipe-y',`${y}px`);
  liquidWipe.style.setProperty('--wipe-radius','0px');
  void liquidWipe.offsetWidth;
  liquidWipe.style.removeProperty('transition');

  requestAnimationFrame(()=>{
    liquidWipe.style.setProperty('--wipe-radius',`${radius}px`);
    liquidWipe.classList.add('is-active');
  });
  window.setTimeout(()=>{
    setRoute(slug,true);
    requestAnimationFrame(()=>{
      liquidWipe.classList.remove('is-active');
      window.setTimeout(()=>{
        liquidWipe.style.removeProperty('--wipe-x');
        liquidWipe.style.removeProperty('--wipe-y');
        liquidWipe.style.removeProperty('--wipe-radius');
        transitionBusy = false;
      },820);
    });
  },820);
}
function renderRoute(slug){
  if(disposeUi){disposeUi();disposeUi=null;}

  if(activePage==='demo' && slug!=='demo') document.getElementById('demo-video')?.pause();
  activePage = slug;
  pageScreen.classList.toggle("standard-detail", Boolean(slug && slug!=="ui"));
  window.pearlTimeline.setHome(!slug);
  if(!slug){
    pageScreen.hidden = true;
    homeScreen.hidden = false;
    document.title='GAO ZHUOBIN — Game Design / Game UI';
    return;
  }
  homeScreen.hidden = true;
  pageScreen.hidden = false;
  if(slug==='ui'){
    document.getElementById('page-section-index').textContent='04 / 06';
    pageContent.className='page-content ui-page is-entering';
    pageContent.innerHTML=uiPageMarkup();
    document.title='UI 作品 — GAO ZHUOBIN';
    initUiPage();
    return;
  }
  const data=pageData[slug];
  if(!data){renderRoute(null);return;}
  document.getElementById('page-section-index').textContent=data.index;
  pageContent.className='page-content is-entering';
  const headingMarkup = `
    <header class="page-heading">
      <p class="page-eyebrow">${data.eyebrow}</p>
      <h1 class="page-title">${data.title}</h1>
      <p class="page-subtitle">${data.subtitle}</p>
    </header>
  `;
  const demoMarkup = slug==='demo' ? `
    <div class="demo-feature-grid">
      <div class="demo-preview-shell">
        <button class="demo-video-trigger" id="demo-video-trigger" type="button" aria-label="播放《画中灵》实际 Demo 演示视频">
          <img src="assets/previews/huazhongling-cover-original.webp" alt="《画中灵》原始封面：嘉禾灵韵" loading="eager">
          <span class="demo-preview-shade" aria-hidden="true"></span>
          <span class="demo-play-control" aria-hidden="true"><i></i></span>
          <span class="demo-preview-label"><strong>观看 Demo</strong><small>GAMEPLAY SHOWCASE · 01:56</small></span>
        </button>
        <div class="demo-video-player" id="demo-video-player" hidden>
          <video id="demo-video" controls playsinline preload="metadata" poster="assets/previews/huazhongling-cover-original.webp">
            <source src="assets/media/demo-showcase.mp4" type="video/mp4">
            当前浏览器不支持视频播放。
          </video>
        </div>
        <div class="demo-preview-caption"><span>《画中灵》实际 Demo 画面</span><span>PLAYABLE STRATEGY GAME</span></div>
      </div>
      <div class="demo-copy">
        <p class="demo-copy-lead">${data.description}</p>
        ${data.meta?.length ? `<div class="page-meta" aria-label="项目标签">${data.meta.map(x=>`<span>${x}</span>`).join('')}</div>` : ''}
        <div class="action-row">
          <button class="action-button primary" type="button" data-open-pdf="${data.mainAction[1]}" data-reader-title="${data.mainAction[0]}">${data.mainAction[0]} <span>↗</span></button>
          <a class="action-button" href="${data.download[1]}" download target="_blank" rel="noopener">${data.download[0]} <span>↓</span></a>
        </div>
        <p class="demo-copy-note"><span></span>完整规则、交互流程与设计说明收录于策划作品集</p>
      </div>
    </div>
  ` : `
    <div class="page-hero-grid">
      <figure class="page-cover"><img src="${data.cover}" alt="${data.coverAlt}" loading="eager"></figure>
      <div class="page-copy">
        <p>${data.description}</p>
        ${data.meta?.length ? `<div class="page-meta" aria-label="项目标签">${data.meta.map(x=>`<span>${x}</span>`).join('')}</div>` : ''}
        <div class="action-row">
          <button class="action-button primary" type="button" data-open-pdf="${data.mainAction[1]}" data-reader-title="${data.mainAction[0]}">${data.mainAction[0]} <span>↗</span></button>
          <a class="action-button" href="${data.download[1]}" download target="_blank" rel="noopener">${data.download[0]} <span>↓</span></a>
        </div>
      </div>
    </div>
  `;
  pageContent.innerHTML=`${headingMarkup}${demoMarkup}
    ${slug!=='demo' && data.resources?.length?`<section class="resource-section"><div class="resource-heading"><h3>${slug==='tabletop'?'相关规则与打印文件':(['planner-cv','ui-cv'].includes(slug)?'简历文件':'项目资料')}</h3><span>SUPPORTING MATERIALS</span></div><div class="resource-grid">${data.resources.map(r=>`<article class="resource-card"><strong>${r[0]}</strong><small>${r[1]}</small>${r[2]?`<div class="resource-actions">${r[2].endsWith('.pdf')?`<button type="button" data-open-pdf="${r[2]}" data-reader-title="${r[0]}">在线阅读 ↗</button>`:''}<a href="${r[2]}" download target="_blank" rel="noopener">下载 ↓</a></div>`:''}</article>`).join('')}</div></section>`:''}
  `;
  document.title=`${data.title} — GAO ZHUOBIN`;
  pageContent.querySelectorAll('[data-open-pdf]').forEach(btn=>btn.addEventListener('click',()=>openReader(btn.dataset.readerTitle,btn.dataset.openPdf)));
  const demoTrigger=document.getElementById('demo-video-trigger');
  if(demoTrigger){
    demoTrigger.addEventListener('click',()=>{
      const player=document.getElementById('demo-video-player');
      const video=document.getElementById('demo-video');
      demoTrigger.hidden=true;
      player.hidden=false;
      video.play().catch(()=>{ video.controls=true; });
    });
  }
}
function uiPageMarkup(){
  return `
    <section class="ui-orb-zone physics-zone" id="ui-orb-zone" aria-label="UI 作品集与素材展示区">
      <div class="orb-stack" id="orb-stack">
        <button class="liquid-orb" id="liquid-orb" type="button" aria-label="点击或回车阅读作品集；按住来回摇晃，每次撒出一些素材；空格可撒出一批"></button>
        <div class="orb-hint"><strong>UI Works</strong><span>点击球体，查看完整 UI 作品集</span><small id="orb-shake-hint">按住球体，来回摇晃，撒出素材</small></div>
      </div>
      <div class="piece-layer" id="piece-layer"></div>
    </section>
    <div class="playground-controls">
      <p class="physics-hint" id="physics-hint" hidden>拖动控制 <i>·</i> 双击查看</p>
      <button class="asset-return" id="asset-return" type="button" hidden>收回素材</button>
      <p id="playground-status" class="sr-only" role="status"></p>
    </div>
    <dialog class="piece-inspector" id="piece-inspector"><button type="button" id="piece-inspector-close" aria-label="关闭素材预览">×</button><figure><div class="inspector-material"><img alt=""></div><figcaption></figcaption></figure></dialog>
  `;
}
function openReader(title,src){
  readerTitle.textContent=title||'在线阅读';
  readerFrame.src='reader.html?file='+encodeURIComponent(src.split('/').pop());
  readerDownload.href=src;
  readerDownload.setAttribute('download','');
  readerDownload.target='_blank';
  readerDownload.rel='noopener';
  readerOverlay.hidden=false;
  document.body.style.overflow='hidden';
}
function closeReader(){
  readerOverlay.hidden=true;
  readerFrame.src='about:blank';
  document.body.style.overflow='';
}
function initUiPage(){
  disposeUi=window.UIPlayground.mount({openPortfolio:()=>openReader('游戏 UI 与美术资产作品集','assets/docs/ui-portfolio-preview.pdf')});
}

document.querySelectorAll('.hotspot').forEach(button=>button.addEventListener('click',e=>transitionTo(button.dataset.page,e)));
document.getElementById('back-home').addEventListener('click',e=>transitionTo(null,e));
document.getElementById('reader-close').addEventListener('click',closeReader);
readerOverlay.addEventListener('click',e=>{if(e.target===readerOverlay)closeReader();});
window.addEventListener('popstate',()=>{closeReader();renderRoute(routeFromUrl());});
renderRoute(routeFromUrl());

// Keep the portfolio open when a browser chooses to preview a download.
document.addEventListener('click', async event => {
  const link=event.target.closest('a[download]');
  if(!link || link.dataset.nativeSave || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  link.target='_blank';link.rel='noopener';
  if(location.protocol==='file:') return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin) return;
  event.preventDefault();
  if(link.dataset.downloading) return;
  link.dataset.downloading='true';
  try {
    const response=await fetch(url.href);
    if(!response.ok) throw new Error('Download failed');
    const blob=await response.blob();
    const objectUrl=URL.createObjectURL(blob);
    const save=document.createElement('a');
    save.dataset.nativeSave='true';save.href=objectUrl;save.download=link.getAttribute('download') || decodeURIComponent(url.pathname.split('/').pop());
    document.body.append(save);save.click();save.remove();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
  } catch(error) {
    const fallback=document.createElement('a');
    fallback.href=url.href;fallback.target='_blank';fallback.rel='noopener';
    document.body.append(fallback);fallback.click();fallback.remove();
  } finally { delete link.dataset.downloading; }
});

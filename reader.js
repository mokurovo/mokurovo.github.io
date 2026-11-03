const file=new URLSearchParams(location.search).get('file');
const status=document.getElementById('status');
Promise.resolve(window.READER_MANIFEST).then(manifest=>{
 const pages=manifest[file];if(!pages?.length)throw Error();
 for(const [i,page] of pages.entries()){
  const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
  img.src=page.src;img.width=page.width;img.height=page.height;img.alt=`文档第 ${i+1} 页`;img.loading=i<2?'eager':'lazy';
  img.addEventListener('error',()=>{caption.textContent=`第 ${i+1} 页加载失败，请刷新或下载原文件`});
  caption.textContent=`${i+1} / ${pages.length}`;figure.append(img,caption);document.getElementById('pages').append(figure);
 }
 status.hidden=true;const zoom=document.getElementById('zoom');zoom.hidden=false;zoom.onclick=()=>{const enlarged=document.body.classList.toggle('zoom');zoom.textContent=enlarged?'适合宽度':'放大阅读';document.querySelector('main').style.minWidth=enlarged?'1400px':''};
}).catch(()=>{status.textContent='文档加载失败，请关闭后重试，或使用顶部「下载文件」保存原文档。'});

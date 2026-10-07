const docs = {
  'huazhongling': { title:'《画中灵》完整作品集', pages:14, pdf:'assets/huazhongling_portfolio.pdf', folder:'reader-pages/huazhongling' },
  'tata': { title:'《塔塔冒险队》完整系统拆解报告', pages:35, pdf:'assets/tata_system_report.pdf', folder:'reader-pages/tata' },
  'yq-review': { title:'《羽化》×《栖境》玩法设计与迭代复盘', pages:13, pdf:'assets/yuhua_qijing_review.pdf', folder:'reader-pages/yq-review' },
  'yuhua-rules': { title:'《羽化》完整规则书', pages:11, pdf:'assets/yuhua_rules.pdf', folder:'reader-pages/yuhua-rules' },
  'yuhua-pnp': { title:'《羽化》PNP', pages:15, pdf:'assets/yuhua_pnp.pdf', folder:'reader-pages/yuhua-pnp' },
  'qijing-rules': { title:'《栖境》完整规则书', pages:12, pdf:'assets/qijing_rules.pdf', folder:'reader-pages/qijing-rules' },
  'qijing-pnp': { title:'《栖境》PNP', pages:14, pdf:'assets/qijing_pnp.pdf', folder:'reader-pages/qijing-pnp' },
  'shared-components': { title:'《羽化》《栖境》通用组件', pages:1, pdf:'assets/shared_components.pdf', folder:'reader-pages/shared-components' },
  'pnp-guide': { title:'PNP组件使用说明', pages:1, pdf:'assets/pnp_components_guide.pdf', folder:'reader-pages/pnp-guide' }
};

const key = new URLSearchParams(location.search).get('doc');
const doc = docs[key];
const title = document.getElementById('reader-title');
const meta = document.getElementById('reader-meta');
const download = document.getElementById('download-link');
const pages = document.getElementById('reader-pages');
const error = document.getElementById('reader-error');

if (!doc) {
  error.hidden = false;
  document.querySelector('.reader-head').hidden = true;
} else {
  document.title = `${doc.title}｜在线阅读`;
  title.textContent = doc.title;
  meta.textContent = `${doc.pages}页 · 网页内直接阅读`;
  download.href = doc.pdf;
  for (let i = 1; i <= doc.pages; i++) {
    const n = String(i).padStart(2,'0');
    const figure = document.createElement('figure');
    figure.className = 'reader-page';
    const img = document.createElement('img');
    img.src = `${doc.folder}/page-${n}.webp`;
    img.alt = `${doc.title} 第${i}页`;
    img.loading = i <= 2 ? 'eager' : 'lazy';
    img.decoding = 'async';
    const caption = document.createElement('figcaption');
    caption.textContent = `${i} / ${doc.pages}`;
    figure.append(img, caption);
    pages.appendChild(figure);
  }
}

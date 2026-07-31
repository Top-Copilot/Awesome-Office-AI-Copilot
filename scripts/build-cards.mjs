// Build static directory cards from data/products.json into docs/index.html.
// Usage: node scripts/build-cards.mjs
// Cards are plain HTML (EN primary, ZH in .zh-only spans) so product links
// are crawlable without JavaScript. Re-run after editing data/products.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data', 'products.json');
const indexPath = join(root, 'docs', 'index.html');

const tagZh = {
  word: 'Word', excel: 'Excel', powerpoint: 'PowerPoint', outlook: 'Outlook',
  enterprise: '企业', docs: '文档', sheets: '表格', slides: '幻灯片',
  drive: '云盘', collaboration: '协作', writer: '写作', spreadsheet: '电子表格',
  presentation: '演示', presentations: '演示文稿', pdf: 'PDF', 'open-source': '开源',
  documents: '文档', spreadsheets: '电子表格', smb: '中小企业', analysis: '分析',
  'model-agent': '模型代理', plugins: '插件', design: '设计', brand: '品牌',
  'google-slides': 'Google 幻灯片', business: '商务', knowledge: '知识库',
  search: '搜索', research: '研究', tables: '表格', writing: '写作',
  editing: '编辑', communication: '沟通', data: '数据', reports: '报告',
  databases: '数据库', automation: '自动化', agents: '代理', meetings: '会议',
  summaries: '摘要', transcription: '转录', sales: '销售', crm: 'CRM',
  email: '邮件', analytics: '分析', notes: '笔记', desktop: '桌面',
  translation: '翻译', localization: '本地化'
};

const platformsZh = {
  'Microsoft 365': 'Microsoft 365', 'Google Workspace': 'Google Workspace',
  'WPS Office': 'WPS Office', 'ONLYOFFICE': 'ONLYOFFICE',
  'Zoho Workplace': 'Zoho Workplace', 'Microsoft Excel': 'Microsoft Excel',
  'Microsoft PowerPoint': 'Microsoft PowerPoint', 'Claude': 'Claude',
  'Web': '网页', 'Canva': 'Canva',
  'Google Slides, PowerPoint': 'Google 幻灯片、PowerPoint', 'Notion': 'Notion',
  'Acrobat': 'Acrobat', 'Coda': 'Coda',
  'Web, desktop, browser': '网页、桌面、浏览器', 'Rows': 'Rows',
  'Airtable': 'Airtable', 'Zoom': 'Zoom',
  'Web, meeting integrations': '网页、会议集成', 'Meeting integrations': '会议集成',
  'Video meetings, CRM': '视频会议、CRM',
  'Meetings, email, calendar': '会议、邮件、日历', 'Desktop': '桌面',
  'Microsoft Word, Excel, WPS Office': 'Word、Excel、WPS Office'
};

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const data = JSON.parse(readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, ''));
const categories = [];
for (const item of data) {
  const found = categories.find((c) => c.name === item.category);
  if (found) { found.items.push(item); }
  else { categories.push({ name: item.category, zh: item.categoryZh || item.category, items: [item] }); }
}

const cardLines = [];
for (const category of categories) {
  const groupId = 'cat-' + slug(category.name);
  const items = category.items.map((item) => {
    const featured = item.featured ? ' featured' : '';
    const searchText = [item.name, item.description, item.platforms, ...(item.tags || [])].join(' ').toLowerCase();
    const chips = [
      item.platforms ? `<span class="chip"><span class="en">${esc(item.platforms)}</span><span class="zh-only">${esc(platformsZh[item.platforms] || item.platforms)}</span></span>` : '',
      ...(item.tags || []).map((tag) => `<span class="chip"><span class="en">${esc(tag)}</span><span class="zh-only">${esc(tagZh[tag] || tag)}</span></span>`)
    ].join('');
    const badge = item.featured ? `<span class="badge"><span class="en">Featured</span><span class="zh-only">精选</span></span>` : '';
    return `      <article class="card${featured}" data-category="${esc(item.category)}" data-name="${esc(item.name.toLowerCase())}" data-search="${esc(searchText)}">
        <div class="card-top">
          <h4 class="card-title"><a href="${esc(item.url)}" rel="noopener"><span class="en">${esc(item.name)}</span><span class="zh-only">${esc(item.nameZh || item.name)}</span></a></h4>
          ${badge}
        </div>
        <p class="card-desc"><span class="en">${esc(item.description)}</span><span class="zh-only">${esc(item.descriptionZh || item.description)}</span></p>
        <div class="card-chips">${chips}</div>
        <a class="card-cta" href="${esc(item.url)}" rel="noopener"><span class="en">Official product page</span><span class="zh-only">官方产品页面</span> <span aria-hidden="true">↗</span></a>
      </article>`;
  });
  const itemsHtml = items.join('\n');
  cardLines.push(`    <section class="directory-group" id="${groupId}" data-category="${esc(category.name)}">
      <h3 class="group-title">
        <span class="en">${esc(category.name)}</span>
        <span class="zh-only">${esc(category.zh)}</span>
      </h3>
      <div class="cards">
${itemsHtml}
      </div>
    </section>`);
}

const fragment = cardLines.join('\n\n');
const schema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Office AI Copilots Directory",
  "description": "AI copilots and assistants for Word, Excel, PowerPoint, Docs, Sheets, Slides, PDF, email and meetings.",
  "numberOfItems": data.length,
  "itemListElement": data.map((item, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": item.name,
    "url": item.url
  }))
};
const schemaHtml = '<script type="application/ld+json">\n' + JSON.stringify(schema, null, 2) + '\n  </script>';

const replaceBlock = (html, beginMark, endMark, replacement) => {
  const startIdx = html.indexOf(beginMark);
  const endIdx = html.indexOf(endMark);
  if (startIdx < 0 || endIdx < 0) throw new Error('Markers not found: ' + beginMark);
  return html.slice(0, startIdx + beginMark.length) + '\n' + replacement + '\n    ' + html.slice(endIdx);
};

let indexHtml = readFileSync(indexPath, 'utf8');
indexHtml = replaceBlock(indexHtml, '<!-- CARDS:BEGIN -->', '<!-- CARDS:END -->', fragment);
indexHtml = replaceBlock(indexHtml, '<!-- SCHEMA:BEGIN -->', '<!-- SCHEMA:END -->', schemaHtml);
writeFileSync(indexPath, indexHtml, 'utf8');
console.log('Updated docs/index.html with ' + data.length + ' product cards (' + categories.length + ' groups) and ItemList schema.');
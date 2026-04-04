/**
 * HTML 구조 진단 스크립트
 *
 * 사이트 구조가 바뀌어서 크롤러가 데이터를 못 가져올 때 사용합니다.
 * 실제 HTML을 출력해서 선택자를 찾는 데 도움을 줍니다.
 *
 * 실행: node src/crawlers/debug.js <사이트명>
 *   예: node src/crawlers/debug.js wevity
 *       node src/crawlers/debug.js campuspick
 */
import 'dotenv/config';
import * as cheerio from 'cheerio';
import { createClient } from './utils.js';

const TARGETS = {
  wevity:     'https://www.wevity.com/?c=find&s=1&gbn=1&f=end_date&order=asc&pg=1',
  campuspick: 'https://campuspick.com/contest',
};

async function debug(site) {
  const url = TARGETS[site];
  if (!url) {
    console.error('알 수 없는 사이트:', site);
    console.log('사용 가능:', Object.keys(TARGETS).join(', '));
    process.exit(1);
  }

  console.log(`\n[${site}] 페이지 분석 중...\n  URL: ${url}\n`);

  const client = createClient(new URL(url).origin);
  const { data: html } = await client.get(url);
  const $ = cheerio.load(html);

  // 첫 번째 리스트 아이템 후보 출력
  const candidates = [
    'ul.list-body > li',
    'ul.list > li',
    '.content-list > li',
    '.contest-list .item',
    '.list-body > li',
    'article',
    '.card',
    '.item',
  ];

  console.log('=== 리스트 선택자 후보 ===');
  for (const sel of candidates) {
    const count = $(sel).length;
    if (count > 0) {
      console.log(`  "${sel}" → ${count}개 발견 ✔`);

      // 첫 번째 항목 내부 구조 출력
      const first = $(sel).first();
      console.log('  --- 첫 번째 항목 내부 태그 ---');
      first.find('*').each((_i, el) => {
        const tag  = el.tagName;
        const cls  = $(el).attr('class') ?? '';
        const text = $(el).clone().children().remove().end().text().trim().slice(0, 60);
        if (text) console.log(`    <${tag} class="${cls}"> ${text}`);
      });
      console.log();
    }
  }

  // a 태그 href 패턴 확인
  console.log('=== 링크 패턴 샘플 ===');
  $('a[href]').slice(0, 10).each((_i, el) => {
    console.log(' ', $(el).attr('href'));
  });
}

const site = process.argv[2];
if (!site) {
  console.error('사용법: node src/crawlers/debug.js <사이트명>');
  console.log('사용 가능:', Object.keys(TARGETS).join(', '));
  process.exit(1);
}

debug(site).catch(console.error);

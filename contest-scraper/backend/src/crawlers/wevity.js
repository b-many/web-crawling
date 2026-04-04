/**
 * 위비티 크롤러 (wevity.com)
 *
 * 대상 URL: https://www.wevity.com/?c=find&s=1&gbn=1&f=end_date&order=desc
 *   gbn=1 → 공모전 카테고리
 *
 * 페이지 구조:
 *   ul.list-body > li  각 공모전 행
 *   - .tit > a         공모전명 + href
 *   - .host            주최사
 *   - .day > span      마감일 (예: "2026.06.30")
 *   - .category        분야
 *
 * 위비티는 SSR이라 cheerio로 안정적으로 파싱 가능합니다.
 */
import * as cheerio from 'cheerio';
import { createClient, parseDeadline, sleep } from './utils.js';

const BASE_URL = 'https://www.wevity.com';

// 위비티 카테고리 코드 → DB category 매핑
// gbn 파라미터로 분야 필터 가능 (1=공모전, 5=IT개발, 3=디자인 ...)
const CATEGORY_MAP = {
  'IT':       '개발',
  '개발':     '개발',
  '소프트웨어': '개발',
  '앱':       '개발',
  '디자인':   '디자인',
  'UI':       '디자인',
  'UX':       '디자인',
  '기획':     '기획',
  '마케팅':   '기획',
  '아이디어': '기획',
  '데이터':   '데이터',
  '빅데이터': '데이터',
  'AI':       '데이터',
  '인공지능': '데이터',
  '보안':     '보안',
  '정보보호': '보안',
};

function mapCategory(raw = '') {
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(key)) return val;
  }
  return '기타';
}

function buildUrl(page) {
  const params = new URLSearchParams({
    c:     'find',
    s:     '1',
    gbn:   '1',
    f:     'end_date',
    order: 'asc',         // 마감일 빠른 순
    pg:    String(page),
  });
  return `${BASE_URL}/?${params}`;
}

function parsePage(html) {
  const $ = cheerio.load(html);
  const contests = [];

  $('ul.list-body > li, .list-body > li').each((_i, el) => {
    const $el = $(el);

    // 공모전명 + 링크
    const $a    = $el.find('.tit a, .title a, h6 a').first();
    const name  = $a.text().trim();
    const href  = $a.attr('href') ?? '';
    const url   = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    // 주최사
    const organizer = $el.find('.host, .organization, .comp').first().text()
                        .replace(/주최[:\s]*/g, '').trim();

    // 마감일 — "D-5  2026.06.30" 혹은 "2026.06.30" 형태
    const rawDate  = $el.find('.day, .date, .deadline').first().text().trim();
    // 날짜 부분만 추출 (D-숫자 제거)
    const cleaned  = rawDate.replace(/D[+-]\d+\s*/g, '').trim();
    const deadline = parseDeadline(cleaned);

    // 분야
    const rawCat  = $el.find('.category, .cate, .field, .badge').first().text().trim();
    const category = mapCategory(rawCat);

    // 간단 설명
    const description = $el.find('.desc, .summary, .sub').first().text().trim();

    if (name && url && deadline) {
      contests.push({ name, organizer, deadline, url, category, description });
    }
  });

  return contests;
}

function hasNextPage($, currentPage) {
  // 페이지네이션에서 현재 페이지 이후 번호가 있는지 확인
  const nextLink = $('a.next, .paging .next, .pagination .next').attr('href');
  if (nextLink) return true;

  let maxPage = 0;
  $('.paging a, .pagination a').each((_i, el) => {
    const n = parseInt($(el).text().trim(), 10);
    if (!isNaN(n) && n > maxPage) maxPage = n;
  });
  return maxPage > currentPage;
}

export async function crawlWevity({ maxPages = 10 } = {}) {
  console.log('[위비티] 크롤링 시작...');

  const client = createClient(BASE_URL, {
    Referer: BASE_URL,
  });

  const contests = [];
  let page = 1;

  while (page <= maxPages) {
    try {
      const { data: html } = await client.get(buildUrl(page));
      const $     = cheerio.load(html);
      const items = parsePage(html);

      if (items.length === 0) {
        console.log(`  [위비티] ${page}페이지 — 항목 없음, 종료`);
        break;
      }

      contests.push(...items);
      console.log(`  [위비티] ${page}페이지 완료 (+${items.length}, 누적 ${contests.length})`);

      if (!hasNextPage($, page)) break;
      page++;
      await sleep(1000);
    } catch (err) {
      console.error(`  [위비티] ${page}페이지 오류:`, err.message);
      break;
    }
  }

  console.log(`[위비티] 수집 완료 — ${contests.length}건`);
  return contests;
}

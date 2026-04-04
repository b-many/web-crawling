/**
 * 캠퍼스픽 크롤러 (campuspick.com)
 *
 * 대상 URL: https://campuspick.com/contest
 * 렌더링 방식: SSR (cheerio로 파싱 가능)
 *
 * 페이지 구조 (2024년 기준):
 *   ul.list > li.item  각 공모전 카드
 *   - a.title          공모전명 + href
 *   - span.host        주최사
 *   - span.date        마감일 텍스트 (예: "~2026.06.30")
 *   - span.category    분야
 */
import * as cheerio from 'cheerio';
import { createClient, parseDeadline, sleep } from './utils.js';

const BASE_URL  = 'https://campuspick.com';
const LIST_URL  = `${BASE_URL}/contest`;

const CATEGORY_MAP = {
  'IT':      '개발',
  '개발':    '개발',
  '디자인':  '디자인',
  '기획':    '기획',
  '마케팅':  '기획',
  '데이터':  '데이터',
  '보안':    '보안',
  'AI':      '데이터',
};

function mapCategory(raw = '') {
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(key)) return val;
  }
  return '기타';
}

async function fetchPage(client, page) {
  const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
  const { data } = await client.get(url);
  return data;
}

function parsePage(html) {
  const $ = cheerio.load(html);
  const contests = [];

  // 실제 선택자는 사이트 구조에 맞게 조정 필요
  $('ul.list li.item, .contest-list .item, .content-list > li').each((_i, el) => {
    const $el = $(el);

    // 공모전명 + 링크
    const $a    = $el.find('a').first();
    const name  = $a.find('.title, h3, h4, strong').first().text().trim()
                  || $a.attr('title')?.trim()
                  || $a.text().trim();
    const href  = $a.attr('href') ?? '';
    const url   = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    // 주최사
    const organizer = $el.find('.host, .organization, .company').first().text().trim();

    // 마감일 — "~2026.06.30" 또는 "2026년 6월 30일" 형태
    const rawDate  = $el.find('.date, .deadline, .period').first().text().trim();
    const deadline = parseDeadline(rawDate.replace(/^[~\-까지\s]+/, ''));

    // 분야
    const rawCat  = $el.find('.category, .tag, .field').first().text().trim();
    const category = mapCategory(rawCat);

    // 상세 설명 (있으면)
    const description = $el.find('.desc, .summary, .content').first().text().trim();

    if (name && url && deadline) {
      contests.push({ name, organizer, deadline, url, category, description });
    }
  });

  return contests;
}

/** 다음 페이지가 있는지 확인 */
function hasNextPage($, currentPage) {
  // 페이지네이션 링크에서 다음 페이지 존재 여부 확인
  const nextHref = $('a.next, .pagination a[rel="next"], .paging .next a').attr('href');
  if (nextHref) return true;

  // 숫자 페이지네이션에서 현재 페이지 이후 링크 확인
  const pages = [];
  $('.pagination a, .paging a').each((_i, el) => {
    const n = parseInt($(el).text().trim(), 10);
    if (!isNaN(n)) pages.push(n);
  });
  return pages.some((p) => p > currentPage);
}

export async function crawlCampuspick({ maxPages = 10 } = {}) {
  console.log('[캠퍼스픽] 크롤링 시작...');

  const client = createClient(BASE_URL, {
    Referer: BASE_URL,
  });

  const contests = [];
  let page = 1;

  while (page <= maxPages) {
    try {
      const html = await fetchPage(client, page);
      const $    = cheerio.load(html);
      const items = parsePage(html);

      if (items.length === 0) {
        console.log(`  [캠퍼스픽] ${page}페이지 — 항목 없음, 종료`);
        break;
      }

      contests.push(...items);
      console.log(`  [캠퍼스픽] ${page}페이지 완료 (+${items.length}, 누적 ${contests.length})`);

      if (!hasNextPage($, page)) break;
      page++;
      await sleep(1000);
    } catch (err) {
      console.error(`  [캠퍼스픽] ${page}페이지 오류:`, err.message);
      break;
    }
  }

  console.log(`[캠퍼스픽] 수집 완료 — ${contests.length}건`);
  return contests;
}

/**
 * 링커리어 크롤러 (linkareer.com)
 *
 * 링커리어는 GraphQL API를 사용합니다.
 * 공개 엔드포인트: https://linkareer.com/api/graphql
 *
 * 카테고리 매핑:
 *   CONTEST → 공모전
 *   type=CONTEST&category=IT  → IT/개발 공모전
 */
import { createClient, parseDeadline, saveContests, sleep } from './utils.js';

const BASE_URL   = 'https://linkareer.com';
const GQL_URL    = 'https://api.linkareer.com/graphql';
const PAGE_SIZE  = 20;

// 링커리어 분야 태그 → 우리 DB category 매핑
const CATEGORY_MAP = {
  'IT·개발':   '개발',
  'IT/개발':   '개발',
  '개발':       '개발',
  '디자인':     '디자인',
  '기획·아이디어': '기획',
  '기획':       '기획',
  '데이터':     '데이터',
  '정보보안':   '보안',
  '보안':       '보안',
};

function mapCategory(tags = []) {
  for (const tag of tags) {
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
      if (tag.includes(key)) return val;
    }
  }
  return '기타';
}

// GraphQL 쿼리 — 공모전 목록
const ACTIVITY_LIST_QUERY = `
  query ActivityList($page: Int!, $pageSize: Int!, $type: String) {
    activityList(page: $page, pageSize: $pageSize, type: $type, orderBy: DEADLINE_AT) {
      totalCount
      activities {
        id
        title
        organization
        deadlineAt
        tags { name }
        shortDescription
        url
      }
    }
  }
`;

async function fetchPage(client, page) {
  const { data } = await client.post(GQL_URL, {
    query: ACTIVITY_LIST_QUERY,
    variables: { page, pageSize: PAGE_SIZE, type: 'CONTEST' },
  });

  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data.activityList;
}

export async function crawlLinkareer({ maxPages = 5 } = {}) {
  console.log('[링커리어] 크롤링 시작...');

  const client = createClient(BASE_URL, {
    'Content-Type': 'application/json',
    Referer: `${BASE_URL}/list/contest`,
  });

  const contests = [];
  let page = 1;

  while (page <= maxPages) {
    try {
      const result = await fetchPage(client, page);
      const items  = result.activities ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        const deadline = item.deadlineAt
          ? item.deadlineAt.slice(0, 10)      // ISO 형식이면 앞 10자가 YYYY-MM-DD
          : parseDeadline(item.deadlineAt);

        if (!deadline) continue;              // 마감일 없으면 스킵

        contests.push({
          name:        item.title,
          organizer:   item.organization ?? '',
          deadline,
          url:         item.url?.startsWith('http')
                         ? item.url
                         : `${BASE_URL}${item.url ?? `/activity/${item.id}`}`,
          category:    mapCategory((item.tags ?? []).map((t) => t.name)),
          description: item.shortDescription ?? '',
        });
      }

      const total = result.totalCount ?? 0;
      console.log(`  [링커리어] ${page}페이지 완료 (누적 ${contests.length}/${total})`);

      if (contests.length >= total) break;
      page++;
      await sleep(800);
    } catch (err) {
      console.error(`  [링커리어] ${page}페이지 오류:`, err.message);
      break;
    }
  }

  console.log(`[링커리어] 수집 완료 — ${contests.length}건`);
  return contests;
}

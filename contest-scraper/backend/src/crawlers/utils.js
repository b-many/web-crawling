import axios from 'axios';
import db from '../db/database.js';

// ─── 날짜 파싱 ────────────────────────────────────────────────────────────────

/**
 * 다양한 형식의 날짜 문자열을 YYYY-MM-DD로 변환
 * 지원 형식: 2026.06.30 / 2026-06-30 / 2026년 6월 30일 / 26.06.30 / ~06/30
 */
export function parseDeadline(raw) {
  if (!raw) return null;
  const s = raw.trim();

  // 이미 YYYY-MM-DD 형식
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // YYYY.MM.DD 또는 YYYY/MM/DD
  let m = s.match(/(\d{4})[./](\d{1,2})[./](\d{1,2})/);
  if (m) return fmt(m[1], m[2], m[3]);

  // YYYY년 M월 D일
  m = s.match(/(\d{4})[년\s]+(\d{1,2})[월\s]+(\d{1,2})/);
  if (m) return fmt(m[1], m[2], m[3]);

  // YY.MM.DD (두 자리 연도)
  m = s.match(/^(\d{2})[./](\d{1,2})[./](\d{1,2})$/);
  if (m) return fmt(`20${m[1]}`, m[2], m[3]);

  // MM/DD (연도 없음 → 올해 기준)
  m = s.match(/^(\d{1,2})[./](\d{1,2})$/);
  if (m) {
    const year = new Date().getFullYear();
    return fmt(String(year), m[1], m[2]);
  }

  return null; // 파싱 실패
}

function fmt(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ─── DB 저장 (중복 URL → upsert) ─────────────────────────────────────────────

/**
 * 공모전 배열을 DB에 저장. URL이 이미 존재하면 최신 정보로 업데이트.
 * @param {Array<{name,organizer,deadline,url,category,description}>} contests
 * @returns {{ inserted: number, updated: number, skipped: number }}
 */
export function saveContests(contests) {
  const stmt = db.prepare(`
    INSERT INTO contests (name, organizer, deadline, url, category, description)
    VALUES (@name, @organizer, @deadline, @url, @category, @description)
    ON CONFLICT(url) DO UPDATE SET
      name        = excluded.name,
      organizer   = excluded.organizer,
      deadline    = excluded.deadline,
      category    = excluded.category,
      description = excluded.description,
      updated_at  = date('now')
  `);

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  const run = db.transaction(() => {
    for (const c of contests) {
      if (!c.name || !c.url || !c.deadline) { skipped++; continue; }

      const before = db.prepare('SELECT id FROM contests WHERE url = ?').get(c.url);
      stmt.run({
        name:        c.name.trim(),
        organizer:   (c.organizer ?? '').trim(),
        deadline:    c.deadline,
        url:         c.url.trim(),
        category:    (c.category ?? '기타').trim(),
        description: (c.description ?? '').trim() || null,
      });
      before ? updated++ : inserted++;
    }
  });

  run();
  return { inserted, updated, skipped };
}

// ─── HTTP 클라이언트 ──────────────────────────────────────────────────────────

export function createClient(baseURL, extraHeaders = {}) {
  return axios.create({
    baseURL,
    timeout: 15_000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      ...extraHeaders,
    },
  });
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

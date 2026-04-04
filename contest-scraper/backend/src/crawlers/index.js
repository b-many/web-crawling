/**
 * 크롤러 메인 러너
 *
 * 전체 실행:        npm run crawl
 * 단일 크롤러:      npm run crawl:linkareer
 *                   npm run crawl:campuspick
 *                   npm run crawl:wevity
 */
import 'dotenv/config';
import { saveContests } from './utils.js';
import { crawlLinkareer } from './linkareer.js';
import { crawlCampuspick } from './campuspick.js';
import { crawlWevity } from './wevity.js';

const CRAWLERS = {
  linkareer:  crawlLinkareer,
  campuspick: crawlCampuspick,
  wevity:     crawlWevity,
};

async function run(targets) {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const [name, crawl] of Object.entries(CRAWLERS)) {
    if (targets.length > 0 && !targets.includes(name)) continue;

    console.log(`\n${'='.repeat(50)}`);
    try {
      const contests = await crawl();

      if (contests.length === 0) {
        console.log(`[${name}] 수집된 데이터 없음`);
        continue;
      }

      const stats = saveContests(contests);
      results.inserted += stats.inserted;
      results.updated  += stats.updated;
      results.skipped  += stats.skipped;

      console.log(
        `[${name}] DB 저장 완료 — ` +
        `신규 ${stats.inserted}건 / 업데이트 ${stats.updated}건 / 스킵 ${stats.skipped}건`
      );
    } catch (err) {
      console.error(`[${name}] 크롤러 실패:`, err.message);
      results.errors.push({ name, error: err.message });
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('✔ 전체 완료');
  console.log(`  신규: ${results.inserted}건`);
  console.log(`  업데이트: ${results.updated}건`);
  console.log(`  스킵(필드 부족): ${results.skipped}건`);
  if (results.errors.length > 0) {
    console.log(`  실패: ${results.errors.map((e) => e.name).join(', ')}`);
  }
}

// CLI 인수로 실행할 크롤러 지정 (없으면 전체 실행)
const targets = process.argv.slice(2).map((s) => s.toLowerCase());
run(targets).catch(console.error);

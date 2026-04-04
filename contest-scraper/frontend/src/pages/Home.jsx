import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContests } from '../api/contests.js';
import ContestCard from '../components/ContestCard.jsx';
import FilterBar from '../components/FilterBar.jsx';

export default function Home() {
  const [allContests, setAllContests] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [filters, setFilters]         = useState({ search: '', category: '', urgent: false });
  const [endedOpen, setEndedOpen]     = useState(false);

  // API는 항상 전체를 가져오고, 분리·필터는 프론트에서 처리
  useEffect(() => {
    setLoading(true);
    setError(null);
    getContests({
      search:   filters.search   || undefined,
      category: filters.category || undefined,
    })
      .then(setAllContests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.search, filters.category]);

  // 진행 중 / 마감 분리
  let upcoming = allContests.filter((c) => c.days_left >= 0);
  const ended  = allContests.filter((c) => c.days_left < 0);

  // "마감 임박" 빠른 필터
  if (filters.urgent) {
    upcoming = upcoming.filter((c) => c.days_left <= 3);
  }

  const urgentCount  = allContests.filter((c) => c.days_left >= 0 && c.days_left <= 3).length;
  const endedCount   = ended.length;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>CS 공모전 스크랩</h1>
          {!loading && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              진행 중 {upcoming.length}건
              {urgentCount > 0 && (
                <span style={{ color: '#ef4444', fontWeight: 600 }}> · 마감 임박 {urgentCount}건</span>
              )}
            </p>
          )}
        </div>
        <Link
          to="/contests/new"
          style={{
            padding: '8px 18px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          + 등록
        </Link>
      </div>

      {/* 필터 */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* 상태 메시지 */}
      {loading && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>불러오는 중...</p>}
      {error   && <p style={{ color: '#ef4444' }}>{error}</p>}

      {/* ── 진행 중 공모전 ── */}
      {!loading && (
        <>
          {upcoming.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 0',
              color: '#9ca3af', fontSize: 15,
              border: '1px dashed #e5e7eb', borderRadius: 12,
            }}>
              {filters.urgent ? '마감 임박 공모전이 없습니다.' : '진행 중인 공모전이 없습니다.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map((c) => <ContestCard key={c.id} contest={c} />)}
            </div>
          )}

          {/* ── 마감된 공모전 섹션 (접기/펼치기) ── */}
          {endedCount > 0 && (
            <div style={{ marginTop: 32 }}>
              <button
                onClick={() => setEndedOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#6b7280',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <span style={{ marginRight: 6 }}>⏱</span>
                  마감된 공모전 {endedCount}건
                </span>
                <span style={{
                  transform: endedOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                  fontSize: 12,
                }}>
                  ▼
                </span>
              </button>

              {endedOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {ended.map((c) => <ContestCard key={c.id} contest={c} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

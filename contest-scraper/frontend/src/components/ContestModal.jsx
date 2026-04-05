import { useEffect } from 'react';
import { Link } from 'react-router-dom';

function DdayBadge({ daysLeft }) {
  const cfg = daysLeft < 0
    ? { bg: '#9ca3af', label: '마감' }
    : daysLeft === 0
    ? { bg: '#ef4444', label: 'D-Day' }
    : daysLeft <= 3
    ? { bg: '#ef4444', label: `D-${daysLeft}` }
    : daysLeft <= 7
    ? { bg: '#f97316', label: `D-${daysLeft}` }
    : { bg: '#22c55e', label: `D-${daysLeft}` };

  return (
    <span style={{
      background: cfg.bg,
      color: '#fff',
      borderRadius: 4,
      padding: '3px 10px',
      fontSize: 13,
      fontWeight: 700,
    }}>
      {cfg.label}
    </span>
  );
}

export default function ContestModal({ contest, onClose }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isEnded = contest.days_left < 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '20px 24px 0',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: isEnded ? '#f3f4f6' : '#eff6ff',
              color: isEnded ? '#9ca3af' : '#2563eb',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {contest.category}
            </span>
            <DdayBadge daysLeft={contest.days_left} />
            {!isEnded && contest.days_left <= 3 && (
              <span style={{
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                borderRadius: 4,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                🔥 마감 임박
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#9ca3af',
              lineHeight: 1,
              flexShrink: 0,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 제목 */}
          <h2 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: isEnded ? '#9ca3af' : '#111827',
            lineHeight: 1.4,
          }}>
            {contest.name}
          </h2>

          {/* 주최측 / 마감일 */}
          <div style={{
            background: '#f9fafb',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <Row label="주최" value={contest.organizer} />
            <Row label="마감일" value={contest.deadline} highlight={!isEnded && contest.days_left <= 3} />
          </div>

          {/* 상세 내용 */}
          {contest.description ? (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#374151' }}>상세 내용</p>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: '#4b5563',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {contest.description}
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>
              상세 내용이 없습니다.
            </p>
          )}

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <a
              href={contest.url}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                display: 'block',
                textAlign: 'center',
                padding: '10px 0',
                background: isEnded ? '#6b7280' : '#2563eb',
                color: '#fff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              원본 사이트로 이동 →
            </a>
            <Link
              to={`/contests/${contest.id}`}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                color: '#6b7280',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              수정
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: '#9ca3af', width: 40, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 14,
        color: highlight ? '#ef4444' : '#111827',
        fontWeight: highlight ? 600 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}

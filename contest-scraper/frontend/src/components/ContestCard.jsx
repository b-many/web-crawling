import { Link } from 'react-router-dom';

// ─── D-day 상태 분류 ─────────────────────────────────────────────────────────
// ended  : days_left < 0   (마감됨)
// urgent : days_left 0~3   (마감 3일 이내 또는 당일)
// soon   : days_left 4~7   (일주일 이내)
// normal : days_left >= 8
function getStatus(daysLeft) {
  if (daysLeft < 0)     return 'ended';
  if (daysLeft <= 3)    return 'urgent';
  if (daysLeft <= 7)    return 'soon';
  return 'normal';
}

// ─── 카드 외형 스타일 ──────────────────────────────────────────────────────────
const CARD_STYLE = {
  ended: {
    border:     '1px solid #e5e7eb',
    background: '#f9fafb',
    opacity:    0.6,
    filter:     'grayscale(40%)',
  },
  urgent: {
    border:     '2px solid #ef4444',
    background: '#fff',
    boxShadow:  '0 0 0 3px #fee2e2',
  },
  soon: {
    border:     '1px solid #f97316',
    background: '#fff',
  },
  normal: {
    border:     '1px solid #e5e7eb',
    background: '#fff',
  },
};

// ─── D-day 뱃지 ───────────────────────────────────────────────────────────────
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
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── 마감 임박 뱃지 ───────────────────────────────────────────────────────────
function UrgentBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      background: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fca5a5',
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      🔥 마감 임박
    </span>
  );
}

// ─── 분야 뱃지 ────────────────────────────────────────────────────────────────
function CategoryBadge({ category, ended }) {
  return (
    <span style={{
      background: ended ? '#f3f4f6' : '#eff6ff',
      color:      ended ? '#9ca3af' : '#2563eb',
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 600,
      flexShrink: 0,
    }}>
      {category}
    </span>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────────────────────
export default function ContestCard({ contest }) {
  const status  = getStatus(contest.days_left);
  const isEnded  = status === 'ended';
  const isUrgent = status === 'urgent';

  const cardStyle = {
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: 'box-shadow 0.15s',
    cursor: 'default',
    ...CARD_STYLE[status],
  };

  const titleColor = isEnded ? '#9ca3af' : '#111827';
  const metaColor  = isEnded ? '#d1d5db' : '#6b7280';

  return (
    <div style={cardStyle}>
      {/* 상단: 뱃지 줄 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <CategoryBadge category={contest.category} ended={isEnded} />
        <DdayBadge daysLeft={contest.days_left} />
        {isUrgent && <UrgentBadge />}
      </div>

      {/* 중단: 제목 + 메타 */}
      <div>
        <Link
          to={`/contests/${contest.id}`}
          style={{
            fontWeight: 600,
            fontSize: 16,
            color: titleColor,
            textDecoration: 'none',
            lineHeight: 1.4,
            pointerEvents: isEnded ? 'none' : 'auto',
          }}
        >
          {contest.name}
        </Link>
        <p style={{ margin: '4px 0 0', color: metaColor, fontSize: 13 }}>
          {contest.organizer} · 마감 {contest.deadline}
        </p>
      </div>

      {/* 하단: 바로가기 링크 (마감된 경우 숨김) */}
      {!isEnded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={contest.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 13,
              color: isUrgent ? '#ef4444' : '#2563eb',
              fontWeight: isUrgent ? 600 : 400,
              textDecoration: 'none',
            }}
          >
            바로가기 →
          </a>
        </div>
      )}

      {/* 마감 오버레이 텍스트 */}
      {isEnded && (
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
          이 공모전은 마감되었습니다.
        </p>
      )}
    </div>
  );
}

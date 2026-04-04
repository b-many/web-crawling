const CATEGORIES = ['', '개발', '디자인', '기획', '데이터', '보안', '기타'];
const STATUS_OPTIONS = [
  { value: '',         label: '전체' },
  { value: 'upcoming', label: '진행 중' },
  { value: 'ended',    label: '마감' },
];

export default function FilterBar({ filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      <input
        type="text"
        placeholder="공모전명 / 주최사 검색"
        value={filters.search}
        onChange={set('search')}
        style={inputStyle}
      />
      <select value={filters.category} onChange={set('category')} style={selectStyle}>
        <option value="">전체 분야</option>
        {CATEGORIES.filter(Boolean).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select value={filters.status} onChange={set('status')} style={selectStyle}>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const inputStyle  = { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const selectStyle = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff' };

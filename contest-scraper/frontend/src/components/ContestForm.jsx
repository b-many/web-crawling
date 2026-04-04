import { useState } from 'react';

const CATEGORIES = ['개발', '디자인', '기획', '데이터', '보안', '기타'];

const EMPTY = { name: '', organizer: '', deadline: '', url: '', category: '개발', description: '' };

export default function ContestForm({ initial = EMPTY, onSubmit, loading }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.deadline) || isNaN(new Date(form.deadline).getTime())) {
      setError('마감일은 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}

      {[
        { label: '공모전명 *', key: 'name', type: 'text' },
        { label: '주최사 *',   key: 'organizer', type: 'text' },
        { label: '마감일 * (YYYY-MM-DD)', key: 'deadline', type: 'text', placeholder: '2026-12-31' },
        { label: '원본 링크 *', key: 'url', type: 'url' },
      ].map(({ label, key, type, placeholder }) => (
        <label key={key} style={labelStyle}>
          {label}
          <input
            type={type}
            value={form[key]}
            onChange={set(key)}
            placeholder={placeholder}
            required
            style={inputStyle}
          />
        </label>
      ))}

      <label style={labelStyle}>
        분야 *
        <select value={form.category} onChange={set('category')} style={inputStyle}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label style={labelStyle}>
        상세 정보
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}
      >
        {loading ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 500 };
const inputStyle  = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };

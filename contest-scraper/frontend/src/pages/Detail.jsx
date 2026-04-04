import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContest, createContest, updateContest, deleteContest } from '../api/contests.js';
import ContestForm from '../components/ContestForm.jsx';

export default function Detail() {
  const { id }     = useParams();          // 'new' or numeric id
  const navigate   = useNavigate();
  const isNew      = id === 'new';

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (isNew) return;
    getContest(id).then(setContest).catch((e) => setError(e.message));
  }, [id, isNew]);

  async function handleSubmit(data) {
    setLoading(true);
    try {
      if (isNew) {
        await createContest(data);
      } else {
        await updateContest(id, data);
      }
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await deleteContest(id);
    navigate('/');
  }

  if (!isNew && !contest && !error) return <p style={{ padding: 24 }}>불러오는 중...</p>;
  if (error) return <p style={{ padding: 24, color: '#ef4444' }}>{error}</p>;

  // D-day 뱃지 색상
  const dl = contest?.days_left;
  const ddayLabel = dl == null ? null : dl < 0 ? '마감' : dl === 0 ? 'D-Day' : `D-${dl}`;
  const ddayColor = dl <= 0 ? '#9ca3af' : dl <= 3 ? '#ef4444' : dl <= 7 ? '#f97316' : '#22c55e';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link to="/">← 목록으로</Link>
        {!isNew && (
          <button onClick={handleDelete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            삭제
          </button>
        )}
      </div>

      {!isNew && contest && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f9fafb', borderRadius: 10 }}>
          <span style={{ background: ddayColor, color: '#fff', borderRadius: 4, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>
            {ddayLabel}
          </span>
          <span style={{ marginLeft: 10, color: '#6b7280', fontSize: 14 }}>마감일: {contest.deadline}</span>
          <div style={{ marginTop: 8 }}>
            <a href={contest.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb' }}>
              원본 링크 바로가기 →
            </a>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: 20 }}>{isNew ? '공모전 등록' : '공모전 수정'}</h2>

      <ContestForm
        initial={contest ?? undefined}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}

import db from '../db/database.js';

/**
 * 마감일까지 남은 일수 계산
 * @param {string} deadline  YYYY-MM-DD
 * @returns {number} 양수=남은 일수, 0=오늘 마감, 음수=이미 마감
 */
function calcDaysLeft(deadline) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const end   = new Date(deadline);
  return Math.round((end - today) / (1000 * 60 * 60 * 24));
}

/**
 * deadline 형식 검증 및 날짜 유효성 확인
 * YYYY-MM-DD 정규식 + isNaN(new Date(str)) 이중 검사
 */
function validateDeadline(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function withDaysLeft(row) {
  return { ...row, days_left: calcDaysLeft(row.deadline) };
}

// GET /api/contests?category=&search=&status=upcoming|ended
export function getAll(req, res, next) {
  try {
    const { category, search, status } = req.query;

    let sql = 'SELECT * FROM contests WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR organizer LIKE ? OR description LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status === 'upcoming') {
      sql += " AND deadline >= date('now')";
    } else if (status === 'ended') {
      sql += " AND deadline < date('now')";
    }

    sql += ' ORDER BY deadline ASC';

    const rows = db.prepare(sql).all(...params).map(withDaysLeft);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/contests/:id
export function getById(req, res, next) {
  try {
    const row = db.prepare('SELECT * FROM contests WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Contest not found' });
    res.json(withDaysLeft(row));
  } catch (err) {
    next(err);
  }
}

// POST /api/contests
export function create(req, res, next) {
  try {
    const { name, organizer, deadline, url, category, description } = req.body;

    if (!name || !organizer || !deadline || !url || !category) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }
    if (!validateDeadline(deadline)) {
      return res.status(400).json({ error: 'deadline은 YYYY-MM-DD 형식이어야 합니다.' });
    }

    const result = db.prepare(`
      INSERT INTO contests (name, organizer, deadline, url, category, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, organizer, deadline, url, category, description ?? null);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '이미 등록된 URL입니다.' });
    }
    next(err);
  }
}

// PUT /api/contests/:id
export function update(req, res, next) {
  try {
    const existing = db.prepare('SELECT * FROM contests WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Contest not found' });

    const { name, organizer, deadline, url, category, description } = req.body;

    if (deadline && !validateDeadline(deadline)) {
      return res.status(400).json({ error: 'deadline은 YYYY-MM-DD 형식이어야 합니다.' });
    }

    db.prepare(`
      UPDATE contests
      SET name = ?, organizer = ?, deadline = ?, url = ?, category = ?, description = ?,
          updated_at = date('now')
      WHERE id = ?
    `).run(
      name        ?? existing.name,
      organizer   ?? existing.organizer,
      deadline    ?? existing.deadline,
      url         ?? existing.url,
      category    ?? existing.category,
      description ?? existing.description,
      req.params.id,
    );

    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/contests/:id
export function remove(req, res, next) {
  try {
    const result = db.prepare('DELETE FROM contests WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Contest not found' });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

CREATE TABLE IF NOT EXISTS contests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  organizer   TEXT    NOT NULL,
  deadline    TEXT    NOT NULL,      -- YYYY-MM-DD
  url         TEXT    NOT NULL UNIQUE,
  category    TEXT    NOT NULL,
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT (date('now')),
  updated_at  TEXT    NOT NULL DEFAULT (date('now'))
);

CREATE INDEX IF NOT EXISTS idx_deadline  ON contests(deadline);
CREATE INDEX IF NOT EXISTS idx_category  ON contests(category);

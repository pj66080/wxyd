PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  wx_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK(level BETWEEN 0 AND 99),
  message_count INTEGER NOT NULL DEFAULT 0 CHECK(message_count >= 0),
  created_at TEXT NOT NULL,
  geo_count INTEGER NOT NULL DEFAULT 0 CHECK(geo_count >= 0),
  geo_date TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY CHECK(length(id)=64 AND id NOT GLOB '*[^0-9a-f]*'),
  wx_id TEXT NOT NULL REFERENCES users(wx_id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK(length(content)<=10000),
  timestamp TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN(0,1))
);

CREATE INDEX IF NOT EXISTS idx_messages_wx_id_timestamp ON messages(wx_id,timestamp);

CREATE TABLE IF NOT EXISTS reads (
  id TEXT NOT NULL CHECK(length(id)=64 AND id NOT GLOB '*[^0-9a-f]*'),
  ip TEXT NOT NULL CHECK(length(ip) BETWEEN 1 AND 64),
  timestamp TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  isp TEXT NOT NULL DEFAULT '',
  country_en TEXT NOT NULL DEFAULT '',
  region_en TEXT NOT NULL DEFAULT '',
  city_en TEXT NOT NULL DEFAULT '',
  isp_en TEXT NOT NULL DEFAULT '',
  PRIMARY KEY(id,ip)
);

CREATE INDEX IF NOT EXISTS idx_reads_id_timestamp ON reads(id,timestamp);
CREATE INDEX IF NOT EXISTS idx_reads_timestamp ON reads(timestamp);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  wx_id TEXT NOT NULL REFERENCES users(wx_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_wx_id ON sessions(wx_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wx_id TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registration_stats (
  date TEXT NOT NULL,
  wx_id TEXT NOT NULL REFERENCES users(wx_id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0 CHECK(count>=0),
  PRIMARY KEY(date,wx_id)
);

CREATE INDEX IF NOT EXISTS idx_regstats_date ON registration_stats(date);

CREATE TABLE IF NOT EXISTS read_stats (
  date TEXT NOT NULL,
  wx_id TEXT NOT NULL REFERENCES users(wx_id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0 CHECK(count>=0),
  PRIMARY KEY(date,wx_id)
);

CREATE INDEX IF NOT EXISTS idx_readstats_date ON read_stats(date);

CREATE TABLE IF NOT EXISTS message_read_stats (
  date TEXT NOT NULL,
  wx_id TEXT NOT NULL REFERENCES users(wx_id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0 CHECK(count>=0),
  PRIMARY KEY(date,wx_id)
);

CREATE INDEX IF NOT EXISTS idx_msgreadstats_date ON message_read_stats(date);
CREATE INDEX IF NOT EXISTS idx_msgreadstats_wx_id ON message_read_stats(wx_id);

CREATE TABLE IF NOT EXISTS ip_block_global (
  ip TEXT PRIMARY KEY CHECK(length(ip) BETWEEN 1 AND 64),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ip_block_message (
  id TEXT NOT NULL CHECK(length(id)=64 AND id NOT GLOB '*[^0-9a-f]*'),
  ip TEXT NOT NULL CHECK(length(ip) BETWEEN 1 AND 64),
  created_at TEXT NOT NULL,
  PRIMARY KEY(id,ip),
  FOREIGN KEY(id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ip_block_account (
  wx_id TEXT NOT NULL REFERENCES users(wx_id) ON DELETE CASCADE,
  ip TEXT NOT NULL CHECK(length(ip) BETWEEN 1 AND 64),
  created_at TEXT NOT NULL,
  PRIMARY KEY(wx_id,ip)
);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  content,
  tokenize='trigram',
  content='messages',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid,content) VALUES(new.rowid,new.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts,rowid,content) VALUES('delete',old.rowid,old.content);
END;

INSERT INTO messages_fts(rowid,content)
SELECT m.rowid,m.content
FROM messages AS m
WHERE NOT EXISTS (
  SELECT 1 FROM messages_fts AS f WHERE f.rowid=m.rowid
);

INSERT OR IGNORE INTO registration_stats(date,wx_id,count)
SELECT substr(m.timestamp,1,10),m.wx_id,COUNT(*)
FROM messages AS m
GROUP BY substr(m.timestamp,1,10),m.wx_id;

INSERT OR IGNORE INTO read_stats(date,wx_id,count)
SELECT substr(r.timestamp,1,10),m.wx_id,COUNT(*)
FROM reads AS r
JOIN messages AS m ON m.id=r.id
GROUP BY substr(r.timestamp,1,10),m.wx_id;

INSERT OR IGNORE INTO meta(key,value) VALUES
('formula:MESSAGE_QUOTA_FORMULA','x'),
('formula:GEO_QUOTA_FORMULA','x'),
('formula:RETENTION_MONTHS_FORMULA','x'),
('retention:newUserDays','0'),
('retention:dormantDays','0');

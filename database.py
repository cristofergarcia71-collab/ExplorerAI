import sqlite3


def init_db():

    conn = sqlite3.connect("explorer.db")
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS hallazgos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        descripcion TEXT,
        lat REAL,
        lon REAL,
        rareza INTEGER,
        tipo TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS usuario (
        id INTEGER PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        nivel INTEGER DEFAULT 1
    )
    """)

    c.execute("""
    INSERT OR IGNORE INTO usuario
    (id, xp, nivel)
    VALUES
    (1,0,1)
    """)

    conn.commit()
    conn.close()
import csv
import os
import sqlite3
try:
    from mcp.server.fastmcp import FastMCP
except (ImportError, ModuleNotFoundError):
    from mcp.server.mcpserver import MCPServer as FastMCP

mcp = FastMCP("Flight Server")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "flights.db")
AIRPORTS_CSV = os.path.join(DATA_DIR, "airports.csv")
AIRLINES_DAT = os.path.join(DATA_DIR, "airlines.dat")

COUNTRY_CODES = {
    "japan": "JP",
    "india": "IN",
    "united states": "US",
    "usa": "US",
    "us": "US",
    "united kingdom": "GB",
    "uk": "GB",
    "france": "FR",
    "germany": "DE",
    "italy": "IT",
    "spain": "ES",
    "canada": "CA",
    "australia": "AU",
    "singapore": "SG",
    "thailand": "TH",
    "united arab emirates": "AE",
    "uae": "AE",
    "dubai": "AE",
    "switzerland": "CH",
    "netherlands": "NL",
    "china": "CN",
    "brazil": "BR",
    "south korea": "KR",
    "korea": "KR",
    "indonesia": "ID",
    "vietnam": "VN",
    "malaysia": "MY",
    "turkey": "TR",
    "türkiye": "TR",
    "greece": "GR",
    "mexico": "MX",
    "new zealand": "NZ",
    "egypt": "EG",
    "south africa": "ZA",
    "saudi arabia": "SA",
}

POPULAR_AIRLINES = (
    "Emirates",
    "Qatar Airways",
    "Singapore Airlines",
    "All Nippon Airways",
    "Japan Airlines",
    "Delta Air Lines",
    "British Airways",
    "Lufthansa",
    "Air France",
    "United Airlines",
    "Air India",
    "American Airlines",
    "Cathay Pacific",
    "Qantas",
    "Etihad Airways",
    "KLM Royal Dutch Airlines",
    "Korean Air",
    "Turkish Airlines",
    "Swiss International Air Lines",
    "Virgin Atlantic",
)


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='airports'")
    if not cur.fetchone() and os.path.exists(AIRPORTS_CSV):
        cur.execute("""
            CREATE TABLE IF NOT EXISTS airports (
                id TEXT, ident TEXT, type TEXT, name TEXT,
                latitude_deg REAL, longitude_deg REAL, elevation_ft REAL,
                continent TEXT, iso_country TEXT, iso_region TEXT,
                municipality TEXT, scheduled_service TEXT,
                icao_code TEXT, iata_code TEXT, gps_code TEXT,
                local_code TEXT, home_link TEXT, wikipedia_link TEXT, keywords TEXT
            )
        """)
        with open(AIRPORTS_CSV, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)
            cur.executemany("INSERT INTO airports VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", reader)

        cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_name ON airports(name)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_muni ON airports(municipality)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(iso_country)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_keywords ON airports(keywords)")

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='airlines'")
    if not cur.fetchone() and os.path.exists(AIRLINES_DAT):
        cur.execute("""
            CREATE TABLE IF NOT EXISTS airlines (
                airline_id INTEGER, name TEXT, alias TEXT,
                iata TEXT, icao TEXT, callsign TEXT, country TEXT, active TEXT
            )
        """)
        with open(AIRLINES_DAT, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            cur.executemany("INSERT INTO airlines VALUES (?,?,?,?,?,?,?,?)", reader)

        cur.execute("CREATE INDEX IF NOT EXISTS idx_airlines_name ON airlines(name)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airlines_country ON airlines(country)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_airlines_active ON airlines(active)")

    conn.commit()
    conn.close()


def get_connection():
    if not os.path.exists(DB_PATH):
        init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@mcp.tool()
def list_airports(search: str = "", limit: int = 10, offset: int = 0):
    """List or search airports using the local OurAirports dataset."""
    conn = get_connection()
    cur = conn.cursor()
    query = (search or "").strip()

    if not query:
        cur.execute(
            """
            SELECT name, iata_code, icao_code, municipality, iso_country, type
            FROM airports
            WHERE type = 'large_airport' AND scheduled_service = 'yes' AND iata_code != ''
            ORDER BY name ASC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        )
    else:
        term = f"%{query}%"
        country_code = COUNTRY_CODES.get(query.lower(), "")
        if not country_code and len(query) == 2:
            country_code = query.upper()

        cur.execute(
            """
            SELECT name, iata_code, icao_code, municipality, iso_country, type
            FROM airports
            WHERE (
                iata_code = ?
                OR icao_code = ?
                OR name LIKE ?
                OR municipality LIKE ?
                OR keywords LIKE ?
                OR (? != '' AND iso_country = ?)
            )
            ORDER BY
                CASE
                    WHEN iata_code = ? THEN 1
                    WHEN type = 'large_airport' THEN 2
                    WHEN type = 'medium_airport' AND iata_code != '' THEN 3
                    WHEN scheduled_service = 'yes' AND iata_code != '' THEN 4
                    WHEN iata_code != '' THEN 5
                    ELSE 6
                END,
                name ASC
            LIMIT ? OFFSET ?
            """,
            (
                query.upper(),
                query.upper(),
                term,
                term,
                term,
                country_code,
                country_code,
                query.upper(),
                limit,
                offset,
            ),
        )

    rows = cur.fetchall()
    results = [
        {
            "airport_name": row["name"],
            "name": row["name"],
            "iata_code": row["iata_code"] or "",
            "icao_code": row["icao_code"] or "",
            "city": row["municipality"] or "",
            "municipality": row["municipality"] or "",
            "country": row["iso_country"] or "",
            "type": row["type"] or "",
        }
        for row in rows
    ]
    conn.close()
    return {
        "pagination": {
            "limit": limit,
            "offset": offset,
            "count": len(results),
        },
        "data": results,
    }


@mcp.tool()
def list_airlines(search: str = "", limit: int = 10, offset: int = 0):
    """List or search airlines using the local OpenFlights dataset."""
    conn = get_connection()
    cur = conn.cursor()
    query = (search or "").strip()

    if not query:
        placeholders = ",".join("?" for _ in POPULAR_AIRLINES)
        cur.execute(
            f"""
            SELECT name, iata, icao, callsign, country, active
            FROM airlines
            WHERE active = 'Y' AND iata != '' AND iata != '-' AND iata != '\\N'
            ORDER BY
                CASE WHEN name IN ({placeholders}) THEN 1 ELSE 2 END,
                name ASC
            LIMIT ? OFFSET ?
            """,
            (*POPULAR_AIRLINES, limit, offset),
        )
    else:
        term = f"%{query}%"
        cur.execute(
            """
            SELECT name, iata, icao, callsign, country, active
            FROM airlines
            WHERE (
                name LIKE ?
                OR alias LIKE ?
                OR iata = ?
                OR icao = ?
                OR country LIKE ?
            )
            ORDER BY
                CASE WHEN active = 'Y' THEN 1 ELSE 2 END,
                CASE WHEN iata != '' AND iata != '-' AND iata != '\\N' THEN 1 ELSE 2 END,
                CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
                name ASC
            LIMIT ? OFFSET ?
            """,
            (term, term, query.upper(), query.upper(), term, f"{query}%", limit, offset),
        )

    rows = cur.fetchall()
    results = [
        {
            "airline_name": row["name"],
            "name": row["name"],
            "iata_code": row["iata"] if row["iata"] not in ("-", "\\N") else "",
            "icao_code": row["icao"] if row["icao"] not in ("-", "\\N") else "",
            "callsign": row["callsign"] if row["callsign"] not in ("-", "\\N") else "",
            "country": row["country"] if row["country"] not in ("-", "\\N") else "",
        }
        for row in rows
    ]
    conn.close()
    return {
        "pagination": {
            "limit": limit,
            "offset": offset,
            "count": len(results),
        },
        "data": results,
    }


if __name__ == "__main__":
    mcp.run()

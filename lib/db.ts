import postgres from 'postgres';

// URL.password keeps %40 encoded (@ is URL delimiter, so Node won't decode it).
// decodeURIComponent converts %40 → @ so postgres.js receives the real password
// for SCRAM-SHA-256 auth. Without this, SASL fails with 08P01 (protocol violation).
const dbUrl = new URL(process.env.DATABASE_URL!);

const sql = postgres({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.replace(/^\//, ''),
    username: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export default sql;

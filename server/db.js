const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "1202ThurnRidge",
    host: "localhost",
    port: 5432,
    database: "BillboardData"
});

module.exports = pool;
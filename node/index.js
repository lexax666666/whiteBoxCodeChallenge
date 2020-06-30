const mysql = require("mysql2/promise");
const pivot = require("sqlpivot");
const xlsx = require("xlsx");

async function connectToDb() {
  try {
    const connection = await mysql.createConnection({
      host            : process.env.DATABASE_HOST,
      port            : process.env.MYSQL_PORT,
      user            : process.env.MYSQL_USER,
      password        : process.env.MYSQL_PASSWORD,
      database        : process.env.MYSQL_DATABASE
    });
    return connection;
  } catch(err){
    console.error("error connecting expected, will retry...");
    return process.exit(22); 
    //consistently exit so the Docker container will restart until it connects to the sql db
  }
};

async function createWorkSheet(connection, shipping_speed, locale){
  const sqlQuery = `SELECT start_weight, end_weight, zone, SUM(rate) AS rate 
                    FROM rates 
                    WHERE client_id = 1240 and 
                          shipping_speed = '${shipping_speed}' and 
                          locale = '${locale}' 
                    GROUP BY start_weight, end_weight, zone 
                    ORDER BY start_weight ASC, end_weight ASC`;
  const [rows, fields] = await connection.query(sqlQuery);
  const rowsWithNewHeading = rows.map(row => ({
    "Start Weight": row.start_weight, 
    "End Weight": row.end_weight, 
    "rate": row.rate, zone: `Zone${row.zone}`
    }));
  const zones = [...new Set(rowsWithNewHeading.map(row => row.zone))];
  zones.sort();
  const aggregator = (acc, curr) => (acc || 0) + curr;
  const pivoted = pivot(rowsWithNewHeading, 'rate', 'zone', aggregator);
  const ws = xlsx.utils.json_to_sheet(pivoted, { header:["Start Weight", "End Weight", ...zones] });
  return ws;
}

async function main(){
  const connection = await connectToDb();
  const sqlQuery = `SELECT DISTINCT shipping_speed, locale FROM rates WHERE client_id = 1240`;
  const [rows, fields] = await connection.query(sqlQuery);
  const wb = xlsx.utils.book_new();
  for (const row of rows) {
    const ws = await createWorkSheet(connection, row.shipping_speed, row.locale);
    xlsx.utils.book_append_sheet(wb, ws, `${row.locale} ${row.shipping_speed}`);
  }
  xlsx.writeFile(wb, './out.xlsx');
}

(async () => {
  try {
    await main();
    console.log("Finished, you can find out.xlsx in the ./node folder");
    return process.exit(0);
  } 
  catch(error) {
    console.log("Error Occured Please Try Again", error);
  }
})();

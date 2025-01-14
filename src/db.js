import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export const query = (text, params) => pool.query(text, params);

export async function getPerGBActiveLicenses() {
    const licenses = await query(
        `SELECT * from "v_ActiveLicenses" WHERE model = 'perGB';`,
    );

    return licenses.rows;
}

export async function getPerWorkloadActiveLicenses() {
    const licenses = await query(
        `SELECT * from "v_ActiveLicenses" WHERE model = 'perWorkload';`,
    );

    return licenses.rows;
}

export async function getLicensedCustomers() {
    const licensedCustomers = await query(
        'SELECT * from "v_LicensedCustomers";',
    );

    return licensedCustomers.rows;
}

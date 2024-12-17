import dotenv from 'dotenv';
import axios from 'axios';
import { Buffer } from 'buffer';

dotenv.config();

export const baseUrl = process.env.ACRONIS_API_V2_URL;

let tokenInfo = null;
let tokenExpiry = null;

async function fetchToken() {
    const clientId = process.env.ACRONIS_CLIENT_ID;
    const clientSecret = process.env.ACRONIS_CLIENT_SECRET;

    const encodedClientCreds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const headers = {
        'Authorization': `Basic ${encodedClientCreds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
        const response = await axios.post(
            `${baseUrl}/idp/token`,
            'grant_type=client_credentials',
            { headers }
        );

        tokenInfo = response.data;
        tokenExpiry = Date.now() + (1800 * 1000); // 30 minutes

        return tokenInfo;
    } catch (error) {
        console.error('Error fetching token:', error.response?.data || error.message);
        throw new Error('Failed to fetch token');
    }
}

async function getToken() {
    if (tokenInfo && tokenExpiry && Date.now() < tokenExpiry) {
        return tokenInfo;
    }

    return await fetchToken();
}

export async function getAuth() {
    try {
        const token = await getToken();

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`,
        };

        return authHeaders;
    } catch (error) {
        console.error('Error getting auth headers:', error.message);
        throw error;
    }
}
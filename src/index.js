import schedule from 'node-schedule';
import { getActiveLicenses, getLicensedCustomers } from './db.js';
import { setQuotaPerGb } from './usage.js';

console.log('Service started!');

async function fetchDataAndSend() {
    const licensedCustomers = await getLicensedCustomers();
    const activeLicenses = await getActiveLicenses();
    let updatedCustomers = [];

    licensedCustomers.filter((l) => !l.model).forEach((c) => {
        setQuotaPerGb(c.acronisId, 0);
        console.log(`Quota set to 0 bytes for ${c.name}`);
    });

    licensedCustomers.filter((l) => l.model).forEach((c) => {
        if (updatedCustomers.includes(c.acronisId)) return;

        const totalBytes = activeLicenses.reduce((acc, l) => {
            if (l.customerAcronisId === c.acronisId) return acc + Number(l.bytes)

            return acc;
        }, 0);

        updatedCustomers.push(c.acronisId);

        setQuotaPerGb(c.acronisId, totalBytes);
        console.log(`Quota set to ${totalBytes} bytes for ${c.name}`);
    });
}

await fetchDataAndSend();

//Her 5 dakikada bir veri çekip işleme
schedule.scheduleJob('*/5 * * * *', async () => {
    console.log('Task running...');
    await fetchDataAndSend();
});

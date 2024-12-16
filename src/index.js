import schedule from 'node-schedule';
import { getActiveLicenses, getLicensedCustomers } from './db.js';
import { setQuotaPerGb } from './usage.js';

console.log('Service started!');

async function fetchDataAndUpdateQuotas() {
    const licensedCustomers = await getLicensedCustomers();
    const activeLicenses = await getActiveLicenses();
    let updatedCustomers = [];

    licensedCustomers.filter((l) => !l.model).forEach((c) => {
        setQuotaPerGb(c.acronisId, c.name, 0);
    });

    licensedCustomers.filter((l) => l.model).forEach((c) => {
        if (updatedCustomers.includes(c.acronisId)) return;

        const totalBytes = activeLicenses.reduce((acc, l) => {
            if (l.customerAcronisId === c.acronisId) return acc + Number(l.bytes)

            return acc;
        }, 0);

        updatedCustomers.push(c.acronisId);

        setQuotaPerGb(c.acronisId, c.name, totalBytes);
    });
}

await fetchDataAndUpdateQuotas();

//Her 5 dakikada bir veri çekip işleme
schedule.scheduleJob('*/5 * * * *', async () => {
    console.log('Task running...');
    await fetchDataAndUpdateQuotas();
});

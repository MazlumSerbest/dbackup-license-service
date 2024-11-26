import { getActiveLicenses, getLicensedCustomers } from "./db.js";
import { setQuotaPerGb } from "./usage.js";
console.log("Service started!");
async function fetchDataAndSend() {
    const licensedCustomers = await getLicensedCustomers();
    const activeLicenses = await getActiveLicenses();
    let updatedCustomers = [];
    licensedCustomers
        .filter((l) => !l.model)
        .forEach((c) => {
        setQuotaPerGb(c.acronisId, 0);
        console.log(`Quota set to 0 for ${c.name}`);
    });
    licensedCustomers
        .filter((l) => l.model)
        .forEach((c) => {
        setQuotaPerGb(c.acronisId, c.bytes || 0);
        console.log(`Quota set to ${c.quota} for ${c.name}`);
    });
}
await fetchDataAndSend();
process.exit();
// Her 5 dakikada bir veri çekip işleme
// schedule.scheduleJob('*/1 * * * *', async () => {
//     console.log('Task running...');
//     await fetchDataAndSend();
// });

import schedule from "node-schedule";
import {
    getPerGBActiveLicenses,
    getPerWorkloadActiveLicenses,
    getLicensedCustomers,
} from "./db.js";
import { setQuotaPerGb, setQuotaPerWorkload, setQuotaToZero } from "./usage.js";

console.log("Service started!");

const licensedCustomers = await getLicensedCustomers();
const activeLicensesPerGB = await getPerGBActiveLicenses();
const activeLicensesPerWorkload = await getPerWorkloadActiveLicenses();

async function updatePerGBQuotas() {
    let updatedCustomers = [];
    const perGbCustomers = licensedCustomers.filter((l) => l.model === "perGB");
    if (!perGbCustomers.length) return;

    await Promise.all(
        perGbCustomers.map(async (c) => {
            if (updatedCustomers.includes(c.acronisId)) return;

            const totalBytes = activeLicensesPerGB.reduce((acc, l) => {
                return l.customerAcronisId === c.acronisId
                    ? acc + Number(l.bytes)
                    : acc;
            }, 0);

            setQuotaPerGb(c.acronisId, c.name, totalBytes);

            updatedCustomers.push(c.acronisId);
        }),
    );
}

async function updatePerWorkloadQuotas() {
    let updatedCustomers = [];
    const perWorkloadCustomers = licensedCustomers.filter(
        (l) => l.model === "perWorkload",
    );
    if (!perWorkloadCustomers.length) return;

    await Promise.all(
        perWorkloadCustomers.map(async (c) => {
            if (updatedCustomers.includes(c.acronisId)) return;

            let quotas = {
                servers: 0,
                vms: 0,
                workstations: 0,
                nas: 0,
                mailboxes: 0,
                web_hosting_servers: 0,
            };

            activeLicensesPerWorkload.forEach((l) => {
                if (l.customerAcronisId === c.acronisId) {
                    switch (l.usageName) {
                        case "servers":
                            quotas.servers += l.quota || 0;
                            break;
                        case "vms":
                            quotas.vms += l.quota || 0;
                            break;
                        case "workstations":
                            quotas.workstations += l.quota || 0;
                            break;
                        case "nas":
                            quotas.nas += l.quota || 0;
                            break;
                        case "mailboxes":
                            quotas.mailboxes += l.quota || 0;
                            break;
                        case "web_hosting_servers":
                            quotas.web_hosting_servers += l.quota || 0;
                            break;
                        default:
                            break;
                    }
                }
            });

            setQuotaPerWorkload(c.acronisId, c.name, quotas);

            updatedCustomers.push(c.acronisId);
        }),
    );
}

async function fetchDataAndUpdateQuotas() {
    try {
        const customersWithoutQuota = licensedCustomers.filter((l) => !l.model);

        await Promise.all(
            customersWithoutQuota.map(async (c) => {
                await setQuotaToZero(c.acronisId, c.name);
            }),
            updatePerGBQuotas(),
            updatePerWorkloadQuotas(),
        );
    } catch (error) {
        console.error("Error updating quotas:", error);
    }
}

await fetchDataAndUpdateQuotas();

//Her 10 dakikada bir veri çekip işleme
let isRunning = false;

schedule.scheduleJob("*/10 * * * *", async () => {
    if (isRunning) {
        console.log("Previous task is still running. Skipping this execution.");
        return;
    }

    isRunning = true;
    const now = new Date();
    console.log("----------------------------------------");
    console.log(`Task started at ${now.toLocaleString()}...`);

    try {
        await fetchDataAndUpdateQuotas();
        isRunning = false;
    } catch (error) {
        console.error(`Task failed at ${new Date().toLocaleString()}:`, error);
    }
});

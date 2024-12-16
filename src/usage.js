import axios from 'axios';
import { getAuth, baseUrl } from './acronis/getToken.js';

export async function setQuotaPerGb(tenantId, tenantName, bytes) {
    try {
        const name = "pg_base_storage";

        const offeringItemsResponse = await axios.get(
            `${baseUrl}/tenants/${tenantId}/offering_items?edition=pck_per_gigabyte`,
            {
                headers: await getAuth(),
            }
        );

        const offeringItems = offeringItemsResponse.data;

        for (const item of offeringItems.items) {
            if (item.name === name && item.infra_id === "d46a4b2a-2631-4f76-84cd-07ce3aed3dde") {
                let data;
                if (item.quota.value === bytes) {

                    console.log(`Quota already correct for ${tenantName}`);
                    return;
                }

                if (!item.quota) {
                    data = {
                        offering_items: [
                            {
                                application_id: item.application_id,
                                name: item.name,
                                measurement_unit: item.measurement_unit,
                                status: 1,
                                edition: item.edition,
                                type: item.type,
                                infra_id: item.infra_id,
                                quota: {
                                    value: bytes,
                                    overage: 0,
                                    version: 0,
                                },
                            },
                            {
                                name: "pg_base_workstations",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                            },
                            {
                                name: "pg_base_servers",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                            },
                            {
                                name: "pg_base_vms",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                            }
                        ],
                    };
                } else {
                    data = {
                        offering_items: [
                            {
                                application_id: item.application_id,
                                name: item.name,
                                measurement_unit: item.measurement_unit,
                                status: 1,
                                edition: item.edition,
                                type: item.type,
                                infra_id: item.infra_id,
                                quota: {
                                    value: bytes,
                                    overage: 0,
                                    version: item.quota.version,
                                },
                            },
                            {
                                name: "pg_base_workstations",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                            },
                            {
                                name: "pg_base_servers",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                            },
                            {
                                name: "pg_base_vms",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                            }
                        ],
                    };
                }

                const updateResponse = await axios.put(
                    `${baseUrl}/tenants/${tenantId}/offering_items`,
                    data,
                    {
                        headers: await getAuth(),
                    }
                );

                console.log(`Quota set to ${bytes} bytes for ${tenantName}`);
                return updateResponse.data;
            }
        }

        throw new Error("Matching offering item not found");
    } catch (error) {
        console.error("Error in setQuotaPerGb:", error.message || error);
        throw error;
    }
}
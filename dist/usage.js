import axios from "axios";
import { getAuth, baseUrl } from "./acronis/getToken.js";
export async function setQuotaPerGb(tenantId, bytes) {
    try {
        const name = "pg_base_storage";
        const offeringItemsResponse = await axios.get(`${baseUrl}/tenants/${tenantId}/offering_items?edition=pck_per_gigabyte`, {
            headers: await getAuth(),
        });
        const offeringItems = offeringItemsResponse.data;
        for (const item of offeringItems.items) {
            if (item.name === name &&
                item.infra_id === "d46a4b2a-2631-4f76-84cd-07ce3aed3dde") {
                let data;
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
                        ],
                    };
                }
                else {
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
                        ],
                    };
                }
                const updateResponse = await axios.put(`${baseUrl}/tenants/${tenantId}/offering_items`, data, {
                    headers: await getAuth(),
                });
                return updateResponse.data;
            }
        }
        throw new Error("Matching offering item not found");
    }
    catch (error) {
        console.error("Error in setQuotaPerGb:", error.message || error);
        throw error;
    }
}

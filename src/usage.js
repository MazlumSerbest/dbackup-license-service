import axios from "axios";
import { getAuth, baseUrl } from "./acronis/getToken.js";

export async function setQuotaToZero(tenantId, tenantName) {
    try {
        const offeringItemsResponse = await axios
            .get(
                `${baseUrl}/tenants/${tenantId}/offering_items?edition=*&status=1`,
                {
                    headers: await getAuth(),
                },
            )
            .catch((error) => {
                if (error.status === 404) return { status: 404 };
            });

        if (offeringItemsResponse.status === 404)
            return console.log(`${tenantName} named tenant not found`);

        const offeringItems = offeringItemsResponse.data;

        if (
            offeringItems.items
                .filter((i) => i.quota)
                .every((i) => i.quota?.value === 0 && i.quota.overage === 0)
        )
            return console.log(`Quotas already set to 0 for ${tenantName}`);

        for (const item of offeringItems.items) {
            if (item.usage_name === "local_storage") item.status = 0;

            if (item?.quota) {
                item.quota = {
                    value: 0,
                    overage: 0,
                    version: item.quota.version || 0,
                };
            }
        }

        const data = {
            offering_items: offeringItems.items,
        };

        const updateResponse = await axios.put(
            `${baseUrl}/tenants/${tenantId}/offering_items`,
            data,
            {
                headers: await getAuth(),
            },
        );

        console.log(`Quota set to 0 for ${tenantName}`);
        return updateResponse.data;
    } catch (error) {
        console.error(
            `Error in setQuotaToZero for ${tenantName}:`,
            error.message || error,
        );
        throw error;
    }
}

export async function setQuotaPerGb(tenantId, tenantName, bytes) {
    try {
        const name = "pg_base_storage";

        const offeringItemsResponse = await axios
            .get(
                `${baseUrl}/tenants/${tenantId}/offering_items?edition=pck_per_gigabyte`,
                {
                    headers: await getAuth(),
                },
            )
            .catch((error) => {
                if (error.status === 404) return { status: 404 };
            });

        if (offeringItemsResponse.status === 404) {
            console.log(`${tenantName} named tenant not found`);
            return;
        }

        const offeringItems = offeringItemsResponse.data;

        for (const item of offeringItems.items) {
            if (
                item?.name === name &&
                item?.infra_id === "d46a4b2a-2631-4f76-84cd-07ce3aed3dde"
            ) {
                let data;
                if (item?.quota?.value === bytes) {
                    console.log(
                        `PerGB quota already ${bytes} for ${tenantName}`,
                    );
                    return;
                }

                if (!item?.quota) {
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
                                quota: {
                                    value: null,
                                    overage: null,
                                    version: 0,
                                },
                            },
                            {
                                name: "pg_base_servers",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                                quota: {
                                    value: null,
                                    overage: null,
                                    version: 0,
                                },
                            },
                            {
                                name: "pg_base_vms",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                                quota: {
                                    value: null,
                                    overage: null,
                                    version: 0,
                                },
                            },
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
                                quota: {
                                    value: null,
                                    overage: null,
                                    version:
                                        offeringItems.items.find(
                                            (i) =>
                                                i.name ===
                                                "pg_base_workstations",
                                        )?.quota?.version || 0,
                                },
                            },
                            {
                                name: "pg_base_servers",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                                quota: {
                                    value: null,
                                    overage: null,
                                    version:
                                        offeringItems.items.find(
                                            (i) => i.name === "pg_base_servers",
                                        )?.quota?.version || 0,
                                },
                            },
                            {
                                name: "pg_base_vms",
                                application_id: item.application_id,
                                edition: "pck_per_gigabyte",
                                status: 1,
                                locked: false,
                                quota: {
                                    value: null,
                                    overage: null,
                                    version:
                                        offeringItems.items.find(
                                            (i) => i.name === "pg_base_vms",
                                        )?.quota?.version || 0,
                                },
                            },
                        ],
                    };
                }

                const updateResponse = await axios.put(
                    `${baseUrl}/tenants/${tenantId}/offering_items`,
                    data,
                    {
                        headers: await getAuth(),
                    },
                );

                console.log(
                    `PerGB quota set to ${bytes} bytes for ${tenantName}`,
                );
                return updateResponse.data;
            }
        }

        throw new Error("Matching offering item not found");
    } catch (error) {
        console.error(
            `Error in setQuotaPerGb for ${tenantName}:`,
            error.message || error,
        );
        throw error;
    }
}

export async function setQuotaPerWorkload(tenantId, tenantName, quotas) {
    try {
        const offeringItemsResponse = await axios
            .get(
                `${baseUrl}/tenants/${tenantId}/offering_items?edition=pck_per_workload`,
                {
                    headers: await getAuth(),
                },
            )
            .catch((error) => {
                if (error.status === 404) return { status: 404 };
            });

        if (offeringItemsResponse.status === 404) {
            console.log(`${tenantName} named tenant not found`);
            return;
        }

        const offeringItems = offeringItemsResponse.data;

        const data = {
            offering_items: [
                {
                    name: "pw_base_storage",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "storage",
                    status: 1,
                    type: "infra",
                    infra_id: "d46a4b2a-2631-4f76-84cd-07ce3aed3dde",
                    measurement_unit: "bytes",
                },
                {
                    name: "local_storage",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    usage_name: "local_storage",
                    status: 1,
                    type: "count",
                    measurement_unit: "bytes",
                },
                {
                    name: "pw_base_workstations",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "workstations",
                    status: 1,
                    type: "count",
                    measurement_unit: "quantity",
                    quota: {
                        value: quotas.workstations || 0,
                        overage: 0,
                        version:
                            offeringItems.items.find(
                                (i) => i.name === "pw_base_workstations",
                            )?.quota?.version || 0,
                    },
                },
                {
                    name: "pw_base_servers",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "servers",
                    status: 1,
                    type: "count",
                    measurement_unit: "quantity",
                    quota: {
                        value: quotas.servers || 0,
                        overage: 0,
                        version:
                            offeringItems.items.find(
                                (i) => i.name === "pw_base_servers",
                            )?.quota?.version || 0,
                    },
                },
                {
                    name: "pw_base_vms",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "vms",
                    status: 1,
                    type: "count",
                    measurement_unit: "quantity",
                    quota: {
                        value: quotas.vms || 0,
                        overage: 0,
                        version:
                            offeringItems.items.find(
                                (i) => i.name === "pw_base_vms",
                            )?.quota?.version || 0,
                    },
                },
                {
                    name: "pw_base_m365_seats",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "mailboxes",
                    status: 1,
                    type: "count",
                    measurement_unit: "quantity",
                    quota: {
                        value: quotas.mailboxes || 0,
                        overage: 0,
                        version:
                            offeringItems.items.find(
                                (i) => i.name === "pw_base_m365_mailboxes",
                            )?.quota?.version || 0,
                    },
                },
                {
                    name: "pw_base_m365_mailboxes",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "o365_mailboxes",
                    status: 1,
                    type: "feature",
                    measurement_unit: "n/a",
                },
                {
                    name: "pw_base_web_hosting_servers",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "web_hosting_servers",
                    status: 1,
                    type: "count",
                    measurement_unit: "quantity",
                    quota: {
                        value: quotas.web_hosting_servers || 0,
                        overage: 0,
                        version:
                            offeringItems.items.find(
                                (i) => i.name === "pw_base_web_hosting_servers",
                            )?.quota?.version || 0,
                    },
                },
                {
                    name: "pw_base_nas",
                    application_id: "6e6d758d-8e74-3ae3-ac84-50eb0dff12eb",
                    edition: "pck_per_workload",
                    usage_name: "nas",
                    status: 1,
                    type: "count",
                    measurement_unit: "quantity",
                    quota: {
                        value: quotas.nas || 0,
                        overage: 0,
                        version:
                            offeringItems.items.find(
                                (i) => i.name === "pw_base_nas",
                            )?.quota?.version || 0,
                    },
                },
            ],
        };

        const updateResponse = await axios.put(
            `${baseUrl}/tenants/${tenantId}/offering_items`,
            data,
            {
                headers: await getAuth(),
            },
        );

        console.log(`PerWorkload quotas set for ${tenantName}`);
        return updateResponse.data;
    } catch (error) {
        console.error(
            `Error in setQuotaPerWorkload for ${tenantName}:`,
            error.message || error,
        );
        throw error;
    }
}

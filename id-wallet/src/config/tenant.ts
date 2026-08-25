// Single seeded tenant for the whole app - there is no tenants table yet, this is
// deliberately just a fixed uuid, not a foreign key.
//
// IMPORTANT: people.tenant_id and meetings.tenant_id both default to this value so every
// existing/new row backfills without a migration-time data pass. The moment a second
// tenant exists, drop that default and make tenant_id required at insert time instead
// (no default at all). Every call site that creates a person or meeting must be made to
// pass tenant_id explicitly at that point - better to fail loudly on a forgotten tenant_id
// than to silently mix one tenant's data into another's.
export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

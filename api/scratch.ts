import { db } from './src/db/index.js';
import { equipments } from './src/db/schema.js';

async function main() {
  const allEquipments = await db.select().from(equipments);
  console.log("=== Equipments in DB ===");
  console.table(allEquipments.map(e => ({
      id: e.id,
      hostname: e.hostname,
      patrimony: e.patrimony_tag,
      status: e.health_status,
      mac: e.mac_address
  })));
  
  const telemetryGrouped = await db.execute(
    `SELECT equipment_id, COUNT(*) as total_records, MAX(created_at) as last_seen 
     FROM telemetry_history 
     GROUP BY equipment_id`
  );
  
  console.log("\n=== Telemetry Summary by Equipment ===");
  console.table(telemetryGrouped);
  
  process.exit(0);
}

main().catch(console.error);

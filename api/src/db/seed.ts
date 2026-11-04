import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { users } from "./schema.js";
import { hashPassword } from "../lib/password.js";

const SEED_USERS = [
    {
        id: "a1000000-0000-4000-8000-000000000001",
        name: "Ana Gestora (Admin)",
        email: "gestor@vanguard.local",
        role: "GESTOR" as const,
        password: "Vanguard@2026",
    },
    {
        id: "b2000000-0000-4000-8000-000000000002",
        name: "Bruno Técnico (NOC)",
        email: "tecnico@vanguard.local",
        role: "TECNICO" as const,
        password: "Tecnico@2026",
    },
];

async function main() {
    console.log("=== Vanguard Seed: Usuários Iniciais (GESTOR / TECNICO) ===");

    for (const seed of SEED_USERS) {
        const password_hash = await hashPassword(seed.password);
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, seed.email))
            .limit(1);

        if (existing.length > 0) {
            await db
                .update(users)
                .set({
                    name: seed.name,
                    role: seed.role,
                    password_hash,
                })
                .where(eq(users.id, existing[0]!.id));
            console.log(`[ATUALIZADO] ${seed.role}: ${seed.email} (senha: ${seed.password})`);
        } else {
            await db.insert(users).values({
                id: seed.id,
                name: seed.name,
                email: seed.email,
                role: seed.role,
                password_hash,
            });
            console.log(`[CRIADO]     ${seed.role}: ${seed.email} (senha: ${seed.password})`);
        }
    }

    console.log("Seed concluído com sucesso.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Erro ao executar seed:", err);
    process.exit(1);
});


import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

/**
 * Camada de acesso a dados de usuários.
 * Isola o Drizzle dos controllers de autenticação e permite substituição
 * por dublês (mocks) nos testes automatizados, sem banco real.
 */
export const userRepository = {
    async findByEmail(email: string): Promise<UserRecord | undefined> {
        const [user] = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
            .limit(1);
        return user;
    },

    async findById(id: string): Promise<UserRecord | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return user;
    },

    async list(): Promise<UserRecord[]> {
        return db.select().from(users);
    },

    async create(values: NewUserRecord): Promise<UserRecord> {
        const [created] = await db.insert(users).values(values).returning();
        return created!;
    },

    async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
        await db.update(users).set({ password_hash: passwordHash }).where(eq(users.id, id));
    },

    async deleteById(id: string): Promise<UserRecord | undefined> {
        const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
        return deleted;
    },
};


import {
    createHash,
    randomBytes,
    scrypt,
    timingSafeEqual,
    type ScryptOptions,
} from "node:crypto";

/**
 * Hash de senhas com scrypt (RFC 7914) — função de derivação de chave
 * "memory-hard", nativa do Node.js (sem dependências nativas, compatível
 * com o runtime serverless da Vercel).
 *
 * Formato armazenado em `users.password_hash` (auto-descritivo, permite
 * aumentar o custo no futuro sem quebrar hashes antigos):
 *
 *   scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>
 */

const SCRYPT_N = 2 ** 15; // fator de custo CPU/memória
const SCRYPT_R = 8; // tamanho do bloco
const SCRYPT_P = 1; // paralelização
const KEY_LENGTH = 64; // 512 bits
const SALT_LENGTH = 16; // 128 bits
const MAX_MEMORY = 64 * 1024 * 1024; // 64 MiB (128 * N * r = 32 MiB)

const LEGACY_SHA256_REGEX = /^[a-f0-9]{64}$/i;

function deriveKey(
    password: string,
    salt: Buffer,
    keyLength: number,
    options: ScryptOptions
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password.normalize("NFKC"), salt, keyLength, options, (err, key) => {
            if (err) reject(err);
            else resolve(key);
        });
    });
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt, KEY_LENGTH, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: MAX_MEMORY,
    });

    return [
        "scrypt",
        SCRYPT_N,
        SCRYPT_R,
        SCRYPT_P,
        salt.toString("base64"),
        key.toString("base64"),
    ].join("$");
}

export interface PasswordVerification {
    valid: boolean;
    /** true quando o hash armazenado usa formato/custo antigo e deve ser regenerado. */
    needsRehash: boolean;
}

export async function verifyPassword(
    password: string,
    storedHash: string | null | undefined
): Promise<PasswordVerification> {
    if (!storedHash) {
        return { valid: false, needsRehash: false };
    }

    if (storedHash.startsWith("scrypt$")) {
        const parts = storedHash.split("$");
        if (parts.length !== 6) return { valid: false, needsRehash: false };

        const [, nStr, rStr, pStr, saltB64, hashB64] = parts as [
            string, string, string, string, string, string,
        ];
        const N = Number(nStr);
        const r = Number(rStr);
        const p = Number(pStr);
        const expected = Buffer.from(hashB64, "base64");

        if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || expected.length === 0) {
            return { valid: false, needsRehash: false };
        }

        const actual = await deriveKey(password, Buffer.from(saltB64, "base64"), expected.length, {
            N,
            r,
            p,
            maxmem: Math.max(MAX_MEMORY, 256 * N * r),
        });

        const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
        const needsRehash = valid && (N < SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P);
        return { valid, needsRehash };
    }

    // Compatibilidade: versões anteriores do frontend gravavam SHA-256 hex
    // (sem sal). Aceitamos uma única vez e migramos para scrypt no login.
    if (LEGACY_SHA256_REGEX.test(storedHash)) {
        const actual = createHash("sha256").update(password, "utf8").digest();
        const expected = Buffer.from(storedHash, "hex");
        const valid = timingSafeEqual(actual, expected);
        return { valid, needsRehash: valid };
    }

    return { valid: false, needsRehash: false };
}

let dummyHashPromise: Promise<string> | undefined;

/**
 * Executa uma verificação "falsa" com custo idêntico ao de uma real.
 * Usado quando o e-mail não existe, para que o tempo de resposta do login
 * não revele quais e-mails estão cadastrados (user enumeration).
 */
export async function burnPasswordVerification(password: string): Promise<void> {
    dummyHashPromise ??= hashPassword(randomBytes(32).toString("hex"));
    await verifyPassword(password, await dummyHashPromise);
}

/**
 * Comparação de segredos em tempo constante, inclusive quando os tamanhos
 * diferem: ambos os lados são reduzidos a um digest SHA-256 de 32 bytes
 * antes do `timingSafeEqual`, eliminando o vazamento do comprimento.
 */
export function safeCompare(provided: string, expected: string): boolean {
    const a = createHash("sha256").update(provided, "utf8").digest();
    const b = createHash("sha256").update(expected, "utf8").digest();
    return timingSafeEqual(a, b);
}


import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

	PORT: z.coerce.number().default(3000),

	DATABASE_URL: z.string().min(1),

	BETTER_AUTH_SECRET: z.string().min(1),

	BETTER_AUTH_URL: z.string().url(),

	GOOGLE_CLIENT_ID: z.string().min(1).optional(),

	GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

	SMTP_USER: z.string().email(),

	SMTP_PASS: z.string().min(1),

	FACE_API_MODELS_PATH: z.string().min(1),

	FACE_MATCH_THRESHOLD: z.coerce.number().default(0.55),

	OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),

	OLLAMA_EMBEDDING_MODEL: z.string().min(1).default("nomic-embed-text"),

	OLLAMA_CHAT_MODEL: z.string().min(1).default("llama3.2:3b"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
	process.exit(1);
}

export const env = parsed.data;

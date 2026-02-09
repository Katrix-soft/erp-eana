
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

/**
 * EANA ERP - System Bootstrap Orchestrator
 * Arquitectura: Módulos dinámicos con ejecución secuencial e idempotente.
 * Esta versión está optimizada para ejecutarse tanto localmente como en Docker.
 */

// Cargar .env: El orden importa. Cargamos primero los de la raíz y al final el de backend/
// para que el específico (localhost) sobreescriba al genérico (docker/postgres)
const envPaths = [
    path.join(__dirname, '../../.env'), // Root .env
    path.join(process.cwd(), '../.env'), // Root .env (si se corre desde backend)
    path.join(__dirname, '../.env'),    // Backend .env
    path.join(process.cwd(), '.env'),   // Backend .env (si se corre desde backend)
];

for (const p of envPaths) {
    if (fs.existsSync(p)) {
        dotenv.config({ path: p, override: true });
    }
}

const Log = {
    info: (msg: string) => console.log(`[${new Date().toISOString()}] [INFO]  🔵 ${msg}`),
    success: (msg: string) => console.log(`[${new Date().toISOString()}] [SUCCESS] ✅ ${msg}`),
    warn: (msg: string) => console.log(`[${new Date().toISOString()}] [WARN]  ⚠️  ${msg}`),
    error: (msg: string, err?: any) => {
        console.error(`[${new Date().toISOString()}] [ERROR] ❌ ${msg}`);
        if (err) {
            if (err.stack) console.error(err.stack);
            else console.error(err);
        }
    }
};

interface BootstrapTask {
    name: string;
    description: string;
    fileName: string;
    critical: boolean;
}

class BootstrapOrchestrator {
    private db: Client;
    private flags: string[];
    private isProd: boolean;
    private scriptsDir: string;

    constructor() {
        this.flags = process.argv.slice(2);
        this.isProd = __filename.endsWith('.js');
        this.scriptsDir = __dirname;

        const port = parseInt(process.env.POSTGRES_PORT || '5432');

        Log.info(`Configurando conexión a DB: ${process.env.POSTGRES_HOST || 'localhost'}:${port} (DB: ${process.env.POSTGRES_DB || 'cns_db'})`);

        this.db = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: port,
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
            database: process.env.POSTGRES_DB || 'cns_db',
        });
    }

    private async ensureControlTable() {
        try {
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS "_bootstrap_history" (
                    "id" SERIAL PRIMARY KEY,
                    "task_name" VARCHAR(255) UNIQUE NOT NULL,
                    "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "status" VARCHAR(50) NOT NULL
                );
            `);
        } catch (e) {
            Log.error('Error creating control table. Verifique credenciales de DB.', e);
            throw e;
        }
    }

    private async isTaskExecuted(name: string): Promise<boolean> {
        const res = await this.db.query('SELECT id FROM "_bootstrap_history" WHERE task_name = $1 AND status = $2', [name, 'SUCCESS']);
        return (res.rowCount || 0) > 0;
    }

    private async markTaskStatus(name: string, status: 'SUCCESS' | 'FAILED') {
        await this.db.query(`
            INSERT INTO "_bootstrap_history" (task_name, status) 
            VALUES ($1, $2) 
            ON CONFLICT (task_name) DO UPDATE SET status = $2, executed_at = NOW()`,
            [name, status]);
    }

    private getTasks(): BootstrapTask[] {
        const tasks: BootstrapTask[] = [
            { name: 'migrate', description: 'Database Schema Sync', fileName: 'migrations/sync-schema', critical: true },
            { name: 'seed-basic', description: 'Basic Data (FIRs, Posts)', fileName: 'seeds/seed-basic-data', critical: true },
            { name: 'seed-admin', description: 'Admin User Setup', fileName: 'seeds/ensure-admin', critical: true },
            { name: 'seed-airports', description: 'Airports Master Load', fileName: 'seeds/seed-airports', critical: false },
            { name: 'seed-nav', description: 'Navigation Equipment Load', fileName: 'seeds/seed-nav', critical: false },
            { name: 'seed-chat', description: 'Chat Rooms Initialization', fileName: 'seeds/seed-chat-rooms', critical: false },
            { name: 'seed-forum', description: 'Forum Initial Data', fileName: 'seeds/seed-forum-chat', critical: false },
            { name: 'update-freq', description: 'VHF Frequencies Update', fileName: 'maintenance/update-frequencies', critical: false },
            { name: 'import-csv', description: 'Full CSV Data Restoration', fileName: 'imports/restore-from-csv', critical: false },
            { name: 'verify', description: 'System Verification Summary', fileName: 'verifications/verify-summary', critical: false },
        ];

        const validTaskFlags = this.flags.filter(f => !f.startsWith('--all') && !f.startsWith('--force'));

        if (validTaskFlags.length > 0) {
            return tasks.filter(t => validTaskFlags.includes(`--${t.name}`));
        }

        return tasks;
    }

    public async run() {
        Log.info(`🚀 Starting Bootstrap Orchestration (ENV: ${this.isProd ? 'PROD' : 'DEV'})...`);

        const maxRetries = 5;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                // Re-initialize client for each attempt to avoid 'Client has already been connected' error
                this.db = new Client({
                    host: process.env.POSTGRES_HOST || 'localhost',
                    port: parseInt(process.env.POSTGRES_PORT || '5432'),
                    user: process.env.POSTGRES_USER || 'postgres',
                    password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
                    database: process.env.POSTGRES_DB || 'cns_db',
                });

                await this.db.connect();
                Log.success('✅ Database connected successfully.');
                break;
            } catch (err) {
                retryCount++;
                const errorMessage = err instanceof Error ? err.message : String(err);
                Log.warn(`Database connection failed (Attempt ${retryCount}/${maxRetries}): ${errorMessage}`);
                // Ensure client is ended if possible, though new assignment will GC it eventually
                try { await this.db.end(); } catch (e) { }

                if (retryCount >= maxRetries) {
                    Log.error('❌ Could not connect to database after multiple attempts.');
                    process.exit(1);
                }
                const waitTime = 2000 * retryCount;
                Log.info(`Waiting ${waitTime / 1000}s before retrying...`);
                await new Promise(res => setTimeout(res, waitTime));
            }
        }

        try {
            await this.ensureControlTable();

            const tasks = this.getTasks();
            const force = this.flags.includes('--force');

            for (const task of tasks) {
                const alreadyDone = await this.isTaskExecuted(task.name);

                if (alreadyDone && !force) {
                    Log.info(`Skipping [${task.name}] - already executed. Use --force to rerun.`);
                    continue;
                }

                Log.info(`[${task.name.toUpperCase()}] Running: ${task.description}...`);

                try {
                    const extension = this.isProd ? '.js' : '.ts';
                    const scriptPath = path.join(this.scriptsDir, `${task.fileName}${extension}`);

                    if (!fs.existsSync(scriptPath)) {
                        Log.warn(`Script not found: ${scriptPath}. Skipping.`);
                        continue;
                    }

                    let command: string;
                    let args: string[];

                    if (this.isProd) {
                        command = 'node';
                        args = [scriptPath];
                    } else {
                        command = 'npx';
                        args = ['ts-node', '--transpile-only', scriptPath];
                    }

                    const { spawn } = await import('child_process');

                    await new Promise<void>((resolve, reject) => {
                        const child = spawn(command, args, {
                            stdio: 'inherit',
                            env: { ...process.env, BOOTSTRAP_MODE: 'true' },
                            shell: process.platform === 'win32'
                        });

                        child.on('close', (code) => {
                            if (code === 0) resolve();
                            else reject(new Error(`Exit code ${code}`));
                        });

                        child.on('error', (err) => {
                            reject(err);
                        });
                    });

                    await this.markTaskStatus(task.name, 'SUCCESS');
                    Log.success(`Task [${task.name}] completed.`);

                } catch (error) {
                    await this.markTaskStatus(task.name, 'FAILED');
                    Log.error(`Task [${task.name}] failed!`, error);

                    if (task.critical) {
                        Log.error('CRITICAL ERROR: Aborting bootstrap sequence.');
                        process.exit(1);
                    }
                }
            }

            Log.success('🎉 Full Bootstrap process completed successfully.');
        } catch (err) {
            Log.error('Fatal error during bootstrap', err);
            process.exit(1);
        } finally {
            await this.db.end().catch(() => { });
        }
    }
}

new BootstrapOrchestrator().run();

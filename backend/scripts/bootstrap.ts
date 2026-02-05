
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

/**
 * EANA ERP - System Bootstrap Orchestrator
 * Arquitectura: Módulos dinámicos con ejecución secuencial e idempotente.
 * Funciona tanto en Desarrollo (TS) como en Producción (JS/Dist).
 */

dotenv.config();

// --- Utilidad de Logging para Producción ---
const Log = {
    info: (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] 🔵 ${msg}`),
    success: (msg: string) => console.log(`[${new Date().toISOString()}] [SUCCESS] ✅ ${msg}`),
    warn: (msg: string) => console.log(`[${new Date().toISOString()}] [WARN] ⚠️ ${msg}`),
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
    fileName: string; // Nombre del archivo sin extensión
    critical: boolean; // Si falla, se detiene el bootstrap
}

class BootstrapOrchestrator {
    private db: Client;
    private flags: string[];
    private isProd: boolean;
    private scriptsDir: string;

    constructor() {
        this.flags = process.argv.slice(2);
        // Detectamos si estamos en dist o en src/scripts
        this.isProd = __filename.endsWith('.js');
        this.scriptsDir = __dirname;

        this.db = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5434'),
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
            database: process.env.POSTGRES_DB || 'cns_db',
        });
    }

    // --- Control de Idempotencia mediante DB ---
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
            Log.error('Error creating control table', e);
            throw e;
        }
    }

    private async isTaskExecuted(name: string): Promise<boolean> {
        const res = await this.db.query('SELECT id FROM "_bootstrap_history" WHERE task_name = $1 AND status = $2', [name, 'SUCCESS']);
        return res.rowCount > 0;
    }

    private async markTaskStatus(name: string, status: 'SUCCESS' | 'FAILED') {
        await this.db.query(`
            INSERT INTO "_bootstrap_history" (task_name, status) 
            VALUES ($1, $2) 
            ON CONFLICT (task_name) DO UPDATE SET status = $2, executed_at = NOW()`,
            [name, status]);
    }

    // --- Definición de la Secuencia ---
    private getTasks(): BootstrapTask[] {
        const tasks: BootstrapTask[] = [
            { name: 'migrate', description: 'Database Schema Sync/Migration', fileName: 'sync-schema', critical: true },
            { name: 'seed-admin', description: 'Ensure Admin User', fileName: 'ensure-admin', critical: true },
            { name: 'seed-airports', description: 'Seed Airports Data', fileName: 'seed-airports', critical: false },
            { name: 'import-csv', description: 'Restore Data from CSVs', fileName: 'restore-from-csv', critical: false },
            { name: 'verify', description: 'Final System Summary', fileName: 'verify-summary', critical: false },
        ];

        // Si se proveen flags específicos (que no sean --all o --force) filtrados
        const validTaskFlags = this.flags.filter(f => !f.startsWith('--all') && !f.startsWith('--force'));

        if (validTaskFlags.length > 0) {
            return tasks.filter(t => validTaskFlags.includes(`--${t.name}`));
        }

        return tasks;
    }

    public async run() {
        Log.info(`🚀 Starting Bootstrap Orchestration (ENV: ${this.isProd ? 'PROD' : 'DEV'})...`);

        try {
            await this.db.connect();
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
                    // Resolvemos la ruta del archivo (soporte .ts y .js)
                    const extension = this.isProd ? '.js' : '.ts';
                    const scriptPath = path.join(this.scriptsDir, `${task.fileName}${extension}`);

                    if (!fs.existsSync(scriptPath)) {
                        throw new Error(`Script file not found: ${scriptPath}`);
                    }

                    // Determinar el comando a ejecutar
                    let command: string;
                    let args: string[];

                    if (this.isProd) {
                        command = 'node';
                        args = [scriptPath];
                    } else {
                        // En DEV usamos npx ts-node
                        // Usamos --transpile-only para velocidad
                        command = 'npx';
                        args = ['ts-node', '--transpile-only', scriptPath];
                    }

                    const { spawn } = await import('child_process');

                    await new Promise<void>((resolve, reject) => {
                        const child = spawn(command, args, {
                            stdio: 'inherit',
                            env: { ...process.env, BOOTSTRAP_MODE: 'true' }
                        });

                        child.on('close', (code) => {
                            if (code === 0) resolve();
                            else reject(new Error(`Script [${task.fileName}] exited with code ${code}`));
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
                        Log.error('CRITICAL ERROR: Aborting bootstrap.');
                        process.exit(1);
                    }
                }
            }

            Log.success('🎉 Full Bootstrap process completed.');
        } catch (err) {
            Log.error('Fatal error during bootstrap', err);
            process.exit(1);
        } finally {
            await this.db.end();
        }
    }
}

// Iniciar
new BootstrapOrchestrator().run();

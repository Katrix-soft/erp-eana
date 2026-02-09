
const { Client } = require('pg');

async function seedTableros() {
    const client = new Client({
        host: 'postgres',
        port: 5432,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db'
    });

    try {
        await client.connect();
        console.log('🌱 Seed de Tableros Eléctricos...');

        // 1. Obtener ID de un aeropuerto (ej: SAEF - Ezeiza o SANE)
        const aptRes = await client.query("SELECT id FROM aeropuertos WHERE codigo = 'CBA' LIMIT 1");
        if (aptRes.rows.length === 0) {
            console.log('❌ Aeropuerto CBA no encontrado');
            return;
        }
        const aptId = aptRes.rows[0].id;

        // Limpiar previos (opcional para idempotencia)
        // await client.query("DELETE FROM componentes_tablero");
        // await client.query("DELETE FROM tableros_electricos");

        // 2. Insertar Tablero TS1
        const tableroRes = await client.query(`
            INSERT INTO tableros_electricos (nombre, ubicacion, descripcion, aeropuerto_id, estado, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
        `, ['TS1', 'Sala de Energía - Planta Baja', 'Tablero Seccional de Distribución 1', aptId, 'OK']);

        const tableroId = tableroRes.rows[0].id;

        // 3. Insertar Componentes para TS1
        const componentes = [
            ['TERMICA', 'C1', '16A', 'Schneider', 'iC60N', 2],
            ['TERMICA', 'C2', '25A', 'Schneider', 'iC60N', 2],
            ['DISYUNTOR', 'D1', '40A/30mA', 'Schneider', 'iID', 4],
            ['TERMICA', 'C3', '10A', 'ABB', 'S200', 1],
            ['PROTECCION_SOBRE_TENSION', 'DPS', '20kA', 'Finder', '7P', 4]
        ];

        for (const comp of componentes) {
            await client.query(`
                INSERT INTO componentes_tablero (tipo, nombre, amperaje, marca, modelo, polos, tablero_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [comp[0], comp[1], comp[2], comp[3], comp[4], comp[5], tableroId]);
        }

        console.log('✅ Tablero TS1 y sus térmicas creados en SAEF!');

    } catch (err) {
        console.error('❌ Error en Seed:', err);
    } finally {
        await client.end().catch(() => { });
    }
}

seedTableros();


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
        console.log('🌱 Seed de Tableros Eléctricos (Global)...');

        const codes = ['CBA', 'ANC', 'EZE', 'AER', 'MOR', 'PAL'];

        for (const code of codes) {
            const aptRes = await client.query("SELECT id FROM aeropuertos WHERE codigo = $1 LIMIT 1", [code]);
            if (aptRes.rows.length === 0) {
                console.log(`⚠️ Aeropuerto ${code} no encontrado, saltando...`);
                continue;
            }
            const aptId = aptRes.rows[0].id;

            // Insertar Tablero Principal para este aeropuerto
            const tableroRes = await client.query(`
                INSERT INTO tableros_electricos (nombre, ubicacion, descripcion, aeropuerto_id, estado, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id
            `, [`TABLERO PRINCIPAL ${code}`, 'SALA DE ENERGÍA', `Tablero de distribución general del aeropuerto ${code}`, aptId, 'OK']);

            const tableroId = tableroRes.rows[0].id;

            // Insertar Componentes base
            const componentes = [
                ['TERMICA', 'INTERRUPTOR GENERAL', '63A', 'Schneider', 'Generic', 4],
                ['DISYUNTOR', 'DIFERENCIAL GENERAL', '40A/30mA', 'Schneider', 'Generic', 4],
                ['PROTECCION_SOBRE_TENSION', 'DESCARGADOR', '20kA', 'Finder', 'Generic', 4]
            ];

            for (const comp of componentes) {
                await client.query(`
                    INSERT INTO componentes_tablero (tipo, nombre, amperaje, marca, modelo, polos, tablero_id, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                `, [comp[0], comp[1], comp[2], comp[3], comp[4], comp[5], tableroId]);
            }
            console.log(`✅ Tablero para ${code} creado con éxito.`);
        }

    } catch (err) {
        console.error('❌ Error en Seed:', err);
    } finally {
        await client.end().catch(() => { });
    }
}

seedTableros();

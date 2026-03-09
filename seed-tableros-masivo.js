
const { Client } = require('pg');

async function seedAllTableros() {
    const client = new Client({
        host: 'postgres',
        port: 5432,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db'
    });

    try {
        await client.connect();
        console.log('🌱 Seed Masivo de Tableros Eléctricos para TODOS los aeropuertos...');

        // 1. Obtener todos los aeropuertos
        const aerysRes = await client.query("SELECT id, codigo, nombre FROM aeropuertos");
        const aeropuertos = aerysRes.rows;

        console.log(`Encontrados ${aeropuertos.length} aeropuertos. Generando tableros...`);

        for (const apt of aeropuertos) {
            // Verificar si ya tiene tableros para no duplicar masivamente
            const checkRes = await client.query("SELECT id FROM tableros_electricos WHERE aeropuerto_id = $1 LIMIT 1", [apt.id]);

            if (checkRes.rows.length > 0) {
                console.log(`⏭️ Aeropuerto ${apt.codigo} ya tiene tableros. Saltando.`);
                continue;
            }

            // Insertar Tablero Principal para este aeropuerto
            const tableroRes = await client.query(`
                INSERT INTO tableros_electricos (nombre, ubicacion, descripcion, aeropuerto_id, estado, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id
            `, [`TABLERO PRINCIPAL ${apt.codigo}`, 'SALA TÉCNICA / ENERGÍA', `Tablero de distribución general - ${apt.nombre}`, apt.id, 'OK']);

            const tableroId = tableroRes.rows[0].id;

            // Insertar Componentes base (Térmica, Disyuntor, DPS)
            const componentes = [
                ['TERMICA', 'LLAVE GENERAL', '63A', 'Schneider', 'Multi9', 4],
                ['DISYUNTOR', 'DIFERENCIAL Gral', '40A/30mA', 'Schneider', 'Acti9', 4],
                ['TERMICA', 'UPS 1', '32A', 'Schneider', 'iK60', 2],
                ['TERMICA', 'AIRE ACOND. 1', '25A', 'Schneider', 'iK60', 2],
                ['PROTECCION_SOBRE_TENSION', 'DPS CATEGORIA II', '40kA', 'Finder', '7P', 4]
            ];

            for (const comp of componentes) {
                await client.query(`
                    INSERT INTO componentes_tablero (tipo, nombre, amperaje, marca, modelo, polos, tablero_id, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                `, [comp[0], comp[1], comp[2], comp[3], comp[4], comp[5], tableroId]);
            }
            console.log(`✅ Creado tablero para: ${apt.codigo} (${apt.nombre})`);
        }

        console.log('🎉 Seed masivo completado con éxito.');

    } catch (err) {
        console.error('❌ Error en Seed:', err);
    } finally {
        await client.end().catch(() => { });
    }
}

seedAllTableros();

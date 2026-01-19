

const prisma = new PrismaClient();
async function main() {
    console.log('--- Database Check ---');
    const u = await prisma.user.count();
    const p = await prisma.personal.count();
    const a = await prisma.aeropuerto.count();
    const f = await prisma.fir.count();
    const c = await prisma.comunicaciones.count();
    const n = await prisma.navegacion.count();
    const v = await prisma.vigilancia.count();
    const e = await prisma.energia.count();
    const vhf = await prisma.vhf.count();
    const equipo = await prisma.equipo.count();

    console.log('Users:', u);
    console.log('Personal:', p);
    console.log('Aeropuertos:', a);
    console.log('FIRs:', f);
    console.log('Comunicaciones:', c);
    console.log('Navegacion:', n);
    console.log('Vigilancia:', v);
    console.log('Energia:', e);
    console.log('Unified VHF:', vhf);
    console.log('Unified Equipos:', equipo);
    await prisma.$disconnect();
}
main();

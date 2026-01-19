
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

async function testAuthLogic() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);

    console.log('--- Testing Auth Logic ---');

    console.log('1. Testing "admin@eana.com" (Email)');
    const r1 = await authService.validateUser('admin@eana.com', 'admin1234');
    console.log('Result:', r1 ? 'SUCCESS' : 'FAILED');

    console.log('\n2. Testing "admin" (Username)');
    const r2 = await authService.validateUser('admin', 'admin1234');
    console.log('Result:', r2 ? 'SUCCESS' : 'FAILED');

    console.log('\n3. Testing "igsanchez" (Username)');
    const r3 = await authService.validateUser('igsanchez', 'Eana2025');
    console.log('Result:', r3 ? 'SUCCESS' : 'FAILED');
    if (r3) console.log('Matched:', r3.email);

    console.log('\n--- Debugging "admin" ---');
    const userAdmin = await authService.validateUser('admin', 'admin1234');
    if (userAdmin) console.log('MATCHED USER for "admin":', userAdmin.email, userAdmin.personal?.nombre, userAdmin.personal?.apellido);

    await app.close();
}

testAuthLogic();

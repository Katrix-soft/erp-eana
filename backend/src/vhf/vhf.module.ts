import { Module } from '@nestjs/common';
import { VhfService } from './vhf.service';
import { VhfController } from './vhf.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Vhf } from './entities/vhf.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vhf, Personal, Aeropuerto])],
    controllers: [VhfController],
    providers: [VhfService],
})
export class VhfModule { }

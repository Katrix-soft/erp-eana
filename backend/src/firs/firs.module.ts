import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirsService } from './firs.service';
import { FirsController } from './firs.controller';
import { Fir } from './entities/fir.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Fir])],
    controllers: [FirsController],
    providers: [FirsService],
    exports: [FirsService],
})
export class FirsModule { }

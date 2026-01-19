import { PartialType } from '@nestjs/swagger';
import { CreateFrecuenciaDto } from './create-frecuencia.dto';

export class UpdateFrecuenciaDto extends PartialType(CreateFrecuenciaDto) { }

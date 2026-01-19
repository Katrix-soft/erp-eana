import { PartialType } from '@nestjs/swagger';
import { CreateVhfDto } from './create-vhf.dto';

export class UpdateVhfDto extends PartialType(CreateVhfDto) { }

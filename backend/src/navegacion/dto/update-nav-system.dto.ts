import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateNavSystemDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsObject()
    @IsOptional()
    main?: any;

    @IsObject()
    @IsOptional()
    standby?: any;
}

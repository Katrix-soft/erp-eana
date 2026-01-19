import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChecklistDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    estacion: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    folio?: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    fecha: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    estado?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    observaciones?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    al_aire?: boolean;

    // Mediciones
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    v_rectificador?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    v_1hora?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    modulacion?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    modulacion_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    roe_local?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    roe_externo?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    roe_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    potencia_local?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    potencia_externo?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    potencia_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    piso_ruido?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    piso_ruido_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    squelch?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    squelch_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    puesta_tierra?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    puesta_tierra_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    dias_sin_alternancia?: string;

    // Items del Checklist (Principal)
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    conmutacion?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    conmutacion_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    estado_baterias?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    estado_baterias_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sistema_irradiante?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sistema_irradiante_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    cableado_rf?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    cableado_rf_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    balizamiento?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    balizamiento_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    switch_ethernet?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    switch_ethernet_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    cabeza_control?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    cabeza_control_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    em100?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    em100_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    limpieza?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    limpieza_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    tablero_electrico?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    tablero_electrico_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reporte_digital?: string;
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reporte_digital_obs?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sistema_energia?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    estado_operativo?: string;

    // Firmas
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    firmaTecnico?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fechaFirmaTecnico?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    firmaCoordinador?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fechaFirmaCoordinador?: string;

    // Relaciones (Permissive with types, mapped in service)
    @ApiProperty({ required: false })
    @IsOptional()
    equipoId?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    aeropuertoId?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    tecnicoId?: any;
}

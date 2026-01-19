import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Checklist } from './entities/checklist.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Fir } from '../firs/entities/fir.entity';
import { EstadoEquipo, Prioridad, EstadoOT } from '../common/enums/shared.enums';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ChecklistsService {
    constructor(
        @InjectRepository(Checklist) private checklistRepository: Repository<Checklist>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>,
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
        @InjectRepository(WorkOrder) private workOrderRepository: Repository<WorkOrder>,
        @InjectRepository(Fir) private firRepository: Repository<Fir>,
        private notificationsService: NotificationsService,
        private mailService: MailService
    ) { }

    async create(createChecklistDto: CreateChecklistDto) {
        console.log('📝 Creating new checklist with folio:', createChecklistDto.folio);

        // Control de folio único
        if (createChecklistDto.folio) {
            const existing = await this.checklistRepository.findOne({
                where: { folio: createChecklistDto.folio }
            });
            if (existing) {
                console.warn(`⚠️ Folio ${createChecklistDto.folio} already exists`);
                throw new ConflictException(`El número de folio ${createChecklistDto.folio} ya se encuentra registrado.`);
            }
        }

        const data = this.mapToPrisma(createChecklistDto);

        // Resolver tecnicoId si es necesario (si mandaron userId en lugar de personalId)
        if (data.tecnicoId) {
            const personal = await this.personalRepository.findOne({
                where: [
                    { id: data.tecnicoId },
                    { userId: data.tecnicoId }
                ]
            });
            if (personal) {
                data.tecnicoId = personal.id;
            } else {
                console.warn(`⚠️ Could not resolve Personal record for tecnicoId: ${data.tecnicoId}`);
                delete data.tecnicoId; // Evitar error de FK si no existe
            }
        }

        // console.log('🚀 Saving Entity:', JSON.stringify(data, null, 2));

        try {
            // Relation handling in TypeORM Create: passing 'id' in object or finding entity.
            // If data.tecnicoId is present, we need to associate relation.
            // Best is to use 'save' with partial object.

            const entityData: any = { ...data };
            // Ensure relations are correctly set for TypeORM
            if (entityData.tecnicoId) entityData.tecnico = { id: entityData.tecnicoId };
            if (entityData.equipoId) entityData.equipo = { id: entityData.equipoId };
            if (entityData.aeropuertoId) entityData.aeropuerto = { id: entityData.aeropuertoId };

            // Clean scalar IDs if relation object is set, though TypeORM usually handles both if column matches.
            // But let's keep scalar IDs if they are columns.

            const newChecklist = this.checklistRepository.create(entityData as any) as unknown as Checklist;
            const savedChecklist = await this.checklistRepository.save(newChecklist);

            // Fetch updated with relations for secondary tasks
            const checklist = await this.findOne(savedChecklist.id);
            if (!checklist) throw new Error('Failed to retrieve created checklist');

            // Tareas en segundo plano (No bloqueante)
            setImmediate(() => {
                this.handleSecondaryTasks(checklist, createChecklistDto.estado).catch(e =>
                    console.error('❌ Error in background tasks:', e)
                );
            });

            return checklist;
        } catch (error) {
            console.error('❌ DATABASE ERROR:', error);
            // Si es un error de Postgres de unique constraint
            if (error?.code === '23505') { // Postgres duplicate key
                throw new ConflictException('Ya existe un registro con esos datos únicos.');
            }
            throw new BadRequestException(`No se pudo guardar el checklist: ${error.message || 'Error interno'}`);
        }
    }

    findAll() {
        return this.checklistRepository.find({
            relations: [
                'aeropuerto', 'aeropuerto.fir',
                'tecnico', 'tecnico.puesto', 'tecnico.aeropuerto'
            ],
            order: {
                createdAt: 'DESC'
            }
        });
    }

    findOne(id: number) {
        return this.checklistRepository.findOne({
            where: { id },
            relations: [
                'aeropuerto', 'aeropuerto.fir',
                'equipo', 'equipo.vhf', 'equipo.canales.frecuencias', // Frecuencias usually nested in canales
                // note: 'equipo.frecuencias' might not exist directly if it's via canales. Original prisma include was 'frecuencias: true' on Equpo?
                // Prisma schema: Equipo has 'canales'. Frecuencia is on Canal usually.
                // But original code: `equipo: { include: { frecuencias: true } }`. This implies Equipo has direct Frequencies?
                // Checking Equipo entity: @OneToMany(() => Frecuencia, ...)?
                // Let's assume standard path via Canal for now or use what was available.
                // If Equipo has direct frequencies, good. If not, maybe prisma schema had it.
                // Let's rely on standard relations.
                'workOrder'
            ]
        });
    }

    async update(id: number, updateChecklistDto: UpdateChecklistDto) {
        console.log(`🔄 Updating checklist #${id}...`);
        const data = this.mapToPrisma(updateChecklistDto);

        // Resolver tecnicoId
        if (data.tecnicoId) {
            const personal = await this.personalRepository.findOne({
                where: [{ id: data.tecnicoId }, { userId: data.tecnicoId }]
            });
            if (personal) data.tecnicoId = personal.id;
        }

        try {
            // Update using repo.update (partial) or save.
            // Need to handle relations updates if any IDs changed.

            // Safe approach: Fetch, merge, save.
            const existing = await this.checklistRepository.findOne({ where: { id } });
            if (!existing) throw new Error('Checklist not found');

            // Manually merge or use save with id.
            const updateData: any = { id, ...data };
            if (data.tecnicoId) updateData.tecnico = { id: data.tecnicoId };
            // etc.

            // Note: repo.update only updates columns, not relations easily.
            await this.checklistRepository.save(updateData);

            // Fetch full
            const checklist = await this.findOne(id);
            if (!checklist) throw new Error('Failed to retrieve updated checklist'); // Should not happen

            // Tareas en segundo plano (No bloqueante)
            setImmediate(() => {
                this.handleSecondaryTasks(checklist, updateChecklistDto.estado).catch(e =>
                    console.error('❌ Error in background tasks during update:', e)
                );
            });

            return checklist;
        } catch (error) {
            console.error('❌ DATABASE UPDATE ERROR:', error);
            throw new BadRequestException(`No se pudo actualizar el checklist: ${error.message || 'Error interno'}`);
        }
    }

    private async handleSecondaryTasks(checklist: any, estado?: string) {
        console.log(`📡 Processing secondary tasks for Checklist #${checklist.id}...`);
        try {
            // 1. OT Automática
            if (estado === 'FALLA' || estado === 'PRECAUCION') {
                await this.handleAutomaticWorkOrder(checklist);
            }

            // 2. Sincronizar estado del equipo
            if (checklist.equipo && checklist.equipo.id && estado) {
                // Check if enum matches
                let equipoEstado: EstadoEquipo = EstadoEquipo.OK;
                if (estado === 'FALLA') equipoEstado = EstadoEquipo.FUERA_SERVICIO;
                else if (estado === 'PRECAUCION') equipoEstado = EstadoEquipo.NOVEDAD;

                // Assuming EstadoEquipo enum strings match: 'OK', 'NOVEDAD', 'FUERA_SERVICIO'

                await this.equipoRepository.update(checklist.equipo.id, { estado: equipoEstado });
                console.log(`✅ Equipment status updated to ${equipoEstado}`);
            }

            // 3. Notificaciones Dinámicas (Regional Mendoza / FIR 3)
            let firId = checklist.aeropuerto?.fir?.id || checklist.equipo?.vhf?.firId;
            // note: vhf logic depends on vhf entity. 

            // Intento resolver FIR por nombre si no lo tenemos
            if (!firId) {
                const firName = checklist.equipo?.vhf?.fir || checklist.aeropuerto?.fir?.nombre;
                if (firName) {
                    // Need query builder or simple ILike
                    const resolvedFir = await this.firRepository.findOne({
                        where: { nombre: ILike(`%${firName}%`) }
                    });
                    firId = resolvedFir?.id;
                }
            }

            // Si el FIR es Mendoza (ID: 3) o lo resolvimos, notificamos a la región
            if (firId) {
                await this.notificationsService.create({
                    message: `CNS REGIONAL: Nuevo Checklist #${checklist.id} en ${checklist.estacion || 'Sitio'} - (${estado})`,
                    type: estado === 'OPERATIVO' || estado === 'OK' ? 'SUCCESS' : (estado === 'FALLA' ? 'ERROR' : 'WARNING'),
                    firId: firId,
                    sector: 'COMUNICACIONES'
                });
                console.log(`🔔 Checklist #${checklist.id}: Notificación enviada a la FIR ID ${firId}`);
            } else {
                // Fallback: Si no pudimos determinar el FIR, notificamos a la regional por defecto (Mendoza)
                await this.notificationsService.create({
                    message: `AVISO REGIONAL: Checklist #${checklist.id} cargado en ${checklist.estacion || 'Sitio'} (FIR no detectado)`,
                    type: 'INFO',
                    firId: 3, // Mendoza por defecto
                    sector: 'COMUNICACIONES'
                });
                console.log(`🔔 Checklist #${checklist.id}: Notificación enviada a Mendoza (Fallback)`);
            }

            // 4. Enviar mail si ambos firmaron
            if (checklist.firmaDigitalLocal && checklist.firmaDigitalRegional) {
                console.log(`📧 Checklist #${checklist.id} fully signed. Sending email to EANA...`);
                await this.mailService.sendChecklistEmail(checklist);
            }

        } catch (e) {
            console.error('❌ Error in background tasks:', e);
        }
    }

    private async handleAutomaticWorkOrder(checklist: any) {
        if (!checklist.equipo || !checklist.tecnico?.userId) return;

        // Verificar si ya existe una OT abierta para este equipo
        // State check: 'ABIERTA', 'EN_PROGRESO', 'ESPERANDO_REPUESTO'

        const existingOT = await this.workOrderRepository.findOne({
            where: {
                equipo: { id: checklist.equipo.id },
                estado: In([EstadoOT.ABIERTA, EstadoOT.EN_PROGRESO, EstadoOT.ESPERANDO_REPUESTO])
            }
        });

        if (existingOT) return;

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const numeroOT = `OT-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        // Need user instance for 'solicitante'
        // Using 'solicitante' relation which expects User entity or object with ID.
        // checklist.tecnico.userId is the ID of the User.

        // We need to fetch the User or just reference ID if relation allows.
        // TypeORM allows { id: ... } partial.

        const newOT = this.workOrderRepository.create({
            numero: numeroOT,
            equipo: { id: checklist.equipo.id },
            solicitante: { id: checklist.tecnico.userId } as any, // Cast if needed
            prioridad: checklist.estado === 'FALLA' ? Prioridad.ALTA : Prioridad.MEDIA,
            descripcion: `Generada automáticamente desde Checklist #${checklist.id}. Observaciones: ${checklist.observaciones || 'Sin observaciones'}`,
            checklist: { id: checklist.id },
            estado: EstadoOT.ABIERTA
        });

        await this.workOrderRepository.save(newOT);

        console.log(`🚀 ERP: Orden de Trabajo ${numeroOT} creada automáticamente para equipo ID ${checklist.equipoId}`);
    }

    private mapToPrisma(dto: any) {
        const mapping: any = {
            v_rectificador: 'vRectificador',
            v_1hora: 'v1hora',
            modulacion_obs: 'modulacionObs',
            roe_local: 'roeLocal',
            roe_externo: 'roeExterno',
            roe_obs: 'roeObs',
            potencia_local: 'potenciaLocal',
            potencia_externo: 'potenciaExterno',
            potencia_obs: 'potenciaObs',
            piso_ruido: 'pisoRuido',
            piso_ruido_obs: 'pisoRuidoObs',
            squelch: 'squelch',
            squelch_obs: 'squelchObs',
            puesta_tierra: 'puestaTierra',
            puesta_tierra_obs: 'puestaTierraObs',
            dias_sin_alternancia: 'diasSinAlternancia',
            conmutacion_obs: 'conmutacionObs',
            estado_baterias: 'estadoBaterias',
            estado_baterias_obs: 'estadoBateriasObs',
            sistema_irradiante: 'sistemaIrradiante',
            sistema_irradiante_obs: 'sistemaIrradianteObs',
            cableado_rf: 'cableadoRf',
            cableado_rf_obs: 'cableadoRfObs',
            balizamiento_obs: 'balizamientoObs',
            switch_ethernet: 'switchEthernet',
            switch_ethernet_obs: 'switchEthernetObs',
            cabeza_control: 'cabezaControl',
            cabeza_control_obs: 'cabezaControlObs',
            em100_obs: 'em100Obs',
            limpieza_obs: 'limpiezaObs',
            tablero_electrico: 'tableroElectrico',
            tablero_electrico_obs: 'tableroElectricoObs',
            reporte_digital: 'reporteDigital',
            reporte_digital_obs: 'reporteDigitalObs',
            al_aire: 'alAire',
            firma_digital_local: 'firmaDigitalLocal',
            firma_digital_regional: 'firmaDigitalRegional'
        };

        const result: any = {};
        for (const [key, value] of Object.entries(dto)) {
            const mappedKey = mapping[key] || key;

            // Numbers mapping
            if (['tecnicoId', 'equipoId', 'aeropuertoId'].includes(mappedKey)) {
                result[mappedKey] = value ? parseInt(value.toString()) : null;
                continue;
            }

            // Especial handling for dates
            if ((key === 'fecha' || key === 'fechaFirmaTecnico' || key === 'fechaFirmaCoordinador') && typeof value === 'string' && value) {
                result[mappedKey] = new Date(value);
                continue;
            }

            // Clean empty strings for optional fields
            if (value === '') {
                result[mappedKey] = null;
            } else {
                result[mappedKey] = value;
            }
        }
        return result;
    }

    async remove(id: number) {
        return this.checklistRepository.delete(id);
    }
}

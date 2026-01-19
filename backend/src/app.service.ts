
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Checklist } from './checklists/entities/checklist.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Vhf } from './vhf/entities/vhf.entity';
import { Equipo } from './equipos/entities/equipo.entity';
import { Energia } from './energia/entities/energia.entity';

@Injectable()
export class AppService {
    constructor(
        private dataSource: DataSource,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Checklist) private checklistRepository: Repository<Checklist>,
        @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
        @InjectRepository(Vhf) private vhfRepository: Repository<Vhf>,
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
        @InjectRepository(Energia) private energiaRepository: Repository<Energia>
    ) { }

    getHello(): string {
        return 'EANA Enterprise API is running';
    }

    getLandingPage(): string {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EANA Enterprise API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #fff;
        }

        .container {
            max-width: 1200px;
            width: 100%;
        }

        .header {
            text-align: center;
            margin-bottom: 60px;
            animation: fadeInDown 0.8s ease-out;
        }

        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
            animation: pulse 2s infinite;
        }

        .logo svg {
            width: 40px;
            height: 40px;
            color: white;
        }

        h1 {
            font-size: 3.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #60a5fa, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
            letter-spacing: -1px;
        }

        .subtitle {
            font-size: 1.2rem;
            color: #94a3b8;
            font-weight: 400;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 0.9rem;
            color: #10b981;
            margin-top: 20px;
            animation: fadeIn 1s ease-out 0.5s both;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: blink 2s infinite;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        }

        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s ease;
            animation: fadeInUp 0.8s ease-out;
        }

        .card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .card-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }

        .card-icon svg {
            width: 24px;
            height: 24px;
            color: white;
        }

        .card h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #fff;
        }

        .card p {
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 0.95rem;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
        }

        .endpoints {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .endpoints h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
            color: #fff;
        }

        .endpoint-list {
            display: grid;
            gap: 12px;
        }

        .endpoint {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s ease;
        }

        .endpoint:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(59, 130, 246, 0.3);
        }

        .endpoint-info {
            flex: 1;
        }

        .endpoint-path {
            font-family: 'Courier New', monospace;
            color: #60a5fa;
            font-size: 0.95rem;
            margin-bottom: 4px;
        }

        .endpoint-desc {
            color: #94a3b8;
            font-size: 0.85rem;
        }

        .methods {
            display: flex;
            gap: 6px;
        }

        .method {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .method-get { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .method-post { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .method-put { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .method-delete { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .footer {
            text-align: center;
            margin-top: 60px;
            color: #64748b;
            font-size: 0.9rem;
            animation: fadeIn 1s ease-out 1s both;
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
            h1 { font-size: 2.5rem; }
            .cards { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
            </div>
            <h1>EANA Enterprise API</h1>
            <p class="subtitle">Sistema de Gestión CNS/EANA - API REST v1.0</p>
            <div class="status-badge">
                <span class="status-dot"></span>
                Sistema Operativo
            </div>
        </div>

        <div class="cards">
            <div class="card">
                <div class="card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <h3>Documentación</h3>
                <p>Explora la documentación completa de la API con Swagger UI. Prueba endpoints en tiempo real.</p>
                <a href="/api/docs" class="btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Abrir Swagger UI
                </a>
            </div>

            <div class="card">
                <div class="card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                </div>
                <h3>Health Check</h3>
                <p>Monitorea el estado del sistema, base de datos, memoria y métricas en tiempo real.</p>
                <a href="/health?format=html" class="btn btn-secondary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Ver Estado
                </a>
            </div>

            <div class="card">
                <div class="card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>
                <h3>Autenticación</h3>
                <p>API segura con autenticación JWT. Todos los endpoints requieren token de acceso.</p>
                <a href="/api/docs#/Authentication" class="btn btn-secondary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Ver Detalles
                </a>
            </div>
        </div>

        <div class="endpoints">
            <h2>📡 Endpoints Principales</h2>
            <div class="endpoint-list">
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/v1/auth</div>
                        <div class="endpoint-desc">Autenticación y gestión de sesiones</div>
                    </div>
                    <div class="methods">
                        <span class="method method-post">POST</span>
                    </div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/v1/users</div>
                        <div class="endpoint-desc">Gestión de usuarios del sistema</div>
                    </div>
                    <div class="methods">
                        <span class="method method-get">GET</span>
                        <span class="method method-post">POST</span>
                        <span class="method method-put">PUT</span>
                        <span class="method method-delete">DEL</span>
                    </div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/v1/vhf</div>
                        <div class="endpoint-desc">Gestión de equipos VHF</div>
                    </div>
                    <div class="methods">
                        <span class="method method-get">GET</span>
                        <span class="method method-post">POST</span>
                        <span class="method method-put">PUT</span>
                        <span class="method method-delete">DEL</span>
                    </div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/v1/equipos</div>
                        <div class="endpoint-desc">Gestión de equipamiento general</div>
                    </div>
                    <div class="methods">
                        <span class="method method-get">GET</span>
                        <span class="method method-post">POST</span>
                        <span class="method method-put">PUT</span>
                        <span class="method method-delete">DEL</span>
                    </div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/v1/checklists</div>
                        <div class="endpoint-desc">Sistema de listas de verificación</div>
                    </div>
                    <div class="methods">
                        <span class="method method-get">GET</span>
                        <span class="method method-post">POST</span>
                        <span class="method method-put">PUT</span>
                        <span class="method method-delete">DEL</span>
                    </div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/v1/notifications</div>
                        <div class="endpoint-desc">Sistema de notificaciones</div>
                    </div>
                    <div class="methods">
                        <span class="method method-get">GET</span>
                        <span class="method method-post">POST</span>
                        <span class="method method-put">PUT</span>
                        <span class="method method-delete">DEL</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>EANA Enterprise API © 2025 | Powered by NestJS & Prisma</p>
            <p style="margin-top: 8px; font-size: 0.85rem;">
                Node.js ${process.version} | Platform: ${process.platform}
            </p>
        </div>
    </div>
</body>
</html>
        `;
    }

    async getSystemHealth() {
        const startTime = Date.now();

        // Check database connection
        let dbStatus = 'healthy';
        let dbResponseTime = 0;
        try {
            const dbStart = Date.now();
            await this.dataSource.query('SELECT 1');
            dbResponseTime = Date.now() - dbStart;
        } catch (error) {
            dbStatus = 'unhealthy';
            dbResponseTime = -1;
        }

        // Get database statistics
        let dbStats = null;
        try {
            const userCount = await this.userRepository.count();
            const checklistCount = await this.checklistRepository.count();
            const notificationCount = await this.notificationRepository.count();
            const vhfCount = await this.vhfRepository.count();
            const equipoCount = await this.equipoRepository.count();
            const energiaCount = await this.energiaRepository.count();

            dbStats = {
                users: userCount,
                checklists: checklistCount,
                notifications: notificationCount,
                vhf: vhfCount,
                equipos: equipoCount,
                energia: energiaCount,
            };
        } catch (error) {
            dbStats = { error: 'Unable to fetch statistics' };
        }

        // System metrics
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // API endpoints information
        const apiEndpoints = [
            { name: 'Authentication', path: '/api/v1/auth', methods: ['POST'], description: 'Login, registro y gestión de autenticación' },
            { name: 'Users', path: '/api/v1/users', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de usuarios del sistema' },
            { name: 'VHF', path: '/api/v1/vhf', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de equipos VHF' },
            { name: 'Equipos', path: '/api/v1/equipos', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de equipamiento' },
            { name: 'Canales', path: '/api/v1/canales', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de canales de comunicación' },
            { name: 'Frecuencias', path: '/api/v1/frecuencias', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de frecuencias' },
            { name: 'Checklists', path: '/api/v1/checklists', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de listas de verificación' },
            { name: 'Notifications', path: '/api/v1/notifications', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Sistema de notificaciones' },
            { name: 'Energia', path: '/api/v1/energia', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Gestión de equipamiento de energía' },
        ];

        return {
            status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                api: {
                    status: 'healthy',
                    uptime: Math.floor(uptime),
                    version: process.env.npm_package_version || '1.0.0',
                    baseUrl: process.env.API_URL || 'http://localhost:3000',
                },
                database: {
                    status: dbStatus,
                    responseTime: dbResponseTime,
                    statistics: dbStats,
                },
            },
            system: {
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                    external: Math.round(memoryUsage.external / 1024 / 1024),
                },
                uptime: Math.floor(uptime),
                nodeVersion: process.version,
                platform: process.platform,
                cpuUsage: process.cpuUsage(),
            },
            api: {
                documentation: '/api/docs',
                endpoints: apiEndpoints,
                totalEndpoints: apiEndpoints.length,
            },
            responseTime: Date.now() - startTime,
        };
    }

    getHealthPage(healthData: any): string {
        const formatUptime = (seconds: number) => {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0) parts.push(`${minutes}m`);
            if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

            return parts.join(' ');
        };

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'healthy':
                    return { bg: '#10b981', text: '#fff', border: '#059669' };
                case 'degraded':
                    return { bg: '#f59e0b', text: '#fff', border: '#d97706' };
                case 'unhealthy':
                    return { bg: '#ef4444', text: '#fff', border: '#dc2626' };
                default:
                    return { bg: '#6b7280', text: '#fff', border: '#4b5563' };
            }
        };

        const statusColor = getStatusColor(healthData.status);

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Health - EANA API</title>
    <meta http-equiv="refresh" content="30">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);
            min-height: 100vh;
            padding: 40px 20px;
            color: #fff;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            animation: fadeInDown 0.6s ease-out;
        }

        h1 {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #60a5fa, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }

        .timestamp {
            color: #94a3b8;
            font-size: 0.9rem;
            margin-top: 10px;
        }

        .status-banner {
            background: ${statusColor.bg};
            border: 2px solid ${statusColor.border};
            color: ${statusColor.text};
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.8s ease-out;
        }

        .status-banner h2 {
            font-size: 2rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }

        .status-banner p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        }

        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s ease;
            animation: fadeInUp 0.8s ease-out;
        }

        .card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .card-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fff;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .metric:last-child {
            border-bottom: none;
        }

        .metric-label {
            color: #94a3b8;
            font-size: 0.9rem;
        }

        .metric-value {
            color: #fff;
            font-weight: 600;
            font-size: 1rem;
        }

        .metric-value.large {
            font-size: 1.5rem;
            background: linear-gradient(135deg, #60a5fa, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }

        .stat-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
        }

        .stat-box-label {
            color: #94a3b8;
            font-size: 0.85rem;
            margin-bottom: 8px;
        }

        .stat-box-value {
            color: #fff;
            font-size: 1.8rem;
            font-weight: 700;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .badge-success {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-warning {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .badge-error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #64748b;
            font-size: 0.9rem;
        }

        .refresh-notice {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #60a5fa;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            margin-top: 20px;
            font-size: 0.9rem;
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 System Health Monitor</h1>
            <p class="timestamp">Última actualización: ${new Date(healthData.timestamp).toLocaleString('es-AR')}</p>
            <p class="timestamp">Tiempo de respuesta: ${healthData.responseTime}ms</p>
        </div>

        <div class="status-banner">
            <h2>${healthData.status}</h2>
            <p>Estado general del sistema</p>
        </div>

        <div class="grid">
            <!-- API Service Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🚀</div>
                    <div class="card-title">API Service</div>
                </div>
                <div class="metric">
                    <span class="metric-label">Estado:</span>
                    <span class="badge badge-success">${healthData.services.api.status}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value">${formatUptime(healthData.services.api.uptime)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Versión:</span>
                    <span class="metric-value">${healthData.services.api.version}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Base URL:</span>
                    <span class="metric-value" style="font-size: 0.85rem;">${healthData.services.api.baseUrl}</span>
                </div>
            </div>

            <!-- Database Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">💾</div>
                    <div class="card-title">Base de Datos</div>
                </div>
                <div class="metric">
                    <span class="metric-label">Estado:</span>
                    <span class="badge ${healthData.services.database.status === 'healthy' ? 'badge-success' : 'badge-error'}">${healthData.services.database.status}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tiempo de respuesta:</span>
                    <span class="metric-value">${healthData.services.database.responseTime}ms</span>
                </div>
                ${healthData.services.database.statistics && !healthData.services.database.statistics.error ? `
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-box-label">Usuarios</div>
                        <div class="stat-box-value">${healthData.services.database.statistics.users || 0}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">Checklists</div>
                        <div class="stat-box-value">${healthData.services.database.statistics.checklists || 0}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">VHF</div>
                        <div class="stat-box-value">${healthData.services.database.statistics.vhf || 0}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">Equipos</div>
                        <div class="stat-box-value">${healthData.services.database.statistics.equipos || 0}</div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Memory Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">💿</div>
                    <div class="card-title">Memoria del Sistema</div>
                </div>
                <div class="metric">
                    <span class="metric-label">Heap Usado:</span>
                    <span class="metric-value">${healthData.system.memory.heapUsed} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Heap Total:</span>
                    <span class="metric-value">${healthData.system.memory.heapTotal} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">RSS:</span>
                    <span class="metric-value">${healthData.system.memory.rss} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">External:</span>
                    <span class="metric-value">${healthData.system.memory.external} MB</span>
                </div>
            </div>

            <!-- System Info Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">⚙️</div>
                    <div class="card-title">Información del Sistema</div>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value large">${formatUptime(healthData.system.uptime)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node.js:</span>
                    <span class="metric-value">${healthData.system.nodeVersion}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Plataforma:</span>
                    <span class="metric-value">${healthData.system.platform}</span>
                </div>
            </div>
        </div>

        <!-- API Endpoints Summary -->
        <div class="card">
            <div class="card-header">
                <div class="card-icon">📡</div>
                <div class="card-title">APIs Disponibles</div>
            </div>
            <div class="metric">
                <span class="metric-label">Total de Endpoints:</span>
                <span class="metric-value large">${healthData.api.totalEndpoints}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Documentación:</span>
                <a href="${healthData.api.documentation}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">
                    Swagger UI →
                </a>
            </div>
        </div>

        <div class="refresh-notice">
            ⏱️ Esta página se actualiza automáticamente cada 30 segundos
        </div>

        <div class="footer">
            <p>EANA Enterprise API © 2025</p>
            <p style="margin-top: 8px;">
                <a href="/" style="color: #60a5fa; text-decoration: none;">← Volver al inicio</a> |
                <a href="/health" style="color: #60a5fa; text-decoration: none;">Ver JSON</a> |
                <a href="/api/docs" style="color: #60a5fa; text-decoration: none;">Documentación</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;
    }
}

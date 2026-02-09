# Script para configurar el reenvío de puertos de WSL2 a Windows
# DEBE EJECUTARSE COMO ADMINISTRADOR

Write-Host "🔧 Configurando reenvío de puertos de WSL2 a Windows..." -ForegroundColor Cyan
Write-Host ""

# Obtener la IP de WSL2
$wslIp = (wsl hostname -I).Trim().Split()[0]
Write-Host "📍 IP de WSL2 detectada: $wslIp" -ForegroundColor Green
Write-Host ""

# Puertos a reenviar
$ports = @(3000, 4200)

# Eliminar reglas existentes (si las hay)
Write-Host "🧹 Limpiando reglas existentes..." -ForegroundColor Yellow
foreach ($port in $ports) {
    try {
        netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null
    } catch {
        # Ignorar errores si no existe la regla
    }
}

# Agregar nuevas reglas de reenvío
Write-Host "➕ Agregando reglas de reenvío de puertos..." -ForegroundColor Yellow
foreach ($port in $ports) {
    Write-Host "   Puerto $port..." -NoNewline
    try {
        netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp
        Write-Host " ✅" -ForegroundColor Green
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
    }
}

# Configurar reglas de firewall
Write-Host ""
Write-Host "🔥 Configurando reglas de firewall..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $ruleName = "WSL2 Port $port"
    
    # Eliminar regla existente si existe
    Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    
    # Crear nueva regla
    Write-Host "   Puerto $port..." -NoNewline
    try {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow | Out-Null
        Write-Host " ✅" -ForegroundColor Green
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
    }
}

# Mostrar configuración actual
Write-Host ""
Write-Host "📋 Configuración actual de port proxy:" -ForegroundColor Cyan
netsh interface portproxy show v4tov4

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Ahora puedes acceder a:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:4200" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  NOTA: Si reinicias WSL, deberás ejecutar este script nuevamente" -ForegroundColor Yellow
Write-Host "    porque la IP de WSL puede cambiar." -ForegroundColor Yellow
Write-Host ""

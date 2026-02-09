# Script para limpiar el reenvío de puertos de WSL2
# DEBE EJECUTARSE COMO ADMINISTRADOR

Write-Host "🧹 Limpiando configuración de reenvío de puertos de WSL2..." -ForegroundColor Cyan
Write-Host ""

# Puertos a limpiar
$ports = @(3000, 4200)

# Eliminar reglas de port proxy
Write-Host "🔧 Eliminando reglas de port proxy..." -ForegroundColor Yellow
foreach ($port in $ports) {
    Write-Host "   Puerto $port..." -NoNewline
    try {
        netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0
        Write-Host " ✅" -ForegroundColor Green
    } catch {
        Write-Host " ⚠️  No existía" -ForegroundColor Yellow
    }
}

# Eliminar reglas de firewall
Write-Host ""
Write-Host "🔥 Eliminando reglas de firewall..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $ruleName = "WSL2 Port $port"
    Write-Host "   $ruleName..." -NoNewline
    try {
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction Stop
        Write-Host " ✅" -ForegroundColor Green
    } catch {
        Write-Host " ⚠️  No existía" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host ""

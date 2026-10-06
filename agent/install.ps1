# Script de Instalação Automatizada - Vanguard Agent
# Deve ser executado como Administrador

$ErrorActionPreference = "Stop"

# 1. Checa privilégios de Administrador
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Por favor, execute este script como Administrador!"
    Pause
    Exit
}

# 2. Configura os caminhos
$InstallDir = "C:\Vanguard"
$ExeName = "vanguard-agent.exe"
$SourceExe = Join-Path $PSScriptRoot $ExeName
$TargetPath = Join-Path $InstallDir $ExeName
$TaskName = "VanguardTelemetryAgent"

Write-Host "Iniciando instalação do Agente Vanguard..." -ForegroundColor Cyan

# 3. Cria a pasta de destino
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "[OK] Pasta C:\Vanguard criada." -ForegroundColor Green
}

# 4. Para o agente se estiver rodando e copia o executável
if (-not (Test-Path $SourceExe)) {
    Write-Error "O arquivo $ExeName não foi encontrado na mesma pasta deste script."
    Pause
    Exit
}

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}
Stop-Process -Name "vanguard-agent" -Force -ErrorAction SilentlyContinue

# Pequena pausa para o Windows liberar o arquivo
Start-Sleep -Seconds 2

Copy-Item -Path $SourceExe -Destination $TargetPath -Force
Write-Host "[OK] Agente copiado para $TargetPath" -ForegroundColor Green

# 5. Registra a Tarefa Agendada para iniciar com o Windows (como SYSTEM)
# Remove a tarefa se já existir para forçar atualização
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Action = New-ScheduledTaskAction -Execute $TargetPath
$Trigger = New-ScheduledTaskTrigger -AtStartup
# Roda como usuário SYSTEM para não piscar tela preta e ter permissão admin silenciosa
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Description "Coleta de telemetria de saúde de discos SSD/NVMe/HDD do Parque Tecnológico" | Out-Null

Write-Host "[OK] Tarefa agendada configurada para iniciar junto com o Windows!" -ForegroundColor Green

# 6. Inicia o agente imediatamente para já enviar o primeiro pacote
Start-ScheduledTask -TaskName $TaskName
Write-Host "[OK] Agente Vanguard iniciado com sucesso." -ForegroundColor Green

Write-Host ""
Write-Host "Instalação concluída! O computador já está sendo monitorado." -ForegroundColor Yellow
Pause

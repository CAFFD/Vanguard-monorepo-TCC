# Script de Instalação Automatizada - Vanguard Agent
# Deve ser executado como Administrador

$ErrorActionPreference = "Stop"

# 1. Auto-elevacao para Administrador (UAC) caso tenha sido aberto com clique normal
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Solicitando permissao de Administrador (UAC)..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
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

# 4.1. Registra a chave de autenticacao M2M (x-api-key) no escopo de Maquina (SYSTEM)
$AgentApiKey = "vanguard-edge-agent-key-2026-8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f"
[Environment]::SetEnvironmentVariable("VANGUARD_API_KEY", $AgentApiKey, "Machine")
$env:VANGUARD_API_KEY = $AgentApiKey
Write-Host "[OK] Chave de acesso M2M (VANGUARD_API_KEY) configurada no sistema." -ForegroundColor Green

# 5. Registra a Tarefa Agendada para iniciar com o Windows (como SYSTEM)
# Remove a tarefa se já existir para forçar atualização
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Action = New-ScheduledTaskAction -Execute $TargetPath
$Trigger = New-ScheduledTaskTrigger -AtStartup
# Roda como usuário SYSTEM para não piscar tela preta e ter permissão admin silenciosa
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Configuracoes de resiliencia (notebooks): nao encerrar na bateria, sem limite de tempo,
# reiniciar se o processo morrer e iniciar assim que possivel se perdeu o gatilho.
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "Coleta de telemetria de saúde de discos SSD/NVMe/HDD do Parque Tecnológico" | Out-Null

Write-Host "[OK] Tarefa agendada configurada para iniciar junto com o Windows!" -ForegroundColor Green

# 6. Inicia o agente imediatamente para já enviar o primeiro pacote
Start-ScheduledTask -TaskName $TaskName
Write-Host "[OK] Agente Vanguard iniciado com sucesso." -ForegroundColor Green

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  HOSTNAME DESTA MAQUINA: $env:COMPUTERNAME" -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Instalacao concluida! O computador ja esta sendo monitorado." -ForegroundColor Yellow
Pause

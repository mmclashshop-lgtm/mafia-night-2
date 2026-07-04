# Mafia Night Server - Auto-start script
$serverDir = "C:\Users\konok\OneDrive\Desktop\website\mafia night 2\packages\server"
$logFile = "$env:TEMP\mafia-server.log"
$tsx = "C:\Users\konok\OneDrive\Desktop\website\mafia night 2\node_modules\.bin\tsx.cmd"

# Kill any existing server
Get-Process -Name "node","cmd" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*tsx*" -or $_.CommandLine -like "*mafia*" } | Stop-Process -Force

# Start server
Start-Process -FilePath $tsx -ArgumentList "src/index.ts" -WorkingDirectory $serverDir -WindowStyle Hidden

# Wait for server to start
Start-Sleep -Seconds 5

# Start Tailscale Funnel
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg --yes 3001

# Log
Get-Date | Out-File -Append $logFile
Write-Host "Server started at $(Get-Date)" | Out-File -Append $logFile

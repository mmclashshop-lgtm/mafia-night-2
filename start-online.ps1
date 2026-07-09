$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = (Get-Command node).Source
$tsx = Join-Path $root "node_modules\tsx\dist\cli.mjs"

Write-Host "🎭 Starting Mafia Server..." -ForegroundColor Cyan
$server = Start-Process -NoNewWindow -FilePath $node -ArgumentList "$tsx packages/server/src/index.ts" -WorkingDirectory $root -RedirectStandardOutput "$env:TEMP\mafia-server.log" -RedirectStandardError "$env:TEMP\mafia-server.err" -PassThru
Start-Sleep -Seconds 4

Write-Host "🔗 Creating public tunnel..." -ForegroundColor Cyan
$tunnel = Start-Process -NoNewWindow -FilePath "ssh" -ArgumentList "-o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3001 serveo.net" -RedirectStandardOutput "$env:TEMP\mafia-tunnel.log" -RedirectStandardError "$env:TEMP\mafia-tunnel.err" -PassThru
Start-Sleep -Seconds 6

$url = Select-String -Path "$env:TEMP\mafia-tunnel.log" -Pattern "https://" | ForEach-Object { $_.Matches.Value }
if (-not $url) { $url = Select-String -Path "$env:TEMP\mafia-tunnel.err" -Pattern "https://" | ForEach-Object { $_.Matches.Value } }

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Server is RUNNING!" -ForegroundColor Green
Write-Host "🌐 Public URL: $url" -ForegroundColor Yellow
Write-Host "📋 Update .env with: VITE_SOCKET_URL=$url" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nPress Ctrl+C to stop server and tunnel" -ForegroundColor Gray

while ($true) {
    Start-Sleep -Seconds 10
    if ($server.HasExited) {
        Write-Host "❌ Server crashed! Restarting..." -ForegroundColor Red
        $server = Start-Process -NoNewWindow -FilePath $node -ArgumentList "$tsx packages/server/src/index.ts" -WorkingDirectory $root -RedirectStandardOutput "$env:TEMP\mafia-server.log" -RedirectStandardError "$env:TEMP\mafia-server.err" -PassThru
    }
    if ($tunnel.HasExited) {
        Write-Host "❌ Tunnel closed! Restarting..." -ForegroundColor Red
        $tunnel = Start-Process -NoNewWindow -FilePath "ssh" -ArgumentList "-o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3001 serveo.net" -RedirectStandardOutput "$env:TEMP\mafia-tunnel.log" -RedirectStandardError "$env:TEMP\mafia-tunnel.err" -PassThru
        Start-Sleep -Seconds 6
        $url = Select-String -Path "$env:TEMP\mafia-tunnel.log" -Pattern "https://" | ForEach-Object { $_.Matches.Value }
        if (-not $url) { $url = Select-String -Path "$env:TEMP\mafia-tunnel.err" -Pattern "https://" | ForEach-Object { $_.Matches.Value } }
        Write-Host "🔄 New URL: $url" -ForegroundColor Yellow
    }
}

Set-Location "C:\Users\konok\OneDrive\Desktop\website\mafia night 2"
npx turbo run dev 2>&1 | Out-File -FilePath "$env:TEMP\mafia-dev.log" -Append

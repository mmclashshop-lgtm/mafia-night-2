@echo off
cd /d "C:\Users\konok\OneDrive\Desktop\website\mafia night 2"
start "Mafia Server" cmd /c "npx tsx packages/server/src/index.ts"
cd /d "C:\Users\konok\OneDrive\Desktop\website\mafia night 2\packages\client"
start "Mafia Client" cmd /c "npx vite --host --port 5173"
echo Mafia Night started!
echo Server: http://localhost:3001
echo Client: http://localhost:5173

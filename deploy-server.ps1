# شغل السكربت ده في PowerShell عشان تنشر السيرفر على Fly.io
# Fly.io بيديك 3 VMs مجانًا 24 ساعة بدون ما يقف

Write-Host "=== تركيب Fly.io CLI ===" -ForegroundColor Cyan
powershell -Command "iwr https://fly.io/install.ps1 -UseBasicParsing | iex"

Write-Host "`n=== تسجيل الدخول (هتفتح متصفح) ===" -ForegroundColor Cyan
flyctl auth signup

Write-Host "`n=== إنشاء وتشغيل السيرفر ===" -ForegroundColor Cyan
flyctl launch --no-deploy

Write-Host "`n=== إنشاء volume للبيانات ===" -ForegroundColor Cyan
flyctl volumes create server_data --region ams --size 1

Write-Host "`n=== نشر السيرفر ===" -ForegroundColor Cyan
flyctl deploy

Write-Host "`n=== فتح الرابط ===" -ForegroundColor Cyan
flyctl open

Write-Host "`nDone! السيرفر شغال 24 ساعة مجانًا" -ForegroundColor Green

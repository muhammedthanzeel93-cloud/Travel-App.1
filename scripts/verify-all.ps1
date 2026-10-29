# Travel Buddy Project Verification Script
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🧪 Running Travel Buddy Full Verification Suite" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Run Backend Auth Tests
Write-Host "`n1. Running Backend Auth Tests..." -ForegroundColor Yellow
cd backend
npx tsx test/auth.test.ts
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Auth tests failed!" -ForegroundColor Red; exit 1 }

# 2. Run Backend Social Tests
Write-Host "`n2. Running Backend Social & Admin Tests..." -ForegroundColor Yellow
npx tsx test/social.test.ts
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Social tests failed!" -ForegroundColor Red; exit 1 }

# 3. Run Backend Aviation & Railway Ticketing Tests
Write-Host "`n3. Running Aviation & Railway Ticketing Tests..." -ForegroundColor Yellow
npx tsx test/ticketing.test.ts
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Ticketing tests failed!" -ForegroundColor Red; exit 1 }

# 4. Backend Build Check
Write-Host "`n4. Running Backend Build (tsc)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Backend build failed!" -ForegroundColor Red; exit 1 }

# 5. Web Frontend Build Check
Write-Host "`n5. Running Web Frontend Build (next build)..." -ForegroundColor Yellow
cd ..\web
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Web build failed!" -ForegroundColor Red; exit 1 }

cd ..
Write-Host "`n=================================================" -ForegroundColor Green
Write-Host "🎉 ALL VERIFICATIONS & BUILDS PASSED 100%!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

@echo off
cd /d "%~dp0"

echo ========================================
echo   Step 1: Fetching remote changes...
echo ========================================
git fetch origin main

echo.
echo ========================================
echo   Step 2: Resetting to match remote...
echo ========================================
git reset --soft origin/main

echo.
echo ========================================
echo   Step 3: Adding all files...
echo ========================================
git add -A

echo.
echo ========================================
echo   Step 4: Committing...
echo ========================================
git commit -m "Fix Google Maps URL validation, add QR code display"

echo.
echo ========================================
echo   Step 5: Pushing to GitHub...
echo ========================================
git push origin main

echo.
echo ========================================
echo   ALL DONE! Vercel will auto-deploy.
echo ========================================
pause

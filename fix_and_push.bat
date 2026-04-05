@echo off
cd /d "%~dp0"

echo ========================================
echo   Step 1: Setting up remote...
echo ========================================
git remote remove origin 2>nul
git remote add origin https://github.com/sonic1jp-cyber/kuchikomi-sensei.git
git remote -v

echo.
echo ========================================
echo   Step 2: Fetching remote...
echo ========================================
git fetch origin main

echo.
echo ========================================
echo   Step 3: Resetting to match remote...
echo ========================================
git reset --soft origin/main

echo.
echo ========================================
echo   Step 4: Adding all files...
echo ========================================
git add -A

echo.
echo ========================================
echo   Step 5: Committing...
echo ========================================
git commit -m "Fix review flow: no review gating, show feedbacks on dashboard, use stored Google Maps URL"

echo.
echo ========================================
echo   Step 6: Pushing to GitHub...
echo ========================================
git push origin main

echo.
echo ========================================
echo   ALL DONE! Vercel will auto-deploy.
echo ========================================
pause

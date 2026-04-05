@echo off
cd /d "%~dp0"

echo ========================================
echo   Kuchikomi-sensei Deploy
echo ========================================
echo.

:: Ensure remote is set
git remote remove origin 2>nul
git remote add origin https://github.com/sonic1jp-cyber/kuchikomi-sensei.git

:: Fetch latest from remote
echo [1/5] Fetching remote...
git fetch origin main 2>nul

:: Reset to remote head (keep local changes staged)
echo [2/5] Syncing with remote...
git reset --soft origin/main 2>nul

:: Stage all changes
echo [3/5] Staging files...
git add -A

:: Commit (will skip if nothing to commit)
echo [4/5] Committing...
git diff --cached --quiet
if %errorlevel% neq 0 (
    git commit -m "Update: %date% %time:~0,5%"
) else (
    echo Nothing to commit.
)

:: Push
echo [5/5] Pushing to GitHub...
git push origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! Vercel will auto-deploy.
    echo ========================================
) else (
    echo ========================================
    echo   ERROR: Push failed. Check above.
    echo ========================================
)
pause

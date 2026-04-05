@echo off
echo ========================================
echo   Push kuchikomi-sensei to GitHub
echo ========================================
echo.

cd /d "%~dp0"

git init
git branch -m main
git add -A
git config user.name "NS"
git config user.email "sonic1jp@gmail.com"
git commit -m "Initial commit: kuchikomi-sensei MVP"
git remote add origin https://github.com/sonic1jp-cyber/kuchikomi-sensei.git 2>nul
git remote set-url origin https://github.com/sonic1jp-cyber/kuchikomi-sensei.git
git push -u origin main

echo.
echo ========================================
echo   DONE!
echo ========================================
echo.
pause

@echo off
cd /d "%~dp0"
git add -A
git commit -m "Add clinic setup page, fix signup flow"
git push origin main
echo.
echo DONE! Vercel will auto-deploy.
pause

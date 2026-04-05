@echo off
cd /d "%~dp0"
git add src/app/login/page.tsx
git commit -m "Fix: auto-redirect to dashboard after signup"
git push origin main
echo.
echo DONE! Vercel will auto-deploy.
pause

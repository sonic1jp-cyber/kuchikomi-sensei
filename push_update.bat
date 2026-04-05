@echo off
cd /d "%~dp0"
echo Syncing with remote...
git pull --rebase origin main
echo.
echo Adding and committing...
git add -A
git commit -m "Fix Google Maps URL validation, add QR code display"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo DONE! Vercel will auto-deploy.
pause

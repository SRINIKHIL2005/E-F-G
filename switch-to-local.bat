@echo off
echo === Switching to Local Server Configuration ===
cd /d "f:\Personal_projects\PP\E-F-G"

echo === Removing old build ===
if exist "docs" rmdir /s /q docs

echo === Building with local server ===
call npm run build

echo === Committing changes ===
git add .
git commit -m "fix: switch back to localhost:5000 for local development"
git push origin deployment-fix

echo === Done! ===
pause

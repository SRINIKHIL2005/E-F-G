@echo off
echo === Fixing API URL Issues ===
cd /d "f:\Personal_projects\PP\E-F-G"

echo === Deleting old build ===
if exist "docs" rmdir /s /q docs

echo === Building with updated API URLs ===
npm run build

echo === Checking if build succeeded ===
if exist "docs\index.html" (
    echo Build successful!
    echo === Committing changes ===
    git add .
    git commit -m "fix: update all API URLs to use production backend and rebuild"
    git push origin deployment-fix
    echo === Done! ===
) else (
    echo Build failed!
)

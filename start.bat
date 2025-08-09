@echo off
echo Starting Lord of Park Backend...
echo.

echo Installing dependencies...
npm install

echo.
echo Creating .env file from template...
if not exist .env (
    copy env.example .env
    echo .env file created. Please update it with your configuration.
) else (
    echo .env file already exists.
)

echo.
echo Starting development server...
npm run dev

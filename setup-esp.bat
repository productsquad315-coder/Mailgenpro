@echo off
echo ========================================
echo Mailit ESP Integration Setup
echo ========================================
echo.

echo Step 1: Setting Resend API Key...
npx supabase secrets set RESEND_API_KEY=re_ahkXDkZh_CCKC2CkNhNniP4vE8FfYndbF
if %errorlevel% neq 0 (
    echo ERROR: Failed to set API key. Make sure you're logged in to Supabase.
    echo Run: npx supabase login
    pause
    exit /b 1
)
echo ✓ API key set successfully
echo.

echo Step 2: Deploying send-campaign function...
npx supabase functions deploy send-campaign
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy send-campaign
    pause
    exit /b 1
)
echo ✓ send-campaign deployed
echo.

echo Step 3: Deploying send-worker function...
npx supabase functions deploy send-worker
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy send-worker
    pause
    exit /b 1
)
echo ✓ send-worker deployed
echo.

echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update TypeScript types in Supabase Dashboard
echo 2. Restart your dev server
echo 3. Test the /contacts page
echo.
pause

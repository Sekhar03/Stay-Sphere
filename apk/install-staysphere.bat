@echo off
title StaySphere Android Installer
echo ===================================================
echo     StaySphere Mobile App Deployment Tool
echo ===================================================
echo.
echo Checking for connected Android devices...
"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe" devices
echo.
echo Installing StaySphere Release APK onto device...
"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe" install -r "%~dp0StaySphere-release.apk"
echo.
echo Launching StaySphere...
"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe" shell monkey -p in.staysphere.app -c android.intent.category.LAUNCHER 1
echo.
echo ===================================================
echo    Installation Complete! Enjoy StaySphere.
echo ===================================================
pause

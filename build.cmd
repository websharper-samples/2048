@ECHO OFF

setlocal

if not exist .paket\paket.exe (
  .paket\paket.bootstrapper.exe
)

.paket\paket.exe restore

if "%MSBUILD_PATH%" == "" (
  REM we're not deploying on Azure, set some variables
  set MSBUILD_PATH="%ProgramFiles(x86)%\MSBuild\12.0\Bin\MSBuild.exe"
  mkdir build
  mkdir build\html
  set DEPLOYMENT_TARGET=%CD%\build\html
)

%MSBUILD_PATH% /p:Configuration=Release

if %ERRORLEVEL% == 0 (
  copy Game2048\*html %DEPLOYMENT_TARGET%
  mkdir "%DEPLOYMENT_TARGET%\Content"
  xcopy /y /e Game2048\Content "%DEPLOYMENT_TARGET%\Content"
  mkdir "%DEPLOYMENT_TARGET%\style"
  xcopy /y /e Game2048\style "%DEPLOYMENT_TARGET%\style"
)

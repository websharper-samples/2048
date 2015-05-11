@ECHO OFF
setlocal

echo "====== Restoring packages... ======"

if not exist .paket\paket.exe (
  .paket\paket.bootstrapper.exe
)

.paket\paket.exe restore

if not %ERRORLEVEL% == 0 (
  echo "====== Failed to restore packages. ======"
  exit 1
)



echo "====== Building... ======"

REM Azure provides MSBUILD_PATH and DEPLOYMENT_TARGET.
REM If we're not deploying to Azure (eg. building locally),
REM we need to set MSBUILD_PATH.
if "%MSBUILD_PATH%" == "" (
  set MSBUILD_PATH="%ProgramFiles(x86)%\MSBuild\12.0\Bin\MSBuild.exe"
)

%MSBUILD_PATH% /p:Configuration=Release

if not %ERRORLEVEL% == 0 (
  echo "====== Build failed. ======"
  exit 1
)



REM We also have an AppVeyor task that deploys all the files
REM in build/html to github-pages (using tools/gh-pages.ps1),
REM so we set DEPLOYMENT_TARGET to that folder.
if "%APPVEYOR%" == "True" (
  mkdir build
  mkdir build\html
  set DEPLOYMENT_TARGET=%CD%\build\html
)

REM Note: here we only copy specific files to DEPLOYMENT_TARGET
REM because of the github-pages AppVeyor task: we don't want to
REM copy binaries to github-pages. In a typical Azure-deployed
REM application, the deployment would be REM simply to copy
REM everything from the web project:
REM
REM     if not "%DEPLOYMENT_TARGET%" == "" (
REM         xcopy /y /e Game2048 "%DEPLOYMENT_TARGET%"
REM     )
if not "%DEPLOYMENT_TARGET%" == "" (
  echo "====== Deploying... ======"
  copy Game2048\*html %DEPLOYMENT_TARGET%
  mkdir "%DEPLOYMENT_TARGET%\Content"
  xcopy /y /e Game2048\Content "%DEPLOYMENT_TARGET%\Content"
  mkdir "%DEPLOYMENT_TARGET%\style"
  xcopy /y /e Game2048\style "%DEPLOYMENT_TARGET%\style"
  echo "====== Done. ======"
)

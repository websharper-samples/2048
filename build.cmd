@ECHO OFF

setlocal

if not exist .paket\paket.exe (
   .paket\paket.bootstrapper.exe
)

.paket\paket.exe restore

%MSBUILD_PATH% /p:Configuration=Release

xcopy /y /e Game2048 %DEPLOYMENT_TARGET%

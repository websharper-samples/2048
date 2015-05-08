@ECHO OFF

setlocal

if not exist .paket\paket.exe (
   .paket\paket.bootstrapper.exe
)

.paket\paket.exe restore

set FSharpHome=%CD%\packages\FSharp.Compiler.Tools\tools
set PATH=%FSharpHome%;%PATH%

%MSBUILD_PATH% /p:Configuration=Release

xcopy /y %DEPLOYMENT_SOURCE%\Game2048\ %DEPLOYMENT_TARGET%\

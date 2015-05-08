@ECHO OFF

setlocal
set FSharpHome=tools\packages\FSharp.Compiler.Tools\tools
set PATH=
set PATH=%PATH%;tools\NuGet
set PATH=%PATH%;%FSharpHome%
nuget install IntelliFactory.Build -nocache -pre -ExcludeVersion -o tools\packages
nuget install FSharp.Compiler.Tools -nocache -pre -ExcludeVersion -o tools\packages
fsi.exe --exec build.fsx %*
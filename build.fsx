#load "tools/includes.fsx"
open IntelliFactory.Build

let bt =
    BuildTool()
        .PackageId("2048", "1.0-alpha")
        .WithFramework(fun fw -> fw.Net40)
        .WithFSharpVersion(FSharpVersion.FSharp31)
        .Verbose()

let Game2048 =
    bt.WebSharper.BundleWebsite("Game2048")
        .SourcesFromProject()

bt.Solution [
    Game2048
]
|> bt.Dispatch

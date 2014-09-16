#r "NuGet.Core.dll"
#r "IntelliFactory.Core.dll"
#r "IntelliFactory.Build.dll"

open IntelliFactory.Build

let bt = BuildTool().PackageId("Bundle", "0.1-alpha")

let myBundleWebsite =
    bt.WebSharper.BundleWebsite("Bundle")
        .SourcesFromProject()

bt.Solution [
    myBundleWebsite
]
|> bt.Dispatch

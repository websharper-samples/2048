namespace Game2048

open IntelliFactory.WebSharper
open IntelliFactory.WebSharper.Html.Client
open IntelliFactory.WebSharper.JQuery
open IntelliFactory.WebSharper.JavaScript

// Helper for handling localstorage, making a stored value work like a ref cell.
[<JavaScript; AutoOpen>]
module LocalStorage =
        
    let localStorage = JS.Window.LocalStorage

    type IValue<'T> = 
        abstract Value: 'T with get, set

    let [<Inline>] ( ! ) (x: IValue<_>) = x.Value
    let [<Inline>] ( := ) (x: IValue<_>) v = x.Value <- v

    // Redefining Ref to use IValue
    type Ref<'T> (value: 'T) =
        let mutable v = value 
        interface IValue<'T> with
            member this.Value
                with get() = v
                and set value = v <- value

    let [<Inline>] ref v = Ref  v
    let incr i = i := !i + 1
    let decr i = i := !i - 1

    type IStorageItem<'T> =
        inherit IValue<'T>
        abstract Save: unit -> unit
        abstract Delete: unit -> unit

    type JSONStorageItem<'T>(key, def) = 
        let mutable value = None
          
        let getValue() =
            match value with
            | Some v -> v
            | _ ->
                let v =
                    match localStorage.GetItem key with
                    | null -> def
                    | s -> Json.Parse s :?> _
                value <- Some v
                v
        
        interface IStorageItem<'T> with
            member this.Value
                with get() = getValue()
                and  set v =
                    try localStorage.SetItem(key, Json.Stringify v)  
                        value <- Some v 
                    with _ -> JS.Alert "Saving data to storage failed."

            member this.Save() = 
                try localStorage.SetItem(key, Json.Stringify (getValue()))  
                with _ -> JS.Alert "Saving data to storage failed."

            member this.Delete() =
                localStorage.RemoveItem key
                value <- None
        
    let [<Inline>] getJSONStorage key def = JSONStorageItem<_>(key, def) :> IStorageItem<_>

// Helpers for 2-dimensional Arrays
[<JavaScript>]
module Array2D =
    let exists predicate (array: _[,]) =
        let len1 = Array2D.length1 array
        let len2 = Array2D.length2 array
        let mutable found = false
        let mutable i = 0
        while not found && i < len1 do
            let mutable j = 0
            while not found && j < len2 do
                found <- predicate array.[i, j]
                j <- j + 1
            i <- i + 1 
        found

    let toSeq (array: _[,]) =
        let len1 = Array2D.length1 array
        let len2 = Array2D.length2 array
        seq {
            for i = 0 to len1 - 1 do
                for j = 0 to len2 - 1 do
                    yield array.[i, j]
        }

// Some JavaScript Array operations
[<JavaScript>]
module Array =
    [<Inline>]
    let push (array: 'T[]) (item: 'T) =
        array.ToEcma().Push(item) |> ignore

    let pad length (array: 'T[]) =
        let res = array |> Array.map Some
        for i = 1 to length - array.Length do
            push res None
        res


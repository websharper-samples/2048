namespace Game2048

open IntelliFactory.WebSharper
open IntelliFactory.WebSharper.Html
open IntelliFactory.WebSharper.JQuery

open Model
open InputManager

[<JavaScript>]
module Client =            
    [<Inline "window.requestAnimationFrame($callback)">]
    let requestAnimationFrame (callback: unit -> unit) = () 
      
    type GameState = 
        {
            Score      : int     
            Over       : bool      
            Won        : bool       
            BestScore  : int 
            Terminated : bool
        }

    type HtmlActuator() =
        let tileContainer    = JQuery.Of ".tile-container"
        let scoreContainer   = JQuery.Of ".score-container"
        let bestContainer    = JQuery.Of ".best-container"
        let messageContainer = JQuery.Of ".game-message"
        
        let mutable score = 0
                                 
        member this.Actuate grid state = 
            requestAnimationFrame <| fun () ->
            
            tileContainer.Empty() |> ignore

            let positionClass (x, y) = "tile-position-" + string x + "-" + string y
            
            let applyClasses (el: Element) classes =
                el.SetAttribute("class", classes |> String.concat " ")

            let addTile moveTo addClass (tile: TileData) =
                let inner = 
                    Div [ 
                        Attr.Class "tile-inner" 
                        Text (string tile.Value)
                    ]
                let classes =
                    ResizeArray (
                        [
                            "tile"
                            "tile-" + string tile.Value
                            positionClass tile.Pos
                        ] @ addClass
                    )
                let wrapper = Div [ inner ]
                if tile.Value > 2048 then classes.Add "tile-super" 
                applyClasses wrapper classes
                        
                tileContainer.Append(wrapper.Body) |> ignore

                match moveTo with
                | Some pos -> 
                    requestAnimationFrame <| fun () ->
                        classes.[2] <- positionClass pos
                        applyClasses wrapper classes
                | _ -> ()

            let addMovingTile (tile: Tile) =
                match tile.Previous with
                | Some prev ->
                    addTile (Some tile.Current.Pos) [] prev
                | _ ->
                    if Array.isEmpty tile.MergedFrom then
                        addTile None [ "tile-new" ] tile.Current 
                    else
                        tile.MergedFrom |> Array.iter (addTile (Some tile.Current.Pos) [])
                        addTile None [ "tile-merged" ] tile.Current
            
            grid |> Array2D.toSeq |> Seq.choose id |> Seq.iter addMovingTile

            scoreContainer.Empty() |> ignore
            let diff = state.Score - score
            score <- state.Score
            scoreContainer.Text(string score) |> ignore
            if diff > 0 then
                let addition = Div [ Attr.Class "score-addition"; Text ("+" + string diff) ]
                scoreContainer.Append(addition.Body) |> ignore

            bestContainer.Text(string state.BestScore) |> ignore

            let message (cls: string) text = 
                JavaScript.Log text
                messageContainer.AddClass(cls) |> ignore
                messageContainer.Find("p").First().Text(text) |> ignore
            
            if state.Terminated then
                if state.Over then
                    message "game-over" "Game over!"
                elif state.Won then
                    message "game-won" "You win!"

        member this.ClearMessage() =
           messageContainer.RemoveClass("game-won").RemoveClass("game-over") |> ignore

    let gridValues grid = grid |> Array2D.map (Option.map (fun { Current = {Value = v } } -> v))

    let gridFromValues values =
        values |> Array2D.mapi (fun i j -> Option.map (fun v -> newTile (i + 1, j + 1) v))

    let moveGrid scoreRef merge (grid: _[,]) dir =                
        let grid = grid
        let len1 = Array2D.length1 grid
        let len2 = Array2D.length2 grid
        let newGrid = Array2D.zeroCreate len1 len2
        JavaScript.Log "moveGrid"

        match dir with
        | Up ->
            for i = 0 to len1 - 1 do
                let j = ref 0
                let getNextPos() = 
                    incr j 
                    i + 1, !j
                let merged = grid.[i, *] |> Array.choose id |> doMerge scoreRef merge getNextPos
                newGrid.[i, *] <- merged |> Array.pad len2
        | Down ->
            for i = 0 to len1 - 1 do
                let j = ref (len2 + 1)
                let getNextPos() = 
                    decr j 
                    i + 1, !j
                let merged = grid.[i, *] |> Array.choose id |> Array.rev |> doMerge scoreRef merge getNextPos
                newGrid.[i, *] <- merged |> Array.pad len2 |> Array.rev
        | Left ->
            for j = 0 to len2 - 1 do
                let i = ref 0
                let getNextPos() = 
                    incr i 
                    !i, j + 1
                let merged = grid.[*, j] |> Array.choose id |> doMerge scoreRef merge getNextPos
                newGrid.[*, j] <- merged |> Array.pad len1
        | Right ->
            for j = 0 to len2 - 1 do
                let i = ref (len1 + 1)
                let getNextPos() = 
                    decr i 
                    !i, j + 1
                let merged = grid.[*, j] |> Array.choose id |> Array.rev |> doMerge scoreRef merge getNextPos
                newGrid.[*, j] <- merged |> Array.pad len1 |> Array.rev

        if gridValues newGrid = gridValues grid then None else Some newGrid            
    
    type StoredGame =
        {
            Values      : (int option[,]) option
            Score       : int
            BestScore   : int
        }

    let Main =
        let selectGameType = JQuery.Of ".select-gametype"
                
        for v in Variants.All do
            selectGameType.Append("<option value=\"" + v.Name + "\">" + v.Name + "</option>").Ignore
        
        let rules = ref Unchecked.defaultof<GameRules>

        let gridContainer = JQuery.Of ".grid-container"

        for i in 1 .. gridSize do
            let gridRow =
                Div [ Attr.Class "grid-row" ] -< Array.init gridSize (fun _ ->
                    Div [ Attr.Class "grid-cell" ]
                )
            gridContainer.Append(gridRow.Body) |> ignore

        let storedGame = ref Unchecked.defaultof<IStorageItem<StoredGame>>

        let score = ref 0
        let bestScore = ref 0
        let grid = ref null

        let load() =
            let stored = ! !storedGame
            score := stored.Score 
            bestScore := stored.BestScore
            grid := 
                match stored.Values with
                | Some game -> gridFromValues game
                | _ -> (!rules).Start()

        let keepPlaying = ref false
        let isGameTerminated = ref false
        
        let actuator = HtmlActuator()
        
        let inputManager = InputManager() 
        
        let save over =
            !storedGame := {
                Values    = if over then None else Some (gridValues !grid)
                Score     = !score
                BestScore = !bestScore
            }
        
        let actuate over won =
            save over
            isGameTerminated := over || (won && not !keepPlaying)  
            actuator.Actuate !grid {
                    Score      = !score
                    Over       = over
                    Won        = won 
                    BestScore  = !bestScore
                    Terminated = !isGameTerminated  
                }

        let continueGame() =
            isGameTerminated := false
            actuator.ClearMessage()

        let setRules r =
            rules := r
            JQuery.Of(".title").Html(r.Title).Ignore
            JQuery.Of(".game-intro").Html(r.Hint).Ignore
            storedGame :=
                getJSONStorage r.Name {
                    Values    = None
                    Score     = 0
                    BestScore = 0
                }

            load()
            keepPlaying := false
            continueGame()
            actuate false false

        let restart() =
            score := 0    
            grid := (!rules).Start()
            keepPlaying := false
            continueGame()
            actuate false false

        selectGameType.On("change", fun _ ->
            let v = selectGameType.Val() :?> string
            for r in Variants.All do
                if v = r.Name then setRules r
                selectGameType.Blur().Ignore
            true
        )

        inputManager.Move.Add <| fun dir ->
            let rules = !rules
            if !isGameTerminated then () else
            match moveGrid score rules.Merge !grid dir with
            | Some newGrid ->
                grid := newGrid
                rules.Next !grid
                if !bestScore < !score then bestScore := !score
                let over = not (moveAvailable rules.Merge !grid)
                let won = rules.Goal !grid
                actuate over won
            | _ -> ()
        
        inputManager.Restart.Add <| fun () ->
            restart()

        inputManager.KeepPlaying.Add <| fun () ->
            keepPlaying := true 
            continueGame()

        setRules Variants.All.[0]

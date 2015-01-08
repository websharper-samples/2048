namespace Game2048

open IntelliFactory.WebSharper
open IntelliFactory.WebSharper.JavaScript

[<JavaScript>]
module Model =
    type TileData =
        {
            Pos   : int * int       
            Value : int
        }
            
    type Tile =
        {
            Current    : TileData
            Previous   : TileData option
            MergedFrom : TileData[]
        }
        
    type Grid = (Tile option)[,]

    let newTile pos value =
        {
            Current    =
                {
                    Pos   = pos
                    Value = value
                }
            Previous   = None
            MergedFrom = [| |]
        }
    
    let moveTile newPos tile =
        {
            Current    =
                {
                    Pos   = newPos
                    Value = tile.Current.Value
                }
            Previous   = Some tile.Current
            MergedFrom = [||]
        }

    let mergeTiles newPos newValue tile1 tile2 =
        {
            Current    =
                {
                    Pos   = newPos
                    Value = newValue
                }
            Previous   = None
            MergedFrom = [| tile1.Current; tile2.Current |]
        }
        
    let addRandomTile grid value =
        let empty = ResizeArray()
        grid |> Array2D.iteri (fun i j c -> if Option.isNone c then empty.Add(i, j))
        let i, j = empty.[int (Math.Random() * float empty.Count)]
        grid.[i, j] <- Some (newTile (i + 1, j + 1) value)  

    let gridContains grid value =
        grid |> Array2D.exists (function 
            | Some { Current = { Value = v } } -> v = value
            | _ -> false
        )

    let doMerge scoreRef merge getnextPos (row: Tile[]) =
        let res = [||] : Tile[]
        let prev = ref None
        for cell in row do
            match !prev with
            | Some pcell ->
                match merge (pcell.Current.Value, cell.Current.Value) with
                | Some (mergedValue, addedScore) ->
                    scoreRef := !scoreRef + addedScore
                    Array.push res <| mergeTiles (getnextPos()) mergedValue pcell cell
                    prev := None
                | _ ->
                    Array.push res <| moveTile (getnextPos()) pcell 
                    prev := Some cell
            | _ -> prev := Some cell
        match !prev with
        | Some pcell -> Array.push res <| moveTile (getnextPos()) pcell
        | _ -> ()
        res

    let moveAvailable merge grid =
        (grid |> Array2D.exists Option.isNone) || (
            let gridVals = grid |> Array2D.map (function Some { Current = {Value = v } } -> v | _ -> 0)
            let len1 = Array2D.length1 gridVals
            let len2 = Array2D.length2 gridVals
            seq {
                for i = 0 to len1 - 1 do
                    yield! gridVals.[i, *] |> Seq.pairwise
                for i = 0 to len2 - 1 do
                    yield! gridVals.[*, i] |> Seq.pairwise
            }
            |> Seq.exists (merge >> Option.isSome)
        )

    let [<Literal>] gridSize = 4

    [<AbstractClass>]
    type GameRules() =
        /// The label in the game mode selector and also the key of the stored saved game
        abstract Name: string
        /// Shown at the top
        abstract Title: string
        /// Short description of game goal
        abstract Hint: string
        /// Checks if two tiles can be merged. Returns new tile value and points added if a merge happens.
        abstract Merge: int * int -> (int * int) option
        /// Use this value in your Goal function to have an easily overridable goal.
        abstract GoalValue: int
        /// A function for deciding if a given grid state is game winning.
        abstract Goal: Grid -> bool
        /// Create the value for a new random tile.
        abstract NewTileValue: unit -> int
        /// Advance the game grid, default is one new tile in an evently randomized empty position. 
        abstract Next: Grid -> unit
        /// Create the starting grid.
        abstract Start: unit -> Grid


namespace Game2048

open WebSharper
open WebSharper.JavaScript

open Model

[<JavaScript>]
module Variants =
    type OriginalRules() =        
        inherit GameRules()

        override this.Name = "Original"
        override this.Title = "2048"
        override this.Hint = "Join the numbers and get to the <strong>2048 tile!</strong>"

        override this.Merge(v1, v2) =
            if v1 = v2 then
                let v = v1 * 2
                Some (v, v)
            else None 
        
        override this.GoalValue = 2048
        
        override this.Goal grid = gridContains grid this.GoalValue

        override this.NewTileValue() =
            if Math.Random() < 0.9 then 2 else 4
                
        override this.Next grid =
            this.NewTileValue() |> addRandomTile grid 
        
        override this.Start() =
            Array2D.create gridSize gridSize None |>! this.Next |>! this.Next

    type FibonacciRules() =
        inherit OriginalRules()

        override this.Name = "Fibonacci"
        override this.Title = "2584"
        override this.Hint = "Join the numbers and get to the <strong>2584 tile!</strong>"

        override this.Merge(v1, v2) =
            let merged =
                let d = v1 - v2
                if d = 0 then v1 = 1
                elif 0 < d then d <= v2
                else -d <= v1
            if merged then 
                let v = v1 + v2
                Some (v, v)
            else None
            
        override this.GoalValue = 2584
        
        override this.NewTileValue() =
            if Math.Random() < 0.9 then 1 else 2         
        
    type PlusMinusRules() =
        inherit OriginalRules()

        override this.Name = "PlusMinus"
        override this.Title = "&plusmn;64"
        override this.Hint = "Join the numbers and get <strong> both &plusmn;64 tiles!</strong>"

        override this.Merge(v1, v2) =
            if v1 = v2 then
                let v = v1 * 2
                Some (v, abs v)
            elif v1 = -v2 then
                Some (0, 0)
            else None 

        override this.NewTileValue() =
            if Math.Random() < 0.9 then 2 else 4
            * if Math.Random() < 0.5 then 1 else -1

        override this.GoalValue = 2584

        override this.Goal grid =
            gridContains grid this.GoalValue && gridContains grid -this.GoalValue

    let All : GameRules[] = 
        [|
            OriginalRules()
            FibonacciRules()
            PlusMinusRules()
        |]

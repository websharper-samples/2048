namespace Game2048

open WebSharper
open WebSharper.JQuery
open WebSharper.JavaScript

[<JavaScript>]
module InputManager =
    type Direction =
        | Up | Down | Left | Right

    type InputManager() =
        let move = Event<Direction>()  
        let restart = Event<_>() 
        let keepPlaying = Event<_>()

        let map =
            Map [
                38, Up
                39, Right
                40, Down
                37, Left
                75, Up    // Vim up
                76, Right // Vim right
                74, Down  // Vim down
                72, Left  // Vim left
                87, Up    // W
                68, Right // D
                83, Down  // S
                65, Left  // A
            ]
        
        do  JQuery.Of(JS.Document).On("keydown", fun _ ev ->
                let modifiers = ev.AltKey || ev.CtrlKey || ev.MetaKey || ev.ShiftKey
                let key = ev.Which
                if not modifiers then
                    match map |> Map.tryFind key with
                    | Some dir -> 
                        move.Trigger dir
                        ev.PreventDefault()
                    | _ ->
                    if key = 82 then
                        restart.Trigger()
                        ev.PreventDefault()
            ).Ignore
        
        let msPointerEnabled = JS.Window.Navigator?msPointerEnabled

        let eventTouchstart, eventTouchmove, eventTouchend =
            if msPointerEnabled then
                "MSPointerDown", "MSPointerMove", "MSPointerUp"
            else
                "touchstart", "touchmove", "touchend"

        let bindButtonPress (e: Event<_>) (jq: JQuery) =
            let fn (_: Dom.Element) (ee: Event) = e.Trigger(); ee.PreventDefault()
            jq.On("click", fn)
                .On(eventTouchend, fn).Ignore

        do  JQuery.Of ".retry-button" |> bindButtonPress restart
            JQuery.Of ".restart-button" |> bindButtonPress restart
            JQuery.Of ".keep-playing-button" |> bindButtonPress keepPlaying

        let gameContainer =  JQuery.Of ".game-container"

        let mutable touchStartClient = 0, 0

        do  gameContainer.On(eventTouchstart, fun ee ev ->
                if (msPointerEnabled && ev?touches?length > 1) || ev?targetTouches > 1 
                then () // Ignore if touching with more than 1 finger
                else 
                    if msPointerEnabled then
                        touchStartClient <- ev.PageX, ev.PageY
                    else
                        let touch = (ev?touches: _[]).[0]
                        touchStartClient <- touch?clientX, touch?clientY
                    ev.PreventDefault()   
            ).Ignore

            gameContainer.On(eventTouchend, fun ee ev ->
                if (msPointerEnabled && ev?touches?length > 0) || ev?targetTouches > 0
                then () // Ignore if still touching with one or more fingers
                else
                    let touchEndClient =
                        if msPointerEnabled then 
                            ev.PageX, ev.PageY
                        else
                            let changedTouch = (ev?changedTouches: _[]).[0]
                            changedTouch?clientX, changedTouch?clientY
                    
                    let dx = fst touchEndClient - fst touchStartClient
                    let absDx = abs dx
                    
                    let dy = snd touchEndClient - snd touchStartClient
                    let absDy = abs dy

                    if max absDx absDy > 10 then
                        if absDx > absDy then
                            if dx > 0 then Right else Left
                        else
                            if dy > 0 then Down else Up 
                        |> move.Trigger
                        ev.PreventDefault()
            ).Ignore

        member this.Move = move.Publish
        member this.Restart = restart.Publish
        member this.KeepPlaying = keepPlaying.Publish

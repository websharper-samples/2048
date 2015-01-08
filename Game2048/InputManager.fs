namespace Game2048

open IntelliFactory.WebSharper
open IntelliFactory.WebSharper.Html
open IntelliFactory.WebSharper.JQuery
open IntelliFactory.WebSharper.JavaScript

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
        
        do  JQuery.Of(JS.Document).On("keydown", fun e ->
                let e = e :?> Dom.KeyboardEvent
                let modifiers = e.AltKey || e.CtrlKey || e.MetaKey || e.ShiftKey
                let key = e?which
                if not modifiers then
                    match map |> Map.tryFind key with
                    | Some dir -> 
                        move.Trigger dir
                        false
                    | _ ->
                    if key = 82 then
                        restart.Trigger()
                        false
                    else true
                else true
            )
        
        let msPointerEnabled = JS.Window.Navigator?msPointerEnabled

        let eventTouchstart, eventTouchmove, eventTouchend =
            if msPointerEnabled then
                "MSPointerDown", "MSPointerMove", "MSPointerUp"
            else
                "touchstart", "touchmove", "touchend"

        let bindButtonPress (e: Event<_>) (jq: JQuery) =
            let fn (_: obj) = e.Trigger(); false
            jq.On("click", fn)
            jq.On(eventTouchend, fn)

        do  JQuery.Of ".retry-button" |> bindButtonPress restart
            JQuery.Of ".restart-button" |> bindButtonPress restart
            JQuery.Of ".keep-playing-button" |> bindButtonPress keepPlaying

        let gameContainer =  JQuery.Of ".game-container"

        let mutable touchStartClient = 0, 0

        do  gameContainer.On(eventTouchstart, fun e ->
                let e = e :?> Dom.Event
                if (msPointerEnabled && e?touches?length > 1) || e?targetTouches > 1 
                then true // Ignore if touching with more than 1 finger
                else 
                    if msPointerEnabled then
                        touchStartClient <- e?pageX, e?pageY
                    else
                        let touch = (e?touches: _[]).[0]
                        touchStartClient <- touch?clientX, touch?clientY
                    false    
            )

            gameContainer.On(eventTouchmove, fun e -> true)

            gameContainer.On(eventTouchend, fun e ->
                if (msPointerEnabled && e?touches?length > 0) || e?targetTouches > 0
                then true // Ignore if still touching with one or more fingers
                else
                    let touchEndClient =
                        if msPointerEnabled then 
                            e?pageX, e?pageY
                        else
                            let changedTouch = (e?changedTouches: _[]).[0]
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
                        false
                    else true
            )

        member this.Move = move.Publish
        member this.Restart = restart.Publish
        member this.KeepPlaying = keepPlaying.Publish
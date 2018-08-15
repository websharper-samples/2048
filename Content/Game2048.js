// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
var JSON;JSON||(JSON={}),function(){"use strict";function i(n){return n<10?"0"+n:n}function f(n){return o.lastIndex=0,o.test(n)?'"'+n.replace(o,function(n){var t=s[n];return typeof t=="string"?t:"\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+n+'"'}function r(i,e){var s,l,h,a,v=n,c,o=e[i];o&&typeof o=="object"&&typeof o.toJSON=="function"&&(o=o.toJSON(i)),typeof t=="function"&&(o=t.call(e,i,o));switch(typeof o){case"string":return f(o);case"number":return isFinite(o)?String(o):"null";case"boolean":case"null":return String(o);case"object":if(!o)return"null";if(n+=u,c=[],Object.prototype.toString.apply(o)==="[object Array]"){for(a=o.length,s=0;s<a;s+=1)c[s]=r(s,o)||"null";return h=c.length===0?"[]":n?"[\n"+n+c.join(",\n"+n)+"\n"+v+"]":"["+c.join(",")+"]",n=v,h}if(t&&typeof t=="object")for(a=t.length,s=0;s<a;s+=1)typeof t[s]=="string"&&(l=t[s],h=r(l,o),h&&c.push(f(l)+(n?": ":":")+h));else for(l in o)Object.prototype.hasOwnProperty.call(o,l)&&(h=r(l,o),h&&c.push(f(l)+(n?": ":":")+h));return h=c.length===0?"{}":n?"{\n"+n+c.join(",\n"+n)+"\n"+v+"}":"{"+c.join(",")+"}",n=v,h}}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+i(this.getUTCMonth()+1)+"-"+i(this.getUTCDate())+"T"+i(this.getUTCHours())+":"+i(this.getUTCMinutes())+":"+i(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var e=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,o=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,n,u,s={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},t;typeof JSON.stringify!="function"&&(JSON.stringify=function(i,f,e){var o;if(n="",u="",typeof e=="number")for(o=0;o<e;o+=1)u+=" ";else typeof e=="string"&&(u=e);if(t=f,f&&typeof f!="function"&&(typeof f!="object"||typeof f.length!="number"))throw new Error("JSON.stringify");return r("",{"":i})}),typeof JSON.parse!="function"&&(JSON.parse=function(n,t){function r(n,i){var f,e,u=n[i];if(u&&typeof u=="object")for(f in u)Object.prototype.hasOwnProperty.call(u,f)&&(e=r(u,f),e!==undefined?u[f]=e:delete u[f]);return t.call(n,i,u)}var i;if(n=String(n),e.lastIndex=0,e.test(n)&&(n=n.replace(e,function(n){return"\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)})),/^[\],:{}\s]*$/.test(n.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return i=eval("("+n+")"),typeof t=="function"?r({"":i},""):i;throw new SyntaxError("JSON.parse");})}();;
(function()
{
 "use strict";
 var Global,Game2048,Client,WebSharper,Operators,Arrays,Variants,Obj,Model,GameRules,LocalStorage,Unchecked,List,UI,HtmlModule,attr,HtmlActuator,InputManager,InputManager$1,GameState,StoredGame,Util,SC$1,Ref,Doc,T,AttrProxy,Object,Control,FSharpEvent,Collections,Map,JavaScript,Pervasives,EventTarget,WindowOrWorkerGlobalScope,Direction,FSharpMap,Strings,List$1,TileData,Array2D,Seq,Tile,JSONStorageItem,Arrays2D,Slice,Array,OriginalRules,FibonacciRules,PlusMinusRules,DomUtility,Attrs,Event,Event$1,MapUtil,Elt,Enumerator,T$1,View,Node,Array$1,BalancedTree,Pair,Tree,DocElemNode,CharacterData,Docs,Updates,SC$2,HashSet,Snap,Error,IndexOutOfRangeException,SC$3,Client$1,Attrs$1,Dyn,Abbrev,Fresh,SC$4,SC$5,HashSetUtil,Queue,console,Math,IntelliFactory,Runtime,JSON;
 Global=self;
 Game2048=Global.Game2048=Global.Game2048||{};
 Client=Game2048.Client=Game2048.Client||{};
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 Variants=Game2048.Variants=Game2048.Variants||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Model=Game2048.Model=Game2048.Model||{};
 GameRules=Model.GameRules=Model.GameRules||{};
 LocalStorage=Game2048.LocalStorage=Game2048.LocalStorage||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 List=WebSharper.List=WebSharper.List||{};
 UI=WebSharper.UI=WebSharper.UI||{};
 HtmlModule=UI.HtmlModule=UI.HtmlModule||{};
 attr=HtmlModule.attr=HtmlModule.attr||{};
 HtmlActuator=Client.HtmlActuator=Client.HtmlActuator||{};
 InputManager=Game2048.InputManager=Game2048.InputManager||{};
 InputManager$1=InputManager.InputManager=InputManager.InputManager||{};
 GameState=Client.GameState=Client.GameState||{};
 StoredGame=Client.StoredGame=Client.StoredGame||{};
 Util=WebSharper.Util=WebSharper.Util||{};
 SC$1=Global.StartupCode$Game2048$Variants=Global.StartupCode$Game2048$Variants||{};
 Ref=LocalStorage.Ref=LocalStorage.Ref||{};
 Doc=UI.Doc=UI.Doc||{};
 T=List.T=List.T||{};
 AttrProxy=UI.AttrProxy=UI.AttrProxy||{};
 Object=Global.Object;
 Control=WebSharper.Control=WebSharper.Control||{};
 FSharpEvent=Control.FSharpEvent=Control.FSharpEvent||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 Map=Collections.Map=Collections.Map||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 EventTarget=Global.EventTarget;
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 Direction=InputManager.Direction=InputManager.Direction||{};
 FSharpMap=Collections.FSharpMap=Collections.FSharpMap||{};
 Strings=WebSharper.Strings=WebSharper.Strings||{};
 List$1=Collections.List=Collections.List||{};
 TileData=Model.TileData=Model.TileData||{};
 Array2D=Game2048.Array2D=Game2048.Array2D||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 Tile=Model.Tile=Model.Tile||{};
 JSONStorageItem=LocalStorage.JSONStorageItem=LocalStorage.JSONStorageItem||{};
 Arrays2D=WebSharper.Arrays2D=WebSharper.Arrays2D||{};
 Slice=WebSharper.Slice=WebSharper.Slice||{};
 Array=Game2048.Array=Game2048.Array||{};
 OriginalRules=Variants.OriginalRules=Variants.OriginalRules||{};
 FibonacciRules=Variants.FibonacciRules=Variants.FibonacciRules||{};
 PlusMinusRules=Variants.PlusMinusRules=Variants.PlusMinusRules||{};
 DomUtility=UI.DomUtility=UI.DomUtility||{};
 Attrs=UI.Attrs=UI.Attrs||{};
 Event=Control.Event=Control.Event||{};
 Event$1=Event.Event=Event.Event||{};
 MapUtil=Collections.MapUtil=Collections.MapUtil||{};
 Elt=UI.Elt=UI.Elt||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 T$1=Enumerator.T=Enumerator.T||{};
 View=UI.View=UI.View||{};
 Node=Global.Node;
 Array$1=UI.Array=UI.Array||{};
 BalancedTree=Collections.BalancedTree=Collections.BalancedTree||{};
 Pair=Collections.Pair=Collections.Pair||{};
 Tree=BalancedTree.Tree=BalancedTree.Tree||{};
 DocElemNode=UI.DocElemNode=UI.DocElemNode||{};
 CharacterData=Global.CharacterData;
 Docs=UI.Docs=UI.Docs||{};
 Updates=UI.Updates=UI.Updates||{};
 SC$2=Global.StartupCode$WebSharper_UI$DomUtility=Global.StartupCode$WebSharper_UI$DomUtility||{};
 HashSet=Collections.HashSet=Collections.HashSet||{};
 Snap=UI.Snap=UI.Snap||{};
 Error=Global.Error;
 IndexOutOfRangeException=WebSharper.IndexOutOfRangeException=WebSharper.IndexOutOfRangeException||{};
 SC$3=Global.StartupCode$Game2048$Utils=Global.StartupCode$Game2048$Utils||{};
 Client$1=UI.Client=UI.Client||{};
 Attrs$1=Client$1.Attrs=Client$1.Attrs||{};
 Dyn=Attrs$1.Dyn=Attrs$1.Dyn||{};
 Abbrev=UI.Abbrev=UI.Abbrev||{};
 Fresh=Abbrev.Fresh=Abbrev.Fresh||{};
 SC$4=Global.StartupCode$WebSharper_UI$Attr_Client=Global.StartupCode$WebSharper_UI$Attr_Client||{};
 SC$5=Global.StartupCode$WebSharper_UI$Abbrev=Global.StartupCode$WebSharper_UI$Abbrev||{};
 HashSetUtil=Collections.HashSetUtil=Collections.HashSetUtil||{};
 Queue=WebSharper.Queue=WebSharper.Queue||{};
 console=Global.console;
 Math=Global.Math;
 IntelliFactory=Global.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 JSON=Global.JSON;
 Client.Main=function()
 {
  var $1,storedGame,score,bestScore,grid,keepPlaying,isGameTerminated,actuator,inputManager,selectGameType,i,$2,v,a,rules,gridContainer,i$1,$3;
  function load()
  {
   var stored,m;
   stored=storedGame.Game2048_LocalStorage_IValue_1$get_Value().Game2048_LocalStorage_IValue_1$get_Value();
   score.Game2048_LocalStorage_IValue_1$set_Value(stored.Score);
   bestScore.Game2048_LocalStorage_IValue_1$set_Value(stored.BestScore);
   grid.Game2048_LocalStorage_IValue_1$set_Value((m=stored.Values,m!=null&&m.$==1?Client.gridFromValues(m.$0):rules.Game2048_LocalStorage_IValue_1$get_Value().Start()));
  }
  function save(over)
  {
   storedGame.Game2048_LocalStorage_IValue_1$get_Value().Game2048_LocalStorage_IValue_1$set_Value(StoredGame.New(over?null:{
    $:1,
    $0:Client.gridValues(grid.Game2048_LocalStorage_IValue_1$get_Value())
   },score.Game2048_LocalStorage_IValue_1$get_Value(),bestScore.Game2048_LocalStorage_IValue_1$get_Value()));
  }
  function actuate(over,won)
  {
   save(over);
   isGameTerminated.Game2048_LocalStorage_IValue_1$set_Value(over||won&&!keepPlaying.Game2048_LocalStorage_IValue_1$get_Value());
   return actuator.Actuate(grid.Game2048_LocalStorage_IValue_1$get_Value(),GameState.New(score.Game2048_LocalStorage_IValue_1$get_Value(),over,won,bestScore.Game2048_LocalStorage_IValue_1$get_Value(),isGameTerminated.Game2048_LocalStorage_IValue_1$get_Value()));
  }
  function continueGame()
  {
   isGameTerminated.Game2048_LocalStorage_IValue_1$set_Value(false);
   actuator.ClearMessage();
  }
  function setRules(r)
  {
   rules.Game2048_LocalStorage_IValue_1$set_Value(r);
   Global.jQuery(".title").html(r.get_Title());
   Global.jQuery(".game-intro").html(r.get_Hint());
   storedGame.Game2048_LocalStorage_IValue_1$set_Value(new JSONStorageItem.New(r.get_Name(),StoredGame.New(null,0,0)));
   load();
   keepPlaying.Game2048_LocalStorage_IValue_1$set_Value(false);
   continueGame();
   actuate(false,false);
  }
  function restart()
  {
   score.Game2048_LocalStorage_IValue_1$set_Value(0);
   grid.Game2048_LocalStorage_IValue_1$set_Value(rules.Game2048_LocalStorage_IValue_1$get_Value().Start());
   keepPlaying.Game2048_LocalStorage_IValue_1$set_Value(false);
   continueGame();
   actuate(false,false);
  }
  selectGameType=Global.jQuery(".select-gametype");
  for(i=0,$2=Variants.All().length-1;i<=$2;i++){
   v=Arrays.get(Variants.All(),i);
   a="<option value=\""+v.get_Name()+"\">"+v.get_Name()+"</option>";
   selectGameType.append.apply(selectGameType,[a]);
  }
  rules=new Ref.New(null);
  gridContainer=Global.jQuery(".grid-container");
  for(i$1=1,$3=4;i$1<=$3;i$1++)(function()
  {
   var a$1;
   a$1=Doc.Element("div",List.ofArray([AttrProxy.Create("class","grid-row")]),Arrays.init(4,function()
   {
    return Doc.Element("div",[AttrProxy.Create("class","grid-cell")],[]);
   })).elt,gridContainer.append.apply(gridContainer,[a$1]);
  }());
  storedGame=new Ref.New(null);
  score=new Ref.New(0);
  bestScore=new Ref.New(0);
  grid=new Ref.New(null);
  keepPlaying=new Ref.New(false);
  isGameTerminated=new Ref.New(false);
  actuator=new HtmlActuator.New();
  inputManager=new InputManager$1.New();
  selectGameType.on("change",function()
  {
   var v$1,i$2,$4,r;
   v$1=selectGameType.val();
   for(i$2=0,$4=Variants.All().length-1;i$2<=$4;i$2++){
    r=Arrays.get(Variants.All(),i$2);
    v$1===r.get_Name()?setRules(r):void 0;
    selectGameType.blur();
   }
  });
  inputManager.get_Move().Subscribe(Util.observer(function(dir)
  {
   var rules$1,m;
   rules$1=rules.Game2048_LocalStorage_IValue_1$get_Value();
   isGameTerminated.Game2048_LocalStorage_IValue_1$get_Value()?void 0:(m=Client.moveGrid(score,function(a$1,a$2)
   {
    return rules$1.Merge(a$1,a$2);
   },grid.Game2048_LocalStorage_IValue_1$get_Value(),dir),m!=null&&m.$==1?(grid.Game2048_LocalStorage_IValue_1$set_Value(m.$0),rules$1.Next(grid.Game2048_LocalStorage_IValue_1$get_Value()),bestScore.Game2048_LocalStorage_IValue_1$get_Value()<score.Game2048_LocalStorage_IValue_1$get_Value()?bestScore.Game2048_LocalStorage_IValue_1$set_Value(score.Game2048_LocalStorage_IValue_1$get_Value()):void 0,actuate(!Model.moveAvailable(function(t)
   {
    return rules$1.Merge(t[0],t[1]);
   },grid.Game2048_LocalStorage_IValue_1$get_Value()),rules$1.Goal(grid.Game2048_LocalStorage_IValue_1$get_Value()))):void 0);
  }));
  inputManager.get_Restart().Subscribe(Util.observer(function()
  {
   restart();
  }));
  inputManager.get_KeepPlaying().Subscribe(Util.observer(function()
  {
   keepPlaying.Game2048_LocalStorage_IValue_1$set_Value(true);
   continueGame();
  }));
  setRules(Arrays.get(Variants.All(),0));
 };
 Client.moveGrid=function(scoreRef,merge,grid,dir)
 {
  var len1,len2,newGrid,i,$1,j,$2,j$1,$3,i$1,$4;
  len1=grid.length;
  len2=grid.length?grid[0].length:0;
  newGrid=Arrays.zeroCreate2D(len1,len2);
  console.log("moveGrid");
  if(dir.$==1)
   {
    for(i=0,$1=len1-1;i<=$1;i++)(function(i$2)
    {
     var j$2;
     j$2=new Ref.New(len2+1);
     return Slice.setArray2Dfix1(newGrid,i,null,null,Array.pad(len2,Model.doMerge(scoreRef,merge,function()
     {
      LocalStorage.decr(j$2);
      return[i$2+1,j$2.Game2048_LocalStorage_IValue_1$get_Value()];
     },Arrays.choose(Global.id,Slice.array2Dfix1(grid,i,null,null)).slice().reverse())).slice().reverse());
    }(i));
   }
  else
   if(dir.$==2)
    {
     for(j=0,$2=len2-1;j<=$2;j++)(function(j$2)
     {
      var i$2;
      i$2=new Ref.New(0);
      return Slice.setArray2Dfix2(newGrid,null,null,j,Array.pad(len1,Model.doMerge(scoreRef,merge,function()
      {
       LocalStorage.incr(i$2);
       return[i$2.Game2048_LocalStorage_IValue_1$get_Value(),j$2+1];
      },Arrays.choose(Global.id,Slice.array2Dfix2(grid,null,null,j)))));
     }(j));
    }
   else
    if(dir.$==3)
     {
      for(j$1=0,$3=len2-1;j$1<=$3;j$1++)(function(j$2)
      {
       var i$2;
       i$2=new Ref.New(len1+1);
       return Slice.setArray2Dfix2(newGrid,null,null,j$1,Array.pad(len1,Model.doMerge(scoreRef,merge,function()
       {
        LocalStorage.decr(i$2);
        return[i$2.Game2048_LocalStorage_IValue_1$get_Value(),j$2+1];
       },Arrays.choose(Global.id,Slice.array2Dfix2(grid,null,null,j$1)).slice().reverse())).slice().reverse());
      }(j$1));
     }
    else
     {
      for(i$1=0,$4=len1-1;i$1<=$4;i$1++)(function(i$2)
      {
       var j$2;
       j$2=new Ref.New(0);
       return Slice.setArray2Dfix1(newGrid,i$1,null,null,Array.pad(len2,Model.doMerge(scoreRef,merge,function()
       {
        LocalStorage.incr(j$2);
        return[i$2+1,j$2.Game2048_LocalStorage_IValue_1$get_Value()];
       },Arrays.choose(Global.id,Slice.array2Dfix1(grid,i$1,null,null)))));
      }(i$1));
     }
  return Unchecked.Equals(Client.gridValues(newGrid),Client.gridValues(grid))?null:{
   $:1,
   $0:newGrid
  };
 };
 Client.gridValues=function(grid)
 {
  function m(a)
  {
   return a.Current.Value;
  }
  return Arrays2D.map(function(o)
  {
   return o==null?null:{
    $:1,
    $0:m(o.$0)
   };
  },grid);
 };
 Client.gridFromValues=function(values)
 {
  function m(i,j)
  {
   function m$1(v)
   {
    return Model.newTile(i+1,j+1,v);
   }
   return function(o)
   {
    return o==null?null:{
     $:1,
     $0:m$1(o.$0)
    };
   };
  }
  return Arrays2D.mapi(function($1,$2,$3)
  {
   return(m($1,$2))($3);
  },values);
 };
 Operators.FailWith=function(msg)
 {
  throw new Error(msg);
 };
 Operators.range=function(min,max)
 {
  var count;
  count=1+max-min;
  return count<=0?[]:Seq.init(count,function(x)
  {
   return x+min;
  });
 };
 Operators.toInt=function(x)
 {
  var u;
  u=Operators.toUInt(x);
  return u>=2147483648?u-4294967296:u;
 };
 Operators.toUInt=function(x)
 {
  return(x<0?Math.ceil(x):Math.floor(x))>>>0;
 };
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  size<0?Operators.FailWith("Negative size given."):null;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 Arrays.iter=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(arr[i]);
 };
 Arrays.choose=function(f,arr)
 {
  var q,i,$1,m;
  q=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   m=f(arr[i]);
   m==null?void 0:q.push(m.$0);
  }
  return q;
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.sortInPlace=function(arr)
 {
  Arrays.mapInPlace(function(t)
  {
   return t[0];
  },Arrays.mapiInPlace(function($1,$2)
  {
   return[$2,$1];
  },arr).sort(Unchecked.Compare));
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Arrays.create=function(size,value)
 {
  var r,i,$1;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=value;
  return r;
 };
 Arrays.foldBack=function(f,arr,zero)
 {
  var acc,$1,len,i,$2;
  acc=zero;
  len=arr.length;
  for(i=1,$2=len;i<=$2;i++)acc=f(arr[len-i],acc);
  return acc;
 };
 Variants.All=function()
 {
  SC$1.$cctor();
  return SC$1.All;
 };
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.set=function(arr,n,x)
 {
  Arrays.checkBounds(arr,n);
  arr[n]=x;
 };
 Arrays.get2D=function(arr,n1,n2)
 {
  Arrays.checkBounds2D(arr,n1,n2);
  return arr[n1][n2];
 };
 Arrays.zeroCreate2D=function(n,m)
 {
  var arr;
  arr=Arrays.init(n,function()
  {
   return Arrays.create(m,null);
  });
  arr.dims=2;
  return arr;
 };
 Arrays.set2D=function(arr,n1,n2,x)
 {
  Arrays.checkBounds2D(arr,n1,n2);
  arr[n1][n2]=x;
 };
 Arrays.checkBounds2D=function(arr,n1,n2)
 {
  if(n1<0||n2<0||n1>=arr.length||n2>=(arr.length?arr[0].length:0))
   throw new IndexOutOfRangeException.New();
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  },
  GetHashCode:function()
  {
   return -1;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 GameRules=Model.GameRules=Runtime.Class({},Obj,GameRules);
 GameRules.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },GameRules);
 LocalStorage.decr=function(i)
 {
  i.Game2048_LocalStorage_IValue_1$set_Value(i.Game2048_LocalStorage_IValue_1$get_Value()-1);
 };
 LocalStorage.incr=function(i)
 {
  i.Game2048_LocalStorage_IValue_1$set_Value(i.Game2048_LocalStorage_IValue_1$get_Value()+1);
 };
 LocalStorage.localStorage=function()
 {
  SC$3.$cctor();
  return SC$3.localStorage;
 };
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.Compare=function(a,b)
 {
  var $1,m,$2,cmp,k,k$1;
  if(a===b)
   return 0;
  else
   {
    m=typeof a;
    switch(m=="function"?1:m=="boolean"?2:m=="number"?2:m=="string"?2:m=="object"?3:0)
    {
     case 0:
      return typeof b=="undefined"?0:-1;
     case 1:
      return Operators.FailWith("Cannot compare function values.");
     case 2:
      return a<b?-1:1;
     case 3:
      if(a===null)
       $2=-1;
      else
       if(b===null)
        $2=1;
       else
        if("CompareTo"in a)
         $2=a.CompareTo(b);
        else
         if("CompareTo0"in a)
          $2=a.CompareTo0(b);
         else
          if(a instanceof Global.Array&&b instanceof Global.Array)
           $2=Unchecked.compareArrays(a,b);
          else
           if(a instanceof Global.Date&&b instanceof Global.Date)
            $2=Unchecked.compareDates(a,b);
           else
            {
             cmp=[0];
             for(var k$2 in a)if(function(k$3)
             {
              return!a.hasOwnProperty(k$3)?false:!b.hasOwnProperty(k$3)?(cmp[0]=1,true):(cmp[0]=Unchecked.Compare(a[k$3],b[k$3]),cmp[0]!==0);
             }(k$2))
              break;
             if(cmp[0]===0)
              {
               for(var k$3 in b)if(function(k$4)
               {
                return!b.hasOwnProperty(k$4)?false:!a.hasOwnProperty(k$4)&&(cmp[0]=-1,true);
               }(k$3))
                break;
              }
             $2=cmp[0];
            }
      return $2;
    }
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.compareArrays=function(a,b)
 {
  var cmp,i;
  if(Arrays.length(a)<Arrays.length(b))
   return -1;
  else
   if(Arrays.length(a)>Arrays.length(b))
    return 1;
   else
    {
     cmp=0;
     i=0;
     while(cmp===0&&i<Arrays.length(a))
      {
       cmp=Unchecked.Compare(Arrays.get(a,i),Arrays.get(b,i));
       i=i+1;
      }
     return cmp;
    }
 };
 Unchecked.compareDates=function(a,b)
 {
  return Unchecked.Compare(a.getTime(),b.getTime());
 };
 Unchecked.Hash=function(o)
 {
  var m;
  m=typeof o;
  return m=="function"?0:m=="boolean"?o?1:0:m=="number"?o:m=="string"?Unchecked.hashString(o):m=="object"?o==null?0:o instanceof Global.Array?Unchecked.hashArray(o):Unchecked.hashObject(o):0;
 };
 Unchecked.hashString=function(s)
 {
  var hash,i,$1;
  if(s===null)
   return 0;
  else
   {
    hash=5381;
    for(i=0,$1=s.length-1;i<=$1;i++)hash=Unchecked.hashMix(hash,s[i].charCodeAt());
    return hash;
   }
 };
 Unchecked.hashArray=function(o)
 {
  var h,i,$1;
  h=-34948909;
  for(i=0,$1=Arrays.length(o)-1;i<=$1;i++)h=Unchecked.hashMix(h,Unchecked.Hash(Arrays.get(o,i)));
  return h;
 };
 Unchecked.hashObject=function(o)
 {
  var h,k;
  if("GetHashCode"in o)
   return o.GetHashCode();
  else
   {
    h=[0];
    for(var k$1 in o)if(function(key)
    {
     h[0]=Unchecked.hashMix(Unchecked.hashMix(h[0],Unchecked.hashString(key)),Unchecked.Hash(o[key]));
     return false;
    }(k$1))
     break;
    return h[0];
   }
 };
 Unchecked.hashMix=function(x,y)
 {
  return(x<<5)+x+y;
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.append=function(x,y)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return y;
  else
   if(y.$==0)
    return x;
   else
    {
     res=new T({
      $:1
     });
     r=res;
     l=x;
     go=true;
     while(go)
      {
       r.$0=l.$0;
       l=l.$1;
       l.$==0?go=false:r=(t=new T({
        $:1
       }),r.$1=t,t);
      }
     r.$1=y;
     return res;
    }
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 attr=HtmlModule.attr=Runtime.Class({},Obj,attr);
 HtmlActuator=Client.HtmlActuator=Runtime.Class({
  Actuate:function(grid,state)
  {
   var $this;
   $this=this;
   Global.requestAnimationFrame(function()
   {
    var diff,_this,a;
    function positionClass(x,y)
    {
     return"tile-position-"+Global.String(x)+"-"+Global.String(y);
    }
    function applyClasses(el,classes)
    {
     return el.SetAttribute("class",Strings.concat(" ",classes));
    }
    function addTile(moveTo,addClass,tile)
    {
     var inner,classes,wrapper,_this$1,a$1,pos;
     inner=Doc.Element("div",[AttrProxy.Create("class","tile-inner")],[Doc.TextNode(Global.String(tile.Value))]);
     classes=Arrays.ofSeq(List.append(List.ofArray(["tile","tile-"+Global.String(tile.Value),positionClass.apply(null,tile.Pos)]),addClass));
     wrapper=Doc.Element("div",[],[inner]);
     tile.Value>2048?classes.push("tile-super"):void 0;
     applyClasses(wrapper,classes);
     _this$1=$this.tileContainer;
     a$1=wrapper.elt;
     _this$1.append.apply(_this$1,[a$1]);
     return moveTo!=null&&moveTo.$==1?(pos=moveTo.$0,Global.requestAnimationFrame(function()
     {
      Arrays.set(classes,2,positionClass.apply(null,pos));
      applyClasses(wrapper,classes);
     })):null;
    }
    function message(cls,text)
    {
     console.log(text);
     $this.messageContainer.addClass(cls);
     $this.messageContainer.find("p").first().text(text);
    }
    $this.tileContainer.empty();
    Seq.iter(function(tile)
    {
     var m,$1,$2;
     m=tile.Previous;
     m!=null&&m.$==1?addTile({
      $:1,
      $0:tile.Current.Pos
     },T.Empty,m.$0):tile.MergedFrom.length==0?addTile(null,List.ofArray(["tile-new"]),tile.Current):(Arrays.iter(($1={
      $:1,
      $0:tile.Current.Pos
     },($2=T.Empty,function($3)
     {
      return addTile($1,$2,$3);
     })),tile.MergedFrom),addTile(null,List.ofArray(["tile-merged"]),tile.Current));
    },Seq.choose(Global.id,Array2D.toSeq(grid)));
    $this.scoreContainer.empty();
    diff=state.Score-$this.score;
    $this.score=state.Score;
    $this.scoreContainer.text(Global.String($this.score));
    diff>0?(_this=$this.scoreContainer,a=Doc.Element("div",[AttrProxy.Create("class","score-addition")],[Doc.TextNode("+"+Global.String(diff))]).elt,_this.append.apply(_this,[a])):void 0;
    $this.bestContainer.text(Global.String(state.BestScore));
    state.Terminated?state.Over?message("game-over","Game over!"):state.Won?message("game-won","You win!"):void 0:void 0;
   });
  },
  ClearMessage:function()
  {
   this.messageContainer.removeClass("game-won").removeClass("game-over");
  }
 },Obj,HtmlActuator);
 HtmlActuator.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.tileContainer=Global.jQuery(".tile-container");
  this.scoreContainer=Global.jQuery(".score-container");
  this.bestContainer=Global.jQuery(".best-container");
  this.messageContainer=Global.jQuery(".game-message");
  this.score=0;
 },HtmlActuator);
 InputManager$1=InputManager.InputManager=Runtime.Class({
  get_Move:function()
  {
   return this.move.event;
  },
  get_Restart:function()
  {
   return this.restart.event;
  },
  get_KeepPlaying:function()
  {
   return this.keepPlaying.event;
  },
  bindButtonPress:function(e,jq)
  {
   function fn(a,ee)
   {
    e.event.Trigger(null);
    return ee.preventDefault();
   }
   jq.on("click",function($1)
   {
    return fn(this,$1);
   }).on(this.eventTouchend,function($1)
   {
    return fn(this,$1);
   });
  }
 },Obj,InputManager$1);
 InputManager$1.New=Runtime.Ctor(function()
 {
  var $this,map,msPointerEnabled,p,gameContainer;
  $this=this;
  Obj.New.call(this);
  this.move=new FSharpEvent.New();
  this.restart=new FSharpEvent.New();
  this.keepPlaying=new FSharpEvent.New();
  map=new FSharpMap.New(List.ofArray([[38,Direction.Up],[39,Direction.Right],[40,Direction.Down],[37,Direction.Left],[75,Direction.Up],[76,Direction.Right],[74,Direction.Down],[72,Direction.Left],[87,Direction.Up],[68,Direction.Right],[83,Direction.Down],[65,Direction.Left]]));
  Global.jQuery(self.document).on("keydown",function(ev)
  {
   var modifiers,key,m;
   modifiers=ev.altKey||ev.ctrlKey||ev.metaKey||ev.shiftKey;
   key=ev.which;
   return!modifiers?(m=Map.TryFind(key,map),m!=null&&m.$==1?($this.move.event.Trigger(m.$0),ev.preventDefault()):key===82?($this.restart.event.Trigger(null),ev.preventDefault()):null):null;
  });
  msPointerEnabled=self.navigator.msPointerEnabled;
  p=msPointerEnabled?["MSPointerDown","MSPointerMove","MSPointerUp"]:["touchstart","touchmove","touchend"];
  this.eventTouchend=p[2];
  $this.bindButtonPress(this.restart,Global.jQuery(".retry-button"));
  $this.bindButtonPress(this.restart,Global.jQuery(".restart-button"));
  $this.bindButtonPress(this.keepPlaying,Global.jQuery(".keep-playing-button"));
  gameContainer=Global.jQuery(".game-container");
  this.touchStartClient=[0,0];
  gameContainer.on(p[0],function(ev)
  {
   var touch;
   return msPointerEnabled&&ev.touches.length>1||ev.targetTouches>1?null:(msPointerEnabled?$this.touchStartClient=[ev.pageX,ev.pageY]:(touch=Arrays.get(ev.touches,0),$this.touchStartClient=[touch.clientX,touch.clientY]),ev.preventDefault());
  });
  gameContainer.on(this.eventTouchend,function(ev)
  {
   var touchEndClient,changedTouch,dx,absDx,dy,absDy;
   return msPointerEnabled&&ev.touches.length>0||ev.targetTouches>0?null:(touchEndClient=msPointerEnabled?[ev.pageX,ev.pageY]:(changedTouch=Arrays.get(ev.changedTouches,0),[changedTouch.clientX,changedTouch.clientY]),(dx=touchEndClient[0]-$this.touchStartClient[0],(absDx=Math.abs(dx),(dy=touchEndClient[1]-$this.touchStartClient[1],(absDy=Math.abs(dy),(Unchecked.Compare(absDx,absDy)===1?absDx:absDy)>10?($this.move.event.Trigger(absDx>absDy?dx>0?Direction.Right:Direction.Left:dy>0?Direction.Down:Direction.Up),ev.preventDefault()):null)))));
  });
 },InputManager$1);
 GameState.New=function(Score,Over,Won,BestScore,Terminated)
 {
  return{
   Score:Score,
   Over:Over,
   Won:Won,
   BestScore:BestScore,
   Terminated:Terminated
  };
 };
 StoredGame.New=function(Values,Score,BestScore)
 {
  return{
   Values:Values,
   Score:Score,
   BestScore:BestScore
  };
 };
 Util.observer=function(h)
 {
  return{
   OnCompleted:function()
   {
    return null;
   },
   OnError:function()
   {
    return null;
   },
   OnNext:h
  };
 };
 Model.moveAvailable=function(merge,grid)
 {
  var gridVals,len1,len2;
  function g(o)
  {
   return o!=null;
  }
  return Array2D.exists(function(o)
  {
   return o==null;
  },grid)||(gridVals=Arrays2D.map(function(a)
  {
   return a!=null&&a.$==1?a.$0.Current.Value:0;
  },grid),(len1=gridVals.length,(len2=gridVals.length?gridVals[0].length:0,Seq.exists(function(x)
  {
   return g(merge(x));
  },Seq.delay(function()
  {
   return Seq.append(Seq.collect(function(i)
   {
    return Seq.pairwise(Slice.array2Dfix1(gridVals,i,null,null));
   },Operators.range(0,len1-1)),Seq.delay(function()
   {
    return Seq.collect(function(i)
    {
     return Seq.pairwise(Slice.array2Dfix2(gridVals,null,null,i));
    },Operators.range(0,len2-1));
   }));
  })))));
 };
 Model.doMerge=function(scoreRef,merge,getnextPos,row)
 {
  var m,t,res,prev,i,$1,cell,m$1,pcell,m$2,t$1,t$2;
  res=[];
  prev=new Ref.New(null);
  for(i=0,$1=row.length-1;i<=$1;i++){
   cell=Arrays.get(row,i);
   m$1=prev.Game2048_LocalStorage_IValue_1$get_Value();
   m$1!=null&&m$1.$==1?(pcell=m$1.$0,m$2=merge(pcell.Current.Value,cell.Current.Value),m$2!=null&&m$2.$==1?(scoreRef.Game2048_LocalStorage_IValue_1$set_Value(scoreRef.Game2048_LocalStorage_IValue_1$get_Value()+m$2.$0[1]),res.push((t$1=getnextPos(),Model.mergeTiles(t$1[0],t$1[1],m$2.$0[0],pcell,cell))),prev.Game2048_LocalStorage_IValue_1$set_Value(null)):(res.push((t$2=getnextPos(),Model.moveTile(t$2[0],t$2[1],pcell))),prev.Game2048_LocalStorage_IValue_1$set_Value({
    $:1,
    $0:cell
   }))):prev.Game2048_LocalStorage_IValue_1$set_Value({
    $:1,
    $0:cell
   });
  }
  m=prev.Game2048_LocalStorage_IValue_1$get_Value();
  m!=null&&m.$==1?res.push((t=getnextPos(),Model.moveTile(t[0],t[1],m.$0))):void 0;
  return res;
 };
 Model.newTile=function(p,p$1,value)
 {
  return Tile.New(TileData.New([p,p$1],value),null,[]);
 };
 Model.mergeTiles=function(n,n$1,newValue,tile1,tile2)
 {
  return Tile.New(TileData.New([n,n$1],newValue),null,[tile1.Current,tile2.Current]);
 };
 Model.moveTile=function(n,n$1,tile)
 {
  return Tile.New(TileData.New([n,n$1],tile.Current.Value),{
   $:1,
   $0:tile.Current
  },[]);
 };
 Model.addRandomTile=function(grid,value)
 {
  var empty,p,j,i;
  empty=[];
  Arrays2D.iteri(function(i$1,j$1,c)
  {
   return c==null?void empty.push([i$1,j$1]):null;
  },grid);
  p=Arrays.get(empty,Operators.toInt(Math.random()*Arrays.length(empty)));
  j=p[1];
  i=p[0];
  Arrays.set2D(grid,i,j,{
   $:1,
   $0:Model.newTile(i+1,j+1,value)
  });
 };
 Model.gridContains=function(grid,value)
 {
  return Array2D.exists(function(a)
  {
   return a!=null&&a.$==1&&a.$0.Current.Value===value;
  },grid);
 };
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.All=[new OriginalRules.New(),new FibonacciRules.New(),new PlusMinusRules.New()];
 };
 Ref=LocalStorage.Ref=Runtime.Class({
  Game2048_LocalStorage_IValue_1$set_Value:function(value)
  {
   this.v=value;
  },
  Game2048_LocalStorage_IValue_1$get_Value:function()
  {
   return this.v;
  }
 },Obj,Ref);
 Ref.New=Runtime.Ctor(function(value)
 {
  Obj.New.call(this);
  this.v=value;
 },Ref);
 Doc=UI.Doc=Runtime.Class({},Obj,Doc);
 Doc.Element=function(name,attr$1,children)
 {
  var a,a$1;
  a=AttrProxy.Concat(attr$1);
  a$1=Doc.Concat(children);
  return Elt.New(DomUtility.CreateElement(name),a,a$1);
 };
 Doc.Concat=function(xs)
 {
  var x;
  x=Array$1.ofSeqNonCopying(xs);
  return Array$1.TreeReduce(Doc.get_Empty(),Doc.Append,x);
 };
 Doc.TextNode=function(v)
 {
  return Doc.Mk({
   $:5,
   $0:DomUtility.CreateText(v)
  },View.Const());
 };
 Doc.Append=function(a,b)
 {
  return Doc.Mk({
   $:0,
   $0:a.docNode,
   $1:b.docNode
  },View.Map2Unit(a.updates,b.updates));
 };
 Doc.get_Empty=function()
 {
  return Doc.Mk(null,View.Const());
 };
 Doc.Mk=function(node,updates)
 {
  return new Doc.New(node,updates);
 };
 Doc.New=Runtime.Ctor(function(docNode,updates)
 {
  Obj.New.call(this);
  this.docNode=docNode;
  this.updates=updates;
 },Doc);
 T=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 AttrProxy=UI.AttrProxy=Runtime.Class({},null,AttrProxy);
 AttrProxy.Create=function(name,value)
 {
  return Attrs.Static(function(el)
  {
   DomUtility.SetAttr(el,name,value);
  });
 };
 AttrProxy.Concat=function(xs)
 {
  var x;
  x=Array$1.ofSeqNonCopying(xs);
  return Array$1.TreeReduce(Attrs.EmptyAttr(),AttrProxy.Append,x);
 };
 AttrProxy.Append=function(a,b)
 {
  return Attrs.AppendTree(a,b);
 };
 FSharpEvent=Control.FSharpEvent=Runtime.Class({},Obj,FSharpEvent);
 FSharpEvent.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.event=Event$1.New([]);
 },FSharpEvent);
 Map.TryFind=function(k,m)
 {
  return m.TryFind(k);
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Direction.Right={
  $:3
 };
 Direction.Left={
  $:2
 };
 Direction.Down={
  $:1
 };
 Direction.Up={
  $:0
 };
 FSharpMap=Collections.FSharpMap=Runtime.Class({
  TryFind:function(k)
  {
   var o;
   o=BalancedTree.TryFind(Pair.New(k,void 0),this.tree);
   return o==null?null:{
    $:1,
    $0:o.$0.Value
   };
  },
  Equals:function(other)
  {
   return this.get_Count()===other.get_Count()&&Seq.forall2(Unchecked.Equals,this,other);
  },
  get_Count:function()
  {
   var tree;
   tree=this.tree;
   return tree==null?0:tree.Count;
  },
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kv)
   {
    return{
     K:kv.Key,
     V:kv.Value
    };
   },BalancedTree.Enumerate(false,this.tree)));
  },
  GetHashCode:function()
  {
   return Unchecked.Hash(Arrays.ofSeq(this));
  },
  CompareTo0:function(other)
  {
   return Seq.compareWith(Unchecked.Compare,this,other);
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  }
 },Obj,FSharpMap);
 FSharpMap.New=Runtime.Ctor(function(s)
 {
  FSharpMap.New$1.call(this,MapUtil.fromSeq(s));
 },FSharpMap);
 FSharpMap.New$1=Runtime.Ctor(function(tree)
 {
  Obj.New.call(this);
  this.tree=tree;
 },FSharpMap);
 Strings.concat=function(separator,strings)
 {
  return Arrays.ofSeq(strings).join(separator);
 };
 List$1=Collections.List=Runtime.Class({
  GetEnumerator:function()
  {
   return Enumerator.Get(this);
  }
 },null,List$1);
 TileData.New=function(Pos,Value)
 {
  return{
   Pos:Pos,
   Value:Value
  };
 };
 Array2D.toSeq=function(array)
 {
  var len1,len2;
  len1=array.length;
  len2=array.length?array[0].length:0;
  return Seq.delay(function()
  {
   return Seq.collect(function(i)
   {
    return Seq.map(function(j)
    {
     return Arrays.get2D(array,i,j);
    },Operators.range(0,len2-1));
   },Operators.range(0,len1-1));
  });
 };
 Array2D.exists=function(predicate,array)
 {
  var found,i,len1,len2,j;
  len1=array.length;
  len2=array.length?array[0].length:0;
  found=false;
  i=0;
  while(!found&&i<len1)
   {
    j=0;
    while(!found&&j<len2)
     {
      found=predicate(Arrays.get2D(array,i,j));
      j=j+1;
     }
    i=i+1;
   }
  return found;
 };
 Seq.choose=function(f,s)
 {
  return Seq.collect(function(x)
  {
   var m;
   m=f(x);
   return m==null?T.Empty:List.ofArray([m.$0]);
  },s);
 };
 Seq.iter=function(p,s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    p(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.delay=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return Enumerator.Get(f());
   }
  };
 };
 Seq.append=function(s1,s2)
 {
  return{
   GetEnumerator:function()
   {
    var e1,first;
    e1=Enumerator.Get(s1);
    first=[true];
    return new T$1.New(e1,null,function(x)
    {
     var x$1;
     return x.s.MoveNext()?(x.c=x.s.Current(),true):(x$1=x.s,!Unchecked.Equals(x$1,null)?x$1.Dispose():void 0,x.s=null,first[0]&&(first[0]=false,x.s=Enumerator.Get(s2),x.s.MoveNext()?(x.c=x.s.Current(),true):(x.s.Dispose(),x.s=null,false)));
    },function(x)
    {
     var x$1;
     x$1=x.s;
     !Unchecked.Equals(x$1,null)?x$1.Dispose():void 0;
    });
   }
  };
 };
 Seq.collect=function(f,s)
 {
  return Seq.concat(Seq.map(f,s));
 };
 Seq.pairwise=function(s)
 {
  return Seq.map(function(x)
  {
   return[Arrays.get(x,0),Arrays.get(x,1)];
  },Seq.windowed(2,s));
 };
 Seq.exists=function(p,s)
 {
  var e,r;
  e=Enumerator.Get(s);
  try
  {
   r=false;
   while(!r&&e.MoveNext())
    r=p(e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.concat=function(ss)
 {
  return{
   GetEnumerator:function()
   {
    var outerE;
    outerE=Enumerator.Get(ss);
    return new T$1.New(null,null,function(st)
    {
     var m;
     while(true)
      {
       m=st.s;
       if(Unchecked.Equals(m,null))
       {
        if(outerE.MoveNext())
         {
          st.s=Enumerator.Get(outerE.Current());
          st=st;
         }
        else
         {
          outerE.Dispose();
          return false;
         }
       }
       else
        if(m.MoveNext())
         {
          st.c=m.Current();
          return true;
         }
        else
         {
          st.Dispose();
          st.s=null;
          st=st;
         }
      }
    },function(st)
    {
     var x;
     x=st.s;
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
     !Unchecked.Equals(outerE,null)?outerE.Dispose():void 0;
    });
   }
  };
 };
 Seq.windowed=function(windowSize,s)
 {
  windowSize<=0?Operators.FailWith("The input must be positive."):void 0;
  return Seq.delay(function()
  {
   return Seq.enumUsing(Enumerator.Get(s),function(e)
   {
    var q;
    q=[];
    return Seq.append(Seq.enumWhile(function()
    {
     return q.length<windowSize&&e.MoveNext();
    },Seq.delay(function()
    {
     q.push(e.Current());
     return[];
    })),Seq.delay(function()
    {
     return q.length===windowSize?Seq.append([q.slice(0)],Seq.delay(function()
     {
      return Seq.enumWhile(function()
      {
       return e.MoveNext();
      },Seq.delay(function()
      {
       q.shift();
       q.push(e.Current());
       return[q.slice(0)];
      }));
     })):[];
    }));
   });
  });
 };
 Seq.init=function(n,f)
 {
  return Seq.take(n,Seq.initInfinite(f));
 };
 Seq.distinctBy=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var o,seen;
    o=Enumerator.Get(s);
    seen=new HashSet.New$3();
    return new T$1.New(null,null,function(e)
    {
     var cur,has;
     if(o.MoveNext())
      {
       cur=o.Current();
       has=seen.Add(f(cur));
       while(!has&&o.MoveNext())
        {
         cur=o.Current();
         has=seen.Add(f(cur));
        }
       return has&&(e.c=cur,true);
      }
     else
      return false;
    },function()
    {
     o.Dispose();
    });
   }
  };
 };
 Seq.take=function(n,s)
 {
  n<0?Seq.nonNegative():void 0;
  return{
   GetEnumerator:function()
   {
    var e;
    e=[Enumerator.Get(s)];
    return new T$1.New(0,null,function(o)
    {
     var en;
     o.s=o.s+1;
     return o.s>n?false:(en=e[0],Unchecked.Equals(en,null)?Seq.insufficient():en.MoveNext()?(o.c=en.Current(),o.s===n?(en.Dispose(),e[0]=null):void 0,true):(en.Dispose(),e[0]=null,Seq.insufficient()));
    },function()
    {
     var x;
     x=e[0];
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
    });
   }
  };
 };
 Seq.initInfinite=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return new T$1.New(0,null,function(e)
    {
     e.c=f(e.s);
     e.s=e.s+1;
     return true;
    },void 0);
   }
  };
 };
 Seq.compareWith=function(f,s1,s2)
 {
  var e1,$1,e2,r,loop;
  e1=Enumerator.Get(s1);
  try
  {
   e2=Enumerator.Get(s2);
   try
   {
    r=0;
    loop=true;
    while(loop&&r===0)
     if(e1.MoveNext())
      r=e2.MoveNext()?f(e1.Current(),e2.Current()):1;
     else
      if(e2.MoveNext())
       r=-1;
      else
       loop=false;
    $1=r;
   }
   finally
   {
    if(typeof e2=="object"&&"Dispose"in e2)
     e2.Dispose();
   }
   return $1;
  }
  finally
  {
   if(typeof e1=="object"&&"Dispose"in e1)
    e1.Dispose();
  }
 };
 Seq.forall2=function(p,s1,s2)
 {
  return!Seq.exists2(function($1,$2)
  {
   return!p($1,$2);
  },s1,s2);
 };
 Seq.exists2=function(p,s1,s2)
 {
  var e1,$1,e2,r;
  e1=Enumerator.Get(s1);
  try
  {
   e2=Enumerator.Get(s2);
   try
   {
    r=false;
    while(!r&&e1.MoveNext()&&e2.MoveNext())
     r=p(e1.Current(),e2.Current());
    $1=r;
   }
   finally
   {
    if(typeof e2=="object"&&"Dispose"in e2)
     e2.Dispose();
   }
   return $1;
  }
  finally
  {
   if(typeof e1=="object"&&"Dispose"in e1)
    e1.Dispose();
  }
 };
 Seq.tryFindIndex=function(ok,s)
 {
  var e,loop,i;
  e=Enumerator.Get(s);
  try
  {
   loop=true;
   i=0;
   while(loop&&e.MoveNext())
    if(ok(e.Current()))
     loop=false;
    else
     i=i+1;
   return loop?null:{
    $:1,
    $0:i
   };
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.unfold=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    return new T$1.New(s,null,function(e)
    {
     var m;
     m=f(e.s);
     return m==null?false:(e.c=m.$0[0],e.s=m.$0[1],true);
    },void 0);
   }
  };
 };
 Tile.New=function(Current,Previous,MergedFrom)
 {
  return{
   Current:Current,
   Previous:Previous,
   MergedFrom:MergedFrom
  };
 };
 JSONStorageItem=LocalStorage.JSONStorageItem=Runtime.Class({
  getValue:function()
  {
   var m,v,m$1;
   m=this.value;
   return m!=null&&m.$==1?m.$0:(v=(m$1=LocalStorage.localStorage().getItem(this.key),m$1===null?this.def:JSON.parse(m$1)),(this.value={
    $:1,
    $0:v
   },v));
  },
  Game2048_LocalStorage_IValue_1$set_Value:function(v)
  {
   try
   {
    LocalStorage.localStorage().setItem(this.key,JSON.stringify(v));
    this.value={
     $:1,
     $0:v
    };
   }
   catch(m)
   {
    Global.alert("Saving data to storage failed.");
   }
  },
  Game2048_LocalStorage_IValue_1$get_Value:function()
  {
   return this.getValue();
  }
 },Obj,JSONStorageItem);
 JSONStorageItem.New=Runtime.Ctor(function(key,def)
 {
  Obj.New.call(this);
  this.key=key;
  this.def=def;
  this.value=null;
 },JSONStorageItem);
 Arrays2D.map=function(f,array)
 {
  return Arrays2D.init(array.length,array.length?array[0].length:0,function($1,$2)
  {
   return f(Arrays.get2D(array,$1,$2));
  });
 };
 Arrays2D.mapi=function(f,array)
 {
  return Arrays2D.init(array.length,array.length?array[0].length:0,function($1,$2)
  {
   return f($1,$2,Arrays.get2D(array,$1,$2));
  });
 };
 Arrays2D.init=function(n,m,f)
 {
  var array,i,$1,j,$2;
  array=Arrays.zeroCreate2D(n,m);
  for(i=0,$1=n-1;i<=$1;i++){
   for(j=0,$2=m-1;j<=$2;j++)Arrays.set2D(array,i,j,f(i,j));
  }
  return array;
 };
 Arrays2D.iteri=function(f,array)
 {
  var count1,count2,i,$1,j,$2;
  count1=array.length;
  count2=array.length?array[0].length:0;
  for(i=0,$1=count1-1;i<=$1;i++){
   for(j=0,$2=count2-1;j<=$2;j++)f(i,j,Arrays.get2D(array,i,j));
  }
 };
 Slice.setArray2Dfix1=function(dst,fixed1,start2,finish2,src)
 {
  var start2$1,finish2$1,j,$1;
  start2$1=start2!=null&&start2.$==1?start2.$0:0;
  finish2$1=finish2!=null&&finish2.$==1?finish2.$0:(dst.length?dst[0].length:0)-1;
  for(j=0,$1=finish2$1-start2$1+1-1;j<=$1;j++)Arrays.set2D(dst,fixed1,start2$1+j,Arrays.get(src,j));
 };
 Slice.array2Dfix1=function(arr,fixed1,start2,finish2)
 {
  var start2$1,finish2$1,len2,dst,j,$1;
  start2$1=start2!=null&&start2.$==1?start2.$0:0;
  finish2$1=finish2!=null&&finish2.$==1?finish2.$0:(arr.length?arr[0].length:0)-1;
  len2=finish2$1-start2$1+1;
  dst=new Global.Array(len2);
  for(j=0,$1=len2-1;j<=$1;j++)Arrays.set(dst,j,Arrays.get2D(arr,fixed1,start2$1+j));
  return dst;
 };
 Slice.setArray2Dfix2=function(dst,start1,finish1,fixed2,src)
 {
  var start1$1,finish1$1,i,$1;
  start1$1=start1!=null&&start1.$==1?start1.$0:0;
  finish1$1=finish1!=null&&finish1.$==1?finish1.$0:dst.length-1;
  for(i=0,$1=finish1$1-start1$1+1-1;i<=$1;i++)Arrays.set2D(dst,start1$1+i,fixed2,Arrays.get(src,i));
 };
 Slice.array2Dfix2=function(arr,start1,finish1,fixed2)
 {
  var start1$1,finish1$1,len1,dst,i,$1;
  start1$1=start1!=null&&start1.$==1?start1.$0:0;
  finish1$1=finish1!=null&&finish1.$==1?finish1.$0:arr.length-1;
  len1=finish1$1-start1$1+1;
  dst=new Global.Array(len1);
  for(i=0,$1=len1-1;i<=$1;i++)Arrays.set(dst,i,Arrays.get2D(arr,start1$1+i,fixed2));
  return dst;
 };
 Array.pad=function(length,array)
 {
  var res,i,$1;
  res=Arrays.map(function(a)
  {
   return{
    $:1,
    $0:a
   };
  },array);
  for(i=1,$1=length-Arrays.length(array);i<=$1;i++)res.push(null);
  return res;
 };
 OriginalRules=Variants.OriginalRules=Runtime.Class({
  get_Name:function()
  {
   return"Original";
  },
  get_Title:function()
  {
   return"2048";
  },
  get_Hint:function()
  {
   return"Join the numbers and get to the <strong>2048 tile!</strong>";
  },
  Merge:function(v1,v2)
  {
   var v;
   return v1===v2?(v=v1*2,{
    $:1,
    $0:[v,v]
   }):null;
  },
  Next:function(grid)
  {
   Model.addRandomTile(grid,this.NewTileValue());
  },
  Goal:function(grid)
  {
   return Model.gridContains(grid,this.get_GoalValue());
  },
  Start:function()
  {
   var $this,x,x$1,arr;
   $this=this;
   x=(x$1=(arr=Arrays.init(4,function()
   {
    return Arrays.create(4,null);
   }),(arr.dims=2,arr)),(function(a)
   {
    $this.Next(a);
   }(x$1),x$1));
   (function(a)
   {
    $this.Next(a);
   }(x));
   return x;
  },
  NewTileValue:function()
  {
   return Math.random()<0.9?2:4;
  },
  get_GoalValue:function()
  {
   return 2048;
  }
 },GameRules,OriginalRules);
 OriginalRules.New=Runtime.Ctor(function()
 {
  GameRules.New.call(this);
 },OriginalRules);
 FibonacciRules=Variants.FibonacciRules=Runtime.Class({
  get_Name:function()
  {
   return"Fibonacci";
  },
  get_Title:function()
  {
   return"2584";
  },
  get_Hint:function()
  {
   return"Join the numbers and get to the <strong>2584 tile!</strong>";
  },
  Merge:function(v1,v2)
  {
   var d,v;
   return(d=v1-v2,d===0?v1===1:0<d?d<=v2:-d<=v1)?(v=v1+v2,{
    $:1,
    $0:[v,v]
   }):null;
  },
  NewTileValue:function()
  {
   return Math.random()<0.9?1:2;
  },
  get_GoalValue:function()
  {
   return 2584;
  }
 },OriginalRules,FibonacciRules);
 FibonacciRules.New=Runtime.Ctor(function()
 {
  OriginalRules.New.call(this);
 },FibonacciRules);
 PlusMinusRules=Variants.PlusMinusRules=Runtime.Class({
  get_Name:function()
  {
   return"PlusMinus";
  },
  get_Title:function()
  {
   return"&plusmn;64";
  },
  get_Hint:function()
  {
   return"Join the numbers and get <strong> both &plusmn;64 tiles!</strong>";
  },
  Merge:function(v1,v2)
  {
   var v;
   return v1===v2?(v=v1*2,{
    $:1,
    $0:[v,Math.abs(v)]
   }):v1===-v2?{
    $:1,
    $0:[0,0]
   }:null;
  },
  Goal:function(grid)
  {
   return Model.gridContains(grid,this.get_GoalValue())&&Model.gridContains(grid,-this.get_GoalValue());
  },
  NewTileValue:function()
  {
   return(Math.random()<0.9?2:4)*(Math.random()<0.5?1:-1);
  },
  get_GoalValue:function()
  {
   return 2584;
  }
 },OriginalRules,PlusMinusRules);
 PlusMinusRules.New=Runtime.Ctor(function()
 {
  OriginalRules.New.call(this);
 },PlusMinusRules);
 DomUtility.CreateElement=function(name)
 {
  return DomUtility.Doc().createElement(name);
 };
 DomUtility.SetAttr=function(el,name,value)
 {
  el.setAttribute(name,value);
 };
 DomUtility.Doc=function()
 {
  SC$2.$cctor();
  return SC$2.Doc;
 };
 DomUtility.CreateText=function(s)
 {
  return DomUtility.Doc().createTextNode(s);
 };
 DomUtility.InsertAt=function(parent,pos,node)
 {
  var m;
  if(!(node.parentNode===parent&&pos===(m=node.nextSibling,Unchecked.Equals(m,null)?null:m)))
   parent.insertBefore(node,pos);
 };
 Attrs.Static=function(attr$1)
 {
  return new AttrProxy({
   $:3,
   $0:attr$1
  });
 };
 Attrs.Updates=function(dyn)
 {
  return Array$1.MapTreeReduce(function(x)
  {
   return x.NChanged();
  },View.Const(),View.Map2Unit,dyn.DynNodes);
 };
 Attrs.AppendTree=function(a,b)
 {
  var x;
  return a===null?b:b===null?a:(x=new AttrProxy({
   $:2,
   $0:a,
   $1:b
  }),(Attrs.SetFlags(x,Attrs.Flags(a)|Attrs.Flags(b)),x));
 };
 Attrs.EmptyAttr=function()
 {
  SC$4.$cctor();
  return SC$4.EmptyAttr;
 };
 Attrs.Insert=function(elem,tree)
 {
  var nodes,oar,arr;
  function loop(node)
  {
   if(!(node===null))
    if(node!=null&&node.$==1)
     nodes.push(node.$0);
    else
     if(node!=null&&node.$==2)
      {
       loop(node.$0);
       loop(node.$1);
      }
     else
      if(node!=null&&node.$==3)
       node.$0(elem);
      else
       if(node!=null&&node.$==4)
        oar.push(node.$0);
  }
  nodes=[];
  oar=[];
  loop(tree);
  arr=nodes.slice(0);
  return Dyn.New(elem,Attrs.Flags(tree),arr,oar.length===0?null:{
   $:1,
   $0:function(el)
   {
    Seq.iter(function(f)
    {
     f(el);
    },oar);
   }
  });
 };
 Attrs.SetFlags=function(a,f)
 {
  a.flags=f;
 };
 Attrs.Flags=function(a)
 {
  return a!==null&&a.hasOwnProperty("flags")?a.flags:0;
 };
 Event$1=Event.Event=Runtime.Class({
  Trigger:function(x)
  {
   var a,i,$1;
   a=this.Handlers.slice();
   for(i=0,$1=a.length-1;i<=$1;i++)(Arrays.get(a,i))(null,x);
  },
  Subscribe$1:function(observer)
  {
   var $this;
   function h(a,x)
   {
    return observer.OnNext(x);
   }
   function dispose()
   {
    $this.RemoveHandler$1(h);
   }
   $this=this;
   this.AddHandler$1(h);
   return{
    Dispose:function()
    {
     return dispose();
    }
   };
  },
  AddHandler$1:function(h)
  {
   this.Handlers.push(h);
  },
  RemoveHandler$1:function(h)
  {
   var o,o$1;
   o=Seq.tryFindIndex(function(y)
   {
    return Unchecked.Equals(h,y);
   },this.Handlers);
   o==null?void 0:(o$1=this.Handlers,o$1.splice.apply(o$1,[o.$0,1]));
  },
  Subscribe:function(observer)
  {
   return this.Subscribe$1(observer);
  },
  Dispose:Global.ignore
 },null,Event$1);
 Event$1.New=function(Handlers)
 {
  return new Event$1({
   Handlers:Handlers
  });
 };
 MapUtil.fromSeq=function(s)
 {
  var a;
  a=Arrays.ofSeq(Seq.delay(function()
  {
   return Seq.collect(function(m)
   {
    return[Pair.New(m[0],m[1])];
   },Seq.distinctBy(function(t)
   {
    return t[0];
   },s));
  }));
  Arrays.sortInPlace(a);
  return BalancedTree.Build(a,0,a.length-1);
 };
 Elt=UI.Elt=Runtime.Class({
  SetAttribute:function(name,value)
  {
   this.elt.setAttribute(name,value);
  }
 },Doc,Elt);
 Elt.New=function(el,attr$1,children)
 {
  var node,rvUpdates;
  node=Docs.CreateElemNode(el,attr$1,children.docNode);
  rvUpdates=Updates.Create(children.updates);
  return new Elt.New$1({
   $:1,
   $0:node
  },View.Map2Unit(Attrs.Updates(node.Attr),rvUpdates.v),el,rvUpdates);
 };
 Elt.New$1=Runtime.Ctor(function(docNode,updates,elt,rvUpdates)
 {
  Doc.New.call(this,docNode,updates);
  this.docNode$1=docNode;
  this.updates$1=updates;
  this.elt=elt;
  this.rvUpdates=rvUpdates;
 },Elt);
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 View=UI.View=Runtime.Class({},null,View);
 Array$1.ofSeqNonCopying=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs;
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    if(xs===null)
     return[];
    else
     {
      q=[];
      o=Enumerator.Get(xs);
      try
      {
       while(o.MoveNext())
        q.push(o.Current());
       return q;
      }
      finally
      {
       if(typeof o=="object"&&"Dispose"in o)
        o.Dispose();
      }
     }
 };
 Array$1.TreeReduce=function(defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l)?Arrays.get(array,off):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 Array$1.MapTreeReduce=function(mapping,defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l)?mapping(Arrays.get(array,off)):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 BalancedTree.TryFind=function(v,t)
 {
  var x;
  x=(BalancedTree.Lookup(v,t))[0];
  return x==null?null:{
   $:1,
   $0:x.Node
  };
 };
 BalancedTree.Lookup=function(k,t)
 {
  var spine,t$1,loop,m;
  spine=[];
  t$1=t;
  loop=true;
  while(loop)
   if(t$1==null)
    loop=false;
   else
    {
     m=Unchecked.Compare(k,t$1.Node);
     m===0?loop=false:m===1?(spine.unshift([true,t$1.Node,t$1.Left]),t$1=t$1.Right):(spine.unshift([false,t$1.Node,t$1.Right]),t$1=t$1.Left);
    }
  return[t$1,spine];
 };
 BalancedTree.Build=function(data,min,max)
 {
  var center,left,right;
  return max-min+1<=0?null:(center=(min+max)/2>>0,(left=BalancedTree.Build(data,min,center-1),(right=BalancedTree.Build(data,center+1,max),BalancedTree.Branch(Arrays.get(data,center),left,right))));
 };
 BalancedTree.Branch=function(node,left,right)
 {
  var a,b;
  return Tree.New(node,left,right,1+(a=left==null?0:left.Height,(b=right==null?0:right.Height,Unchecked.Compare(a,b)===1?a:b)),1+(left==null?0:left.Count)+(right==null?0:right.Count));
 };
 BalancedTree.Enumerate=function(flip,t)
 {
  function gen(t$1,spine)
  {
   var t$2;
   while(true)
    if(t$1==null)
     return spine.$==1?{
      $:1,
      $0:[spine.$0[0],[spine.$0[1],spine.$1]]
     }:null;
    else
     if(flip)
      {
       t$2=t$1;
       t$1=t$2.Right;
       spine=new T({
        $:1,
        $0:[t$2.Node,t$2.Left],
        $1:spine
       });
      }
     else
      {
       t$2=t$1;
       t$1=t$2.Left;
       spine=new T({
        $:1,
        $0:[t$2.Node,t$2.Right],
        $1:spine
       });
      }
  }
  return Seq.unfold(function($1)
  {
   return gen($1[0],$1[1]);
  },[t,T.Empty]);
 };
 Pair=Collections.Pair=Runtime.Class({
  Equals:function(other)
  {
   return Unchecked.Equals(this.Key,other.Key);
  },
  GetHashCode:function()
  {
   return Unchecked.Hash(this.Key);
  },
  CompareTo0:function(other)
  {
   return Unchecked.Compare(this.Key,other.Key);
  }
 },null,Pair);
 Pair.New=function(Key,Value)
 {
  return new Pair({
   Key:Key,
   Value:Value
  });
 };
 Tree.New=function(Node$1,Left,Right,Height,Count)
 {
  return{
   Node:Node$1,
   Left:Left,
   Right:Right,
   Height:Height,
   Count:Count
  };
 };
 View.Const=function(x)
 {
  var o;
  o=Snap.New({
   $:0,
   $0:x
  });
  return function()
  {
   return o;
  };
 };
 View.Map2Unit=function(a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2Unit(a(),a$1());
  });
 };
 View.CreateLazy=function(observe)
 {
  var lv;
  lv={
   c:null,
   o:observe
  };
  return function()
  {
   var c,$1;
   c=lv.c;
   return c===null?(c=lv.o(),lv.c=c,($1=c.s,$1!=null&&$1.$==0)?lv.o=null:Snap.WhenObsoleteRun(c,function()
   {
    lv.c=null;
   }),c):c;
  };
 };
 Seq.enumUsing=function(x,f)
 {
  return{
   GetEnumerator:function()
   {
    var _enum;
    try
    {
     _enum=Enumerator.Get(f(x));
    }
    catch(e)
    {
     x.Dispose();
     throw e;
    }
    return new T$1.New(null,null,function(e$1)
    {
     return _enum.MoveNext()&&(e$1.c=_enum.Current(),true);
    },function()
    {
     _enum.Dispose();
     x.Dispose();
    });
   }
  };
 };
 Seq.enumWhile=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    return new T$1.New(null,null,function(en)
    {
     var m;
     while(true)
      {
       m=en.s;
       if(Unchecked.Equals(m,null))
       {
        if(f())
         {
          en.s=Enumerator.Get(s);
          en=en;
         }
        else
         return false;
       }
       else
        if(m.MoveNext())
         {
          en.c=m.Current();
          return true;
         }
        else
         {
          m.Dispose();
          en.s=null;
          en=en;
         }
      }
    },function(en)
    {
     var x;
     x=en.s;
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
    });
   }
  };
 };
 DocElemNode=UI.DocElemNode=Runtime.Class({
  Equals:function(o)
  {
   return this.ElKey===o.ElKey;
  },
  GetHashCode:function()
  {
   return this.ElKey;
  }
 },null,DocElemNode);
 DocElemNode.New=function(Attr,Children,Delimiters,El,ElKey,Render)
 {
  var $1;
  return new DocElemNode(($1={
   Attr:Attr,
   Children:Children,
   El:El,
   ElKey:ElKey
  },(Runtime.SetOptional($1,"Delimiters",Delimiters),Runtime.SetOptional($1,"Render",Render),$1)));
 };
 Docs.CreateElemNode=function(el,attr$1,children)
 {
  var attr$2;
  Docs.LinkElement(el,children);
  attr$2=Attrs.Insert(el,attr$1);
  return DocElemNode.New(attr$2,children,null,el,Fresh.Int(),Runtime.GetOptional(attr$2.OnAfterRender));
 };
 Docs.LinkElement=function(el,children)
 {
  Docs.InsertDoc(el,children,null);
 };
 Docs.InsertDoc=function(parent,doc,pos)
 {
  var d;
  return doc!=null&&doc.$==1?Docs.InsertNode(parent,doc.$0.El,pos):doc!=null&&doc.$==2?(d=doc.$0,(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos))):doc==null?pos:doc!=null&&doc.$==4?Docs.InsertNode(parent,doc.$0.Text,pos):doc!=null&&doc.$==5?Docs.InsertNode(parent,doc.$0,pos):doc!=null&&doc.$==6?Arrays.foldBack(function($1,$2)
  {
   return $1==null||$1.constructor===Object?Docs.InsertDoc(parent,$1,$2):Docs.InsertNode(parent,$1,$2);
  },doc.$0.Els,pos):Docs.InsertDoc(parent,doc.$0,Docs.InsertDoc(parent,doc.$1,pos));
 };
 Docs.InsertNode=function(parent,node,pos)
 {
  DomUtility.InsertAt(parent,pos,node);
  return node;
 };
 Updates=UI.Updates=Runtime.Class({},null,Updates);
 Updates.Create=function(v)
 {
  var _var;
  _var=null;
  _var=Updates.New(v,null,function()
  {
   var c;
   c=_var.s;
   return c===null?(c=Snap.Copy(_var.c()),_var.s=c,Snap.WhenObsoleteRun(c,function()
   {
    _var.s=null;
   }),c):c;
  });
  return _var;
 };
 Updates.New=function(Current,Snap$1,VarView)
 {
  return new Updates({
   c:Current,
   s:Snap$1,
   v:VarView
  });
 };
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.Doc=self.document;
 };
 HashSet=Collections.HashSet=Runtime.Class({
  Add:function(item)
  {
   return this.add(item);
  },
  add:function(item)
  {
   var h,arr;
   h=this.hash(item);
   arr=this.data[h];
   return arr==null?(this.data[h]=[item],this.count=this.count+1,true):this.arrContains(item,arr)?false:(arr.push(item),this.count=this.count+1,true);
  },
  arrContains:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     c=false;
    else
     i=i+1;
   return!c;
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  }
 },Obj,HashSet);
 HashSet.New$3=Runtime.Ctor(function()
 {
  HashSet.New$4.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 HashSet.New$4=Runtime.Ctor(function(init,equals,hash)
 {
  var e;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.data=[];
  this.count=0;
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    this.add(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },HashSet);
 Arrays.mapiInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(i,arr[i]);
  return arr;
 };
 Arrays.mapInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(arr[i]);
 };
 Seq.nonNegative=function()
 {
  return Operators.FailWith("The input must be non-negative.");
 };
 Seq.insufficient=function()
 {
  return Operators.FailWith("The input sequence has an insufficient number of elements.");
 };
 Snap.Copy=function(sn)
 {
  var m,res,res$1;
  m=sn.s;
  return m==null?sn:m!=null&&m.$==2?(res=Snap.New({
   $:2,
   $0:m.$0,
   $1:[]
  }),(Snap.WhenObsolete(sn,res),res)):m!=null&&m.$==3?(res$1=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(v)
  {
   Snap.MarkDone(res$1,sn,v);
  },res$1),res$1)):sn;
 };
 Snap.WhenObsoleteRun=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?m.$1.push(obs):m!=null&&m.$==3?m.$1.push(obs):void 0;
 };
 Snap.Map2Unit=function(sn1,sn2)
 {
  var $1,$2,res;
  function cont()
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     $3!=null&&$3.$==1?$4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,null):Snap.MarkReady(res,null):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:null
  }):sn2:$2!=null&&$2.$==0?sn1:(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.WhenObsolete=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?Snap.EnqueueSafe(m.$1,obs):m!=null&&m.$==3?Snap.EnqueueSafe(m.$1,obs):void 0;
 };
 Snap.When=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?(Snap.EnqueueSafe(m.$1,obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),Snap.EnqueueSafe(m.$1,obs)):avail(m.$0);
 };
 Snap.MarkDone=function(res,sn,v)
 {
  var $1;
  if($1=sn.s,$1!=null&&$1.$==0)
   Snap.MarkForever(res,v);
  else
   Snap.MarkReady(res,v);
 };
 Snap.ValueAndForever=function(snap)
 {
  var m;
  m=snap.s;
  return m!=null&&m.$==0?{
   $:1,
   $0:[m.$0,true]
  }:m!=null&&m.$==2?{
   $:1,
   $0:[m.$0,false]
  }:null;
 };
 Snap.MarkForever=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:0,
     $0:v
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.MarkReady=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:2,
     $0:v,
     $1:m.$1
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.EnqueueSafe=function(q,x)
 {
  var qcopy,i,$1,o;
  q.push(x);
  if(q.length%20===0)
   {
    qcopy=q.slice(0);
    Queue.Clear(q);
    for(i=0,$1=Arrays.length(qcopy)-1;i<=$1;i++){
     o=Arrays.get(qcopy,i);
     typeof o=="object"?function(sn)
     {
      if(sn.s)
       q.push(sn);
     }(o):function(f)
     {
      q.push(f);
     }(o);
    }
   }
  else
   void 0;
 };
 IndexOutOfRangeException=WebSharper.IndexOutOfRangeException=Runtime.Class({},Error,IndexOutOfRangeException);
 IndexOutOfRangeException.New=Runtime.Ctor(function()
 {
  IndexOutOfRangeException.New$1.call(this,"Index was outside the bounds of the array.");
 },IndexOutOfRangeException);
 IndexOutOfRangeException.New$1=Runtime.Ctor(function(message)
 {
  this.message=message;
  Object.setPrototypeOf(this,IndexOutOfRangeException.prototype);
 },IndexOutOfRangeException);
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.localStorage=self.localStorage;
 };
 Dyn.New=function(DynElem,DynFlags,DynNodes,OnAfterRender)
 {
  var $1;
  $1={
   DynElem:DynElem,
   DynFlags:DynFlags,
   DynNodes:DynNodes
  };
  Runtime.SetOptional($1,"OnAfterRender",OnAfterRender);
  return $1;
 };
 Fresh.Int=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return Fresh.counter();
 };
 Fresh.set_counter=function($1)
 {
  SC$5.$cctor();
  SC$5.counter=$1;
 };
 Fresh.counter=function()
 {
  SC$5.$cctor();
  return SC$5.counter;
 };
 SC$4.$cctor=function()
 {
  SC$4.$cctor=Global.ignore;
  SC$4.EmptyAttr=null;
 };
 Snap.Obsolete=function(sn)
 {
  var $1,m,i,$2,o;
  m=sn.s;
  if(m==null||(m!=null&&m.$==2?($1=m.$1,false):m!=null&&m.$==3?($1=m.$1,false):true))
   void 0;
  else
   {
    sn.s=null;
    for(i=0,$2=Arrays.length($1)-1;i<=$2;i++){
     o=Arrays.get($1,i);
     typeof o=="object"?function(sn$1)
     {
      Snap.Obsolete(sn$1);
     }(o):o();
    }
   }
 };
 Snap.New=function(State)
 {
  return{
   s:State
  };
 };
 SC$5.$cctor=function()
 {
  SC$5.$cctor=Global.ignore;
  SC$5.counter=0;
 };
 HashSetUtil.concat=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push.apply(r,o[k$1]);
  return r;
 };
 Queue.Clear=function(a)
 {
  a.splice(0,Arrays.length(a));
 };
 Runtime.OnLoad(function()
 {
  Client.Main();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}

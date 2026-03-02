import { GlobalWindow } from "happy-dom";

const window = new GlobalWindow();
global.window = window as any;
global.document = window.document as any;
global.navigator = window.navigator as any;

global.PopStateEvent = window.PopStateEvent as any;
global.Event = window.Event as any;

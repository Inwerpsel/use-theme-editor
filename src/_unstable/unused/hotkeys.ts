// Arguments: selected text, a value provided by focused element

let focusedElement;

type voidFn = () => void;

let mappings = new Map<string, voidFn>();

function listener(event) {
    const key = 'alt+s';
    // Get mapping id
    if (mappings.has(key)) {
        mappings.get(key)();
    }
}

function getSelectedText() {
    return window.getSelection().toString();
}

function toggleBooleanState(set): void {
    set(v => !v);
}

function simpleFunction(func): void {
    func();
}

function functionWithArguments(func, getArgs): void {
    func(...getArgs());
}

const logic = {
    toggleBooleanState,
    simpleFunction,
    functionWithArguments,
};

function addMapping(keys: string[], response: keyof typeof logic, func, getArgs: () => any[] = () => []): void {
    const handler = logic[response].bind(null, func, getArgs);
    // Add each variant to map.
    for (const key of keys) {
        mappings.set(key, handler);
    }
}

function removeMapping(keys) {
    for (const key of keys) {
        mappings.delete(key);
    }
}

type MappingConfig = {

};

function loadMappings(loadedMappings : []) {
    
}

let a = false;

function setA(updater : (v: boolean) => boolean): void {
    a = updater(a);
}

addMapping(['alt+s', 'shift+u'], 'toggleBooleanState', setA);

function doStuff() {
    console.log('doing stuff');
}

addMapping(['alt+s', 'shift+u'], 'simpleFunction', doStuff);

function reducer(state, action) {
    
}

addMapping(['alt+s', 'shift+u'], 'simpleFunction', doStuff);
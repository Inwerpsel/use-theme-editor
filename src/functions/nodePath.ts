function getIndex(node: HTMLElement, parent: HTMLElement) {
    return Array.from(parent.children).findIndex(v => v === node);
}

// Generate a path that can be used to find the node if the relevant document structure hasn't changed.
export function toPath(node) {
    const path = [];
    while (node !== document.body) {
        const parent = node.parentNode;
        path.push([node.tagName, getIndex(node, parent)]);
        node = parent;
    }
    return path;
}

// Find node from path.
export function toNode(path) {
    let node = document.body;
    for (const [tagname, position] of [...path].reverse()) {
        node = node.children[position];
        if (!node) {
            throw new Error(`No element at index ${position}`);
        }
        if (node.tagName !== tagname) {
            console.warn(`Expected ${tagname} but found ${node.tagName}`)
        }
    }
    return node;
}
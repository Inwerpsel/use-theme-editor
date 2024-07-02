function getIndex(node: HTMLElement, parent: HTMLElement) {
    return Array.from(parent.children).findIndex(v => v === node);
}

// Generate a path that can be used to find the node if the relevant document structure hasn't changed.
export function toPath(node, doc = document) {
    const path = [];
    // Only collected deepest id for now.
    let didId = false;
    while (node !== doc.body && node.parentNode) {
        const parent = node.parentNode;
        const entry = [node.tagName, getIndex(node, parent)];
        if (!didId && node.id) {
            entry.push(node.id);
        }
        path.push(entry);
        node = parent;
    }
    return path.reverse();
}

// Find node from path.
export function toNode(path: string[], doc = document) {
    let node = doc.body;
    let i = 0;
    let deepestIdIndex;
    for (const [,,id] of path) {
        if (id) {
            deepestIdIndex = i;
        }
        i++;
    }

    if (deepestIdIndex) {
        const elById = doc.getElementById(path[deepestIdIndex][2]);
        if (elById) {
            // Start from deepest specified id if it exists.
            node = elById;
            path = path.slice(deepestIdIndex + 1);
        }
    }

    for (const [tagname, position] of path) {
        const next = Array.from(node.children)[position];
        if (!next) {
            throw new Error(`No element at index ${position}`);
        }
        node = next;
        if (node.tagName !== tagname) {
            console.warn(`Expected ${tagname} but found ${node.tagName}`)
        }
    }

    return node;
}
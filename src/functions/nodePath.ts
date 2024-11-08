function getIndex(node: HTMLElement, parent: HTMLElement) {
    return Array.from(parent.children).findIndex(v => v === node);
}

const paths = new WeakMap<HTMLElement, []>();

function hasUniqueId(node) {
    try {
        return node.closest('html').querySelectorAll(`#${node.id}`).length === 1;
    } catch (e) {
        return false;
    }
}

// Generate a path that can be used to find the node if the relevant document structure hasn't changed.
export function toPath(node) {
    if (node.nodeName === 'HTML' || node.nodeName === 'BODY') {
        return [];
    }
    if (paths.has(node)) {
        return paths.get(node);
    }
    const path = [];
    // Only collected deepest id for now.
    let didId = false;
    while (node.nodeName !== 'BODY') {
        const parent = node.parentNode;
        const entry = [node.tagName, getIndex(node, parent)];
        if (!didId && node.id && hasUniqueId(node)) {
            entry.push(node.id);
        }
        path.push(entry);
        node = parent;
    }
    path.reverse();
    // This is cached as an easy (and possibly bad) way to get the same array for an element.
    paths.set(node, path);
    return path;
}

// Find node from path.
export function toNode(path: string[], doc = document) {
    let node = doc.querySelector('body');
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
            // console.warn(`Expected ${tagname} but found ${node.tagName}`)
        }
    }

    return node;
}

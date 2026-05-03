export class StringSearch {
    #pattern = '';
    #badChar = new Map();
    #caseSensitive;

    constructor(pattern, caseSensitive = true) {
        this.#caseSensitive = caseSensitive;
        this.#pattern = caseSensitive ? pattern : pattern.toLowerCase();
        this.#buildTable();
    }

    #buildTable() {
        this.#badChar.clear();
        const p = this.#pattern;
        for (let i = 0; i < p.length - 1; i++) {
            this.#badChar.set(p[i], p.length - 1 - i);
        }
    }

    findAll(text) {
        const results = [];
        const haystack = this.#caseSensitive ? text : text.toLowerCase();
        const pattern = this.#pattern;
        const m = pattern.length;
        const n = haystack.length;
        if (m === 0 || m > n) return results;

        let i = m - 1;
        while (i < n) {
            let j = m - 1;
            let k = i;
            while (j >= 0 && haystack[k] === pattern[j]) { j--; k--; }
            if (j < 0) {
                results.push(k + 1);
                i++;
            } else {
                const shift = this.#badChar.get(haystack[i]) ?? m;
                i += shift;
            }
        }
        return results;
    }

    findFirst(text) {
        const results = this.findAll(text);
        return results.length > 0 ? results[0] : -1;
    }

    replace(text, replacement) {
        const positions = this.findAll(text);
        if (!positions.length) return text;
        const m = this.#pattern.length;
        let result = '';
        let last = 0;
        for (const pos of positions) {
            result += text.slice(last, pos) + replacement;
            last = pos + m;
        }
        result += text.slice(last);
        return result;
    }

    replaceFirst(text, replacement) {
        const pos = this.findFirst(text);
        if (pos === -1) return text;
        return text.slice(0, pos) + replacement + text.slice(pos + this.#pattern.length);
    }

    positionsToLineCol(text, positions) {
        return positions.map(pos => {
            const before = text.slice(0, pos);
            const line = (before.match(/\n/g) || []).length + 1;
            const lastNL = before.lastIndexOf('\n');
            const col = pos - lastNL;
            return { pos, line, col };
        });
    }
}
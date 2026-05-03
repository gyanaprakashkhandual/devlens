import { Tokenizer } from '../engines/ast/Tokenizer.js';

const TOKEN_CLASS = {
    keyword:     'tok-keyword',
    string:      'tok-string',
    template:    'tok-string',
    number:      'tok-number',
    boolean:     'tok-boolean',
    null:        'tok-null',
    regex:       'tok-regex',
    comment:     'tok-comment',
    punctuator:  'tok-punct',
    identifier:  'tok-ident',
};

export class SyntaxHighlighter {
    highlight(source) {
        if (!source) return '';
        try {
            const tokenizer = new Tokenizer(source);
            const tokens = tokenizer.tokenize();
            return this.#buildHTML(source, tokens);
        } catch {
            return this.#escapeHTML(source);
        }
    }

    #buildHTML(source, tokens) {
        let result = '';
        let pos = 0;
        const lines = source.split('\n');

        for (const tok of tokens) {
            if (tok.type === 'eof') break;
            const cls = TOKEN_CLASS[tok.type];
            const escaped = this.#escapeHTML(tok.value);
            result += cls ? `<span class="${cls}">${escaped}</span>` : escaped;
        }

        return result;
    }

    highlightLines(source) {
        const lines = source.split('\n');
        return lines.map((line, i) => {
            const highlighted = this.#highlightLine(line);
            return `<span class="line" data-line="${i + 1}">${highlighted || ' '}</span>`;
        }).join('\n');
    }

    #highlightLine(line) {
        if (!line.trim()) return this.#escapeHTML(line);
        try {
            const tokenizer = new Tokenizer(line);
            const tokens = tokenizer.tokenize();
            let result = '';
            for (const tok of tokens) {
                if (tok.type === 'eof') break;
                const cls = TOKEN_CLASS[tok.type];
                const escaped = this.#escapeHTML(tok.value);
                result += cls ? `<span class="${cls}">${escaped}</span>` : escaped;
            }
            return result;
        } catch {
            return this.#escapeHTML(line);
        }
    }

    #escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
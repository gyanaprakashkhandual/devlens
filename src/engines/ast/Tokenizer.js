const KEYWORDS = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'return', 'static',
    'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'async', 'await', 'of', 'from', 'as', 'get', 'set',
]);

const PUNCT2 = new Set([
    '&&', '||', '??', '**', '++', '--', '<<', '>>', '>>>', '==', '!=', '<=', '>=',
    '=>', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&&=', '||=', '??=',
    '...', '===', '!==',
]);

const EXPR_END_TOKENS = new Set([
    'identifier', 'number', 'string', 'boolean', 'null', 'this', 'super', ']', ')', '`',
]);

export class Tokenizer {
    #src;
    #pos = 0;
    #line = 1;
    #col = 1;
    #lastTokType = null;

    constructor(src) {
        this.#src = src;
    }

    tokenize() {
        const tokens = [];
        let tok;
        while ((tok = this.nextToken()) && tok.type !== 'eof') {
            tokens.push(tok);
        }
        tokens.push(tok);
        return tokens;
    }

    nextToken() {
        this.#skipWhitespaceAndComments();
        if (this.#pos >= this.#src.length) return this.#make('eof', '');

        const ch = this.#src[this.#pos];
        const ch2 = this.#src.slice(this.#pos, this.#pos + 2);
        const ch3 = this.#src.slice(this.#pos, this.#pos + 3);

        if (ch === '"' || ch === "'") return this.#readString(ch);
        if (ch === '`') return this.#readTemplate();
        if (ch >= '0' && ch <= '9') return this.#readNumber();
        if (ch === '.' && this.#src[this.#pos + 1] >= '0' && this.#src[this.#pos + 1] <= '9') return this.#readNumber();
        if (this.#isIdentStart(ch)) return this.#readIdentOrKeyword();
        if (ch === '/' && !EXPR_END_TOKENS.has(this.#lastTokType)) return this.#readRegex();
        if (ch === '/') return this.#readPunct();

        if (ch3 === '>>>' || ch3 === '...') return this.#readFixed(3, 'punctuator');
        if (PUNCT2.has(ch2)) return this.#readFixed(2, 'punctuator');

        return this.#readFixed(1, 'punctuator');
    }

    #skipWhitespaceAndComments() {
        while (this.#pos < this.#src.length) {
            const ch = this.#src[this.#pos];
            if (ch === '\n') { this.#line++; this.#col = 1; this.#pos++; continue; }
            if (ch === '\r') { this.#pos++; continue; }
            if (ch === ' ' || ch === '\t') { this.#col++; this.#pos++; continue; }
            if (this.#src[this.#pos] === '/' && this.#src[this.#pos + 1] === '/') {
                while (this.#pos < this.#src.length && this.#src[this.#pos] !== '\n') this.#pos++;
                continue;
            }
            if (this.#src[this.#pos] === '/' && this.#src[this.#pos + 1] === '*') {
                this.#pos += 2;
                while (this.#pos < this.#src.length - 1) {
                    if (this.#src[this.#pos] === '\n') { this.#line++; this.#col = 1; }
                    if (this.#src[this.#pos] === '*' && this.#src[this.#pos + 1] === '/') {
                        this.#pos += 2;
                        break;
                    }
                    this.#pos++;
                }
                continue;
            }
            break;
        }
    }

    #readString(quote) {
        const line = this.#line, col = this.#col;
        let val = quote;
        this.#pos++;
        while (this.#pos < this.#src.length) {
            const c = this.#src[this.#pos];
            if (c === '\\') { val += c + (this.#src[this.#pos + 1] || ''); this.#pos += 2; continue; }
            if (c === quote) { val += c; this.#pos++; break; }
            if (c === '\n') break;
            val += c;
            this.#pos++;
        }
        return this.#makeAt('string', val, line, col);
    }

    #readTemplate() {
        const line = this.#line, col = this.#col;
        let val = '`';
        this.#pos++;
        while (this.#pos < this.#src.length) {
            const c = this.#src[this.#pos];
            if (c === '\\') { val += c + (this.#src[this.#pos + 1] || ''); this.#pos += 2; continue; }
            if (c === '`') { val += c; this.#pos++; break; }
            if (c === '\n') this.#line++;
            val += c;
            this.#pos++;
        }
        return this.#makeAt('template', val, line, col);
    }

    #readNumber() {
        const line = this.#line, col = this.#col;
        const start = this.#pos;
        if (this.#src[this.#pos] === '0') {
            const next = this.#src[this.#pos + 1];
            if (next === 'x' || next === 'X') {
                this.#pos += 2;
                while (/[0-9a-fA-F_]/.test(this.#src[this.#pos])) this.#pos++;
                return this.#makeAt('number', this.#src.slice(start, this.#pos), line, col);
            }
            if (next === 'b' || next === 'B') {
                this.#pos += 2;
                while (/[01_]/.test(this.#src[this.#pos])) this.#pos++;
                return this.#makeAt('number', this.#src.slice(start, this.#pos), line, col);
            }
            if (next === 'o' || next === 'O') {
                this.#pos += 2;
                while (/[0-7_]/.test(this.#src[this.#pos])) this.#pos++;
                return this.#makeAt('number', this.#src.slice(start, this.#pos), line, col);
            }
        }
        while (/[0-9_]/.test(this.#src[this.#pos])) this.#pos++;
        if (this.#src[this.#pos] === '.') {
            this.#pos++;
            while (/[0-9_]/.test(this.#src[this.#pos])) this.#pos++;
        }
        if (this.#src[this.#pos] === 'e' || this.#src[this.#pos] === 'E') {
            this.#pos++;
            if (this.#src[this.#pos] === '+' || this.#src[this.#pos] === '-') this.#pos++;
            while (/[0-9]/.test(this.#src[this.#pos])) this.#pos++;
        }
        if (this.#src[this.#pos] === 'n') this.#pos++;
        return this.#makeAt('number', this.#src.slice(start, this.#pos), line, col);
    }

    #readIdentOrKeyword() {
        const line = this.#line, col = this.#col;
        const start = this.#pos;
        while (this.#pos < this.#src.length && this.#isIdentPart(this.#src[this.#pos])) this.#pos++;
        const val = this.#src.slice(start, this.#pos);
        if (val === 'true' || val === 'false') return this.#makeAt('boolean', val, line, col);
        if (val === 'null') return this.#makeAt('null', val, line, col);
        if (KEYWORDS.has(val)) return this.#makeAt('keyword', val, line, col);
        return this.#makeAt('identifier', val, line, col);
    }

    #readRegex() {
        const line = this.#line, col = this.#col;
        let val = '/';
        this.#pos++;
        let inClass = false;
        while (this.#pos < this.#src.length) {
            const c = this.#src[this.#pos];
            if (c === '\\') { val += c + (this.#src[this.#pos + 1] || ''); this.#pos += 2; continue; }
            if (c === '[') { inClass = true; val += c; this.#pos++; continue; }
            if (c === ']') { inClass = false; val += c; this.#pos++; continue; }
            if (c === '/' && !inClass) { val += c; this.#pos++; break; }
            if (c === '\n') break;
            val += c;
            this.#pos++;
        }
        while (/[gimsuy]/.test(this.#src[this.#pos])) { val += this.#src[this.#pos]; this.#pos++; }
        return this.#makeAt('regex', val, line, col);
    }

    #readPunct() {
        return this.#readFixed(1, 'punctuator');
    }

    #readFixed(len, type) {
        const line = this.#line, col = this.#col;
        const val = this.#src.slice(this.#pos, this.#pos + len);
        this.#pos += len;
        this.#col += len;
        return this.#makeAt(type, val, line, col);
    }

    #make(type, value) {
        return this.#makeAt(type, value, this.#line, this.#col);
    }

    #makeAt(type, value, line, col) {
        this.#lastTokType = type === 'punctuator' ? value : type;
        return { type, value, line, col };
    }

    #isIdentStart(c) {
        return /[a-zA-Z_$]/.test(c);
    }

    #isIdentPart(c) {
        return /[a-zA-Z0-9_$]/.test(c);
    }
}
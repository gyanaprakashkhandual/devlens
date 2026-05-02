import { Parser } from '../ast/Parser.js';
import { ASTWalker } from '../ast/ASTWalker.js';

const walker = new ASTWalker();

export function parseImports(source, filename) {
  const imports = [];
  try {
    const parser = new Parser(source);
    const ast = parser.parse();
    walker.walk(ast, {
      ImportDeclaration(node) {
        if (node.source?.value) {
          imports.push({ from: filename, to: node.source.value.replace(/['"]/g, ''), type: 'static', line: node.line });
        }
      },
      ImportExpression(node) {
        const src = node.source?.value;
        if (src) imports.push({ from: filename, to: src.replace(/['"]/g, ''), type: 'dynamic', line: node.line });
      },
      CallExpression(node) {
        if (node.callee?.name === 'require' && node.arguments[0]?.type === 'Literal') {
          const src = node.arguments[0].value;
          if (src) imports.push({ from: filename, to: String(src).replace(/['"]/g, ''), type: 'require', line: node.line });
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source?.value) {
          imports.push({ from: filename, to: node.source.value.replace(/['"]/g, ''), type: 're-export', line: node.line });
        }
      },
    });
  } catch {}
  return imports;
}
// `packages/common` es ESM ("type": "module") y ts-jest lo emitiría como ESM, que
// Jest no carga en este proyecto CommonJS: se transpila a CommonJS sin comprobar
// tipos (ya los comprueba `pnpm --filter common typecheck`)
const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    const { outputText } = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    return { code: outputText };
  },
};

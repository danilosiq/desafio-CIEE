const ts = require("typescript");
module.exports = {
  process(source, filename) {
    return {
      code: ts.transpileModule(source, {
        fileName: filename,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
          esModuleInterop: true,
          inlineSourceMap: true,
          inlineSources: true,
        },
      }).outputText,
    };
  },
};

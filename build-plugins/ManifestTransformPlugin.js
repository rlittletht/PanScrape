const fs = require('fs');
const path = require('path');

class ManifestTransformPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const { source, filename, object = {} } = this.options;

    compiler.hooks.thisCompilation.tap('ManifestTransformPlugin', (compilation) => {
      const { Compilation, sources } = compiler.webpack;

      compilation.hooks.processAssets.tap(
        {
          name: 'ManifestTransformPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          const sourcePath = path.resolve(compiler.context, source);
          let manifest = {};
          try {
            manifest = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
          } catch (err) {
            compilation.errors.push(new Error(`ManifestTransformPlugin: failed to read or parse ${source}: ${err.message}`));
            return;
          }

          // Merge provided object (e.g. description/version) into manifest
          Object.assign(manifest, object);

          const content = JSON.stringify(manifest, null, 2);
          compilation.emitAsset(filename, new sources.RawSource(content));
        }
      );
    });
  }
}

module.exports = ManifestTransformPlugin;

// babel.config.js
module.exports = function (api) {
  const isTestEnv = api.env("test");

  const presets = [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
        modules: isTestEnv ? "commonjs" : false,
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ];

  const plugins = [
    "@babel/plugin-syntax-import-meta",
    "babel-plugin-transform-import-meta",
    "babel-plugin-transform-vite-meta-glob",
  ];

  // ELIMINAR ESTA SECCIÓN - Ya usas coverageProvider: "v8"
  // if (isTestEnv) {
  //   plugins.push("istanbul");
  // }

  return {
    presets,
    plugins,
  };
};

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const package = require('./package.json')
const webpack = require("webpack");
const ManifestTransformPlugin = require('./build-plugins/ManifestTransformPlugin');

const _resolve = {
    extensions: [".ts", ".js"],
}

const _module =
{
    rules:
    [
        {
            test: /\.ts?$/,
            exclude: /node_modules/,
            use:
            {
                loader: "babel-loader",
                options:
                {
                    presets: ["@babel/preset-typescript"],
                },
            },
        },
        {
            test: /\.html$/,
            exclude: /node_modules/,
            use: "html-loader",
        },
        {
            test: /\.css$/,
            use:
            [
                {
                    loader: 'style-loader'
                },
                {
                    loader: 'css-loader'
                }
            ]
        },
        {
            test: /\.(png|jpg|jpeg|gif|ico)$/,
            type: "asset/resource",
            generator: {
                filename: "assets/[name][ext][query]",
            },
        },
    ]
}

const _plugins =
[
    new CopyWebpackPlugin(
        {
            patterns: [
                {
                    from: "src/static/*",
                    to: "./static/[name][ext][query]",
                },
                {
                    from: "src/popup/popup.html",
                    to: "./popup.html",
                }
            ]
        }),
    new ManifestTransformPlugin(
        {
            source: "./src/manifestEdge.json",
            filename: "manifest.json",
            object: {
                description: package.description,
                version: package.version
            }
        }),
    new webpack.ProvidePlugin(
        {
            Promise: ["es6-promise", "Promise"],
        }),
];

module.exports =
{
    devtool: 'inline-source-map',
    entry:
    {
        content: "./src/content/content.ts",
        popup: "./src/popup/popup.ts"
    },
    output:
    {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    module: _module,
    resolve: _resolve,
    plugins: _plugins
}

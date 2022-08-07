const path = require('path');
const dashDash = require('@greenpeace/dashdash')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    watch: true,
    entry: [
        './example/src/index.js',
         './example/src/style.scss',
        ],
    output: {
        path: path.resolve(__dirname, 'example/dist'),
        filename: 'bundle.js',
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx|mjs)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        babelrc: true,
                    }
                }
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                            sourceMap: true,
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    dashDash(),
                                    // ...other plugins
                                ],
                            },
                            sourceMap: true
                        }
                    },
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
    ],

};

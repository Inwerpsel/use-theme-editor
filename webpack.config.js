const path = require('path');
const dashDash = require('@greenpeace/dashdash')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    watch: true,
    entry: {
        bundle: './example/src/index.js',
        main: './example/src/style.scss',
        halfmoon: './example/halfmoon/style.scss',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'example/dist'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
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
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
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

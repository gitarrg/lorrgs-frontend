
// Imports
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const path = require("path")

const variables = require("./variables.js")

// Constants
const DEBUG = process.env.NODE_ENV !== "production";

const gitRevisionPlugin = new GitRevisionPlugin()


// Config
module.exports = {

    mode: process.env.NODE_ENV || 'development',

    /***************************************************************************
     * Input
     */
    entry: {
        app: path.resolve(__dirname, "src/App.tsx"),
        style: path.resolve(__dirname, "scss/main.scss"),
    },

    resolve: {
        extensions: [".tsx", ".ts", "jsx", ".js"]
    },

    // modules that will be loaded externally
    externals: {
        'react': 'React',
        'react-dom': "ReactDOM",
        'konva': 'Konva',
        "redux": "Redux",
        'react-redux': "ReactRedux",
        "reselect": "Reselect",
    },


    /***************************************************************************
     * Output
     */
    output: {
        path: path.resolve(__dirname, "build"),
        filename: '[name].js',
        chunkFilename: DEBUG ? '[name].bundle.js' : '[name].[contenthash].bundle.js',
        publicPath: "/",

        clean: true, // Clean the output directory before emit.
    },


    /***************************************************************************
     * Rules
     */

    module: {
        rules: [

            /************ Javascript ************/
            {
                test: /\.[tj]sx?$/,  // jsx, tsx, js and ts
                include: path.resolve(__dirname, "src"),
                use: 'babel-loader',
            },

            /********** global CSS/SCSS *********/
            {
                test: /\.scss$/,
                include: path.resolve(__dirname, "scss"),
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",  // Translates CSS into CommonJS
                    "sass-loader"   // Compiles Sass to CSS
                ]
            },

            /********* CSS/SCSS Modules *********/
            {
                test: /\.scss$/,
                include: path.resolve(__dirname, "src"),
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",  // Translates CSS into CommonJS
                        options: {
                            importLoaders: 1,
                            modules: {
                                localIdentName: DEBUG ? "[name]__[local]__[hash:base64:4]" : "[hash:base64:8]",
                            }
                        }
                    },
                    "sass-loader"   // Compiles Sass to CSS
                ]
            },
        ]
    },


    /***************************************************************************
     * Plugins
     */
    plugins: [
        new MiniCssExtractPlugin({
            filename: DEBUG ? "[name].bundle.css" : "[name].[contenthash].bundle.css",
            ignoreOrder: true, // ignore issues with file ordering.
        }),

        new CopyPlugin({
            patterns: [{
                from: "public",
                // to: "", // into the root
                globOptions: {
                    ignore: ["**/index.html"]
                }
            }],
        }),

        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "public/index.html"),
            minimize: !DEBUG,
            hash: true, // append cache busting hash
            inject: 'body',

            templateParameters: {
                DEBUG: DEBUG,
                mode: process.env.NODE_ENV || "development",
                ...variables.get_vars(process.env.NODE_ENV),
            },
        }),

        new BundleAnalyzerPlugin({
            analyzerMode: 'disabled', // will be used via CLI
            // generateStatsFile: true,
        }),

        gitRevisionPlugin,

        new webpack.DefinePlugin({
            VERSION: JSON.stringify(gitRevisionPlugin.version()),
            COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
            BRANCH: JSON.stringify(gitRevisionPlugin.branch()),
            LASTCOMMITDATETIME: JSON.stringify(gitRevisionPlugin.lastcommitdatetime()),
        }),
    ],

    /***************************************************************************
     * Performance
     */
    performance: {
        maxEntrypointSize: 512000,  // increase the size a bit (default was 250kb)
        maxAssetSize: 512000
    },

    /***************************************************************************
     * Optimization
     */
    optimization: {

        usedExports: true,  // tree shacking

        // fix some dev server issues
        runtimeChunk: DEBUG ? 'single' : "multiple",

        minimize: !DEBUG,
        minimizer: [new TerserPlugin({
            terserOptions: {
                compress: {
                    drop_console: true,
                }
            }
        })],
    },


    /***************************************************************************
     * Dev Server Config
     */
    devServer: {

        port: 9001,

        // https://stackoverflow.com/questions/43619644/i-am-getting-an-invalid-host-header-message-when-connecting-to-webpack-dev-ser
        allowedHosts: "all",

        static: {
            directory: path.join(__dirname, "/public"),
            publicPath: "/",       // as "/"
        },

        historyApiFallback: {
            index: '/index.html'
        }
    }
}

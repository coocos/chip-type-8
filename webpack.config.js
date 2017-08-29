module.exports = {
    entry: './src/boot.ts',
    output: {
        path: __dirname + '/dist',
        filename: 'chip.js'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        loaders: [
            {test: /.ts/, loader: 'ts-loader'}
        ]
    }
}

import {nodeResolve} from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import fs from 'fs'

const file = fileURLToPath(import.meta.url);
const dir = dirname(file);

const outputOption = {
    'esm-bundler': {
        file: `${dir}/packages/${process.env.TARGET}/dist/${process.env.TARGET}.esm-bundler.js`,
        format: 'es'
    },
    'global': {
        file: `${dir}/packages/${process.env.TARGET}/dist/${process.env.TARGET}.global.js`,
        format: 'iife'
    }
}
const packageDir = `${dir}/packages/${process.env.TARGET}/package.json`

const packageJson = fs.readFileSync(packageDir, 'utf-8')
const packageOptions = JSON.parse(packageJson).buildOptions || {}

function createConfig(format, output) {
    output.sourcemap = true
    output.name = packageOptions.name
    return {
        input: `${dir}/packages/${process.env.TARGET}/src/index.js`,
        output,
        plugins: [
            nodeResolve(),
            json()
        ]
    }
}

export default packageOptions.formats.map(format => createConfig(format, outputOption[format]))
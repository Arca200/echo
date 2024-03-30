import fs from 'fs'
import path from 'path'
import { execa } from 'execa'
//返回一个包含该目录中所有文件和子目录名称的数组。
const files = fs.readdirSync('packages').filter(file => {
  const fullPath = path.join('packages', file)
  return fs.statSync(fullPath).isDirectory()
})

async function build (dirname) {
  await execa('rollup', ['-cw', '--environment', `TARGET:${dirname}`], { stdio: 'inherit' })
}

function parallel (files, build) {
  let result = []
  for (let i = 0; i < files.length; i++) {
    result.push(build(files[i]))
  }
  return Promise.all(result)
}

parallel(files, build).then(res => {
  console.log('-----', res, '-----')
})
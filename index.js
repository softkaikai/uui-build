#!/usr/bin/env node

const package = require('./package');
const { Command } = require('commander');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const fse = require('fs-extra');
const spawn = require('child_process').spawn;
const compressing = require('compressing');
const fs = require('fs');
const cp = require('./script/cp');
const fileReplace = require('./script/replace');

const program = new Command();
program.version(package.version);

program
    .option('-n, --name [type]', 'project name to build: platform or admin', 'platform')
    .option('-p, --prefix [type]', 'project prefix', 'servever')
    .option('--clear', 'clear target content')
    .option('--copy', 'force re-copy node_modules');
program.parse(process.argv);


const log = console.log;
const tmpDir = os.tmpdir();
const cwd = process.cwd();
const pathSource = path.join(cwd, `../${program.prefix}-platform-frontend`);
const pathTarget = path.join(tmpDir, './uui-build-temp-target');
const pathCopy = path.join(__dirname, './cp');
const pathDesktop = path.join(os.homedir(), './Desktop');

const filterFunc = (src, dest) => {
    return src.indexOf('node_modules') === -1 &&
        src.indexOf('.git') === -1 &&
        src.indexOf('.idea') === -1;
};
const pathExistsSync = fse.pathExistsSync(pathTarget);
let hasNodeModules = false;

if (pathExistsSync && program.clear) {
    clearContent(true);
    return;
}
if (pathExistsSync) {
    clearContent(program.copy);
}

function clearContent(clearNodeModules) {
    log(chalk.green('开始清理目录...'));
    let files = fs.readdirSync(pathTarget);
    files.forEach(function (file, index) {
        if (file === 'node_modules') {
            hasNodeModules = true;
            if (clearNodeModules) {
                log(chalk.green('开始清理node_modules...'));
                fse.removeSync(path.join(pathTarget, file));
                log(chalk.green('清理node_modules结束...'));
            }
        } else {
            fse.removeSync(path.join(pathTarget, file));
        }
    });
    log(chalk.yellow('目录清理完成...'));
}

copyProject();

function copyProject() {
    log(chalk.yellow('开始拷贝项目文件...'));
    cp(pathSource, pathTarget, filterFunc);
    // 不用再拷贝资源文件，这些文件都已经替换了
    // cp(pathCopy, pathTarget);
    log(chalk.blue('文件拷贝完成'));
    fileReplace(pathTarget);
    if (!hasNodeModules || program.copy) {
        log(chalk.green('开始拷贝node_modules...'));
        cp(path.join(pathSource, './node_modules'), path.join(pathTarget, './node_modules'));
        log(chalk.yellow('拷贝node_modules完成'));
        exection('node');
    } else {
        log(chalk.green('开始替换文件...'));
        // 防止fileReplace没有执行完
        setTimeout(() => {
            log(chalk.green('替换文件完成'));
            exection('node');
        }, 10000);
    }
}

function exection(cmd) {
    const projectName = program.name === 'platform' ? `${program.prefix}-platform` : `${program.prefix}-admin`;
    log(chalk.green('开始打包项目' + projectName + '...'));
    const uui = spawn(cmd,
        ['--max-old-space-size=8192', getNodeModulePath(), 'b', projectName, '--prod'],
        {
            cwd: pathTarget,
            shell: true,
            stdio: [process.stdin, process.stdout, process.stderr]
        });

    process.stdin.on('data', (data) => {
        console.log(`stdout1: ${data}`);
    });

    uui.on('close', (code) => {
        log(chalk.green('打包项目完成'));
        startCompress();
    });
}
function getNodeModulePath() {
    return path.resolve(pathTarget, './node_modules/@angular/cli/bin/ng')
}
function startCompress() {
    const zipPath = path.join(pathDesktop, './dist.zip');
    if (fse.pathExistsSync(zipPath)) {
        fse.removeSync(zipPath);
    }
    log(chalk.yellow('开始压缩...'));
    compressing.zip.compressDir(path.join(pathTarget, './dist'), zipPath)
        .then(() => {
            log(chalk.yellow('压缩成功，在桌面生成目标文件dist.zip'));
            log(chalk.yellow('最终代码目录地址： ' + pathTarget));
            process.exit(0);
        })
        .catch(err => {
            console.error(err);
            process.exit(0);
        });
}


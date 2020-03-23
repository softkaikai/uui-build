const fse = require('fs-extra');
const path = require('path');
const logger = require('./logger');

function fileReplace (filePath) {
    fse.readdir(filePath, 'utf8', (err, files) => {
        if (err) {
            logger.debug(err);
        } else {
            files.forEach((filename) => {
                // 获取绝对路径
                const filedir = path.join(filePath, filename);
                const extname = path.extname(filename);

                fse.stat(filedir, (error, stats) => {
                    if (error) {
                        logger.debug(error);
                    } else {
                        // 文件夹、文件的不同处理
                        let isFile = stats.isFile();
                        let isDir = stats.isDirectory();

                        if (isFile) {
                            const fileExts = ['.ts', '.js', '.html', '.css', '.json'];
                            if (fileExts.includes(extname)) {
                                replaceFile(filedir);
                            }
                        }

                        if (isDir) {
                            // 递归
                            fileReplace(filedir);
                        }
                    }
                });
            });
        }
    });
}


let replaceFile = function (filePath) {
    fse.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            return err;
        }

        let str = data.toString();
        str = str.replace('蜀ICP备10036305号', '蜀ICP备17043678号-1');
        str = str.replace('c37cdb5d35801aa682fe237825a121b7', '923e852cd4289828f6411ff4a4c73a6c');
        str = str.replace('HDSBZ-UIFRX-N5742-ZCRO5-6NA4T-GHFIE', 'SUZBZ-5Q6KU-CX6V2-22MF7-E7FY3-LSBQS');
        str = str.replace('31063', '161054');
        str = str.replace(/连接/g, '连点');
        str = str.replace('重新实现与世界的连点', '重新实现与世界的连接');
        str = str.replace('连点你我', '连接你我');

        fse.writeFile(filePath, str, 'utf8', function (err) {
            if (err) return err;
        });
    });
};

module.exports = fileReplace;

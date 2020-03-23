const fse = require('fs-extra');

function cp (pathCopy, pathSource, filterFunc) {
    try {
		if (filterFunc) {
			fse.copySync(pathCopy, pathSource, {filter: filterFunc});
		} else {
			fse.copySync(pathCopy, pathSource);
		}
        
    } catch (err) {
        console.error('copyFile error:' + err);
    }
}

module.exports = cp;

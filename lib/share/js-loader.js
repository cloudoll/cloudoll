'use strict';

const fs = require('fs');
const path = require('path');


function jsFileLoader(dir, webRoot, callback) {
    var result = [];

    fs.readdir(dir, function (err, files) {
        if (err) {
            if (err.code === "ENOENT") {
                console.error("You should create the folder:", dir);
                process.exit();
                return;
            }
            callback(err);
        }

        files = files.filter(function (value) {
            return (value[0] != '.');
        });
        var pending = files.length;
        if (!pending) return callback(null, result);
        files.forEach((file) => {
            fs.stat(dir + '/' + file, function (err, stats) {
                const abPath = path.join(dir, file);
                if (stats.isFile() && file.endsWith('.js')) {
                    result.push({
                        file: abPath,
                        vPath: "/" + path.relative(webRoot, abPath).slice(0, -3).replace(/\\/g, '/')
                    });
                    if (!--pending) callback(null, result);
                }
                if (stats.isDirectory()) {
                    jsFileLoader(dir + '/' + file, webRoot, function (err, res) {
                        result = result.concat(res);
                        if (!--pending) callback(null, result);
                    })
                }
            });
        });
    });
}

module.exports = jsFileLoader;
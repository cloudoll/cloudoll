const fs = require('fs');
const path = require('path');
const myTools = require('../tools');

class AutoRouter {
    constructor(options) {
        this.options = options || {};
        this.watchDir = this.options.watchDir || ['/api/open', '/api/admin', '/api/inner'];
        this.router = require('koa-router')();
    }

    transferToUrl(camelName) {
        let newName = "";
        for (let ch of camelName) {
            if (ch.charCodeAt(0) >= 65 && ch.charCodeAt(0) <= 90) {
                newName += "-" + ch.toLowerCase();
            } else {
                newName += ch;
            }
        }
        if (newName.startsWith('-')) {
            newName = newName.substr(1);
        }
        if (newName.startsWith('/-')) {
            newName = "/" + newName.substr(2);
        }
        return newName;
    }

    parseMethodName(method) {
        const verb_rules = {
            '$$': 'put'
            , '$': 'post'
            , '__': 'patch'
            , '_': 'delete'
        };

        let regx = /([\w,|]*)\s(.+)|(__|_|\$\$|\$)(.*)/ig;

        let rtn = {};
        let regxRes = regx.test(method);

        if (regxRes) {
            let method = RegExp.$1 || RegExp.$3;
            if (verb_rules.hasOwnProperty(method)) {
                rtn.method = verb_rules[method];
            } else {
                rtn.method = method;
            }
            let url = RegExp.$2.trim();
            if (!url && RegExp.$4) {
                url = this.transferToUrl(RegExp.$4)
            }
            rtn.url = url;
        } else {
            rtn.method = "get";
            rtn.url = this.transferToUrl(method);
        }

        if (rtn.url.indexOf(' ') > 0) {
            let nUrl = rtn.url.split(' ');
            rtn.url = nUrl[nUrl.length - 1];
            rtn.middlewares = nUrl.slice(0, -1);
        }
        rtn.method = rtn.method.toLowerCase();
        rtn.middlewares = rtn.middlewares || [];
        return rtn;
    }

    hasRightAccess(dir) {
        try {
            fs.accessSync(dir, fs.F_OK);
            return true;
        } catch (e) {
            myTools.warn(dir + " is not accessible.");
        }
        return false;
    }

    removeRouter(mappedUrl, method) { //delete existed router for reload.
        //TODO:  layer.methods.indexOf(method.toUpperCase())  this maybe not work when multi mapping.
        if (!process.env.debug) {
            return;
        }
        for (let index = this.router.stack.length - 1; index >= 0; index--) {
            const layer = this.router.stack[index]
            if (layer.path == mappedUrl && layer.methods.indexOf(method.toUpperCase()) >= 0) {
                // console.log("mactched: ", method, mappedUrl, index);
                this.router.stack.splice(index, 1);
                return;
            }
        }
    }

    routeFile(dir, file, relDir) {
        const moduleName = file.split(".");
        if (moduleName[moduleName.length - 1] === "js") {
            const reqFile = path.join(dir, file);
            delete require.cache[reqFile];
            const md = require(reqFile);
            /*** 遍历进行映射*/
            for (const method in md) {
                if (md.hasOwnProperty(method)) {
                    const func = md[method];
                    if (typeof func == "function") {
                        const parsedMethod = this.parseMethodName(method);
                        relDir = relDir.substring(relDir.indexOf('/', 1));
                        const mappedUrl = relDir + "/" + this.transferToUrl(moduleName[0]) + "/" + parsedMethod.url;
                        this.removeRouter(mappedUrl, parsedMethod.method);
                        this.router[parsedMethod.method](mappedUrl, func);
                        myTools.info(`${parsedMethod.method}: ${mappedUrl}`);

                    }
                }
            }
        }
    }

    bindRouter() {
        const me = this;
        this.watchDir.forEach(function (dir) {
            var routers_dir = path.resolve('./' + dir);
            // console.log(routers_dir, ".........");
            var rightAccess = me.hasRightAccess(routers_dir);
            rightAccess && fs.readdirSync(routers_dir).forEach(function (file, error) {
                me.routeFile(routers_dir, file, dir);
            });

            rightAccess && me.watch(routers_dir, dir);
        });

    }
    watch(folder, relDir) {
        if (process.env.debug) {
            const me = this;
            fs.watch(folder, (eType, file) => {
                if (eType == "change") {
                    myTools.info(`The file [${file}] has been changed, reloading...`);
                    me.routeFile(folder, file, relDir);
                }
            });
        }
    }

}

module.exports = AutoRouter;
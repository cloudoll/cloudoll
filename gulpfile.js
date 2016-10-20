var gulp = require('gulp');
// var uglify = require('gulp-uglify');
var path = require('path');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var nunjucksRender = require('gulp-nunjucks-api');

var paths = {
    js: './dev/res/js/*.js',
    css: './dev/res/css/*.css',
    img: './dev/res/images/*.*',
    pages: './dev/**/*.html'
};
var publish = {
    js: './res/js',
    css: './res/css',
    img: './res/images',
    pages: './',
    reload: './**/*'
};

//js压缩和发布
gulp.task('js', function () {
    var t = gulp.src(paths.js);
    //  env != "development" && t.pipe(minify()); //测试的时候先不压缩，
    // t.pipe(uglify()); //测试的时候先不压缩，
    // .pipe(rename({suffix:'.min'})) .pipe(concat('bundle.min.js'))
    t.pipe(gulp.dest(publish.js));
    return t;
});

//css压缩和发布
gulp.task('css', function () {
    var t = gulp.src(paths.css) //['res/css/style.less','res/css/common.less'])
    // .pipe(less())  env != "development" && .pipe(cleancss({     advanced: true,
    // //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]     "compatibility": 'ie7',
    // //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式；
    // 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]     keepSpecialComments: '*',
    // //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀     keepBreaks:
    // false, //类型：Boolean 默认：false [是否保留换行] })) .pipe(rename({suffix:'.min'}))
    // .pipe(concat('styles.min.css'))
        .pipe(gulp.dest(publish.css));
    return t;
});

//图片发布
gulp.task('img', function () {
    return gulp
        .src(paths.img)
        .pipe(gulp.dest(publish.img))
});
//pages
gulp.task('pages', function () {
    return gulp
        .src(paths.pages)
        .pipe(nunjucksRender({src: 'dev'}))
        .pipe(gulp.dest(publish.pages))
});
//http 前端服务器
gulp.task('connect', function () {
    connect.server({
        port: 8080, root: './', //根目录
        livereload: true //是否更改自动刷新页面
    });
});

gulp.task('reload', function () {
    return gulp
        .src(publish.reload)
        .pipe(connect.reload());
});

//输出日志
var watchEvent = function (event) {
    console.log('文件 ' + path.basename(event.path) + ' 发生 ' + event.type + ', 重启任务...');
};

//监听文件改变
gulp.task('watch', function () {
    gulp
        .watch(paths.less, ['css', 'reload'])
        .on("change", watchEvent);
    gulp
        .watch(paths.js, ['js', 'reload'])
        .on("change", watchEvent);
    gulp
        .watch(paths.img, ['img', 'reload'])
        .on("change", watchEvent);
    gulp
        .watch(paths.pages, ['pages', 'reload'])
        .on("change", watchEvent);
});
var tasks = ['pages', 'js', 'css', 'img','connect','reload','watch'];

gulp.task('default', tasks);

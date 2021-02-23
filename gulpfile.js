const { src, dest, parallel, series, watch } = require('gulp');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const sass = require('gulp-dart-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const flexBugsFixes = require('postcss-flexbugs-fixes');
const declarationSorter = require('css-declaration-sorter');
const cssWring = require('csswring');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config');
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const rimraf = require('rimraf');
const browserSync = require('browser-sync').create();

const paths = {
  ejs: './src/ejs/**/*.ejs',
  scss: './src/scss/**/*.scss',
  js: './src/js/**/*.js',
  image: './src/images/**/*',
};

const html = () => {
  return src([paths.ejs, '!/**/_*.ejs'])
    .pipe(
      plumber({
        errorHandler: notify.onError('Error: <%= error.message %>'),
      })
    )
    .pipe(ejs())
    .pipe(rename({ extname: '.html' }))
    .pipe(dest('./dist'));
};

const css = () => {
  return src(paths.scss, { sourcemaps: true })
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(postcss([
      flexBugsFixes,
      autoprefixer({
        grid: true
      }),
      declarationSorter({
        order: 'smacss'
      }),
      cssWring
    ]))
    .pipe(dest('dist/assets/css/', { sourcemaps: '.' }))
    .pipe(browserSync.stream());
};

const js = () => {
  return webpackStream(webpackConfig, webpack)
    .pipe(dest('./dist/assets/js/'));
};

const image = () => {
  return src(paths.image)
    .pipe(imagemin([
      imageminPngquant({ quality: [ 0.65, 0.8 ] }),
      imageminMozjpeg({ quality: '85' }),
      imagemin.gifsicle(),
      imagemin.mozjpeg(),
      imagemin.optipng(),
      imagemin.svgo()
    ]))
    .pipe(dest('./dist/assets/images/'));
};

const watchFiles = () => {
  watch(paths.ejs, function(cb) {
    html();
    cb();
  });
  watch(paths.scss, function(cb) {
    css();
    cb();
  });
  watch(paths.js, function(cb) {
    js();
    cb();
  });
  watch(paths.image, function(cb) {
    image();
    cb();
  });
  watch('./dist/**/*.html', function(cb) {
    browserSync.reload()
    cb();
  });
}

const deleteDist = (cb) => {
  rimraf('./dist', cb);
};

const build = series(
  deleteDist,
  parallel(html, css, js, image)
);

const server = () => {
  browserSync.init({
    server: './dist'
  });
};

exports.html = html;
exports.css = css;
exports.js = js;
exports.image = image;
exports.watchFiles = watchFiles;
exports.build = build;
exports.default = series(
  build,
  parallel(server, watchFiles)
);

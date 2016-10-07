var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

var files = [
    'src/*.js'
];

gulp.task('default', function() {
    // place code for your default task here
});

gulp.watch(files, ['dist','debug']);

// Register tasks
gulp.task('dist', function() {
    return gulp.src(files)
        .pipe(concat('sitelensitelenrenderer.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('debug', function() {
    return gulp.src(files)
        .pipe(concat('sitelensitelenrenderer.debug.js'))
        .pipe(gulp.dest('dist'));
});
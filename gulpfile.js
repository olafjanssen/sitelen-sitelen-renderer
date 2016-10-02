var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

var files = [
    'src/*.js'
];

gulp.task('default', function() {
    // place code for your default task here
});

// Register tasks
gulp.task('dist', function() {
    return gulp.src(files)
        .pipe(concat('sitelensitelenrenderer.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});
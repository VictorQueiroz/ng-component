var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var wrapper = require('gulp-wrapper');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('build', function () {
	gulp.src([
		'src/ng-component.js',
	  'src/eventemitter.js',
	  'src/helpers.js'
	])
	.pipe(ngAnnotate())
	.pipe(concat('ngcomponent.js'))
	.pipe(wrapper({
		header: '(function (angular, window, undefined) { \'use strict\'; ',
		footer: '}(angular, window, undefined));'
	}))
	.pipe(uglify())
	.pipe(gulp.dest('dist'));
});
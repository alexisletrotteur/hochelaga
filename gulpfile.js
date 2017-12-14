// Source of this recipe :
// https://webdesign.tutsplus.com/tutorials/combining-pattern-lab-with-gulp-for-improved-workflow--cms-22187

// PLEASE SEE ALSO
// https://github.com/neoskop/patternlab-php && https://github.com/neoskop/patternlab-php/blob/master/gulpfile.js

var gulp            = require('gulp'),
    autoprefixer    = require('gulp-autoprefixer'),
    bump            = require('gulp-bump'),
    clean           = require('gulp-clean'),
    concat          = require('gulp-concat'),
    browserSync     = require('browser-sync'),
    cssmin          = require('gulp-cssmin'),
    del             = require('del'),
    filter          = require('gulp-filter'),
    git             = require('gulp-git'),
    gulpif          = require('gulp-if'),
    imagemin        = require('gulp-imagemin'),
    postcss         = require('gulp-postcss'),
    rename          = require('gulp-rename'),
    sass            = require('gulp-sass'),
    shell           = require('gulp-shell'),
    sourcemaps      = require('gulp-sourcemaps'),
    tagversion      = require('gulp-tag-version'),
    tildeImporter   = require('node-sass-tilde-importer'),
    uglify          = require('gulp-uglify'),
    config          = require('./build.config.json');

// Trigger and switches
var production;
var distribution;

// Tasks: Clean output folders :before
// Description: Clear public folder
gulp.task('clean:before', function () {
    return gulp.src( config.assets.dest )
      .pipe(clean({
          force: true
      }))
});

// Description: Clear distribution folder
gulp.task('clean-dist:before', function () {
  return gulp.src( config.assets.distribution )
    .pipe(clean({
      force: true
    }))
});

// JS files
// From node_modules to source -- stay up to date with curent versions
gulp.task('nodemodulescripts', function () {
  return gulp.src(config.nodemodulescripts.files)
      .pipe(gulp.dest(
          config.nodemodulescripts.dest
      ))
      .pipe(browserSync.reload({stream:true}));
});

gulp.task('nodemodulescripts-dist', function () {
  return gulp.src(config.nodemodulescripts.files)
      .pipe(gulp.dest(
          config.nodemodulescripts.distribution
      ))
});


// Scripts from source to public
gulp.task('scripts', function () {
    return gulp.src(config.scripts.files)
        /*
        .pipe(concat(
            'application.js' // Export all js to a single js file, to be tested
        ))
        */
        .pipe(
            gulpif(production, uglify())
        )
        .pipe(
            gulpif(production, rename({
                suffix: '.min'
            }))
        )
        .pipe(gulp.dest(
            config.scripts.dest
        ))
        .pipe(browserSync.reload({stream:true}));
});

// Scripts from source to public
gulp.task('scripts-dist', function () {
  return gulp.src(config.scripts.files)
      .pipe(
          uglify()
      )
      .pipe(
          rename({ suffix: '.min'})
      )
      .pipe(gulp.dest(
          config.scripts.distribution
      ));
});

// Fonts, copy
gulp.task('fonts', function () {
    return gulp.src(config.fonts.files)
      .pipe(gulp.dest(
        config.fonts.dest
      ))
      .pipe(browserSync.reload({stream:true}));
});

gulp.task('fonts-dist', function () {
  return gulp.src(config.fonts.files)
    .pipe(gulp.dest(
      config.fonts.distribution
    ))
});

// Images copy and minimize
gulp.task('images', function () {
    return gulp.src(config.images.files)
      .pipe(gulpif(production, imagemin()))
      .pipe(gulp.dest(
        config.images.dest
      ))
      .pipe(browserSync.reload({stream:true}));
});

gulp.task('images-dist', function () {
  return gulp.src(config.imagesdist.files)
    .pipe(imagemin())
    .pipe(gulp.dest(
      config.imagesdist.dest
    ))
});

// Source sass files : copy to distribution folder
gulp.task('scss-dist', function () {
  return gulp.src(config.scss.files)
  .pipe(gulp.dest(
    config.scss.distribution
  ))
});


// Task: Handle Sass and CSS
gulp.task('sass', function () {

    var processors = [
        autoprefixer
    ];

    return gulp.src(config.scss.files)
      .pipe(sourcemaps.init())
      .pipe(sass( { importer: tildeImporter } ).on('error', sass.logError))
      .pipe(gulpif(production, cssmin()))
      .pipe(gulpif(production, rename({
        suffix: '.min'
      })))
      .pipe(postcss( processors ))
      .pipe(sourcemaps.write(
        config.sourcemaps.dest
      ))
      .pipe(gulp.dest(
        config.scss.dest
      ))
      .pipe(browserSync.reload({stream:true}));
});


gulp.task('sass-dist', function () {

      var processors = [
          autoprefixer
      ];

      return gulp.src(config.scss.files)
        .pipe(sourcemaps.init())
        .pipe(sass( { importer: tildeImporter } ).on('error', sass.logError))
        .pipe(cssmin())
        .pipe(rename({
          suffix: '.min'
        }))
        .pipe(postcss( processors ))
        .pipe(sourcemaps.write(
          config.sourcemaps.dest
        ))
        .pipe(gulp.dest(
          config.scss.distribution
        ));
  });

// Task: patternlab
// Description: Build static Pattern Lab files via PHP script
// Type " $ php core/console --help --generate " to understand what is involved
gulp.task('patternlab', function () {
    return gulp.src('', {read: false})
      .pipe(shell([
        'php core/console --generate --patternsonly --nocache'
      ]))
      .pipe(browserSync.reload({stream:true}));
});


// Task: styleguide
// Description: Copy Styleguide-Folder from core/ to public
gulp.task('styleguide', function() {
    return gulp.src(config.patternlab.styleguide.files)
      .pipe(gulp.dest(config.patternlab.styleguide.dest));
});


  // task: BrowserSync
  // Description: Run BrowserSync server with disabled ghost mode
  gulp.task('browsersync', function() {
    browserSync({
      server: {
          baseDir: config.root
      },
      ghostMode: true,
      open: "external"
    });
  });

  // Task: Watch files
  gulp.task('watch', function () {

    // Watch Pattern Lab files
    gulp.watch(
      config.patternlab.files,
      ['patternlab']
    );

    // Watch scripts
    gulp.watch(
      config.scripts.files,
      ['scripts']
    );

    // Watch images
    gulp.watch(
      config.images.files,
      ['images']
    );

    // Watch Sass
    gulp.watch(
      config.scss.files,
      ['sass']
    );

    // Watch fonts
    gulp.watch(
      config.fonts.files,
      ['fonts']
    );
  });

  // Task: Default
  // Description: Build all stuff of the project once
  gulp.task('default', ['clean:before'], function () {
    production = false;

    gulp.start(
      'patternlab',
      'styleguide',
      'fonts',
      'sass',
      'images',
      'nodemodulescripts',
      'scripts'
    );
  });

  // Task: Start your production-process
  // Description: Typ 'gulp' in the terminal
  gulp.task('serve', function () {
    production = false;

    gulp.start(
      'browsersync',
      'default',
      'watch'
    );
});

  // Task: Distribute
  // Description: Build all stuff of the project once
  gulp.task('distribute', ['clean-dist:before'], function () {
    production = true;

    gulp.start(
      'nodemodulescripts-dist',
      'scripts-dist',
      'fonts-dist',
      'images-dist',
      'sass-dist',
      'scss-dist'
    );
  });

  // Task: Start your production-process
  // Description: Typ 'gulp' in the terminal
  gulp.task('serve', function () {
    production = false;

    gulp.start(
      'browsersync',
      'default',
      'watch'
    );
});


// Task: Deploy static content
// Description: Deploy static content using rsync shell command
gulp.task('deploy', function () {
    return gulp.src(config.deployment.local.path, {read: false})
      .pipe(shell([
        'rsync '+ config.deployment.rsync.options +' '+ config.deployment.local.path +'/ '+ config.deployment.remote.host
      ]))
  });

  // Function: Releasing (Bump & Tagging)
  // Description: Bump npm versions, create Git tag and push to origin
gulp.task('release', function () {
  production = true;

  return gulp.src(config.versioning.files)
    .pipe(bump({
      type: gulp.env.type || 'patch'
    }))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('Release a ' + gulp.env.type + '-update'))

    // read only one file to get version number
    .pipe(filter('package.json'))

    // Tag it
    .pipe(tagversion())

    // Publish files and tags to endpoint
    .pipe(shell([
      'git push origin develop',
      'git push origin --tags'
    ]));
  });

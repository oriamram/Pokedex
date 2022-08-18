const gulp = require("gulp");
const clean = require("gulp-clean");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const ts = require("gulp-typescript");
const uglify = require("gulp-uglify");
const browsersync = require("browser-sync").create();
const webpack = require("gulp-webpack");
const webpackConfig = require("./webpack.config");
const server = require("gulp-develop-server");

const tsProjectClient = ts.createProject("src/client/tsconfig.json");
const tsProjectServer = ts.createProject("src/server/tsconfig.json");

// clean task
gulp.task("clean", () => gulp.src("dist", { allowEmpty: true }).pipe(clean()));

// Copy Images task
gulp.task("images", () => gulp.src("src/client/images/*", { allowEmpty: true }).pipe(gulp.dest("dist/client/images")));

// HTML task
gulp.task("html", () => gulp.src("src/client/*.html").pipe(gulp.dest("dist/client")));

// Sass task
gulp.task("sass", () =>
	gulp
		.src("src/client/styles/*.scss")
		.pipe(sass())
		.pipe(postcss([cssnano()]))
		.pipe(gulp.dest("dist/client/styles"))
		.pipe(browsersync.stream())
);

// Typescript Client task
gulp.task("ts-client", () => gulp.src("src/client/scripts/*.ts").pipe(tsProjectClient()).pipe(gulp.dest("dist/client/js")));

// Webpack task
gulp.task("webpack", () => webpack(webpackConfig).pipe(uglify()).pipe(gulp.dest("dist/client")));

// Clean js folder
gulp.task("clean-js", () => gulp.src("dist/client/js", { allowEmpty: true }).pipe(clean()));

// Build ts-client task
gulp.task("build-ts-client", gulp.series("ts-client", "webpack", "clean-js"));

// Typescript Server task
gulp.task("ts-server", () => gulp.src("src/server/*.ts").pipe(tsProjectServer()).pipe(gulp.dest("dist/server")));

// Start Server task
gulp.task("server-start", (cb) => {
	server.listen({ path: "dist/server/server.js" });
	cb();
});

// Restart Server task
gulp.task("server-restart", (cb) => {
	server.restart();
	setTimeout(() => cb(), 2500);
});

// Browser sync tasks
gulp.task("browsersyncServe", (cb) => {
	browsersync.init({
		proxy: { target: "http://localhost:3000" },
		port: 5500,
	});
	cb();
});

gulp.task("browsersyncReload", (cb) => {
	browsersync.reload();
	cb();
});

// Watch task
gulp.task("watch", () => {
	gulp.watch("src/client/images", gulp.series("images", "browsersyncReload"));
	gulp.watch("src/client/*.html", gulp.series("html", "browsersyncReload"));
	gulp.watch("src/client/styles/*.scss", gulp.series("sass"));
	gulp.watch("src/client/scripts/*.ts", gulp.series("build-ts-client", "browsersyncReload"));
	gulp.watch("src/server", gulp.series("ts-server"));
	gulp.watch("dist/server/server.js", gulp.series("server-restart", "browsersyncReload"));
});

// Default task
gulp.task("default", gulp.series("clean", "images", "ts-server", "build-ts-client", "server-start", "sass", "html", "browsersyncServe", "watch"));

// Heroku clean files
gulp.task("heroku-clean", () => {
	return gulp.src(["deploy/package.json", "deploy/package-lock.json", "deploy/dist", "deploy/data"], { allowEmpty: true }).pipe(clean());
});

// Heroku copy root
gulp.task("heroku-copy-root", () => {
	return gulp.src(["./package.json", "./package-lock.json"]).pipe(gulp.dest("deploy"));
});

// Heroku copy dist
gulp.task("heroku-copy-dist", () => {
	return gulp.src("dist/**/*").pipe(gulp.dest("deploy/dist"));
});

// Deploy
gulp.task("deploy", gulp.series("heroku-clean", "heroku-copy-root", "heroku-copy-dist"));

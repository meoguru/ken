'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: {
            docs: [
                'docs/dist/**/*',
                '!docs/dist/.keep'
            ]
        },
        jsdoc: {
            options: {
                template: 'node_modules/jaguarjs-jsdoc',
                configure: 'docs/conf.json'
            },
            all: {
                src: [
                    '{bin,lib,tests}/**/*.js',
                    'README.md'
                ],
                dest: 'docs/dist'
            }
        },
        connect: {
            options: {
                hostname: '0.0.0.0'
            },
            docs: {
                options: {
                    port: 8000,
                    base: 'docs/dist',
                    middleware: function (connect, options) {
                        return [
                            require('connect-livereload')(),
                            connect.static(options.base[0])
                        ];
                    }
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            docs: {
                options: {
                    interrupt: true,
                },
                files: [
                    'docs/conf.json',
                    '{bin,lib,tests}/**/*.js',
                    'README.md'
                ],
                tasks: 'build:docs'
            }
        }
    });

    grunt.registerTask('build:docs', [
        'clean:docs',
        'jsdoc:all'
    ]);

    grunt.registerTask('docs', [
        'build:docs',
        'connect:docs',
        'watch:docs'
    ]);

};

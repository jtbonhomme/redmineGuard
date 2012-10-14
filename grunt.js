/* grunt.js */

/*global module:false*/
var path = require('path');

module.exports = function(grunt) {
  // Load tasks
  grunt.loadNpmTasks('grunt-contrib');
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;\n' + ' */'
    },
    lint: {
      files: ['grunt.js', 'core/*.js']
    },
    jshint: {
      options: {
        bitwise: true,
        indent: true,
        camelcase: true,
        curly: true,
        trailing: true
      }
    },
    watch : {
      files : ['grunt.js', 'core/*.js'],
      tasks: 'lint'
    }  });

  // Default task.
  grunt.registerTask('default', 'lint watch');
};
#!/usr/bin/env node
var fs = require('fs');

var source = process.argv.splice(2)[0];
var target = source.substring(0, source.lastIndexOf('.')) + '.css';

fs.readFile(source, 'utf-8', function(err, data) {
// utils
	// something that strips white space
var output = data;

fs.writeFile(target, output, function(err) {
        if (err) throw err;
        console.log('Wrote ' + target + '!');
    });
});
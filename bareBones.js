#!/usr/bin/env node
var fs = require('fs');

var source = process.argv.splice(2)[0];
var target = source.substring(0, source.lastIndexOf('.')) + '.css';

fs.readFile(source, 'utf-8', function(err, data) {

var dataFormatter = function (data) {
	return data.map(function(line) {
		return {
			line: line
		};
	});
};

var treeFormatter = function (data) {
	return data.map(function(elem) {
		if (elem.line.charAt(0) == " ") {
			return elem.line + ";";
		} else if (elem.line == "") {
			return elem.line + "}";
		} else {
			return elem.line + " {";
		}
	});
};

var parts = data.split('\n');

var tree = dataFormatter(parts);

var join = treeFormatter(tree).join('\n');

var final = join.charAt(join.length-1) === "}" ? join : join + "\n}";

var output = final;

fs.writeFile(target, output, function(err) {
        if (err) throw err;
        console.log('Transpiled ' + source + ' to ' + target);
    });
});
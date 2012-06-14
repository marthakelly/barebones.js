#!/usr/bin/env node
var fs = require('fs'),
	source = process.argv.splice(2)[0],
	target = source.substring(0, source.lastIndexOf('.')) + '.css';

fs.readFile(source, 'utf-8', function(err, data) {
	var dataFormatter = function (data) {
		return data.map(function(line) {
			return {
				line: line
			};
		});
	};

	var cssFormatter = function (data) {
		return data.map(function(elem) {
			if (elem.line.charAt(0) === "@") {
				// will deal with variables later, just logging it for now
				console.log(elem.line);
			} else if (elem.line.search(":") != "-1") {
				return elem.line + ";";
			} else if (elem.line === "") {
				return elem.line + "}";
			} else if (elem.line.charAt(0) !== " ") {
				return elem.line + " {";
			} else {
				return elem.line;
			}
		});	
	};

	var parts = data.split('\n');

	var tree = dataFormatter(parts);
	
	console.log(dataFormatter(parts));

	var join = cssFormatter(tree).join('\n');
		
	var final = join.charAt(join.length-1) === "}" ? join : join + "\n}";

	var output = final;

	fs.writeFile(target, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + source + ' to ' + target);
    });
});

// could input data as a HUGE object
// and search for object properties with the : char in it, which indicates a property/value
// could extract variable declarations, remove all white space, and reformat!
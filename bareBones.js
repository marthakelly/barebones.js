#!/usr/bin/env node

var fs = require('fs'),
	bare = process.argv.splice(2)[0],
	css = bare.substring(0, bare.lastIndexOf('.')) + '.css';

fs.readFile(bare, 'utf-8', function(err, data) {
	if (err) throw err;
	
	var dataFormatter = function (data) {		
		return data.map(function(line) {	
			var equalize = line.trimLeft();

			return {
				line: equalize
			};
		});
	};

	var cssFormatter = function (data) {
		return data.map(function(elem) {
			if (elem.line.charAt(0) === "@") {
				// will deal with variables later, just logging it for now
				//console.log(elem.line);
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
	
	//console.log(dataFormatter(parts));

	var join = cssFormatter(tree).join('\n');
		
	var final = join.charAt(join.length-1) === "}" ? join : join + "\n}";

	var output = final;

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		
		console.log('Converted ' + bare + ' to ' + css);
    });
});

// could input data as a HUGE object
// and search for object properties with the : char in it, which indicates a property/value
// could extract variable declarations, remove all white space, and reformat!

// or if there is space to the left it's a child element of the item before it
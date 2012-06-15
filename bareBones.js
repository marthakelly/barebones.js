#!/usr/bin/env node

var fs = require('fs'),
	bare = process.argv.splice(2)[0],
	css = bare.substring(0, bare.lastIndexOf('.')) + '.css';

fs.readFile(bare, 'utf-8', function(err, data) {
	if (err) throw err;
	
	var dataFormatter = function (data) {	
		return data.map(function(line) {	
			var selector,
				declaration,
				indent,
				property,
				variable,
				properties = [],
				children = [];

			/^\s/.test(line) ? indent = true : indent = false;
			
			line.search(':') != "-1" ? property = true : property = false;
			
			if (line.charAt(0) === '@') {
				variable = line;
			} else if (indent === false && !(line.charAt(0) === "@")) {
				selector = line;
			} else if (property === true) {
				properties.push(line);
			} else if (indent === true && property === false) {
				children.push(line.trimLeft());
			}
			
			return {
				variable: variable,
				selector: selector,
				declaration: properties,
				children: children
			};
		});
	};

	var cssFormatter = function (data) {
		var tree = [],
			variables = [];	
				
		// console.log(data);
				
		data.map(function(elem) {
			if (elem.variable) {
				variables.push({variable: elem.variable});
			} else if (elem.selector) {
				tree.push({selector: elem.selector, declarations: []});
				//tree.push({declarations: []})	;			
			} else if (elem.declaration.length >= 1) {
				var value = elem.declaration.toString();
				if (tree[tree.length-1].children) {
					console.log("i am the value of a nested thing");
				} else {
					tree[tree.length-1].declarations.push(value);
				}
			} else if (elem.children.length >= 1) {
				tree[tree.length-1].children = elem.children;
			}
		});
		
		console.log(tree);
		
		return tree;
		// console.log(variables);
		
	};

	console.log(cssFormatter(dataFormatter(data.split('\n'))));

	/*var parts = data.split('\n');

	var tree = dataFormatter(parts);
	
	var join = cssFormatter(tree).join('\n');
		
	var final = join.charAt(join.length-1) === "}" ? join : join + "\n}";*/

	final = data;

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
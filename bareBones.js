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
				
			// qualifiers
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
				
		data.map(function(elem) {
			var parent = tree.length-1;
			
			if (elem.variable) {
				variables.push({variable: elem.variable});
			} else if (elem.selector) {
				tree.push({selector: elem.selector, declarations: []});
			} else if (elem.children != "") {
				childSelector = elem.children.toString();
				tree[parent].children = {selector: childSelector, declarations: []};
			} else if (elem.declaration.length >= 1) {
				var value = elem.declaration.toString();
				if (tree[parent].children) {
					// this is not working, whyyyyyy
					tree[parent].children.declarations.push(value);
				} else {
					tree[parent].declarations.push(value);
				}
			}
		});
		return tree;
	};

	console.log(cssFormatter(dataFormatter(data.split('\n'))));

	final = cssFormatter(dataFormatter(data.split('\n')));

	var output = final;

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		
		console.log('Converted ' + bare + ' to ' + css);
    });
});
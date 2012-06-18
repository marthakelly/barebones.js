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
				children = [],
				isChild = false;
								
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
				isChild = true;
			}
			
			return {
				variable: variable,
				selector: selector,
				declaration: properties,
				children: children,
				isChild: isChild
			};
			
		});
		
	};

	var cssFormatter = function (data) {
		var tree = [],
			variables = [],
			// helper
			isEmpty = function(obj) {
			  return Object.keys(obj).length === 0;
			};
				
		data.map(function(elem) {
			var parent = tree.length-1;
			
			// separate out variables
			if (elem.variable) {
				variables.push(elem.variable.split('='));
			}
			
			if (elem.selector) {
				tree.push({ selector: elem.selector, declarations: [], children: {} });
			}
			
			// I need to remove that empty string children before the data gets to the CSS formatter...
			// until then this is my janky fallback
			
			if (elem.isChild && elem.children != "") {

				var recursion = function (parent) {
					
					if ( isEmpty(parent.children) ) {
						parent.children = { selector: elem.children.toString(), declarations: [], children: {} };
					} else {
						recursion(parent.children);
					}
				};
							
				recursion(tree[parent], 0); 
			}
			
		});

		return tree;
	};
	
	var display = function (tree) {
		return tree.map(function(elem){
			return elem.selector + " {" + "\n" + elem.declarations.join("; \n") + ';' + '\n' + '}';
		});	
	};
	
	// stringify
	console.log(JSON.stringify(cssFormatter(dataFormatter(data.split('\n'))), undefined, 2));
	
	// console.log(dataFormatter(data.split('\n')));
	
	var dataFormatter = dataFormatter(data.split('\n'));
	
	var output = (display(cssFormatter(dataFormatter))).join('\n');

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
    });
});
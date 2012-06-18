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
				variables.push(elem.variable.split('='));
			} else if (elem.selector) {
				tree.push({selector: elem.selector, declarations: []});
			} else if (elem.children != "") {
				var childSelector = elem.children.toString();
				tree[parent].children = {selector: childSelector, declarations: []};
			} else if (elem.declaration.length >= 1) {
				var value = elem.declaration.toString();
				
				
				for (var i = 0, i; i < variables.length; i++) {
					var one = variables[i][0].trim(),
						two = variables[i][1].trim();
					
					value = value.replace(one, two);
					// console.log(variables[i][0]);
					// console.log(variables[i][1]);
					// console.log(variables);
				}
				
				console.log(value);
				
				/*variables.forEach(function(elem){
					var one = elem[0],
						two = elem[1];
						// console.log(one);
						// console.log(two);
						//var newValue = value.replace(one, two);
						//console.log(newValue);
						console.log(elem);
				});*/
				
				if (tree[parent].children) {
					tree[parent].children.declarations.push(value);
				} else {
					tree[parent].declarations.push(value);
				}
			}
		});
				
		/*variables.map(function(elem){			
			var variable = elem[0],
				value = elem[1];
				
				// console.log(variable);
				// console.log(value);
		});*/
		
		// console.log(variables);

		return tree;
	};
	
	var display = function (tree) {
		return tree.map(function(elem){
			return elem.selector + " {" + "\n" + elem.declarations.join("; \n") + ';' + '\n' + '}';
		});	
	};
	
	// stringify
	// console.log(JSON.stringify(cssFormatter(dataFormatter(data.split('\n'))), undefined, 2));
	
	var dataFormatter = dataFormatter(data.split('\n'));

	// console.log(display(cssFormatter(dataFormatter)));
	
	var output = (display(cssFormatter(dataFormatter))).join('\n');

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
    });
});
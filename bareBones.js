#!/usr/bin/env node

var fs = require('fs'),
	bare = process.argv.splice(2)[0],
	css = bare.substring(0, bare.lastIndexOf('.')) + '.css',
	// global helper
	isEmpty = function(obj) {
	  return Object.keys(obj).length === 0;
	};

fs.readFile(bare, 'utf-8', function(err, data) {
	if (err) throw err;
	
	var whiteSpace;
	
	// init turns the data from the .bare file into an array of objects
	// each object describes what part of a CSS block the line is
	
	var init = function (data) {			
		return data.map(function(line, i) {	
						
			var selector,
				declaration,
				indentExists,
				property,
				variable,
				indentLevel = 0,
				properties = [],
				children = [],
				child = false;
			
			var firstChar = line.match('[a-zA-Z\.\#\@]+');
			
			if (firstChar !== null) {
				var index = firstChar['index'];
			}

			indentLevel = index;
				
			/^\s/.test(line) ? indentExists = true : indentExists = false;
			
			line.search(':') != "-1" ? property = true : property = false;
			
			if (typeof whiteSpace === "undefined" && property === true) {
				var firstChar = line.match('[a-zA-z]'),
					index = firstChar['index'];
								
				whiteSpace = line.substr(0, index);
			}
			
			if (line.charAt(0) === '@') {
				variable = line;
			} else if (indentExists === false && !(line.charAt(0) === "@")) {
				selector = line;
			} else if (property === true) {
				properties.push(whiteSpace + line.trimLeft());	
			} else if (indentExists === true && property === false) {
				children.push(line.trimLeft());
				child = true;
			}
			
			return {
				variable: variable,
				selector: selector,
				declaration: properties,
				children: children,
				child: child,
				indentLevel: indentLevel
			};
			
		});
		
	};
	
	// treeFormat takes the array from init and turns it into an array of CSS objects (blocks) with nested children if applicable

	var treeFormat = function (data) {
		
		// console.log(data);
			
		var tree = [],
			variables = [];
			
		data.forEach(function(elem, i) {
			var parent = tree.length-1,
				indent = data[i].indentLevel;
			
			if (elem.variable) {
				variables.push(elem.variable.split('='));
			}			
			
			if (elem.selector) {
				var declarations = [],
					index = i + 1;
				
				var findDeclarations = function (index) {
					if (typeof data[index] === 'undefined') {
						return;
					} else if (data[index].declaration.length) {
						var value = data[index].declaration.toString();
						// replace variables
						for (var i = 0; i < variables.length; i++) {
							var one = variables[i][0].trim(),
								two = variables[i][1].replace(';', '').trim();
							value = value.replace(one, two);
						}
								
						declarations.push(value);
						index = index + 1;
						findDeclarations(index);
					} 
				}; 
					
				findDeclarations(index);
				
				tree.push({ indent: indent, selector: elem.selector, declarations: declarations, children: {} });
			}

			// I need to remove the empty string children before the data gets to the CSS formatter...
			// until then elem.children != "" is my fallback :/
			
			if (elem.child && elem.children != "") {

				var nesting = function (parent) {
					var declarations = [],
						parents = [],
						indent = data[i].indentLevel;
					
						findDeclarations = function (i) {
							i++	
							if (data[i].declaration.length === 0) {
								return;
							} else {
								declarations.push(data[i].declaration.toString());
								findDeclarations(i);
							} 
						}; 

					findDeclarations(i);
					
					if (isEmpty(parent.children) ) {
						parents.push(parent.selector);
						parent.children = { parents: parents, indent: indent, selector: elem.children.toString(), declarations: declarations, children: {} };
					} else {
						
						nesting(parent.children);
					}
				};

				nesting(tree[parent]);
			}
			
		});

		return tree;
	};
	
	// cssFormat takes the array of objects from treeFormat and writes a string for each CSS block to the new .css file
	
	var cssFormat = function (tree) {
		
		// console.log(tree);
		
		return tree.map(function(elem, i){		
			var beginBlock = " {" + "\n",
				endBlock = "\n" + "}",
				sel = elem.selector,
				dec = elem.declarations.join("; \n") + ";",
				parents = elem.children.parents,
				block,
				children;
								
			if (isEmpty(elem.children)) {
				block = sel + beginBlock + dec + endBlock;
			} else {
								
				// run all this code
				// check for existance of children on this child object
				// if it exists do it again
				// else return
				
				var childSel = elem.children.selector.trim(),
					childDec = elem.children.declarations.join("; \n") + ";";
							
				block = sel + beginBlock + dec + endBlock;
				children = "\n" + parents + " " + childSel + beginBlock + childDec + endBlock;
			}
			
			return children ? block + children : block;
			
		});
	};
		
	var init = init(data.split('\n'));
		
	var output = (cssFormat(treeFormat(init))).join('\n');
	
	// stringify the final data array
	console.log(JSON.stringify(treeFormat(init), undefined, 2));

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
    });
});
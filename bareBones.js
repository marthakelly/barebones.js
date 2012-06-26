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
	
	var whiteSpace,
		unit;
	
	// init turns the data from the .bare file into an array of objects
	// each object describes what part of a CSS block the line is
	
	var processLines = function (data) {			
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
				var numSpaces = firstChar['index'];
				if (typeof unit === "undefined" && numSpaces) {
					unit = numSpaces;
				}
			}
			
			if (typeof unit !== "undefined") {
				indentLevel = numSpaces/unit;
			}
							
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
				selector = line.trim();
			} else if (property === true) {
				properties.push(whiteSpace + line.trimLeft());	
			} else if (indentExists === true && property === false) {
				children.push(line.trim());
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

	var treeFormat = function (lineObjects) {

		// console.log(lineObjects);

		var tree = [],
			variables = [];

		lineObjects.forEach(function(elem, i) {

			var parent = tree.length-1,
				indent = lineObjects[i].indentLevel;

			if (elem.variable) {
				variables.push(elem.variable.split('='));
			}			

			if (elem.selector) {				
				var declarations = [],
					index = i + 1,
					selector = elem.selector;

				var findDeclarations = function (index) {
					if (typeof lineObjects[index] === 'undefined') {
						return;
					} else if (lineObjects[index].declaration.length) {
						var value = lineObjects[index].declaration.toString();
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

				tree.push({ indentLevel: indent, selector: selector, declarations: declarations, children: [] });
			}

			// I need to remove the empty string children before the lineObjects gets to the CSS formatter...
			// until then elem.children != "" is my fallback :/

			if (elem.child && elem.children != "") {

				var findChildren = function (parent, elem) {

					var declarations = [],
						parents = [],
						selector = elem.children.toString();

						findDeclarations = function (i) {
							i++	
							if (lineObjects[i].declaration.length === 0) {
								return;
							} else {
								var value = lineObjects[i].declaration.toString();

								// replace variables
								for (var j = 0; j < variables.length; j++) {
									var one = variables[j][0].trim(),
										two = variables[j][1].replace(';', '').trim();
									value = value.replace(one, two);
								}

								declarations.push(value);
								findDeclarations(i);
							}
						};

					// parents.push(parent.selector);

					findDeclarations(i);

					tree.push({ indentLevel: indent, selector: selector, declarations: declarations, children: [] })

				};

				findChildren(tree[parent], elem);

			}

		});

		return tree;
	};
	
	var findParents = function(tree) {	

		// console.log(tree);
		
		var newTree = [];

		tree.map(function(elem, i){
			var inc = i+1,
				dec = i-1;
			
			var find = function(level) {
				i--
				
				if (!tree[i]) {
					return;
				} else if (tree[i].indentLevel === level) {
					tree[i].children.push(elem);
					return;
				} else {
					find(level);
				}
			};

			if (elem.indentLevel === 0) {
				newTree.push(elem);
				return;
			}

			if (elem.indentLevel === 1) {
				find(0);
			} 
			
			if (elem.indentLevel === 3) {
				find(1);
			}
			
			if (elem.indentLevel === 4) {
				find(3);
			}

		});
		
		return newTree;
	};
	
	// generateCSS takes the array of objects from treeFormat and writes a string for each CSS block to the new .css file
		
	var generateCSS = function generateCSS (tree) {			
		var beginBlock = " {" + "\n",
			endBlock = "\n" + "}",
			output = [],
			block,
			sel,
			dec,
			parents,
			i;
		
		function _generateCSS (tree, prefix) {
			for (i=0; i<tree.length; i++) {
				sel = prefix + tree[i].selector,
				dec = tree[i].declarations.join("; \n") + ";",
				block = sel + beginBlock + dec + endBlock;

				output.push(block);
						
				if (tree[i].children.length) {
					_generateCSS(tree[i].children, sel);
				}
			}
		}
		
		_generateCSS(tree, "");
		
		return output;
			
	};
		
	var lineObjects = processLines(data.split('\n'));
		
	var output = (generateCSS(findParents(treeFormat(lineObjects)))).join('\n');
	
	console.log(output);
	
	// var test = findParents(treeFormat(init));
	
	// stringify the final data array
	// console.log(JSON.stringify(treeFormat(init), undefined, 2));

	// console.log(JSON.stringify(findParents(treeFormat(init)), undefined, 2));

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
    });
});
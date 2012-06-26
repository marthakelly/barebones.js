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

	var treeFormat = function (data) {
		
		console.log(data);
			
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
					index = i + 1,
					selector = elem.selector;
									
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
				
				tree.push({ indent: indent, selector: selector, declarations: declarations });
			}

			// I need to remove the empty string children before the data gets to the CSS formatter...
			// until then elem.children != "" is my fallback :/
			
			if (elem.child && elem.children != "") {
								
				var findChildren = function (parent, elem) {
					
					var declarations = [],
						parents = [],
						selector = elem.children.toString();
					
						findDeclarations = function (i) {
							i++	
							if (data[i].declaration.length === 0) {
								return;
							} else {
								var value = data[i].declaration.toString();
								
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

					tree.push({ parents: [], indent: indent, selector: selector, declarations: declarations })
					
				};

				findChildren(tree[parent], elem);
				
			}
			
		});
	
		return tree;
	};
	
	var findParents = function(tree) {
		tree.forEach(function(elem, i){
			var parent,
				format,
				selector;
			if (!elem.indent) {
				return;
			} else {
				var appendParents = function(elem){
					i--
					 if (elem.indent > tree[i].indent) {
						format = tree[i].selector.trim();
						selector = format + " ";
						elem.parents.push(selector);
						if (tree[i].parents){
							parent = tree[i].parents.join("");
							elem.parents.unshift(parent);
						}
					} else if (elem.indent < tree[i].indent){
						var findMe = function(i) {
							i--
							if (elem.indent > tree[i].indent) {
								elem.parents.push(tree[i].selector);
							} else {
								findMe(i);
							}
						};
						findMe(i);
					}
				};
			}
			appendParents(elem);
		});
		
		return tree;
	};
	
	// cssFormat takes the array of objects from treeFormat and writes a string for each CSS block to the new .css file
	
	var cssFormat = function (tree) {
		return tree.map(function(elem, i){
			var beginBlock = " {" + "\n",
				endBlock = "\n" + "}",
				sel = elem.selector,
				dec = elem.declarations.join("; \n") + ";",
				parents = elem.parents ? elem.parents.join("") : "",
				block,
				children;
							
				block = parents + sel + beginBlock + dec + endBlock;
			
			return block
			
		});
	};
		
	var init = init(data.split('\n'));
		
	var output = (cssFormat(findParents(treeFormat(init)))).join('\n');
	
	// var test = findParents(treeFormat(init));
	
	// stringify the final data array
	// console.log(JSON.stringify(treeFormat(init), undefined, 2));

	console.log(JSON.stringify(findParents(treeFormat(init)), undefined, 2));


	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
    });
});
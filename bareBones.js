#!/usr/bin/env node

var fs = require('fs'),
	bare = process.argv.splice(2)[0],
	css = bare.substring(0, bare.lastIndexOf('.')) + '.css',
	// helper
	isEmpty = function(obj) {
	  return Object.keys(obj).length === 0;
	};

fs.readFile(bare, 'utf-8', function(err, data) {
	if (err) throw err;
	
	var whiteSpace;
		
	var init = function (data) {			
		return data.map(function(line, i) {	
			var selector,
				declaration,
				indentExists,
				property,
				variable,
				properties = [],
				children = [],
				child = false;
				
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
				child: child
			};
			
		});
		
	};

	var treeFormat = function (data) {
		var tree = [],
			variables = [];
			
		// console.log(data);

		data.forEach(function(elem, i) {
			var parent = tree.length-1;
			
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
				
				tree.push({ selector: elem.selector, declarations: declarations, children: {} });
			}
			
			// I need to remove that empty string children before the data gets to the CSS formatter...
			// until then elem.children != "" is my fallback :/
			
			if (elem.child && elem.children != "") {

				// console.log(elem, i);

				var nesting = function (parent) {
					var declarations = [],
						parents,
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
					
					if (isEmpty(parent.children)) {
						parent.children = { selector: elem.children.toString(), declarations: declarations, children: {} };
					} else {
						nesting(parent.children);
					}
				};

				nesting(tree[parent]);
			}
			
		});

		return tree;
	};
	
	var cssFormat = function (tree) {		
		
		// tconsole.log(tree);
		
		return tree.map(function(elem, i){
			
			var beginBlock = " {" + "\n",
				endBlock = "\n" + "}",
				sel = elem.selector,
				dec = elem.declarations.join("; \n") + ";",
				parents = [],
				block,
				children;
				
			if (isEmpty(elem.children)) {
				block = sel + beginBlock + dec + endBlock;
			} else {
				var childSel = elem.children.selector.trim(),
					childDec = elem.children.declarations.join("; \n") + ";";
					
				parents.push(elem.selector);
				
				block = sel + beginBlock + dec + endBlock;
				children = "\n" + parents.join(" ") + " " + childSel + beginBlock + childDec + endBlock;
				
				// console.log(elem);
				
				// some kind of recursion here 
				
				var listChildren = function(elem) {
					var hasChildren = '.children';
					
					console.log(elem);
					
					if (elem.hasChildren) {
						hasChildren = hasChildren + hasChildren;
						listChildren(elem.hasChildren);
					} else {
						return;
					}
				}
				
				listChildren(elem);
				
				/*for (children in elem) {
					console.log(Object.getPrototypeOf(elem).children);
				}*/
			}
			
			return children ? block + children : block;
			
		});
	};
	
	// stringify the whole data array
	// console.log(JSON.stringify(treeFormat(init(data.split('\n'))), undefined, 2));
		
	var init = init(data.split('\n'));
		
	var output = (cssFormat(treeFormat(init))).join('\n');

	fs.writeFile(css, output, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
    });
});
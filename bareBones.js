#!/usr/bin/env node

var fs = require('fs'),
	bare = process.argv.splice(2)[0],
	css = bare.substring(0, bare.lastIndexOf('.')) + '.css',
	// global helper
	isEmpty = function(obj) {
	  return Object.keys(obj).length === 0;
	};

// node's file system will take in our custom .bare file and make it available to bareBones();
	
fs.readFile(bare, 'utf-8', function(err, data) {
	if (err) throw err;
	bareBones(data);
});

var bareBones = function(data) {
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
				child = false,
				firstChar = line.match('[a-zA-Z\.\#\@]+'),
				numSpaces;
			
			if (firstChar !== null) {
				numSpaces = firstChar['index'];
				if (typeof unit === "undefined" && numSpaces) {
					unit = numSpaces;
				}
			}
			
			if (typeof unit !== "undefined") {
				indentLevel = numSpaces/unit;
			}
			
			indentExists = /^\s/.test(line);
			
			property = line.search(':') != "-1";
			
			if (typeof whiteSpace === "undefined" && property === true) {
				firstChar = line.match('[a-zA-z]');
				whiteSpace = line.substr(0, firstChar['index']);
			}
			
			line = line.trim();
			
			if (line.charAt(0) === '@') {
				variable = line;
			} else if (indentExists === false && !(line.charAt(0) === "@")) {
				selector = line;
			} else if (property === true) {
				properties.push(whiteSpace + line.trimLeft());	
			} else if (indentExists === true && property === false) {
				children.push(line);
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
	
	// formatBlocks takes the lineObjects array (of objects) and produces
	// a formmatted array of objects used to generate CSS blocks
	// each array represents a CSS block

	var formatBlocks = function (lineObjects) {
		var blockArray = [],
			variables = {},
			mixins = {};

		function _findDeclarations (index, array) {
			if (typeof lineObjects[index] === 'undefined') {
				return;
			} else if (lineObjects[index].declaration.length) {
				line = lineObjects[index].declaration.toString();

				_replaceVariables(line, array);

				index++;
				_findDeclarations(index, array);
			} 
		};
				
		function _replaceVariables (line, array) {
			for (variable in variables) {
				if (variables.hasOwnProperty(variable)) {
					line = line.replace(variable, variables[variable]);
				}
			}
			array.push(line);
		};

		lineObjects.forEach(function(elem, i) {
			var parent = blockArray.length-1,
				indent = lineObjects[i].indentLevel,
				varName,
				varVal,
				variableSplit,
				line,
				declarations;
				
			if (elem.variable) {
				variableSplit = elem.variable.split('=');
				varName = variableSplit[0].trim();
				varVal = variableSplit[1].replace(';', '').trim();
				variables[varName] = varVal;
			}
			
			if (elem.mixin) {
				
			}
			
			if (elem.selector) {
				declarations = [],
				index = i + 1,
				selector = elem.selector;

				_findDeclarations(index, declarations);

				blockArray.push({ indentLevel: indent, selector: selector, declarations: declarations, children: [] });
			}

			// I need to remove the empty string children before the lineObjects gets to the CSS formatter...
			// until then elem.children != "" is my fallback :/
			
			if (elem.child && elem.children != "") {
				function _findChildren (parent, elem) {
					var declarations = [],
						parents = [],
						selector = elem.children.toString(),
						index = i + 1;
					
					_findDeclarations(index, declarations);
					
					blockArray.push({ indentLevel: indent, selector: selector, declarations: declarations, children: [] });
				};
				_findChildren(blockArray[parent], elem);
			}
		});
		return blockArray;
	};
	
	var findParents = function(blockArray) {
		var newblockArray = [];

		blockArray.map(function(elem, i){
			var inc = i+1,
				dec = i-1,
				find = function(level) {
					i--
				
					if (!blockArray[i]) {
						return;
					} else if (blockArray[i].indentLevel === level) {
						blockArray[i].children.push(elem);
						return;
					} else {
						find(level);
					}
				};
			if (elem.indentLevel === 0) {
				newblockArray.push(elem);
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
		return newblockArray;
	};
	

	var blockToCSS = function blockToCSS(block) {
		var beginBlock = " {" + "\n",
			endBlock = "\n" + "}",
			output = [],
			sel,
			dec,
			block,
			parentCSS;
		
		sel = block.selector + " ";
		dec = block.declarations.join("; \n") + ";";
		parentCSS = sel + beginBlock + dec + endBlock;
		
		if (!block.children.length) {
			return [parentCSS];
		} else {
			var childrenCSS = block.children.map(blockToCSS).reduce(function(acc, children) {
				return acc.concat(children);
			});
			var prefixedChildrenCSS = childrenCSS.map(function(child) {
				return sel + child;
			});
			prefixedChildrenCSS.unshift([parentCSS]);
			
			return prefixedChildrenCSS;
		}
	};
		
	var flattenBlockToCSS = function(blockToCSS) {
		console.log(blockToCSS);
		var validCSS = blockToCSS.reduce(function(acc, children) {
			return acc.concat(children);
		});
		return validCSS.join("\n");
	};
	
	var lineObjects = processLines(data.split('\n'));
	
	var CSS = flattenBlockToCSS(findParents(formatBlocks(lineObjects)).map(blockToCSS));

	fs.writeFile(css, CSS, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
	});
};
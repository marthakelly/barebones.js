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
	
	// formatBlocks takes the lineObjects array (of objects) and produces
	// a formmatted array of objects used to generate CSS blocks
	// each array represents a CSS block

	var formatBlocks = function (lineObjects) {
		var blockArray = [],
			variables = {};

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
			
			if (elem.selector) {
				declarations = [],
				index = i + 1,
				selector = elem.selector;

				function _findDeclarations (index) {
					if (typeof lineObjects[index] === 'undefined') {
						return;
					} else if (lineObjects[index].declaration.length) {
						line = lineObjects[index].declaration.toString();
						
						for (variable in variables) {
							if (variables.hasOwnProperty(variable)) {
								line = line.replace(variable, variables[variable]);
								
								// needs work!
								
								console.log("replacing:", variable, 'with:', variables[variable]);
							}
						}
						
						declarations.push(line);
						
						console.log(line);
						
						index++;
						_findDeclarations(index);
					} 
				}; 

				_findDeclarations(index);

				blockArray.push({ indentLevel: indent, selector: selector, declarations: declarations, children: [] });
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

					blockArray.push({ indentLevel: indent, selector: selector, declarations: declarations, children: [] })

				};

				findChildren(blockArray[parent], elem);

			}

		});

		return blockArray;
	};
	
	var findParents = function(blockArray) {	

		var newblockArray = [];

		blockArray.map(function(elem, i){
			var inc = i+1,
				dec = i-1;
			
			var find = function(level) {
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
	
	// generateCSS takes the array of objects from formatBlocks and writes a string for each CSS block to the new .css file
		
	var generateCSS = function generateCSS (blockArray) {			
		var beginBlock = " {" + "\n",
			endBlock = "\n" + "}",
			output = [],
			block,
			sel,
			dec,
			parents,
			i;
		
		function _generateCSS (blockArray, prefix) {
			for (i=0; i<blockArray.length; i++) {
				sel = prefix + blockArray[i].selector,
				dec = blockArray[i].declarations.join("; \n") + ";",
				block = sel + beginBlock + dec + endBlock;

				output.push(block);
						
				if (blockArray[i].children.length) {
					_generateCSS(blockArray[i].children, sel);
				}
			}
		};
		
		_generateCSS(blockArray, "");
		
		return output;
			
	};
		
	var lineObjects = processLines(data.split('\n'));
		
	var CSS = (generateCSS(findParents(formatBlocks(lineObjects)))).join('\n');

	fs.writeFile(css, CSS, function(err) {
		if (err) throw err;
		console.log('Converted ' + bare + ' to ' + css);
	});

};


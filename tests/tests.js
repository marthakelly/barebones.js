// tests will go here eventually

// you test anything where logic is involved
// tests needed for bareBones:
	// process lines should return an array of objects with these properties
		// variable: variable,
		// selector: selector,
		// declaration: properties,
		// children: children,
		// child: child,
		// indentLevel: indentLevel
	// format blocks should take in an array of objects with these properties
		// indentLevel: 0,
		// selector: 'body',
		// declarations: 
		// [ '    font: 12px Helvetica, Arial, sans-serif',
		//  '    color: green',
		//  '    background: yellow' ],
		// children: []
	// find parents should take in an array of objects and return an object with objects in the children
	// blockToCSS should take in a single Object and return a CSS block as an entry in an array
	// flattenBlockToCSS takes in the array from blockToCSS and flattens it into a single array and 
		// then joins each item in the array with a line break
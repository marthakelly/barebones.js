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
	

/*
ok(value, [message]) - Tests if value is a true value.
equal(actual, expected, [message]) - Tests shallow, coercive equality with the equal comparison operator ( == ).
notEqual(actual, expected, [message]) - Tests shallow, coercive non-equality with the not equal comparison operator ( != ).
deepEqual(actual, expected, [message]) - Tests for deep equality.
notDeepEqual(actual, expected, [message]) - Tests for any deep inequality.
strictEqual(actual, expected, [message]) - Tests strict equality, as determined by the strict equality operator ( === )
notStrictEqual(actual, expected, [message]) - Tests strict non-equality, as determined by the strict not equal operator ( !== )
throws(block, [error], [message]) - Expects block to throw an error.
doesNotThrow(block, [error], [message]) - Expects block not to throw an error.
ifError(value) - Tests if value is not a false value, throws if it is a true value. Useful when testing the first argument, error in callbacks.
*/

// arrange

	// set up objects 

// act

	// act on objects

// assert

	// assert that the result is what you expected
	
exports.processLinesTest = function(test){
    test.expect(1);
    test.ok(true, "this assertion should pass");
    test.done();
};
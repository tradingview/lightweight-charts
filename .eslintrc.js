module.exports = {
	env: {
		browser: false,
		es6: true,
		node: true,
	},
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 2015,
		sourceType: 'module',
	},
	rules: {
		// enforces return statements in callbacks of array's methods
		// http://eslint.org/docs/rules/array-callback-return
		'array-callback-return': 'error',

		// specify curly brace conventions for all control statements
		curly: ['error', 'all'],

		// encourages use of dot notation whenever possible
		'dot-notation': ['error', { allowKeywords: true }],

		// require the use of === and !==
		eqeqeq: ['error', 'smart'],

		// disallow the use of alert, confirm, and prompt
		'no-alert': 'warn',

		// disallow use of arguments.caller or arguments.callee
		'no-caller': 'error',

		// disallow Unnecessary Labels
		// http://eslint.org/docs/rules/no-extra-label
		'no-extra-label': 'error',

		// disallow use of eval()
		'no-eval': 'error',

		// disallow adding to native types
		'no-extend-native': 'error',

		// disallow unnecessary function binding
		'no-extra-bind': 'error',

		// disallow the use of leading or trailing decimal points in numeric literals
		'no-floating-decimal': 'error',

		// disallow use of eval()-like methods
		'no-implied-eval': 'error',

		// disallow usage of __iterator__ property
		'no-iterator': 'error',

		// disallow use of labels for anything other then loops and switches
		'no-labels': ['error', { allowLoop: false, allowSwitch: false }],

		// disallow unnecessary nested blocks
		'no-lone-blocks': 'error',

		// disallow creation of functions within loops
		'no-loop-func': 'error',

		// disallow use of multiple spaces
		'no-multi-spaces': 'error',

		// disallow use of multiline strings
		'no-multi-str': 'error',

		// disallow use of new operator when not part of the assignment or comparison
		'no-new': 'error',

		// disallow use of new operator for Function object
		'no-new-func': 'error',

		// disallows creating new instances of String, Number, and Boolean
		'no-new-wrappers': 'error',

		// disallow use of octal escape sequences in string literals, such as
		// var foo = 'Copyright \251';
		'no-octal-escape': 'error',

		// disallow usage of __proto__ property
		'no-proto': 'error',

		// disallow use of assignment in return statement
		'no-return-assign': 'error',

		// disallow use of `javascript:` urls.
		'no-script-url': 'error',

		// disallow comparisons where both sides are exactly the same
		'no-self-compare': 'error',

		// disallow use of comma operator
		'no-sequences': 'error',

		// restrict what can be thrown as an exception
		'no-throw-literal': 'error',

		// disallow usage of expressions in statement position
		'no-unused-expressions': 'error',

		// requires to declare all vars on top of their containing scope
		// 'vars-on-top': 2,
		// require immediate function invocation to be wrapped in parentheses
		// http://eslint.org/docs/rules/wrap-iife.html
		'wrap-iife': ['error', 'inside'],

		// errors

		// disallow assignment in conditional expressions
		'no-cond-assign': ['error', 'always'],

		// disallow use of console
		'no-console': 'error',

		// disallow unnecessary parentheses
		'no-extra-parens': ['error', 'functions'],

		// Avoid code that looks like two expressions but is actually one
		'no-unexpected-multiline': 'off',

		// es6

		// enforces no braces where they can be omitted
		// http://eslint.org/docs/rules/arrow-body-style
		'arrow-body-style': ['error', 'as-needed'],

		// require space before/after arrow function's arrow
		// https://github.com/eslint/eslint/blob/master/docs/rules/arrow-spacing.md
		'arrow-spacing': ['error', { before: true, after: true }],

		// require trailing commas in multiline object literals
		'comma-dangle': ['error', 'always-multiline'],

		// require let or const instead of var
		'no-var': 'error',

		// disallow unnecessary constructor
		// http://eslint.org/docs/rules/no-useless-constructor
		'no-useless-constructor': 'error',

		// require method and property shorthand syntax for object literals
		// https://github.com/eslint/eslint/blob/master/docs/rules/object-shorthand.md
		'object-shorthand': 'off',

		// suggest using arrow functions as callbacks
		'prefer-arrow-callback': 'error',

		// suggest using of const declaration for variables that are never modified after declared
		'prefer-const': 'error',

		// enforce usage of spacing in template strings
		// http://eslint.org/docs/rules/template-curly-spacing
		'template-curly-spacing': 'error',

		// enforce spacing around the * in yield* expressions
		// http://eslint.org/docs/rules/yield-star-spacing
		'yield-star-spacing': ['error', 'after'],

		// strict

		strict: 'off',

		// vars

		// disallow use of undeclared variables unless mentioned in a /*global */ block
		'no-undef': 'error',

		// disallow declaration of variables that are not used in the code
		'no-unused-vars': ['error', { vars: 'local', args: 'none' }],

		// style

		// enforce spacing inside array brackets
		'array-bracket-spacing': ['error', 'never'],

		// enforce one true brace style
		'brace-style': ['error', '1tbs', { allowSingleLine: true }],

		// require camel case names
		// 'camelcase': [2, { 'properties': 'never' }],
		// enforce spacing before and after comma
		'comma-spacing': ['error', { before: false, after: true }],

		// enforce one true comma style
		'comma-style': ['error', 'last'],

		// disallow padding inside computed properties
		'computed-property-spacing': ['error', 'never'],

		// enforce newline at the end of file, with no multiple empty lines
		'eol-last': 'error',

		// this option sets a specific tab width for your code
		// https://github.com/eslint/eslint/blob/master/docs/rules/indent.md
		indent: ['error', 'tab', { SwitchCase: 1, VariableDeclarator: 1 }],

		// specify whether double or single quotes should be used in JSX attributes
		// http://eslint.org/docs/rules/jsx-quotes
		'jsx-quotes': ['error', 'prefer-double'],

		// enforces spacing between keys and values in object literal properties
		'key-spacing': ['error', { beforeColon: false, afterColon: true }],

		// require a space before & after certain keywords
		'keyword-spacing': ['error', {
			before: true,
			after: true,
			overrides: {
				return: { after: true },
				throw: { after: true },
				case: { after: true },
			},
		}],

		// require a capital letter for constructors
		'new-cap': ['error', { newIsCap: true, capIsNew: false }],

		// disallow use of the Array constructor
		'no-array-constructor': 'error',

		// disallow mixed spaces and tabs for indentation
		'no-mixed-spaces-and-tabs': 'error',

		// disallow multiple empty lines and only one newline at the end
		'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],

		// disallow nested ternary expressions
		// 'no-nested-ternary': 2,
		// disallow use of the Object constructor
		'no-new-object': 'error',

		// disallow space between function identifier and application
		'no-spaced-func': 'error',

		// disallow trailing whitespace at the end of lines
		'no-trailing-spaces': 'error',

		// disallow the use of Boolean literals in conditional expressions
		// also, prefer `a || b` over `a ? a : b`
		// http://eslint.org/docs/rules/no-unneeded-ternary
		'no-unneeded-ternary': ['error', { defaultAssignment: false }],

		// disallow whitespace before properties
		// http://eslint.org/docs/rules/no-whitespace-before-property
		'no-whitespace-before-property': 'error',

		// require padding inside curly braces
		'object-curly-spacing': ['error', 'always'],

		// allow just one var statement per function
		'one-var': ['error', 'never'],

		// require a newline around variable declaration
		// http://eslint.org/docs/rules/one-var-declaration-per-line
		'one-var-declaration-per-line': ['error', 'always'],

		// enforce padding within blocks
		'padded-blocks': ['error', 'never'],

		// require quotes around object literal property names
		// http://eslint.org/docs/rules/quote-props.html
		'quote-props': ['error', 'as-needed', { keywords: false, unnecessary: true, numbers: false }],

		// specify whether double or single quotes should be used
		quotes: ['error', 'single', 'avoid-escape'],

		// enforce spacing before and after semicolons
		'semi-spacing': ['error', { before: false, after: true }],

		// require or disallow use of semicolons instead of ASI
		semi: ['error', 'always'],

		// require or disallow space before blocks
		'space-before-blocks': 'error',

		// require or disallow space before function opening parenthesis
		// https://github.com/eslint/eslint/blob/master/docs/rules/space-before-function-paren.md
		'space-before-function-paren': ['error', { anonymous: 'never', named: 'never' }],

		// require or disallow spaces inside parentheses
		'space-in-parens': ['error', 'never'],

		// require spaces around operators
		'space-infix-ops': 'error',

		// require or disallow a space immediately following the // or /* in a comment
		'spaced-comment': ['error', 'always', {
			exceptions: ['-', '+'],
			markers: ['=', '!'], // space here to support sprockets directives
		}],
	},
};

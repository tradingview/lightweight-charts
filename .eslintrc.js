function getNamingConventionRules(additionalDefaultFormats = []) {
	return [
		{ selector: 'default', format: ['camelCase', ...additionalDefaultFormats], leadingUnderscore: 'forbid', trailingUnderscore: 'forbid' },
		{ selector: 'variable', format: ['camelCase', 'UPPER_CASE', ...additionalDefaultFormats] },
		{ selector: 'typeLike', format: ['PascalCase'] },
		{ selector: 'enumMember', format: ['PascalCase'] },
		{ selector: 'memberLike', modifiers: ['private'], leadingUnderscore: 'require', format: ['camelCase'] },
		{ selector: 'memberLike', modifiers: ['protected'], leadingUnderscore: 'require', format: ['camelCase'] },
		{
			selector: 'property',
			format: ['PascalCase'],
			filter: {
				match: true,
				regex: '^(Area|Baseline|Bar|Candlestick|Histogram|Line)$',
			},
		},
	];
}

const tsRulesExtendsWithoutTypeCheck = [
	'plugin:@typescript-eslint/eslint-recommended',
	'plugin:@typescript-eslint/recommended',
	'plugin:import/typescript',
];

const tsRulesExtendsWithTypeCheck = [
	...tsRulesExtendsWithoutTypeCheck,
	'plugin:@typescript-eslint/recommended-requiring-type-checking',
];

/** @type {import('eslint').Linter.Config} */
module.exports = {
	reportUnusedDisableDirectives: true,
	env: {
		browser: false,
		es6: true,
		node: true,
	},
	plugins: [
		'@typescript-eslint',
		'@typescript-eslint/tslint',
		'deprecation',
		'eslint-plugin-tsdoc',
		'import',
		'jsdoc',
		'markdown',
		'prefer-arrow',
		'unicorn',
		'jsdoc',
		'eslint-plugin-react',
	],
	settings: {
		jsdoc: {
			ignoreInternal: true,
		},
		react: {
			version: require('./website/package.json').dependencies.react.slice(1),
		},
	},
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	overrides: [
		{
			// rules specific for js files only
			files: [
				'**/*.js',
				'**/*.jsx',

				// that's for md/mdx files
				'**/*.javascript',
			],
			overrides: [
				{
					files: '**/*.jsx',
					env: {
						browser: true,
					},
					rules: {
						'react/prop-types': 'off',
						'import/no-default-export': 'off',
					},
				},
			],
			rules: {
				// enforces no braces where they can be omitted
				// http://eslint.org/docs/rules/arrow-body-style
				'arrow-body-style': ['error', 'as-needed'],

				// enforce one true brace style
				'brace-style': ['error', '1tbs', { allowSingleLine: true }],

				// require camel case names
				camelcase: 'error',

				// encourages use of dot notation whenever possible
				'dot-notation': ['error', { allowKeywords: true }],

				// this option sets a specific tab width for your code
				// https://github.com/eslint/eslint/blob/master/docs/rules/indent.md
				indent: ['error', 'tab', { SwitchCase: 1, VariableDeclarator: 1 }],

				// disallow creation of functions within loops
				'no-loop-func': 'error',

				// disallow variable declarations from shadowing variables declared in the outer scope
				'no-shadow': 'error',

				// disallow use of undeclared variables unless mentioned in a /*global */ block
				'no-undef': 'error',

				// disallow usage of expressions in statement position
				'no-unused-expressions': 'error',

				// disallow declaration of variables that are not used in the code
				'no-unused-vars': ['error', { vars: 'local', args: 'none', ignoreRestSiblings: true }],

				// specify whether double or single quotes should be used
				quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],

				// require or disallow use of semicolons instead of ASI
				semi: ['error', 'always'],
			},
		},
		{
			files: ['**/*.md'],
			processor: 'markdown/markdown',
		},
		{
			files: ['**/*.mdx'],
			processor: 'mdx/remark',
			settings: {
				'mdx/code-blocks': true,
			},
			extends: [
				'plugin:mdx/recommended',
			],
		},
		{
			files: [
				'**/*.md/*.js',
				'**/*.md/*.javascript',

				'**/*.mdx/*.js',
				'**/*.mdx/*.javascript',
			],
			env: {
				browser: true,
				node: false,
			},
			globals: {
				LightweightCharts: false,

				areaSeries: true,
				barSeries: true,
				candlestickSeries: true,
				chart: true,
				container: true,
				histogramSeries: true,
				lineSeries: true,
				series: true,
			},
			rules: {
				'no-console': 'off',
				'no-undef': 'off',
				'no-unused-vars': 'off',
				indent: ['error', 4],
				'unicorn/filename-case': 'off',
				'react/prop-types': 'off',
			},
		},
		{
			files: ['**/*.ts', '**/*.tsx'],
			excludedFiles: ['dist/**'],
			parser: '@typescript-eslint/parser',
			extends: tsRulesExtendsWithTypeCheck,
			parserOptions: {
				project: 'tsconfig.json',
				sourceType: 'module',
			},
			overrides: [
				{
					files: ['website/**/*.ts', 'website/**/*.tsx'],
					parserOptions: {
						project: 'website/tsconfig.json',
						sourceType: 'module',
					},
					rules: {
						'@typescript-eslint/naming-convention': [
							'error',

							// allow PascalCase for react components
							...getNamingConventionRules(['PascalCase']),
						],
					},
				},
				{
					files: ['website/src/**/*.tsx'],
					rules: {
						'import/no-default-export': 'off',
					},
				},

				// note this rule MUST be the last in this overrides list
				// because it should be applied last and override parserOptions correctly
				// otherwise typescript-eslint will raise an error that it cannot
				{
					// well, for code blocks from md/mdx we shouldn't (and cannot) do type check
					// so let's just disable such rules from their linting
					files: [
						'**/*.md/*.ts',
						'**/*.md/*.tsx',
						'**/*.md/*.typescript',

						'**/*.mdx/*.ts',
						'**/*.mdx/*.tsx',
						'**/*.mdx/*.typescript',
					],
					extends: tsRulesExtendsWithoutTypeCheck,
					parserOptions: {
						project: null,
						sourceType: 'module',
					},
					rules: {
						'@typescript-eslint/await-thenable': 'off',
						'@typescript-eslint/dot-notation': 'off',
						'@typescript-eslint/no-floating-promises': 'off',
						'@typescript-eslint/no-implied-eval': 'off',
						'@typescript-eslint/no-misused-promises': 'off',
						'@typescript-eslint/no-unnecessary-qualifier': 'off',
						'@typescript-eslint/no-unnecessary-type-assertion': 'off',
						'@typescript-eslint/no-unsafe-call': 'off',
						'@typescript-eslint/no-unsafe-member-access': 'off',
						'@typescript-eslint/no-unsafe-return': 'off',
						'@typescript-eslint/no-unused-vars': 'off',
						'@typescript-eslint/prefer-regexp-exec': 'off',
						'@typescript-eslint/require-await': 'off',
						'@typescript-eslint/tslint/config': 'off',
						'@typescript-eslint/unbound-method': 'off',
						'deprecation/deprecation': 'off',
					},
				},
			],
			rules: {
				'@typescript-eslint/array-type': [
					'error',
					{
						default: 'array',
					},
				],
				'@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
				'@typescript-eslint/consistent-type-assertions': [
					'error',
					{
						assertionStyle: 'as',
						objectLiteralTypeAssertions: 'never',
					},
				],
				'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
				'@typescript-eslint/dot-notation': 'error',
				'@typescript-eslint/explicit-member-accessibility': [
					'error',
					{
						accessibility: 'explicit',
						overrides: {
							accessors: 'explicit',
							constructors: 'explicit',
						},
					},
				],
				'@typescript-eslint/member-delimiter-style': 'error',
				'@typescript-eslint/member-ordering': [
					'error',
					{
						default: [
							'signature',
							'public-static-field',
							'protected-static-field',
							'private-static-field',
							'public-instance-field',
							'protected-instance-field',
							'private-instance-field',
							'constructor',
							'public-instance-method',
							'public-static-method',
							'protected-instance-method',
							'protected-static-method',
							'private-instance-method',
							'private-static-method',
						],
					},
				],
				'@typescript-eslint/naming-convention': [
					'error',
					...getNamingConventionRules(),
				],
				'@typescript-eslint/no-empty-interface': 'off',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/no-explicit-any': 'error',
				'@typescript-eslint/no-extraneous-class': 'error',
				'@typescript-eslint/no-inferrable-types': [
					'error',
					{
						ignoreParameters: true,
						ignoreProperties: true,
					},
				],
				'@typescript-eslint/no-invalid-void-type': 'error',
				'@typescript-eslint/no-loop-func': 'error',
				'@typescript-eslint/no-namespace': 'off',
				'@typescript-eslint/no-non-null-assertion': 'error',
				'@typescript-eslint/no-parameter-properties': 'error',
				'@typescript-eslint/no-require-imports': 'off',
				'@typescript-eslint/no-shadow': 'error',
				'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
				'@typescript-eslint/no-unnecessary-qualifier': 'error',
				'@typescript-eslint/no-unnecessary-type-arguments': 'off',
				'@typescript-eslint/no-unsafe-assignment': 'off',
				'@typescript-eslint/no-unused-expressions': 'error',
				'@typescript-eslint/no-unused-vars': 'off',
				'@typescript-eslint/no-use-before-define': 'off',
				'@typescript-eslint/prefer-for-of': 'off',
				'@typescript-eslint/prefer-function-type': 'error',
				'@typescript-eslint/prefer-readonly': 'off', // TODO
				'@typescript-eslint/promise-function-async': 'off',
				'@typescript-eslint/restrict-template-expressions': 'off',
				'@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
				'@typescript-eslint/restrict-plus-operands': 'off',
				'@typescript-eslint/semi': [
					'error',
					'always',
				],
				'@typescript-eslint/strict-boolean-expressions': 'off',
				'@typescript-eslint/triple-slash-reference': [
					'off',
					{
						path: 'never',
						types: 'prefer-import',
						lib: 'never',
					},
				],
				'@typescript-eslint/type-annotation-spacing': 'error',

				'deprecation/deprecation': 'error',

				'tsdoc/syntax': ['error'],
				'jsdoc/check-examples': [
					'error',
					{
						exampleCodeRegex: '/```js\\s+(.*)\\s+```/su',
					},
				],

				// can't use at the moment - see https://github.com/typescript-eslint/typescript-eslint/issues/1824
				// '@typescript-eslint/indent': [
				// 	'error',
				// 	'tab',
				// 	{
				// 		SwitchCase: 1,
				// 		VariableDeclarator: 1,
				// 	},
				// ],

				// see https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/ROADMAP.md
				'@typescript-eslint/tslint/config': [
					'error',
					{
						rulesDirectory: [
							'node_modules/tslint-eslint-rules/dist/rules',
							'node_modules/tslint-microsoft-contrib',
						],
						rules: {
							// tslint-microsoft-contrib
							'no-typeof-undefined': true,
							'no-unnecessary-local-variable': true,
							'no-unnecessary-override': true,

							// tslint-eslint-rules
							'ter-indent': [
								true,
								'tab',
								{
									SwitchCase: 1,
									VariableDeclarator: 1,
								},
							],

							// tslint core
							align: [
								true,
								'parameters',
								'arguments',
								'statements',
							],
							'ordered-imports': [
								true,
								{
									'grouped-imports': true,
									groups: [
										{
											name: 'nodejs-core',
											match: '^(fs|path)$',
											order: 9,
										},
										{
											name: 'libraries',
											match: '^[^\\.]+',
											order: 10,
										},
										{
											name: 'api',
											match: '\\.\\./api/',
											order: 20,
										},
										{
											name: 'formatters',
											match: '\\.\\./formatters/',
											order: 30,
										},
										{
											name: 'gui',
											match: '\\.\\./gui/',
											order: 40,
										},
										{
											name: 'helpers',
											match: '\\.\\./helpers/',
											order: 50,
										},
										{
											name: 'model',
											match: '\\.\\./(renderers|views|model)/',
											order: 60,
										},
										{
											name: 'current directory',
											match: '^\\.',
											order: 70,
										},
									],
								},
							],
							'static-this': true,
							'strict-type-predicates': true,

							// we can't use @typescript-eslint/typedef in couple with @typescript-eslint/explicit-function-return-type
							// because it isn't the same - explicit-function-return-type requires to specify return type of arrow functions
							// which cannot be disabled or configured somehow
							// see https://github.com/typescript-eslint/typescript-eslint/issues/1731
							// and https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/typedef.md
							typedef: [
								true,
								'call-signature',
								'parameter',
								'arrow-parameter',
								'property-declaration',
								'member-variable-declaration',
							],
						},
					},
				],
			},
		},
		{
			files: ['dist/typings.d.ts'],
			parser: '@typescript-eslint/parser',
			env: {
				browser: true,
				node: false,
			},
			rules: {
				'no-unused-vars': 'off',
				'jsdoc/require-jsdoc': [
					'error',
					{
						contexts: [
							'TSEnumDeclaration',
							'TSEnumMember',
							'TSInterfaceDeclaration',
							'TSMethodSignature',
							'TSPropertySignature',
							'TSTypeAliasDeclaration',
						],
					},
				],
				'jsdoc/require-param': 'error',
				// d.ts files are mostly read by computers (to generate docs, provide intellisense, etc.)
				// so consistent quote characaters aren't important.
				'@typescript-eslint/quotes': 'off',
			},
		},
	],
	rules: {
		// enforces return statements in callbacks of array's methods
		// http://eslint.org/docs/rules/array-callback-return
		'array-callback-return': 'error',

		'arrow-parens': ['error', 'as-needed'],

		// enforce a maximum cyclomatic complexity allowed in a program
		complexity: ['error', { max: 13 }],

		// specify curly brace conventions for all control statements
		curly: ['error', 'all'],

		// require the use of === and !==
		eqeqeq: ['error', 'smart'],

		// require `for-in` loops to include an `if` statement
		'guard-for-in': 'error',

		// enforce a maximum number of classes per file
		'max-classes-per-file': ['error', 5],

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

		// disallow unnecessary `return await`
		'no-return-await': 'error',

		// disallow use of `javascript:` urls.
		'no-script-url': 'error',

		// disallow comparisons where both sides are exactly the same
		'no-self-compare': 'error',

		// disallow use of comma operator
		'no-sequences': 'error',

		// restrict what can be thrown as an exception
		'no-throw-literal': 'error',

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

		// disallow template literal placeholder syntax in regular strings
		'no-template-curly-in-string': 'error',

		// Avoid code that looks like two expressions but is actually one
		'no-unexpected-multiline': 'off',

		// es6

		// require space before/after arrow function's arrow
		// https://github.com/eslint/eslint/blob/master/docs/rules/arrow-spacing.md
		'arrow-spacing': ['error', { before: true, after: true }],

		// require trailing commas in multiline object literals
		'comma-dangle': ['error', {
			arrays: 'always-multiline',
			objects: 'always-multiline',
			imports: 'always-multiline',
			exports: 'always-multiline',
			functions: 'never',
		}],

		// disallow duplicate module imports
		'no-duplicate-imports': 'error',

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

		// require rest parameters instead of `arguments`
		'prefer-rest-params': 'error',

		// require template literals instead of string concatenation
		'prefer-template': 'off', // TODO

		// enforce usage of spacing in template strings
		// http://eslint.org/docs/rules/template-curly-spacing
		'template-curly-spacing': 'error',

		// enforce spacing around the * in yield* expressions
		// http://eslint.org/docs/rules/yield-star-spacing
		'yield-star-spacing': ['error', 'after'],

		// strict

		strict: 'off',

		// vars

		// disallow initializing variables to `undefined`
		'no-undef-init': 'error',

		// style

		// enforce spacing inside array brackets
		'array-bracket-spacing': ['error', 'never'],

		// enforce spacing before and after comma
		'comma-spacing': ['error', { before: false, after: true }],

		// enforce one true comma style
		'comma-style': ['error', 'last'],

		// disallow padding inside computed properties
		'computed-property-spacing': ['error', 'never'],

		// enforce newline at the end of file, with no multiple empty lines
		'eol-last': 'error',

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

		// enforce a maximum number of parameters in function definitions
		'max-params': ['error', { max: 6 }],

		// require a capital letter for constructors
		'new-cap': ['error', { newIsCap: true, capIsNew: false }],

		// enforce or disallow parentheses when invoking a constructor with no arguments
		'new-parens': ['error', 'always'],

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

		// disallow specified syntax
		'no-restricted-syntax': ['error', 'ForInStatement', `BinaryExpression[operator='in']`],

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

		// disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead.
		'prefer-object-spread': 'error',

		// require quotes around object literal property names
		// http://eslint.org/docs/rules/quote-props.html
		'quote-props': ['error', 'as-needed', { keywords: false, unnecessary: true, numbers: false }],

		// enforce spacing before and after semicolons
		'semi-spacing': ['error', { before: false, after: true }],

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
			markers: ['=', '!', '/'], // space here to support sprockets directives
		}],

		'jsdoc/check-indentation': 'error',
		'jsdoc/newline-after-description': 'error',

		'import/no-default-export': 'error',

		'prefer-arrow/prefer-arrow-functions': [
			'error',
			{
				singleReturnOnly: true,
				allowStandaloneDeclarations: true,
			},
		],

		'unicorn/empty-brace-spaces': ['error'],
		'unicorn/filename-case': ['error', { case: 'kebabCase' }],
		'unicorn/no-array-push-push': ['error'],
		'unicorn/prefer-date-now': ['error'],
	},
};

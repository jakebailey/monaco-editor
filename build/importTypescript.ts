/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path = require('path');
import fs = require('fs');
import child_process = require('child_process');
import { REPO_ROOT } from './utils';

const generatedNote = `//
// **NOTE**: Do not edit directly! This file is generated using \`npm run import-typescript\`
//
`;

const TYPESCRIPT_LIB_SOURCE = path.join(REPO_ROOT, 'node_modules/typescript/lib');
const TYPESCRIPT_LIB_DESTINATION = path.join(REPO_ROOT, 'src/language/typescript/lib');

(function () {
	try {
		fs.statSync(TYPESCRIPT_LIB_DESTINATION);
	} catch (err) {
		fs.mkdirSync(TYPESCRIPT_LIB_DESTINATION);
	}
	importLibs();

	const npmLsOutput = JSON.parse(
		child_process.execSync('npm ls typescript --depth=0 --json=true', { cwd: REPO_ROOT }).toString()
	);
	const typeScriptDependencyVersion = npmLsOutput.dependencies.typescript.version;

	fs.writeFileSync(
		path.join(TYPESCRIPT_LIB_DESTINATION, 'typescriptServicesMetadata.ts'),
		`${generatedNote}
export const typescriptVersion = "${typeScriptDependencyVersion}";\n`
	);

	let tsServices = fs.readFileSync(path.join(TYPESCRIPT_LIB_SOURCE, 'typescript.js')).toString();

	// The output from this build will only be accessible via ESM; rather than removing
	// references to require/module, define them as dummy variables that bundlers will ignore.
	// The TS code can figure out that it's not running under Node even with these defined.
	tsServices =
		`
/* MONACOCHANGE */
var require = undefined;
var module = { exports: {} };
/* END MONACOCHANGE */
` + tsServices;

	const tsServices_esm =
		generatedNote +
		tsServices +
		`
// MONACOCHANGE
export var createClassifier = ts.createClassifier;
export var createLanguageService = ts.createLanguageService;
export var displayPartsToString = ts.displayPartsToString;
export var EndOfLineState = ts.EndOfLineState;
export var flattenDiagnosticMessageText = ts.flattenDiagnosticMessageText;
export var IndentStyle = ts.IndentStyle;
export var ScriptKind = ts.ScriptKind;
export var ScriptTarget = ts.ScriptTarget;
export var TokenClass = ts.TokenClass;
export var typescript = ts;
// END MONACOCHANGE
`;
	fs.writeFileSync(
		path.join(TYPESCRIPT_LIB_DESTINATION, 'typescriptServices.js'),
		stripSourceMaps(tsServices_esm)
	);

	let dtsServices = fs.readFileSync(path.join(TYPESCRIPT_LIB_SOURCE, 'typescript.d.ts')).toString();

	fs.writeFileSync(
		path.join(TYPESCRIPT_LIB_DESTINATION, 'typescriptServices.d.ts'),
		generatedNote + dtsServices
	);
})();

function importLibs() {
	function readLibFile(name) {
		const srcPath = path.join(TYPESCRIPT_LIB_SOURCE, name);
		return fs.readFileSync(srcPath).toString();
	}

	let strLibResult = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
${generatedNote}

/** Contains all the lib files */
export const libFileMap: Record<string, string> = {}
`;
	let strIndexResult = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
${generatedNote}

/** Contains all the lib files */
export const libFileSet: Record<string, boolean> = {}
`;
	const dtsFiles = fs.readdirSync(TYPESCRIPT_LIB_SOURCE).filter((f) => f.includes('lib.'));
	while (dtsFiles.length > 0) {
		const name = dtsFiles.shift();
		const output = readLibFile(name).replace(/\r\n/g, '\n');
		strLibResult += `libFileMap['${name}'] = ${JSON.stringify(output)};\n`;
		strIndexResult += `libFileSet['${name}'] = true;\n`;
	}

	fs.writeFileSync(path.join(TYPESCRIPT_LIB_DESTINATION, 'lib.ts'), strLibResult);
	fs.writeFileSync(path.join(TYPESCRIPT_LIB_DESTINATION, 'lib.index.ts'), strIndexResult);
}

function stripSourceMaps(str) {
	return str.replace(/\/\/# sourceMappingURL[^\n]+/gm, '');
}

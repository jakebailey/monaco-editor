/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { worker } from './fillers/monaco-editor-core';
import * as htmlService from 'vscode-html-languageservice';
import type { Options } from './monaco.contribution';

export class HTMLWorker {
	private _ctx: worker.IWorkerContext;
	private _languageService: htmlService.LanguageService;
	private _languageSettings: Options;
	private _languageId: string;

	constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
		this._ctx = ctx;
		this._languageSettings = createData.languageSettings;
		this._languageId = createData.languageId;
		this._languageService = htmlService.getLanguageService();
	}

	async doValidation(uri: string): Promise<htmlService.Diagnostic[]> {
		// not yet suported
		return Promise.resolve([]);
	}
	async doComplete(
		uri: string,
		position: htmlService.Position
	): Promise<htmlService.CompletionList> {
		let document = this._getTextDocument(uri);
		let htmlDocument = this._languageService.parseHTMLDocument(document);
		return Promise.resolve(
			this._languageService.doComplete(
				document,
				position,
				htmlDocument,
				this._languageSettings && this._languageSettings.suggest
			)
		);
	}
	async format(
		uri: string,
		range: htmlService.Range,
		options: htmlService.FormattingOptions
	): Promise<htmlService.TextEdit[]> {
		let document = this._getTextDocument(uri);
		let formattingOptions = { ...this._languageSettings.format, ...options };
		let textEdits = this._languageService.format(document, range, formattingOptions);
		return Promise.resolve(textEdits);
	}
	async doHover(uri: string, position: htmlService.Position): Promise<htmlService.Hover> {
		let document = this._getTextDocument(uri);
		let htmlDocument = this._languageService.parseHTMLDocument(document);
		let hover = this._languageService.doHover(document, position, htmlDocument);
		return Promise.resolve(hover);
	}
	async findDocumentHighlights(
		uri: string,
		position: htmlService.Position
	): Promise<htmlService.DocumentHighlight[]> {
		let document = this._getTextDocument(uri);
		let htmlDocument = this._languageService.parseHTMLDocument(document);
		let highlights = this._languageService.findDocumentHighlights(document, position, htmlDocument);
		return Promise.resolve(highlights);
	}
	async findDocumentLinks(uri: string): Promise<htmlService.DocumentLink[]> {
		let document = this._getTextDocument(uri);
		let links = this._languageService.findDocumentLinks(document, null);
		return Promise.resolve(links);
	}
	async findDocumentSymbols(uri: string): Promise<htmlService.SymbolInformation[]> {
		let document = this._getTextDocument(uri);
		let htmlDocument = this._languageService.parseHTMLDocument(document);
		let symbols = this._languageService.findDocumentSymbols(document, htmlDocument);
		return Promise.resolve(symbols);
	}
	async getFoldingRanges(
		uri: string,
		context?: { rangeLimit?: number }
	): Promise<htmlService.FoldingRange[]> {
		let document = this._getTextDocument(uri);
		let ranges = this._languageService.getFoldingRanges(document, context);
		return Promise.resolve(ranges);
	}
	async getSelectionRanges(
		uri: string,
		positions: htmlService.Position[]
	): Promise<htmlService.SelectionRange[]> {
		let document = this._getTextDocument(uri);
		let ranges = this._languageService.getSelectionRanges(document, positions);
		return Promise.resolve(ranges);
	}
	async doRename(
		uri: string,
		position: htmlService.Position,
		newName: string
	): Promise<htmlService.WorkspaceEdit> {
		let document = this._getTextDocument(uri);
		let htmlDocument = this._languageService.parseHTMLDocument(document);
		let renames = this._languageService.doRename(document, position, newName, htmlDocument);
		return Promise.resolve(renames);
	}
	private _getTextDocument(uri: string): htmlService.TextDocument {
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (model.uri.toString() === uri) {
				return htmlService.TextDocument.create(
					uri,
					this._languageId,
					model.version,
					model.getValue()
				);
			}
		}
		return null;
	}
}

export interface ICreateData {
	languageId: string;
	languageSettings: Options;
}

export function create(ctx: worker.IWorkerContext, createData: ICreateData): HTMLWorker {
	return new HTMLWorker(ctx, createData);
}

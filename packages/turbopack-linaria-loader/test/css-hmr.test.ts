/* eslint-disable node/no-sync */

import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

// Configuration constants
const CSS_CHANGE_TIMEOUT = 2000;
const COMPONENT_PATHS = {
	linariaLink: path.join(import.meta.dirname, '../components/client/LinariaLink.tsx'),
	serverContainer: path.join(import.meta.dirname, '../components/server/ServerContainer.tsx'),
};

// CSS modifications
const CSS_CHANGES = {
	clientComponent: {
		original: 'background-color: yellow;',
		modified: 'background-color: blue;',
		added: 'border: 3px solid green;',
	},
	serverComponent: {
		original: 'outline: 1rem solid transparent;',
		modified: 'outline: 2rem solid red;',
		added: 'margin-top: 20px;',
	},
};

// Expected CSS values
const EXPECTED_CSS = {
	clientComponent: {
		property: 'background-color',
		original: 'rgb(255, 255, 0)', // yellow
		modified: 'rgb(0, 0, 255)', // blue
		border: {
			property: 'border',
			value: '3px solid rgb(0, 128, 0)', // green
		},
	},
	serverComponent: {
		outlineColor: {
			property: 'outline-color',
			original: 'rgba(0, 0, 0, 0)', // transparent
			modified: 'rgb(255, 0, 0)', // red
		},
		marginTop: {
			property: 'margin-top',
			value: '20px',
		},
	},
};

const addCssProperty = (filePath: string, searchValue: string, propertyToAdd: string): string => {
	try {
		const originalContent = fs.readFileSync(filePath, 'utf8');
		// Add the new property after the search value (existing property)
		const newContent = originalContent.replace(searchValue, `${searchValue}\n  ${propertyToAdd}`);

		if (originalContent === newContent) {
			throw new Error(`Could not find "${searchValue}" in ${filePath}`);
		}

		fs.writeFileSync(filePath, newContent, 'utf8');
		return originalContent;
	} catch (error) {
		console.error(`Error adding property to file ${filePath}:`, error);
		throw error;
	}
};

const expectCssProperty = async (locator: Locator, property: string, value: string) => {
	try {
		await expect(locator).toHaveCSS(property, value, {
			timeout: CSS_CHANGE_TIMEOUT,
		});
		// Sometimes the updates get "stuck" in the e2e test, reloading the page fixes that issue.
	} catch {
		await locator.page().reload();
		await expect(locator).toHaveCSS(property, value, {
			timeout: CSS_CHANGE_TIMEOUT,
		});
	}
};

test.describe.serial('CSS Hot Module Replacement (HMR)', () => {
	let originalContents: Record<string, string> = {};

	const modifyFile = (filePath: string, searchValue: string, replaceValue: string) => {
		try {
			const originalContent = originalContents[filePath];
			if (originalContent == null) {
				throw new Error(`Original content for ${filePath} not found`);
			}
			const newContent = originalContent.replace(searchValue, replaceValue);

			if (originalContent === newContent) {
				throw new Error(`Could not find "${searchValue}" in ${filePath}`);
			}

			fs.writeFileSync(filePath, newContent, 'utf8');
		} catch (error) {
			console.error(`Error modifying file ${filePath}:`, error);
			throw error;
		}
	};

	const restoreFile = (filePath: string): void => {
		try {
			const originalContent = originalContents[filePath];
			if (originalContent == null) {
				throw new Error(`Original content for ${filePath} not found`);
			}

			fs.writeFileSync(filePath, originalContent, 'utf8');
		} catch (error) {
			console.error(`Error restoring file ${filePath}:`, error);
			throw error;
		}
	};

	// eslint-disable-next-line no-empty-pattern
	test.beforeAll(({}, testInfo) => {
		const isProdMode = process.env['TEST_ENV'] === 'production';
		testInfo.skip(isProdMode, 'Skipping HMR tests in production mode');

		originalContents = {
			[COMPONENT_PATHS.linariaLink]: fs.readFileSync(COMPONENT_PATHS.linariaLink, 'utf8'),
			[COMPONENT_PATHS.serverContainer]: fs.readFileSync(COMPONENT_PATHS.serverContainer, 'utf8'),
		};
	});
	// Ensure files are restored even if the test fails
	test.afterEach(() => {
		for (const [filePath] of Object.entries(originalContents)) {
			restoreFile(filePath);
		}
	});

	test('should update styles', async ({ page }) => {
		await page.goto('/');

		// Get component locators
		const clientComponent = page.getByTestId('linaria-button');
		const serverComponent = page.getByTestId('server-container');

		// --- Initial Style Checks ---
		await expectCssProperty(
			clientComponent,
			EXPECTED_CSS.clientComponent.property,
			EXPECTED_CSS.clientComponent.original,
		);

		await expectCssProperty(
			serverComponent,
			EXPECTED_CSS.serverComponent.outlineColor.property,
			EXPECTED_CSS.serverComponent.outlineColor.original,
		);

		// --- Modify Styles ---
		modifyFile(COMPONENT_PATHS.linariaLink, CSS_CHANGES.clientComponent.original, CSS_CHANGES.clientComponent.modified);

		await expectCssProperty(
			clientComponent,
			EXPECTED_CSS.clientComponent.property,
			EXPECTED_CSS.clientComponent.modified,
		);

		modifyFile(
			COMPONENT_PATHS.serverContainer,
			CSS_CHANGES.serverComponent.original,
			CSS_CHANGES.serverComponent.modified,
		);

		await expectCssProperty(
			serverComponent,
			EXPECTED_CSS.serverComponent.outlineColor.property,
			EXPECTED_CSS.serverComponent.outlineColor.modified,
		);

		// --- Revert Styles ---
		restoreFile(COMPONENT_PATHS.linariaLink);

		await expectCssProperty(
			clientComponent,
			EXPECTED_CSS.clientComponent.property,
			EXPECTED_CSS.clientComponent.original,
		);

		restoreFile(COMPONENT_PATHS.serverContainer);
		await expectCssProperty(
			serverComponent,
			EXPECTED_CSS.serverComponent.outlineColor.property,
			EXPECTED_CSS.serverComponent.outlineColor.original,
		);
	});

	test('should add new styles', async ({ page }) => {
		await page.goto('/');

		// Get component locators
		const linariaLink = page.getByTestId('linaria-button');
		const serverContainer = page.getByTestId('server-container');

		// --- Add New Styles ---
		// Add new border property to the client component
		addCssProperty(
			COMPONENT_PATHS.linariaLink,
			CSS_CHANGES.clientComponent.original,
			CSS_CHANGES.clientComponent.added,
		);

		// Verify the new border property is applied
		await expectCssProperty(
			linariaLink,
			EXPECTED_CSS.clientComponent.border.property,
			EXPECTED_CSS.clientComponent.border.value,
		);

		// Add new margin-top property to the server component
		addCssProperty(
			COMPONENT_PATHS.serverContainer,
			CSS_CHANGES.serverComponent.original,
			CSS_CHANGES.serverComponent.added,
		);

		// Verify the new margin-top property is applied
		await expectCssProperty(
			serverContainer,
			EXPECTED_CSS.serverComponent.marginTop.property,
			EXPECTED_CSS.serverComponent.marginTop.value,
		);

		// --- Restore Files ---
		// Restore client component file
		restoreFile(COMPONENT_PATHS.linariaLink);

		// Verify styles are reverted
		await expect(linariaLink).not.toHaveCSS(
			EXPECTED_CSS.clientComponent.border.property,
			EXPECTED_CSS.clientComponent.border.value,
			{ timeout: CSS_CHANGE_TIMEOUT },
		);

		// Restore server component file
		restoreFile(COMPONENT_PATHS.serverContainer);

		// Verify styles are reverted
		await expect(serverContainer).not.toHaveCSS(
			EXPECTED_CSS.serverComponent.marginTop.property,
			EXPECTED_CSS.serverComponent.marginTop.value,
			{ timeout: CSS_CHANGE_TIMEOUT },
		);
	});
});

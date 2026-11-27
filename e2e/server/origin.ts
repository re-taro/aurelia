import fs from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';

const ORIGIN_DIRECTORY = path.resolve(import.meta.dirname, '../resources/origin');
const HOST = '127.0.0.1';
const PORT = Number(process.env['E2E_STUB_ORIGIN_PORT'] ?? '4401');

const CONTENT_TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.png': 'image/png',
};

const respond = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
	const { pathname } = new URL(request.url ?? '/', `http://${HOST}`);
	if (pathname === '/') {
		response.writeHead(200, { 'content-type': 'text/plain' }).end('OK');
		return;
	}

	const [run, ...segments] = pathname.split('/').filter((segment) => segment !== '');
	const relative = path.normalize(segments.join('/'));

	if (run == null || relative.startsWith('..')) {
		response.writeHead(400).end();
		return;
	}

	const file = path.resolve(ORIGIN_DIRECTORY, path.extname(relative) === '' ? `${relative}.html` : relative);
	const extension = path.extname(file);
	const content = await fs.readFile(file).catch(() => null);

	if (content == null) {
		response.writeHead(404, { 'content-type': 'text/plain' }).end('Not Found');
		return;
	}

	const body =
		extension === '.html'
			? content.toString().replaceAll('{{origin}}', `http://${HOST}:${String(PORT)}/${run}`)
			: content;

	response.writeHead(200, { 'content-type': CONTENT_TYPES[extension] ?? 'application/octet-stream' }).end(body);
};

const handle = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
	try {
		await respond(request, response);
	} catch (error) {
		console.error(error);
		response.writeHead(500).end();
	}
};

createServer((request, response) => {
	void handle(request, response);
}).listen(PORT, HOST);

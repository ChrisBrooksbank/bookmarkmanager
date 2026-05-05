import { json, type RequestHandler } from '@sveltejs/kit';
import type { LinkHealthResult, LinkHealthStatus } from '$lib/utils/bookmarkAudit';

async function checkUrl(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
	return fetch(url, {
		method,
		redirect: 'follow',
		headers: {
			'User-Agent': 'BookmarkVault-LinkChecker/1.0'
		},
		signal: AbortSignal.timeout(10000)
	});
}

function statusFromResponse(response: Response): LinkHealthStatus {
	if (response.redirected) return 'redirected';
	if (response.ok) return 'ok';
	return 'broken';
}

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');
	const bookmarkId = url.searchParams.get('bookmarkId') ?? '';
	const checkedAt = Date.now();

	if (!targetUrl) {
		return json(
			{
				bookmarkId,
				status: 'broken',
				message: 'URL parameter is required',
				checkedAt
			} satisfies LinkHealthResult,
			{ status: 400 }
		);
	}

	try {
		const parsed = new URL(targetUrl);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return json(
				{
					bookmarkId,
					status: 'broken',
					message: 'Only HTTP and HTTPS links can be checked',
					checkedAt
				} satisfies LinkHealthResult,
				{ status: 400 }
			);
		}

		let response = await checkUrl(targetUrl, 'HEAD');
		if (response.status === 405 || response.status === 403) {
			response = await checkUrl(targetUrl, 'GET');
		}

		return json({
			bookmarkId,
			status: statusFromResponse(response),
			statusCode: response.status,
			finalUrl: response.url,
			message: response.statusText || undefined,
			checkedAt
		} satisfies LinkHealthResult);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError') {
			return json({
				bookmarkId,
				status: 'timeout',
				message: 'Timed out',
				checkedAt
			} satisfies LinkHealthResult);
		}

		return json({
			bookmarkId,
			status: 'unknown',
			message: error instanceof Error ? error.message : 'Could not check link',
			checkedAt
		} satisfies LinkHealthResult);
	}
};

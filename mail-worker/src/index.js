import app from './hono/webs';
import { email } from './email/email';

import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";



// =====================================
// ForwardEmail Webhook 调试
// =====================================
async function forwardEmailReceive(req, env, ctx) {

	console.log('========== ForwardEmail ==========');

	console.log('Method:', req.method);

	console.log('Content-Type:', req.headers.get('content-type'));

	console.log('---------- HEADERS ----------');

	for (const [key, value] of req.headers.entries()) {

		console.log(`${key}: ${value}`);

	}

	console.log('-------- END HEADERS --------');


	// 读取原始文本
	const clone1 = req.clone();

	const text = await clone1.text();

	console.log('TEXT LENGTH:', text.length);

	console.log('---------- TEXT ----------');

	console.log(text);

	console.log('-------- END TEXT --------');


	// 尝试 JSON
	try {

		const clone2 = req.clone();

		const json = await clone2.json();

		console.log('---------- JSON ----------');

		console.log(
			JSON.stringify(
				json,
				null,
				2
			)
		);

		console.log('-------- END JSON --------');

	}
	catch (e) {

		console.log(
			'JSON ERROR:',
			e.message
		);

	}


	// 尝试 FormData
	try {

		const form = await req.formData();

		console.log('---------- FORM ----------');

		for (const [key, value] of form.entries()) {

			if (typeof value === 'string') {

				console.log(
					`${key}: ${value}`
				);

			}
			else {

				console.log(`${key}: FILE`);

				console.log(
					'name:',
					value.name
				);

				console.log(
					'type:',
					value.type
				);

				console.log(
					'size:',
					value.size
				);

			}

		}

		console.log('-------- END FORM --------');

	}
	catch (e) {

		console.log(
			'FORM ERROR:',
			e.message
		);

	}


	return new Response(
		'ok',
		{
			status: 200
		}
	);

}




export default {

	async fetch(req, env, ctx) {

		const url = new URL(req.url);


		// =====================================
		// ForwardEmail Webhook
		// =====================================
		if (
			url.pathname === '/inbound/forwardemail'
		) {

			return await forwardEmailReceive(
				req,
				env,
				ctx
			);

		}

		// =====================================
		// API
		// =====================================
		if (
			url.pathname.startsWith('/api/')
		) {

			url.pathname =
				url.pathname.replace(
					'/api',
					''
				);

			req =
				new Request(
					url.toString(),
					req
				);

			return app.fetch(
				req,
				env,
				ctx
			);

		}



		// =====================================
		// 静态资源
		// =====================================
		if (
			[
				'/static/',
				'/attachments/'
			]
			.some(
				p =>
					url.pathname.startsWith(p)
			)
		) {

			return await kvObjService.toObjResp(
				{
					env
				},
				url.pathname.substring(1)
			);

		}



		return env.assets.fetch(req);

	},



	// 保留 Cloudflare Email Routing
	email: email,



	async scheduled(c, env, ctx) {

		await verifyRecordService.clearRecord(
			{
				env
			}
		);

		await userService.resetDaySendCount(
			{
				env
			}
		);

		await emailService.completeReceiveAll(
			{
				env
			}
		);

		await oauthService.clearNoBindOathUser(
			{
				env
			}
		);

	}

};	

import app from './hono/webs';
import { email } from './email/email';

import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";



// =====================================
// ForwardEmail Webhook
// =====================================
async function forwardEmailReceive(req, env, ctx) {


	console.log(
		'========== ForwardEmail =========='
	);



	const contentType =
		req.headers.get('content-type') || '';



	console.log(
		'Content-Type:',
		contentType
	);



	let data = null;



	// ForwardEmail JSON
	if (
		contentType.includes('application/json')
	) {


		data =
			await req.json();


	}
	else {


		const text =
			await req.text();


		console.log(
			'RAW:',
			text
		);



		try {

			data =
				JSON.parse(text);


		}
		catch(e) {


			console.log(
				'不是 JSON'
			);


			return new Response(
				'ok',
				{
					status:200
				}
			);


		}

	}



	console.log(
		'---------- DATA ----------'
	);



	console.log(
		JSON.stringify(
			data,
			null,
			2
		)
	);



	console.log(
		'-------- END DATA --------'
	);



	return new Response(
		'ok',
		{
			status:200
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

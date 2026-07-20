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


	console.log('========== ForwardEmail ==========');



	const data = await req.json();



	console.log(
		'Subject:',
		data.subject
	);



	console.log(
		'From:',
		data.from?.value?.[0]?.address
	);



	console.log(
		'To:',
		data.to?.value?.[0]?.address
	);



	const to =
		data.to?.value?.[0]?.address
		||
		data.recipients?.[0];



	if(!to){

		console.log(
			'No recipient'
		);


		return new Response(
			'No recipient',
			{
				status:400
			}
		);

	}




	/*
	
	模拟 Cloudflare EmailMessage
	
	*/


	const message = {


		to: to,



		raw:
			new Response(
				data.raw
			).body,



		setReject(reason){

			console.log(
				'Reject:',
				reason
			);

		},




		async forward(email){


			console.log(
				'Forward:',
				email
			);


		}



	};





	/*
	
	调用原项目邮箱处理逻辑
	
	*/


	await email(
		message,
		env,
		ctx
	);



	return new Response(
		'ok',
		{
			status:200
		}
	);


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

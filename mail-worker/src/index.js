import app from './hono/webs';
import { email } from './email/email';

import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";



export default {


	async fetch(req, env, ctx) {


		const url = new URL(req.url);



		// ==========================
		// Forward Email Webhook 测试入口
		// ==========================
		if (url.pathname === '/inbound/forwardemail') {


			console.log('========== Forward Email ==========');


			console.log(
				'Method:',
				req.method
			);



			for (const [key, value] of req.headers.entries()) {

				console.log(
					key + ':',
					value
				);

			}



			const body = await req.text();



			console.log(
				'---------- BODY ----------'
			);


			console.log(body);



			console.log(
				'-------- END BODY --------'
			);



			return new Response(
				'ok'
			);


		}





		// ==========================
		// API
		// ==========================
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




		// ==========================
		// 静态文件
		// ==========================
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

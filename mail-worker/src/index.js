import app from './hono/webs';
import PostalMime from 'postal-mime';
import { email } from './email/email';

import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";


// CloudMailin 转 Cloudflare EmailMessage
async function cloudMailinReceive(req, env, ctx) {


	const form = await req.formData();


	const file = form.get('message');


	if (!file) {

		return new Response(
			'No message',
			{
				status:400
			}
		);

	}



	const raw = await file.text();



	// 解析邮件
	const parsed = await PostalMime.parse(raw);



	console.log(
		'CloudMailin Subject:',
		parsed.subject
	);


	console.log(
		'CloudMailin To:',
		parsed.to
	);



	/*
		这里非常关键

		获取真实收件地址

		例如：
		test@vvv.nn.kg
	*/

	const to =
		parsed.to?.[0]?.address;



	if (!to) {

		return new Response(
			'No recipient',
			{
				status:400
			}
		);

	}



	// 模拟 Cloudflare EmailMessage
	const message = {


		to: to,



		raw: new Blob(
			[raw]
		).stream(),



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
		调用原项目邮件处理逻辑

		这里不用修改 email.js
	*/

	await email(
		message,
		env,
		ctx
	);



	return new Response(
		'ok'
	);

}



export default {


	async fetch(req, env, ctx) {


		const url = new URL(req.url);



		// CloudMailin 收件入口
		if (
			url.pathname === '/inbound/cloudmailin'
		) {

			return await cloudMailinReceive(
				req,
				env,
				ctx
			);

		}




		if (
			url.pathname.startsWith('/api/')
		) {

			url.pathname =
				url.pathname.replace('/api','');


			req = new Request(
				url.toString(),
				req
			);


			return app.fetch(
				req,
				env,
				ctx
			);

		}




		if (
			['/static/','/attachments/']
			.some(
				p=>url.pathname.startsWith(p)
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



	// 保留原 CF Email 功能
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

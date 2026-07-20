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


	const messagePart = form.get('message');


	if (!messagePart) {

		return new Response(
			'No message',
			{
				status:400
			}
		);

	}



	let raw = '';



	// CloudMailin 有时返回 string
	if (typeof messagePart === 'string') {

		raw = messagePart;

	}


	// Cloudflare File / Blob
	else if (
		messagePart instanceof Blob
	) {

		raw = await messagePart.text();

	}


	// 兜底
	else {

		raw = String(messagePart);

	}



	console.log(
		'CloudMailin RAW length:',
		raw.length
	);



	// 解析邮件
	const parsed = await PostalMime.parse(raw);



	console.log(
		'Subject:',
		parsed.subject
	);


	console.log(
		'From:',
		parsed.from?.address
	);


	console.log(
		'To:',
		parsed.to
	);



	/*
		获取真实收件地址

		例如:
		test@vvv.nn.kg
	*/


	let to = '';



	if(parsed.to && parsed.to.length){

		to =
			parsed.to[0].address;

	}



	// 某些邮件 To 为空
	if(!to){

		const headerTo =
			parsed.headers
			?.find(
				h=>h.key.toLowerCase()==='to'
			);


		if(headerTo){

			to =
				headerTo.value
				.match(
					/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
				)?.[0];

		}

	}



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
			new Response(raw).body,



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
	
	调用原项目逻辑
	
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


	async fetch(req, env, ctx){


		const url =
			new URL(req.url);



	/*
	
	CloudMailin入口
	
	*/


		if(
			url.pathname ===
			'/inbound/cloudmailin'
		){


			return await cloudMailinReceive(
				req,
				env,
				ctx
			);


		}




		if(
			url.pathname.startsWith('/api/')
		){


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




		if(
			[
				'/static/',
				'/attachments/'
			]
			.some(
				p=>url.pathname.startsWith(p)
			)
		){


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





	async scheduled(c, env, ctx){


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

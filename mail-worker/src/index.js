import app from './hono/webs';
import { email } from './email/email';
import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";
export default {
	 async fetch(req, env, ctx) {

		const url = new URL(req.url)


// CloudMailin 测试入口
if (url.pathname === '/inbound/cloudmailin') {

	const form = await req.formData();

	const raw = form.get('message');

	console.log('CloudMailin received');

	return new Response(
		raw ? raw.substring(0, 1000) : 'NO MESSAGE',
		{
			headers: {
				'content-type': 'text/plain;charset=utf-8'
			}
		}
	);

}
		 
		if (url.pathname.startsWith('/api/')) {
			url.pathname = url.pathname.replace('/api', '')
			req = new Request(url.toString(), req)
			return app.fetch(req, env, ctx);
		}

		 if (['/static/','/attachments/'].some(p => url.pathname.startsWith(p))) {
			 return await kvObjService.toObjResp( { env }, url.pathname.substring(1));
		 }

		return env.assets.fetch(req);
	},
	email: email,
	async scheduled(c, env, ctx) {
		await verifyRecordService.clearRecord({ env })
		await userService.resetDaySendCount({ env })
		await emailService.completeReceiveAll({ env })
		await oauthService.clearNoBindOathUser({ env })
	},
};

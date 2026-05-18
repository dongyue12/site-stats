import { Hono } from 'hono';
import { cors } from 'hono/cors';

import {checkUrl, getUrlData} from './lib/util'
import { insertAndReturnId , insert } from './lib/dbutil';

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get("/", (c) => {
  c.header('Cache-Control', 'public, max-age=3600');
  return c.redirect("/test.html");
});

app.use('/api/*', cors());

app.post('/api/visit', async (c) => {
  const startTime = Date.now();
  const visitorIP = c.req.header('CF-Connecting-IP') || 'unknown';
  const retObj = {ret: "ERROR", data: null, message: "Error, Internal Server Error"};
  try{
    const body = await c.req.json()
    const hostname = body.hostname
    const url_path = body.url
    const referrer = body.referrer
    const pv = body.pv
    const uv = body.uv

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      ip: visitorIP,
      host: hostname,
      path: url_path,
      ref: referrer || '(direct)',
      action: 'visit',
      pv: !!pv,
      uv: !!uv
    }));

    let referrer_path = ''
    let referrer_domain = ''
    if (referrer&&checkUrl(referrer)){
      const referrerData = getUrlData(referrer);
      referrer_domain = referrerData.hostname;
      referrer_path = referrerData.pathname;
    }
    const website  = await c.env.DB.prepare('select id, domain from t_website where domain = ?').bind(hostname).first();
    let websiteId: number;
    if (website){
      websiteId = Number(website.id);
      await insert(c.env.DB,
        'insert into t_web_visitor (website_id, url_path, referrer_domain, referrer_path, visitor_ip) values(?, ?, ?, ?, ?)',
        [websiteId, url_path, referrer_domain, referrer_path, visitorIP]);
    } else{
      websiteId = await insertAndReturnId(c.env.DB, 'insert into t_website (name, domain) values(?,?)',[hostname.split(".").join("_"), hostname]);
      await insert(c.env.DB,
        'insert into t_web_visitor (website_id, url_path, referrer_domain, referrer_path, visitor_ip) values(?, ?, ?, ?, ?)',
        [websiteId, url_path, referrer_domain, referrer_path, visitorIP]);
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        action: 'website_registered',
        domain: hostname,
        website_id: websiteId
      }));
    }

    // 并行查询 PV 和 UV，减少等待时间
    const resData:{pv?: number, uv?: number} = {}
    const queries: Promise<any>[] = [];
    if (pv){
      queries.push(
        c.env.DB.prepare('SELECT COUNT(*) AS total from t_web_visitor where website_id = ? and url_path = ?')
          .bind(websiteId, url_path).first('total')
          .then(total => { resData['pv'] = Number(total); })
      );
    }
    if (uv){
      queries.push(
        c.env.DB.prepare('SELECT COUNT(*) AS total from (select DISTINCT visitor_ip from t_web_visitor where website_id = ? and url_path = ?) t')
          .bind(websiteId, url_path).first('total')
          .then(total => { resData['uv'] = Number(total); })
      );
    }
    if (queries.length > 0) {
      await Promise.all(queries);
    }

    const elapsed = Date.now() - startTime;
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      action: 'visit_done',
      host: hostname,
      path: url_path,
      pv: resData.pv,
      uv: resData.uv,
      elapsed_ms: elapsed
    }));

    c.header('Cache-Control', 'no-store');
    return c.json({ret: "OK", data: resData});
  } catch (e) {
    const elapsed = Date.now() - startTime;
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      action: 'error',
      ip: visitorIP,
      error: String(e),
      elapsed_ms: elapsed
    }));
    return c.json(retObj);
  }
})


app.onError((err, c) => {
	console.error(`${err}`);
	return c.text(err.toString());
});

app.notFound(c => c.text('Not found', 404));
export default app
import { Router, type Request, type Response } from "express";

const trackingScriptRouter = Router();

const TRACKING_JS = `(function(){
var c=window.__gtA||(window.__gtA={});
var el=document.currentScript||document.querySelector('script[data-key]');
var K=el&&el.getAttribute('data-key')||c.apiKey||'';
var U=el&&el.getAttribute('data-endpoint')||c.endpoint||(location.origin+'/api');
var P='_gta_';var ST=30*60*1e3;
function gc(n){var m=document.cookie.match('(^|;)\\s*'+P+n+'=([^;]+)');return m?decodeURIComponent(m[2]):null;}
function sc(n,v,d){var e=new Date();e.setTime(e.getTime()+(d||365)*864e5);document.cookie=P+n+'='+encodeURIComponent(v)+';expires='+e.toUTCString()+';path=/;SameSite=Lax';}
function h(s){var x=0;for(var i=0;i<s.length;i++){x=((x<<5)-x)+s.charCodeAt(i);x|=0;}return Math.abs(x).toString(36);}
function fp(){return'v'+h((navigator.userAgent||'')+(screen.width+'x'+screen.height)+(Intl&&Intl.DateTimeFormat().resolvedOptions().timeZone||'')+(navigator.language||''));}
var vid=gc('vid')||(function(){var v=fp();sc('vid',v,365);return v;})();
var sid=gc('sid');var st=parseInt(gc('st')||'0',10);var ns=false;var now=Date.now();
if(!sid||now-st>ST){sid='s'+now.toString(36)+Math.random().toString(36).slice(2,6);ns=true;}
sc('sid',sid,1);sc('st',String(now),1);
function utm(){var p=new URLSearchParams(location.search);return{utm_source:p.get('utm_source'),utm_medium:p.get('utm_medium'),utm_campaign:p.get('utm_campaign'),utm_content:p.get('utm_content'),utm_term:p.get('utm_term')};}
var queue=[];var flushing=false;
function flush(){
  if(flushing||queue.length===0)return;
  flushing=true;
  var batch=queue.splice(0,queue.length);
  batch.forEach(function(payload){
    var blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
    var sent=false;
    try{if(navigator.sendBeacon){sent=navigator.sendBeacon(U+'/events',blob);}}catch(e){}
    if(!sent){
      try{fetch(U+'/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,priority:'low'}).catch(function(){});}catch(e){}
    }
  });
  flushing=false;
}
var timer=null;
function send(type,name,extra){
  if(!K)return;
  var p=Object.assign({api_key:K,event_type:type,event_name:name,visitor_id:vid,session_id:sid,is_new_session:ns,page_url:location.pathname+location.search,referrer:document.referrer||null,screen_width:screen.width,screen_height:screen.height,timezone:Intl&&Intl.DateTimeFormat().resolvedOptions().timeZone,language:navigator.language},utm(),extra||{});
  ns=false;queue.push(p);
  if(type==='page_exit'){flush();return;}
  clearTimeout(timer);timer=setTimeout(flush,200);
}
var ms=0;
window.addEventListener('scroll',function(){var pct=Math.round((window.scrollY/(document.body.scrollHeight-window.innerHeight||1))*100);if(pct>ms)ms=pct;},{passive:true});
window.addEventListener('click',function(e){var t=e.target;send('click','click',{element_x:e.clientX,element_y:e.clientY,element_tag:t&&t.tagName?t.tagName.toLowerCase():''});},true);
document.addEventListener('submit',function(e){var f=e.target;send('form_submit','form_submit',{form_id:f&&(f.id||f.name)||'form'});},true);
window.addEventListener('beforeunload',function(){send('page_exit','page_exit',{scroll_depth:ms});});
send('pageview','PageView');
window.analytics={track:function(n,p){send('custom',n,p||{});},identify:function(id){vid=id;sc('vid',id,365);},page:function(){send('pageview','PageView');}};
})();`.trim();

trackingScriptRouter.get("/tracking.js", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*",
  });
  res.send(TRACKING_JS);
});

export default trackingScriptRouter;

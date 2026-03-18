import { Router, type Request, type Response } from "express";

const trackingScriptRouter = Router();

const TRACKING_JS = `
(function(){
  var cfg=window.__gtAnalytics||(window.__gtAnalytics={});
  var scriptEl=document.currentScript||document.querySelector('script[data-key]');
  var API_KEY=scriptEl&&scriptEl.getAttribute('data-key')||cfg.apiKey||'';
  var API_URL=scriptEl&&scriptEl.getAttribute('data-endpoint')||cfg.endpoint||window.location.origin+'/api';
  var COOKIE_PREFIX='_gta_';
  var SESSION_TIMEOUT=30*60*1000;

  function getCookie(n){var m=document.cookie.match('(^|;)\\\\s*'+COOKIE_PREFIX+n+'=([^;]+)');return m?decodeURIComponent(m[2]):null;}
  function setCookie(n,v,days){var d=new Date();d.setTime(d.getTime()+(days||365)*864e5);document.cookie=COOKIE_PREFIX+n+'='+encodeURIComponent(v)+';expires='+d.toUTCString()+';path=/;SameSite=Lax';}

  function hash(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h).toString(36);}

  function fingerprint(){
    var ua=navigator.userAgent||'';
    var scr=screen.width+'x'+screen.height;
    var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    var lang=navigator.language||'';
    return 'v'+hash(ua+scr+tz+lang);
  }

  var visitorId=getCookie('vid');
  if(!visitorId){visitorId=fingerprint();setCookie('vid',visitorId,365);}

  var sessionId=getCookie('sid');
  var sessionTime=parseInt(getCookie('st')||'0',10);
  var isNewSession=false;
  var now=Date.now();
  if(!sessionId||now-sessionTime>SESSION_TIMEOUT){
    sessionId='s'+now.toString(36)+Math.random().toString(36).slice(2,6);
    isNewSession=true;
  }
  setCookie('sid',sessionId,1);
  setCookie('st',String(now),1);

  function getUTM(){
    var p=new URLSearchParams(location.search);
    return{utm_source:p.get('utm_source'),utm_medium:p.get('utm_medium'),utm_campaign:p.get('utm_campaign'),utm_content:p.get('utm_content'),utm_term:p.get('utm_term')};
  }

  function send(type,name,extra){
    if(!API_KEY)return;
    var utm=getUTM();
    var payload=Object.assign({
      api_key:API_KEY,event_type:type,event_name:name,
      visitor_id:visitorId,session_id:sessionId,is_new_session:isNewSession,
      page_url:location.pathname+location.search,
      referrer:document.referrer||null,
      screen_width:screen.width,screen_height:screen.height,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
      language:navigator.language,
      timestamp:Date.now()
    },utm,extra||{});
    isNewSession=false;
    try{
      navigator.sendBeacon(API_URL+'/events',new Blob([JSON.stringify(payload)],{type:'application/json'}));
    }catch(e){
      fetch(API_URL+'/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(function(){});
    }
  }

  var maxScroll=0;
  function onScroll(){
    var pct=Math.round((window.scrollY/(document.body.scrollHeight-window.innerHeight||1))*100);
    if(pct>maxScroll)maxScroll=pct;
  }
  window.addEventListener('scroll',onScroll,{passive:true});

  window.addEventListener('click',function(e){
    var el=e.target;
    var tag=el&&el.tagName?el.tagName.toLowerCase():'';
    send('click','click',{element_x:e.clientX,element_y:e.clientY,element_tag:tag});
  },true);

  document.addEventListener('submit',function(e){
    var form=e.target;
    var id=form&&(form.id||form.name||'form');
    send('form_submit','form_submit',{form_id:id});
  },true);

  window.addEventListener('beforeunload',function(){
    send('page_exit','page_exit',{scroll_depth:maxScroll});
  });

  send('pageview','PageView');

  window.analytics={
    track:function(name,props){send('custom',name,props||{});},
    identify:function(id){visitorId=id;setCookie('vid',id,365);},
    page:function(){send('pageview','PageView');}
  };
})();
`.trim();

trackingScriptRouter.get("/tracking.js", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*",
  });
  res.send(TRACKING_JS);
});

export default trackingScriptRouter;

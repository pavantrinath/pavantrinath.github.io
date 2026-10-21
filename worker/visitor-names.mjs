const visitorJSON = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function saveVisitorName(request, env) {
  if(request.method !== 'POST') return visitorJSON({error:'Use POST.'},405);
  if(request.headers.get('Origin') !== new URL(request.url).origin) return visitorJSON({error:'Use this website.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return visitorJSON({error:'Expected JSON.'},415);
  if(!env.VISITOR_NAMES || !env.CHAT_RATE_LIMIT) return visitorJSON({error:'Name saving is unavailable.'},503);
  const reader=request.body?.getReader();
  if(!reader) return visitorJSON({error:'Add a name.'},400);
  let bytes=0, text='';
  const decoder=new TextDecoder();
  try {
    while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1024){await reader.cancel();return visitorJSON({error:'Name too long.'},413);}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();
    let data;
    try { data=JSON.parse(text); } catch { return visitorJSON({error:'Invalid JSON.'},400); }
    const name=typeof data?.name==='string'?data.name.trim().replace(/\s+/g,' '):'';
    if(data?.consent!==true || !name || name.length>80 || !/^[\p{L}\p{M} .’'\-]+$/u.test(name) || !/\p{L}/u.test(name)) return visitorJSON({error:'Enter your name (up to 80 characters) and choose Save name.'},400);
    const limit=await env.CHAT_RATE_LIMIT.limit({key:'visitor-name:'+(request.headers.get('CF-Connecting-IP')||'unknown')});
    if(!limit.success)return visitorJSON({error:'Please try again in a minute.'},429);
    const sharedAt=new Date().toISOString();
    const id='visitor:'+sharedAt+':'+crypto.randomUUID();
    await env.VISITOR_NAMES.put(id,JSON.stringify({name,sharedAt}),{metadata:{name,sharedAt}});
    return visitorJSON({saved:true},201);
  } catch { return visitorJSON({error:'Could not save your name. Please try again.'},503); }
}

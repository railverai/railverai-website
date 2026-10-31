export const runtime='nodejs';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Please submit from this website.'},{status:403});
 if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Unsupported request format.'},{status:415});
 try{const raw=await request.text();if(raw.length>10000)return Response.json({error:'Request is too large.'},{status:413});const data=JSON.parse(raw);
 if(typeof data!=='object'||!data)return Response.json({error:'Please check the form.'},{status:400});
 if(data.website)return Response.json({error:'Unable to accept this request.'},{status:400});
 const limits:Record<string,number>={name:100,email:254,company:160,country:100,interest:100,message:2000};const clean:Record<string,string>={};
 for(const [key,max] of Object.entries(limits)){if(typeof data[key]!=='string'||data[key].length>max|| (key!=='message'&&!(key==='company'&&['Privacy request','Security enquiry'].includes(data.interest))&&!data[key].trim()))return Response.json({error:'Please complete all required fields within the allowed length.'},{status:400});clean[key]=data[key].trim()}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)||data.consent!=='on')return Response.json({error:'Enter a valid email and acknowledge the Privacy Policy.'},{status:400});
 clean.email=clean.email.toLowerCase();
 const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key||!key.startsWith('sb_secret_'))throw new Error('Database configuration unavailable');
 const endpoint=new URL('/rest/v1/rpc/submit_enquiry',url);
 if(endpoint.protocol!=='https:')throw new Error('HTTPS database endpoint required');
 const result=await fetch(endpoint,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({payload:clean}),cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!result.ok){const failure=await result.json().catch(()=>({}));if(failure.code==='P0001'&&failure.message==='rate_limited')return Response.json({error:'A request from this email was just received. Please wait one minute before submitting again.'},{status:429});throw new Error('Storage request failed')}
 const id=await result.json();if(typeof id!=='string')throw new Error('Invalid storage response');
 return Response.json({id},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Enquiry save failed',e instanceof SyntaxError?'invalid_json':'storage_error');return Response.json({error:'Your request could not be saved. Please try again.'},{status:e instanceof SyntaxError?400:503})}
}

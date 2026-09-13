// Read-only production index coverage check. No document or index writes.
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldPath}=require('firebase-admin/firestore');
delete process.env.FIRESTORE_EMULATOR_HOST;
const db=getFirestore(initializeApp({projectId:'birdman-7e745'}),'birdman-db');
const jobs=[];let passed=0;let failed=0;
function add(label,q){jobs.push(async()=>{try{await q.limit(1).get();passed++;console.log('OK '+label)}catch(e){failed++;console.log((e.code===9?'MISSING ':'ERROR '+e.code+' ')+label)}})}
for(const status of [false,true])for(const visited of [false,true])for(const date of ['none','equal','range'])for(const sort of ['none','createdAsc','createdDesc','dateAsc','dateDesc']){
 if(date==='range'&&sort.startsWith('created'))continue;
 let q=db.collection('bookings');
 if(status)q=q.where('status','==','confirmed');
 if(visited)q=q.where('visited','==',false);
 if(date!=='none')q=q.where('bookingDate',date==='equal'?'==':'>=','2026-09-12');
 if(sort.startsWith('created'))q=q.orderBy('createdAt',sort.endsWith('Asc')?'asc':'desc');
 if(sort.startsWith('date')){const d=sort.endsWith('Asc')?'asc':'desc';q=q.orderBy('bookingDate',d).orderBy('bookingTime',d)}
 add(`bookings status=${status} visited=${visited} date=${date} sort=${sort}`,q);
}
for(const field of ['name','phone','email','isVip','totalVisits','firstVisitDate','lastVisitDate','createdAt','updatedAt'])for(const dir of ['asc','desc'])add(`visitors vip + ${field} ${dir}`,db.collection('visitors').where('isVip','==',true).orderBy(field,dir));
for(const [a,b] of [['visitorId','bookingDate'],['visitor_id','booking_date']])add(`visitor history ${a} ${b}`,db.collection('visitor_checkins').where(a,'==','index-audit').orderBy(b,'desc'));
add('gallery listing',db.collection('gallery').orderBy('uploadedAt','desc').orderBy(FieldPath.documentId(),'desc'));
add('feedback listing',db.collection('feedback').where('status','==','approved').orderBy('createdAt','desc').orderBy(FieldPath.documentId(),'desc'));
(async()=>{for(let i=0;i<jobs.length;i+=8)await Promise.all(jobs.slice(i,i+8).map(f=>f()));console.log(JSON.stringify({passed,failed}));process.exitCode=failed?1:0;await db.terminate()})();

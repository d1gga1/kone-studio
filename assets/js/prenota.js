(function(){
"use strict";
var C=window.KM_PRENOTA||{};
var SL=C.slug||{}, GG=[1,2,3,4,5,6];
var P_CORSO=C.prezzoCorso||29, BON=null;
/* stesso database dell'app di Kone (vedi cloud-config.js): la chiave "publishable" è pubblica */
var CLOUD=window.KM_CLOUD||{url:"https://fvukqtgaqcpevtystgeo.supabase.co",key:"sb_publishable_Zr5phbGD1dEw_Lu6CgmAUw_iIPah2KP"};
var CORSO_COL={func:"#D9A93C",hiit:"#E0645C",tono:"#4FA86A",mob:"#3FA7A0",boot:"#E0973A"};   /* uguali all'app */
var AVVISO='<div class="avviso" role="note"><span class="av-i" aria-hidden="true">!</span><p><b>Attenzione:</b> le sedute degli <b>abbonamenti mensili</b> e dei <b>corsi di gruppo</b> non sono recuperabili: se salti una lezione, la perdi. Le sedute dei <b>pacchetti</b> invece si possono recuperare.</p></div>';
var WA=C.whatsapp||"393922696468";
var ATTIVO=!!(C.calUser&&C.calUser.trim());
var GN=["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
var MN=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
var TRATT=["Decontratturante","Massaggio sportivo","Rilassante e antistress","Cervico lombare","Linfodrenante","Riflessologia plantare","Coppettazione"];

/* servizi nelle ore libere: posti = posti occupati nell'ora */
var LIBERI=[
 {id:"pt-singola",nome:"Personal training one to one",det:"60 minuti con Kone",prezzo:45,posti:1},
 {id:"pt-coppia",nome:"Personal training in coppia",det:"60 minuti · prezzo per la coppia",prezzo:65,posti:2},
 {id:"mass-30",nome:"Massaggio 30 minuti",det:"Trattamento a scelta",prezzo:30,posti:1,tratt:1},
 {id:"mass-50",nome:"Trattamento 50 minuti",det:"Trattamento a scelta",prezzo:55,posti:1,tratt:1}];
var INCLUSI=[
 {id:"inc-pt",nome:"Seduta del mio pacchetto / abbonamento",det:"Personal training · già pagata",prezzo:0,posti:1},
 {id:"inc-coppia",nome:"Seduta in coppia del mio pacchetto",det:"Già pagata",prezzo:0,posti:2},
 {id:"inc-mass",nome:"Massaggio del mio pacchetto",det:"Già pagato",prezzo:0,posti:1,tratt:1}];
var PACK={
 "Personal training":[
  {id:"pt-4",nome:"Pacchetto 4 sedute",det:"43 € a seduta",prezzo:172},{id:"pt-8",nome:"Pacchetto 8 sedute",det:"42 € a seduta",prezzo:336},
  {id:"pt-12",nome:"Pacchetto 12 sedute",det:"40 € a seduta",prezzo:480},{id:"coppia-4",nome:"4 sedute in coppia",det:"Prezzo per la coppia",prezzo:260},
  {id:"abb-start",nome:"Start · mensile",det:"4 sedute al mese",prezzo:165},{id:"abb-active",nome:"Active · mensile",det:"8 sedute al mese",prezzo:320},
  {id:"abb-pro",nome:"Pro · mensile",det:"12 sedute al mese",prezzo:450},{id:"abb-elite",nome:"Elite · mensile",det:"16 sedute al mese",prezzo:520}],
 "Massaggi":[
  {id:"mass-4",nome:"4 trattamenti 50′",det:"52,50 € l'uno",prezzo:210},{id:"mass-8",nome:"8 trattamenti 50′",det:"50 € l'uno",prezzo:400},
  {id:"mass-12",nome:"12 trattamenti 50′",det:"47,50 € l'uno",prezzo:570},{id:"abb-relax",nome:"Relax · mensile",det:"2 trattamenti al mese",prezzo:105},
  {id:"abb-wellness",nome:"Wellness · mensile",det:"4 trattamenti al mese",prezzo:200},{id:"abb-recovery",nome:"Recovery · mensile",det:"8 trattamenti al mese",prezzo:380}],
 "Allenamento + massaggi":[
  {id:"combo-bronzo",nome:"Combo Bronzo",det:"4 PT + 4 trattamenti 50′",prezzo:370},{id:"combo-argento",nome:"Combo Argento",det:"8 PT + 8 trattamenti 50′",prezzo:740},
  {id:"combo-oro",nome:"Combo Oro",det:"12 PT + 12 trattamenti 50′",prezzo:1040},{id:"essential",nome:"Essential · mensile",det:"4 PT + 2 massaggi",prezzo:310},
  {id:"complete",nome:"Complete · mensile",det:"8 PT + 4 massaggi",prezzo:490},{id:"premium",nome:"Premium · mensile",det:"12 PT + 4 massaggi",prezzo:650},
  {id:"total-body",nome:"Total Body · mensile",det:"12 PT + 8 massaggi",prezzo:820}]};

Object.keys(PACK).forEach(function(k){PACK[k].forEach(function(x){if(/mensile/i.test(x.nome))x.mese=1})});
var $=function(s){return document.querySelector(s)};
var eur=function(n){return n.toLocaleString("it-IT")+" €"};
var p2=function(n){return(n<10?"0":"")+n};
var iso=function(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())};
function lunedi(off){var d=new Date();d.setHours(0,0,0,0);var g=(d.getDay()+6)%7;d.setDate(d.getDate()-g+7*off);return d}
function dayOf(mon,g){var d=new Date(mon);d.setDate(d.getDate()+g-1);return d}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

var wk=0, MAXWK=0, dayM=null;
var AG={};          /* AG[lunedì iso] = slot di quella settimana, presi dal database */
var CORSI={};       /* id corso → {n, col, durata} (documento "corsi" dell'app) */
var ERR=false, agg=null;

/* =====================================================================
   ORARI = AGENDA DEL TITOLARE
   La griglia non ha più un planning scritto a mano: legge gli stessi slot
   che Kone vede e modifica nella sua agenda (tabella kmstudio.slot) e i posti
   occupati dalla funzione kmstudio.disponibilita. Quando Kone sposta, aggiunge,
   chiude un orario o arriva una prenotazione, la pagina si aggiorna da sola
   (tempo reale sulla tabella kmstudio.stato + controllo ogni 20 secondi).
   ===================================================================== */
function rest(path,body){
  var h={apikey:CLOUD.key,"Accept-Profile":"kmstudio"};
  if(body){h["Content-Profile"]="kmstudio";h["Content-Type"]="application/json"}
  return fetch(CLOUD.url+"/rest/v1/"+path,{method:body?"POST":"GET",headers:h,body:body?JSON.stringify(body):undefined,cache:"no-store"})
    .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()});
}
function caricaCorsi(){
  return rest("documenti?chiave=eq.corsi&select=dati").then(function(a){
    var l=(a&&a[0]&&a[0].dati)||[];CORSI={};
    (Array.isArray(l)?l:[]).forEach(function(c){if(c&&c.id)CORSI[c.id]={n:c.n||"Corso",col:c.col||CORSO_COL[c.id]||"#D9A93C",durata:c.durata||60}});
  }).catch(function(){});
}
function caricaFine(){   /* ultima settimana con orari pubblicati */
  return rest("slot?select=giorno&order=giorno.desc&limit=1").then(function(a){
    MAXWK=0;if(!a||!a[0])return;var last=new Date(String(a[0].giorno).slice(0,10)+"T12:00:00"),m=lunedi(0);
    MAXWK=Math.max(0,Math.min(8,Math.floor((last-m)/(7*864e5))));
  }).catch(function(){});
}
function carica(mon){
  var a=iso(mon),e=new Date(mon);e.setDate(e.getDate()+6);var b=iso(e);
  return Promise.all([
    rest("slot?giorno=gte."+a+"&giorno=lte."+b+"&select=id,giorno,ora,tipo,corso,cap,durata,chiuso,dati&order=ora"),
    rest("rpc/disponibilita",{da:a,a:b})
  ]).then(function(r){
    var occ={};(r[1]||[]).forEach(function(x){occ[x.slot_id]=x.occupati|0});
    AG[a]=(r[0]||[]).map(function(x){var d=x.dati||{};return {id:x.id,d:String(x.giorno).slice(0,10),h:String(x.ora).slice(0,5),tipo:x.tipo,corso:x.corso,
      cap:x.cap|0,dur:x.durata||60,chiuso:!!x.chiuso,nome:d.nome||"",occ:occ[x.id]||0}});
    ERR=false;agg=new Date();
  }).catch(function(e){ERR=true;console.warn("[prenota] orari non caricati",e)});
}
function minuti(h){var p=String(h).split(":");return (+p[0])*60+(+p[1]||0)}
function hm(m){return p2(Math.floor(m/60)%24)+":"+p2(m%60)}
function passato(s){var n=new Date(),t=iso(n);return s.d<t||(s.d===t&&s.h<=p2(n.getHours())+":"+p2(n.getMinutes()))}   /* come l'app */
function liberi(s){return Math.max(0,s.cap-s.occ)}
function nomeSlot(s){if(s.nome)return s.nome;if(s.tipo==="corso")return (CORSI[s.corso]||{}).n||"Corso di gruppo";return s.tipo==="pt"?"One to one con Kone":"Massaggio / trattamento"}
function colSlot(s){return s.tipo==="corso"?((CORSI[s.corso]||{}).col||CORSO_COL[s.corso]||"#D9A93C"):null}
function trova(id){var r=null;Object.keys(AG).forEach(function(k){(AG[k]||[]).forEach(function(s){if(s.id===id)r=s})});return r}

/* ---------- griglia ---------- */
function chiaro(hex){if(!/^#[0-9a-f]{6}$/i.test(hex))return false;var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return(r*299+g*587+b*114)/1000>165}
function cella(s){
  var fin=passato(s), f=liberi(s), nome=nomeSlot(s), data='data-id="'+esc(s.id)+'"';
  var aria=esc(nome)+', '+GN[new Date(s.d+"T12:00:00").getDay()]+' ore '+s.h;
  if(s.tipo==="corso"){
    var c=colSlot(s), lab=fin?"Terminato":s.chiuso?"Chiuso":f<=0?"Completo":f+(f===1?" posto":" posti"), no=fin||s.chiuso||f<=0;
    return '<button class="cell c-corso'+(chiaro(c)?' dark':'')+(no?' done':'')+'" style="background:'+c+'" '+data+(no?' disabled':'')+' aria-label="'+aria+', '+lab+'"><b>'+esc(nome)+'</b><span>'+s.h+' · '+lab+'</span></button>';
  }
  var corto=s.tipo==="pt"?"One to one":"Massaggio";
  if(fin) return '<button class="cell c-past" disabled tabindex="-1" aria-hidden="true"><b>'+corto+'</b><span>'+s.h+'</span></button>';
  var k=s.chiuso||f<=0?"c-full":f<s.cap&&s.cap>1?"c-one":"c-free";
  var t=s.chiuso?"Chiuso":f<=0?"Occupato":s.cap>1&&f<s.cap?(f===1?"1 posto":f+" posti"):"Libero";
  return '<button class="cell '+k+(s.tipo==="tratt"?' c-tratt':'')+'" '+data+(k==="c-full"?' disabled':'')+' aria-label="'+aria+', '+t+'"><b>'+corto+' · '+t+'</b><span>'+s.h+'–'+hm(minuti(s.h)+s.dur)+'</span></button>';
}
function render(){
  var mon=lunedi(wk), now=new Date(), sun=dayOf(mon,7), L=AG[iso(mon)], html="";
  $("#wk-lab").textContent=wk===0?"Questa settimana":wk===1?"Prossima settimana":(mon.getDate()+" "+MN[mon.getMonth()].slice(0,3)+" – "+sun.getDate()+" "+MN[sun.getMonth()].slice(0,3));
  $("#wk-prev").disabled=wk<=0; $("#wk-next").disabled=wk>=MAXWK;
  if(!L){
    $("#days-m").innerHTML="";$("#pgrid").style.setProperty("--nd",1);
    $("#pgrid").innerHTML='<div class="pmsg">'+(ERR?'Non riesco a caricare gli orari aggiornati. <button class="btn line sm" id="riprova">Riprova</button> oppure <a href="https://wa.me/'+WA+'?text='+encodeURIComponent("Ciao Kone! Vorrei prenotare.")+'" target="_blank" rel="noopener">scrivi a Kone su WhatsApp</a>.':'Carico gli orari dall\'agenda di Kone…')+'</div>';
    return;
  }
  GG=[1,2,3,4,5,6];if(L.some(function(s){return new Date(s.d+"T12:00:00").getDay()===0}))GG.push(7);
  var td=(now.getDay()+6)%7+1;
  if(dayM===null||GG.indexOf(dayM)<0) dayM=(wk===0&&GG.indexOf(td)>=0)?td:GG[0];
  $("#days-m").innerHTML=GG.map(function(g){var dd=dayOf(mon,g);var n=L.filter(function(s){return s.d===iso(dd)}).length;
    return '<button role="tab" aria-selected="'+(g===dayM)+'" data-g="'+g+'">'+GN[dd.getDay()].slice(0,3)+'<small>'+dd.getDate()+' '+MN[dd.getMonth()].slice(0,3)+(n?'':' · —')+'</small></button>'}).join("");
  $("#pgrid").style.setProperty("--nd",GG.length);
  if(!L.length){
    $("#pgrid").style.setProperty("--nd",1);
    $("#pgrid").innerHTML='<div class="pmsg">Gli orari di questa settimana non sono ancora pubblicati. <a href="https://wa.me/'+WA+'?text='+encodeURIComponent("Ciao Kone! Vorrei prenotare.")+'" target="_blank" rel="noopener">Scrivi a Kone su WhatsApp</a>.</div>';
    return;
  }
  var ore=[];L.forEach(function(s){if(ore.indexOf(s.h)<0)ore.push(s.h)});ore.sort();
  html+='<div class="ph">Orario</div>';
  GG.forEach(function(g){var dd=dayOf(mon,g);var t=iso(dd)===iso(now);html+='<div class="ph'+(t?' today':'')+'">'+GN[dd.getDay()]+'<small>'+dd.getDate()+' '+MN[dd.getMonth()].slice(0,3)+'</small></div>'});
  ore.forEach(function(h){
    var vuotaM=!L.some(function(s){return s.h===h&&s.d===iso(dayOf(mon,dayM))});
    html+='<div class="pt'+(vuotaM?' e':'')+'">'+h+'</div>';
    GG.forEach(function(g){
      var d=iso(dayOf(mon,g)), qui=L.filter(function(s){return s.d===d&&s.h===h});
      qui.sort(function(a,b){return a.tipo===b.tipo?0:a.tipo==="corso"?-1:1});
      html+='<div class="pc'+(g!==dayM?' hid':'')+(qui.length>1?' multi':'')+(g===dayM&&vuotaM?' e':'')+'">'+(qui.length?qui.map(cella).join(""):'<span class="c-none" aria-hidden="true"></span>')+'</div>';
    });
  });
  $("#pgrid").innerHTML=html;
}
var giro=0;
function aggiorna(forza){
  var mon=lunedi(wk),k=iso(mon),n=++giro;
  if(forza)delete AG[k];
  render();
  return carica(mon).then(function(){
    if(n!==giro&&!forza)return;
    var l=$("#live");l.hidden=false;
    l.textContent=ERR?"Orari non aggiornati: controlla la connessione.":"Orari in tempo reale dall'agenda di Kone · aggiornati alle "+p2(agg.getHours())+":"+p2(agg.getMinutes());
    render();
    if(ctx&&ctx.slot&&!sheet.hidden){var s=trova(ctx.slot.id);if(s)ctx.slot=s}
  });
}

/* ---------- tempo reale ---------- */
var marca={}, tmr=null;
function cambiato(chiave){
  clearTimeout(tmr);
  tmr=setTimeout(function(){
    var p=[];
    if(chiave===null||chiave==="documenti:corsi")p.push(caricaCorsi());
    if(chiave===null||chiave==="slot")p.push(caricaFine());
    Promise.all(p).then(function(){AG={};aggiorna(true)});
  },300);
}
function controlla(){   /* riserva al tempo reale: pochi byte ogni 20 secondi */
  if(document.hidden)return;
  rest("stato?select=chiave,agg&chiave=in.(slot,prenotazioni,documenti:corsi)").then(function(a){
    var nuovo=false,tutto=null;
    (a||[]).forEach(function(r){if(marca[r.chiave]&&marca[r.chiave]!==r.agg){nuovo=true;tutto=(tutto===null||tutto===r.chiave)?r.chiave:"*"}marca[r.chiave]=r.agg});
    if(nuovo)cambiato(tutto==="*"?null:tutto);
  }).catch(function(){});
}
function tempoReale(){
  setInterval(controlla,20000);controlla();
  document.addEventListener("visibilitychange",function(){if(!document.hidden){controlla();if(ERR)aggiorna(true)}});
  var sc=document.createElement("script");sc.src="/assets/js/supabase.js?v=2.119.0";sc.async=true;
  sc.onload=function(){try{
    var sb=window.supabase.createClient(CLOUD.url,CLOUD.key,{db:{schema:"kmstudio"},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"km-prenota"}});
    sb.channel("km-prenota").on("postgres_changes",{event:"*",schema:"kmstudio",table:"stato"},function(m){
      var k=m&&m.new&&m.new.chiave;if(k==="slot"||k==="prenotazioni"||k==="documenti:corsi"){if(m.new.agg)marca[k]=m.new.agg;cambiato(k)}
    }).subscribe();
  }catch(e){console.warn("[prenota] tempo reale",e)}};
  document.head.appendChild(sc);
}

/* ---------- pannello ---------- */
var sheet=$("#sheet"), body=$("#sh-body"), lastFocus=null, ctx={};
function apri(when,title){lastFocus=document.activeElement;$("#sh-when").textContent=when||"";$("#sh-t").textContent=title;sheet.hidden=false;document.body.classList.add("noscroll");setTimeout(function(){$(".sh-x").focus()},30)}
function chiudi(){sheet.hidden=true;document.body.classList.remove("noscroll");body.innerHTML="";if(lastFocus)lastFocus.focus()}
sheet.addEventListener("click",function(e){if(e.target.hasAttribute("data-close"))chiudi()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!sheet.hidden)chiudi()});
function quando(dIso,h,dur){var d=new Date(dIso+"T12:00:00");return GN[d.getDay()]+" "+d.getDate()+" "+MN[d.getMonth()]+" · "+h+"–"+hm(minuti(h)+(dur||60))}
function optBtn(s,dis){return '<button class="opt" data-s="'+s.id+'"'+(dis?' disabled':'')+'><div><b>'+esc(s.nome)+'</b><span>'+esc(s.det)+(dis?' · servono 2 posti liberi':'')+'</span></div><em>'+(s.prezzo?eur(s.prezzo):"Incluso")+'</em></button>'}

function apriSlot(sl){
  if(sl.tipo==="corso")return apriCorso(sl);
  var f=liberi(sl), tr=sl.tipo==="tratt";
  ctx={slot:sl,data:sl.d,ora:sl.h,tipo:"libero"};
  apri(quando(sl.d,sl.h,sl.dur),tr?"Massaggio · scegli il trattamento":"One to one con Kone");
  var lib=LIBERI.filter(function(s){return tr?s.tratt:!s.tratt}), inc=INCLUSI.filter(function(s){return tr?s.tratt:!s.tratt});
  body.innerHTML='<div class="opts">'+lib.map(function(s){return optBtn(s,s.posti>f)}).join("")+'</div><p class="sep">Hai già un pacchetto o un abbonamento?</p><div class="opts">'+inc.map(function(s){return optBtn(s,s.posti>f)}).join("")+'</div>';
  ctx.lista=lib.concat(inc);
}
function apriCorso(sl){
  var nome=nomeSlot(sl);
  ctx={slot:sl,data:sl.d,ora:sl.h,tipo:"corso",corso:{corso:nome,slug:SL["corso"]||"corso-di-gruppo"}};
  apri(quando(sl.d,sl.h,sl.dur),nome);
  var f=liberi(sl);
  var s1={id:"__corso",nome:"Ingresso singolo",det:"Corso di gruppo · "+(f===1?"1 posto libero":f+" posti liberi"),prezzo:P_CORSO};
  var s2={id:"__corso-inc",nome:"Ho già un carnet / abbonamento corsi",det:"Già pagato",prezzo:0};
  ctx.lista=[s1,s2];
  body.innerHTML='<div class="opts">'+optBtn(s1)+optBtn(s2)+'</div>'+AVVISO;
}
function apriPack(id){
  var s=null;Object.keys(PACK).forEach(function(k){PACK[k].forEach(function(x){if(x.id===id)s=x})});
  ctx={tipo:"pacchetto"}; apri("Pacchetto · prima seduta",s.nome); vai(s);
}
body.addEventListener("click",function(e){
  var b=e.target.closest(".opt"); if(b){var s=ctx.lista.filter(function(x){return x.id===b.dataset.s})[0]; if(s) vai(s); return;}
  if(e.target.closest(".back")){ if(ctx.slot) apriSlot(trova(ctx.slot.id)||ctx.slot); else chiudi(); }
});

function slugFor(s){
  if(s.id==="__corso") return ctx.corso.slug;
  if(s.id==="__corso-inc") return SL["inc-corso"]||"corso-incluso";
  return SL[s.id]||s.id;
}
function vai(s){
  var nome=s.id.indexOf("__corso")===0?ctx.corso.corso+" · "+s.nome:s.nome;
  var h='<button class="back">‹ Indietro</button><div class="sum"><div><b>'+esc(nome)+'</b>'+(ctx.slot?'<br><span style="color:var(--txt-2);font-size:14px">'+quando(ctx.slot.d,ctx.slot.h,ctx.slot.dur)+'</span>':'')+'</div><em>'+(s.prezzo?eur(s.prezzo):"Incluso")+'</em></div>';
  if(s.tratt) h+='<label style="font-size:14px;color:var(--txt-2)">Trattamento<select class="sel" id="tratt">'+TRATT.map(function(t){return'<option>'+t+'</option>'}).join("")+'</select></label><div style="height:14px"></div>';
  if(s.mese)h+='<p class="mnote">Si rinnova da solo ogni mese con addebito automatico · lo disdici quando vuoi.</p>';
  if(s.mese||ctx.tipo==="corso")h+=AVVISO;
  body.innerHTML=h+'<div id="step2"></div>';
  $("#sh-t").textContent=ctx.slot?"Conferma la prenotazione":!ATTIVO?"Conferma e paga":"Scegli la prima seduta e paga";
  var go=function(){ctx.slot?viaApp(s,nome):ATTIVO?cal(s,nome):fallback(s,nome)};
  go(); var t=$("#tratt"); if(t) t.addEventListener("change",go);
}

/* ---------- Cal.com ---------- */
var calPronto=false, nCal=0;
function initCal(){
  if(calPronto) return; calPronto=true;
  (function(C,A,L){var p=function(a,ar){a.q.push(ar)};var d=C.document;C.Cal=C.Cal||function(){var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true}if(ar[0]===L){var api=function(){p(api,arguments)};var ns=ar[1];api.q=api.q||[];if(typeof ns==="string"){cal.ns[ns]=cal.ns[ns]||api;p(cal.ns[ns],ar);p(cal,["initNamespace",ns])}else p(cal,ar);return}p(cal,ar)}})(window,"https://app.cal.com/embed/embed.js","init");
  Cal("init","km",{origin:C.calOrigin||"https://cal.com"});
  Cal.ns.km("ui",{theme:"dark",hideEventTypeDetails:false,layout:"month_view",cssVarsPerTheme:{dark:{"cal-brand":"#D9A93C"}}});
  Cal.ns.km("on",{action:"bookingSuccessful",callback:function(){fatto()}});
  Cal.ns.km("on",{action:"bookingSuccessfulV2",callback:function(){fatto()}});
}
function cal(s,nome){
  initCal();
  var id="cal-"+(++nCal), t=$("#tratt");
  $("#step2").innerHTML='<div class="calbox" id="'+id+'"><p class="wait">Caricamento del calendario…</p></div>';
  var cfg={layout:"month_view",theme:"dark"};
  if(ctx.data){cfg.date=ctx.data;cfg.month=ctx.data.slice(0,7)}
  var note=[];if(t)note.push("Trattamento: "+t.value);if(ctx.data)note.push("Scelto dal planning: "+quando(ctx.data,ctx.ora));
  if(note.length)cfg.notes=note.join(" · ");
  Cal.ns.km("inline",{elementOrSelector:"#"+id,calLink:C.calUser.trim()+"/"+slugFor(s),config:cfg});
}
function fatto(){
  $("#sh-t").textContent="Prenotazione confermata";
  body.innerHTML='<div class="ok-box"><div class="tick">✓</div><p style="color:var(--txt-2)">Ti abbiamo mandato la conferma via email con l\'indirizzo dello studio e il promemoria.<br>A presto da Kone!</p><div class="cta-row" style="justify-content:center"><button class="btn gold" data-close>Chiudi</button></div></div>';
  setTimeout(aggiorna,1500);
}

/* ---------- prenotazione di un orario dell'agenda: passa dall'app ----------
   Così il posto viene bloccato subito nell'agenda di Kone (funzione kmstudio.prenota,
   niente posti doppi) e tutti — sito, app dei clienti, agenda del titolare — vedono lo stesso. */
function viaApp(s,nome){
  var sl=ctx.slot,t=$("#tratt"),q="prenota="+encodeURIComponent(sl.id)+(t?"&tratt="+encodeURIComponent(t.value):"")+(s.id==="mass-30"?"&dur=30":"");
  fallback(s,nome);   /* PayPal / bonifico / WhatsApp restano come seconda strada */
  var box=$("#step2"), resto=box.innerHTML.replace(/class="btn gold"/g,'class="btn line"');
  box.innerHTML='<div class="fb"><p><b>Prenota dalla tua area clienti:</b> il posto viene bloccato subito nell\'agenda di Kone e lo vedi tra le tue prenotazioni. Se è la prima volta, crei l\'account in un minuto.</p>'+
   '<div class="cta-row"><a class="btn gold" href="/app#'+q+'">Accedi e prenota</a><a class="btn line" href="/app#registrati&'+q+'">Crea l\'account</a></div></div>'+
   '<p class="sep" style="margin-top:18px">Oppure paga e manda la richiesta a Kone</p>'+resto;
}

/* ---------- finché Cal.com non è collegato ---------- */
function fallback(s,nome){
  var t=$("#tratt");
  var msg="Ciao Kone! Vorrei prenotare: "+nome+(t?" ("+t.value+")":"")+(ctx.slot?" — "+quando(ctx.slot.d,ctx.slot.h,ctx.slot.dur):"")+(s.prezzo?" — "+eur(s.prezzo)+". Ho pagato con PayPal / pago in studio.":".");
  var wa="https://wa.me/"+WA+"?text="+encodeURIComponent(msg);
  var lk=s.link&&/^https:\/\//.test(s.link)?s.link:"";
  $("#step2").innerHTML='<div class="fb">'+(lk?'<p><b>Abbonamento con rinnovo automatico:</b> paghi il primo mese e autorizzi l\'addebito mensile (IBAN del tuo conto o carta). Lo disdici quando vuoi.</p><div class="cta-row" style="margin-bottom:16px"><a class="btn gold" href="'+esc(lk)+'" target="_blank" rel="noopener">Attiva l\'addebito automatico</a></div><p>Oppure blocca il posto così:</p>':'<p>Il pagamento automatico con carta si sta attivando. Intanto puoi bloccare il posto così:</p>')+'<div class="cta-row">'+
   (s.prezzo&&C.paypal?'<a class="btn '+(lk?'line':'gold')+'" href="'+C.paypal+'" target="_blank" rel="noopener">Paga '+eur(s.prezzo)+' con PayPal</a>':'')+
   '<a class="btn line" href="'+wa+'" target="_blank" rel="noopener">Invia la prenotazione</a></div>'+bonHTML(s,nome)+pivaHTML()+'<p style="font-size:14px;margin-top:14px">Il messaggio con giorno, ora e servizio è già scritto: devi solo premere invio.</p></div>';
}

function pivaHTML(){var k=window.KM_STUDIO||{};return k.piva?'<p style="font-size:13px;margin-top:12px;opacity:.75">Pagamento a '+esc(k.ragione||"Kone Moctar Studio")+' · P.IVA '+esc(k.piva)+'</p>':""}
function ibanFmt(x){return String(x||"").replace(/\s+/g,"").toUpperCase().replace(/(.{4})/g,"$1 ").trim()}
function bonHTML(s,nome){if(!BON||!BON.iban||!s.prezzo)return "";
  return '<div class="bon"><p class="bon-t">Oppure con <b>bonifico istantaneo</b></p><p class="bon-ist"><b>Solo bonifico istantaneo:</b> sceglilo nella tua app della banca, arriva in pochi secondi. Un bonifico ordinario impiega 1–2 giorni e il posto non è garantito.</p><dl><dt>Importo</dt><dd>'+eur(s.prezzo)+'</dd><dt>Intestato a</dt><dd>'+esc(BON.intest||"Kone Moctar")+'</dd><dt>IBAN</dt><dd class="iban"><span>'+esc(ibanFmt(BON.iban))+'</span><button type="button" class="cp" data-cp="'+esc(String(BON.iban).replace(/\s+/g,""))+'">Copia</button></dd>'+(BON.banca?'<dt>Banca</dt><dd>'+esc(BON.banca)+'</dd>':'')+'<dt>Causale</dt><dd>'+esc(nome)+'</dd></dl></div>'}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".cp");if(!b)return;var t=b.getAttribute("data-cp");
  var ok=function(){b.textContent="Copiato ✓";setTimeout(function(){b.textContent="Copia"},1800)};
  try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok);return}}catch(x){}
  try{var a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();ok()}catch(x){}});

/* ---------- eventi ---------- */
$("#pgrid").addEventListener("click",function(e){
  if(e.target.closest("#riprova")){aggiorna(true);return}
  var b=e.target.closest(".cell"); if(!b||b.disabled) return;
  var sl=trova(b.dataset.id); if(sl) apriSlot(sl);
});
$("#days-m").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;dayM=+b.dataset.g;render()});
$("#wk-prev").addEventListener("click",function(){if(wk>0){wk--;dayM=null;aggiorna()}});
$("#wk-next").addEventListener("click",function(){if(wk<MAXWK){wk++;dayM=null;aggiorna()}});

/* pacchetti */
var cats=Object.keys(PACK), cat=cats[0];
function rPack(){
  $("#ptabs").innerHTML=cats.map(function(c){return'<button role="tab" aria-selected="'+(c===cat)+'" data-c="'+c+'">'+c+'</button>'}).join("");
  $("#pcards").innerHTML=PACK[cat].map(function(s){return'<button class="pcard" data-p="'+s.id+'"><b>'+esc(s.nome)+'</b><span>'+esc(s.det)+'</span><em>'+eur(s.prezzo)+'</em><i>Acquista e prenota →</i></button>'}).join("");
}
$("#ptabs").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;cat=b.dataset.c;rPack()});
$("#pcards").addEventListener("click",function(e){var b=e.target.closest(".pcard");if(b)apriPack(b.dataset.p)});

/* ---------- prezzi pubblicati dal titolare (assets/data/listino.json, vedi prezzi-live.js) ----------
   Quando Kone cambia il listino nell'app, servizi, pacchetti e prezzi di questa pagina si aggiornano da soli. */
var SEED_ID={pt:["pt-singola","pt-4","pt-8","pt-12","pt-coppia","coppia-4"],abbPt:["abb-start","abb-active","abb-pro","abb-elite"],
  massPack:["mass-4","mass-8","mass-12"],abbMass:["abb-relax","abb-wellness","abb-recovery"],combo:["combo-bronzo","combo-argento","combo-oro"],
  percorsi:["essential","complete","premium","total-body"]};
var SEED_NOMI={pt:["Seduta singola one to one","Pacchetto 4 sedute","Pacchetto 8 sedute","Pacchetto 12 sedute","Coppia · 1 seduta","Coppia · 4 sedute"],
  abbPt:["Start","Active","Pro","Elite"],massPack:["4 trattamenti 50′","8 trattamenti 50′","12 trattamenti 50′"],abbMass:["Relax","Wellness","Recovery"],
  combo:["Combo Bronzo","Combo Argento","Combo Oro"],percorsi:["Essential","Complete","Premium","Total Body"]};
function slugNome(t){return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function idVoce(sez,r,i){var n=SEED_NOMI[sez]||[],k=n.indexOf(r.n);if(k>=0)return SEED_ID[sez][k];
  return (SEED_ID[sez]&&SEED_ID[sez][i]&&!(L_USATI[SEED_ID[sez][i]]))?SEED_ID[sez][i]:"x-"+slugNome(r.n)}
var L_USATI={};
function daListino(L){
  var U=window.KM_PREZZI_UTIL;if(!U||!L||!L.listino)return;
  var li=L.listino,e=U.eff,e2=U.eur;
  var sc=function(r){return r.sc>0&&(!r.scFino||r.scFino>=iso(new Date()))?" · sconto "+r.sc+"%":""};
  var MESE={abbPt:1,abbMass:1,percorsi:1};
  var voce=function(sez,r,i,nome,det){var id=idVoce(sez,r,i);L_USATI[id]=1;var m=!!(MESE[sez]||/mensil/i.test(r.n));return {id:id,nome:nome,det:(m?"Rinnovo automatico · ":"")+det+sc(r),prezzo:e(r),mese:m?1:0,link:r.link||""}};
  BON=L.bonifico&&L.bonifico.iban?L.bonifico:(L.bonifico&&L.bonifico.mod?null:{iban:"IT70R0306920310100000062819",intest:"Kone Moctar",banca:"Intesa Sanpaolo"});
  L_USATI={};
  var pt=li.pt||[],single=pt.filter(function(r){return r.sed===1}),pack=[];
  var s1=single.filter(function(r){return!/coppia/i.test(r.n)})[0],s2=single.filter(function(r){return/coppia/i.test(r.n)})[0];
  if(s1)LIBERI[0].prezzo=e(s1);if(s2)LIBERI[1].prezzo=e(s2);
  pt.forEach(function(r,i){if(r.sed===1)return;var c=/coppia/i.test(r.n);
    pack.push(voce("pt",r,i,r.n,r.d&&!/^one to one$/i.test(r.d)&&!c?r.d:c?"Prezzo per la coppia":r.sed?e2(Math.round(e(r)/r.sed*100)/100)+" a seduta":"Sedute illimitate"))});
  (li.abbPt||[]).forEach(function(r,i){pack.push(voce("abbPt",r,i,r.n+" · mensile",r.sed?r.sed+" sedute al mese":"Sedute illimitate"))});
  var mass=[];
  (li.massPack||[]).forEach(function(r,i){mass.push(voce("massPack",r,i,r.n,r.sed?e2(Math.round(e(r)/r.sed*100)/100)+" l'uno":(r.d||"")))});
  (li.abbMass||[]).forEach(function(r,i){mass.push(voce("abbMass",r,i,r.n+" · mensile",r.sed?r.sed+" trattamenti al mese":(r.d||"")))});
  var mix=[];
  (li.combo||[]).forEach(function(r,i){mix.push(voce("combo",r,i,r.n,r.d||""))});
  (li.percorsi||[]).forEach(function(r,i){mix.push(voce("percorsi",r,i,r.n+" · mensile",r.d||""))});
  var tr=(L.trattamenti||[]).filter(function(t){return t.id!=="altri"});
  if(tr.length){var m30=null,m50=null;tr.forEach(function(t){var a=e(t,"p30"),b=e(t,"p60");if(a!=null&&(m30==null||a<m30))m30=a;if(b!=null&&(m50==null||b<m50))m50=b});
    if(m30!=null)LIBERI[2].prezzo=m30;if(m50!=null)LIBERI[3].prezzo=m50;
    TRATT=tr.map(function(t){return t.n.replace(/^Massaggio /,"").replace(/^./,function(c){return c.toUpperCase()})})}
  var cs=(li.corsi||[]).filter(function(r){return r.sed===1})[0];if(cs)P_CORSO=e(cs);
  var crs=[];(li.corsi||[]).forEach(function(r,i){if(r.sed===1&&!/mensil/i.test(r.n))return;crs.push(voce("corsi",r,i,r.n,r.d||(r.sed?r.sed+" ingressi":"Ingressi illimitati")))});
  PACK={};if(pack.length)PACK["Personal training"]=pack;if(crs.length)PACK["Corsi di gruppo"]=crs;if(mass.length)PACK["Massaggi"]=mass;if(mix.length)PACK["Allenamento + massaggi"]=mix;
  cats=Object.keys(PACK);if(!PACK[cat])cat=cats[0];
  if(cats.length)rPack();
}

/* link diretti: /prenota/?s=pt-8 apre il pacchetto · ?cat=Massaggi · #planning */
var q=new URLSearchParams(location.search);
if(q.get("cat")&&PACK[q.get("cat")])cat=q.get("cat");
rPack();
Promise.all([caricaCorsi(),caricaFine()]).then(function(){aggiorna()});
tempoReale();
var qs=q.get("s"); if(qs){Object.keys(PACK).forEach(function(k){PACK[k].forEach(function(x){if(x.id===qs){cat=k;rPack();apriPack(qs)}})});}
if(window.KM_LISTINO)window.KM_LISTINO.then(function(L){if(L)daListino(L)});
})();

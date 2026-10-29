(function(){
"use strict";
var C=window.KM_PRENOTA||{};
var SL=C.slug||{}, PL=C.planning||[], GG=C.giorni||[1,2,3,4,5,6];
var H0=(C.orari||{}).inizio||7, H1=(C.orari||{}).fine||21;
var POSTI_ORA=C.postiOra||2, POSTI_CORSO=C.postiCorso||10, P_CORSO=C.prezzoCorso||12;
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

var $=function(s){return document.querySelector(s)};
var eur=function(n){return n.toLocaleString("it-IT")+" €"};
var p2=function(n){return(n<10?"0":"")+n};
var iso=function(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())};
function lunedi(off){var d=new Date();d.setHours(0,0,0,0);var g=(d.getDay()+6)%7;d.setDate(d.getDate()-g+7*off);return d}
function dayOf(mon,g){var d=new Date(mon);d.setDate(d.getDate()+g-1);return d}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

var wk=0, MAXWK=5, dayM=null, live={}; /* live[slug][iso+"T"+ora] = posti rimasti */

/* ---------- disponibilità reale da Cal.com (se collegato) ---------- */
function carica(mon){
  if(!ATTIVO) return Promise.resolve(false);
  var start=iso(mon), endD=new Date(mon); endD.setDate(endD.getDate()+6); var end=iso(endD);
  var slugs={}; slugs[SL["pt-singola"]||"pt-singola"]=1; PL.forEach(function(c){slugs[c.slug]=1});
  var jobs=Object.keys(slugs).map(function(s){
    var u="https://api.cal.com/v2/slots?username="+encodeURIComponent(C.calUser.trim())+"&eventTypeSlug="+encodeURIComponent(s)+"&start="+start+"&end="+end+"&timeZone=Europe/Rome";
    return fetch(u,{headers:{"cal-api-version":"2024-09-04"}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
      var m={},d=(j&&j.data)||{};
      Object.keys(d).forEach(function(day){(d[day]||[]).forEach(function(x){
        var t=new Date(x.start||x.time); var k=iso(t)+"T"+t.getHours();
        m[k]=(typeof x.seatsRemaining==="number")?x.seatsRemaining:-1;
      })});
      live[s+"|"+start]=m;
    });
  });
  return Promise.all(jobs).then(function(){return true},function(){return false});
}
function stato(slug,mon,d,h,max){
  var m=live[slug+"|"+iso(mon)]; if(!m) return max;           /* nessun dato: mostra la capienza teorica */
  var k=iso(d)+"T"+h; if(!(k in m)) return 0;                  /* lo slot non esiste = occupato o chiuso */
  return m[k]<0?max:Math.min(max,m[k]);
}

/* ---------- griglia ---------- */
function corsoAt(g,h){for(var i=0;i<PL.length;i++)if(PL[i].giorno===g&&PL[i].ora===h)return PL[i];return null}
function chiaro(hex){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return(r*299+g*587+b*114)/1000>165}
function render(){
  var mon=lunedi(wk), now=new Date(), g, h, d, html="";
  var sun=dayOf(mon,7);
  $("#wk-lab").textContent=wk===0?"Questa settimana":wk===1?"Prossima settimana":(mon.getDate()+" "+MN[mon.getMonth()].slice(0,3)+" – "+sun.getDate()+" "+MN[sun.getMonth()].slice(0,3));
  $("#wk-prev").disabled=wk<=0; $("#wk-next").disabled=wk>=MAXWK;
  if(dayM===null||GG.indexOf(dayM)<0){var td=(now.getDay()+6)%7+1; dayM=(wk===0&&GG.indexOf(td)>=0)?td:GG[0];}
  /* tab giorni (telefono) */
  $("#days-m").innerHTML=GG.map(function(g){var dd=dayOf(mon,g);return '<button role="tab" aria-selected="'+(g===dayM)+'" data-g="'+g+'">'+GN[dd.getDay()].slice(0,3)+'<small>'+dd.getDate()+' '+MN[dd.getMonth()].slice(0,3)+'</small></button>'}).join("");
  $("#pgrid").style.setProperty("--nd",GG.length);
  html+='<div class="ph">Orario</div>';
  GG.forEach(function(g){var dd=dayOf(mon,g);var t=iso(dd)===iso(now);html+='<div class="ph'+(t?' today':'')+'">'+GN[dd.getDay()]+'<small>'+dd.getDate()+' '+MN[dd.getMonth()].slice(0,3)+'</small></div>'});
  for(h=H0;h<H1;h++){
    html+='<div class="pt">'+p2(h)+':00–'+p2(h+1)+':00</div>';
    GG.forEach(function(g){
      d=dayOf(mon,g); var inizio=new Date(d); inizio.setHours(h,0,0,0);
      var passato=inizio.getTime()<now.getTime()+60*60*1000;
      var c=corsoAt(g,h), cls="pc"+(g!==dayM?" hid":""), inner;
      var data='data-d="'+iso(d)+'" data-h="'+h+'"';
      if(c){
        var r=stato(c.slug,mon,d,h,POSTI_CORSO);
        var lab=passato?"Terminato":r<=0?"Completo":r+(r===1?" posto":" posti");
        inner='<button class="cell c-corso'+(chiaro(c.colore)?' dark':'')+(passato||r<=0?' done':'')+'" style="background:'+c.colore+'" '+data+' data-c="'+esc(c.slug)+'"'+(passato||r<=0?' disabled':'')+' aria-label="'+esc(c.corso)+', '+GN[d.getDay()]+' ore '+h+', '+lab+'"><b>'+esc(c.corso)+'</b><span>'+lab+'</span></button>';
      }else if(passato){
        inner='<button class="cell c-past" disabled aria-hidden="true" tabindex="-1"><span>—</span></button>';
      }else{
        var f=stato(SL["pt-singola"]||"pt-singola",mon,d,h,POSTI_ORA);
        var k=f<=0?"c-full":f<POSTI_ORA?"c-one":"c-free";
        var t=f<=0?"Occupato":f===1?"1 posto":"Libero";
        inner='<button class="cell '+k+'" '+data+' data-f="'+f+'"'+(f<=0?' disabled':'')+' aria-label="'+GN[d.getDay()]+' '+d.getDate()+' ore '+h+', '+t+'"><b>'+t+'</b>'+(f>0?'<span>'+f+'/'+POSTI_ORA+'</span>':'')+'</button>';
      }
      html+='<div class="'+cls+'">'+inner+'</div>';
    });
  }
  /* righe orario solo con la colonna del giorno scelto, su telefono */
  $("#pgrid").innerHTML=html;
}
function aggiorna(){
  render();
  if(ATTIVO){var mon=lunedi(wk);var l=$("#live");l.hidden=false;l.textContent="Aggiornamento disponibilità…";
    carica(mon).then(function(ok){l.textContent=ok?"Disponibilità in tempo reale.":"Disponibilità indicativa: la conferma arriva al pagamento.";render();});}
}

/* ---------- pannello ---------- */
var sheet=$("#sheet"), body=$("#sh-body"), lastFocus=null, ctx={};
function apri(when,title){lastFocus=document.activeElement;$("#sh-when").textContent=when||"";$("#sh-t").textContent=title;sheet.hidden=false;document.body.classList.add("noscroll");setTimeout(function(){$(".sh-x").focus()},30)}
function chiudi(){sheet.hidden=true;document.body.classList.remove("noscroll");body.innerHTML="";if(lastFocus)lastFocus.focus()}
sheet.addEventListener("click",function(e){if(e.target.hasAttribute("data-close"))chiudi()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!sheet.hidden)chiudi()});
function quando(dIso,h){var d=new Date(dIso+"T12:00:00");return GN[d.getDay()]+" "+d.getDate()+" "+MN[d.getMonth()]+" · "+p2(h)+":00–"+p2(h+1)+":00"}
function optBtn(s,dis){return '<button class="opt" data-s="'+s.id+'"'+(dis?' disabled':'')+'><div><b>'+esc(s.nome)+'</b><span>'+esc(s.det)+(dis?' · serve un\'ora con 2 posti liberi':'')+'</span></div><em>'+(s.prezzo?eur(s.prezzo):"Incluso")+'</em></button>'}

function apriOra(dIso,h,f){
  ctx={data:dIso,ora:h,tipo:"libero"};
  apri(quando(dIso,h),"Cosa vuoi prenotare?");
  body.innerHTML='<div class="opts">'+LIBERI.map(function(s){return optBtn(s,s.posti>f)}).join("")+'</div><p class="sep">Hai già un pacchetto o un abbonamento?</p><div class="opts">'+INCLUSI.map(function(s){return optBtn(s,s.posti>f)}).join("")+'</div>';
  ctx.lista=LIBERI.concat(INCLUSI);
}
function apriCorso(dIso,h,slug){
  var c=PL.filter(function(x){return x.slug===slug})[0];
  ctx={data:dIso,ora:h,tipo:"corso",corso:c};
  apri(quando(dIso,h),c.corso);
  var s1={id:"__corso",nome:"Ingresso singolo",det:"Corso di gruppo · max "+POSTI_CORSO+" persone",prezzo:P_CORSO};
  var s2={id:"__corso-inc",nome:"Ho già un carnet / abbonamento corsi",det:"Già pagato",prezzo:0};
  ctx.lista=[s1,s2];
  body.innerHTML='<div class="opts">'+optBtn(s1)+optBtn(s2)+'</div>';
}
function apriPack(id){
  var s=null;Object.keys(PACK).forEach(function(k){PACK[k].forEach(function(x){if(x.id===id)s=x})});
  ctx={tipo:"pacchetto"}; apri("Pacchetto · prima seduta",s.nome); vai(s);
}
body.addEventListener("click",function(e){
  var b=e.target.closest(".opt"); if(b){var s=ctx.lista.filter(function(x){return x.id===b.dataset.s})[0]; if(s) vai(s); return;}
  if(e.target.closest(".back")){ if(ctx.tipo==="corso") apriCorso(ctx.data,ctx.ora,ctx.corso.slug); else if(ctx.tipo==="libero") apriOra(ctx.data,ctx.ora,+ctx.f||POSTI_ORA); else chiudi(); }
});

function slugFor(s){
  if(s.id==="__corso") return ctx.corso.slug;
  if(s.id==="__corso-inc") return SL["inc-corso"]||"corso-incluso";
  return SL[s.id]||s.id;
}
function vai(s){
  var nome=s.id.indexOf("__corso")===0?ctx.corso.corso+" · "+s.nome:s.nome;
  var h='<button class="back">‹ Indietro</button><div class="sum"><div><b>'+esc(nome)+'</b>'+(ctx.data?'<br><span style="color:var(--txt-2);font-size:14px">'+quando(ctx.data,ctx.ora)+'</span>':'')+'</div><em>'+(s.prezzo?eur(s.prezzo):"Incluso")+'</em></div>';
  if(s.tratt) h+='<label style="font-size:14px;color:var(--txt-2)">Trattamento<select class="sel" id="tratt">'+TRATT.map(function(t){return'<option>'+t+'</option>'}).join("")+'</select></label><div style="height:14px"></div>';
  body.innerHTML=h+'<div id="step2"></div>';
  $("#sh-t").textContent=!ATTIVO?"Conferma e paga":ctx.tipo==="pacchetto"?"Scegli la prima seduta e paga":"Scegli l'orario e paga";
  var go=function(){ATTIVO?cal(s,nome):fallback(s,nome)};
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

/* ---------- finché Cal.com non è collegato ---------- */
function fallback(s,nome){
  var t=$("#tratt");
  var msg="Ciao Kone! Vorrei prenotare: "+nome+(t?" ("+t.value+")":"")+(ctx.data?" — "+quando(ctx.data,ctx.ora):"")+(s.prezzo?" — "+eur(s.prezzo)+". Ho pagato con PayPal / pago in studio.":".");
  var wa="https://wa.me/"+WA+"?text="+encodeURIComponent(msg);
  $("#step2").innerHTML='<div class="fb"><p>Il pagamento automatico con carta si sta attivando. Intanto puoi bloccare il posto così:</p><div class="cta-row">'+
   (s.prezzo&&C.paypal?'<a class="btn gold" href="'+C.paypal+'" target="_blank" rel="noopener">Paga '+eur(s.prezzo)+' con PayPal</a>':'')+
   '<a class="btn line" href="'+wa+'" target="_blank" rel="noopener">Invia la prenotazione</a></div><p style="font-size:14px;margin-top:14px">Il messaggio con giorno, ora e servizio è già scritto: devi solo premere invio.</p></div>';
}

/* ---------- eventi ---------- */
$("#pgrid").addEventListener("click",function(e){
  var b=e.target.closest(".cell"); if(!b||b.disabled) return;
  if(b.dataset.c) apriCorso(b.dataset.d,+b.dataset.h,b.dataset.c);
  else {apriOra(b.dataset.d,+b.dataset.h,+b.dataset.f); ctx.f=b.dataset.f;}
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
  var voce=function(sez,r,i,nome,det){var id=idVoce(sez,r,i);L_USATI[id]=1;return {id:id,nome:nome,det:det+sc(r),prezzo:e(r)}};
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
  PACK={};if(pack.length)PACK["Personal training"]=pack;if(mass.length)PACK["Massaggi"]=mass;if(mix.length)PACK["Allenamento + massaggi"]=mix;
  cats=Object.keys(PACK);if(!PACK[cat])cat=cats[0];
  if(cats.length)rPack();
}

/* link diretti: /prenota/?s=pt-8 apre il pacchetto · ?cat=Massaggi · #planning */
var q=new URLSearchParams(location.search);
if(q.get("cat")&&PACK[q.get("cat")])cat=q.get("cat");
rPack(); aggiorna();
var qs=q.get("s"); if(qs){Object.keys(PACK).forEach(function(k){PACK[k].forEach(function(x){if(x.id===qs){cat=k;rPack();apriPack(qs)}})});}
if(window.KM_LISTINO)window.KM_LISTINO.then(function(L){if(L)daListino(L)});
})();

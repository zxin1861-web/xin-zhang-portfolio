
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* nav + progress */
const nav=$(".site-nav"), progress=$(".progress");
const syncScroll=()=>{
  if(nav) nav.classList.toggle("scrolled",scrollY>24);
  if(progress){
    const max=document.documentElement.scrollHeight-innerHeight;
    progress.style.width=(max>0?scrollY/max*100:0)+"%";
  }
};
syncScroll(); addEventListener("scroll",syncScroll,{passive:true});
$(".menu-btn")?.addEventListener("click",()=>$(".nav-links")?.classList.toggle("open"));
$$(".nav-links a").forEach(a=>a.addEventListener("click",()=>$(".nav-links")?.classList.remove("open")));

/* reveals */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
$$(".reveal,.media-enter").forEach(el=>io.observe(el));

/* home signal field + trail */
$$("[data-signal-field]").forEach(field=>{
  const dot=$(".gaze-dot",field);
  let last=0;
  field.addEventListener("pointermove",e=>{
    const r=field.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    dot.style.left=x+"px";dot.style.top=y+"px";
    const now=performance.now();
    if(now-last>55){
      last=now;
      const t=document.createElement("i");
      t.className="gaze-trail";t.style.left=x+"px";t.style.top=y+"px";
      field.appendChild(t);setTimeout(()=>t.remove(),700);
    }
  });
  field.addEventListener("pointerleave",()=>{dot.style.left="50%";dot.style.top="50%"});
});

/* lab tabs */
$$("[data-lab]").forEach(lab=>{
  const tabs=$$("[data-lab-tab]",lab),panels=$$("[data-lab-panel]",lab);
  tabs.forEach(tab=>tab.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));panels.forEach(x=>x.classList.remove("active"));
    tab.classList.add("active");$(`[data-lab-panel="${tab.dataset.labTab}"]`,lab)?.classList.add("active");
  }));
});

/* scene gaze pointer */
$$("[data-scene-gaze]").forEach(scene=>{
  const dot=$(".scene-gaze",scene);
  scene.addEventListener("pointermove",e=>{
    const r=scene.getBoundingClientRect();
    dot.style.left=(e.clientX-r.left)+"px";dot.style.top=(e.clientY-r.top)+"px";
  });
});

/* dwell hotspots */
$$("[data-dwell-scene]").forEach(scene=>{
  const status=$("[data-dwell-status]",scene.closest(".lab-stage")||document);
  $$("[data-hotspot]",scene).forEach(h=>{
    let raf,start,active=false;
    const reset=()=>{active=false;cancelAnimationFrame(raf);if(!h.classList.contains("selected"))h.style.setProperty("--p","0deg")};
    const tick=t=>{
      if(!active)return;if(!start)start=t;
      const p=Math.min(1,(t-start)/1300);h.style.setProperty("--p",`${p*360}deg`);
      if(p>=1){active=false;$$("[data-hotspot]",scene).forEach(x=>x.classList.remove("selected"));h.classList.add("selected");if(status)status.textContent=h.dataset.label;return}
      raf=requestAnimationFrame(tick);
    };
    h.addEventListener("pointerenter",()=>{start=null;active=true;raf=requestAnimationFrame(tick)});
    h.addEventListener("pointerleave",reset);
    h.addEventListener("click",()=>{h.style.setProperty("--p","360deg");h.classList.add("selected");if(status)status.textContent=h.dataset.label});
  });
});

/* mindfulness drift */
$$("[data-mind-scene]").forEach(scene=>{
  const fill=$(".drift-fill",scene),msg=$("[data-drift-text]",scene.closest(".lab-stage")||document);
  let timer=null,start=null,raf=null;
  const reset=()=>{clearTimeout(timer);cancelAnimationFrame(raf);timer=null;start=null;scene.classList.remove("cue");fill.style.width="0%";scene.style.setProperty("--vignette",".08");if(msg)msg.textContent="On anchor"};
  const animate=t=>{
    if(!start)start=t;const p=Math.min(1,(t-start)/1500);fill.style.width=(p*100)+"%";scene.style.setProperty("--vignette",(.08+p*.42).toFixed(2));
    if(p<1)raf=requestAnimationFrame(animate);
  };
  scene.addEventListener("pointermove",e=>{
    const r=scene.getBoundingClientRect(),d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height*.49));
    if(d>90 && !timer){
      start=null;raf=requestAnimationFrame(animate);if(msg)msg.textContent="Attention drifting";
      timer=setTimeout(()=>{scene.classList.add("cue");if(msg)msg.textContent="Cue displayed"},1500);
    }else if(d<=90)reset();
  });
  scene.addEventListener("pointerleave",reset);
});

/* difficulty slider */
$$("[data-diff-scene]").forEach(scene=>{
  const range=$("input[type=range]",scene),time=$("[data-diff-time]",scene.closest(".lab-stage")||document),dwell=$("[data-diff-dwell]",scene.closest(".lab-stage")||document),input=$("[data-diff-input]",scene.closest(".lab-stage")||document),img=$("img",scene);
  const states={
    1:{time:"Unlimited",dwell:"Long confirmation",input:"Controller-assisted",img:"../../assets/images/lumastep-bedroom-day.png",shade:.00},
    2:{time:"3 minutes",dwell:"3 s dwell",input:"Eye-controlled",img:"../../assets/images/lumastep-livingroom.png",shade:.06},
    3:{time:"90 seconds",dwell:"2 s dwell",input:"Eye-controlled",img:"../../assets/images/lumastep-bedroom-night.png",shade:.17}
  };
  const update=()=>{
    const s=states[range.value];if(time)time.textContent=s.time;if(dwell)dwell.textContent=s.dwell;if(input)input.textContent=s.input;
    scene.style.setProperty("--shade",s.shade); if(scene.dataset.home==="1"){ 
      const base=s.img.replace("../../",""); img.src=base;
    } else img.src=s.img;
  };
  range?.addEventListener("input",update);update();
});

/* scrollytelling */
$$("[data-scrolly]").forEach(root=>{
  const steps=$$("[data-step]",root),media=$$("[data-media]",root);
  const set=id=>{steps.forEach(s=>s.classList.toggle("active",s.dataset.step===id));media.forEach(m=>m.classList.toggle("active",m.dataset.media===id))}
  if(steps[0])set(steps[0].dataset.step);
  const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)set(e.target.dataset.step)}),{threshold:.58});
  steps.forEach(s=>o.observe(s));
});

/* publication filters */
$$("[data-pub-filter]").forEach(group=>{
  $$("[data-filter]",group).forEach(btn=>btn.addEventListener("click",()=>{
    $$("[data-filter]",group).forEach(b=>b.classList.remove("active"));btn.classList.add("active");
    const f=btn.dataset.filter;$$("[data-pub-status]",group).forEach(row=>row.style.display=(f==="all"||row.dataset.pubStatus===f)?"grid":"none");
  }));
});

/* environment switch */
$$("[data-env-switch]").forEach(root=>{
  const tabs=$$("[data-env]",root),imgs=$$("[data-env-img]",root),title=$("[data-env-title]",root),copy=$("[data-env-copy]",root);
  const data={
    sea:["Sea","Open water and horizon-dominant composition."],
    lake:["Lake","A more balanced relationship between water, mountains, and vegetation."],
    wetland:["Wetland","Denser vegetation and near-field green elements around water."]
  };
  tabs.forEach(t=>t.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));imgs.forEach(x=>x.classList.remove("active"));
    t.classList.add("active");$(`[data-env-img="${t.dataset.env}"]`,root)?.classList.add("active");
    if(title)title.textContent=data[t.dataset.env][0];if(copy)copy.textContent=data[t.dataset.env][1];
  }));
});

/* AI process */
$$("[data-process]").forEach(root=>{
  const steps=$$("[data-process-step]",root),imgs=$$("[data-process-img]",root);
  steps.forEach(s=>s.addEventListener("click",()=>{
    steps.forEach(x=>x.classList.remove("active"));imgs.forEach(x=>x.classList.remove("active"));
    s.classList.add("active");$(`[data-process-img="${s.dataset.processStep}"]`,root)?.classList.add("active");
  }));
});

/* detail hidden rationale toggles */
$$("[data-detail-toggle]").forEach(root=>{
  const buttons=$$("button[data-copy]",root),target=$(".toggle-content",root);
  buttons.forEach(b=>b.addEventListener("click",()=>{
    buttons.forEach(x=>x.classList.remove("active"));b.classList.add("active");target.textContent=b.dataset.copy;
  }));
});


/* ==========================================================
   V15 — Kinetic HELLO interaction
   ========================================================== */
$$("[data-hello-art]").forEach(art=>{
  const letters=$$(".hello-letter",art);
  const cursor=$(".hello-cursor",art);

  const reset=()=>{
    letters.forEach((el,i)=>{
      el.style.setProperty("--tx","0px");
      el.style.setProperty("--ty","0px");
      el.style.setProperty("--rot","0deg");
    });
    if(cursor){cursor.style.left="50%";cursor.style.top="50%";}
  };

  art.addEventListener("pointermove",e=>{
    const r=art.getBoundingClientRect();
    const nx=(e.clientX-r.left)/r.width-.5;
    const ny=(e.clientY-r.top)/r.height-.5;

    if(cursor){
      cursor.style.left=(e.clientX-r.left)+"px";
      cursor.style.top=(e.clientY-r.top)+"px";
    }

    letters.forEach((el,i)=>{
      const depth=(i-2);
      const tx=nx*(10+Math.abs(depth)*4) + depth*nx*4;
      const ty=ny*(8+Math.abs(depth)*3) - depth*ny*2;
      const rot=nx*depth*1.4;
      el.style.setProperty("--tx",`${tx.toFixed(1)}px`);
      el.style.setProperty("--ty",`${ty.toFixed(1)}px`);
      el.style.setProperty("--rot",`${rot.toFixed(2)}deg`);
    });
  });

  art.addEventListener("pointerleave",reset);
});


/* ==========================================================
   V16 — generalized kinetic word art
   ========================================================== */
$$("[data-brand-art]").forEach(art=>{
  const letters=$$(".brand-letter",art);
  const cursor=$(".brand-cursor",art);

  const reset=()=>{
    letters.forEach(el=>{
      el.style.setProperty("--bx","0px");
      el.style.setProperty("--by","0px");
      el.style.setProperty("--br","0deg");
    });
    if(cursor){cursor.style.left="50%";cursor.style.top="50%";}
  };

  art.addEventListener("pointermove",e=>{
    const r=art.getBoundingClientRect();
    const nx=(e.clientX-r.left)/r.width-.5;
    const ny=(e.clientY-r.top)/r.height-.5;

    if(cursor){
      cursor.style.left=(e.clientX-r.left)+"px";
      cursor.style.top=(e.clientY-r.top)+"px";
    }

    letters.forEach((el,i)=>{
      const mid=(letters.length-1)/2;
      const depth=i-mid;
      const tx=nx*(7+Math.abs(depth)*2.6)+depth*nx*1.8;
      const ty=ny*(6+Math.abs(depth)*2.1)-depth*ny*1.1;
      const rot=nx*depth*.75;
      el.style.setProperty("--bx",`${tx.toFixed(1)}px`);
      el.style.setProperty("--by",`${ty.toFixed(1)}px`);
      el.style.setProperty("--br",`${rot.toFixed(2)}deg`);
    });
  });

  art.addEventListener("pointerleave",reset);
});

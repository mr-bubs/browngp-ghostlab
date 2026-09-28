const $=id=>document.getElementById(id);
const format=t=>Math.floor(t/60)+':'+(t%60).toFixed(3).padStart(6,'0');
export function populateSessionUI({catalog,entry,lapData,trackConfig}){
  const drivers=lapData.drivers,select=$('sessionSelect');
  select.replaceChildren(...catalog.sessions.map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.label;option.selected=item.id===entry.id;return option;}));
  select.disabled=false;
  select.onchange=()=>{select.disabled=true;$('sessionStatus').textContent='Loading comparison…';const url=new URL(location.href);url.searchParams.set('session',select.value);location.assign(url.href);};
  const delta=drivers[1].duration-drivers[0].duration;
  $('sessionStatus').textContent=`${drivers[0].code} / ${drivers[1].code} · ${delta>=0?'+':''}${delta.toFixed(3)} s`;
  $('sessionHeading').textContent=`${lapData.year} CANADIAN GP / ${lapData.segment}`;
  $('comparisonTitle').textContent=lapData.title+'.';
  $('viewerSession').textContent=`${lapData.year} / ${lapData.segment} GHOST REPLAY`;
  document.title=`${lapData.year} Canada · ${lapData.title} | Brown GP Ghost Lab`;
  $('onboardDriver').textContent=`P2 · ${drivers[1].code} · ${drivers[1].team}`;
  $('cockpitHud').setAttribute('aria-label',drivers[1].name+' cockpit telemetry');
  $('dataNote').textContent=`Lap timing, speed, throttle, brake state, gear and RPM: OpenF1, ${lapData.year} Canadian GP ${lapData.segment}.`;
  drivers.forEach((driver,index)=>{
    const suffix=index?'B':'A',card=document.querySelector('.driver.'+(index?'b':'a'));
    document.documentElement.style.setProperty('--driver-'+suffix,driver.color);
    card.querySelector('.driver-top>span').textContent=`P${driver.position} · #${driver.driver_number}`;
    card.querySelector('.chip').textContent=driver.code;card.querySelector('h2').textContent=driver.name;card.querySelector('p').textContent=driver.team;
    const time=card.querySelector('.time');time.textContent=format(driver.duration);
    if(index){const gap=document.createElement('small');gap.textContent=' '+(delta>=0?'+':'')+delta.toFixed(3);time.append(gap);}
    $('tag'+suffix).textContent=driver.code;
    document.querySelectorAll('.corner-speeds i')[index].textContent=driver.code;
  });
}

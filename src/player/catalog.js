const rootURL=new URL('../../',import.meta.url);
export const assetURL=path=>new URL(path,rootURL).href;
async function read(url){const response=await fetch(url);if(!response.ok)throw Error(`Could not load ${new URL(url).pathname} (${response.status})`);return response.json();}

export function validateLap(lap){
  if(!lap.code||!lap.name||!lap.team||!lap.carId||!Number.isFinite(lap.duration)||lap.duration<=0)throw Error('Incomplete driver/lap metadata');
  if(!Array.isArray(lap.samples)||lap.samples.length<2)throw Error('Lap has no telemetry');
  let previousTime=-1,previousDistance=-1;
  for(const row of lap.samples){
    if(!Array.isArray(row)||row.length!==8||!row.every(Number.isFinite))throw Error(`Invalid telemetry for ${lap.code}`);
    if(row[0]<=previousTime||row[1]<previousDistance||row[1]<0||row[1]>1||row[2]<0||row[3]<0||row[3]>100||row[4]<0||row[4]>100||row[5]<0||row[5]>8)throw Error(`Invalid time, distance or channel range for ${lap.code}`);
    previousTime=row[0];previousDistance=row[1];
  }
  const first=lap.samples[0],last=lap.samples[lap.samples.length-1];
  if(first[0]!==0||first[1]!==0||Math.abs(last[0]-lap.duration)>.001||last[1]!==1)throw Error(`Lap boundaries do not match ${lap.code}`);
}

export async function loadComparison(){
  const catalog=await read(assetURL('catalog.json'));
  if(catalog.schemaVersion!==1)throw Error('Unsupported catalog schema');
  const selected=new URL(location.href).searchParams.get('session')||catalog.defaultSession;
  const entry=catalog.sessions.find(session=>session.id===selected);
  if(!entry)throw Error('Unknown session. Open this page without the session query to reset.');
  const sessionURL=assetURL(entry.manifest),lapData=await read(sessionURL);
  if(lapData.schemaVersion!==1||lapData.id!==entry.id||lapData.laps?.length!==2)throw Error('Invalid comparison manifest');
  const trackURL=assetURL(catalog.tracks[lapData.trackId]);
  const [trackConfig,registry,drivers]=await Promise.all([read(trackURL),read(assetURL(catalog.cars)),Promise.all(lapData.laps.map(path=>read(new URL(path,sessionURL).href)))]);
  drivers.forEach(validateLap);
  if(trackConfig.id!==lapData.trackId||trackConfig.schemaVersion!==1)throw Error('Session does not match the selected circuit layout');
  for(const driver of drivers)if(!registry.cars[driver.carId])throw Error('Missing car definition: '+driver.carId);
  const [map,lineData,environment]=await Promise.all([read(new URL(trackConfig.map,trackURL).href),read(new URL(trackConfig.racingLine,trackURL).href),import(new URL(trackConfig.environment,trackURL).href)]);
  lapData.drivers=drivers;
  return {catalog,entry,lapData,trackConfig,map,lineData,registry,assetURL,environmentBuilder:environment.buildEnvironment};
}

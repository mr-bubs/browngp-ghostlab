// Periodic cubic interpolation keeps the precomputed spatial route smooth,
// including across the start/finish seam. No per-frame fitting or kerb snapping.
export function sampleRacingOffset(offsets,u){
  const count=offsets.length,scaled=((u%1)+1)%1*count,index=Math.floor(scaled),t=scaled-index;
  const a=offsets[(index-1+count)%count],b=offsets[index],c=offsets[(index+1)%count],d=offsets[(index+2)%count];
  return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
}

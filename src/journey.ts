// Shared spatial rules: the river is an extension of the street, not another scene.
export type Chapter = 1 | 2 | 3;
export interface Position { x: number; y: number; z: number }

function smooth(value: number, from: number, to: number) {
  const t=Math.max(0,Math.min(1,(value-from)/(to-from)));
  return t*t*(3-2*t);
}

export const riverStart = -174;
export const riverEnd = -526;
// A physical opening, in the same coordinate system as the Rhone. No teleport.
export const rift = {x:5,y:243,z:-558};
export const riftOutline = [[-13,-20],[7,-19],[13,-12],[12,5],[15,16],[4,22],[-10,18],[-14,4]] as const;
export function insideRift(x:number,y:number) {
  let inside=false;
  for(let i=0,j=riftOutline.length-1;i<riftOutline.length;j=i++){
    const [ax,ay]=riftOutline[i],[bx,by]=riftOutline[j];
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
}
export function riftBlocks(from:Position,to:Position) {
  if((from.z<rift.z)===(to.z<rift.z)||from.z===to.z)return false;
  const t=(rift.z-from.z)/(to.z-from.z),x=from.x+(to.x-from.x)*t-rift.x,y=from.y+(to.y-from.y)*t-rift.y;
  return ![-.32,.32].every(dx=>[-1.55,.2].every(dy=>insideRift(x+dx,y+dy)));
}
export function surrealWeight(position:Position) {return smooth(-position.z,-rift.z,-rift.z+35);}
export function riverWeight(position: Position) { return smooth(-position.z,72,160); }
export function cosmosWeight(position: Position) { return riverWeight(position)*smooth(position.y,24,155); }
export function chapterAt(position: Position, previous: Chapter): Chapter {
  if(position.z<rift.z-2)return 3;
  if(previous===3&&position.z<rift.z+2)return 3;
  // A generous overlap prevents announcements and sound from flickering on the shoreline.
  return position.z<-151?2:position.z>-125?1:previous;
}
export function explorationBounds(position: Position) {
  if(position.z<rift.z)return {width:240,minZ:-1160,maxZ:40,minY:170,maxY:440};
  const opening=smooth(-position.z,94,168);
  const passage=Math.abs(position.x-rift.x)<19&&position.y>220&&position.y<260&&position.z<-445;
  return {width:36+opening*149,minZ:passage?rift.z-1:-556,maxZ:40,minY:1.65,maxY:96+opening*164};
}

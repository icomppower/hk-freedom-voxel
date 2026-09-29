// Debug: plain-object dump of the sim state (diff two runs field by field when a hash check fails).
export function dump(G) {
  const H = G.hero, C = G.crowd, o = { frame: G.frame, hitstop: G.hitstop, cam: [G.cam.yaw, G.cam.tilt], hero: {} };
  for (const f of ['x','y','z','vx','vy','vz','yaw','hp','musou','kos','combo','comboT','stateT','moveT','iframes','airN','state','move']) o.hero[f] = H[f];
  o.crowd = [];
  for (let i = 0; i < C.T; i++) if (C.st[i]) o.crowd.push([i, C.st[i], C.x[i], C.z[i], C.y[i], C.hp[i], C.yaw[i]]);
  o.misc = [C.allyKos, C.allyLost, C.sq.n, G.musou.active, G.musou.t, JSON.stringify(G.story.stats())];
  return o;
}

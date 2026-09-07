// Entry point: pull in every figure module, then mount whatever the page
// actually asked for. Modules register themselves on import, so mounting must
// happen last.

import { mountAll, mountVideos } from './anim-core.js';
import './anim-basics.js';
import './anim-comms.js';
import './anim-net.js';
import './anim-shownet.js';
import './anim-lighting.js';
import './anim-cue.js';
import './anim-time.js';
import './anim-extra.js';

mountAll();
mountVideos();

// A link straight to a figure lands before the canvas has any height, so the
// reader ends up a screen above the thing they asked for. app.js has already
// opened the panel it lives in; this only corrects for the height it gains.
if (location.hash.startsWith('#fig-')) {
  const t = document.getElementById(location.hash.slice(1));
  if (t) requestAnimationFrame(() => t.scrollIntoView({ block: 'center' }));
}

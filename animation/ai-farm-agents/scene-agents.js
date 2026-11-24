const { seg, eo, eob, lerp, TextFx, breathe } = kit;
const AGENTS = [
  ['Farm Manager', 'Daily brief, logging, reminders, alerts', 'Fast, low-cost model', '06:30 every day'],
  ['Sales Clerk', 'Harvest list, orders, delivery list', 'Fast, low-cost model', 'Wednesday 20:00'],
  ['Bookkeeper', 'Weekly review, money, market scan', 'Strongest Claude model', 'Sunday evening'],
];
kit.scene('agents', {
  init(kit) {
    let cards = '';
    AGENTS.forEach(([n, j, m, w], i) => {
      cards += '<div class="card agents-card" style="left:' + (140 + i * 570) + 'px;top:400px;width:500px">' +
        '<svg width="200" height="190" viewBox="-100 -262 200 266" style="overflow:visible"><g class="agents-fig">' +
        window.FARM.figure(kit, { x: 0, y: 0, s: 1, suit: true }) + '</g></svg>' +
        '<p class="card-name" style="margin:0">' + n + '</p>' +
        '<p class="card-job" style="margin:0">' + j + '</p>' +
        '<p class="card-tag" style="margin:0">' + m + '</p>' +
        '<p class="label" style="margin:0">' + w + '</p></div>';
    });
    kit.stage.append(kit.h('<div class="ground"><div class="agents-row" style="position:absolute;inset:0">' + cards + '</div>' +
      '<div class="words" style="left:140px;top:110px;width:1500px"><h2 class="line">Three agents</h2>' +
      '<p class="sub agents-sub">Each one has a job, a model and a time to wake</p></div></div>'));
    this.line = kit.stage.querySelector('.line');
    this.sub = kit.stage.querySelector('.agents-sub').style;
    this.row = kit.stage.querySelector('.agents-row').style;
    this.cards = [...kit.stage.querySelectorAll('.agents-card')].map((e) => e.style);
    this.figs = [...kit.stage.querySelectorAll('.agents-fig')].map((e) => { e.style.transformOrigin = '0px 0px'; return e.style; });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.1);
    const s = eo(seg(t, 0.5, 1));
    this.sub.opacity = s;
    this.sub.transform = 'translateY(' + lerp(16, 0, s) + 'px)';
    this.row.transform = 'translateX(' + lerp(0, -18, seg(t, 0, 5)) + 'px)';
    this.cards.forEach((c, i) => {
      const a = 0.8 + i * 0.35, p = eo(seg(t, a, a + 0.6));
      c.opacity = p;
      c.transform = 'translateX(' + lerp(90, 0, p) + 'px)';
      const f = seg(t, a + 0.2, a + 0.7);
      this.figs[i].transform = 'scale(' + (f < 1 ? Math.max(0.001, eob(f, 1.8)) : breathe(t + i * 0.7, 0.02, 3)) + ')';
    });
  },
});
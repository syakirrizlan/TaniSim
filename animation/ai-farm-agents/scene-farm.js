const { seg, eo, eio, eob, lerp, TextFx, breathe } = kit;
kit.scene('farm', {
  init(kit) {
    const trees = [[370, 848, 30, 3], [450, 826, 38, 5], [540, 860, 28, 8], [640, 834, 36, 11], [740, 858, 30, 13], [840, 838, 34, 17], [940, 862, 26, 19]];
    let tr = '';
    for (const [x, y, r, sd] of trees) tr += '<polygon class="paper-hi farm-tree" points="' + kit.polyStr(kit.cutPaper(sd, 7, 0.25), x, y, r, r, 0) + '"/>';
    let beds = '';
    for (let i = 0; i < 9; i++) {
      const x = 1300 + i * 30, yb = 790 + (1720 - x) / 460 * 170 - 14;
      beds += '<rect class="paper-lt farm-bed" x="' + x + '" y="806" width="18" height="' + (yb - 806).toFixed(0) + '" rx="3"/>';
    }
    kit.stage.append(kit.h('<div class="ground">' +
      '<svg class="art farm-art" viewBox="0 0 1920 1080">' +
      '<line class="road farm-road" x1="120" y1="768" x2="1800" y2="768"/>' +
      '<g class="farm-strip"><polygon class="paper" points="200,790 1720,790 1260,962 520,962"/>' + tr + beds +
      '<g class="farm-hut"><rect class="paper-lt" x="1150" y="852" width="92" height="72" rx="4"/><polygon class="paper-hi" points="1138,856 1196,812 1254,856"/></g></g>' +
      '<g class="farm-man">' + window.FARM.figure(kit, { x: 1080, y: 930, s: 0.62, hat: true }) + '</g>' +
      '</svg>' +
      '<div class="words" style="left:200px;top:716px"><p class="label">Village road</p></div>' +
      '<div class="words" style="left:140px;top:140px;width:1400px"><h1 class="line">AI farm agents</h1>' +
      '<p class="sub farm-sub">Three helpers for a 1.3-acre farm in Sungai Lalah, Pedas</p></div></div>'));
    const q = (s) => kit.stage.querySelector(s);
    this.line = q('.line');
    for (const k of ['sub', 'art', 'road', 'strip', 'hut', 'man']) this[k] = q('.farm-' + k).style;
    this.trees = [...kit.stage.querySelectorAll('.farm-tree')].map((e, i) => { e.style.transformOrigin = trees[i][0] + 'px ' + trees[i][1] + 'px'; return e.style; });
    this.beds = [...kit.stage.querySelectorAll('.farm-bed')].map((e) => { e.style.transformOrigin = '0px 806px'; return e.style; });
    this.art.transformOrigin = '960px 860px';
    this.strip.transformOrigin = '200px 876px';
    this.hut.transformOrigin = '1196px 888px';
    this.man.transformOrigin = '1080px 930px';
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.5);
    const s = eo(seg(t, 0.5, 1.1));
    this.sub.opacity = s;
    this.sub.transform = 'translateY(' + lerp(18, 0, s) + 'px)';
    this.art.transform = 'scale(' + lerp(1, 1.035, eio(seg(t, 0, 4))) + ')';
    this.road.strokeDashoffset = String(-t * 24);
    this.strip.transform = 'scaleX(' + Math.max(0.001, eo(seg(t, 0.15, 1.3))) + ')';
    this.trees.forEach((st, i) => {
      const p = seg(t, 0.9 + i * 0.1, 1.45 + i * 0.1);
      st.transform = 'scale(' + (p < 1 ? Math.max(0.001, eob(p, 1.7)) : breathe(t + i * 0.5, 0.02, 3)) + ')';
    });
    this.beds.forEach((st, i) => { st.transform = 'scaleY(' + Math.max(0.001, eo(seg(t, 1.1 + i * 0.05, 1.4 + i * 0.05))) + ')'; });
    this.hut.opacity = eo(seg(t, 1.3, 1.5));
    this.hut.transform = 'translateY(' + lerp(-26, 0, eob(seg(t, 1.3, 1.8), 1.6)) + 'px)';
    const m = seg(t, 1.8, 2.3);
    this.man.transform = 'scale(' + (m < 1 ? Math.max(0.001, eob(m, 1.8)) : breathe(t, 0.015, 3.2)) + ')';
  },
});
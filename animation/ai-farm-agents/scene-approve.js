const { seg, eo, eio, eob, lerp, TextFx } = kit;
const REQS = [['Spend', 'Chest freezer from the Fund'], ['Customer message', 'Wednesday harvest list'], ['Animal care', 'Treatment for a sick hen']];
kit.scene('approve', {
  init(kit) {
    kit.css('.approve-req{padding:30px 34px;display:flex;flex-direction:column;gap:12px}' +
      '.approve-txt{margin:0;font-size:36px;font-weight:600;line-height:1.2;max-width:340px}' +
      '.approve-check{position:absolute;right:28px;top:26px;width:44px;height:44px;overflow:visible}' +
      '.approve-check path{fill:none;stroke:var(--second);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60}' +
      '.approve-stamp{left:960px;top:610px;padding:30px 60px;font-size:96px;line-height:1.1;white-space:nowrap}');
    let reqs = '';
    REQS.forEach(([k, v], i) => {
      reqs += '<div class="panel approve-req" style="left:' + (180 + i * 540) + 'px;top:200px;width:480px;height:210px">' +
        '<p class="label" style="margin:0">' + k + '</p><p class="approve-txt">' + v + '</p>' +
        '<svg class="approve-check" viewBox="0 0 44 44"><path d="M6 23 L17 34 L38 10"/></svg></div>';
    });
    kit.stage.append(kit.h('<div class="ground"><div class="approve-all" style="position:absolute;inset:0">' + reqs +
      '<div class="stamp approve-stamp">You approve</div>' +
      '<div class="words" style="left:260px;top:790px;width:1400px;align-items:center;text-align:center">' +
      '<p class="sub approve-sub" style="color:var(--second)">Agents draft and remind. Nothing is sent, spent or given without your yes.</p>' +
      '<p class="label approve-end">AI farm agents for the 1.3-acre farm, Sungai Lalah</p></div></div></div>'));
    const q = (s) => kit.stage.querySelector(s);
    this.all = q('.approve-all').style;
    this.all.transformOrigin = '960px 560px';
    this.stamp = q('.approve-stamp').style;
    this.subEl = q('.approve-sub');
    this.end = q('.approve-end').style;
    this.reqs = [...kit.stage.querySelectorAll('.approve-req')].map((e) => e.style);
    this.checks = [...kit.stage.querySelectorAll('.approve-check path')].map((e) => e.style);
  },
  render(t) {
    const dip = t > 1.7 && t < 2.05 ? Math.sin((t - 1.7) / 0.35 * Math.PI) * 8 : 0;
    this.reqs.forEach((r, i) => {
      const p = eo(seg(t, 0.1 + i * 0.2, 0.7 + i * 0.2));
      r.opacity = p;
      r.transform = 'translate(' + lerp(70, 0, p) + 'px,' + dip + 'px)';
    });
    const l = seg(t, 1.4, 1.75);
    const sc = t < 1.4 ? lerp(1.25, 1.3, eo(seg(t, 1.2, 1.4))) : lerp(1.3, 1, eob(l, 1.6));
    const sq = Math.sin(seg(t, 1.7, 1.95) * Math.PI) * 0.06;
    this.stamp.opacity = eo(seg(t, 1.15, 1.35));
    this.stamp.transform = 'translate(-50%,-50%) rotate(' + lerp(-7, -3, eo(l)) + 'deg) scale(' + sc * (1 + sq) + ',' + sc * (1 - sq) + ')';
    this.checks.forEach((c, i) => { c.strokeDashoffset = String(60 * (1 - eo(seg(t, 1.9 + i * 0.15, 2.25 + i * 0.15)))); });
    TextFx.fadeFromRight(this.subEl, t, 2.2);
    this.end.opacity = eo(seg(t, 2.9, 3.4));
    this.all.transform = 'scale(' + lerp(1, 1.02, eio(seg(t, 2, 6))) + ')';
  },
});
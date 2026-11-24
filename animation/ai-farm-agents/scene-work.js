const { seg, eo, eob, lerp, TextFx } = kit;
const MSGS = [['Good morning. Rain after 3 pm, so water early.', 0], ['Today: sow kangkung in C5.', 0], ['Rabbit doe 2: nest box in today.', 0], ['Voice note, 0:12', 1], ['Logged: 12 eggs, and 3 kg kangkung sold for RM12.', 0]];
const AT = [0.9, 1.5, 2.1, 2.8, 3.5];
const ROWS = [['Eggs', 0.55, 0.72], ['Kangkung', 0.35, 0.5], ['Bayam', 0.45, 0.45], ['Sales', 0.3, 0.42]];
kit.scene('work', {
  init(kit) {
    kit.css('.work-phone{position:absolute;left:1260px;top:110px;width:440px;height:860px;background:var(--surface);border:3px solid var(--mid);border-radius:52px;box-sizing:border-box;box-shadow:0 18px 40px rgba(0,0,0,.25)}' +
      '.work-head{position:absolute;left:34px;right:34px;top:34px;display:flex;justify-content:space-between}' +
      '.work-chat{position:absolute;left:24px;right:24px;top:100px;display:flex;flex-direction:column;gap:16px}' +
      '.work-b{margin:0;max-width:330px;padding:16px 20px;font-size:26px;line-height:1.3;border-radius:22px 22px 22px 6px;background:color-mix(in srgb, var(--mid) 55%, var(--surface));align-self:flex-start;transform-origin:0 100%}' +
      '.work-me{align-self:flex-end;border-radius:22px 22px 6px 22px;background:var(--mid);transform-origin:100% 100%}' +
      '.work-row{position:absolute;left:36px;display:flex;align-items:center;gap:24px}' +
      '.work-track{position:relative;width:620px;height:30px}');
    let chat = '';
    MSGS.forEach(([m, me]) => { chat += '<p class="work-b' + (me ? ' work-me' : '') + '">' + m + '</p>'; });
    let rows = '';
    ROWS.forEach(([n], i) => {
      rows += '<div class="work-row" style="top:' + (110 + i * 70) + 'px"><p class="label" style="margin:0;width:200px">' + n + '</p>' +
        '<div class="work-track"><div class="bar work-bar" style="left:0;top:0;width:620px"></div></div></div>';
    });
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="panel work-panel" style="left:140px;top:470px;width:960px;height:420px">' +
      '<div class="words" style="left:36px;top:30px"><p class="label">Harvest and sales log, this week</p></div>' + rows + '</div>' +
      '<div class="work-phone"><div class="work-head"><p class="label" style="margin:0">Farm Manager</p><p class="label" style="margin:0">06:30</p></div>' +
      '<div class="work-chat">' + chat + '</div></div>' +
      '<div class="words" style="left:140px;top:120px;width:1060px"><h2 class="line">Daily work</h2>' +
      '<p class="sub work-sub">Voice notes in, log lines out</p></div></div>'));
    this.line = kit.stage.querySelector('.line');
    this.sub = kit.stage.querySelector('.work-sub').style;
    this.phone = kit.stage.querySelector('.work-phone').style;
    this.panel = kit.stage.querySelector('.work-panel').style;
    this.msgs = [...kit.stage.querySelectorAll('.work-b')].map((e) => e.style);
    this.bars = [...kit.stage.querySelectorAll('.work-bar')].map((e) => e.style);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.1);
    const s = eo(seg(t, 0.5, 1));
    this.sub.opacity = s;
    this.sub.transform = 'translateY(' + lerp(16, 0, s) + 'px)';
    const ph = eo(seg(t, 0.2, 0.8));
    this.phone.opacity = ph;
    this.phone.transform = 'translate(' + lerp(60, 0, ph) + 'px,' + lerp(0, -12, seg(t, 0, 5)) + 'px)';
    this.msgs.forEach((m, i) => {
      const p = eo(seg(t, AT[i], AT[i] + 0.2));
      m.opacity = p;
      m.transform = 'translateY(' + lerp(16, 0, p) + 'px) scale(' + lerp(0.96, 1, p) + ')';
    });
    this.panel.opacity = eo(seg(t, 0.6, 1.1));
    this.bars.forEach((b, i) => {
      const [, w0, w1] = ROWS[i];
      const grow = eo(seg(t, 0.9 + i * 0.12, 1.5 + i * 0.12)) * w0;
      const bump = eob(seg(t, 3.6 + i * 0.08, 4.1 + i * 0.08), 1.4) * (w1 - w0);
      b.transform = 'scaleX(' + Math.max(0.001, grow + bump) + ')';
    });
  },
});
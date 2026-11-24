window.FARM = {
  figure(kit, o) {
    const s = o.s || 1, body = o.body || 'paper-lt';
    let g = '<g class="' + (o.cls || '') + '" transform="translate(' + o.x + ' ' + o.y + ') scale(' + s + ')">' +
      '<path class="' + body + '" d="M-62 0 L-48 -128 Q0 -150 48 -128 L62 0 Z"/>';
    if (o.suit) g += '<path class="paper-hi" d="M-20 -136 L0 -96 L20 -136 Z"/><rect class="eye" x="-5" y="-112" width="10" height="60" rx="4"/>';
    g += '<circle class="paper-hi" cx="0" cy="-178" r="42"/>' +
      '<circle class="eye" cx="-14" cy="-180" r="5"/><circle class="eye" cx="14" cy="-180" r="5"/>';
    if (o.hat) g += '<ellipse class="paper-lt" cx="0" cy="-210" rx="74" ry="13"/><path class="paper-lt" d="M-34 -212 Q-30 -252 0 -254 Q30 -252 34 -212 Z"/>';
    return g + '</g>';
  },
};
/**
 * 원본 스파게티 코드 - 테스트 비교용
 */
function calc(items, tax, disc, type, mem) {
  let t = 0; let r = [];
  for (let i = 0; i < items.length; i++) {
    let p = items[i].price; let q = items[i].qty;
    if (type === 'wholesale' && q > 100) { p = p * 0.8; }
    else if (type === 'wholesale' && q > 50) { p = p * 0.9; }
    else if (type === 'vip') { p = p * 0.85; }
    let sub = p * q;
    if (disc > 0) { sub = sub - (sub * disc / 100); }
    let tx = sub * tax / 100; let total = sub + tx;
    t = t + total;
    r.push({name: items[i].name, price: p, qty: q, subtotal: sub, tax: tx, total: total});
    if (mem) { if (!mem[items[i].name]) { mem[items[i].name] = 0; } mem[items[i].name] = mem[items[i].name] + total; }
  }
  if (t > 10000) { t = t - (t * 0.05); }
  return {items: r, grandTotal: t};
}

module.exports = { calc };

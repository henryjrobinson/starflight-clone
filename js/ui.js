// Sidebar menu, message log, status panel. Menus are lists of
// {key, label, fn, disabled}. Modes with ship movement set nav:false so
// arrow keys steer the ship instead of the menu.
SF.ui = {
  menu: { title: '', items: [], sel: 0, nav: true },
};

SF.ui.log = function (msg, cls) {
  const logEl = document.getElementById('log');
  const line = document.createElement('div');
  line.className = 'logline ' + (cls || '');
  line.textContent = msg;
  logEl.appendChild(line);
  while (logEl.children.length > 120) logEl.removeChild(logEl.children[0]);
  logEl.scrollTop = logEl.scrollHeight;
};

SF.ui.setMenu = function (title, items, opts) {
  SF.ui.menu = {
    title: title,
    items: items,
    sel: items.findIndex(i => !i.disabled),
    nav: !opts || opts.nav !== false,
  };
  SF.ui.renderMenu();
};

SF.ui.renderMenu = function () {
  const m = SF.ui.menu;
  const root = document.getElementById('menu');
  root.textContent = '';
  const titleEl = document.createElement('div');
  titleEl.className = 'menu-title';
  titleEl.textContent = m.title;
  root.appendChild(titleEl);
  m.items.forEach(function (item, i) {
    const el = document.createElement('div');
    el.className = 'mi' + (i === m.sel && m.nav ? ' sel' : '') + (item.disabled ? ' dis' : '');
    el.textContent = (item.key ? '[' + item.key + '] ' : '    ') + item.label;
    el.onclick = function () {
      if (!item.disabled) { m.sel = i; item.fn(); }
    };
    root.appendChild(el);
  });
};

// Returns true if the key was consumed by the menu.
SF.ui.menuKey = function (e) {
  const m = SF.ui.menu;
  if (!m.items.length) return false;
  const k = e.key;
  // hotkeys always work
  const hot = m.items.find(i => i.key && i.key.toLowerCase() === k.toLowerCase() && !i.disabled);
  if (hot) { hot.fn(); return true; }
  if (!m.nav) return false;
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    const dir = k === 'ArrowUp' ? -1 : 1;
    for (let step = 0; step < m.items.length; step++) {
      m.sel = (m.sel + dir + m.items.length) % m.items.length;
      if (!m.items[m.sel].disabled) break;
    }
    SF.ui.renderMenu();
    return true;
  }
  if (k === 'Enter' || k === ' ') {
    const item = m.items[m.sel];
    if (item && !item.disabled) item.fn();
    return true;
  }
  return false;
};

SF.ui.fmt = function (n) {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

SF.ui.setStatus = function () {
  const s = SF.s;
  const el = document.getElementById('status');
  el.textContent = '';
  if (!s) return;
  const rows = [
    ['DATE', SF.dateString(s)],
    ['CREDITS', SF.ui.fmt(s.credits) + ' cr'],
    ['FUEL', s.ship.fuel.toFixed(1) + ' / ' + SF.fuelMax(s)],
    ['HULL', Math.ceil(s.ship.hull) + ' / ' + s.ship.hullMax],
    ['CARGO', SF.cargoUsed(s) + ' / ' + SF.cargoMax(s) + ' cu'],
    ['POS', Math.round(s.hx) + ',' + Math.round(s.hy)],
  ];
  rows.forEach(function (r) {
    const row = document.createElement('div');
    row.className = 'srow';
    const lbl = document.createElement('span');
    lbl.className = 'slbl';
    lbl.textContent = r[0];
    const val = document.createElement('span');
    val.textContent = r[1];
    row.appendChild(lbl);
    row.appendChild(val);
    el.appendChild(row);
  });
};

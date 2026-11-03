const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('mobile-style demos preserve screen scroll after same-view updates', () => {
  const apps = [
    ['restaurant', 'public/demos/restaurant/app.js', 'lastScrollKey', '#restaurant-screen'],
    ['education', 'public/demos/education/app.js', 'lastViewScrollKey', '.phone-main'],
    ['property', 'public/demos/property/app.js', 'lastViewScrollKey', '.phone-main'],
    ['logistics', 'public/demos/logistics/app.js', 'lastViewScrollKey', '.app-content'],
    ['security', 'public/demos/security/app.js', 'lastViewScrollKey', '.main'],
    ['construction', 'public/demos/construction/app.js', 'lastViewScrollKey', '.phone-main'],
    ['vehicle tracking', 'public/demos/vehicle-tracking/app.js', 'lastViewScrollKey', '#tracking-screen'],
  ];
  for (const [name, file, state, selector] of apps) {
    const source = read(file);
    assert.ok(source.includes('scrollTop=previousScroll'), name + ' should restore the previous scroll position');
    assert.ok(source.includes(state), name + ' should compare screen/view identity');
    assert.ok(source.includes(selector), name + ' should target its actual scroll host');
    assert.doesNotMatch(source, /scrollTo\(\{\s*top:\s*0/, name + ' should not force-scroll to top');
  }
});

test('all desktop demos keep scroll position for rerenders without forced top jumps', () => {
  const apps = [
    'public/demos/retail/retail-app.js',
    'public/demos/field-services/app.js',
    'public/demos/healthcare/app.js',
    'public/demos/fire-safety/demo.html',
  ];
  for (const file of apps) {
    const source = read(file);
    assert.ok(source.includes('document.scrollingElement?.scrollTop'), file);
    assert.ok(source.includes('scrollTop=previousPosition'), file);
    assert.doesNotMatch(source, /window\.scrollTo\(\{\s*top:\s*0/, file);
  }
});

test('restaurant and vehicle tracking feedback is a fixed, dismissible toast', () => {
  for (const demo of ['restaurant', 'vehicle-tracking']) {
    const html = read('public/demos/' + demo + '/app.js');
    const css = read('public/demos/' + demo + '/styles.css');
    assert.match(html, /class="flash-toast"/, demo);
    assert.match(html, /data-action="dismiss"/, demo);
    assert.match(css, /\.flash-toast\{position:fixed/, demo);
  }
});

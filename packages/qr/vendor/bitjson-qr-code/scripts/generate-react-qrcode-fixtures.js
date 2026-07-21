const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');

const outputPath = path.join(
  __dirname,
  '..',
  'src',
  'assets',
  'react-qrcode-fixtures.js'
);

const bchIcon =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#70C559"/><path fill="#fff" d="M17 15h11c5 0 8 2 8 6 0 3-2 5-5 6 3 1 4 3 4 6 0 5-4 8-10 8H13l4-26zm5 15-1 6h5c3 0 5-1 5-3 0-2-2-3-5-3h-4zm2-10-1 5h5c2 0 4-1 4-3s-2-2-4-2h-4z"/></svg>'
  );

const payloads = [
  {
    id: 'url',
    label: 'URL',
    value: 'https://bitjson.com/react-qrcode-lab',
  },
  {
    id: 'text',
    label: 'Text',
    value: 'React QRCode adapter lab text payload',
  },
  {
    id: 'email',
    label: 'Email',
    value: 'mailto:hello@bitjson.com?subject=QR%20Adapter%20Lab',
  },
  {
    id: 'phone-sms',
    label: 'Phone / SMS',
    value: 'SMSTO:+15551234567:Testing animated QR adapters',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    value: 'WIFI:T:WPA;S:Bitjson Lab;P:adapter-demo;;',
  },
  {
    id: 'vcard',
    label: 'vCard',
    value:
      'BEGIN:VCARD\nVERSION:3.0\nN:Adapter;QR\nFN:QR Adapter Lab\nORG:Bitjson\nURL:https://bitjson.com\nEND:VCARD',
  },
  {
    id: 'payment',
    label: 'Payment',
    value: 'bitcoincash:qr9f4z5x5examplepaymentrequest?amount=0.001',
  },
];

const colorPairs = [
  {
    id: 'classic',
    label: 'Classic',
    fgColor: '#000000',
    bgColor: '#FFFFFF',
  },
  {
    id: 'green',
    label: 'Green',
    fgColor: '#1C7D43',
    bgColor: '#FFFFFF',
  },
  {
    id: 'navy',
    label: 'Navy',
    fgColor: '#273043',
    bgColor: '#F8FAFC',
  },
];

const imageModes = [
  { id: 'none', label: 'No Image' },
  {
    id: 'image-excavate',
    label: 'Image Excavated',
    imageSettings: {
      src: bchIcon,
      width: 24,
      height: 24,
      excavate: true,
    },
  },
  {
    id: 'image-overlay',
    label: 'Image Overlay',
    imageSettings: {
      src: bchIcon,
      width: 24,
      height: 24,
      excavate: false,
      opacity: 0.92,
    },
  },
];

const cases = [];

function addCase(id, label, category, props) {
  cases.push({
    id,
    label,
    category,
    props: {
      size: 128,
      title: label,
      ...props,
    },
  });
}

payloads.forEach((payload) => {
  addCase(`payload-${payload.id}`, payload.label, 'value', {
    value: payload.value,
    level: 'H',
    marginSize: 4,
  });
});

['L', 'M', 'Q', 'H'].forEach((level) => {
  addCase(`level-${level}`, `Level ${level}`, 'level', {
    value: payloads[0].value,
    level,
    marginSize: 4,
  });
});

[0, 2, 4].forEach((marginSize) => {
  addCase(`margin-${marginSize}`, `Margin ${marginSize}`, 'marginSize', {
    value: payloads[0].value,
    level: 'H',
    marginSize,
  });
});

[1, 5, 10].forEach((minVersion) => {
  addCase(`version-${minVersion}`, `Min Version ${minVersion}`, 'minVersion', {
    value: payloads[0].value,
    level: 'H',
    marginSize: 4,
    minVersion,
  });
});

[
  { id: 'boost-on', label: 'Boost On', boostLevel: true },
  { id: 'boost-off', label: 'Boost Off', boostLevel: false },
].forEach((boost) => {
  addCase(boost.id, boost.label, 'boostLevel', {
    value: payloads[0].value,
    level: 'M',
    marginSize: 4,
    boostLevel: boost.boostLevel,
  });
});

colorPairs.forEach((pair) => {
  addCase(`color-${pair.id}`, pair.label, 'color', {
    value: payloads[0].value,
    level: 'H',
    marginSize: 4,
    fgColor: pair.fgColor,
    bgColor: pair.bgColor,
  });
});

imageModes.forEach((mode) => {
  addCase(mode.id, mode.label, 'imageSettings', {
    value: payloads[0].value,
    level: 'H',
    marginSize: 4,
    imageSettings: mode.imageSettings,
  });
});

const fixtures = cases.map((fixture) => {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, fixture.props)
  );
  return {
    id: fixture.id,
    label: fixture.label,
    category: fixture.category,
    props: fixture.props,
    svg,
  };
});

const requiredCategories = [
  'value',
  'level',
  'marginSize',
  'minVersion',
  'boostLevel',
  'color',
  'imageSettings',
];

requiredCategories.forEach((category) => {
  if (!fixtures.some((fixture) => fixture.category === category)) {
    throw new Error(`Missing fixture category: ${category}`);
  }
});

fixtures.forEach((fixture) => {
  if (!fixture.svg.includes('<path') || !fixture.svg.includes('fill=')) {
    throw new Error(`Fixture does not look like a QRCodeSVG output: ${fixture.id}`);
  }
});

imageModes
  .filter((mode) => mode.imageSettings)
  .forEach((mode) => {
    const fixture = fixtures.find((candidate) => candidate.id === mode.id);
    if (!fixture || !fixture.svg.includes('<image')) {
      throw new Error(`Image fixture is missing image markup: ${mode.id}`);
    }
  });

const body = `window.reactQRCodeFixtures = ${JSON.stringify(fixtures, null, 2)};\n`;
fs.writeFileSync(outputPath, body);
console.log(`Generated ${fixtures.length} qrcode.react fixtures at ${outputPath}`);

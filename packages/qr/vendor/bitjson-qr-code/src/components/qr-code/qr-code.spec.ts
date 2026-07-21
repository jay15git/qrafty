import { TestWindow } from '@stencil/core/testing';
import {
  dotMatrixAnimationPresets,
  getAnimationPreset,
  QRCodeEntity,
  standardAnimationPresets,
} from './animations';
import {
  adaptExternalQRCodeSVG,
  parseHorizontalPathRuns,
} from './qr-svg-adapter';

(global as any).requestAnimationFrame =
  (global as any).requestAnimationFrame ||
  ((callback) => setTimeout(() => callback(Date.now()), 16));
(global as any).cancelAnimationFrame =
  (global as any).cancelAnimationFrame || ((id) => clearTimeout(id));
(global as any).Element = (global as any).Element || function Element() {};
(global as any).Element.prototype = (global as any).Element.prototype || {};
(global as any).Element.prototype.animate =
  (global as any).Element.prototype.animate ||
  function () {
    return {
      cancel() {},
      finished: Promise.resolve(),
      pause() {},
      play() {},
    };
  };

jest.mock('just-animate/lib.es2015/web', () => ({
  waapiPlugin: {},
}));
jest.mock('just-animate/lib.es2015/tools', () => ({
  player() {},
}));
jest.mock('just-animate', () => ({
  addPlugin: jest.fn(),
  animate: jest.fn(),
}));

const { BpQRCode } = require('./qr-code');
const { animate } = require('just-animate');
const fs = require('fs');
const path = require('path');

const visibleMatrixPresets = [
  'NeonDrift',
  'PulseLadder',
  'CoreSpiral',
  'BlockDrop',
  'EchoRing',
  'MobiusRun',
];

const hiddenMatrixPresets = [
  'TwinOrbit',
  'OriginWave',
  'PrismBloom',
  'FluxColumns',
  'HelixGlow',
  'HelixCore',
  'StrobeStack',
  'CRTGlide',
  'GlyphPulse',
  'CoreRotor',
  'InfinityRun',
];

const matrixPresets = [...visibleMatrixPresets, ...hiddenMatrixPresets];

const qrcodeReactStyleSVG =
  '<svg height="128" width="128" viewBox="0 0 13 13" role="img"><path fill="#FFFFFF" d="M0,0 h13v13H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M4 4h7v1H4zM4 5h1v1H4zM6 5h3v1H6zM10 5h1v1H10zM4 6h1v1H4zM6 6h3v1H6zM10 6h1v1H10zM4 7h1v1H4zM6 7h3v1H6zM10 7h1v1H10zM4 8h1v1H4zM6 8h3v1H6zM10 8h1v1H10zM4 9h1v1H4zM10 9h1v1H10zM4 10h7v1H4zM12,12 h1v1H12z" shape-rendering="crispEdges"></path></svg>';

const animatableExternalSVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><circle class="module" data-column="0" data-row="0" cx="0.5" cy="0.5" r="0.5"/><circle class="module" data-column="1" data-row="1" cx="1.5" cy="1.5" r="0.5"/></svg>';

const reactQRCodeFixtureScript = fs.readFileSync(
  path.join(__dirname, '../../assets/react-qrcode-fixtures.js'),
  'utf8'
);
const reactQRCodeFixtures = JSON.parse(
  reactQRCodeFixtureScript
    .replace(/^window\.reactQRCodeFixtures = /, '')
    .replace(/;\s*$/, '')
);

const numberedMatrixComponentPresets = Array.from(
  { length: 20 },
  (_, index) => `DotmSquare${index + 1}`
);

function firstKeyframeValue(values: any[]) {
  const first = values[0];
  return typeof first === 'number' ? first : first.value;
}

function lastKeyframeValue(values: any[]) {
  const last = values[values.length - 1];
  return typeof last === 'number' ? last : last.value;
}

describe('qr-code', () => {
  it('should build', () => {
    expect(new BpQRCode()).toBeTruthy();
  });

  describe('external svg adapter', () => {
    it('expands qrcode.react-style path runs into individual cells', () => {
      const runs = parseHorizontalPathRuns('M4 4h7v1H4zM10,5 h1v1H10z');

      expect(runs).toEqual([
        { x: 4, y: 4, width: 7, height: 1 },
        { x: 10, y: 5, width: 1, height: 1 },
      ]);
    });

    it('parses a qrcode.react-style merged SVG into animatable modules', () => {
      const adapted = adaptExternalQRCodeSVG(qrcodeReactStyleSVG, {
        moduleColor: '#111111',
        positionRingColor: '#222222',
        positionCenterColor: '#333333',
        squares: false,
      });

      expect(adapted).toBeTruthy();
      expect(adapted.moduleCount).toBe(9);
      expect(adapted.margin).toBe(4);
      expect(adapted.svg).toContain('class="module"');
      expect(adapted.svg).toContain('class="position-ring"');
      expect(adapted.svg).toContain('class="position-center"');
      expect(adapted.svg.match(/data-column="/g).length).toBe(37);
    });

    it('renders adapted external SVG modules as squares when requested', () => {
      const adapted = adaptExternalQRCodeSVG(qrcodeReactStyleSVG, {
        moduleColor: '#111111',
        positionRingColor: '#222222',
        positionCenterColor: '#333333',
        squares: true,
      });

      expect(adapted.svg).toContain('<rect class="module"');
      expect(adapted.svg).not.toContain('<circle class="module"');
    });

    it('passes through already animatable SVG modules', () => {
      const adapted = adaptExternalQRCodeSVG(animatableExternalSVG, {
        moduleColor: '#111111',
        positionRingColor: '#222222',
        positionCenterColor: '#333333',
        squares: false,
      });

      expect(adapted).toBeTruthy();
      expect(adapted.moduleCount).toBe(2);
      expect(adapted.svg).toContain('data-column="1"');
      expect(adapted.svg).toContain('width="100%"');
    });

    it('rejects unsupported SVG path shapes', () => {
      const adapted = adaptExternalQRCodeSVG(
        '<svg viewBox="0 0 10 10"><path fill="#000" d="M1 1L5 5z"/></svg>',
        {
          moduleColor: '#111111',
          positionRingColor: '#222222',
          positionCenterColor: '#333333',
          squares: false,
        }
      );

      expect(adapted).toBeUndefined();
    });

    it('ships qrcode.react fixtures for each documented setting category', () => {
      expect(reactQRCodeFixtures.length).toBe(25);
      expect(
        Array.from(new Set(reactQRCodeFixtures.map((fixture) => fixture.category))).sort()
      ).toEqual([
        'boostLevel',
        'color',
        'imageSettings',
        'level',
        'marginSize',
        'minVersion',
        'value',
      ]);
      reactQRCodeFixtures.forEach((fixture) => {
        expect(fixture.svg).toContain('<path');
        expect(fixture.svg).toContain('fill=');
      });
      expect(
        reactQRCodeFixtures
          .filter((fixture) => fixture.category === 'imageSettings')
          .some((fixture) => fixture.svg.indexOf('<image') !== -1)
      ).toBe(true);
    });

    it('adapts generated qrcode.react fixtures across levels, margins, boost, and images', () => {
      const fixtureIds = [
        'level-L',
        'level-M',
        'level-Q',
        'level-H',
        'margin-0',
        'margin-4',
        'boost-off',
        'image-excavate',
        'image-overlay',
      ];

      fixtureIds.forEach((id) => {
        const fixture = reactQRCodeFixtures.find((candidate) => candidate.id === id);
        const adapted = adaptExternalQRCodeSVG(fixture.svg, {
          moduleColor: '#111111',
          positionRingColor: '#222222',
          positionCenterColor: '#333333',
          squares: false,
        });

        expect(adapted).toBeTruthy();
        expect(adapted.svg).toContain('class="module"');
        if (id.indexOf('image-') === 0) {
          expect(adapted.svg).toContain('<image');
        }
      });
    });
  });

  describe('animation presets', () => {
    it('resolves premium animation preset names', () => {
      expect(getAnimationPreset('SubtlePulse')).toEqual(expect.any(Function));
      expect(getAnimationPreset('FinderPing')).toEqual(expect.any(Function));
      expect(getAnimationPreset('SoftMaterialize')).toEqual(expect.any(Function));
      expect(getAnimationPreset('CenterBloom')).toEqual(expect.any(Function));
      expect(getAnimationPreset('CornerSweep')).toEqual(expect.any(Function));
      expect(getAnimationPreset('OrbitReveal')).toEqual(expect.any(Function));
      expect(getAnimationPreset('DiamondGlint')).toEqual(expect.any(Function));
      expect(getAnimationPreset('SignalScan')).toEqual(expect.any(Function));
      expect(getAnimationPreset('ConfettiPop')).toEqual(expect.any(Function));
      expect(getAnimationPreset('SpiralBloom')).toEqual(expect.any(Function));
      expect(getAnimationPreset('BubbleCascade')).toEqual(expect.any(Function));
      expect(getAnimationPreset('KaleidoPulse')).toEqual(expect.any(Function));
      expect(getAnimationPreset('FireflyTwinkle')).toEqual(expect.any(Function));
      expect(getAnimationPreset('MagneticRipple')).toEqual(expect.any(Function));
      expect(getAnimationPreset('ParallaxTiles')).toEqual(expect.any(Function));
      expect(getAnimationPreset('ConstellationTrace')).toEqual(expect.any(Function));
      expect(getAnimationPreset('ApertureReveal')).toEqual(expect.any(Function));
      expect(getAnimationPreset('LensFocus')).toEqual(expect.any(Function));
      expect(getAnimationPreset('ReceiptPrint')).toEqual(expect.any(Function));
      expect(getAnimationPreset('FlipClock')).toEqual(expect.any(Function));
      visibleMatrixPresets.forEach((preset) => {
        expect(getAnimationPreset(preset)).toEqual(expect.any(Function));
      });
      hiddenMatrixPresets.forEach((preset) => {
        expect(getAnimationPreset(preset)).toEqual(expect.any(Function));
      });
    });

    it('separates standard and dot-matrix preset families without overlap', () => {
      expect(standardAnimationPresets).toEqual([
        'FadeInTopDown',
        'FadeInCenterOut',
        'RadialRipple',
        'RadialRippleIn',
        'MaterializeIn',
        'SubtlePulse',
        'FinderPing',
        'SoftMaterialize',
        'CenterBloom',
        'CornerSweep',
        'OrbitReveal',
        'DiamondGlint',
        'SignalScan',
        'ConfettiPop',
        'SpiralBloom',
        'BubbleCascade',
        'KaleidoPulse',
        'FireflyTwinkle',
        'MagneticRipple',
        'ParallaxTiles',
        'ConstellationTrace',
        'ApertureReveal',
        'LensFocus',
        'ReceiptPrint',
        'FlipClock',
        'WaveInterference',
        'QuantumMaterialize',
        'MagneticSnap',
        'HoloFlicker',
        'SignalGlitch',
        'ShockwaveJolt',
        'TideRise',
        'GravityCollapse',
      ]);
      expect(dotMatrixAnimationPresets).toEqual(matrixPresets);
      const overlap = standardAnimationPresets.filter((preset) =>
        dotMatrixAnimationPresets.indexOf(preset as any) > -1
      );
      expect(overlap).toEqual([]);
    });

    it('returns readable module and icon keyframes for playful presets', () => {
      const animation = getAnimationPreset('SpiralBloom');
      const moduleAnimation = animation(
        'module-target',
        4,
        6,
        29,
        QRCodeEntity.Module
      ) as any;
      const iconAnimation = animation(
        'icon-target',
        14.5,
        14.5,
        29,
        QRCodeEntity.Icon
      ) as any;

      expect(moduleAnimation.targets).toEqual('module-target');
      expect(moduleAnimation.from).toEqual(expect.any(Number));
      expect(moduleAnimation.duration).toBeGreaterThan(0);
      expect(moduleAnimation.web.opacity).toEqual([0, 1]);
      expect(moduleAnimation.web.scale).toEqual([0.12, 1.28, 0.94, 1]);
      expect(moduleAnimation.web.filter).toBeUndefined();

      expect(iconAnimation.targets).toEqual('icon-target');
      expect(iconAnimation.duration).toBeGreaterThan(
        moduleAnimation.duration
      );
      expect(iconAnimation.web.opacity).toEqual([0.72, 1]);
      expect(iconAnimation.web.scale).toEqual([0.76, 1.12, 0.98, 1]);
    });

    it('returns performant keyframes for new premium presets', () => {
      [
        'ConstellationTrace',
        'ApertureReveal',
        'LensFocus',
        'ReceiptPrint',
        'FlipClock',
      ].forEach((preset) => {
        const animation = getAnimationPreset(preset);
        const moduleAnimation = animation(
          `${preset}-module`,
          4,
          6,
          29,
          QRCodeEntity.Module
        ) as any;
        const iconAnimation = animation(
          `${preset}-icon`,
          14.5,
          14.5,
          29,
          QRCodeEntity.Icon
        ) as any;

        expect(moduleAnimation.targets).toEqual(`${preset}-module`);
        expect(moduleAnimation.from).toEqual(expect.any(Number));
        expect(moduleAnimation.duration).toBeGreaterThan(0);
        expect(moduleAnimation.web.opacity).toBeDefined();
        expect(moduleAnimation.web.scale).toBeDefined();
        expect(moduleAnimation.web.filter).toBeUndefined();
        expect(moduleAnimation.web.fill).toBeUndefined();

        expect(iconAnimation.targets).toEqual(`${preset}-icon`);
        expect(iconAnimation.from).toEqual(expect.any(Number));
        expect(iconAnimation.duration).toBeGreaterThan(0);
        expect(iconAnimation.web.opacity).toBeDefined();
        expect(iconAnimation.web.scale).toBeDefined();
        expect(iconAnimation.web.filter).toBeUndefined();
        expect(iconAnimation.web.fill).toBeUndefined();
      });
    });

    it('uses distinct timing for focus, print, and flip premium presets', () => {
      const lensFocus = getAnimationPreset('LensFocus');
      const receiptPrint = getAnimationPreset('ReceiptPrint');
      const flipClock = getAnimationPreset('FlipClock');

      const lensCorner = lensFocus(
        'lens-corner',
        0,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const lensEdge = lensFocus(
        'lens-edge',
        14,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const lensInner = lensFocus(
        'lens-inner',
        14,
        14,
        29,
        QRCodeEntity.Module
      ) as any;
      const lensFinder = lensFocus(
        'lens-finder',
        0,
        0,
        29,
        QRCodeEntity.PositionRing
      ) as any;

      expect(new Set([lensCorner.from, lensEdge.from, lensInner.from]).size).toBe(3);
      expect(lensFinder.from).toBeLessThan(lensCorner.from);
      expect(lensCorner.web.filter).toBeUndefined();
      expect(lensCorner.web.fill).toBeUndefined();

      const printTop = receiptPrint(
        'print-top',
        4,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const printMiddle = receiptPrint(
        'print-middle',
        4,
        14,
        29,
        QRCodeEntity.Module
      ) as any;
      const printGrain = receiptPrint(
        'print-grain',
        20,
        14,
        29,
        QRCodeEntity.Module
      ) as any;

      expect(printTop.from).toBeLessThan(printMiddle.from);
      expect(printMiddle.from).not.toBe(printGrain.from);
      expect(printTop.web.opacity).toEqual([0.14, 0.42, 1, 0.86, 1]);
      expect(printTop.web.filter).toBeUndefined();
      expect(printTop.web.fill).toBeUndefined();

      const flipLeft = flipClock(
        'flip-left',
        0,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const flipRight = flipClock(
        'flip-right',
        28,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const flipNextRow = flipClock(
        'flip-next-row',
        28,
        10,
        29,
        QRCodeEntity.Module
      ) as any;

      expect(new Set([flipLeft.from, flipRight.from, flipNextRow.from]).size).toBe(3);
      expect(flipLeft.web.scale).toEqual([0.58, 1.2, 0.82, 1.08, 1]);
      expect(flipLeft.web.filter).toBeUndefined();
      expect(flipLeft.web.fill).toBeUndefined();
    });

    it('uses grid-path and shutter timing for dot-matrix-inspired premium presets', () => {
      const constellation = getAnimationPreset('ConstellationTrace');
      const aperture = getAnimationPreset('ApertureReveal');

      const constellationStart = constellation(
        'constellation-start',
        0,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const constellationElbow = constellation(
        'constellation-elbow',
        20,
        8,
        29,
        QRCodeEntity.Module
      ) as any;
      const constellationLadder = constellation(
        'constellation-ladder',
        28,
        28,
        29,
        QRCodeEntity.Module
      ) as any;

      expect(
        new Set([
          constellationStart.from,
          constellationElbow.from,
          constellationLadder.from,
        ]).size
      ).toBe(3);
      expect(constellationStart.easing).toEqual('steps(7, end)');
      expect(constellationStart.web.opacity.length).toBeGreaterThan(5);

      const apertureOuter = aperture(
        'aperture-outer',
        0,
        0,
        29,
        QRCodeEntity.Module
      ) as any;
      const apertureMidBand = aperture(
        'aperture-mid-band',
        14,
        4,
        29,
        QRCodeEntity.Module
      ) as any;
      const apertureCenter = aperture(
        'aperture-center',
        14,
        14,
        29,
        QRCodeEntity.Module
      ) as any;

      expect(apertureOuter.from).toBeLessThan(apertureCenter.from);
      expect(apertureMidBand.from).not.toBe(apertureOuter.from);
      expect((aperture as any).easing).toBeUndefined();
      expect(apertureOuter.easing).toEqual('steps(6, end)');
      expect(apertureOuter.web.opacity).toEqual([0, 0.72, 1, 0.82, 1]);
    });

    it('keeps matrix presets as source-style opacity-only animations', () => {
      matrixPresets.forEach((preset) => {
        const animation = getAnimationPreset(preset)(
          'module-target',
          4,
          6,
          29,
          QRCodeEntity.Module
        ) as any;

        expect(animation.targets).toEqual('module-target');
        expect(animation.from).toEqual(expect.any(Number));
        expect(animation.duration).toBeGreaterThan(0);
        expect(animation.web.opacity).toBeDefined();
        expect(animation.web.scale).toBeUndefined();
        expect(animation.web.filter).toBeUndefined();
        expect(animation.web.fill).toBeUndefined();
      });
    });

    it('keeps hidden matrix names distinct from their visible category presets', () => {
      const representativePairs = [
        ['TwinOrbit', 'EchoRing'],
        ['GlyphPulse', 'PulseLadder'],
        ['StrobeStack', 'BlockDrop'],
        ['HelixGlow', 'HelixCore'],
        ['InfinityRun', 'MobiusRun'],
      ];

      representativePairs.forEach(([hidden, visible]) => {
        const hiddenAnimation = getAnimationPreset(hidden)(
          'module-target',
          4,
          6,
          29,
          QRCodeEntity.Module
        );
        const visibleAnimation = getAnimationPreset(visible)(
          'module-target',
          4,
          6,
          29,
          QRCodeEntity.Module
        );

        expect(hiddenAnimation).not.toEqual(visibleAnimation);
      });
    });

    it('preserves matrix route timing from the source loaders', () => {
      const spiral = getAnimationPreset('CoreSpiral');
      const rings = getAnimationPreset('TwinOrbit');
      const drift = getAnimationPreset('NeonDrift');
      const helix = getAnimationPreset('HelixGlow');

      expect(
        (spiral('outer', 0, 0, 29, QRCodeEntity.Module) as any).from
      ).toBeLessThan(
        (spiral('center', 14, 14, 29, QRCodeEntity.Module) as any).from
      );
      expect((rings('outer', 0, 0, 29, QRCodeEntity.Module) as any).from).toBeCloseTo(
        0,
        5
      );
      expect(
        (rings('middle', 7, 14, 29, QRCodeEntity.Module) as any).from
      ).toBeGreaterThan(0);
      expect((drift('start', 28, 0, 29, QRCodeEntity.Module) as any).from).toBeCloseTo(
        0,
        5
      );
      expect(
        (drift('later', 0, 28, 29, QRCodeEntity.Module) as any).from
      ).toBeGreaterThan(0);
      expect(
        (helix('phase', 14, 14, 29, QRCodeEntity.Module) as any).web.opacity
          .length
      ).toBeGreaterThan(10);
    });

    it('preserves upstream matrix cycle durations and first-step route identity', () => {
      const expectedDurations = {
        NeonDrift: 1500,
        PulseLadder: 1500,
        CoreSpiral: 1500,
        TwinOrbit: 1500,
        FluxColumns: 1500,
        BlockDrop: 1900,
        StrobeStack: 2000,
        GlyphPulse: 5200,
        CRTGlide: 1500,
        EchoRing: 1500,
        OriginWave: 1500,
        CoreRotor: 1550,
        PrismBloom: 1700,
        HelixGlow: 1600,
        HelixCore: 1400,
        InfinityRun: 1700,
        MobiusRun: 1600,
      };

      Object.keys(expectedDurations).forEach((preset) => {
        const duration = expectedDurations[preset];
        expect(
          (getAnimationPreset(preset)(
            `${preset}-target`,
            0,
            0,
            29,
            QRCodeEntity.Module
          ) as any).duration
        ).toBe(duration);
      });

      expect(
        firstKeyframeValue(
          (getAnimationPreset('PulseLadder')(
            'snake-start',
            0,
            28,
            29,
            QRCodeEntity.Module
          ) as any).web.opacity
        )
      ).toBeGreaterThan(0.9);
      expect(
        firstKeyframeValue(
          (getAnimationPreset('BlockDrop')(
            'settled-bottom-row',
            0,
            28,
            29,
            QRCodeEntity.Module
          ) as any).web.opacity
        )
      ).toBeGreaterThan(0.35);
      expect(
        lastKeyframeValue(
          (getAnimationPreset('NeonDrift')(
            'source-ending',
            0,
            0,
            29,
            QRCodeEntity.Module
          ) as any).web.opacity
        )
      ).toBe(0.08);
    });

    it('scales animation timing with animationSpeed settings', () => {
      const animation = getAnimationPreset('CoreSpiral');
      const normal = animation(
        'normal',
        28,
        28,
        29,
        QRCodeEntity.Module
      ) as any;
      const faster = animation(
        'faster',
        28,
        28,
        29,
        QRCodeEntity.Module,
        { animationSpeed: 2 }
      ) as any;

      expect(faster.duration).toBe(normal.duration / 2);
      expect(faster.from).toBe(normal.from / 2);
    });

    it('remaps matrix opacity triplet settings without adding color or scale animation by default', () => {
      const dim = getAnimationPreset('NeonDrift')(
        'dimmed',
        0,
        0,
        29,
        QRCodeEntity.Module,
        {
          dotMatrixOpacityBase: 0.2,
          dotMatrixOpacityMid: 0.5,
          dotMatrixOpacityPeak: 0.9,
        }
      ) as any;
      const bright = getAnimationPreset('PulseLadder')(
        'bright',
        0,
        28,
        29,
        QRCodeEntity.Module,
        {
          dotMatrixOpacityBase: 0.2,
          dotMatrixOpacityMid: 0.5,
          dotMatrixOpacityPeak: 0.9,
        }
      ) as any;

      expect(lastKeyframeValue(dim.web.opacity)).toBe(0.1);
      expect(firstKeyframeValue(bright.web.opacity)).toBe(0.9);
      expect(dim.web.scale).toBeUndefined();
      expect(dim.web.fill).toBeUndefined();
      expect(dim.web.filter).toBeUndefined();
    });

    it('maps matrix source brightness to configured base, mid, and peak colors', () => {
      const settings = {
        dotMatrixColorBase: '#123456',
        dotMatrixColorMid: '#abcdef',
        dotMatrixColorPeak: '#ffffff',
      };
      const dim = getAnimationPreset('NeonDrift')(
        'dimmed',
        0,
        0,
        29,
        QRCodeEntity.Module,
        settings
      ) as any;
      const mid = getAnimationPreset('BlockDrop')(
        'mid',
        0,
        28,
        29,
        QRCodeEntity.Module,
        settings
      ) as any;
      const bright = getAnimationPreset('PulseLadder')(
        'bright',
        0,
        28,
        29,
        QRCodeEntity.Module,
        settings
      ) as any;

      expect(lastKeyframeValue(dim.web.fill)).toBe('#123456');
      expect(firstKeyframeValue(mid.web.fill)).toBe('#abcdef');
      expect(firstKeyframeValue(bright.web.fill)).toBe('#ffffff');
      expect(bright.web.scale).toBeUndefined();
      expect(bright.web.filter).toBeUndefined();
    });

    it('ports matrix frame source behavior for glyph, rotor, bloom, and mobius presets', () => {
      const glyph = getAnimationPreset('GlyphPulse');
      const rotor = getAnimationPreset('CoreRotor');
      const bloom = getAnimationPreset('PrismBloom');
      const mobius = getAnimationPreset('MobiusRun');
      const twin = getAnimationPreset('TwinOrbit');

      expect(
        firstKeyframeValue(
          (glyph('outside', 14, 0, 29, QRCodeEntity.Module) as any).web
            .opacity
        )
      ).toBeCloseTo(0.08, 1);
      expect(
        firstKeyframeValue(
          (glyph('gap', 14, 14, 29, QRCodeEntity.Module) as any).web.opacity
        )
      ).toBeCloseTo(0.12, 1);
      expect(
        firstKeyframeValue(
          (rotor('north-tip', 14, 0, 29, QRCodeEntity.Module) as any).web
            .opacity
        )
      ).toBeGreaterThan(0.85);
      expect(
        firstKeyframeValue(
          (bloom('diagonal-star-corner', 0, 0, 29, QRCodeEntity.Module) as any)
            .web.opacity
        )
      ).toBeGreaterThan(0.85);
      expect(
        firstKeyframeValue(
          (mobius('twist-inner', 7, 7, 29, QRCodeEntity.Module) as any).web
            .opacity
        )
      ).toBeGreaterThan(0.45);
      expect(
        firstKeyframeValue(
          (twin('center', 14, 14, 29, QRCodeEntity.Module) as any).web.opacity
        )
      ).toBeCloseTo(0, 1);
    });

    it('rejects numbered matrix component preset names', () => {
      numberedMatrixComponentPresets.forEach((preset) => {
        expect(() => getAnimationPreset(preset)).toThrow(
          `${preset} is not a valid AnimationPreset.`
        );
      });
    });

    it('throws for unknown animation presets', () => {
      expect(() => getAnimationPreset('NotReal')).toThrow(
        'NotReal is not a valid AnimationPreset.'
      );
    });
  });

  describe('automatic animations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('plays the configured animation on an interval', () => {
      const component = new BpQRCode();
      const execute = jest.fn();
      component.autoAnimate = 'SubtlePulse';
      component.autoAnimateInterval = 5000;
      component.prefersReducedMotion = () => false;
      component.executeAnimation = execute;

      component.startAutoAnimation();
      jest.runTimersToTime(4999);
      expect(execute).not.toHaveBeenCalled();

      jest.runTimersToTime(1);
      expect(execute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('does not start interval animations when reduced motion is preferred', () => {
      const component = new BpQRCode();
      const animate = jest.fn();
      component.autoAnimate = 'SubtlePulse';
      component.autoAnimateInterval = 5000;
      component.prefersReducedMotion = () => true;
      component.animateQRCode = animate;

      component.startAutoAnimation();
      jest.runTimersToTime(5000);

      expect(animate).not.toHaveBeenCalled();
    });

    it('restarts interval animations when animation settings change', () => {
      const component = new BpQRCode();
      const execute = jest.fn();
      component.autoAnimate = 'NeonDrift';
      component.autoAnimateInterval = 5000;
      component.prefersReducedMotion = () => false;
      component.executeAnimation = execute;

      component.startAutoAnimation();
      jest.runTimersToTime(4999);
      component.animationSpeed = 2;
      component.restartAutoAnimation();
      jest.runTimersToTime(1);
      expect(execute).not.toHaveBeenCalled();

      component.dotMatrixOpacityBase = 0.2;
      component.restartAutoAnimation();
      jest.runTimersToTime(4999);
      expect(execute).not.toHaveBeenCalled();

      jest.runTimersToTime(1);
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('animation performance behavior', () => {
    function createAnimationComponent() {
      const component = new BpQRCode();
      const shadowRoot = document.createElement('div');
      const module = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      module.classList.add('module');
      module.setAttribute('data-column', '1');
      module.setAttribute('data-row', '2');
      shadowRoot.appendChild(module);
      component.qrCodeElement = { shadowRoot } as any;
      component.moduleCount = 10;
      return { component, module };
    }

    beforeEach(() => {
      animate.mockReset();
    });

    it('cancels the active animation before starting a replacement', () => {
      const firstTimeline = {
        cancel: jest.fn(),
        finished: Promise.resolve(),
        play: jest.fn(),
      };
      const secondTimeline = {
        cancel: jest.fn(),
        finished: Promise.resolve(),
        play: jest.fn(),
      };
      animate
        .mockReturnValueOnce(firstTimeline)
        .mockReturnValueOnce(secondTimeline);
      const { component } = createAnimationComponent();
      const animation = getAnimationPreset('MaterializeIn');

      component.executeAnimation(animation);
      component.executeAnimation(animation);

      expect(firstTimeline.cancel).toHaveBeenCalledTimes(1);
      expect(secondTimeline.cancel).not.toHaveBeenCalled();
      expect(firstTimeline.play).toHaveBeenCalledTimes(1);
      expect(secondTimeline.play).toHaveBeenCalledTimes(1);
    });

    it('passes animation customization settings to animation callbacks', () => {
      const timeline = {
        cancel: jest.fn(),
        finished: Promise.resolve(),
        play: jest.fn(),
      };
      animate.mockReturnValueOnce(timeline);
      const { component } = createAnimationComponent();
      const animation = jest.fn(() => ({
        targets: 'module-target',
        duration: 1,
        web: { opacity: [1, 0] },
      }));
      component.animationSpeed = 1.75;
      component.dotMatrixOpacityBase = 0.2;
      component.dotMatrixOpacityMid = 0.5;
      component.dotMatrixOpacityPeak = 0.9;
      component.dotMatrixColorBase = '#123456';
      component.dotMatrixColorMid = '#abcdef';
      component.dotMatrixColorPeak = '#ffffff';

      component.executeAnimation(animation);

      expect(animation).toHaveBeenCalledWith(
        expect.anything(),
        1,
        2,
        10,
        QRCodeEntity.Module,
        {
          animationSpeed: 1.75,
          dotMatrixOpacityBase: 0.2,
          dotMatrixOpacityMid: 0.5,
          dotMatrixOpacityPeak: 0.9,
          dotMatrixColorBase: '#123456',
          dotMatrixColorMid: '#abcdef',
          dotMatrixColorPeak: '#ffffff',
        }
      );
    });

    it('normalizes svg transform origins before animating modules', () => {
      const timeline = {
        cancel: jest.fn(),
        finished: Promise.resolve(),
        play: jest.fn(),
      };
      animate.mockReturnValueOnce(timeline);
      const { component, module } = createAnimationComponent();
      const animation = jest.fn(() => ({
        targets: module,
        duration: 1,
        web: { scale: [0.5, 1] },
      }));

      component.executeAnimation(animation);

      expect((module.style as any).transformBox).toBe('fill-box');
      expect(module.style.transformOrigin).toBe('center');
    });

    it('defers animateQRCode once when external modules are not rendered yet', () => {
      jest.useFakeTimers();
      const component = new BpQRCode();
      const execute = jest.spyOn(component, 'executeAnimation');
      const shadowRoot = document.createElement('div');
      component.qrCodeElement = { shadowRoot } as any;
      component.externalSvg = qrcodeReactStyleSVG;
      component.moduleCount = 9;
      const module = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      module.classList.add('module');
      module.setAttribute('data-column', '1');
      module.setAttribute('data-row', '2');

      component.animateQRCode('MaterializeIn');
      expect(execute).not.toHaveBeenCalled();

      shadowRoot.appendChild(module);
      jest.runOnlyPendingTimers();

      expect(execute).toHaveBeenCalledWith(expect.any(Function));
      jest.useRealTimers();
    });

    it('does not let a stale finish callback clear a replacement animation', () => {
      let firstFinishHandler = () => {};
      const firstTimeline = {
        cancel: jest.fn(),
        on: jest.fn((event, handler) => {
          if (event === 'finish') firstFinishHandler = handler;
          return firstTimeline;
        }),
        play: jest.fn(),
      };
      const secondTimeline = {
        cancel: jest.fn(),
        on: jest.fn(),
        play: jest.fn(),
      };
      animate
        .mockReturnValueOnce(firstTimeline)
        .mockReturnValueOnce(secondTimeline);
      const { component, module } = createAnimationComponent();
      const animation = getAnimationPreset('MaterializeIn');

      component.executeAnimation(animation);
      component.executeAnimation(animation);
      module.style.opacity = '0.5';
      firstFinishHandler();

      expect(module.style.opacity).toEqual('0.5');
      expect((component as any).activeAnimationTimeline).toBe(secondTimeline);
    });

    it('restores module styles when a one-shot animation finishes', () => {
      let finishHandler = () => {};
      const timeline = {
        cancel: jest.fn(),
        on: jest.fn((event, handler) => {
          if (event === 'finish') finishHandler = handler;
          return timeline;
        }),
        play: jest.fn(),
      };
      animate.mockReturnValueOnce(timeline);
      const { component, module } = createAnimationComponent();
      const animation = getAnimationPreset('MobiusRun');
      module.style.opacity = '0.4';
      module.style.transform = 'scale(1.2)';
      module.style.filter = 'blur(1px)';
      module.style.fill = '#fff';

      component.executeAnimation(animation);
      finishHandler();

      expect(timeline.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(timeline.cancel).toHaveBeenCalledTimes(1);
      expect((component as any).activeAnimationTimeline).toBeUndefined();
      expect(module.style.opacity).toEqual('');
      expect(module.style.transform).toEqual('');
      expect(module.style.filter).toEqual('');
      expect(module.style.fill).toEqual('');
    });

    it('uses performance-safe keyframes without filter animation', () => {
      const presets = [
        'DiamondGlint',
        'SignalScan',
        'ConfettiPop',
        'SpiralBloom',
        'BubbleCascade',
        'KaleidoPulse',
        'FireflyTwinkle',
        ...matrixPresets,
      ];

      presets.forEach((preset) => {
        const animation = getAnimationPreset(preset)(
          'module-target',
          4,
          6,
          29,
          QRCodeEntity.Module
        ) as any;

        expect(animation.web.filter).toBeUndefined();
      });
    });
  });

  describe('DotField hover effect', () => {
    function readCircleDelta(circle: SVGElement, x: number, y: number) {
      return Math.hypot(
        Number(circle.getAttribute('cx')) - x,
        Number(circle.getAttribute('cy')) - y
      );
    }

    function hasTransformMotion(element: SVGElement) {
      return (element.getAttribute('transform') || '').indexOf('translate') > -1;
    }

    function createHoverComponent() {
      const component = new BpQRCode();
      const shadowRoot = document.createElement('div');
      const container = document.createElement('div');
      const svgContainer = document.createElement('div');
      const glow = document.createElement('div');
      const edgeModule = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      const nearModule = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      const farModule = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      container.id = 'qr-container';
      svgContainer.id = 'svg-container';
      glow.id = 'dot-field-glow';
      edgeModule.classList.add('module');
      nearModule.classList.add('module');
      farModule.classList.add('module');
      edgeModule.setAttribute('data-column', '4');
      edgeModule.setAttribute('data-row', '5');
      edgeModule.setAttribute('cx', '0');
      edgeModule.setAttribute('cy', '1');
      edgeModule.setAttribute('r', '0.5');
      nearModule.setAttribute('data-column', '5');
      nearModule.setAttribute('data-row', '5');
      nearModule.setAttribute('cx', '1');
      nearModule.setAttribute('cy', '1');
      nearModule.setAttribute('r', '0.5');
      nearModule.setAttribute('fill', '#1c7d43');
      farModule.setAttribute('data-column', '0');
      farModule.setAttribute('data-row', '0');
      farModule.setAttribute('cx', '-4');
      farModule.setAttribute('cy', '-4');
      farModule.setAttribute('r', '0.5');
      container.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
          right: 100,
          bottom: 100,
        } as ClientRect);

      svgContainer.appendChild(edgeModule);
      svgContainer.appendChild(nearModule);
      svgContainer.appendChild(farModule);
      container.appendChild(glow);
      container.appendChild(svgContainer);
      shadowRoot.appendChild(container);

      component.qrCodeElement = {
        shadowRoot,
      } as any;
      component.moduleCount = 10;
      component.hoverEffect = 'DotField';
      component.motionIntensity = 'premium';

      return { component, glow, edgeModule, nearModule, farModule };
    }

    it('moves influenced modules by a visible distance without recoloring them', () => {
      jest.useFakeTimers();
      const { component, edgeModule, nearModule, farModule } =
        createHoverComponent();

      (component as any).handlePointerMove({
        clientX: 50,
        clientY: 50,
      } as MouseEvent);
      jest.runTimersToTime(180);

      expect(edgeModule.style.transform || '').toEqual('');
      expect(hasTransformMotion(edgeModule)).toEqual(true);
      expect(readCircleDelta(edgeModule, 0, 1)).toEqual(0);
      expect(edgeModule.getAttribute('r')).toEqual('0.5');
      expect(nearModule.style.fill || '').toEqual('');
      expect(farModule.getAttribute('transform')).toEqual(null);
      expect(readCircleDelta(farModule, -4, -4)).toEqual(0);
      jest.useRealTimers();
    });

    it('keeps the cursor glow hidden while clearing module styles', () => {
      jest.useFakeTimers();
      const { component, glow, edgeModule } = createHoverComponent();

      (component as any).handlePointerMove({
        clientX: 50,
        clientY: 50,
      } as MouseEvent);
      jest.runTimersToTime(180);

      expect(glow.style.opacity || '').toEqual('');
      expect(glow.style.transform || '').toEqual('');
      expect(hasTransformMotion(edgeModule)).toEqual(true);

      (component as any).handlePointerLeave();
      jest.runTimersToTime(1000);

      expect(glow.style.opacity || '').toEqual('');
      expect(glow.style.transform || '').toEqual('');
      expect(edgeModule.getAttribute('transform')).toEqual(null);
      expect(edgeModule.getAttribute('cx')).toEqual('0');
      expect(edgeModule.getAttribute('cy')).toEqual('1');
      expect(edgeModule.getAttribute('r')).toEqual('0.5');
      expect(edgeModule.style.filter || '').toEqual('');
      expect(edgeModule.style.fill || '').toEqual('');
      jest.useRealTimers();
    });

    it('keeps static DotField hover available when reduced motion is preferred', () => {
      jest.useFakeTimers();
      const { component, edgeModule } = createHoverComponent();
      component.respectReducedMotion = true;
      component.prefersReducedMotion = () => true;

      (component as any).handlePointerMove({
        clientX: 50,
        clientY: 50,
      } as MouseEvent);
      jest.runTimersToTime(180);

      expect(hasTransformMotion(edgeModule)).toEqual(true);
      jest.useRealTimers();
    });

    it('coalesces multiple pointer moves into one scheduled hover update', () => {
      jest.useFakeTimers();
      const { component, edgeModule } = createHoverComponent();

      (component as any).handlePointerMove({
        clientX: 40,
        clientY: 40,
      } as MouseEvent);
      (component as any).handlePointerMove({
        clientX: 50,
        clientY: 50,
      } as MouseEvent);

      expect(hasTransformMotion(edgeModule)).toEqual(false);
      jest.runOnlyPendingTimers();
      expect(hasTransformMotion(edgeModule)).toEqual(true);
      jest.useRealTimers();
    });
  });

  describe('external svg rendering', () => {
    function createExternalSVGComponent() {
      const component = new BpQRCode();
      const shadowRoot = document.createElement('div');
      const slot = document.createElement('slot') as any;
      slot.assignedNodes = () => [];
      shadowRoot.appendChild(slot);
      component.qrCodeElement = { shadowRoot } as any;
      component.moduleColor = '#111111';
      component.positionRingColor = '#222222';
      component.positionCenterColor = '#333333';
      return { component, shadowRoot };
    }

    beforeEach(() => {
      animate.mockReset();
    });

    it('renders external-svg as animatable modules', () => {
      const { component } = createExternalSVGComponent();
      component.externalSvg = qrcodeReactStyleSVG;

      component.updateQR();

      expect(component.moduleCount).toBe(9);
      expect(component.data).toContain('class="module"');
      expect(component.data).toContain('data-column="0"');
      expect(component.data).toContain('data-row="0"');
    });

    it('passes adapted external module coordinates to animations', () => {
      const timeline = {
        cancel: jest.fn(),
        finished: Promise.resolve(),
        play: jest.fn(),
      };
      animate.mockReturnValueOnce(timeline);
      const { component, shadowRoot } = createExternalSVGComponent();
      component.externalSvg = qrcodeReactStyleSVG;
      component.updateQR();
      shadowRoot.innerHTML = component.data;
      const animation = jest.fn(() => ({
        targets: 'module-target',
        duration: 1,
        web: { opacity: [1, 0] },
      }));

      component.executeAnimation(animation);

      expect(animation).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        9,
        QRCodeEntity.Module,
        expect.any(Object)
      );
    });

    it('uses generated contents when external-svg is unset', () => {
      const { component } = createExternalSVGComponent();
      const generate = jest.fn(() => '<svg id="generated"></svg>');
      component.generateQRCodeSVG = generate;
      component.contents = 'https://bitjson.com/';

      component.updateQR();

      expect(generate).toHaveBeenCalledWith('https://bitjson.com/', false);
      expect(component.data).toBe('<svg id="generated"></svg>');
    });

    it('falls back to generated contents when external-svg cannot be adapted', () => {
      const { component } = createExternalSVGComponent();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const generate = jest.fn(() => '<svg id="generated"></svg>');
      component.generateQRCodeSVG = generate;
      component.contents = 'https://bitjson.com/';
      component.externalSvg =
        '<svg viewBox="0 0 10 10"><path fill="#000" d="M1 1L5 5z"/></svg>';

      component.updateQR();

      expect(generate).toHaveBeenCalledWith('https://bitjson.com/', false);
      expect(component.data).toBe('<svg id="generated"></svg>');
      expect(warn).toHaveBeenCalledWith(
        '<qr-code> could not adapt external-svg; falling back to generated contents.'
      );
      warn.mockReset();
    });
  });

  describe('rendering', () => {
    let element: HTMLQrCodeElement;
    let testWindow: TestWindow;
    beforeEach(async () => {
      testWindow = new TestWindow();
      element = await testWindow.load({
        components: [BpQRCode],
        html: '<qr-code></qr-code>',
      });
    });

    it('should work without parameters', () => {
      expect(element).toBeTruthy();
      expect(element.textContent.trim()).toEqual('');
    });
  });
});

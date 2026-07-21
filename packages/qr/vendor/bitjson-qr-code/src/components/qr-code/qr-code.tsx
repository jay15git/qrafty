import {
  Component,
  Element,
  Event,
  EventEmitter,
  Prop,
  Method,
  State,
  Watch,
} from '@stencil/core';

import { addPlugin, animate } from 'just-animate';
import { waapiPlugin } from 'just-animate/lib.es2015/web';
addPlugin(waapiPlugin);

import qrcode from 'qrcode-generator';
import {
  getAnimationPreset,
  QRCodeAnimation,
  QRCodeAnimationSettings,
  QRCodeEntity,
  AnimationPreset,
} from './animations';
import { adaptExternalQRCodeSVG } from './qr-svg-adapter';

interface QRDotFieldModule {
  element: SVGElement;
  anchorX: number;
  anchorY: number;
  centerX: number;
  centerY: number;
  originalX: number | null;
  originalY: number | null;
  originalRadius: number | null;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
  originalTransform: string | null;
}

interface QRDotFieldPointer {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  speed: number;
  active: boolean;
}

interface QRModuleMetadata {
  element: SVGElement;
  x: number;
  y: number;
}

interface QRHoverState {
  pointerX: number;
  pointerY: number;
}

@Component({
  tag: 'qr-code',
  styleUrl: 'qr-code.css',
  shadow: true,
})
export class BpQRCode {
  @Element() qrCodeElement: HTMLElement;

  @Prop() contents = '';
  @Prop() protocol: string = '';
  @Prop() moduleColor: string = '#000';
  @Prop() positionRingColor: string = '#000';
  @Prop() positionCenterColor: string = '#000';
  @Prop() maskXToYRatio: number = 1;
  @Prop() squares: boolean = false;
  @Prop() externalSvg: string = '';
  @Prop() autoAnimate: AnimationPreset | string = '';
  @Prop() autoAnimateInterval: number = 5000;
  @Prop() animationSpeed: number = 1;
  @Prop() dotMatrixOpacityBase: number = 0.16;
  @Prop() dotMatrixOpacityMid: number = 0.32;
  @Prop() dotMatrixOpacityPeak: number = 1;
  @Prop() dotMatrixColorBase: string = '';
  @Prop() dotMatrixColorMid: string = '';
  @Prop() dotMatrixColorPeak: string = '';
  @Prop() hoverEffect: string = '';
  @Prop() hoverColorMode: 'overlay' | 'modules' | 'both' = 'both';
  @Prop() motionIntensity: 'subtle' | 'premium' | 'dramatic' = 'premium';
  @Prop() respectReducedMotion: boolean = true;

  @State() data: string;
  @State() moduleCount: number;

  @Event() codeRendered: EventEmitter;

  private autoAnimationTimer?: number;
  private activeAnimationTimeline?: any;
  private activeAnimationElements: any[] = [];
  private pendingAnimationFrame?: number;
  private animatableModuleCache?: QRModuleMetadata[];
  private hoverFrame?: number;
  private pendingHoverState?: QRHoverState;
  private dotFieldFrame?: number;
  private dotFieldModules: QRDotFieldModule[] = [];
  private dotFieldPointer: QRDotFieldPointer = {
    x: -9999,
    y: -9999,
    previousX: -9999,
    previousY: -9999,
    speed: 0,
    active: false,
  };
  private dotFieldEngagement: number = 0;

  /**
   * The first update must run after load to query the created shadowRoot for
   * slotted nodes.
   */
  componentDidLoad() {
    this.updateQR();
    this.startAutoAnimation();
  }

  componentDidUpdate() {
    this.codeRendered.emit();
  }

  disconnectedCallback() {
    this.stopAutoAnimation();
    this.stopActiveAnimation();
    this.cancelPendingAnimationFrame();
    this.cancelPendingHoverFrame();
    this.stopDotFieldMotion(true);
  }

  @Watch('contents')
  @Watch('protocol')
  @Watch('moduleColor')
  @Watch('positionRingColor')
  @Watch('positionCenterColor')
  @Watch('maskXToYRatio')
  @Watch('squares')
  @Watch('externalSvg')
  updateQR() {
    /**
     * E.g. Firefox, as of Firefox 61
     */
    const isUsingWebComponentPolyfill =
      (this.qrCodeElement as any) === this.qrCodeElement.shadowRoot;
    const realSlot = this.qrCodeElement.shadowRoot
      ? this.qrCodeElement.shadowRoot.querySelector('slot')
      : undefined;
    const hasSlot = isUsingWebComponentPolyfill
      ? this.qrCodeElement.querySelector('[slot]')
        ? true
        : false
      : realSlot
      ? realSlot.assignedNodes().length > 0
      : false;

    this.resetHoverModules();
    this.invalidateModuleCache();
    this.cancelPendingAnimationFrame();
    if (this.externalSvg && this.externalSvg.trim() !== '') {
      const adapted = adaptExternalQRCodeSVG(this.externalSvg, {
        moduleColor: this.moduleColor,
        positionRingColor: this.positionRingColor,
        positionCenterColor: this.positionCenterColor,
        squares: this.squares,
      });
      if (adapted) {
        this.moduleCount = adapted.moduleCount;
        this.data = adapted.svg;
        return;
      }
      console.warn(
        '<qr-code> could not adapt external-svg; falling back to generated contents.'
      );
    }
    this.data = this.generateQRCodeSVG(this.contents, hasSlot);
  }

  @Watch('autoAnimate')
  @Watch('autoAnimateInterval')
  @Watch('animationSpeed')
  @Watch('dotMatrixOpacityBase')
  @Watch('dotMatrixOpacityMid')
  @Watch('dotMatrixOpacityPeak')
  @Watch('dotMatrixColorBase')
  @Watch('dotMatrixColorMid')
  @Watch('dotMatrixColorPeak')
  restartAutoAnimation() {
    this.startAutoAnimation();
  }

  @Watch('hoverEffect')
  resetHoverEffect() {
    this.resetHoverModules();
  }

  @Method()
  animateQRCode(animation?: AnimationPreset | string | QRCodeAnimation) {
    const resolvedAnimation =
      typeof animation === 'string' ? getAnimationPreset(animation) : animation;
    if (this.shouldDeferExternalAnimation()) {
      this.cancelPendingAnimationFrame();
      this.pendingAnimationFrame = this.requestDotFieldFrame(() => {
        this.pendingAnimationFrame = undefined;
        this.executeAnimation(resolvedAnimation);
      });
      return;
    }
    this.executeAnimation(resolvedAnimation);
  }

  @Method()
  getModuleCount() {
    return this.moduleCount;
  }

  executeAnimation(animation: QRCodeAnimation) {
    if (!animation) return;
    this.stopActiveAnimation();
    this.cancelPendingAnimationFrame();
    if (!this.qrCodeElement || !this.qrCodeElement.shadowRoot) return;
    const modules = Array.from(
      this.qrCodeElement.shadowRoot.querySelectorAll('.module')
    );
    const rings = Array.from(
      this.qrCodeElement.shadowRoot.querySelectorAll('.position-ring')
    );
    const centers = Array.from(
      this.qrCodeElement.shadowRoot.querySelectorAll('.position-center')
    );
    const icons = Array.from(
      this.qrCodeElement.shadowRoot.querySelectorAll('#icon-wrapper')
    );
    const targets = [...modules, ...rings, ...centers, ...icons];
    if (targets.length === 0) return;
    targets.forEach((element) =>
      this.normalizeAnimationElement(element as SVGElement)
    );
    const setEntityType = (array: Element[], entity: QRCodeEntity) => {
      return array.map((element) => {
        return {
          element,
          entityType: entity,
        };
      });
    };

    const animationAdditions = [
      ...setEntityType(modules, QRCodeEntity.Module),
      ...setEntityType(rings, QRCodeEntity.PositionRing),
      ...setEntityType(centers, QRCodeEntity.PositionCenter),
      ...setEntityType(icons, QRCodeEntity.Icon),
    ]
      .map(({ element, entityType }) => {
        return {
          element,
          // SVGElement.dataset is part of the SVG 2.0 draft
          // TODO: requires a polyfill for Edge:
          // https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/dataset
          positionX: this.readModulePosition(element as SVGElement, 'column'),
          positionY: this.readModulePosition(element as SVGElement, 'row'),
          entityType: entityType,
        };
      })
      .map((entityInfo) =>
        animation(
          entityInfo.element,
          entityInfo.positionX,
          entityInfo.positionY,
          this.moduleCount,
          entityInfo.entityType,
          this.animationSettings()
        )
      );

    const timeline = animate(animationAdditions) as any;
    if (!timeline || typeof timeline.play !== 'function') return;
    const animatedElements = animationAdditions.map((addition) => addition.targets);
    this.activeAnimationTimeline = timeline;
    this.activeAnimationElements = animatedElements;
    let settled = false;
    const settleActiveAnimation = (restoreStyles: boolean) => {
      if (settled) return;
      settled = true;
      const isActiveTimeline = this.activeAnimationTimeline === timeline;
      if (isActiveTimeline) {
        this.activeAnimationTimeline = undefined;
      } else if (this.activeAnimationElements !== animatedElements) {
        return;
      }
      if (restoreStyles && timeline && typeof timeline.cancel === 'function') {
        timeline.cancel();
      }
      this.clearAnimationStyles(animatedElements);
      if (this.activeAnimationElements === animatedElements) {
        this.activeAnimationElements = [];
      }
    };
    const finished = timeline && timeline.finished;
    if (timeline && typeof timeline.on === 'function') {
      timeline.on('finish', () => settleActiveAnimation(true));
    }
    if (finished && typeof finished.then === 'function') {
      finished.then(
        () => settleActiveAnimation(false),
        () => settleActiveAnimation(false)
      );
    }

    timeline.play();
  }

  private shouldDeferExternalAnimation() {
    if (!this.externalSvg || this.externalSvg.trim() === '') return false;
    if (!this.qrCodeElement || !this.qrCodeElement.shadowRoot) return true;
    return (
      this.qrCodeElement.shadowRoot.querySelector(
        '.module, .position-ring, .position-center'
      ) === null
    );
  }

  private cancelPendingAnimationFrame() {
    if (this.pendingAnimationFrame !== undefined) {
      this.cancelDotFieldFrame(this.pendingAnimationFrame);
      this.pendingAnimationFrame = undefined;
    }
  }

  private normalizeAnimationElement(element: SVGElement) {
    if (!element || !element.style) return;
    element.style.setProperty('transform-box', 'fill-box');
    (element.style as any).transformBox = 'fill-box';
    element.style.transformOrigin = 'center';
  }

  private stopActiveAnimation() {
    const timeline = this.activeAnimationTimeline;
    if (!timeline) return;
    const animatedElements = this.activeAnimationElements;
    this.activeAnimationTimeline = undefined;
    this.activeAnimationElements = [];
    if (typeof timeline.cancel === 'function') {
      timeline.cancel();
    } else if (typeof timeline.pause === 'function') {
      timeline.pause();
    }
    this.clearAnimationStyles(animatedElements);
  }

  private clearAnimationStyles(elements: any[]) {
    elements.forEach((element) => {
      if (!element || !element.style) return;
      element.style.opacity = '';
      element.style.transform = '';
      element.style.filter = '';
      element.style.fill = '';
    });
  }

  private animationSettings(): QRCodeAnimationSettings {
    return {
      animationSpeed: this.animationSpeed,
      dotMatrixOpacityBase: this.dotMatrixOpacityBase,
      dotMatrixOpacityMid: this.dotMatrixOpacityMid,
      dotMatrixOpacityPeak: this.dotMatrixOpacityPeak,
      dotMatrixColorBase: this.dotMatrixColorBase,
      dotMatrixColorMid: this.dotMatrixColorMid,
      dotMatrixColorPeak: this.dotMatrixColorPeak,
    };
  }

  prefersReducedMotion() {
    return (
      this.respectReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  startAutoAnimation() {
    this.stopAutoAnimation();
    if (!this.autoAnimate || this.prefersReducedMotion()) return;
    const interval = Math.max(1000, Number(this.autoAnimateInterval) || 5000);
    this.autoAnimationTimer = window.setInterval(() => {
      this.executeAnimation(getAnimationPreset(this.autoAnimate));
    }, interval);
  }

  stopAutoAnimation() {
    if (this.autoAnimationTimer) {
      window.clearInterval(this.autoAnimationTimer);
      this.autoAnimationTimer = undefined;
    }
  }

  private getIntensitySettings() {
    switch (this.motionIntensity) {
      case 'subtle':
        return {
          hoverRadius: 4,
          moduleScale: 1.08,
          colorBoost: 0.24,
          bulgeStrength: 1.35,
          glowSize: 24,
          spring: 0.22,
          friction: 0.72,
          idleEngagement: 0.62,
        };
      case 'dramatic':
        return {
          hoverRadius: 8,
          moduleScale: 1.38,
          colorBoost: 0.48,
          bulgeStrength: 3.1,
          glowSize: 42,
          spring: 0.28,
          friction: 0.66,
          idleEngagement: 0.88,
        };
      default:
        return {
          hoverRadius: 6,
          moduleScale: 1.2,
          colorBoost: 0.36,
          bulgeStrength: 2.1,
          glowSize: 32,
          spring: 0.25,
          friction: 0.68,
          idleEngagement: 0.74,
        };
    }
  }

  private shouldUseModuleHover() {
    return (
      this.hoverEffect === 'RadialAura' ||
      this.hoverColorMode === 'modules' ||
      this.hoverColorMode === 'both' ||
      this.hoverEffect === 'MagneticModules' ||
      this.hoverEffect === 'RadiusRecolor'
    );
  }

  private handlePointerMove = (event: MouseEvent) => {
    if (!this.hoverEffect) return;
    const container = this.qrCodeElement.shadowRoot.querySelector(
      '#qr-container'
    ) as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || !this.moduleCount) return;

    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    const margin = 4;
    const moduleX = (xPercent / 100) * (this.moduleCount + margin * 2) - margin;
    const moduleY = (yPercent / 100) * (this.moduleCount + margin * 2) - margin;
    this.pendingHoverState = { pointerX: moduleX, pointerY: moduleY };
    if (this.hoverFrame !== undefined) return;
    this.hoverFrame = this.requestDotFieldFrame(() => this.flushHoverFrame());
  };

  private handlePointerLeave = () => {
    this.cancelPendingHoverFrame();
    if (this.hoverEffect === 'DotField') {
      this.dotFieldPointer.active = false;
      this.dotFieldPointer.x = -9999;
      this.dotFieldPointer.y = -9999;
      this.dotFieldPointer.speed = 0;
      this.dotFieldEngagement = 0;
      this.resetDotFieldGlow();
      this.startDotFieldMotion();
    } else {
      this.resetHoverModules();
    }
  };

  private getAnimatableModules() {
    return this.getAnimatableModuleCache().map((module) => module.element);
  }

  private getAnimatableModuleCache() {
    if (this.animatableModuleCache) return this.animatableModuleCache;
    if (!this.qrCodeElement || !this.qrCodeElement.shadowRoot) return [];
    this.animatableModuleCache = Array.from(
      this.qrCodeElement.shadowRoot.querySelectorAll(
        '.module, .position-ring, .position-center'
      )
    )
      .map((element: SVGElement) => {
        const x = this.readModulePosition(element, 'column');
        const y = this.readModulePosition(element, 'row');
        if (isNaN(x) || isNaN(y)) return undefined;
        this.normalizeAnimationElement(element);
        return { element, x, y };
      })
      .filter((module) => module !== undefined) as QRModuleMetadata[];
    return this.animatableModuleCache;
  }

  private invalidateModuleCache() {
    this.animatableModuleCache = undefined;
    this.dotFieldModules = [];
  }

  private readModulePosition(module: SVGElement, name: string) {
    return parseFloat(
      ((module as any).dataset && (module as any).dataset[name]) ||
        module.getAttribute(`data-${name}`) ||
        ''
    );
  }

  private applyModuleHover(pointerX: number, pointerY: number, radius: number) {
    const settings = this.getIntensitySettings();
    this.getAnimatableModuleCache().forEach((cachedModule) => {
      const module = cachedModule.element;
      const x = cachedModule.x;
      const y = cachedModule.y;
      const distance = Math.hypot(pointerX - x, pointerY - y);
      const influence = Math.max(0, 1 - distance / radius);
      const scale = 1 + (settings.moduleScale - 1) * influence;
      const isDotField = this.hoverEffect === 'DotField';
      const directionX = distance > 0 ? (x - pointerX) / distance : 0;
      const directionY = distance > 0 ? (y - pointerY) / distance : 0;
      const bulge = settings.bulgeStrength * influence * influence;
      const translateX = directionX * bulge;
      const translateY = directionY * bulge;
      module.style.transition = isDotField
        ? 'transform 90ms ease-out, fill 140ms ease'
        : 'transform 120ms ease, fill 160ms ease';
      module.style.transform =
        influence > 0
          ? isDotField
            ? `translate(${translateX}px, ${translateY}px) scale(${scale})`
            : `scale(${scale})`
          : '';
      module.style.filter = '';
      if (
        this.hoverEffect === 'RadialAura' ||
        this.hoverEffect === 'RadiusRecolor' ||
        this.hoverColorMode === 'overlay' ||
        this.hoverColorMode === 'modules' ||
        this.hoverColorMode === 'both'
      ) {
        module.style.fill = influence > 0 ? this.blendHoverColor(influence) : '';
      }
    });
  }

  private resetHoverModules() {
    this.cancelPendingHoverFrame();
    this.stopDotFieldMotion(true);
    this.getAnimatableModules().forEach((module) => {
      module.style.transform = '';
      module.style.filter = '';
      module.style.transition = '';
      module.style.fill = '';
    });
    this.resetDotFieldGlow();
  }

  private handleDotFieldPointerMove(
    pointerX: number,
    pointerY: number
  ) {
    const pointer = this.dotFieldPointer;
    const distance = Math.hypot(pointerX - pointer.previousX, pointerY - pointer.previousY);
    pointer.speed += (distance - pointer.speed) * 0.5;
    pointer.previousX = pointerX;
    pointer.previousY = pointerY;
    pointer.x = pointerX;
    pointer.y = pointerY;
    pointer.active = true;
    this.startDotFieldMotion(true);
  }

  private flushHoverFrame() {
    this.hoverFrame = undefined;
    const state = this.pendingHoverState;
    this.pendingHoverState = undefined;
    if (!state) return;

    const settings = this.getIntensitySettings();
    if (this.hoverEffect === 'DotField') {
      this.handleDotFieldPointerMove(state.pointerX, state.pointerY);
    } else if (this.shouldUseModuleHover()) {
      this.applyModuleHover(state.pointerX, state.pointerY, settings.hoverRadius);
    }
  }

  private cancelPendingHoverFrame() {
    this.pendingHoverState = undefined;
    if (this.hoverFrame !== undefined) {
      this.cancelDotFieldFrame(this.hoverFrame);
      this.hoverFrame = undefined;
    }
  }

  private startDotFieldMotion(runImmediately: boolean = false) {
    if (this.hoverEffect !== 'DotField') return;
    this.prepareDotFieldModules();
    if (runImmediately) {
      if (this.dotFieldFrame !== undefined) {
        this.cancelDotFieldFrame(this.dotFieldFrame);
        this.dotFieldFrame = undefined;
      }
      this.tickDotField();
      return;
    }
    if (this.dotFieldFrame !== undefined) return;
    this.dotFieldFrame = this.requestDotFieldFrame(() => this.tickDotField());
  }

  private prepareDotFieldModules() {
    const modules = this.getAnimatableModuleCache();
    const existing = this.dotFieldModules;
    if (
      existing.length === modules.length &&
      existing.every((module, index) => module.element === modules[index].element)
    ) {
      return;
    }
    this.dotFieldModules = modules
      .map((cachedModule) => {
        const element = cachedModule.element;
        const anchorX = cachedModule.x;
        const anchorY = cachedModule.y;
        element.style.transition = '';
        const center = this.getDotFieldModuleCenter(element, anchorX, anchorY);
        return {
          element,
          anchorX,
          anchorY,
          centerX: center.x,
          centerY: center.y,
          originalX: center.circle ? center.x : null,
          originalY: center.circle ? center.y : null,
          originalRadius: center.radius,
          offsetX: 0,
          offsetY: 0,
          velocityX: 0,
          velocityY: 0,
          originalTransform: element.getAttribute('transform'),
        };
      })
      .filter((module) => module !== undefined) as QRDotFieldModule[];
  }

  private getDotFieldModuleCenter(
    element: SVGElement,
    anchorX: number,
    anchorY: number
  ) {
    const circleX = parseFloat(element.getAttribute('cx') || '');
    const circleY = parseFloat(element.getAttribute('cy') || '');
    const radius = parseFloat(element.getAttribute('r') || '');
    if (!isNaN(circleX) && !isNaN(circleY)) {
      return {
        x: circleX,
        y: circleY,
        circle: true,
        radius: isNaN(radius) ? null : radius,
      };
    }

    if (typeof (element as any).getBBox === 'function') {
      try {
        const box = (element as any).getBBox();
        if (box && isFinite(box.x) && isFinite(box.y)) {
          return {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            circle: false,
            radius: null,
          };
        }
      } catch (error) {
        // Fall back to module coordinates when SVG layout is unavailable in tests.
      }
    }

    const coordinateShift = (this.moduleCount + 8) / 2;
    return {
      x: anchorX + 4 - coordinateShift,
      y: anchorY + 4 - coordinateShift,
      circle: false,
      radius: null,
    };
  }

  private applyDotFieldPlacement(
    module: QRDotFieldModule,
    scale: number
  ) {
    const translate = `translate(${module.offsetX} ${module.offsetY})`;
    const scaled =
      scale !== 1
        ? ` translate(${module.centerX} ${module.centerY}) scale(${scale}) translate(${-module.centerX} ${-module.centerY})`
        : '';
    const transform = `${module.originalTransform || ''} ${translate}${scaled}`.trim();
    module.element.setAttribute('transform', transform);
  }

  private restoreDotFieldPlacement(module: QRDotFieldModule) {
    if (
      module.originalX !== null &&
      module.originalY !== null &&
      module.originalRadius !== null
    ) {
      module.element.setAttribute('cx', `${module.originalX}`);
      module.element.setAttribute('cy', `${module.originalY}`);
      module.element.setAttribute('r', `${module.originalRadius}`);
    }
    this.restoreDotFieldTransform(module);
  }

  private restoreDotFieldTransform(module: QRDotFieldModule) {
    if (module.originalTransform) {
      module.element.setAttribute('transform', module.originalTransform);
    } else {
      module.element.removeAttribute('transform');
    }
  }

  private tickDotField() {
    this.dotFieldFrame = undefined;
    const settings = this.getIntensitySettings();
    const pointer = this.dotFieldPointer;
    const targetEngagement = pointer.active
      ? Math.max(settings.idleEngagement, Math.min(pointer.speed / 2.5, 1))
      : 0;
    this.dotFieldEngagement += (targetEngagement - this.dotFieldEngagement) * 0.35;
    if (this.dotFieldEngagement < 0.001) this.dotFieldEngagement = 0;
    const engagement = this.dotFieldEngagement;
    const radius = settings.hoverRadius;
    let hasMotion = pointer.active || engagement > 0;

    const activeModules: QRDotFieldModule[] = [];
    this.dotFieldModules.forEach((module) => {
      if (!pointer.active || engagement <= 0) {
        if (
          Math.abs(module.offsetX) > 0.02 ||
          Math.abs(module.offsetY) > 0.02 ||
          Math.abs(module.velocityX) > 0.02 ||
          Math.abs(module.velocityY) > 0.02
        ) {
          activeModules.push(module);
        }
        return;
      }
      const dx = pointer.x - module.anchorX;
      const dy = pointer.y - module.anchorY;
      const distance = Math.hypot(dx, dy);
      if (
        distance < radius ||
        Math.abs(module.offsetX) > 0.02 ||
        Math.abs(module.offsetY) > 0.02 ||
        Math.abs(module.velocityX) > 0.02 ||
        Math.abs(module.velocityY) > 0.02
      ) {
        activeModules.push(module);
      }
    });

    activeModules.forEach((module) => {
      let targetX = 0;
      let targetY = 0;
      let influence = 0;

      if (pointer.active && engagement > 0) {
        const dx = pointer.x - module.anchorX;
        const dy = pointer.y - module.anchorY;
        const distance = Math.hypot(dx, dy);
        if (distance < radius && distance > 0.001) {
          influence = 1 - distance / radius;
          const push =
            influence * influence * settings.bulgeStrength * engagement;
          targetX = -(dx / distance) * push;
          targetY = -(dy / distance) * push;
        }
      }

      module.velocityX =
        (module.velocityX + (targetX - module.offsetX) * settings.spring) *
        settings.friction;
      module.velocityY =
        (module.velocityY + (targetY - module.offsetY) * settings.spring) *
        settings.friction;
      module.offsetX += module.velocityX;
      module.offsetY += module.velocityY;

      const moving =
        Math.abs(module.offsetX) > 0.02 ||
        Math.abs(module.offsetY) > 0.02 ||
        Math.abs(module.velocityX) > 0.02 ||
        Math.abs(module.velocityY) > 0.02;

      if (moving || influence > 0) {
        hasMotion = true;
        const scale = 1 + (settings.moduleScale - 1) * influence * engagement;
        this.applyDotFieldPlacement(module, scale);
        module.element.style.filter = '';
      } else {
        module.offsetX = 0;
        module.offsetY = 0;
        module.velocityX = 0;
        module.velocityY = 0;
        this.restoreDotFieldPlacement(module);
        module.element.style.filter = '';
      }
      module.element.style.fill = '';
    });

    if (hasMotion) {
      this.dotFieldFrame = this.requestDotFieldFrame(() => this.tickDotField());
    }
  }

  private requestDotFieldFrame(callback: () => void) {
    const request =
      (typeof window !== 'undefined' && window.requestAnimationFrame) ||
      ((frameCallback: FrameRequestCallback) =>
        window.setTimeout(() => frameCallback(Date.now()), 16));
    return request.call(window, callback as FrameRequestCallback);
  }

  private cancelDotFieldFrame(frame: number) {
    const cancel =
      (typeof window !== 'undefined' && window.cancelAnimationFrame) ||
      ((frameId: number) => window.clearTimeout(frameId));
    cancel.call(window, frame);
  }

  private stopDotFieldMotion(clearStyles: boolean) {
    if (this.dotFieldFrame !== undefined) {
      this.cancelDotFieldFrame(this.dotFieldFrame);
      this.dotFieldFrame = undefined;
    }
    this.dotFieldPointer.active = false;
    this.dotFieldEngagement = 0;
    if (clearStyles) {
      this.dotFieldModules.forEach((module) => {
        module.offsetX = 0;
        module.offsetY = 0;
        module.velocityX = 0;
        module.velocityY = 0;
        this.restoreDotFieldPlacement(module);
        module.element.style.filter = '';
        module.element.style.fill = '';
      });
    }
  }

  private resetDotFieldGlow() {
    if (!this.qrCodeElement || !this.qrCodeElement.shadowRoot) return;
    const glow = this.qrCodeElement.shadowRoot.querySelector(
      '#dot-field-glow'
    ) as HTMLElement;
    if (!glow) return;
    glow.style.opacity = '';
    glow.style.transform = '';
    glow.style.width = '';
    glow.style.height = '';
  }

  private blendHoverColor(influence: number) {
    if (influence > 0.66) return '#70c559';
    if (influence > 0.33) return '#2f9b57';
    return '#1c7d43';
  }

  generateQRCodeSVG(contents: string, maskCenter: boolean) {
    const qr = qrcode(
      /* Auto-detect QR Code version to use */ 0,
      /* Highest error correction level */ 'H'
    );
    qr.addData(contents);
    qr.make();
    const margin = 4;
    this.moduleCount = qr.getModuleCount();
    const pixelSize = this.moduleCount + margin * 2;
    const coordinateShift = pixelSize / 2;
    return `
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="${0 - coordinateShift} ${
      0 - coordinateShift
    } ${pixelSize} ${pixelSize}"
        preserveAspectRatio="xMinYMin meet">
    <rect
        width="100%"
        height="100%"
        fill="white"
        fill-opacity="0"
        cx="${-coordinateShift}"
        cy="${-coordinateShift}"/>
    ${
      this.squares
        ? void 0
        : renderQRPositionDetectionPatterns(
            this.moduleCount,
            margin,
            this.positionRingColor,
            this.positionCenterColor,
            coordinateShift
          )
    }
    ${renderQRModulesSVG(
      qr,
      this.moduleCount,
      margin,
      maskCenter,
      this.maskXToYRatio,
      this.squares,
      this.moduleColor,
      coordinateShift
    )}
    </svg>`;

    function renderQRPositionDetectionPatterns(
      count: number,
      margin: number,
      ringFill: string,
      centerFill: string,
      coordinateShift: number
    ) {
      return `
      ${renderQRPositionDetectionPattern(
        margin,
        margin,
        margin,
        ringFill,
        centerFill,
        coordinateShift
      )}
      ${renderQRPositionDetectionPattern(
        count - 7 + margin,
        margin,
        margin,
        ringFill,
        centerFill,
        coordinateShift
      )}
      ${renderQRPositionDetectionPattern(
        margin,
        count - 7 + margin,
        margin,
        ringFill,
        centerFill,
        coordinateShift
      )}
      `;
    }

    function renderQRPositionDetectionPattern(
      x: number,
      y: number,
      margin: number,
      ringFill: string,
      centerFill: string,
      coordinateShift: number
    ) {
      return `
      <path class="position-ring" fill="${ringFill}" data-column="${
        x - margin
      }" data-row="${y - margin}" d="M${x - coordinateShift} ${
        y - 0.5 - coordinateShift
      }h6s.5 0 .5 .5v6s0 .5-.5 .5h-6s-.5 0-.5-.5v-6s0-.5 .5-.5zm.75 1s-.25 0-.25 .25v4.5s0 .25 .25 .25h4.5s.25 0 .25-.25v-4.5s0-.25 -.25 -.25h-4.5z"/>
      <path class="position-center" fill="${centerFill}" data-column="${
        x - margin + 2
      }" data-row="${y - margin + 2}" d="M${x + 2 - coordinateShift} ${
        y + 1.5 - coordinateShift
      }h2s.5 0 .5 .5v2s0 .5-.5 .5h-2s-.5 0-.5-.5v-2s0-.5 .5-.5z"/>
      `;
    }

    function renderQRModulesSVG(
      qr: QRCode,
      count: number,
      margin: number,
      maskCenter: boolean,
      maskXToYRatio: number,
      squares: boolean,
      moduleFill: string,
      coordinateShift: number
    ) {
      let svg = '';
      for (let column = 0; column < count; column += 1) {
        const positionX = column + margin;
        for (let row = 0; row < count; row += 1) {
          if (
            qr.isDark(column, row) &&
            (squares ||
              (!isPositioningElement(row, column, count) &&
                !isRemovableCenter(
                  row,
                  column,
                  count,
                  maskCenter,
                  maskXToYRatio
                )))
          ) {
            const positionY = row + margin;
            svg += squares
              ? `
            <rect x="${positionX - 0.5 - coordinateShift}" y="${
                  positionY - 0.5 - coordinateShift
                }" width="1" height="1" />
            `
              : `
            <circle
                class="module"
                fill="${moduleFill}"
                cx="${positionX - coordinateShift}"
                cy="${positionY - coordinateShift}"
                data-column="${column}"
                data-row="${row}"
                r="0.5"/>`;
          }
        }
      }
      return svg;
    }

    function isPositioningElement(row: number, column: number, count: number) {
      const elemWidth = 7;
      return row <= elemWidth
        ? column <= elemWidth || column >= count - elemWidth
        : column <= elemWidth
        ? row >= count - elemWidth
        : false;
    }

    /**
     * For ErrorCorrectionLevel 'H', up to 30% of the code can be corrected. To
     * be safe, we limit damage to 10%.
     */
    function isRemovableCenter(
      row: number,
      column: number,
      count: number,
      maskCenter: boolean,
      maskXToYRatio: number
    ) {
      if (!maskCenter) return false;
      const center = count / 2;
      const safelyRemovableHalf = Math.floor((count * Math.sqrt(0.1)) / 2);
      const safelyRemovableHalfX = safelyRemovableHalf * maskXToYRatio;
      const safelyRemovableHalfY = safelyRemovableHalf / maskXToYRatio;
      const safelyRemovableStartX = center - safelyRemovableHalfX;
      const safelyRemovableEndX = center + safelyRemovableHalfX;
      const safelyRemovableStartY = center - safelyRemovableHalfY;
      const safelyRemovableEndY = center + safelyRemovableHalfY;

      return (
        row >= safelyRemovableStartY &&
        row <= safelyRemovableEndY &&
        column >= safelyRemovableStartX &&
        column <= safelyRemovableEndX
      );
    }
  }

  render() {
    return (
      <div id="qr-container">
        <div id="dot-field-glow" />
        <div
          id="icon-container"
          style={this.squares ? { display: 'none', visibility: 'hidden' } : {}}
        >
          <div
            id="icon-wrapper"
            style={{ width: `${18 * this.maskXToYRatio}%` }}
            data-column={this.moduleCount / 2}
            data-row={this.moduleCount / 2}
          >
            <slot name="icon" />
          </div>
        </div>
        <div
          id="svg-container"
          onMouseMove={this.handlePointerMove}
          onMouseLeave={this.handlePointerLeave}
          innerHTML={this.data}
        />
      </div>
    );
  }
}

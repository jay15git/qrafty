export declare function defineCustomElements(window: Window): void

export declare function adaptExternalQRCodeSVG(
  externalSvg: string,
  options: {
    moduleColor: string
    positionRingColor: string
    positionCenterColor: string
    squares: boolean
  },
):
  | {
      svg: string
      moduleCount: number
      margin: number
      hasFinderPatterns: boolean
    }
  | undefined

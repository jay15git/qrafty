import { emitReactQrCodeMarkup, type ReactQRCodeProps } from "@qrafty/qr-internal/react-qr-code";

const SVG_OPEN_TAG_END = ">";
const SVG_CLOSE_TAG = "</svg>";

function splitSvgMarkup(markup: string) {
  const openEnd = markup.indexOf(SVG_OPEN_TAG_END);

  return {
    viewBox: markup.match(/viewBox="([^"]*)"/)?.[1],
    innerMarkup: markup.slice(openEnd + 1, markup.length - SVG_CLOSE_TAG.length),
  };
}

/**
 * Renders emitReactQrCodeMarkup output as a real <svg> element, mirroring the
 * vendored ReactQRCode markup contract: the svg tag owns height/width/viewBox/
 * role/aria-label plus caller svgProps, while children come from the emitter.
 */
export function EmittedQrCodeSvg({
  qrProps,
  svgProps,
}: {
  qrProps: ReactQRCodeProps;
  svgProps?: ReactQRCodeProps["svgProps"];
}) {
  const markup = emitReactQrCodeMarkup(qrProps);
  const { viewBox, innerMarkup } = splitSvgMarkup(markup);
  const size = qrProps.size ?? 128;
  const ariaLabel = (svgProps as Record<string, unknown> | undefined)?.["aria-label"] ?? "QR Code";

  return (
    <svg
      height={size}
      width={size}
      viewBox={viewBox}
      role="img"
      aria-label={ariaLabel as string}
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: innerMarkup }}
    />
  );
}

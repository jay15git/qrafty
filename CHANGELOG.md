# Changelog

All notable changes to QRafty are documented here. The format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); dates are UTC.

## [Unreleased]

### Fixed

- Mobile family drawer: eliminated open/close jank — FLIP scaleY morphing
  replaced by direct height animation, stale `useMeasure` bounds no longer
  paint on reopen, height freezes during the exit slide, and the scroll frame
  is a proper `ScrollArea` with the cap applied at every level.
- Mobile layer toolbar stays visible with no selection and offers the
  background (card) tools — Add, Layout, Border, Effects — matching the
  desktop island.

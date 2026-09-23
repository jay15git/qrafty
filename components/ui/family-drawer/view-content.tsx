"use client"

import { useFamilyDrawer, type ViewsRegistry } from "./context"

interface FamilyDrawerViewContentProps {
  views?: ViewsRegistry
  /** Pin a view for exit animations; defaults to the active drawer view. */
  viewName?: string
}

export function FamilyDrawerViewContent({
  views: propViews,
  viewName: propViewName,
}: FamilyDrawerViewContentProps = {} as FamilyDrawerViewContentProps) {
  const { view: contextView, views: contextViews } = useFamilyDrawer()
  const view = propViewName ?? contextView

  const views = propViews || contextViews

  if (!views) {
    throw new Error(
      "FamilyDrawerViewContent requires views to be provided via props or FamilyDrawerRoot",
    )
  }

  const ViewComponent = views[view]

  if (!ViewComponent) {
    const DefaultComponent = views.default
    return DefaultComponent ? <DefaultComponent /> : null
  }

  return <ViewComponent />
}

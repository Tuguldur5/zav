/**
 * Placeholder shown while a staff page's data is still loading.
 *
 * The shell (sidebar + topbar) is already on screen when this renders: the
 * page slot is a Suspense boundary, so the frame paints after the shell's own
 * data instead of after the page's five query waves. Static shapes only — no
 * numbers, no invented rows.
 */
export function StaffPageSkeleton() {
  return (
    <div className="st-skel" role="status" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="st-skel-head st-skel-block" />
      <div className="st-skel-tiles">
        <div className="st-skel-tile st-skel-block" />
        <div className="st-skel-tile st-skel-block" />
        <div className="st-skel-tile st-skel-block" />
        <div className="st-skel-tile st-skel-block" />
      </div>
      <div className="st-skel-card st-skel-block" />
    </div>
  );
}

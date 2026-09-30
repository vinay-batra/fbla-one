/**
 * Red-pen grading marks, shared by the landing's sample sheet and the real
 * practice test so both are graded with the exact same strokes. Styles live in
 * globals.css under "Exam sheet" (.pen, .pen-circle, .pen-check, .pen-cross);
 * each stroke draws itself on with a dash-offset animation.
 */

/** A loose, overshooting loop, the way a teacher circles an answer. */
export function PenCircle() {
  return (
    <svg className="pen pen-circle" viewBox="0 0 52 46" aria-hidden="true">
      <path d="M8 17C12 6 28 2 38 6c9 4 12 14 8 23-5 11-22 14-32 9C5 34 3 25 8 17c3-5 9-8 15-9" />
    </svg>
  );
}

export function PenCheck() {
  return (
    <svg className="pen pen-check" viewBox="0 0 30 24" aria-hidden="true">
      <path d="M3 13c3 2 6 5 8 8 4-8 9-14 16-18" />
    </svg>
  );
}

export function PenCross() {
  return (
    <svg className="pen pen-cross" viewBox="0 0 30 30" aria-hidden="true">
      <path d="M5 5c7 6 13 13 20 20M25 4C18 11 12 18 5 26" />
    </svg>
  );
}

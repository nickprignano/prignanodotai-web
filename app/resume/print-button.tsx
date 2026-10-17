"use client";

export default function PrintButton() {
  return (
    <button type="button" className="print" onClick={() => window.print()}>
      Save as PDF
    </button>
  );
}

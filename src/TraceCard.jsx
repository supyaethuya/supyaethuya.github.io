import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Props:
 * - character:      string        e.g. "က"
 * - viewBox:        string        e.g. "0 0 300 320"  — must fit your path coords
 * - strokes:        array         [{ id, d, arrow? }, ...]
 * - ghost:          object        { x, y, fontSize, fontFamily? }
 *                                 Position of the background reference character.
 *                                 Your backend should provide this so it lines up
 *                                 with the actual stroke coordinates.
 *                                 Defaults to the centre of the viewBox if omitted.
 * - guideThreshold: number        hit-test tolerance in SVG units (default 18)
 * - minPoints:      number        minimum sampled points to accept a stroke (default 12)
 */
export default function CharacterTraceCard({
  character,
  viewBox = "0 150 300 180",
  strokes,
  ghost,
  guideThreshold = 18,
  minPoints = 12,
}) {
  const svgRef    = useRef(null);
  const pathRefs  = useRef([]);

  const [isDrawing,    setIsDrawing]    = useState(false);
  const [message,      setMessage]      = useState("Start from the green dot");
  const [activeStroke, setActiveStroke] = useState(0);
  const [userPoints,   setUserPoints]   = useState([]);
  const [completed,    setCompleted]    = useState(() => strokes.map(() => false));

  // Parse viewBox so pointer mapping is always correct
  const vb = useMemo(() => {
    const [x, y, w, h] = viewBox.split(/\s+/).map(Number);
    return { x, y, w, h };
  }, [viewBox]);

  // Derive ghost position: use prop if provided, otherwise centre of the viewBox
  const ghostPos = useMemo(() => ({
    x:          ghost?.x          ?? vb.x + vb.w / 2,
    y:          ghost?.y          ?? vb.y + vb.h * 0.35,   // baseline ~35% down
    fontSize:   ghost?.fontSize   ?? Math.min(vb.w, vb.h) * 0.75,
    fontFamily: ghost?.fontFamily ?? "Noto Sans Myanmar, Myanmar Text, Pyidaungsu, serif",
  }), [ghost, vb]);

  // Sample guide points from the real SVG path elements via getTotalLength / getPointAtLength
  const [sampled, setSampled] = useState(() => strokes.map(() => []));

  useEffect(() => {
    const next = strokes.map((_, i) => {
      const el = pathRefs.current[i];
      if (!el) return [];
      const len  = el.getTotalLength();
      const step = Math.max(6, len / 120);
      const pts  = [];
      for (let s = 0; s <= len; s += step) {
        const p = el.getPointAtLength(s);
        pts.push({ x: p.x, y: p.y });
      }
      return pts;
    });
    setSampled(next);
  }, [strokes]);

  // Reset internal state whenever the character data changes (new character loaded)
  useEffect(() => {
    setIsDrawing(false);
    setUserPoints([]);
    setActiveStroke(0);
    setCompleted(strokes.map(() => false));
    setMessage("Start from the green dot");
  }, [character, strokes]);

  const allDone = completed.every(Boolean);

  // helpers
  function getSvgPoint(event) {
    const svg = svgRef.current;
    if (!svg) return null;

    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    return pt.matrixTransform(ctm.inverse());
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function nearGuide(point, strokeIdx) {
    return (sampled[strokeIdx] || []).some(gp => dist(point, gp) <= guideThreshold);
  }

  function getStartEnd(strokeIdx) {
    const el = pathRefs.current[strokeIdx];
    if (!el) return null;
    const len = el.getTotalLength();
    const s   = el.getPointAtLength(0);
    const e   = el.getPointAtLength(len);
    return { start: { x: s.x, y: s.y }, end: { x: e.x, y: e.y } };
  }

  // ── event handlers ─────────────────────────────────────────────────────
  function handleStart(e) {
    if (allDone) return;
    const p  = getSvgPoint(e);
    const se = getStartEnd(activeStroke);
    if (!p || !se) return;

    if (dist(p, se.start) > guideThreshold) {
      setMessage("Start from the green dot");
      return;
    }
    setIsDrawing(true);
    setUserPoints([p]);
    setMessage(`Follow the dashed guide (stroke ${activeStroke + 1} of ${strokes.length})`);
  }

  function handleMove(e) {
    if (!isDrawing || allDone) return;
    const p = getSvgPoint(e);
    if (!p) return;

    if (!nearGuide(p, activeStroke)) {
      setIsDrawing(false);
      setUserPoints([]);
      setMessage("Too far from the guide — try again");
      return;
    }
    setUserPoints(prev => [...prev, p]);
  }

  function handleEnd() {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (userPoints.length < minPoints) {
      setUserPoints([]);
      setMessage("Stroke too short — try again");
      return;
    }

    const se   = getStartEnd(activeStroke);
    const last = userPoints[userPoints.length - 1];
    if (!se || !last) return;

    if (dist(last, se.end) <= guideThreshold + 4) {
      setCompleted(prev => {
        const copy = [...prev];
        copy[activeStroke] = true;
        return copy;
      });
      setUserPoints([]);

      const next = activeStroke + 1;
      if (next >= strokes.length) {
        setMessage("All strokes complete!");
      } else {
        setActiveStroke(next);
        setMessage(`Stroke ${activeStroke + 1} done! Now stroke ${next + 1}`);
      }
    } else {
      setUserPoints([]);
      setMessage("Finish closer to the arrow — try again");
    }
  }

  function reset() {
    setIsDrawing(false);
    setUserPoints([]);
    setActiveStroke(0);
    setCompleted(strokes.map(() => false));
    setMessage("Start from the green dot");
  }

  const userPath = userPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const activeSE = getStartEnd(activeStroke);

  // render
  return (
    <div className="trace-card">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="trace-svg"
        style={{ touchAction: "none" }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <defs>
          <marker id="trace-arrow" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
            <path d="M0,0 L3,1.5 L0,3 Z" fill="#333" />
          </marker>
        </defs>

        {/* Ghost reference character — positioned by backend-supplied ghost prop */}
        <text
          x={ghostPos.x}
          y={ghostPos.y}
          textAnchor="middle"
          fontSize={ghostPos.fontSize}
          fontFamily={ghostPos.fontFamily}
          className="character-bg"
          style={{ userSelect: "none", pointerEvents: "none" }}
        >
          {character}
        </text>

        {/* Start dot for the active stroke */}
        {!allDone && activeSE && (
          <circle cx={activeSE.start.x} cy={activeSE.start.y} r={ghostPos.fontSize<180 ? "8" : "9"} className="start-dot" />
        )}

        {/* Guide paths */}
        {strokes.map((s, i) => (
          <path
            key={s.id}
            ref={el => (pathRefs.current[i] = el)}
            d={s.d}
            fill="none"
            className={[
              "guide-path",
              completed[i]    ? "guide-path-complete" : "",
              i === activeStroke && !completed[i] ? "guide-path-active" : "guide-path-inactive",
            ].join(" ")}
            style={{strokeWidth: ghostPos.fontSize<150 && completed[i] ? "20" : ghostPos.fontSize<200 && completed[i] ?  "25" : completed[i] ? "30" : "10"}}
            markerEnd={!completed[i] && i === activeStroke ? "url(#trace-arrow)" : undefined}
          />
        ))}

        {/* Live user stroke */}
        {userPath && (
          <path d={userPath} fill="none" style={{strokeWidth: ghostPos.fontSize<150 ? "20" : ghostPos.fontSize<200 ? "25" : "30"}} className="user-path" />
        )}
      </svg>

      <p className="trace-message">{message}</p>

      <div className="trace-header">
        <button className="reset-btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
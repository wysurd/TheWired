export function Network({ layers = [4, 6, 6, 3], active = true, compact = false }: { layers?: number[]; active?: boolean; compact?: boolean }) {
 const width = 720, height = 300;
 const points = layers.map((n, l) => Array.from({ length: n }, (_, i) => ({ x: 70 + l * (580 / (layers.length - 1)), y: height / 2 + (i - (n - 1) / 2) * Math.min(38, 230 / n) })));
 return <svg className={`network ${active ? 'is-active' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Neural network with ${layers.length} layers and ${layers.join(', ')} neurons per layer`}>
 <defs><radialGradient id={compact ? 'glow-small' : 'glow'}><stop stopColor="#b8f399" stopOpacity=".1"/><stop offset="1" stopColor="#b8f399" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="360" cy="150" rx="320" ry="145" fill={`url(#${compact ? 'glow-small' : 'glow'})`}/>
 {points.slice(0, -1).flatMap((layer, l) => layer.flatMap((p, i) => points[l + 1].map((q, j) => <line key={`${l}-${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={(i + j) % 4 === 0 ? 'bright-edge' : 'edge'}/>)))}
 {points.flatMap((layer, l) => layer.map((p, i) => <g key={`${l}-${i}`} className="neuron" style={{ animationDelay: `${(l * .3 + i * .12)}s` }}><circle cx={p.x} cy={p.y} r="8" fill="#101c16" stroke="#9bc681"/><circle cx={p.x} cy={p.y} r="2.5" fill="#c4f5a7"/></g>))}
 {!compact && points.map((_, l) => <text key={l} x={points[l][0].x} y="290" textAnchor="middle">{l === 0 ? 'INPUT' : l === layers.length - 1 ? 'OUTPUT' : `HIDDEN ${l}`}</text>)}
 </svg>;
}

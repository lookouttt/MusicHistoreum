// Small inline-SVG replacement for the handful of font-awesome glyphs this site used
// (font-awesome@4.7.0 pulled in a whole icon font for 5 icons total - see C5 in
// docs/site-hardening-audit.md). Paths are Google's Material Design Icons (Apache License 2.0),
// chosen as solid/filled glyphs to match font-awesome's original visual weight.
const ICON_PATHS = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    comment: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
};

const Icon = ({ name, className, style }) => (
    <svg
        viewBox='0 0 24 24'
        width='1em'
        height='1em'
        fill='currentColor'
        className={className}
        style={{ verticalAlign: '-0.125em', ...style }}
        aria-hidden='true'
    >
        <path d={ICON_PATHS[name]} />
    </svg>
);

export default Icon;

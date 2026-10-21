import { Handle, Position } from '@xyflow/react';

const getColors = (status: string) => {
    if (status === 'status-due') return { hex: '#ff4d4d', shadow: '#ff4d4d' }; // Red
    if (status === 'status-mastered') return { hex: '#61e6a6', shadow: '#61e6a6' }; // Green
    return { hex: '#55d8ff', shadow: '#55d8ff' }; // Cyan
};

// Make the connection dots large and easy to grab
const handleStyle = {
    background: '#fff',
    border: '2px solid #55d8ff',
    width: '16px',
    height: '16px',
    boxShadow: '0 0 10px #55d8ff',
    cursor: 'crosshair',
    zIndex: 100 // Ensure they sit on top of everything
};

export function RootNode({ data, id }: any) {
    const colors = getColors(data.status);
    return (
        <div className={`node-root-wrapper ${data.status}`} onClick={() => data.onNodeClick?.({ id, data })}>
            <Handle type="target" position={Position.Left} style={{ ...handleStyle, left: '-8px' }} />
            <div
                className="node-root-orb"
                style={{
                    background: `radial-gradient(circle at 30% 30%, #fff, ${colors.hex} 60%, #000 100%)`,
                    borderColor: colors.hex,
                    boxShadow: `0 0 40px ${colors.shadow}, 0 0 80px ${colors.shadow}`
                }}
            ></div>
            <div className="node-label right" style={{ color: colors.hex, textShadow: `0 0 15px ${colors.shadow}` }}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Right} style={{ ...handleStyle, right: '-8px' }} />
        </div>
    );
}

export function PrimaryNode({ data, id }: any) {
    const colors = getColors(data.status);
    return (
        <div className={`node-primary-wrapper ${data.status}`} onClick={() => data.onNodeClick?.({ id, data })}>
            <Handle type="target" position={Position.Left} style={{ ...handleStyle, left: '-8px' }} />
            <div
                className="node-primary-orb"
                style={{
                    borderColor: colors.hex,
                    boxShadow: `0 0 20px ${colors.shadow}, 0 0 40px ${colors.shadow}`,
                    background: colors.hex
                }}
            ></div>
            <div className="node-label right" style={{ color: colors.hex, textShadow: `0 0 15px ${colors.shadow}` }}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Right} style={{ ...handleStyle, right: '-8px' }} />
        </div>
    );
}

export function SecondaryNode({ data, id }: any) {
    const colors = getColors(data.status);
    return (
        <div className={`node-secondary-wrapper ${data.side === 'left' ? 'flex-row-reverse' : ''} ${data.status}`} onClick={() => data.onNodeClick?.({ id, data })}>
            <Handle type="target" position={Position.Left} style={{ ...handleStyle, left: '-8px' }} />
            <div
                className="node-secondary-dot"
                style={{
                    borderColor: colors.hex,
                    boxShadow: `0 0 10px ${colors.shadow}, 0 0 20px ${colors.shadow}`,
                    background: colors.hex
                }}
            ></div>
            <div className="node-label" style={{ color: colors.hex, textShadow: `0 0 15px ${colors.shadow}` }}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Right} style={{ ...handleStyle, right: '-8px' }} />
        </div>
    );
}
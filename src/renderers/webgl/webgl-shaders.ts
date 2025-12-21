// WebGL Shaders for high-performance candlestick rendering

export const candlestickVertexShader = `#version 300 es
precision highp float;

// Per-instance attributes
in vec2 a_position;      // x, y center position
in vec4 a_ohlc;          // open, high, low, close Y coordinates
in vec4 a_bodyColor;     // RGBA body color
in vec4 a_wickColor;     // RGBA wick color
in vec4 a_borderColor;   // RGBA border color
in float a_barWidth;     // bar width in pixels

// Uniforms
uniform vec2 u_resolution;
uniform float u_pixelRatio;

// Outputs to fragment shader
out vec4 v_color;
out vec2 v_localPos;
out float v_barWidth;
out float v_openY;
out float v_closeY;
out float v_highY;
out float v_lowY;
out vec4 v_bodyColor;
out vec4 v_wickColor;
out vec4 v_borderColor;

void main() {
    // Vertex ID determines which corner of the quad we're rendering
    // 0=bottom-left, 1=bottom-right, 2=top-left, 3=top-right
    int vertexId = gl_VertexID % 4;

    float halfWidth = a_barWidth * 0.5;
    float minY = min(min(a_ohlc.x, a_ohlc.w), min(a_ohlc.y, a_ohlc.z)); // high
    float maxY = max(max(a_ohlc.x, a_ohlc.w), max(a_ohlc.y, a_ohlc.z)); // low

    // Add padding for wick
    float padding = 1.0;

    vec2 offset;
    if (vertexId == 0) {
        offset = vec2(-halfWidth - padding, maxY + padding);
    } else if (vertexId == 1) {
        offset = vec2(halfWidth + padding, maxY + padding);
    } else if (vertexId == 2) {
        offset = vec2(-halfWidth - padding, minY - padding);
    } else {
        offset = vec2(halfWidth + padding, minY - padding);
    }

    vec2 pos = a_position + offset;

    // Convert to clip space
    vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
    clipSpace.y = -clipSpace.y; // Flip Y

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // Pass data to fragment shader
    v_localPos = offset;
    v_barWidth = a_barWidth;
    v_openY = a_ohlc.x - a_position.y;
    v_highY = a_ohlc.y - a_position.y;
    v_lowY = a_ohlc.z - a_position.y;
    v_closeY = a_ohlc.w - a_position.y;
    v_bodyColor = a_bodyColor;
    v_wickColor = a_wickColor;
    v_borderColor = a_borderColor;
}
`;

export const candlestickFragmentShader = `#version 300 es
precision highp float;

in vec2 v_localPos;
in float v_barWidth;
in float v_openY;
in float v_closeY;
in float v_highY;
in float v_lowY;
in vec4 v_bodyColor;
in vec4 v_wickColor;
in vec4 v_borderColor;

uniform float u_wickWidth;
uniform float u_borderWidth;
uniform bool u_wickVisible;
uniform bool u_borderVisible;

out vec4 fragColor;

void main() {
    float halfWidth = v_barWidth * 0.5;
    float halfWickWidth = u_wickWidth * 0.5;

    float bodyTop = min(v_openY, v_closeY);
    float bodyBottom = max(v_openY, v_closeY);

    float x = v_localPos.x;
    float y = v_localPos.y;

    // Check if we're in the wick area (above or below body)
    bool inWickX = abs(x) <= halfWickWidth;
    bool inUpperWick = inWickX && y >= v_highY && y < bodyTop;
    bool inLowerWick = inWickX && y > bodyBottom && y <= v_lowY;

    // Check if we're in the body area
    bool inBodyX = abs(x) <= halfWidth;
    bool inBodyY = y >= bodyTop && y <= bodyBottom;
    bool inBody = inBodyX && inBodyY;

    // Check if we're in the border area
    bool inBorderX = abs(x) > halfWidth - u_borderWidth && abs(x) <= halfWidth;
    bool inBorderY = (y >= bodyTop && y < bodyTop + u_borderWidth) ||
                     (y > bodyBottom - u_borderWidth && y <= bodyBottom);
    bool inBorder = inBody && (inBorderX || inBorderY);

    if (u_wickVisible && (inUpperWick || inLowerWick)) {
        fragColor = v_wickColor;
    } else if (u_borderVisible && inBorder) {
        fragColor = v_borderColor;
    } else if (inBody) {
        fragColor = v_bodyColor;
    } else {
        discard;
    }
}
`;

// Simple vertex shader for drawing rectangles (used for simpler/faster rendering)
export const rectVertexShader = `#version 300 es
precision highp float;

in vec4 a_rect;      // x, y, width, height
in vec4 a_color;     // RGBA

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
    int vertexId = gl_VertexID % 4;

    vec2 pos;
    if (vertexId == 0) {
        pos = a_rect.xy;
    } else if (vertexId == 1) {
        pos = a_rect.xy + vec2(a_rect.z, 0.0);
    } else if (vertexId == 2) {
        pos = a_rect.xy + vec2(0.0, a_rect.w);
    } else {
        pos = a_rect.xy + a_rect.zw;
    }

    vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
    clipSpace.y = -clipSpace.y;

    gl_Position = vec4(clipSpace, 0.0, 1.0);
    v_color = a_color;
}
`;

export const rectFragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
    fragColor = v_color;
}
`;

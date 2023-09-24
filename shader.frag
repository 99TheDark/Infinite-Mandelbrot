#version 300 es

precision highp float;

uniform vec2 size;
uniform float zoom;
uniform vec2 offset;

in vec2 pos;
out vec4 color;

#define MAX_ITERATIONS 300
#define TAU 6.28318530717958647692

#define background vec3(0.0)
#define col1 vec3(0.549, 0.502, 0.729)
#define col2 vec3(0.129, 0.182, 0.361) 
#define col3 vec3(0.749, 0.737, 0.761)

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
}

vec3 HSVtoRGB(vec3 col) {
    float c = col.y * col.z;
    float h = col.x / 60.0;
    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
    float m = col.z - c;

    vec3 val;
    if(h < 1.0) {
        val = vec3(c, x, 0.0);
    } else if(h < 2.0) {
        val = vec3(x, c, 0.0);
    } else if(h < 3.0) {
        val = vec3(0.0, c, x);
    } else if(h < 4.0) {
        val = vec3(0.0, x, c);
    } else if(h < 5.0) {
        val = vec3(x, 0.0, c);
    } else if(h < 6.0) {
        val = vec3(c, 0.0, x);
    } 

    return val + m;
}

void main() {
    vec2 coord = pos * normalize(size) / zoom + offset;

    vec2 z = vec2(0.0);
    for(int i = 0; i < MAX_ITERATIONS; i++) {
        // (a+bi)^2 = a^2+2abi+bi^2 = a^2-b^2+2abi
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + coord;

        if(length(z) > 2.0) {
            float luminosity = float(i) / float(MAX_ITERATIONS);
            color = vec4(palette(luminosity, background, col1, col2, col3), 1.0);
            return;
        }
    }

    color = vec4(0.0, 0.0, 0.0, 1.0);
}
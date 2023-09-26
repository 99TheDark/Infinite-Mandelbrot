#version 300 es

precision highp float;

uniform vec2 size;
uniform float zoom;
uniform vec2 offset;
uniform vec2 orbit;

in vec2 pos;
out vec4 color;

#define MAX_ITERATIONS 1000
#define TAU 6.28318530717958647692

#define ADVANCED false

#define background vec3(0.0)
#define col1 vec3(0.549, 0.502, 0.729)
#define col2 vec3(0.129, 0.182, 0.361) 
#define col3 vec3(0.749, 0.737, 0.761)

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
}

vec2 cMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float mandelbrot(vec2 coord) {
    vec2 z = vec2(0.0);
    for(int i = 0; i < MAX_ITERATIONS; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + coord;

        if(dot(z, z) > 4.0) {
            return float(i) / float(MAX_ITERATIONS);
        }
    }
    return 0.0;
}

float mandelbrot_perturbation(vec2 orbit, vec2 uv) {
    vec2 delta = vec2(0.0);
    vec2 z = vec2(0.0);
    for(int i = 0; i < MAX_ITERATIONS; i++) {
        delta = cMul(2.0 * z + delta, delta) + uv;
        z = cMul(z, z) + orbit; 
        
        if(dot(delta, delta) > 4.0) {
            return float(i) / float(MAX_ITERATIONS); 
        }
    }
    return 0.0;
}

void main() {
    vec2 coord = pos * normalize(size) / zoom;

    float lum = ADVANCED ? 
                mandelbrot(offset + coord) : 
                mandelbrot_perturbation(orbit, coord + offset - orbit);
    
    color = vec4(palette(lum, background, col1, col2, col3), 1.0);
}
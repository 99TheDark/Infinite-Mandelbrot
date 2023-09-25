#version 300 es

precision highp float;

uniform vec2 size;
uniform float zoom;
uniform vec2 offset;

in vec2 pos;
out vec4 color;

#define MAX_ITERATIONS 1000
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

vec2 cMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float mandelbrot(vec2 coord) {
    vec2 z = vec2(0.0);
    for(int i = 0; i < MAX_ITERATIONS; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + coord;

        if(length(z) > 2.0) {
            return float(i) / float(MAX_ITERATIONS);
        }
    }
    return -1.0;
}

float mandelbrot_perturbation(vec2 center, vec2 uv) {
    float k = mandelbrot(center);
    if(k != -1.0) {
        return mandelbrot(center + uv);
    } else {
        vec2 z = vec2(0.0);
        vec2 dz = vec2(0.0);
        for(int i = 0; i < MAX_ITERATIONS; i++) {
            dz = cMul(2.0 * z + dz, dz) + uv;
            z = cMul(z, z) + center; // can be precomputed
            
            if(length(dz) > 2.0) {
                return float(i) / float(MAX_ITERATIONS); 
            }
        }
        return 0.0;
    }
}

void main() {
    vec2 coord = pos * normalize(size) * zoom;

    float lum = mandelbrot_perturbation(offset / size, coord);
    color = vec4(palette(lum, background, col1, col2, col3), 1.0);
}
import{S as z,i as Y,s as K,n as g,d as h,b as S,A as C,p as W,x as X,e as v,q as j,f as I,g as M,k as q}from"./index.BUbMsU07.js";function J(f){let t;return{c(){t=q("canvas"),this.h()},l(r){t=I(r,"CANVAS",{class:!0,"aria-hidden":!0}),M(t).forEach(h),this.h()},h(){v(t,"class","block h-full w-full"),v(t,"aria-hidden","true")},m(r,s){S(r,t,s),f[7](t)},p:g,d(r){r&&h(t),f[7](null)}}}function Q(f){let t;return{c(){t=q("div"),this.h()},l(r){t=I(r,"DIV",{class:!0,style:!0,"aria-hidden":!0}),M(t).forEach(h),this.h()},h(){v(t,"class","h-full w-full"),j(t,"background","radial-gradient(120% 90% at 78% 88%, #5a5a5a 0%, #2e2e2e 38%, #141414 68%, #080808 100%)"),v(t,"aria-hidden","true")},m(r,s){S(r,t,s)},p:g,d(r){r&&h(t)}}}function Z(f){let t;function r(n,u){return n[1]?Q:J}let s=r(f),o=s(f);return{c(){o.c(),t=C()},l(n){o.l(n),t=C()},m(n,u){o.m(n,u),S(n,t,u)},p(n,[u]){s===(s=r(n))&&o?o.p(n,u):(o.d(1),o=s(n),o&&(o.c(),o.m(t.parentNode,t)))},i:g,o:g,d(n){n&&h(t),o.d(n)}}}function $(f,t,r){let{speed:s=.045}=t,{scale:o=2.1}=t,{grain:n=.012}=t,{lo:u=.03}=t,{hi:b=.355}=t,i,m=!1;const G=`
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `,B=`
    precision highp float;
    uniform vec2  uRes;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uGrain;
    uniform float uLo;
    uniform float uHi;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p = m * p;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes.xy;
      vec2 p  = vec2(uv.x * (uRes.x / uRes.y), uv.y) * uScale;
      float t = uTime * uSpeed;

      // Two rounds of domain warping give the billowing, smoke-like folds.
      vec2 q = vec2(fbm(p + vec2(0.0, t)),
                    fbm(p + vec2(5.2, 1.3 - t)));
      vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.7),
                    fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.5));
      float f = fbm(p + 2.6 * r);

      // Light pools toward the lower right, as in the reference clip.
      float grad = smoothstep(0.0, 1.0, uv.x * 0.55 + (1.0 - uv.y) * 0.45);
      float v = smoothstep(0.12, 1.02, f * 0.9 + grad * 0.32);

      float lum = mix(uLo, uHi, v);

      // Ordered-ish dither kills banding across such a narrow value range.
      lum += (hash(gl_FragCoord.xy) - 0.5) * uGrain;

      gl_FragColor = vec4(vec3(lum), 1.0);
    }
  `;W(()=>{const e=i.getContext("webgl",{antialias:!1,alpha:!1,depth:!1})||i.getContext("experimental-webgl");if(!e){r(1,m=!0);return}function w(c,d){const l=e.createShader(c);return e.shaderSource(l,d),e.compileShader(l),e.getShaderParameter(l,e.COMPILE_STATUS)?l:(console.warn("[SmokeShader]",e.getShaderInfoLog(l)),null)}const A=w(e.VERTEX_SHADER,G),x=w(e.FRAGMENT_SHADER,B);if(!A||!x){r(1,m=!0);return}const a=e.createProgram();if(e.attachShader(a,A),e.attachShader(a,x),e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS)){console.warn("[SmokeShader]",e.getProgramInfoLog(a)),r(1,m=!0);return}e.useProgram(a);const H=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,H),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const R=e.getAttribLocation(a,"aPos");e.enableVertexAttribArray(R),e.vertexAttribPointer(R,2,e.FLOAT,!1,0,0);const N=e.getUniformLocation(a,"uRes"),O=e.getUniformLocation(a,"uTime");e.uniform1f(e.getUniformLocation(a,"uSpeed"),s),e.uniform1f(e.getUniformLocation(a,"uScale"),o),e.uniform1f(e.getUniformLocation(a,"uGrain"),n),e.uniform1f(e.getUniformLocation(a,"uLo"),u),e.uniform1f(e.getUniformLocation(a,"uHi"),b);const k=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let _=0,L=!0,V=performance.now();function y(){const c=i.getBoundingClientRect();if(!c.width||!c.height)return;const d=Math.min(window.devicePixelRatio||1,1.5),l=Math.max(1,Math.round(c.width*d)),U=Math.max(1,Math.round(c.height*d));(i.width!==l||i.height!==U)&&(r(0,i.width=l,i),r(0,i.height=U,i)),e.viewport(0,0,i.width,i.height),e.uniform2f(N,i.width,i.height)}function p(c){e.uniform1f(O,c),e.drawArrays(e.TRIANGLES,0,3)}function T(c){L&&p((c-V)/1e3),_=requestAnimationFrame(T)}y();const F=new ResizeObserver(()=>{y(),k&&p(8)});F.observe(i);let P=!1;const E=new IntersectionObserver(([c])=>{c.isIntersecting&&(P=!0),L=c.isIntersecting||!P},{rootMargin:"200px"});return E.observe(i),k?p(8):_=requestAnimationFrame(T),()=>{cancelAnimationFrame(_),F.disconnect(),E.disconnect()}});function D(e){X[e?"unshift":"push"](()=>{i=e,r(0,i)})}return f.$$set=e=>{"speed"in e&&r(2,s=e.speed),"scale"in e&&r(3,o=e.scale),"grain"in e&&r(4,n=e.grain),"lo"in e&&r(5,u=e.lo),"hi"in e&&r(6,b=e.hi)},[i,m,s,o,n,u,b,D]}class te extends z{constructor(t){super(),Y(this,t,$,Z,K,{speed:2,scale:3,grain:4,lo:5,hi:6})}}export{te as default};

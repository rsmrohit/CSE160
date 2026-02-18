// shaders.js - GLSL shader source code

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying float v_Depth;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    vec4 viewPos = u_ViewMatrix * worldPos;
    gl_Position = u_ProjectionMatrix * viewPos;

    v_UV = a_UV;
    v_Depth = -viewPos.z;

    // Transform normal properly
    v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform sampler2D u_Sampler;
  uniform bool u_UseTexture;
  uniform bool u_UseLighting;
  uniform vec4 u_Color;

  uniform vec3 u_LightDirection;
  uniform vec3 u_LightColor;
  uniform vec3 u_AmbientColor;
  uniform vec3 u_FogColor;
  uniform float u_FogNear;
  uniform float u_FogFar;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying float v_Depth;

  void main() {

    vec3 baseColor;

    if (u_UseTexture) {
      vec4 texColor = texture2D(u_Sampler, v_UV);
      if (texColor.a < 0.1) discard;
      baseColor = texColor.rgb;
    } else {
      baseColor = u_Color.rgb;
    }

    vec3 color;
    if (u_UseLighting) {
      vec3 normal = normalize(v_Normal);
      vec3 lightDir = normalize(u_LightDirection);

      // u_LightDirection is treated as the direction light rays travel.
      // Lambert needs the vector from fragment toward light, so negate it.
      float lambert = max(dot(normal, -lightDir), 0.0);
      lambert = lambert * 0.5 + 0.5;   // wrap light
      lambert = clamp(lambert, 0.0, 1.0);

      vec3 diffuse = lambert * u_LightColor * baseColor;
      vec3 ambient = u_AmbientColor * baseColor;

      color = diffuse + ambient;
    } else {
      color = baseColor;
    }

    float fogFactor = smoothstep(u_FogNear, u_FogFar, v_Depth);
    vec3 finalColor = mix(color, u_FogColor, fogFactor);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

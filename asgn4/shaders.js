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
  varying vec3 v_WorldPos;
  varying float v_Depth;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    vec4 viewPos = u_ViewMatrix * worldPos;
    gl_Position = u_ProjectionMatrix * viewPos;

    v_UV = a_UV;
    v_Depth = -viewPos.z;
    v_WorldPos = worldPos.xyz;

    // Transform normal properly
    v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  const int MAX_LIGHTS = 4;

  struct Light {
    float type;        // 0.0=point/spot, 1.0=directional
    float enabled;     // 0.0=off, 1.0=on
    vec3 position;     // used by point/spot
    vec3 direction;    // used by directional/spot
    vec3 color;
    float intensity;
    float range;       // point/spot attenuation distance
    float spotInnerCos; // spotlight inner cone cosine
    float spotOuterCos; // spotlight outer cone cosine
  };

  uniform sampler2D u_Sampler;
  uniform bool u_UseTexture;
  uniform bool u_UseLighting;
  uniform bool u_EnableLighting;
  uniform bool u_ShowNormals;
  uniform vec4 u_Color;

  uniform int u_NumLights;
  uniform Light u_Lights[MAX_LIGHTS];
  uniform vec3 u_AmbientColor;
  uniform vec3 u_CameraPos;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;
  varying float v_Depth;

  void main() {
    if (u_ShowNormals) {
      vec3 n = normalize(v_Normal) * 0.5 + 0.5;
      gl_FragColor = vec4(n, 1.0);
      return;
    }

    vec3 baseColor;

    if (u_UseTexture) {
      vec4 texColor = texture2D(u_Sampler, v_UV);
      if (texColor.a < 0.1) discard;
      baseColor = texColor.rgb;
    } else {
      baseColor = u_Color.rgb;
    }

    vec3 color;
    if (u_UseLighting && u_EnableLighting) {
      vec3 normal = normalize(v_Normal);
      vec3 viewDir = normalize(u_CameraPos - v_WorldPos);
      vec3 litColor = u_AmbientColor * baseColor;

      for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= u_NumLights) break;

        Light light = u_Lights[i];
        if (light.enabled < 0.5) continue;

        vec3 lightDir;
        float attenuation = 1.0;

        if (light.type < 0.5) {
          vec3 toLight = light.position - v_WorldPos;
          float dist = length(toLight);
          lightDir = dist > 0.0001 ? (toLight / dist) : vec3(0.0, 1.0, 0.0);

          if (light.range > 0.0) {
            float rangeFactor = clamp(1.0 - dist / light.range, 0.0, 1.0);
            attenuation *= rangeFactor * rangeFactor;
          }

          // Treat lights with a valid cone as spotlights.
          if (light.spotOuterCos > -0.999) {
            vec3 spotDir = normalize(light.direction);
            float cosTheta = dot(-lightDir, spotDir);
            float cone = smoothstep(light.spotOuterCos, light.spotInnerCos, cosTheta);
            attenuation *= cone;
          }
        } else {
          // Direction is interpreted as ray direction (from light to scene).
          lightDir = normalize(-light.direction);
        }

        float NdotL = max(dot(normal, lightDir), 0.0);
        if (NdotL <= 0.0) continue;

        vec3 diffuse = NdotL * light.color * baseColor * light.intensity * attenuation;
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 96.0);
        vec3 specular = spec * 0.35 * light.color * light.intensity * attenuation;
        litColor += diffuse + specular;
      }

      color = litColor;
    } else {
      color = baseColor;
    }

    vec3 finalColor = color;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const GsapEase = {
  POWER1: "power1",
  POWER1_IN: "power1.in",
  POWER1_OUT: "power1.out",
  POWER1_INOUT: "power1.inOut",
  POWER2: "power2",
  POWER2_IN: "power2.in",
  POWER2_OUT: "power2.out",
  POWER2_INOUT: "power2.inOut",
  POWER3: "power3",
  POWER3_IN: "power3.in",
  POWER3_OUT: "power3.out",
  POWER3_INOUT: "power3.inOut",
  POWER4: "power4",
  POWER4_IN: "power4.in",
  POWER4_OUT: "power4.out",
  POWER4_INOUT: "power4.inOut",
  SINE: "sine",
  SINE_IN: "sine.in",
  SINE_OUT: "sine.out",
  SINE_INOUT: "sine.inOut",
  EXPO: "expo",
  EXPO_IN: "expo.in",
  EXPO_OUT: "expo.out",
  EXPO_INOUT: "expo.inOut",
  CIRC: "circ",
  CIRC_IN: "circ.in",
  CIRC_OUT: "circ.out",
  CIRC_INOUT: "circ.inOut",
  BACK: "back",
  BACK_IN: "back.in",
  BACK_OUT: "back.out",
  BACK_INOUT: "back.inOut",
  BOUNCE: "bounce",
  BOUNCE_IN: "bounce.in",
  BOUNCE_OUT: "bounce.out",
  ELASTIC: "elastic",
  ELASTIC_IN: "elastic.in",
  ELASTIC_OUT: "elastic.out",
  ELASTIC_INOUT: "elastic.inOut",
} as const;

export const OverlayTypes = {
  NONE: "none",
  DEFAULT: "default",
  SCREEN: "screen",
} as const;

export const RadioBtnTypes = {
  NONE: "none",
  SETTING: "setting",
} as const;

export type GsapEase = (typeof GsapEase)[keyof typeof GsapEase];
export type OverlayTypes = (typeof OverlayTypes)[keyof typeof OverlayTypes];
export type RadioBtnTypes = (typeof RadioBtnTypes)[keyof typeof RadioBtnTypes];

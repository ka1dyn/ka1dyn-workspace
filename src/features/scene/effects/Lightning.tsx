import * as THREE from "three";
import { random } from "maath";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useSound } from "@/features/sounds/components/Sound";
import { useSoundVol, useStart, useTweaks } from "@/shared/stores";
import { useLab } from "@/features/lab/store";
import { fadeInAndPlay, fadeOutAndPause } from "@/features/sounds/utils/soundEffect";
import { LIGHTNING, LIGHTNING_HEX } from "../lightningUniforms";

// 번개: 섬광 리듬(maath FlashGen) + 천둥 소리 + 섬광 세기.
// 예전에는 구름(Cloud.tsx) 안에 있어서 밤 씬에서 구름을 끄면(8e397e7) 번개도 같이 사라졌다.
// 이제 구름과 따로 켜고 끈다.
//
// 섬광이 닿는 곳:
// - PBR 재질(퍼걸러·맥북·소품·타일 바닥·돌 지형): 아래 pointLight. ReflectLayer 안에 두면 물웅덩이 반사에서도 번쩍인다.
//   밤 씬에서는 NightLights가 환경맵 세기도 함께 올려 퍼걸러 아래까지 고르게 밝힌다.
// - 조명을 받지 않는 셰이더(잔디·수면·하늘): 공유 uniform LIGHTNING (Night/lightning.ts)
const MAX_LIGHT = 6.5; // 예전 번개 라이트 최대 세기 (2.5 ~ 6.5)

export default function Lightning() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const audioActive = useTweaks((state) => state.audioActive);
  const [flash] = useState(
    () =>
      new random.FlashGen({
        count: 8,
        minDuration: 40,
        maxDuration: 200,
        minInterval: 10000,
        maxInterval: 25000,
      }),
  );
  const start = useStart((state) => state.start);
  const rain = useSoundVol((state) => state.rain);

  const { soundRef, isReady } = useSound("audio/thunder.mp3");

  useEffect(() => {
    if (!isReady || !start) return;
    soundRef.current.gain.gain.value = rain;
  }, [isReady, start, rain]);

  useEffect(() => {
    if (!isReady || !start) return;
    if (audioActive) {
      fadeInAndPlay(soundRef.current, rain);
    } else {
      fadeOutAndPause(soundRef.current, rain);
    }
  }, [audioActive]);

  const playThunder = useCallback(() => {
    const thunder = soundRef.current;
    if (!isReady || !start) return;

    const thundertype = [
      { start: 4, end: 12 },
      { start: 18, end: 26 },
      { start: 28, end: 33 },
    ];
    const playType = thundertype[Math.floor(Math.random() * 3)];
    thunder.offset = playType.start;
    thunder.duration = playType.end - playType.start;

    const delay = Math.random() * 2 + 0.5;
    thunder.play(delay);
  }, [isReady, start, soundRef]);

  // 실험실 "번개 바로 보기" 버튼
  const now = useLab((s) => s.night.lightningNow);
  useEffect(() => {
    if (now > 0) flash.burst();
  }, [now, flash]);

  // 언마운트되면 섬광이 켜진 채로 남지 않게 끈다
  useEffect(
    () => () => {
      LIGHTNING.value = 0;
    },
    [],
  );

  const prevCnt = useRef<number>(0);
  useFrame((state, delta) => {
    const strength = useLab.getState().night.lightningStrength;
    // 섬광 하나가 켜져 있는 동안 매 프레임 세기를 흔들어 깜빡이게 하고, 꺼질 때는 FlashGen의 감쇠를 따른다
    const impulse = flash.update(state.clock.elapsedTime, delta);
    const f = impulse > 0 ? impulse * (0.4 + 0.6 * Math.random()) * strength : 0;
    LIGHTNING.value = f;
    lightRef.current.intensity = f * MAX_LIGHT;

    // 버스트가 시작될 때 천둥을 예약한다
    if (flash.currentCount != 0 && prevCnt.current == 0) playThunder();
    prevCnt.current = flash.currentCount;
  });

  return (
    <pointLight
      ref={lightRef}
      color={LIGHTNING_HEX}
      intensity={0}
      decay={0.3}
      position={[0, 10, 0]}
    />
  );
}

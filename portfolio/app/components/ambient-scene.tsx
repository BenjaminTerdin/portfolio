"use client";

import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Euler,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  Scene,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { useEffect, useRef } from "react";

type AmbientSceneProps = {
  isPhone: boolean;
  raised: boolean;
  reducedMotion: boolean;
  sceneLabel: string;
  openLabel: string;
  onOpen: () => void;
  onRaised: () => void;
  onLowered: () => void;
  onReady: () => void;
  onError: () => void;
};

function makeMaterial(color: string, roughness = 0.72, metalness = 0) {
  return new MeshStandardMaterial({ color, roughness, metalness });
}

function addRod(
  parent: Group,
  from: Vector3,
  to: Vector3,
  radius: number,
  material: MeshStandardMaterial,
) {
  const direction = new Vector3().subVectors(to, from);
  const rod = new Mesh(new CylinderGeometry(radius, radius, direction.length(), 12), material);
  rod.position.copy(from).add(to).multiplyScalar(0.5);
  rod.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  rod.castShadow = true;
  parent.add(rod);
  return rod;
}

function addTableware(scene: Scene, compact: boolean) {
  const ceramic = makeMaterial("#f4eee2", 0.38);
  const saucerMaterial = makeMaterial("#dfd5c5", 0.48);
  const coffeeMaterial = makeMaterial("#493022", 0.28);
  const flowerPotMaterial = makeMaterial("#eee5d6", 0.5);
  const soilMaterial = makeMaterial("#504336");
  const stemMaterial = makeMaterial("#58704f", 0.82);
  const leafMaterial = makeMaterial("#718c61", 0.72);
  const petalMaterial = makeMaterial("#fffaf0", 0.62);
  const centerMaterial = makeMaterial("#d7a84b", 0.48);

  const cupX = compact ? 1.5 : 4.15;
  const cupZ = compact ? -6.1 : -1.55;
  const saucer = new Mesh(new CylinderGeometry(0.78, 0.78, 0.08, 48), saucerMaterial);
  saucer.position.set(cupX, 0.08, cupZ);
  saucer.receiveShadow = true;
  scene.add(saucer);

  const cupPoints = [
    new Vector2(0.43, 0.12),
    new Vector2(0.51, 0.18),
    new Vector2(0.63, 1.02),
    new Vector2(0.54, 1.08),
    new Vector2(0.46, 0.98),
  ];
  const cup = new Mesh(new LatheGeometry(cupPoints, 40), ceramic);
  cup.position.set(cupX, 0.08, cupZ);
  cup.castShadow = true;
  cup.receiveShadow = true;
  scene.add(cup);

  const coffee = new Mesh(new CylinderGeometry(0.49, 0.49, 0.025, 40), coffeeMaterial);
  coffee.position.set(cupX, 0.99, cupZ);
  scene.add(coffee);

  const handle = new Mesh(new TorusGeometry(0.27, 0.075, 12, 32), ceramic);
  handle.rotation.y = Math.PI / 2;
  handle.position.set(cupX + 0.61, 0.62, cupZ);
  handle.castShadow = true;
  scene.add(handle);

  const plant = new Group();
  plant.position.set(compact ? -1.5 : -4.1, 0, compact ? -6.1 : -1.65);
  scene.add(plant);

  const pot = new Mesh(
    new LatheGeometry(
      [new Vector2(0.48, 0.06), new Vector2(0.7, 0.06), new Vector2(0.62, 0.88), new Vector2(0.55, 0.98)],
      40,
    ),
    flowerPotMaterial,
  );
  pot.castShadow = true;
  pot.receiveShadow = true;
  plant.add(pot);

  const soil = new Mesh(new CylinderGeometry(0.55, 0.55, 0.04, 40), soilMaterial);
  soil.position.y = 0.88;
  plant.add(soil);

  const blossoms = new Group();
  blossoms.position.y = 0.88;
  plant.add(blossoms);

  const flowerLocations = [
    [-0.43, 1.9, -0.08],
    [0.34, 2.18, 0.12],
    [0.04, 2.68, -0.04],
  ] as const;

  flowerLocations.forEach(([x, height, z], index) => {
    const stemTop = new Vector3(x * 0.76, height, z);
    addRod(plant, new Vector3(0, 0.86, 0), stemTop, 0.035, stemMaterial);

    const leaf = new Mesh(new SphereGeometry(1, 16, 12), leafMaterial);
    leaf.scale.set(0.34, 0.12, 0.16);
    leaf.position.set(x * 0.42 + (index % 2 ? -0.26 : 0.26), height - 1.12, z);
    leaf.rotation.z = index % 2 ? -0.45 : 0.45;
    plant.add(leaf);

    const flower = new Group();
    flower.position.set(x, height - 0.88, z);
    for (let petalIndex = 0; petalIndex < 6; petalIndex += 1) {
      const angle = (petalIndex / 6) * Math.PI * 2;
      const petal = new Mesh(new SphereGeometry(0.17, 14, 12), petalMaterial);
      petal.scale.set(0.72, 1.35, 0.55);
      petal.position.set(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0);
      petal.castShadow = true;
      flower.add(petal);
    }
    const center = new Mesh(new SphereGeometry(0.115, 16, 12), centerMaterial);
    center.position.z = 0.04;
    flower.add(center);
    blossoms.add(flower);
  });

  return plant;
}

export default function AmbientScene({
  isPhone,
  raised,
  reducedMotion,
  sceneLabel,
  openLabel,
  onOpen,
  onRaised,
  onLowered,
  onReady,
  onError,
}: AmbientSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onOpen, onRaised, onLowered, onReady, onError });
  const motionControlRef = useRef<((shouldRaise: boolean) => void) | null>(null);
  const raisedRef = useRef(raised);

  useEffect(() => {
    callbacksRef.current = { onOpen, onRaised, onLowered, onReady, onError };
  }, [onError, onLowered, onOpen, onRaised, onReady]);

  useEffect(() => {
    raisedRef.current = raised;
    motionControlRef.current?.(raised);
  }, [raised]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: WebGLRenderer | null = null;
    let frameId = 0;
    let disposed = false;

    try {
      const scene = new Scene();
      scene.background = new Color("#e7e1d5");
      const camera = new PerspectiveCamera(39, 1, 0.1, 100);
      const raycaster = new Raycaster();
      const pointer = new Vector2();
      const screenMaterial = new MeshStandardMaterial({
        color: "#020302",
        roughness: 0.2,
        metalness: 0,
        side: DoubleSide,
        emissive: new Color("#000000"),
        transparent: true,
        opacity: 0,
      });

      renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.domElement.className = "ambient-scene-canvas";
      renderer.domElement.tabIndex = 0;
      renderer.domElement.setAttribute("role", "button");
      mount.append(renderer.domElement);

      const tabletop = new Mesh(
        new PlaneGeometry(60, 60),
        makeMaterial("#eee8dd", 0.82),
      );
      tabletop.rotation.x = -Math.PI / 2;
      tabletop.position.y = -0.16;
      tabletop.receiveShadow = true;
      scene.add(tabletop);

      const edge = new Mesh(
        new RoundedBoxGeometry(60, 0.35, 60, 4, 0.16),
        makeMaterial("#ded5c7", 0.8),
      );
      edge.position.y = -0.38;
      edge.receiveShadow = true;
      scene.add(edge);

      scene.add(new AmbientLight("#fffaf0", 1.7));
      const keyLight = new DirectionalLight("#fff4df", 3.1);
      keyLight.position.set(-5, 11, 7);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 10;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.bias = -0.00025;
      keyLight.shadow.radius = 5;
      scene.add(keyLight);
      const fillLight = new PointLight("#d6e4dc", 16, 18, 2);
      fillLight.position.set(5, 7, 3);
      scene.add(fillLight);

      const deviceWidth = isPhone ? 2.42 : 6.35;
      const deviceLength = isPhone ? 4.72 : 4.12;
      const screenWidth = isPhone ? 2.14 : 5.87;
      const screenLength = isPhone ? 4.35 : 3.7;
      const deviceThickness = isPhone ? 0.24 : 0.32;
      const deviceTilt = isPhone ? 0.12 : 0.16;
      const idlePosition = new Vector3(0, isPhone ? 0.12 : 0.7, 0.35);
      const idleRotation = new Vector3(deviceTilt, -0.06, 0);
      const raisedPosition = new Vector3(0, isPhone ? 2.6 : 4.1, 4.1);
      const raisedRotation = new Vector3(isPhone ? 0.08 : 0.04, 0, 0);
      const idleScale = isPhone ? 0.64 : 0.54;
      const raisedScale = isPhone ? 1.6 : 2.4;
      const tablet = new Group();
      tablet.position.copy(idlePosition);
      tablet.rotation.set(idleRotation.x, idleRotation.y, idleRotation.z);
      tablet.scale.setScalar(idleScale);
      scene.add(tablet);

      const body = new Mesh(
        new RoundedBoxGeometry(deviceWidth, deviceThickness, deviceLength, 8, isPhone ? 0.25 : 0.19),
        makeMaterial("#090b0a", 0.3, 0.5),
      );
      body.castShadow = true;
      body.receiveShadow = true;
      tablet.add(body);

      const screen = new Mesh(new PlaneGeometry(screenWidth, screenLength), screenMaterial);
      screen.rotation.set(0, 0, 0);
      screen.position.set(0, 0, 0);
      screen.userData.isInteractiveScreen = true;
      tablet.add(screen);

      const cameraLens = new Mesh(
        new SphereGeometry(isPhone ? 0.045 : 0.055, 12, 10),
        makeMaterial("#121b1a", 0.18, 0.62),
      );
      cameraLens.position.set(0, deviceThickness / 2 + 0.01, -deviceLength / 2 + (isPhone ? 0.28 : 0.16));
      tablet.add(cameraLens);

      const flowers = addTableware(scene, isPhone);

      type DeviceTransition = {
        fromPosition: Vector3;
        fromRotation: Euler;
        fromScale: number;
        startTime: number;
        shouldRaise: boolean;
      };
      let deviceTransition: DeviceTransition | null = null;
      let deviceRaised = false;

      const transitionDevice = (shouldRaise: boolean) => {
        if (isPhone) {
          tablet.position.set(0, 0.12, 0.35);
          tablet.rotation.set(0.04, -0.1, -0.04);
          tablet.scale.setScalar(0.64);
          if (shouldRaise) callbacksRef.current.onRaised();
          else callbacksRef.current.onLowered();
          deviceRaised = shouldRaise;
          deviceTransition = null;
          return;
        }

        if (deviceRaised === shouldRaise && !deviceTransition) return;
        deviceRaised = shouldRaise;
        deviceTransition = {
          fromPosition: tablet.position.clone(),
          fromRotation: tablet.rotation.clone(),
          fromScale: tablet.scale.x,
          startTime: performance.now(),
          shouldRaise,
        };
      };
      motionControlRef.current = transitionDevice;
      if (raisedRef.current) transitionDevice(true);

      const resize = () => {
        if (!renderer || !mount) return;
        const width = mount.clientWidth || window.innerWidth;
        const height = mount.clientHeight || window.innerHeight;
        const aspect = width / height;
        camera.aspect = aspect;
        if (isPhone) {
          camera.position.set(0, 8.5, 10.5);
          camera.lookAt(0, 1.2, 0);
        } else {
          const distanceScale = Math.max(1, 0.9 / aspect);
          camera.position.set(0, 6.5 * distanceScale, 8.5 * distanceScale);
          camera.lookAt(0, 1.05, 0);
        }
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      const findScreen = (event: PointerEvent) => {
        const bounds = renderer?.domElement.getBoundingClientRect();
        if (!bounds) return false;
        pointer.set(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObject(screen, false).length > 0;
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (renderer) renderer.domElement.style.cursor = findScreen(event) ? "pointer" : "default";
      };
      const handlePointerDown = (event: PointerEvent) => {
        if (!deviceRaised && !deviceTransition && findScreen(event)) callbacksRef.current.onOpen();
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!deviceRaised && !deviceTransition) callbacksRef.current.onOpen();
      };

      renderer.domElement.addEventListener("pointermove", handlePointerMove);
      renderer.domElement.addEventListener("pointerdown", handlePointerDown);
      renderer.domElement.addEventListener("keydown", handleKeyDown);
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();

      const animate = (timestamp: number) => {
        if (disposed || !renderer) return;
        if (!reducedMotion) flowers.rotation.z = Math.sin(timestamp * 0.00055) * 0.012;

        if (deviceTransition) {
          if (isPhone) {
            tablet.position.set(0, 0.12, 0.35);
            tablet.rotation.set(0.04, -0.1, -0.04);
            tablet.scale.setScalar(0.64);
            deviceTransition = null;
            if (deviceRaised) callbacksRef.current.onRaised();
            else callbacksRef.current.onLowered();
          } else {
            const transition = deviceTransition;
            const duration = reducedMotion ? 1 : transition.shouldRaise ? 760 : 570;
            const progress = Math.min(1, (timestamp - transition.startTime) / duration);
            const eased = transition.shouldRaise
              ? 1 - Math.pow(1 - progress, 3)
              : progress * progress * (3 - 2 * progress);
            const targetPosition = transition.shouldRaise ? raisedPosition.clone() : idlePosition.clone();
            const targetRotation = transition.shouldRaise ? raisedRotation.clone() : idleRotation.clone();
            const targetScale = transition.shouldRaise ? raisedScale : idleScale;

            tablet.position.lerpVectors(transition.fromPosition, targetPosition, eased);
            tablet.rotation.set(
              transition.fromRotation.x + (targetRotation.x - transition.fromRotation.x) * eased,
              transition.fromRotation.y + (targetRotation.y - transition.fromRotation.y) * eased,
              transition.fromRotation.z + (targetRotation.z - transition.fromRotation.z) * eased,
            );
            tablet.scale.setScalar(transition.fromScale + (targetScale - transition.fromScale) * eased);

            if (progress >= 1) {
              deviceTransition = null;
              if (transition.shouldRaise) callbacksRef.current.onRaised();
              else callbacksRef.current.onLowered();
            }
          }
        }

        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      };
      frameId = window.requestAnimationFrame(animate);
      callbacksRef.current.onReady();

      return () => {
        disposed = true;
        motionControlRef.current = null;
        window.cancelAnimationFrame(frameId);
        observer.disconnect();
        renderer?.domElement.removeEventListener("pointermove", handlePointerMove);
        renderer?.domElement.removeEventListener("pointerdown", handlePointerDown);
        renderer?.domElement.removeEventListener("keydown", handleKeyDown);
        scene.traverse((object) => {
          if (object instanceof Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if ("map" in material && material.map) material.map.dispose();
              material.dispose();
            });
          }
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      renderer?.dispose();
      if (!disposed) callbacksRef.current.onError();
    }
  }, [isPhone, reducedMotion]);

  useEffect(() => {
    const canvas = mountRef.current?.querySelector("canvas");
    canvas?.setAttribute("aria-label", openLabel);
    canvas?.setAttribute("aria-describedby", "scene-access-hint");
  }, [openLabel]);

  return (
    <>
      <div ref={mountRef} className="ambient-canvas-wrap" aria-label={sceneLabel} />
      <p className="visually-hidden" id="scene-access-hint">{openLabel}</p>
    </>
  );
}

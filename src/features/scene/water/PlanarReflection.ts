// 수면을 기준으로 카메라를 뒤집은 가상 카메라를 만든다. (unseen-clone의 PlanarReflection을 그대로 옮김)
// 경사 투영으로 수면 아래 물체를 잘라내서, 땅속에 묻힌 부분이 반사에 비치는 문제를 막는다.
import * as THREE from "three";

export class PlanarReflection {
  readonly camera = new THREE.PerspectiveCamera();
  /** 월드 좌표를 반사 텍스처 UV로 바꾸는 행렬. 물 쉐이더의 uTextureMatrix */
  readonly textureMatrix = new THREE.Matrix4();

  private readonly normal = new THREE.Vector3(0, 1, 0);
  private readonly point: THREE.Vector3;
  private readonly plane = new THREE.Plane();
  private readonly cameraPosition = new THREE.Vector3();
  private readonly rotation = new THREE.Matrix4();
  private readonly lookAt = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly view = new THREE.Vector3();
  private readonly clip = new THREE.Vector4();
  private readonly q = new THREE.Vector4();

  constructor(height: number) {
    this.point = new THREE.Vector3(0, height, 0);
  }

  /** 수면 높이를 바꾼다 (실험실의 수면 높이 슬라이더) */
  setHeight(height: number) {
    this.point.y = height;
  }

  /** 카메라가 수면 위에 있을 때만 true를 돌려준다 */
  update(source: THREE.PerspectiveCamera) {
    this.cameraPosition.setFromMatrixPosition(source.matrixWorld);
    this.view.subVectors(this.point, this.cameraPosition);
    if (this.view.dot(this.normal) > 0) return false;

    this.view.reflect(this.normal).negate().add(this.point);
    this.rotation.extractRotation(source.matrixWorld);
    this.lookAt
      .set(0, 0, -1)
      .applyMatrix4(this.rotation)
      .add(this.cameraPosition);
    this.target
      .subVectors(this.point, this.lookAt)
      .reflect(this.normal)
      .negate()
      .add(this.point);

    const camera = this.camera;
    camera.position.copy(this.view);
    camera.up.set(0, 1, 0).applyMatrix4(this.rotation).reflect(this.normal);
    camera.lookAt(this.target);
    camera.near = source.near;
    camera.far = source.far;
    camera.updateMatrixWorld();
    camera.projectionMatrix.copy(source.projectionMatrix);

    // 클립 공간 [-1,1]을 텍스처 [0,1]로 옮기는 바이어스 행렬
    this.textureMatrix.set(
      0.5,
      0,
      0,
      0.5,
      0,
      0.5,
      0,
      0.5,
      0,
      0,
      0.5,
      0.5,
      0,
      0,
      0,
      1,
    );
    this.textureMatrix
      .multiply(camera.projectionMatrix)
      .multiply(camera.matrixWorldInverse);

    // 경사 근평면: 카메라의 near 평면을 수면과 일치시킨다 (Lengyel 기법)
    this.plane.setFromNormalAndCoplanarPoint(this.normal, this.point);
    this.plane.applyMatrix4(camera.matrixWorldInverse);
    this.clip.set(
      this.plane.normal.x,
      this.plane.normal.y,
      this.plane.normal.z,
      this.plane.constant,
    );
    const e = camera.projectionMatrix.elements;
    this.q.x = (Math.sign(this.clip.x) + e[8]) / e[0];
    this.q.y = (Math.sign(this.clip.y) + e[9]) / e[5];
    this.q.z = -1;
    this.q.w = (1 + e[10]) / e[14];
    this.clip.multiplyScalar(2 / this.clip.dot(this.q));
    e[2] = this.clip.x;
    e[6] = this.clip.y;
    e[10] = this.clip.z + 1 - 0.003;
    e[14] = this.clip.w;
    return true;
  }
}

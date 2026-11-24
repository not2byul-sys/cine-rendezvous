# 시네마 에셋 제작

이 디렉터리의 명령은 Blender를 백그라운드에서 실행합니다. Blender의 Python, glTF 내보내기와 Cycles만 사용하므로 별도 Python 패키지가 필요하지 않습니다. Mac에서는 `/Applications/Blender.app/Contents/MacOS/Blender`를 먼저 찾고, 다른 위치에 설치했다면 `BLENDER_BIN`으로 지정할 수 있습니다.

```bash
git switch test/lobby-rendering
./tools/cinema-assets/build.sh
./tools/cinema-assets/build.sh --asset cinema-sofa --samples 32
./tools/cinema-assets/build.sh --asset opal-lamp --no-preview
```

기본 출력은 `assets/cinema/`입니다. `--output <폴더>`로 검토용 출력 위치를 지정하고, `--asset`을 반복해서 필요한 모델만 생성할 수 있습니다. 미리보기 폭과 샘플 수는 `--size`와 `--samples`로 조절합니다.

| 에셋 | 모델 | 모바일 삼각형 제한 |
| --- | --- | ---: |
| `cinema-sofa` | 첨부된 라즈베리 벨벳 2인 소파, 연속 파이핑 | 6,500 |
| `chesterfield` | 가죽 소파, 터프팅, 쿠션 파이핑, 황동 징 | 11,000 |
| `oval-table` | 타원형 월넛 테이블 | 2,000 |
| `opal-lamp` | 황동 테이블 램프, 유백색 갓 | 2,000 |
| `brass-ashtray` | 테두리와 깊이가 있는 황동 재떨이 | 600 |

생성 모델은 미터 단위이며 바닥이나 테이블에 닿는 면을 원점 높이에 둡니다. 모델은 메시를 재질 단위로 병합한 뒤 GLB로 저장하고, 내보낸 파일의 인덱스를 읽어 삼각형 제한을 검증합니다. PNG는 중립적인 스튜디오 조명 아래 Cycles로 렌더링합니다. 디노이저가 빠진 Blender 빌드에서는 샘플 수를 늘려 렌더링을 재시도합니다.

## Mac 다운로드 폴더의 기존 모델

기본 빌드의 `cinema-sofa`는 첨부된 GLB 사본인 `source/cinema-sofa.glb`에서 시작해 파이핑과 벨벳 재질을 다듬습니다. 원본 첨부 파일은 수정하지 않습니다.

Mac에서 만든 다른 GLB를 별도 폴더로 가져와 미리보기와 모바일용 GLB를 생성할 수 있습니다. 예제의 파일명은 실제 파일명에 맞춰 바꾸세요.

```bash
./tools/cinema-assets/build.sh \
  --source-glb "$HOME/Downloads/cinema_sofa.glb" \
  --output ./asset-review
```

가져온 버전은 `imported-sofa.glb`와 `imported-sofa.png`로 출력됩니다. 가져오기 경로는 정적 소파용이며 리그와 애니메이션을 보존하는 용도로 설계되지 않았습니다. 원본 Blender Python 스크립트를 재실행하려면 스크립트에 지정된 출력 경로부터 확인하고, 다음 명령을 별도로 실행합니다.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python-exit-code 1 --python "$HOME/Downloads/cinema_sofa.py"
```

## 로비에서 확인

로비 왼쪽에는 라즈베리 벨벳 2인 소파를, 매점 옆에는 코냑색 체스터필드 3인 소파를 불러옵니다. 두 테이블에 램프와 재떨이를 함께 표시합니다. 기존 배치 편집과 착석 조작을 유지하며, 파일을 불러오지 못하면 기본 모델이 표시됩니다. 램프는 소품으로 표시되고 로비의 기존 조명과 그림자를 사용합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/`을 열어 확인합니다. `vendor/GLTFLoader.js`는 저장소의 Three.js r128과 같은 릴리스이며 MIT 라이선스가 적용됩니다. 라이선스 사본은 `vendor/three.LICENSE`에 있습니다.

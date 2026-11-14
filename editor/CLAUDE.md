# 클로드에게 전달할 작업
기존 Cine RendezVous 게임의 캐릭터 변경 버튼에 이 UI를 연결해 주세요. 데스크톱과 모바일은 같은 ES 모듈을 사용합니다. editor 폴더 전체를 정적 파일 경로에 넣고 기존 팝업을 열던 위치에서 openAvatarEditor를 호출하세요. 빌드나 npm 설치는 필요 없습니다.

## 연결 예시
아래 game 객체와 메서드는 연결 지점을 설명하는 예시입니다. 실제 저장소에서 기존 이름과 데이터 구조를 확인하고 매핑하세요.

~~~js
import {openAvatarEditor} from './editor/editor.js';
await openAvatarEditor({
  characters: game.characters.map(c => ({id: String(c.id), label: c.name, image: c.thumbnailUrl})),
  initial: game.readAppearanceForEditor(),
  baseline: game.defaultAppearanceForEditor(),
  renderPreview: (host, draft) => game.drawPreviewAvatar(host, draft),
  disposePreview: host => game.releasePreview(host),
  save: async draft => { await game.saveMyAppearance(draft); }
});
~~~

- initial과 baseline은 catalog.js의 defaults 구조를 사용합니다. character는 목록의 id와 동일한 문자열입니다. colors는 6개 부위의 HEX 또는 null(원래 소재 색)입니다. 기존 색이 팔레트 밖이면 저장값을 유지하고 선택 링만 비웁니다.
- items 값은 catalog.js의 영문 ID입니다. 기존 아이템 ID와 양방향으로 매핑하세요. 기존 프로필의 다른 속성은 보존하고 현재 접속자의 외형만 갱신하세요.
- preview는 선택할 때마다 호출됩니다. 별도의 프리뷰 아바타와 소재를 재사용하고 닫을 때 리소스를 해제하세요. 저장 성공 후 월드 아바타·닉네임과 기존 멀티플레이 동기화를 갱신하세요. 저장 실패는 예외로 전달하면 다시 시도할 수 있습니다.
- 초기화는 baseline으로 돌아가며 저장 버튼을 눌러야 확정됩니다. X와 Esc는 초안을 폐기합니다.
- 포함한 17개 액세서리 PNG는 선택 카드용입니다. 착용 프리뷰에는 기존 Three.js 모델이나 부착용 메시가 필요합니다. 원본 디자인에서 반복된 캐릭터는 예제에서 실제 서로 다른 4종만 표시합니다. 게임 연결 시 전체 카탈로그를 전달하세요.
- 모바일 기준 폭 390px, 전환점 760px. Pretendard는 게임에서 로드한 폰트를 사용합니다.
- 확인 방법은 이 폴더에서 python3 -m http.server 8000 실행 후 http://localhost:8000/demo.html 접속입니다. 예제는 로컬 저장과 캐릭터 이미지 미리보기를 제공하며 액세서리와 색의 3D 렌더링은 게임 연결 시 확인하세요.

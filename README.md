# CINE RENDEZVOUS · AI CINEMA

레트로 메타버스 극장 (single-file Three.js).

## 관리자 설정 유지하기
관리자 모드에서 바꾼 설정(상영작·시간표·배치·문구·포스터·상영정보·테마·아지트 영상·광고)은 기본적으로 **그 브라우저에만** 저장됩니다.
모든 방문자에게 계속 유지되게 하려면:

1. 사이트에서 `관리` → `설정 내보내기` → `site-config.json` 다운로드
2. 이 저장소의 `index.html` 옆에 `site-config.json` 을 업로드(덮어쓰기)
3. GitHub Pages 반영(1~2분) 후, 모든 방문자가 이 설정으로 열립니다.

새 파일을 올리면 파일 안의 `rev` 가 바뀌어 기존 방문자에게도 다시 적용됩니다.
`설정 가져오기` 로 다른 브라우저에 같은 설정을 불러올 수도 있습니다.

## 필요한 보조 파일
`index.html` 은 `cloud-config.js`, `cloud-media.js`, `club-preview.js` 를 함께 불러옵니다. 이 파일들도 같은 폴더에 올려 주세요.

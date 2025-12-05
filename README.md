## 국립국어원 끝말잇기 (HTML 단일 페이지)

국립국어원 표준국어대사전 XML을 변환해 **359,385개** 표제어를 HTML에 그대로 내장한 끝말잇기입니다. 브라우저가 데이터를 복원하므로 API 키, 서버, 프록시가 전혀 필요 없습니다.

### 기능 개요
- 43만개에 달하는 표준국어대사전 단어/풀이 내장
- 인터넷 연결 없이 단어 검증, 힌트, 체인 복사 가능
- 모든 데이터는 메모리에만 상주 (개인정보·API 키 필요 없음)
- 단일 `index.html`만 Netlify에 업로드하면 즉시 서비스

---

### 제작/갱신 방법
1. **사전 XML 확보**  
   - `temp_dict/` 폴더에 국립국어원에서 내려받은 XML을 넣습니다. (현재 저장소는 [spellcheck-ko/korean-dict-nikl-stdict](https://github.com/spellcheck-ko/korean-dict-nikl-stdict) 리포지터리를 클론해 둔 상태입니다.)
2. **의존성 설치**
   ```bash
   npm install
   ```
3. **사전 변환 및 HTML 생성**
   ```bash
   npm run build    # build/dictionary.* 생성 후 index.html에 삽입
   ```
   - `scripts/build-dataset.mjs`: XML → JSON → LZ-String(Base64)
   - `scripts/embed-dataset.mjs`: `index.template.html`의 `%%DICTIONARY_DATA%%` 자리에 압축 데이터를 주입해 최종 `index.html` 생성

> `index.html`은 15MB가 넘는 대용량 파일입니다. Netlify 정적 배포에는 문제가 없으나, 필요 시 `index.template.html`을 수정한 뒤 `npm run build`를 다시 실행해 주세요.

---

### 사용 방법
1. `index.html` 한 파일만 열면 사전이 자동으로 풀립니다. (최초 2~3초 소요)
2. 단어를 입력하면 로컬 사전으로 즉시 검증하고 체인을 기록합니다.
3. 힌트는 동일한 첫 글자 목록에서 미사용 단어 최대 5개를 제공합니다.
4. `체인 복사`로 현재 진행 상황을 클립보드에 텍스트로 복사할 수 있습니다.

---

### Netlify 배포
Netlify CLI 17.x 문서를 2025-12-05 기준으로 다시 확인했습니다. (`netlify/cli`)

1. **CLI 설치**
   ```bash
   npm install -g netlify-cli
   ```
2. **사이트 초기화/연결**
   ```bash
   netlify init          # 새 사이트 생성 또는 기존 사이트와 연결
   ```
3. **정적 배포**
   ```bash
   netlify deploy --dir=. --prod --no-build
   ```
   - HTML만 업로드하므로 `--no-build`가 안전합니다.
   - 필요 시 `netlify deploy --message "dictionary refresh"` 등 메시지를 추가할 수 있습니다.

기타 관리 명령: `netlify sites:list`, `netlify open:site`, `netlify logs:deploy` 등.

---

### 커스터마이징 팁
- UI/로직은 `index.template.html`에서 수정한 뒤 `npm run build`로 재생성합니다.
- `scripts/build-dataset.mjs`에서 필터(단어 길이, 품사 등)를 적용하면 데이터 용량을 조절할 수 있습니다.
- 비공개 프로젝트에서는 `temp_dict/`를 `.gitignore`에 추가해 저장소 크기를 줄일 수 있습니다.

---

### 라이선스
- 사전 데이터: 국립국어원 표준국어대사전 (CC BY-SA 2.0 KR)
- UI/로직: MIT (필요 시 자유롭게 수정/배포)



# SCSA 대시보드

SCSA 멤버들의 주식·ETF 수익률을 실시간으로 추적하는 대시보드.

**배포 주소**: `https://<your-github-username>.github.io/stock-scsa/`

## 멤버 & 종목

| 멤버 | 종목 | Yahoo Finance 심볼 |
|------|------|-------------------|
| 혜민 | 도이치모터스 | `067990.KQ` |
| 혜준 | 현대백화점 | `069960.KS` |
| 승기 | KBI동양철관 | `008970.KS` |
| 준영 | 현대차 | `005380.KS` |
| 예원 | 한국파마 | `032300.KQ` |
| 서현 | QTUM ETF | `QTUM` |

> **심볼 확인**: [finance.yahoo.com/lookup](https://finance.yahoo.com/lookup) 에서 검색 후 `src/data/members.js`와 `scripts/fetch-prices.js`의 심볼을 수정하세요.

## 로컬 실행

```bash
npm install
node scripts/fetch-prices.js   # 현재 시세 수집 (public/data.json 업데이트)
npm run dev                     # 개발 서버 http://localhost:5173/stock-scsa/
```

## GitHub Pages 배포

1. GitHub에서 `stock-scsa` public 레포 생성
2. 레포 **Settings → Pages → Source** 를 `gh-pages` 브랜치로 설정
3. 코드를 `main` 브랜치에 push

```bash
git remote add origin https://github.com/<username>/stock-scsa.git
git push -u origin main
```

4. **Actions** 탭에서 워크플로우가 실행되면 자동 배포 완료

## 시세 자동 갱신

- `main` 브랜치에 push할 때마다 배포
- 평일 KST 09:00~17:00 사이 2시간 간격으로 자동 갱신 (GitHub Actions 스케줄)
- 수동 실행: Actions 탭 → Deploy to GitHub Pages → **Run workflow**
- 화면에서는 브라우저에서 가능한 경우 최신 시세를 직접 가져오고, 실패하면 GitHub Actions가 생성한 `public/data.json` 스냅샷을 fallback으로 사용합니다.

## 데이터 출처

- 국내 주식: [Yahoo Finance](https://finance.yahoo.com) (무료 공개 API, 키 불필요)
- 미국 ETF: [Yahoo Finance](https://finance.yahoo.com) (무료 공개 API, 키 불필요)
- USD/KRW 환율: Yahoo Finance `USDKRW=X`

시세 수집 실패 시 대시(`-`)로 표시되며, 이전 배포 데이터가 유지됩니다.

## 보안

이 레포는 **public**입니다. API 키·토큰·개인정보는 절대 커밋하지 마세요.  
`.gitignore`에 `.env`, `*.key` 등이 포함되어 있습니다.

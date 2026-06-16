export default function ExcelRibbon({ activeTab, onTabChange }) {
  const tabs = ['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기']

  return (
    <div className="select-none" style={{ fontFamily: 'Calibri, Arial, sans-serif' }}>
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3"
        style={{ background: '#217346', height: 28 }}
      >
        <div className="flex items-center gap-2">
          {/* Excel icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect width="18" height="18" rx="2" fill="#1e6c3b" />
            <text x="2" y="14" fontSize="13" fontWeight="bold" fill="white" fontFamily="Arial">X</text>
          </svg>
          {/* QAT icons */}
          {['💾', '↩', '↪'].map((icon, i) => (
            <button
              key={i}
              type="button"
              className="text-white opacity-80 hover:opacity-100 text-xs px-1"
              title={['저장', '실행 취소', '다시 실행'][i]}
            >
              {icon}
            </button>
          ))}
        </div>
        <span className="text-white text-xs font-medium tracking-wide">
          주식경쟁.xlsx - Microsoft Excel
        </span>
        <div className="flex items-center gap-1">
          {['－', '□', '✕'].map((c, i) => (
            <button
              key={i}
              type="button"
              className="text-white text-xs w-8 h-5 hover:bg-white/20 flex items-center justify-center"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ribbon tabs */}
      <div
        className="flex items-end px-2 gap-0"
        style={{ background: '#217346', paddingTop: 3 }}
      >
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className="px-3 py-1 text-xs rounded-t-sm transition-colors"
            style={
              activeTab === tab
                ? { background: '#f2f2f2', color: '#1f1f1f', fontWeight: 600 }
                : { color: 'white', background: 'transparent' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon content */}
      <div
        className="flex items-stretch gap-0 border-b"
        style={{ background: '#f2f2f2', borderColor: '#c0c0c0', minHeight: 72 }}
      >
        {/* 클립보드 group */}
        <RibbonGroup label="클립보드">
          <RibbonBigBtn icon="📋" label="붙여넣기" />
          <div className="flex flex-col gap-0.5">
            <RibbonSmallBtn icon="✂️" label="잘라내기" />
            <RibbonSmallBtn icon="📄" label="복사" />
            <RibbonSmallBtn icon="🖌" label="서식 복사" />
          </div>
        </RibbonGroup>

        {/* 글꼴 group */}
        <RibbonGroup label="글꼴">
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center gap-1">
              <select
                className="text-xs border px-1 py-0.5 rounded"
                style={{ borderColor: '#c0c0c0', width: 90, background: 'white' }}
                defaultValue="Calibri"
              >
                <option>Calibri</option>
                <option>Arial</option>
                <option>맑은 고딕</option>
              </select>
              <select
                className="text-xs border px-1 py-0.5 rounded"
                style={{ borderColor: '#c0c0c0', width: 40, background: 'white' }}
                defaultValue="11"
              >
                {[9, 10, 11, 12, 14, 16, 18, 20, 24].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              {['B', 'I', 'U'].map(f => (
                <button
                  key={f}
                  className="w-6 h-6 text-xs font-bold border rounded hover:bg-gray-200"
                  style={{ borderColor: '#c0c0c0', fontStyle: f === 'I' ? 'italic' : 'normal', textDecoration: f === 'U' ? 'underline' : 'none' }}
                >
                  {f}
                </button>
              ))}
              <div className="w-px h-5 bg-gray-300 mx-0.5" />
              <button className="w-6 h-6 text-xs border rounded hover:bg-gray-200" style={{ borderColor: '#c0c0c0' }}>
                <span style={{ borderBottom: '2px solid black', fontSize: 10 }}>A</span>
              </button>
              <button className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-200" style={{ borderColor: '#c0c0c0' }}>
                <span style={{ fontSize: 10 }}>🎨</span>
              </button>
            </div>
          </div>
        </RibbonGroup>

        {/* 맞춤 group */}
        <RibbonGroup label="맞춤">
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex gap-0.5">
              {['⬆','↑','⬇'].map((ic, i) => (
                <button key={i} className="w-6 h-6 text-xs border rounded hover:bg-gray-200 flex items-center justify-center" style={{ borderColor: '#c0c0c0', fontSize: 10 }}>
                  {ic}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5">
              {['≡','≡','≡'].map((ic, i) => (
                <button key={i} className="w-6 h-6 text-xs border rounded hover:bg-gray-200 flex items-center justify-center" style={{ borderColor: '#c0c0c0', fontSize: 11 }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </RibbonGroup>

        {/* 표시 형식 group */}
        <RibbonGroup label="표시 형식">
          <div className="flex flex-col gap-1 pt-1">
            <select
              className="text-xs border px-1 py-0.5 rounded"
              style={{ borderColor: '#c0c0c0', width: 80, background: 'white' }}
              defaultValue="일반"
            >
              {['일반', '숫자', '통화', '회계', '날짜', '시간', '백분율', '분수', '지수', '텍스트'].map(f => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <div className="flex gap-0.5">
              {['₩', '%', ',', '.0', '.00'].map((ic, i) => (
                <button key={i} className="px-1 h-6 text-xs border rounded hover:bg-gray-200" style={{ borderColor: '#c0c0c0', minWidth: 20 }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </RibbonGroup>

        {/* 스타일 group */}
        <RibbonGroup label="스타일">
          <div className="flex flex-col gap-1 pt-1">
            <RibbonSmallBtn icon="🎨" label="조건부 서식" />
            <RibbonSmallBtn icon="📊" label="표로 서식" />
            <RibbonSmallBtn icon="🔲" label="셀 스타일" />
          </div>
        </RibbonGroup>

        {/* 셀 group */}
        <RibbonGroup label="셀">
          <div className="flex flex-col gap-1 pt-1">
            <RibbonSmallBtn icon="➕" label="삽입" />
            <RibbonSmallBtn icon="🗑" label="삭제" />
            <RibbonSmallBtn icon="⚙" label="서식" />
          </div>
        </RibbonGroup>

        {/* 편집 group */}
        <RibbonGroup label="편집">
          <div className="flex flex-col gap-1 pt-1">
            <RibbonSmallBtn icon="Σ" label="자동 합계" />
            <RibbonSmallBtn icon="⬇" label="채우기" />
            <RibbonSmallBtn icon="🔍" label="찾기/선택" />
          </div>
        </RibbonGroup>
      </div>

      {/* Formula bar */}
      <div
        className="flex items-center gap-0 border-b"
        style={{ background: '#f2f2f2', borderColor: '#c0c0c0', height: 24 }}
      >
        {/* Name box */}
        <div
          className="flex items-center justify-center text-xs border-r px-2"
          style={{ width: 70, borderColor: '#c0c0c0', height: '100%', background: 'white' }}
        >
          A1
        </div>
        {/* fx label */}
        <div
          className="flex items-center justify-center text-xs border-r px-2 italic text-gray-500"
          style={{ width: 28, borderColor: '#c0c0c0', height: '100%' }}
        >
          fx
        </div>
        {/* Formula input */}
        <div
          className="flex-1 flex items-center px-2 text-xs"
          style={{ height: '100%', background: 'white', borderLeft: 'none' }}
        >
          =STOCKPRICE(주식경쟁)
        </div>
      </div>
    </div>
  )
}

function RibbonGroup({ label, children }) {
  return (
    <div
      className="flex items-start gap-1 px-2 py-1 border-r relative"
      style={{ borderColor: '#c0c0c0', minWidth: 'max-content' }}
    >
      <div className="flex items-start gap-1">{children}</div>
      <span
        className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-gray-500"
      >
        {label}
      </span>
    </div>
  )
}

function RibbonBigBtn({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-0.5 px-1 py-0.5 rounded hover:bg-gray-200 text-xs" style={{ minWidth: 36 }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10 }}>{label}</span>
    </button>
  )
}

function RibbonSmallBtn({ icon, label }) {
  return (
    <button className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-gray-200 text-xs whitespace-nowrap" style={{ height: 18 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 10 }}>{label}</span>
    </button>
  )
}

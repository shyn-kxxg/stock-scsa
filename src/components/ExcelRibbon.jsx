export default function ExcelRibbon({ activeTab, onTabChange }) {
  const tabs = ['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기']
  const quickActions = [
    { label: '저장', mark: 'S' },
    { label: '실행 취소', mark: '↶' },
    { label: '다시 실행', mark: '↷' },
  ]

  return (
    <div className="select-none" style={{ fontFamily: 'Calibri, Arial, sans-serif', color: '#111' }}>
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3"
        style={{ background: '#fbfbfb', borderBottom: '1px solid #d0d0d0', height: 30 }}
      >
        <div className="flex items-center gap-1.5">
          {/* Excel icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect width="18" height="18" rx="2" fill="#1e6c3b" />
            <text x="2" y="14" fontSize="13" fontWeight="bold" fill="white" fontFamily="Arial">X</text>
          </svg>
          {/* QAT icons */}
          {quickActions.map(action => (
            <button
              key={action.label}
              type="button"
              className="w-5 h-5 border border-transparent hover:border-[#ababab] hover:bg-[#f0f0f0] flex items-center justify-center text-[10px] leading-none"
              title={action.label}
            >
              {action.mark}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium tracking-wide" style={{ color: '#111' }}>
          주식경쟁.xlsx - Microsoft Excel
        </span>
        <div className="flex items-center gap-1">
          {['-', '□', 'x'].map((c, i) => (
            <button
              key={i}
              type="button"
              className="text-xs w-8 h-5 hover:bg-[#e6e6e6] flex items-center justify-center"
              style={{ color: '#111' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ribbon tabs */}
      <div
        className="flex items-end px-2 gap-0"
        style={{ background: '#f3f2f1', borderBottom: '1px solid #d0d0d0', paddingTop: 3 }}
      >
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className="px-3 py-1 text-xs rounded-t-sm transition-colors"
            style={
              activeTab === tab
                ? { background: 'white', color: '#111', borderTop: '2px solid #217346', fontWeight: 600 }
                : { color: '#111', background: 'transparent' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon content */}
      <div
        className="flex items-stretch gap-0 border-b"
        style={{ background: '#f8f8f8', borderColor: '#c0c0c0', minHeight: 78, color: '#111' }}
      >
        {/* 클립보드 group */}
        <RibbonGroup label="클립보드">
          <RibbonBigBtn icon={<ClipboardIcon />} label="붙여넣기" />
          <div className="flex flex-col gap-0.5">
            <RibbonSmallBtn icon={<CutIcon />} label="잘라내기" />
            <RibbonSmallBtn icon={<CopyIcon />} label="복사" />
            <RibbonSmallBtn icon={<BrushIcon />} label="서식 복사" />
          </div>
        </RibbonGroup>

        {/* 글꼴 group */}
        <RibbonGroup label="글꼴">
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center gap-1">
              <select
                className="text-xs border px-1 py-0.5 rounded"
                style={{ borderColor: '#c0c0c0', width: 90, background: 'white', color: '#111' }}
                defaultValue="Calibri"
              >
                <option>Calibri</option>
                <option>Arial</option>
                <option>맑은 고딕</option>
              </select>
              <select
                className="text-xs border px-1 py-0.5 rounded"
                style={{ borderColor: '#c0c0c0', width: 40, background: 'white', color: '#111' }}
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
                  style={{ borderColor: '#c0c0c0', color: '#111', fontStyle: f === 'I' ? 'italic' : 'normal', textDecoration: f === 'U' ? 'underline' : 'none' }}
                >
                  {f}
                </button>
              ))}
              <div className="w-px h-5 bg-gray-300 mx-0.5" />
              <button className="w-6 h-6 text-xs border rounded hover:bg-gray-200" style={{ borderColor: '#c0c0c0', color: '#111' }}>
                <span style={{ borderBottom: '2px solid black', fontSize: 10 }}>A</span>
              </button>
              <button className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-200" style={{ borderColor: '#c0c0c0', color: '#111' }}>
                <span className="inline-block w-3 h-3 border" style={{ background: '#ffe699', borderColor: '#777' }} />
              </button>
            </div>
          </div>
        </RibbonGroup>

        {/* 맞춤 group */}
        <RibbonGroup label="맞춤">
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex gap-0.5">
              {['Top','Mid','Bot'].map((ic, i) => (
                <button key={i} className="w-8 h-6 border rounded hover:bg-gray-200 flex items-center justify-center" style={{ borderColor: '#c0c0c0', color: '#111', fontSize: 9 }}>
                  {ic}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5">
              {['L','C','R'].map((ic, i) => (
                <button key={i} className="w-6 h-6 text-xs border rounded hover:bg-gray-200 flex items-center justify-center" style={{ borderColor: '#c0c0c0', color: '#111', fontSize: 11 }}>
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
              style={{ borderColor: '#c0c0c0', width: 80, background: 'white', color: '#111' }}
              defaultValue="일반"
            >
              {['일반', '숫자', '통화', '회계', '날짜', '시간', '백분율', '분수', '지수', '텍스트'].map(f => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <div className="flex gap-0.5">
              {['₩', '%', ',', '.0', '.00'].map((ic, i) => (
                <button key={i} className="px-1 h-6 text-xs border rounded hover:bg-gray-200" style={{ borderColor: '#c0c0c0', color: '#111', minWidth: 20 }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </RibbonGroup>

        {/* 스타일 group */}
        <RibbonGroup label="스타일">
          <div className="flex flex-col gap-1 pt-1">
            <RibbonSmallBtn icon={<GridIcon />} label="조건부 서식" />
            <RibbonSmallBtn icon={<TableIcon />} label="표로 서식" />
            <RibbonSmallBtn icon={<CellIcon />} label="셀 스타일" />
          </div>
        </RibbonGroup>

        {/* 셀 group */}
        <RibbonGroup label="셀">
          <div className="flex flex-col gap-1 pt-1">
            <RibbonSmallBtn icon={<PlusIcon />} label="삽입" />
            <RibbonSmallBtn icon={<MinusIcon />} label="삭제" />
            <RibbonSmallBtn icon={<FormatIcon />} label="서식" />
          </div>
        </RibbonGroup>

        {/* 편집 group */}
        <RibbonGroup label="편집">
          <div className="flex flex-col gap-1 pt-1">
            <RibbonSmallBtn icon="Σ" label="자동 합계" />
            <RibbonSmallBtn icon={<FillIcon />} label="채우기" />
            <RibbonSmallBtn icon={<SearchIcon />} label="찾기/선택" />
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
          style={{ width: 70, borderColor: '#c0c0c0', height: '100%', background: 'white', color: '#111' }}
        >
          A1
        </div>
        {/* fx label */}
        <div
          className="flex items-center justify-center text-xs border-r px-2 italic"
          style={{ width: 28, borderColor: '#c0c0c0', height: '100%', color: '#111' }}
        >
          fx
        </div>
        {/* Formula input */}
        <div
          className="flex-1 flex items-center px-2 text-xs"
          style={{ height: '100%', background: 'white', borderLeft: 'none', color: '#111' }}
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
      style={{ borderColor: '#d7d7d7', minWidth: 'max-content', color: '#111' }}
    >
      <div className="flex items-start gap-1">{children}</div>
      <span
        className="absolute bottom-1 left-0 right-0 text-center text-[10px]"
        style={{ color: '#111' }}
      >
        {label}
      </span>
    </div>
  )
}

function RibbonBigBtn({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-0.5 px-1 py-0.5 rounded hover:bg-gray-200 text-xs" style={{ minWidth: 42, color: '#111' }}>
      <span className="flex h-7 items-center justify-center" style={{ lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, color: '#111' }}>{label}</span>
    </button>
  )
}

function RibbonSmallBtn({ icon, label }) {
  return (
    <button className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-gray-200 text-xs whitespace-nowrap" style={{ height: 18, color: '#111' }}>
      <span className="flex w-4 items-center justify-center" style={{ fontSize: 11, color: '#111' }}>{icon}</span>
      <span style={{ fontSize: 10, color: '#111' }}>{label}</span>
    </button>
  )
}

function SvgIcon({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <SvgIcon size={22}>
      <rect x="4" y="3.5" width="8" height="10.5" fill="#fff" />
      <path d="M6 3h4M6.5 6h3M6.5 8.5h3M6.5 11h2" />
    </SvgIcon>
  )
}

function CutIcon() {
  return (
    <SvgIcon>
      <path d="M4 3l8 10M12 3L4 13" />
      <circle cx="3.5" cy="3.5" r="1.2" fill="#fff" />
      <circle cx="3.5" cy="12.5" r="1.2" fill="#fff" />
    </SvgIcon>
  )
}

function CopyIcon() {
  return (
    <SvgIcon>
      <rect x="5" y="3" width="7" height="9" fill="#fff" />
      <path d="M3 5v8h7" />
    </SvgIcon>
  )
}

function BrushIcon() {
  return (
    <SvgIcon>
      <path d="M10 3l3 3-5.5 5.5H5L4.5 9z" fill="#fff" />
      <path d="M5 11.5c0 1.2-1 1.8-2 1.8.5-.5.7-1 .7-1.8" />
    </SvgIcon>
  )
}

function GridIcon() {
  return <span className="inline-block w-3 h-3 border border-[#111]" style={{ background: 'linear-gradient(90deg, transparent 48%, #111 49%, #111 51%, transparent 52%), linear-gradient(0deg, transparent 48%, #111 49%, #111 51%, transparent 52%)' }} />
}

function TableIcon() {
  return <span className="inline-block w-3.5 h-3 border border-[#111]" style={{ background: 'linear-gradient(#d9ead3 0 0) top / 100% 35% no-repeat' }} />
}

function CellIcon() {
  return <span className="inline-block w-3.5 h-3 border-2 border-[#111]" />
}

function PlusIcon() {
  return <span className="text-[13px] font-semibold leading-none">+</span>
}

function MinusIcon() {
  return <span className="text-[13px] font-semibold leading-none">-</span>
}

function FormatIcon() {
  return <span className="text-[10px] font-semibold leading-none">Aa</span>
}

function FillIcon() {
  return <span className="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#111]" />
}

function SearchIcon() {
  return (
    <SvgIcon>
      <circle cx="7" cy="7" r="3.5" />
      <path d="M10 10l3 3" />
    </SvgIcon>
  )
}

import { createContext, useContext, useState } from 'react'

const ExcelModeContext = createContext({ excelMode: false, setExcelMode: () => {} })

export function ExcelModeProvider({ children }) {
  const [excelMode, setExcelMode] = useState(false)
  return (
    <ExcelModeContext.Provider value={{ excelMode, setExcelMode }}>
      {children}
    </ExcelModeContext.Provider>
  )
}

export function useExcelMode() {
  return useContext(ExcelModeContext)
}

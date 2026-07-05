import { useApp } from '../../context/AppContext'
import Sidebar from './Sidebar'
import Header from './Header'
import MetaSidePanel from './MetaSidePanel'
import { Toast } from '../ui'

export default function AppLayout({ children }) {
  const { sidebarOpen, metaPanelOpen } = useApp()
  const sidebarW = sidebarOpen ? 240 : 64
  const metaW = metaPanelOpen ? 340 : 0

  return (
    <div className="flex h-screen overflow-hidden bg-sb-bg">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-200"
        style={{ marginLeft: sidebarW, marginRight: metaW }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto pt-[60px]">
          <div className="p-6 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <MetaSidePanel />
      <Toast toast={useApp().toast} />
    </div>
  )
}

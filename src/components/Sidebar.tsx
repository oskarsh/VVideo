import { AssetsPanel } from './AssetsPanel'
import { PanesPanel } from './PanesPanel'

export function Sidebar() {
  return (
    <div className="p-3 space-y-6">
      <AssetsPanel />
      <PanesPanel />
    </div>
  )
}


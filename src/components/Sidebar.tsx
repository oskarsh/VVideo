import { AssetsPanel } from './AssetsPanel'
import { PanesPanel } from './PanesPanel'
import { TextPanel } from './TextPanel'

export function Sidebar() {
  return (
    <div className="p-2 space-y-4 lg:p-3 lg:space-y-6">
      <AssetsPanel />
      <PanesPanel />
      <TextPanel />
    </div>
  )
}


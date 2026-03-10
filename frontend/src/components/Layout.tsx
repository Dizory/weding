import { Content } from './Content'
import { Navigation } from './Navigation'
import './Layout.css'

export function Layout() {
  return (
    <div className="layout">
      <main className="layout__main">
        <Navigation />
        <Content />
      </main>
    </div>
  )
}

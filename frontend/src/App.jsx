import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MyEventsList from './MyEventsList'
import CreateEvent from './CreateEvent'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyEventsList />} />
        <Route path="/create-event" element={<CreateEvent />} />
      </Routes>
    </Router>
  )
}

export default App

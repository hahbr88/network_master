import { Route, Routes } from 'react-router-dom'
import QuizHomePage from './QuizHomePage'
import { StudyLogPage } from './pages/StudyLogPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizHomePage />} />
      <Route path="/studylog" element={<StudyLogPage />} />
    </Routes>
  )
}

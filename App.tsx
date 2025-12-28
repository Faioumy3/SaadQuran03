import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { RegisterForm } from './components/RegisterForm';
import { LoginForm } from './components/LoginForm';
import { ChangePassword } from './components/ChangePassword';
import { StudentDashboard } from './components/StudentDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { View, Student, Teacher } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [currentUser, setCurrentUser] = useState<Student | Teacher | null>(null);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(View.HOME);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <Home changeView={setCurrentView} />;
      case View.REGISTER_STUDENT:
        return <RegisterForm changeView={setCurrentView} />;
      case View.TEACHER_LOGIN:
        return <LoginForm changeView={setCurrentView} type="TEACHER" setCurrentUser={setCurrentUser} />;
      case View.STUDENT_LOGIN:
        return <LoginForm changeView={setCurrentView} type="STUDENT" setCurrentUser={setCurrentUser} />;
      case View.MANAGER_LOGIN:
        return <LoginForm changeView={setCurrentView} type="MANAGER" setCurrentUser={setCurrentUser} />;
      case View.CHANGE_PASSWORD:
        return <ChangePassword 
            changeView={setCurrentView} 
            onBack={() => {
                if (currentUser) {
                    if ((currentUser as any).password) { // Simple check if teacher
                         setCurrentView(View.TEACHER_DASHBOARD);
                    } else {
                         setCurrentView(View.STUDENT_DASHBOARD);
                    }
                } else {
                    setCurrentView(View.HOME);
                }
            }}
        />;
      case View.STUDENT_DASHBOARD:
        if (!currentUser) return <Home changeView={setCurrentView} />;
        return <StudentDashboard changeView={setCurrentView} currentUser={currentUser as Student} logout={handleLogout} />;
      case View.MANAGER_DASHBOARD:
        return <ManagerDashboard changeView={setCurrentView} logout={handleLogout} />;
      case View.TEACHER_DASHBOARD:
        if (!currentUser) return <Home changeView={setCurrentView} />;
        return <TeacherDashboard changeView={setCurrentView} currentUser={currentUser as Teacher} logout={handleLogout} />;
      default:
        return <Home changeView={setCurrentView} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0fdf4] overflow-x-hidden w-full max-w-[100vw]">
      {/* Hide Global Header on Dashboards because they have their own */}
      {currentView !== View.STUDENT_DASHBOARD && currentView !== View.MANAGER_DASHBOARD && currentView !== View.TEACHER_DASHBOARD && <Header />}
      
      <main className={`flex-grow flex w-full ${[View.STUDENT_DASHBOARD, View.MANAGER_DASHBOARD, View.TEACHER_DASHBOARD].includes(currentView) ? '' : 'items-center justify-center p-4'}`}>
        {renderContent()}
      </main>

      {currentView !== View.STUDENT_DASHBOARD && currentView !== View.MANAGER_DASHBOARD && currentView !== View.TEACHER_DASHBOARD && <Footer />}
    </div>
  );
}
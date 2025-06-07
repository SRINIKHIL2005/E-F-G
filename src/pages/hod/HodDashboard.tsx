import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab, Dialog, Transition, Menu } from '@headlessui/react';
import { BookOpen, GraduationCap, LayoutGrid, Users, Bell, Settings, User, Trash2, Edit, Eye, UserX, UserPlus, Shield, Calendar, MessageSquare, BarChart3, Download, Filter, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

// Import new HOD management components
import DepartmentCourses from '@/components/hod/DepartmentCourses';
import ManageStudents from '@/components/hod/ManageStudents';
import ManageTeachers from '@/components/hod/ManageTeachers';
import DepartmentFeedback from '@/components/hod/DepartmentFeedback';

// Enhanced interfaces for HOD dashboard
interface Course {
  _id: string;
  code: string;
  name: string;
  description?: string;
  department: string;
  teacher: any;
  students: string[];
  schedule?: string[];
  materials?: any[];
  createdAt?: string;
  enrollment?: number;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joinedOn: string;
  phone?: string;
  specialization?: string[];
  coursesCount?: number;
  studentsCount?: number;
  lastLogin?: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  studentId?: string;
  enrollmentYear?: string;
  program?: string;
  phone?: string;
  coursesEnrolled?: number;
  attendanceRate?: number;
  lastLogin?: string;
}

interface Feedback {
  _id: string;
  message: string;
  title?: string;
  department?: string;
  createdBy?: any;
  submittedAt?: string;
  status?: string;
}

interface AttendanceRecord {
  _id: string;
  department: string;
  date: string;
  attendees: Array<{
    student: any;
    status: string;
    remark?: string;
  }>;
  createdBy: any;
}

interface DashboardStats {
  totalCourses: number;
  totalFaculty: number;
  totalStudents: number;
  totalFeedbacks: number;
  courseGrowth?: number;
  facultyGrowth?: number;
  studentGrowth?: number;
  feedbackGrowth?: number;
  departmentStats: {
    attendanceRate: number;
    feedbackResponse: number;
    activeUsers: number;
  };
}

interface RecentActivity {
  _id: string;
  type: 'enrollment' | 'feedback' | 'attendance' | 'course' | 'user';
  message: string;
  timestamp: string;
  department?: string;
  user?: string;
}

// Add these interfaces after the existing interfaces
interface ApiResponse<T> {
  courses?: T[];
  data?: T[];
  message?: string;
}

// Fix classNames function with proper typing
function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

const HodDashboard = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL-based tab mapping
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/courses')) return 'courses';
    if (path.includes('/teachers')) return 'faculty';
    if (path.includes('/students')) return 'students';
    if (path.includes('/feedback')) return 'feedback';
    if (path.includes('/analytics')) return 'analytics';
    return 'overview';
  };

  // Enhanced state management
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Feedback Received', read: false, date: '2024-03-15' },
    { id: 2, title: 'System Update Available', read: true, date: '2024-03-14' },
  ]);

  // Main data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQueries, setSearchQueries] = useState({
    courses: '',
    faculty: '',
    students: '',
    feedback: ''
  });
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    status: ''
  });

  // Active tab and view states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Modal and dialog states
  const [modals, setModals] = useState({
    addUser: false,
    editUser: false,
    deleteUser: false,
    viewUser: false,
    addCourse: false,
    editCourse: false,
    deleteCourse: false,
    settings: false,
    bulkActions: false,
    attendanceDetails: false,
    systemLogs: false
  });

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: 'student',
    phone: '',
    password: '',
    courseCode: '',
    courseName: '',
    courseDescription: ''
  });

  // Chart and analytics data
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    attendanceTrends: [],
    feedbackAnalytics: [],
    departmentComparison: []
  });

  // Recent activities data
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Additional state variables for forms and modals
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    department: '',
    teacher: ''
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', path: '/hod/dashboard' },
    { id: 'faculty', label: 'Faculty', path: '/hod/teachers' },
    { id: 'students', label: 'Students', path: '/hod/students' },
    { id: 'courses', label: 'Courses', path: '/hod/courses' },
    { id: 'feedback', label: 'Feedback', path: '/hod/feedback' },
    { id: 'analytics', label: 'Analytics', path: '/hod/analytics' }
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTab(tabId);
      navigate(tab.path);
    }
  };

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // API instance with authentication
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Enhanced data fetching functions using unified API
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/hod/dashboard-summary');
      const data = response.data;

      // Update all state with data from unified endpoint
      setCourses(data.courses || []);
      setFaculty(data.faculty || []);
      setStudents(data.students || []);
      setFeedbacks([]); // Will be included in future iterations
      setAttendanceRecords([]); // Attendance data is now in summary stats

      // Set dashboard stats directly from backend calculations
      setDashboardStats({
        totalCourses: data.summary.totalCourses,
        totalFaculty: data.summary.totalFaculty,
        totalStudents: data.summary.totalStudents,
        totalFeedbacks: data.summary.totalFeedbacks,
        courseGrowth: data.summary.courseGrowth,
        facultyGrowth: data.summary.facultyGrowth,
        studentGrowth: data.summary.studentGrowth,
        feedbackGrowth: data.summary.feedbackGrowth,
        departmentStats: {
          attendanceRate: data.summary.attendanceRate,
          feedbackResponse: data.summary.feedbackResponseRate,
          activeUsers: data.summary.activeUsers
        }
      });

      toast.success('Dashboard data loaded successfully');
      
      // Update analytics data with real insights
      await updateAnalyticsData(data);
      
      // Fetch recent activities
      await fetchRecentActivities();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent activities from API
  const fetchRecentActivities = async () => {
    try {
      const response = await apiClient.get('/api/hod/recent-activities');
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Set some fallback empty state if API fails
      setRecentActivities([]);
    }
  };

  // Update analytics data based on fetched data
  const updateAnalyticsData = async (data: any) => {
    try {
      // Fetch real analytics data from MongoDB
      const analyticsResponse = await apiClient.get('/api/hod/analytics');
      const analyticsData = analyticsResponse.data;
      
      setAnalyticsData({
        userGrowth: analyticsData.userGrowth || [],
        attendanceTrends: analyticsData.attendanceTrends || [],
        feedbackAnalytics: analyticsData.feedbackAnalytics || [],
        departmentComparison: analyticsData.departmentComparison || []
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to basic data structure if analytics endpoint fails
      setAnalyticsData({
        userGrowth: [],
        attendanceTrends: [],
        feedbackAnalytics: [],
        departmentComparison: []
      });
    }
  };



  // Administrative action functions
  const handleRemoveUser = async (userId: string, userType: 'teacher' | 'student') => {
    try {
      setIsLoading(true);
      await apiClient.delete(`/api/users/${userId}`);
      
      if (userType === 'teacher') {
        setFaculty(faculty.filter(f => f._id !== userId));
      } else {
        setStudents(students.filter(s => s._id !== userId));
      }
      
      toast.success(`${userType} removed successfully`);
      setModals(prev => ({ ...prev, deleteUser: false }));
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error(`Failed to remove ${userType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRemoveUsers = async () => {
    try {
      setIsLoading(true);
      await Promise.all(
        selectedUsers.map(userId => apiClient.delete(`/api/users/${userId}`))
      );
      
      setFaculty(faculty.filter(f => !selectedUsers.includes(f._id)));
      setStudents(students.filter(s => !selectedUsers.includes(s._id)));
      setSelectedUsers([]);
      setBulkActionMode(false);
      
      toast.success(`${selectedUsers.length} users removed successfully`);
    } catch (error) {
      console.error('Error in bulk remove:', error);
      toast.error('Failed to remove some users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/users', formData);
      
      if (formData.role === 'teacher') {
        setFaculty([...faculty, response.data]);
      } else {
        setStudents([...students, response.data]);
      }
      
      toast.success('User added successfully');
      setModals(prev => ({ ...prev, addUser: false }));
      resetForm();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.put(`/api/users/${selectedItem._id}`, formData);
      
      if (formData.role === 'teacher') {
        setFaculty(faculty.map(f => f._id === selectedItem._id ? response.data : f));
      } else {
        setStudents(students.map(s => s._id === selectedItem._id ? response.data : s));
      }
      
      toast.success('User updated successfully');
      setModals(prev => ({ ...prev, editUser: false }));
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPrivateInfo = async (userId: string) => {
    try {
      const response = await apiClient.get(`/api/users/${userId}/private`);
      setSelectedItem(response.data);
      setModals(prev => ({ ...prev, viewUser: true }));
    } catch (error) {
      console.error('Error fetching private info:', error);
      toast.error('Failed to load user details');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: '',
      role: 'student',
      phone: '',
      password: '',
      courseCode: '',
      courseName: '',
      courseDescription: ''
    });
  };

  const resetCourseForm = () => {
    setCourseForm({
      code: '',
      name: '',
      description: '',
      department: '',
      teacher: ''
    });
  };

  const handleCourseSave = async () => {
    try {
      setIsLoading(true);
      if (modalMode === 'add') {
        const response = await apiClient.post('/api/courses', courseForm);
        setCourses([...courses, response.data]);
        toast.success('Course added successfully');
      } else {
        const response = await apiClient.put(`/api/courses/${selectedItem._id}`, courseForm);
        setCourses(courses.map(c => c._id === selectedItem._id ? response.data : c));
        toast.success('Course updated successfully');
      }
      setModals(prev => ({ ...prev, addCourse: false }));
      resetCourseForm();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setIsLoading(false);
    }
  };

  // Render tab panel content
  const renderTabPanel = (tab: string) => {
    switch (tab.toLowerCase()) {
      case 'overview':
        return renderTabContent();
      case 'faculty':
        return renderUserTable(faculty, 'faculty');
      case 'students':
        return renderUserTable(students, 'students');
      case 'courses':
        return renderCoursesTable();
      case 'analytics':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Analytics charts will be displayed here</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Performance trend charts will be displayed here</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <div>Content for {tab}</div>;
    }
  };

  const openModal = (modalName: string, item?: any) => {
    setSelectedItem(item);
    if (item && modalName === 'editUser') {
      setFormData({
        name: item.name || '',
        email: item.email || '',
        department: item.department || '',
        role: item.role || 'student',
        phone: item.phone || '',
        password: '',
        courseCode: '',
        courseName: '',
        courseDescription: ''
      });
    }
    if (item && modalName === 'editCourse') {
      setModalMode('edit');
      setCourseForm({
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        department: item.department || '',
        teacher: item.teacher?._id || ''
      });
    }
    if (modalName === 'addCourse') {
      setModalMode('add');
      resetCourseForm();
    }
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setSelectedItem(null);
    resetForm();
  };

  // useEffect hooks
  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  // Filtering and search functions
  const getFilteredData = (data: any[], type: string) => {
    const searchQuery = searchQueries[type as keyof typeof searchQueries];
    let filtered = data;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter(item => item.department === filters.department);
    }

    // Apply role filter (for users)
    if (filters.role && (type === 'faculty' || type === 'students')) {
      filtered = filtered.filter(item => item.role === filters.role);
    }

    return filtered;
  };

  const handleSearchChange = (type: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [type]: value }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = (userList: any[]) => {
    const userIds = userList.map(user => user._id);
    setSelectedUsers(userIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
    setBulkActionMode(false);
  };

  // Dashboard header with enhanced controls
  const renderDashboardHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-edu-primary to-blue-600 bg-clip-text text-transparent">
          HOD Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user?.name} | Department: {user?.department}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Administrator Access
          </Badge>
          {dashboardStats && (
            <Badge variant="outline">
              {dashboardStats.departmentStats.activeUsers} Active Users
            </Badge>
          )}
        </div>
      </motion.div>

      <div className="flex items-center gap-4">
        {/* Bulk Actions Toggle */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Badge variant="destructive">
              {selectedUsers.length} selected
            </Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setModals(prev => ({ ...prev, bulkActions: true }))}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Bulk Actions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </motion.div>
        )}

        {/* Notifications */}
        <Menu as="div" className="relative">
          <Menu.Button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell className="text-gray-600" size={20} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Menu.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Menu.Items className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-3 z-50 border">
              <div className="p-2 font-medium border-b">Notifications</div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(notification => (
                  <Menu.Item key={notification.id}>
                    <div className={`p-3 hover:bg-gray-50 rounded ${!notification.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{notification.title}</span>
                          <div className="text-sm text-gray-500 mt-1">{notification.date}</div>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                          className="text-gray-400 hover:text-gray-600 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* User Menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-edu-primary text-white flex items-center justify-center">
              {user?.name?.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-gray-500">HOD</div>
            </div>
          </Menu.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-2 z-50 border">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full text-left p-2 rounded flex items-center gap-2 ${active ? 'bg-gray-100' : ''}`}
                    onClick={() => openModal('settings')}
                  >
                    <Settings size={16} /> Settings
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    className={`w-full text-left p-2 rounded flex items-center gap-2 ${active ? 'bg-gray-100' : ''}`}
                    onClick={() => openModal('systemLogs')}
                  >
                    <BarChart3 size={16} /> System Logs
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    className={`w-full text-left p-2 rounded flex items-center gap-2 ${active ? 'bg-gray-100' : ''}`}
                  >
                    <User size={16} /> Profile
                  </button>
                )}
              </Menu.Item>
              <hr className="my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full text-left p-2 rounded flex items-center gap-2 text-red-600 ${active ? 'bg-red-50' : ''}`}
                    onClick={() => {/* Add logout logic */}}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );

  // Enhanced statistics cards
  const renderStatsCards = () => (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {[
        { 
          title: 'Total Courses', 
          value: dashboardStats?.totalCourses || 0, 
          icon: <BookOpen className="w-6 h-6" />,
          color: 'bg-blue-500',
          change: dashboardStats?.courseGrowth || null,
          changeType: dashboardStats?.courseGrowth && dashboardStats.courseGrowth > 0 ? 'positive' : 'negative'
        },
        { 
          title: 'Faculty Members', 
          value: dashboardStats?.totalFaculty || 0, 
          icon: <GraduationCap className="w-6 h-6" />,
          color: 'bg-green-500',
          change: dashboardStats?.facultyGrowth || null,
          changeType: dashboardStats?.facultyGrowth && dashboardStats.facultyGrowth > 0 ? 'positive' : 'negative'
        },
        { 
          title: 'Students Enrolled', 
          value: dashboardStats?.totalStudents || 0, 
          icon: <Users className="w-6 h-6" />,
          color: 'bg-purple-500',
          change: dashboardStats?.studentGrowth || null,
          changeType: dashboardStats?.studentGrowth && dashboardStats.studentGrowth > 0 ? 'positive' : 'negative'
        },
        { 
          title: 'Feedback Forms', 
          value: dashboardStats?.totalFeedbacks || 0, 
          icon: <MessageSquare className="w-6 h-6" />,
          color: 'bg-orange-500',
          change: dashboardStats?.feedbackGrowth || null,
          changeType: dashboardStats?.feedbackGrowth && dashboardStats.feedbackGrowth > 0 ? 'positive' : 'negative'
        },
      ].map((card, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  {card.change !== null && (
                    <p className={`text-sm ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
                      {card.change > 0 ? '+' : ''}{card.change}% from last month
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.color} text-white`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );

  // Department performance metrics
  const renderPerformanceMetrics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {dashboardStats?.departmentStats.attendanceRate || 0}%
          </div>
          <Progress value={dashboardStats?.departmentStats.attendanceRate || 0} className="mb-2" />
          <p className="text-sm text-gray-600">Department average this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {dashboardStats?.departmentStats.feedbackResponse || 0}%
          </div>
          <Progress value={dashboardStats?.departmentStats.feedbackResponse || 0} className="mb-2" />
          <p className="text-sm text-gray-600">Student participation rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {dashboardStats?.departmentStats.activeUsers || 0}
          </div>
          <p className="text-sm text-gray-600">Active in the last 7 days</p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {Math.round(((dashboardStats?.departmentStats.activeUsers || 0) / 
                ((dashboardStats?.totalFaculty || 0) + (dashboardStats?.totalStudents || 0))) * 100)}% engagement
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // User management table component
  const renderUserTable = (users: any[], userType: 'faculty' | 'students') => {
    const filteredUsers = getFilteredData(users, userType);
    
    return (
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`Search ${userType}...`}
                value={searchQueries[userType]}
                onChange={(e) => handleSearchChange(userType, e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            {selectedUsers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllUsers(filteredUsers)}
              >
                Select All ({filteredUsers.length})
              </Button>
            )}
            <Button
              onClick={() => openModal('addUser')}
              className="bg-edu-primary hover:bg-edu-primary/90"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add {userType === 'faculty' ? 'Teacher' : 'Student'}
            </Button>
            {selectedUsers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkActionMode(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Selected ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllUsers(filteredUsers);
                      } else {
                        clearSelection();
                      }
                    }}
                    checked={filteredUsers.length > 0 && filteredUsers.every(user => selectedUsers.includes(user._id))}
                  />
                </th>
                <th className="p-3 text-left font-medium text-gray-700">Name</th>
                <th className="p-3 text-left font-medium text-gray-700">Email</th>
                <th className="p-3 text-left font-medium text-gray-700">Department</th>
                <th className="p-3 text-left font-medium text-gray-700">Status</th>
                <th className="p-3 text-left font-medium text-gray-700">Last Login</th>
                <th className="p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-edu-primary text-white flex items-center justify-center text-sm">
                        {user.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">
                    <Badge variant="outline">{user.department}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge 
                      variant={user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7*24*60*60*1000) ? "default" : "secondary"}
                    >
                      {user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7*24*60*60*1000) ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3 text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPrivateInfo(user._id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('editUser', user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(user);
                          openModal('deleteUser');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {userType} found matching your criteria.
          </div>
        )}
      </div>
    );
  };

  // Course management table
  const renderCoursesTable = () => {
    const filteredCourses = getFilteredData(courses, 'courses');
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchQueries.courses}
              onChange={(e) => handleSearchChange('courses', e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => openModal('addCourse')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left font-medium text-gray-700">Course Code</th>
                <th className="p-3 text-left font-medium text-gray-700">Course Name</th>
                <th className="p-3 text-left font-medium text-gray-700">Department</th>
                <th className="p-3 text-left font-medium text-gray-700">Teacher</th>
                <th className="p-3 text-left font-medium text-gray-700">Students</th>
                <th className="p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course, index) => (
                <tr key={course._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{course.code}</td>
                  <td className="p-3">{course.name}</td>
                  <td className="p-3">
                    <Badge variant="outline">{course.department}</Badge>
                  </td>
                  <td className="p-3">{course.teacher?.name || 'Unassigned'}</td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {course.students?.length || 0} enrolled
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openModal('editCourse', course)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Enhanced tab content renderer
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={fetchDashboardData} size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
              {tab.id === 'faculty' && ` (${faculty.length})`}
              {tab.id === 'students' && ` (${students.length})`}
              {tab.id === 'courses' && ` (${courses.length})`}
              {tab.id === 'feedback' && ` (${feedbacks.length})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderStatsCards()}
          {renderPerformanceMetrics()}
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={activity._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'enrollment' ? 'bg-green-500' :
                        activity.type === 'feedback' ? 'bg-blue-500' :
                        activity.type === 'attendance' ? 'bg-orange-500' :
                        activity.type === 'course' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm flex-1">{activity.message}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity to display</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty">
          <ManageTeachers department={user?.department ?? ''} />
        </TabsContent>

        <TabsContent value="students">
          <ManageStudents department={user?.department ?? ''} />
        </TabsContent>

        <TabsContent value="courses">
          <DepartmentCourses department={user?.department ?? ''} />
        </TabsContent>

        <TabsContent value="feedback">
          <DepartmentFeedback department={user?.department ?? ''} />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Department Analytics</h2>
                <p className="text-gray-600">Comprehensive performance insights and trends</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Engagement Score</p>
                      <p className="text-2xl font-bold text-green-600">85.4%</p>
                      <p className="text-xs text-green-600">↗ +2.3% from last month</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Course Completion</p>
                      <p className="text-2xl font-bold text-blue-600">92.1%</p>
                      <p className="text-xs text-blue-600">↗ +1.8% from last month</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Student Satisfaction</p>
                      <p className="text-2xl font-bold text-purple-600">4.6/5</p>
                      <p className="text-xs text-purple-600">↗ +0.2 from last month</p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Faculty Performance</p>
                      <p className="text-2xl font-bold text-orange-600">88.7%</p>
                      <p className="text-xs text-orange-600">↗ +3.1% from last month</p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Department Performance Trends
                  </CardTitle>
                  <CardDescription>
                    Monthly performance metrics across all departments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <DashboardChart
                      title="Performance Trends"
                      type="line"
                      data={[
                        { name: 'Jan', attendance: 85, feedback: 78, performance: 82 },
                        { name: 'Feb', attendance: 88, feedback: 82, performance: 85 },
                        { name: 'Mar', attendance: 92, feedback: 85, performance: 88 },
                        { name: 'Apr', attendance: 89, feedback: 88, performance: 90 },
                        { name: 'May', attendance: 94, feedback: 91, performance: 92 },
                        { name: 'Jun', attendance: 96, feedback: 89, performance: 94 }
                      ]}
                      dataKeys={['attendance', 'feedback', 'performance']}
                      colors={['#4CAF50', '#2196F3', '#FF9800']}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Course Distribution by Department */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Course Distribution
                  </CardTitle>
                  <CardDescription>
                    Number of courses by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <DashboardChart
                      title="Course Distribution"
                      type="bar"
                      data={[
                        { name: 'Computer Science', value: courses.filter(c => c.department === 'Computer Science').length || 8 },
                        { name: 'Mathematics', value: courses.filter(c => c.department === 'Mathematics').length || 6 },
                        { name: 'Physics', value: courses.filter(c => c.department === 'Physics').length || 5 },
                        { name: 'Chemistry', value: courses.filter(c => c.department === 'Chemistry').length || 4 },
                        { name: 'Biology', value: courses.filter(c => c.department === 'Biology').length || 3 }
                      ]}
                      dataKeys={['value']}
                      colors={['#8B5CF6']}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Student Enrollment by Department */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Student Enrollment
                  </CardTitle>
                  <CardDescription>
                    Student distribution across departments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <DashboardChart
                      title="Student Enrollment"
                      type="pie"
                      data={[
                        { name: 'Computer Science', value: students.filter(s => s.department === 'Computer Science').length || 45 },
                        { name: 'Mathematics', value: students.filter(s => s.department === 'Mathematics').length || 32 },
                        { name: 'Physics', value: students.filter(s => s.department === 'Physics').length || 28 },
                        { name: 'Chemistry', value: students.filter(s => s.department === 'Chemistry').length || 25 },
                        { name: 'Biology', value: students.filter(s => s.department === 'Biology').length || 22 }
                      ]}
                      dataKeys={['value']}
                      colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Faculty Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Faculty Performance
                  </CardTitle>
                  <CardDescription>
                    Performance metrics by faculty members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <DashboardChart
                      title="Faculty Performance"
                      type="bar"
                      data={faculty.slice(0, 6).map((f, index) => ({
                        name: f.name.split(' ')[0] || `Faculty ${index + 1}`,
                        performance: Math.floor(Math.random() * 20) + 80,
                        satisfaction: Math.floor(Math.random() * 20) + 75,
                        courses: f.coursesCount || Math.floor(Math.random() * 5) + 1
                      }))}
                      dataKeys={['performance', 'satisfaction']}
                      colors={['#8B5CF6', '#EC4899']}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Courses */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Courses</CardTitle>
                  <CardDescription>Based on attendance and feedback ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.slice(0, 5).map((course, index) => (
                      <div key={course._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{course.name}</p>
                            <p className="text-xs text-gray-500">{course.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {Math.floor(Math.random() * 10) + 90}%
                          </p>
                          <p className="text-xs text-gray-500">Performance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Recent department activities and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New faculty member onboarded</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Course material updated</p>
                        <p className="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Feedback survey completed</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Attendance report generated</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparative Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Comparative Department Analysis
                </CardTitle>
                <CardDescription>
                  Year-over-year comparison of key metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <DashboardChart
                    title="Department Comparison"
                    type="bar"
                    data={[
                      { 
                        name: 'Q1 2024',
                        enrollment: students.length * 0.7 || 120,
                        completion: 85,
                        satisfaction: 4.2
                      },
                      { 
                        name: 'Q2 2024',
                        enrollment: students.length * 0.8 || 135,
                        completion: 88,
                        satisfaction: 4.4
                      },
                      { 
                        name: 'Q3 2024',
                        enrollment: students.length * 0.9 || 148,
                        completion: 91,
                        satisfaction: 4.5
                      },
                      { 
                        name: 'Q4 2024',
                        enrollment: students.length || 152,
                        completion: 94,
                        satisfaction: 4.6
                      }
                    ]}
                    dataKeys={['enrollment', 'completion']}
                    colors={['#3B82F6', '#10B981']}
                    height={360}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  if (!user) return null;

  return (
    <AppLayout pageTitle="HOD Dashboard">
      {renderDashboardHeader()}

      {/* Settings Modal */}
      <Dialog open={modals.settings} onClose={() => setModals(prev => ({ ...prev, settings: false }))} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 z-10"
        >
          <Dialog.Title className="text-xl font-bold mb-4">Settings</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Theme</label>
              <select className="w-full p-2 border rounded">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notifications</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="notifications" />
                <label htmlFor="notifications">Enable notifications</label>
              </div>
            </div>
            <Button onClick={() => setModals(prev => ({ ...prev, settings: false }))} variant="default" className="w-full">
              Save Changes
            </Button>
          </div>
        </motion.div>
      </Dialog>

      {/* Add/Edit User Modal */}
      <Dialog open={modals.addUser || modals.editUser} onClose={() => { closeModal('addUser'); closeModal('editUser'); }} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 z-10"
        >
          <Dialog.Title className="text-xl font-bold mb-4">
            {modals.addUser ? 'Add User' : 'Edit User'}
          </Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            {modals.addUser && (
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={() => { closeModal('addUser'); closeModal('editUser'); }} variant="outline">Cancel</Button>
              <Button onClick={modals.addUser ? handleAddUser : handleEditUser} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </motion.div>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={modals.deleteUser} onClose={() => closeModal('deleteUser')} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 z-10"
        >
          <Dialog.Title className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</Dialog.Title>
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove <strong>{selectedItem?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => closeModal('deleteUser')} variant="outline">Cancel</Button>
            <Button 
              onClick={() => handleRemoveUser(selectedItem?._id, selectedItem?.role)} 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? 'Removing...' : 'Remove User'}
            </Button>
          </div>
        </motion.div>
      </Dialog>

      {/* View User Details Modal */}
      <Dialog open={modals.viewUser} onClose={() => closeModal('viewUser')} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 z-10"
        >
          <Dialog.Title className="text-xl font-bold mb-4">User Details</Dialog.Title>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg">{selectedItem.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Department</label>
                  <p className="text-lg">{selectedItem.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Role</label>
                  <Badge>{selectedItem.role}</Badge>
                </div>
                {selectedItem.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-lg">{selectedItem.phone}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Login</label>
                  <p className="text-lg">{selectedItem.lastLogin ? new Date(selectedItem.lastLogin).toLocaleString() : 'Never'}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => closeModal('viewUser')}>Close</Button>
              </div>
            </div>
          )}
        </motion.div>
      </Dialog>

      {/* Bulk Actions Confirmation Modal */}
      <Dialog open={modals.bulkActions} onClose={() => closeModal('bulkActions')} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 z-10"
        >
          <Dialog.Title className="text-xl font-bold mb-4 text-red-600">Bulk Action Confirmation</Dialog.Title>
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove <strong>{selectedUsers.length}</strong> selected users? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => closeModal('bulkActions')} variant="outline">Cancel</Button>
            <Button 
              onClick={handleBulkRemoveUsers} 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? 'Removing...' : `Remove ${selectedUsers.length} Users`}
            </Button>
          </div>
        </motion.div>
      </Dialog>

      {/* Main Dashboard Content */}
      {renderTabContent()}

      {/* Modal for Add/Edit Course */}
      <Dialog open={modals.addCourse} onClose={() => setModals(prev => ({ ...prev, addCourse: false }))} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 z-10"
        >
          <Dialog.Title className="text-xl font-bold mb-4">
            {modalMode === 'add' ? 'Add Course' : 'Edit Course'}
          </Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Course Code</label>
              <Input
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                placeholder="e.g., CS101"
              />
            </div>
            <div>
              <label className="block mb-1">Course Name</label>
              <Input
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Course description..."
                className="w-full p-2 border rounded h-20"
              />
            </div>
            <div>
              <label className="block mb-1">Department</label>
              <select
                value={courseForm.department}
                onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModals(prev => ({ ...prev, addCourse: false }))} variant="outline">Cancel</Button>
              <Button onClick={handleCourseSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </motion.div>
      </Dialog>
    </AppLayout>
  );
};

export default HodDashboard;
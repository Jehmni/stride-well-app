// Extended Lucide React Fitness Icons
// Available icons that could enhance your exercise iconography

import {
  // Current icons you're using
  Dumbbell,
  Activity,
  Target,
  Zap,
  Heart,
  Flame,
  
  // Additional fitness-related Lucide icons
  Timer,           // For rest times, workout duration
  TrendingUp,      // For progress, improvement
  BarChart3,       // For stats, analytics
  Gauge,           // For intensity levels
  Clock,           // For time-based exercises
  Calendar,        // For scheduling
  Trophy,          // For achievements
  Award,           // For goals reached
  Star,            // For favorites/ratings
  Plus,            // For adding exercises
  Minus,           // For removing exercises
  Play,            // For starting workouts
  Pause,           // For rest periods
  RotateCcw,       // For repetitions
  RefreshCw,       // For sets
  ArrowUp,         // For increase weight
  ArrowDown,       // For decrease weight
  Scale,           // For weight tracking
  Footprints,      // For walking/running
  Bike,            // For cycling
  Waves,           // For swimming motions
  Mountain,        // For climbing exercises
  Shield,          // For safety/protection
  CheckCircle,     // For completed exercises
  Circle,          // For incomplete exercises
  AlertCircle,     // For warnings/cautions
  Info,            // For exercise information
  Settings,        // For workout customization
  Filter,          // For exercise filtering
  Search,          // For exercise search
  Eye,             // For viewing details
  EyeOff,          // For hiding details
  Lock,            // For premium features
  Unlock,          // For unlocked features
  User,            // For personal records
  Users,           // For group workouts
  MapPin,          // For location-based exercises
  Home,            // For home workouts
  Building,        // For gym workouts
  Wifi,            // For connected equipment
  WifiOff,         // For offline mode
  Battery,         // For energy levels
  BatteryLow,      // For low energy
  Thermometer,     // For intensity
  Volume2,         // For workout music
  VolumeX,         // For quiet mode
  Camera,          // For form checking
  Video,           // For exercise videos
  BookOpen,        // For workout plans
  FileText,        // For workout notes
  Download,        // For downloading workouts
  Upload,          // For uploading progress
  Share,           // For sharing workouts
  Copy,            // For copying routines
  Edit,            // For editing workouts
  Save,            // For saving progress
  Trash,           // For deleting exercises
  MoreHorizontal,  // For more options
  MoreVertical,    // For vertical menus
} from 'lucide-react';

// Exercise category mapping with Lucide icons
export const lucideExerciseIcons = {
  // Strength Training
  chest: Dumbbell,
  back: Activity,
  shoulders: Target,
  arms: Zap,
  legs: TrendingUp,
  core: Target,
  
  // Cardio
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  hiking: Mountain,
  
  // Workout States
  active: Play,
  rest: Pause,
  completed: CheckCircle,
  pending: Circle,
  
  // Progress & Stats
  progress: TrendingUp,
  stats: BarChart3,
  intensity: Gauge,
  time: Timer,
  
  // Actions
  start: Play,
  stop: Pause,
  reset: RotateCcw,
  refresh: RefreshCw,
  increase: ArrowUp,
  decrease: ArrowDown,
  
  // UI Elements
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  settings: Settings,
  search: Search,
  filter: Filter,
};

// Enhanced exercise icon mapping using Lucide icons
export const getLucideExerciseIcon = (exerciseName: string) => {
  const name = exerciseName.toLowerCase();
  
  // Strength exercises
  if (name.includes('push') || name.includes('press') || name.includes('chest')) {
    return Dumbbell;
  }
  if (name.includes('pull') || name.includes('row') || name.includes('back')) {
    return Activity;
  }
  if (name.includes('squat') || name.includes('leg')) {
    return TrendingUp;
  }
  if (name.includes('core') || name.includes('plank') || name.includes('ab')) {
    return Target;
  }
  
  // Cardio exercises
  if (name.includes('run') || name.includes('jog')) {
    return Footprints;
  }
  if (name.includes('bike') || name.includes('cycle')) {
    return Bike;
  }
  if (name.includes('swim')) {
    return Waves;
  }
  if (name.includes('climb') || name.includes('mountain')) {
    return Mountain;
  }
  
  // Default
  return Dumbbell;
};

// Get icon component for workout intensity
export const getIntensityIcon = (intensity: string | number) => {
  if (typeof intensity === 'string') {
    switch (intensity.toLowerCase()) {
      case 'low': return Battery;
      case 'medium': return Gauge;
      case 'high': return Flame;
      case 'extreme': return Zap;
      default: return Activity;
    }
  }
  
  if (typeof intensity === 'number') {
    if (intensity <= 3) return Battery;
    if (intensity <= 6) return Gauge;
    if (intensity <= 8) return Flame;
    return Zap;
  }
  
  return Activity;
};

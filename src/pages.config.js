/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcceptClinicInvite from './pages/AcceptClinicInvite';
import AcceptClinicianInvite from './pages/AcceptClinicianInvite';
import AcceptInvite from './pages/AcceptInvite';
import Checkout from './pages/Checkout';
import ClinicOnboarding from './pages/ClinicOnboarding';
import ClinicSettings from './pages/ClinicSettings';
import ClinicalProfile from './pages/ClinicalProfile';
import ClinicianAnalytics from './pages/ClinicianAnalytics';
import CoachDashboard from './pages/CoachDashboard';
import CreateOutcomeMeasure from './pages/CreateOutcomeMeasure';
import CreatePatient from './pages/CreatePatient';
import CreatePlan from './pages/CreatePlan';
import CreateTemplate from './pages/CreateTemplate';
import EditPlan from './pages/EditPlan';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Home from './pages/Home';
import ManageCoaches from './pages/ManageCoaches';
import PatientDetail from './pages/PatientDetail';
import PatientInsights from './pages/PatientInsights';
import PatientInviteAccept from './pages/PatientInviteAccept';
import PatientPortal from './pages/PatientPortal';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProgressionBlocks from './pages/ProgressionBlocks';
import Reports from './pages/Reports';
import Templates from './pages/Templates';
import UserTypeSelection from './pages/UserTypeSelection';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcceptClinicInvite": AcceptClinicInvite,
    "AcceptClinicianInvite": AcceptClinicianInvite,
    "AcceptInvite": AcceptInvite,
    "Checkout": Checkout,
    "ClinicOnboarding": ClinicOnboarding,
    "ClinicSettings": ClinicSettings,
    "ClinicalProfile": ClinicalProfile,
    "ClinicianAnalytics": ClinicianAnalytics,
    "CoachDashboard": CoachDashboard,
    "CreateOutcomeMeasure": CreateOutcomeMeasure,
    "CreatePatient": CreatePatient,
    "CreatePlan": CreatePlan,
    "CreateTemplate": CreateTemplate,
    "EditPlan": EditPlan,
    "ExerciseLibrary": ExerciseLibrary,
    "Home": Home,
    "ManageCoaches": ManageCoaches,
    "PatientDetail": PatientDetail,
    "PatientInsights": PatientInsights,
    "PatientInviteAccept": PatientInviteAccept,
    "PatientPortal": PatientPortal,
    "Pricing": Pricing,
    "PrivacyPolicy": PrivacyPolicy,
    "ProgressionBlocks": ProgressionBlocks,
    "Reports": Reports,
    "Templates": Templates,
    "UserTypeSelection": UserTypeSelection,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
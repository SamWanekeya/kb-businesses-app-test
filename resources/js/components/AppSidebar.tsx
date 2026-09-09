import hafinenIcon from '@images/logos/hafinen_icon.png';
import hafinenLogoLight from '@images/logos/hafinen_logo.png';
import hafinenLogoDark from '@images/logos/hafinen_logo_dark.png';

import { type NavItem } from '@/types';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@components/UserInterface/Sidebar';
import { useBrand } from '@contexts/BrandContext';
import { useLayout } from '@contexts/LayoutContext';
import { useSidebar } from '@contexts/SidebarContext';
import { Link, usePage } from '@inertiajs/react';
import {
    Backpack,
    Building2,
    CalendarDays,
    ClipboardClock,
    CreditCard,
    CurrencyIcon,
    ExternalLink,
    Folder,
    Gift,
    GraduationCap,
    HandCoins,
    IdCardLanyard,
    Image,
    LayoutGrid,
    Package,
    Presentation,
    Settings,
    Signature,
    Users,
} from 'lucide-react';

import NavMain from '@components/NavMain';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Application-level sidebar.
 *
 * Navigation is derived entirely from the authenticated user's role and
 * permission set coming from Inertia page props. The structure here is the
 * canonical source of truth for sidebar visibility — if an item is not
 * included here, it is not reachable via primary navigation.
 *
 * Role handling:
 * - `super_admin` receives a fixed, unrestricted navigation tree.
 * - All other roles are permission-driven and composed incrementally.
 *
 * Important invariants:
 * - Sections are only rendered if they contain at least one visible child.
 * - Every permission gate maps directly to a backend permission string.
 *   Changing permission names server-side requires updating them here.
 * - The first visible nav item determines the logo link target.
 *   If no items are available, we fall back to `dashboard`.
 *
 * Branding behavior:
 * - Logo and favicon come from BrandContext with static fallbacks.
 * - Theme (light/dark) is resolved from the `<html>` class.
 * - A MutationObserver keeps branding in sync with runtime theme changes.
 * - On image load failure, we proactively clear the corresponding brand
 *   setting to prevent repeated broken requests across renders.
 *
 * Architectural notes:
 * - This component intentionally centralizes navigation composition instead
 *   of distributing it across feature modules to keep permission reasoning
 *   and ordering deterministic.
 * - `NavMain` receives already-filtered items. It should not perform
 *   permission logic.
 */
export default function AppSidebar() {
    const { t: translate } = useTranslation();
    const { auth, organizationSlug } = usePage().props;

    const userRole = auth?.user?.type || auth?.user?.role;

    // Permissions
    const canManageDashboard = useHasPermission('manage-dashboard');
    const canManageStaffs = useHasPermission('manage-staffs');
    const canManageAwards = useHasPermission('manage-awards');
    const canManagePromotions = useHasPermission('manage-promotions');
    const canManageStaffGoals = useHasPermission('manage-staff-goals');
    const canManageStaffReviews = useHasPermission('manage-staff-reviews');
    const canManageResignations = useHasPermission('manage-resignations');
    const canManageTerminations = useHasPermission('manage-terminations');
    const canManageWarnings = useHasPermission('manage-warnings');
    const canManageStaffTransfers = useHasPermission('manage-staff-transfers');
    const canManageTrips = useHasPermission('manage-trips');
    const canManageComplaints = useHasPermission('manage-complaints');
    const canManageOrganizationalChart = useHasPermission('manage-organizational-chart');
    const canManageBranches = useHasPermission('manage-branches');
    const canManageDepartments = useHasPermission('manage-departments');
    const canManageDesignations = useHasPermission('manage-designations');
    const canManageDocumentTypes = useHasPermission('manage-document-types');
    const canManageAwardTypes = useHasPermission('manage-award-types');
    const canManageContractTypes = useHasPermission('manage-contract-types');
    const canManageAnnouncements = useHasPermission('manage-announcements');
    const canManageOnboardingChecklists = useHasPermission('manage-onboarding-checklists');
    const canManageChecklistTasks = useHasPermission('manage-checklist-tasks');
    const canManagePerformanceIndicatorCategories = useHasPermission('manage-performance-indicator-categories');
    const canManagePerformanceIndicators = useHasPermission('manage-performance-indicators');
    const canManageGoalTypes = useHasPermission('manage-goal-types');
    const canManageReviewCycles = useHasPermission('manage-review-cycles');
    const canManageLeaveTypes = useHasPermission('manage-leave-types');
    const canManageLeavePolicies = useHasPermission('manage-leave-policies');
    const canManageLeaveApplications = useHasPermission('manage-leave-applications');
    const canManageLeaveBalances = useHasPermission('manage-leave-balances');
    const canManageAttendanceRecords = useHasPermission('manage-attendance-records');
    const canManageAttendanceRegularizations = useHasPermission('manage-attendance-regularizations');
    const canManageBiometricAttendance = useHasPermission('manage-biometric-attendance');
    const canManageShifts = useHasPermission('manage-shifts');
    const canManageAttendancePolicies = useHasPermission('manage-attendance-policies');
    const canViewCalendar = useHasPermission('view-calendar');
    const canManageCalendar = useHasPermission('manage-calendar');
    const canManageHolidays = useHasPermission('manage-holidays');
    const canManageTrainingPrograms = useHasPermission('manage-training-programs');
    const canManageTrainingSessions = useHasPermission('manage-training-sessions');
    const canManageTrainingAssessments = useHasPermission('manage-training-assessments');
    const canManageStaffTrainings = useHasPermission('manage-staff-trainings');
    const canManageTrainingTypes = useHasPermission('manage-training-types');
    const canManageAssets = useHasPermission('manage-assets');
    const canManageAssetTypes = useHasPermission('manage-asset-types');
    const canManageJobCategories = useHasPermission('manage-job-categories');
    const canManageJobTypes = useHasPermission('manage-job-types');
    const canManageJobLocations = useHasPermission('manage-job-locations');
    const canManageJobRequisitions = useHasPermission('manage-job-requisitions');
    const canManageCustomQuestions = useHasPermission('manage-custom-questions');
    const canManageJobPostings = useHasPermission('manage-job-postings');
    const canManageCandidates = useHasPermission('manage-candidates');
    const canManageInterviewRounds = useHasPermission('manage-interview-rounds');
    const canManageInterviews = useHasPermission('manage-interviews');
    const canManageInterviewFeedback = useHasPermission('manage-interview-feedback');
    const canManageCandidateAssessments = useHasPermission('manage-candidate-assessments');
    const canManageOffers = useHasPermission('manage-offers');
    const canManageCandidateOnboarding = useHasPermission('manage-candidate-onboarding');
    const canManageOfferTemplates = useHasPermission('manage-offer-templates');
    const canManageCandidateSources = useHasPermission('manage-candidate-sources');
    const canManageInterviewTypes = useHasPermission('manage-interview-types');
    const canManageCareerPage = useHasPermission('manage-career-page');
    const canManageStaffContracts = useHasPermission('manage-staff-contracts');
    const canManageContractRenewals = useHasPermission('manage-contract-renewals');
    const canManageContractTemplates = useHasPermission('manage-contract-templates');
    const canManageDocumentCategories = useHasPermission('manage-document-categories');
    const canManageDocumentAcknowledgments = useHasPermission('manage-document-acknowledgments');
    const canManageDocumentTemplates = useHasPermission('manage-document-templates');
    const canManageHumanResourcePolicies = useHasPermission('manage-human-resource-policies');
    const canManageMeetingTypes = useHasPermission('manage-meeting-types');
    const canManageMeetingRooms = useHasPermission('manage-meeting-rooms');
    const canManageMeetings = useHasPermission('manage-meetings');
    const canManageMeetingMinutes = useHasPermission('manage-meeting-minutes');
    const canManageMeetingAttendees = useHasPermission('manage-meeting-attendees');
    const canManageMeetingActionItems = useHasPermission('manage-meeting-action-items');
    const canManageTimeEntries = useHasPermission('manage-time-entries');
    const canManagePayrollRuns = useHasPermission('manage-payroll-runs');
    const canManagePayslips = useHasPermission('manage-payslips');
    const canManageSalaryComponents = useHasPermission('manage-salary-components');
    const canManageStaffSalaries = useHasPermission('manage-staff-salaries');
    const canManageUsers = useHasPermission('manage-users');
    const canManageRoles = useHasPermission('manage-roles');
    const canManageMedia = useHasPermission('manage-media');
    const canManagePlans = useHasPermission('manage-plans');
    const canViewPlanRequests = useHasPermission('view-plan-requests');
    const canViewPlanOrders = useHasPermission('view-plan-orders');
    const canManageReferral = useHasPermission('manage-referral');
    const canManageSettings = useHasPermission('manage-settings');

    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: translate('Dashboard'),
            href: route('dashboard.index'),
            icon: LayoutGrid,
        },
        {
            title: translate('Organizations'),
            href: route('organizations.index'),
            icon: Building2,
        },
        {
            title: translate('Subscriptions'),
            icon: CreditCard,
            children: [
                {
                    title: translate('Plans'),
                    href: route('subscriptions.plans.index'),
                },
                {
                    title: translate('Requests'),
                    href: route('plan-requests.index'),
                },
                {
                    title: translate('Orders'),
                    href: route('plan-orders.index'),
                },
            ],
        },
        {
            title: translate('Referral program'),
            href: route('referral-program.index'),
            icon: Gift,
        },
        {
            title: translate('Coupons'),
            href: route('coupons.index'),
            icon: HandCoins,
        },
        {
            title: translate('Currencies'),
            href: route('currencies.index'),
            icon: CurrencyIcon,
        },
        // {
        //     title: translate('Email templates'),
        //     href: route('email-templates.index'),
        //     icon: Mail,
        // },
        {
            title: translate('Media'),
            href: route('media-library.index'),
            icon: Image,
        },
        {
            title: translate('Settings'),
            href: route('settings.index'),
            icon: Settings,
        },
    ];

    const getOrganizationNavItems = (): NavItem[] => {
        const items: NavItem[] = [];

        // 1. Dashboard
        if (canManageDashboard) {
            items.push({
                title: translate('Dashboard'),
                href: route('dashboard.index'),
                icon: LayoutGrid,
            });
        }

        // 2. Staff Management
        const staffManagementChildren: NavItem[] = [];

        // 2.1 Staff
        const staffChildren: NavItem[] = [];
        if (canManageStaffs) {
            staffChildren.push({ title: translate('All staff'), href: route('staff-management.staff.all-staff.index') });
        }
        if (canManageAwards) {
            staffChildren.push({ title: translate('Awards'), href: route('staff-management.staff.awards.index') });
        }
        if (canManagePromotions) {
            staffChildren.push({ title: translate('Promotions'), href: route('staff-management.staff.promotions.index') });
        }
        if (canManageStaffGoals) {
            staffChildren.push({
                title: translate('Goals'),
                href: route('staff-management.staff.goals.index'),
            });
        }
        if (canManageStaffReviews) {
            staffChildren.push({
                title: translate('Reviews'),
                href: route('staff-management.staff.reviews.index'),
            });
        }
        if (canManageResignations) {
            staffChildren.push({ title: translate('Resignations'), href: route('staff-management.staff.resignations.index') });
        }
        if (canManageTerminations) {
            staffChildren.push({ title: translate('Terminations'), href: route('staff-management.staff.terminations.index') });
        }
        if (canManageWarnings) {
            staffChildren.push({ title: translate('Warnings'), href: route('staff-management.staff.warnings.index') });
        }
        if (canManageStaffTransfers) {
            staffChildren.push({ title: translate('Transfers'), href: route('staff-management.staff.transfers.index') });
        }
        if (canManageTrips) {
            staffChildren.push({ title: translate('Trips'), href: route('staff-management.staff.trips.index') });
        }
        if (canManageComplaints) {
            staffChildren.push({ title: translate('Complaints'), href: route('staff-management.staff.complaints.index') });
        }
        if (staffChildren.length > 0) {
            staffManagementChildren.push({
                title: translate('Staff'),
                children: staffChildren,
            });
        }

        // 2.2 Staff Operations
        const staffOpsChildren: NavItem[] = [];
        if (canManageOrganizationalChart) {
            staffOpsChildren.push({
                title: translate('Organizational chart'),
                href: route('staff-management.staff-operations.organizational-chart.index'),
            });
        }
        if (canManageBranches) {
            staffOpsChildren.push({ title: translate('Branches'), href: route('staff-management.staff-operations.branches.index') });
        }
        if (canManageDepartments) {
            staffOpsChildren.push({ title: translate('Departments'), href: route('staff-management.staff-operations.departments.index') });
        }
        if (canManageDesignations) {
            staffOpsChildren.push({
                title: translate('Designations'),
                href: route('staff-management.staff-operations.designations.index'),
            });
        }
        if (canManageDocumentTypes) {
            staffOpsChildren.push({
                title: translate('Document types'),
                href: route('staff-management.staff-operations.document-types.index'),
            });
        }
        if (canManageAwardTypes) {
            staffOpsChildren.push({ title: translate('Award types'), href: route('staff-management.staff-operations.award-types.index') });
        }
        if (canManageContractTypes) {
            staffOpsChildren.push({
                title: translate('Contract types'),
                href: route('staff-management.staff-operations.contract-types.index'),
            });
        }
        if (canManageAnnouncements) {
            staffOpsChildren.push({
                title: translate('Announcements'),
                href: route('staff-management.staff-operations.announcements.index'),
            });
        }
        if (canManageOnboardingChecklists) {
            staffOpsChildren.push({
                title: translate('Onboarding checklists'),
                href: route('staff-management.staff-operations.onboarding-checklists.index'),
            });
        }
        if (canManageChecklistTasks) {
            staffOpsChildren.push({
                title: translate('Onboarding tasks'),
                href: route('staff-management.staff-operations.onboarding-tasks.index'),
            });
        }

        if (staffOpsChildren.length > 0) {
            staffManagementChildren.push({
                title: translate('Staff operations'),
                children: staffOpsChildren,
            });
        }

        // 2.3 Performance Setup
        const perfSetupChildren: NavItem[] = [];
        if (canManagePerformanceIndicatorCategories) {
            perfSetupChildren.push({
                title: translate('Indicator categories'),
                href: route('staff-management.performance-setup.indicator-categories.index'),
            });
        }
        if (canManagePerformanceIndicators) {
            perfSetupChildren.push({
                title: translate('Indicators'),
                href: route('staff-management.performance-setup.indicators.index'),
            });
        }
        if (canManageGoalTypes) {
            perfSetupChildren.push({
                title: translate('Goal types'),
                href: route('staff-management.performance-setup.goal-types.index'),
            });
        }
        if (canManageReviewCycles) {
            perfSetupChildren.push({
                title: translate('Review cycles'),
                href: route('staff-management.performance-setup.review-cycles.index'),
            });
        }
        if (perfSetupChildren.length > 0) {
            staffManagementChildren.push({
                title: translate('Performance setup'),
                children: perfSetupChildren,
            });
        }

        if (staffManagementChildren.length > 0) {
            items.push({
                title: translate('Staff management'),
                icon: IdCardLanyard,
                children: staffManagementChildren,
            });
        }

        // 3. Leave & Attendance
        const leaveAttendanceChildren: NavItem[] = [];

        // 3.1 Leaves
        const leavesChildren: NavItem[] = [];
        if (canManageLeaveTypes) {
            leavesChildren.push({
                title: translate('Types'),
                href: route('leave-attendance.leaves.leave-types.index'),
            });
        }
        if (canManageLeavePolicies) {
            leavesChildren.push({
                title: translate('Policies'),
                href: route('leave-attendance.leaves.leave-policies.index'),
            });
        }
        if (canManageLeaveApplications) {
            leavesChildren.push({
                title: translate('Applications'),
                href: route('leave-attendance.leaves.leave-applications.index'),
            });
        }
        if (canManageLeaveBalances) {
            leavesChildren.push({
                title: translate('Balances'),
                href: route('leave-attendance.leaves.leave-balances.index'),
            });
        }
        if (leavesChildren.length > 0) {
            leaveAttendanceChildren.push({
                title: translate('Leaves'),
                children: leavesChildren,
            });
        }

        // 3.2 Attendance
        const attendanceChildren: NavItem[] = [];
        if (canManageAttendanceRecords) {
            attendanceChildren.push({
                title: translate('Records'),
                href: route('leave-attendance.attendance.attendance-records.index'),
            });
        }
        if (canManageAttendanceRegularizations) {
            attendanceChildren.push({
                title: translate('Regularization'),
                href: route('leave-attendance.attendance.attendance-regularizations.index'),
            });
        }
        if (canManageBiometricAttendance) {
            attendanceChildren.push({
                title: translate('Biometric'),
                href: route('leave-attendance.attendance.biometric-attendance.index'),
            });
        }
        if (canManageShifts) {
            attendanceChildren.push({ title: translate('Shifts'), href: route('leave-attendance.attendance.shifts.index') });
        }
        if (canManageAttendancePolicies) {
            attendanceChildren.push({
                title: translate('Policies'),
                href: route('leave-attendance.attendance.attendance-policies.index'),
            });
        }
        if (attendanceChildren.length > 0) {
            leaveAttendanceChildren.push({
                title: translate('Attendance'),
                children: attendanceChildren,
            });
        }

        // 3.3 Calendar
        if (canViewCalendar || canManageCalendar) {
            leaveAttendanceChildren.push({
                title: translate('Calendar'),
                href: route('leave-attendance.calendar.index'),
            });
        }

        // 3.4 Holidays
        if (canManageHolidays) {
            leaveAttendanceChildren.push({
                title: translate('Holidays'),
                href: route('leave-attendance.holidays.index'),
            });
        }

        if (leaveAttendanceChildren.length > 0) {
            items.push({
                title: translate('Leave & attendance'),
                icon: CalendarDays,
                children: leaveAttendanceChildren,
            });
        }

        // 4. Training & Development
        const trainingChildren: NavItem[] = [];

        // 4.1 Trainings
        const trainingsChildren: NavItem[] = [];
        if (canManageTrainingPrograms) {
            trainingsChildren.push({
                title: translate('Programs'),
                href: route('training-development.trainings.training-programs.index'),
            });
        }
        if (canManageTrainingSessions) {
            trainingsChildren.push({
                title: translate('Sessions'),
                href: route('training-development.trainings.training-sessions.index'),
            });
        }
        if (canManageTrainingAssessments) {
            trainingsChildren.push({
                title: translate('Assessments'),
                href: route('training-development.trainings.assessments.index'),
            });
        }
        if (canManageStaffTrainings) {
            trainingsChildren.push({
                title: translate('Staff trainings'),
                href: route('training-development.trainings.staff-trainings.index'),
            });
        }
        if (trainingsChildren.length > 0) {
            trainingChildren.push({
                title: translate('Trainings'),
                children: trainingsChildren,
            });
        }

        // 4.2 Training Setup
        const trainingSetupChildren: NavItem[] = [];
        if (canManageTrainingTypes) {
            trainingSetupChildren.push({
                title: translate('Training types'),
                href: route('training-development.training-setup.training-types.index'),
            });
        }
        if (trainingSetupChildren.length > 0) {
            trainingChildren.push({
                title: translate('Training setup'),
                children: trainingSetupChildren,
            });
        }

        // Add Training & Development section if there are children
        if (trainingChildren.length > 0) {
            items.push({
                title: translate('Training & development'),
                icon: GraduationCap,
                children: trainingChildren,
            });
        }

        // 5. Assets
        const assetChildren: NavItem[] = [];
        if (canManageAssets) {
            assetChildren.push({ title: translate('All assets'), href: route('asset-management.all-assets.index') });
            assetChildren.push({ title: translate('Dashboard'), href: route('asset-management.all-assets.dashboard') });
            assetChildren.push({
                title: translate('Depreciation reports'),
                href: route('asset-management.all-assets.depreciation-report'),
            });
        }
        if (canManageAssetTypes) {
            assetChildren.push({ title: translate('Asset types'), href: route('asset-management.asset-types.index') });
        }
        if (assetChildren.length > 0) {
            items.push({
                title: translate('Assets'),
                icon: Package,
                children: assetChildren,
            });
        }

        // 6. Recruitment
        const recruitmentChildren: NavItem[] = [];

        // 6.1 Job Structure
        const jobStructureChildren: NavItem[] = [];
        if (canManageJobCategories) {
            jobStructureChildren.push({
                title: translate('Job categories'),
                href: route('recruitment.job-structure.job-categories.index'),
            });
        }
        if (canManageJobTypes) {
            jobStructureChildren.push({
                title: translate('Job types'),
                href: route('recruitment.job-structure.job-types.index'),
            });
        }
        if (canManageJobLocations) {
            jobStructureChildren.push({
                title: translate('Job locations'),
                href: route('recruitment.job-structure.job-locations.index'),
            });
        }
        if (jobStructureChildren.length > 0) {
            recruitmentChildren.push({
                title: translate('Job structure'),
                children: jobStructureChildren,
            });
        }

        // 6.2 Recruitment Workflow
        const recruitmentWorkflowChildren: NavItem[] = [];
        if (canManageJobRequisitions) {
            recruitmentWorkflowChildren.push({
                title: translate('Job requisitions'),
                href: route('recruitment.recruitment-workflow.job-requisitions.index'),
            });
        }
        if (canManageCustomQuestions) {
            recruitmentWorkflowChildren.push({
                title: translate('Custom questions'),
                href: route('recruitment.recruitment-workflow.custom-questions.index'),
            });
        }
        if (canManageJobPostings) {
            recruitmentWorkflowChildren.push({
                title: translate('Job postings'),
                href: route('recruitment.recruitment-workflow.job-postings.index'),
            });
        }
        if (canManageCandidates) {
            recruitmentWorkflowChildren.push({
                title: translate('Candidates'),
                href: route('recruitment.recruitment-workflow.candidates.index'),
            });
        }
        if (canManageInterviewRounds) {
            recruitmentWorkflowChildren.push({
                title: translate('Interview rounds'),
                href: route('recruitment.recruitment-workflow.interview-rounds.index'),
            });
        }
        if (canManageInterviews) {
            recruitmentWorkflowChildren.push({
                title: translate('Interviews'),
                href: route('recruitment.recruitment-workflow.interviews.index'),
            });
        }
        if (canManageInterviewFeedback) {
            recruitmentWorkflowChildren.push({
                title: translate('Interview feedback'),
                href: route('recruitment.recruitment-workflow.interview-feedback.index'),
            });
        }
        if (canManageCandidateAssessments) {
            recruitmentWorkflowChildren.push({
                title: translate('Candidate assessments'),
                href: route('recruitment.recruitment-workflow.candidate-assessments.index'),
            });
        }
        if (canManageOffers) {
            recruitmentWorkflowChildren.push({
                title: translate('Offers'),
                href: route('recruitment.recruitment-workflow.offers.index'),
            });
        }
        if (canManageCandidateOnboarding) {
            recruitmentWorkflowChildren.push({
                title: translate('Candidate onboarding'),
                href: route('recruitment.recruitment-workflow.candidate-onboarding.index'),
            });
        }
        if (recruitmentWorkflowChildren.length > 0) {
            recruitmentChildren.push({
                title: translate('Workflow'),
                children: recruitmentWorkflowChildren,
            });
        }

        // 6.3 Recruitment Templates
        const recruitmentTemplatesChildren: NavItem[] = [];
        if (canManageOfferTemplates) {
            recruitmentTemplatesChildren.push({
                title: translate('Offer templates'),
                href: route('recruitment.templates.offer-templates.index'),
            });
        }
        if (recruitmentTemplatesChildren.length > 0) {
            recruitmentChildren.push({
                title: translate('Templates'),
                children: recruitmentTemplatesChildren,
            });
        }

        // 6.4 Recruitment Setup
        const recruitmentSetupChildren: NavItem[] = [];
        if (canManageCandidateSources) {
            recruitmentSetupChildren.push({
                title: translate('Candidate sources'),
                href: route('recruitment.recruitment-setup.candidate-sources.index'),
            });
        }
        if (canManageInterviewTypes) {
            recruitmentSetupChildren.push({
                title: translate('Interview types'),
                href: route('recruitment.recruitment-setup.interview-types.index'),
            });
        }
        if (recruitmentSetupChildren.length > 0) {
            recruitmentChildren.push({
                title: translate('Recruitment setup'),
                children: recruitmentSetupChildren,
            });
        }
        if (canManageCareerPage) {
            if (organizationSlug) {
                recruitmentChildren.push({
                    title: (
                        <span className="flex items-center gap-1">
                            {translate('Careers website')}
                            <ExternalLink size={14} />
                        </span>
                    ),
                    href: route('career.index', organizationSlug),
                    target: '_blank',
                });
            }
        }

        // Add Recruitment section if there are children to display
        if (recruitmentChildren.length > 0) {
            items.push({
                title: translate('Recruitment'),
                icon: Backpack,
                children: recruitmentChildren,
            });
        }

        // 7. Contracts
        const contractChildren: NavItem[] = [];
        if (canManageStaffContracts) {
            contractChildren.push({
                title: translate('All contracts'),
                href: route('contracts.all-contracts.index'),
            });
        }
        if (canManageContractRenewals) {
            contractChildren.push({
                title: translate('Contract renewals'),
                href: route('contracts.contract-renewals.index'),
            });
        }
        if (canManageContractTemplates) {
            contractChildren.push({
                title: translate('Contract templates'),
                href: route('contracts.contract-templates.index'),
            });
        }
        if (contractChildren.length > 0) {
            items.push({
                title: translate('Contracts'),
                icon: Signature,
                children: contractChildren,
            });
        }

        // 8. Documents
        const documentChildren: NavItem[] = [];
        if (canManageDocumentCategories) {
            documentChildren.push({
                title: translate('Categories'),
                href: route('documents.document-categories.index'),
            });
        }
        if (canManageDocumentAcknowledgments) {
            documentChildren.push({
                title: translate('Acknowledgments'),
                href: route('documents.document-acknowledgments.index'),
            });
        }
        if (canManageDocumentTemplates) {
            documentChildren.push({
                title: translate('Document templates'),
                href: route('documents.document-templates.index'),
            });
        }
        if (canManageHumanResourcePolicies) {
            documentChildren.push({
                title: translate('Policies & procedures'),
                href: route('documents.document-policies-procedures.index'),
            });
        }
        if (documentChildren.length > 0) {
            items.push({
                title: translate('Documents'),
                icon: Folder,
                children: documentChildren,
            });
        }

        // 9. Meetings
        const meetingChildren: NavItem[] = [];
        if (canManageMeetingTypes) {
            meetingChildren.push({ title: translate('Meeting types'), href: route('meetings.meeting-types.index') });
        }
        if (canManageMeetingRooms) {
            meetingChildren.push({ title: translate('Meeting rooms'), href: route('meetings.meeting-rooms.index') });
        }
        if (canManageMeetings) {
            meetingChildren.push({ title: translate('All meetings'), href: route('meetings.all-meetings.index') });
        }
        if (canManageMeetingMinutes) {
            meetingChildren.push({
                title: translate('Meeting minutes'),
                href: route('meetings.meeting-minutes.index'),
            });
        }
        if (canManageMeetingAttendees) {
            meetingChildren.push({
                title: translate('Meeting attendees'),
                href: route('meetings.meeting-attendees.index'),
            });
        }
        if (canManageMeetingActionItems) {
            meetingChildren.push({
                title: translate('Meeting action items'),
                href: route('meetings.meeting-action-items.index'),
            });
        }
        if (meetingChildren.length > 0) {
            items.push({
                title: translate('Meetings'),
                icon: Presentation,
                children: meetingChildren,
            });
        }

        // 10. Time Tracking
        const timeTrackingChildren: NavItem[] = [];
        if (canManageTimeEntries) {
            timeTrackingChildren.push({
                title: translate('Time entries'),
                href: route('time-tracking.time-entries.index'),
            });
        }
        if (timeTrackingChildren.length > 0) {
            items.push({
                title: translate('Time tracking'),
                icon: ClipboardClock,
                children: timeTrackingChildren,
            });
        }

        // 11. Payroll
        const payrollChildren: NavItem[] = [];

        // 11.1 Payroll Management
        const payrollManagementChildren: NavItem[] = [];
        if (canManagePayrollRuns) {
            payrollManagementChildren.push({
                title: translate('Payroll runs'),
                href: route('payroll.compensation.payroll-runs.index'),
            });
        }
        if (canManagePayslips) {
            payrollManagementChildren.push({
                title: translate('Payslips'),
                href: route('payroll.compensation.payslips.index'),
            });
        }
        if (payrollManagementChildren.length > 0) {
            payrollChildren.push({
                title: translate('Compensation'),
                children: payrollManagementChildren,
            });
        }

        // 11.2 Payroll Setup
        const payrollSetupChildren: NavItem[] = [];
        if (canManageSalaryComponents) {
            payrollSetupChildren.push({
                title: translate('Salary components'),
                href: route('payroll.payroll-setup.salary-components.index'),
            });
        }
        if (canManageStaffSalaries) {
            payrollSetupChildren.push({
                title: translate('Staff salaries'),
                href: route('payroll.payroll-setup.staff-salaries.index'),
            });
        }
        if (payrollSetupChildren.length > 0) {
            payrollChildren.push({
                title: translate('Payroll setup'),
                children: payrollSetupChildren,
            });
        }

        // Add Payroll section if there are children
        if (payrollChildren.length > 0) {
            items.push({
                title: translate('Payroll'),
                icon: HandCoins,
                children: payrollChildren,
            });
        }

        // 12. Users & Permissions
        const usersPermChildren: NavItem[] = [];
        if (canManageUsers) {
            usersPermChildren.push({ title: translate('Users'), href: route('users-permissions.users.index') });
        }
        if (canManageRoles) {
            usersPermChildren.push({ title: translate('Roles'), href: route('users-permissions.roles.index') });
        }
        if (usersPermChildren.length > 0) {
            items.push({
                title: translate('Users & permissions'),
                icon: Users,
                children: usersPermChildren,
            });
        }

        // 13. Media Library
        if (canManageMedia) {
            items.push({
                title: translate('Media library'),
                href: route('media-library.index'),
                icon: Image,
            });
        }

        // 14. Subscriptions (Plans)
        const planChildren: NavItem[] = [];
        if (canManagePlans) {
            planChildren.push({ title: translate('Plans'), href: route('subscriptions.plans.index') });
        }
        if (canViewPlanRequests) {
            planChildren.push({ title: translate('Plan requests'), href: route('plan-requests.index') });
        }
        if (canViewPlanOrders) {
            planChildren.push({ title: translate('Plan orders'), href: route('plan-orders.index') });
        }
        if (planChildren.length > 0) {
            items.push({
                title: translate('Subscriptions'),
                icon: CreditCard,
                children: planChildren,
            });
        }

        // 15. Referral Program
        if (canManageReferral) {
            items.push({
                title: translate('Referral program'),
                href: route('referral-program.index'),
                icon: Gift,
            });
        }

        // 16. Settings (global)
        if (canManageSettings) {
            items.push({
                title: translate('Settings'),
                href: route('settings.index'),
                icon: Settings,
            });
        }

        return items;
    };

    const mainNavItems = userRole === 'super_admin' ? getSuperAdminNavItems() : getOrganizationNavItems();

    const { effectivePosition } = useLayout();
    const { variant, collapsible } = useSidebar();
    const { logo_light: logoLight, logo_dark: logoDark, favicon, updateBrandSettings } = useBrand();

    const filteredNavItems = mainNavItems;

    // Get the first available menu item's href for logo link
    const getFirstAvailableHref = () => {
        if (filteredNavItems.length === 0) return route('dashboard.index');

        const firstItem = filteredNavItems[0];
        if (firstItem.href) {
            return firstItem.href;
        } else if (firstItem.children && firstItem.children.length > 0) {
            return firstItem.children[0].href || route('dashboard.index');
        }
        return route('dashboard.index');
    };

    // Determine current theme
    const getCurrentTheme = useCallback(() => {
        if (document.documentElement.classList.contains('dark')) return 'dark';
        return 'light';
    }, []);

    // Resolve logo and favicon based on theme & availability
    const resolveLogo = useCallback(() => {
        const theme = getCurrentTheme();
        if (theme === 'dark') return logoDark || hafinenLogoDark;
        return logoLight || hafinenLogoLight;
    }, [logoLight, logoDark, getCurrentTheme]);

    const resolveFavicon = useCallback(() => favicon || hafinenIcon, [favicon]);

    // Sidebar state
    const [currentLogo, setCurrentLogo] = useState(resolveLogo);
    const [currentFavicon, setCurrentFavicon] = useState(resolveFavicon);

    // Update on theme changes
    useEffect(() => {
        const onThemeChange = () => {
            setCurrentLogo(resolveLogo());
            setCurrentFavicon(resolveFavicon());
        };

        // Observe changes to the <html> class
        const observer = new MutationObserver(onThemeChange);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            observer.disconnect();
        };
    }, [resolveLogo, resolveFavicon]);

    const handleLogoError = useCallback(() => {
        updateBrandSettings({
            [getCurrentTheme() === 'dark' ? 'logoDark' : 'logoLight']: '',
        });
    }, [updateBrandSettings, getCurrentTheme]);

    const handleFaviconError = useCallback(() => {
        updateBrandSettings({ favicon: '' });
    }, [updateBrandSettings]);

    return (
        <Sidebar side={effectivePosition} collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                <div className="flex items-center px-2">
                    <Link href={getFirstAvailableHref()} prefetch>
                        {/* Expanded Sidebar Logo */}
                        <div className="flex h-12 items-center group-data-[collapsible=icon]:hidden">
                            <img
                                src={resolveImageUrl(currentLogo)}
                                alt="Hafinen"
                                className="h-11 w-auto max-w-[180px] transition-all duration-200"
                                onError={handleLogoError}
                            />
                        </div>

                        {/* Collapsed Sidebar Favicon */}
                        <div className="hidden h-8 w-8 group-data-[collapsible=icon]:block">
                            <img
                                src={resolveImageUrl(currentFavicon)}
                                alt="Icon"
                                className="h-8 w-8 transition-all duration-200"
                                onError={handleFaviconError}
                            />
                        </div>
                    </Link>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} position={effectivePosition} />
            </SidebarContent>

            <SidebarFooter />
        </Sidebar>
    );
}

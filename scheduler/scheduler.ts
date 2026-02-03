// Define Types
type Term = 'Fall' | 'Winter' | 'Both';

interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    workload: number; // e.g., 1.0 is standard, 2.0 is heavy
    offered: Term;
    prereqs: string[]; // List of course IDs
}

// Initial Data - Mocking some UMich CS classes
const courseCatalog: Course[] = [
    { id: 'eecs489',  code: 'EECS 489', name: 'Computer Networks', credits: 4, workload: 0, offered: 'Both', prereqs: []},
    { id: 'eecs482', code: 'EECS 373', name: 'Embedded Systems', credits: 4, workload: 3.0, offered: 'Both', prereqs: [] },
    { id: 'eecs473', code: 'EECS 473', name: 'Advanced Embedded', credits: 4, workload: 2.5, offered: 'Both', prereqs: ['eecs373'] },
    { id: 'rcarts240', code: 'RCARTS 240', name: 'Dark Room Photo', credits: 3, workload: 1.0, offered: 'Both', prereqs: [] },
    { id: 'eecs470', code: 'EECS 470', name: 'Computer Architecture', credits: 4, workload: 2.0, offered: 'Both', prereqs: [] },
    { id: 'me250', code: 'MechEng 250', name: 'Design and Manufacturing I', credits: 4, workload: 2.0, offered: 'Both', prereqs: [] },
    { id: 'eecs479', code: 'EECS 479', name: 'Introduction to Quantum Computing', credits: 4, workload: 2.0, offered: 'Both', prereqs: [] },
    { id: 'eecs491', code: 'EECS 491', name: 'Introduction to Distributed Systems', credits: 4, workload: 2.0, offered: 'Both', prereqs: [] },
];

// State Management
// Maps container IDs (pool, fa26, etc) to arrays of course IDs
let scheduleState: { [key: string]: string[] } = {
    'pool': courseCatalog.map(c => c.id),
    'fa26': [],
    'wi27': [],
    'fa27': [],
    'wi28': []
};

// Semester Order for Prereq checking
const semesterOrder = ['fa26', 'wi27', 'fa27', 'wi28'];

document.addEventListener('DOMContentLoaded', () => {
    render();
});

// --- Rendering Logic ---

function render() {
    // Clear all zones
    Object.keys(scheduleState).forEach(zoneId => {
        const container = document.querySelector(`[data-semester-id="${zoneId}"]`);
        if (container) {
            container.innerHTML = '';
            
            // Render Courses
            scheduleState[zoneId].forEach(courseId => {
                const course = courseCatalog.find(c => c.id === courseId);
                if (course) {
                    const card = createCourseCard(course, zoneId);
                    container.appendChild(card);
                }
            });

            // Update Header Stats (Credits)
            if (zoneId !== 'pool') {
                updateSemesterStats(zoneId);
            }
        }
    });

    // Check Global Constraints (Prereqs)
    validatePrerequisites();
}

function createCourseCard(course: Course, currentZoneId: string): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('course-card');
    div.setAttribute('draggable', 'true');
    div.dataset.courseId = course.id;

    // Workload Visual
    let workloadClass = 'medium';
    if(course.workload > 2.0) workloadClass = 'heavy';
    if(course.workload < 1.0) workloadClass = 'light';

    // Check specific semester constraints (Offering Season)
    const errors: string[] = [];
    if (currentZoneId !== 'pool') {
        const zoneElement = document.querySelector(`[data-semester-id="${currentZoneId}"]`);
        const term = zoneElement?.getAttribute('data-term') as Term;
        
        // Check Offered Term
        if (course.offered !== 'Both' && course.offered !== term) {
            errors.push(`Only offered in ${course.offered}`);
        }
    }

    // Build HTML
    div.innerHTML = `
        <div class="course-header">
            <span class="course-code">${course.code}</span>
            <span class="course-credits">${course.credits} Cr</span>
        </div>
        <div class="course-name">${course.name}</div>
        <div class="course-meta">
            <span class="workload-badge ${workloadClass}">Workload: ${course.workload}x</span>
            ${errors.length > 0 ? `<div class="error-msg"><i class="fas fa-exclamation-triangle"></i> ${errors.join(', ')}</div>` : ''}
            <div class="prereq-error-container"></div> </div>
    `;

    // Add Error Styling if needed
    if (errors.length > 0) div.classList.add('card-error');

    // Drag Events
    div.addEventListener('dragstart', handleDragStart);
    return div;
}

function updateSemesterStats(zoneId: string) {
    const courseIds = scheduleState[zoneId];
    const courses = courseIds.map(id => courseCatalog.find(c => c.id === id)!);
    
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const container = document.querySelector(`[data-semester-id="${zoneId}"]`)?.parentElement;
    const statsEl = container?.querySelector('.credits-count');

    if (statsEl) {
        statsEl.textContent = `${totalCredits}/18 Credits`;
        if (totalCredits > 18) {
            statsEl.classList.add('over-limit');
            statsEl.classList.remove('good-limit');
        } else {
            statsEl.classList.remove('over-limit');
            statsEl.classList.add('good-limit');
        }
    }
}

// --- Validation Logic ---

function validatePrerequisites() {
    // Map course ID to the index of the semester it is in (-1 if pool)
    const courseLocation: { [key: string]: number } = {};
    
    Object.keys(scheduleState).forEach(zoneId => {
        const semIndex = semesterOrder.indexOf(zoneId); // -1 for pool
        scheduleState[zoneId].forEach(cId => {
            courseLocation[cId] = zoneId === 'pool' ? -1 : semIndex;
        });
    });

    // Check every scheduled course
    Object.keys(scheduleState).forEach(zoneId => {
        if (zoneId === 'pool') return;
        const currentSemIndex = semesterOrder.indexOf(zoneId);

        scheduleState[zoneId].forEach(cId => {
            const course = courseCatalog.find(c => c.id === cId)!;
            const missingPrereqs: string[] = [];
            const futurePrereqs: string[] = [];

            course.prereqs.forEach(prereqId => {
                const pLoc = courseLocation[prereqId];
                const prereqCourse = courseCatalog.find(c => c.id === prereqId);

                // If prereq is not scheduled at all
                if (pLoc === undefined || pLoc === -1) {
                    missingPrereqs.push(prereqCourse ? prereqCourse.code : prereqId);
                } 
                // If prereq is scheduled in same semester or future semester
                else if (pLoc >= currentSemIndex) {
                    futurePrereqs.push(prereqCourse ? prereqCourse.code : prereqId);
                }
            });

            // Update UI for specific card
            const card = document.querySelector(`[data-semester-id="${zoneId}"] [data-course-id="${cId}"]`);
            if (card) {
                const errorContainer = card.querySelector('.prereq-error-container');
                if (errorContainer) {
                    errorContainer.innerHTML = '';
                    if (missingPrereqs.length > 0) {
                        errorContainer.innerHTML += `<div class="error-msg"><i class="fas fa-times-circle"></i> Missing: ${missingPrereqs.join(', ')}</div>`;
                        card.classList.add('card-severe-error');
                    }
                    if (futurePrereqs.length > 0) {
                        errorContainer.innerHTML += `<div class="error-msg"><i class="fas fa-clock"></i> Taken too late: ${futurePrereqs.join(', ')}</div>`;
                        card.classList.add('card-severe-error');
                    }
                    if (missingPrereqs.length === 0 && futurePrereqs.length === 0) {
                        card.classList.remove('card-severe-error');
                    }
                }
            }
        });
    });
}

// --- Drag & Drop Handlers ---

let draggedCourseId: string | null = null;
let sourceZoneId: string | null = null;

function handleDragStart(e: DragEvent) {
    const target = e.target as HTMLElement;
    draggedCourseId = target.dataset.courseId || null;
    sourceZoneId = target.parentElement?.dataset.semesterId || null;
    e.dataTransfer!.effectAllowed = 'move';
}

const dropzones = document.querySelectorAll('.course-list');
dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        (e.target as HTMLElement).classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
        (e.target as HTMLElement).classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        const zoneEl = e.currentTarget as HTMLElement;
        const targetZoneId = zoneEl.dataset.semesterId;
        zoneEl.classList.remove('drag-over');

        if (draggedCourseId && sourceZoneId && targetZoneId && sourceZoneId !== targetZoneId) {
            // Remove from old
            scheduleState[sourceZoneId] = scheduleState[sourceZoneId].filter(id => id !== draggedCourseId);
            // Add to new
            scheduleState[targetZoneId].push(draggedCourseId);
            // Re-render
            render();
        }
    });
});
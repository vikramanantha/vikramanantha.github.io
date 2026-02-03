"use strict";
// Initial Data - Mocking some UMich CS classes
const courseCatalog = [
    { id: 'eecs281', code: 'EECS 281', name: 'Data Structures & Alg', credits: 4, workload: 2.0, offered: 'Both', prereqs: [] },
    { id: 'eecs370', code: 'EECS 370', name: 'Computer Organization', credits: 4, workload: 1.5, offered: 'Both', prereqs: ['eecs281'] },
    { id: 'eecs376', code: 'EECS 376', name: 'Foundations of CS', credits: 4, workload: 1.2, offered: 'Both', prereqs: ['eecs281'] },
    { id: 'eecs482', code: 'EECS 482', name: 'Operating Systems', credits: 4, workload: 3.0, offered: 'Both', prereqs: ['eecs370', 'eecs376'] },
    { id: 'eecs473', code: 'EECS 473', name: 'Advanced Embedded', credits: 4, workload: 2.5, offered: 'Fall', prereqs: ['eecs373'] },
    { id: 'eecs373', code: 'EECS 373', name: 'Intro to Embedded', credits: 4, workload: 2.0, offered: 'Both', prereqs: ['eecs281', 'eecs370'] },
    { id: 'eecs445', code: 'EECS 445', name: 'Machine Learning', credits: 4, workload: 1.8, offered: 'Winter', prereqs: ['eecs281'] },
    { id: 'eecs498', code: 'EECS 498', name: 'Vision Language Models', credits: 3, workload: 1.5, offered: 'Fall', prereqs: ['eecs445'] },
    { id: 'math214', code: 'MATH 214', name: 'Linear Algebra', credits: 3, workload: 0.8, offered: 'Both', prereqs: [] },
    { id: 'tchncl1', code: 'TCHNCL', name: 'Tech Elective A', credits: 3, workload: 1.0, offered: 'Both', prereqs: [] },
];
// State Management
// Maps container IDs (pool, fa26, etc) to arrays of course IDs
let scheduleState = {
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
function createCourseCard(course, currentZoneId) {
    const div = document.createElement('div');
    div.classList.add('course-card');
    div.setAttribute('draggable', 'true');
    div.dataset.courseId = course.id;
    // Workload Visual
    let workloadClass = 'medium';
    if (course.workload > 2.0)
        workloadClass = 'heavy';
    if (course.workload < 1.0)
        workloadClass = 'light';
    // Check specific semester constraints (Offering Season)
    const errors = [];
    if (currentZoneId !== 'pool') {
        const zoneElement = document.querySelector(`[data-semester-id="${currentZoneId}"]`);
        const term = zoneElement === null || zoneElement === void 0 ? void 0 : zoneElement.getAttribute('data-term');
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
    if (errors.length > 0)
        div.classList.add('card-error');
    // Drag Events
    div.addEventListener('dragstart', handleDragStart);
    return div;
}
function updateSemesterStats(zoneId) {
    var _a;
    const courseIds = scheduleState[zoneId];
    const courses = courseIds.map(id => courseCatalog.find(c => c.id === id));
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const container = (_a = document.querySelector(`[data-semester-id="${zoneId}"]`)) === null || _a === void 0 ? void 0 : _a.parentElement;
    const statsEl = container === null || container === void 0 ? void 0 : container.querySelector('.credits-count');
    if (statsEl) {
        statsEl.textContent = `${totalCredits}/18 Credits`;
        if (totalCredits > 18) {
            statsEl.classList.add('over-limit');
            statsEl.classList.remove('good-limit');
        }
        else {
            statsEl.classList.remove('over-limit');
            statsEl.classList.add('good-limit');
        }
    }
}
// --- Validation Logic ---
function validatePrerequisites() {
    // Map course ID to the index of the semester it is in (-1 if pool)
    const courseLocation = {};
    Object.keys(scheduleState).forEach(zoneId => {
        const semIndex = semesterOrder.indexOf(zoneId); // -1 for pool
        scheduleState[zoneId].forEach(cId => {
            courseLocation[cId] = zoneId === 'pool' ? -1 : semIndex;
        });
    });
    // Check every scheduled course
    Object.keys(scheduleState).forEach(zoneId => {
        if (zoneId === 'pool')
            return;
        const currentSemIndex = semesterOrder.indexOf(zoneId);
        scheduleState[zoneId].forEach(cId => {
            const course = courseCatalog.find(c => c.id === cId);
            const missingPrereqs = [];
            const futurePrereqs = [];
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
let draggedCourseId = null;
let sourceZoneId = null;
function handleDragStart(e) {
    var _a;
    const target = e.target;
    draggedCourseId = target.dataset.courseId || null;
    sourceZoneId = ((_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.dataset.semesterId) || null;
    e.dataTransfer.effectAllowed = 'move';
}
const dropzones = document.querySelectorAll('.course-list');
dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.target.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
        e.target.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        const zoneEl = e.currentTarget;
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

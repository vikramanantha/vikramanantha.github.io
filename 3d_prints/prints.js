import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Loaders are imported on demand so the gallery page only pulls what a model needs.
// zUp: formats exported from CAD/slicers (STL, 3MF) are Z-up; three.js is Y-up.
const LOADERS = {
    stl: { module: 'three/addons/loaders/STLLoader.js', name: 'STLLoader', zUp: true },
    '3mf': { module: 'three/addons/loaders/3MFLoader.js', name: 'ThreeMFLoader', zUp: true },
    obj: { module: 'three/addons/loaders/OBJLoader.js', name: 'OBJLoader', zUp: false },
    glb: { module: 'three/addons/loaders/GLTFLoader.js', name: 'GLTFLoader', zUp: false },
    gltf: { module: 'three/addons/loaders/GLTFLoader.js', name: 'GLTFLoader', zUp: false },
};

const MODEL_COLOR = 0xED254E; // --color-accent

let models = [];
let container = null;
let activeViewer = null;

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function init() {
    container = document.getElementById('prints-container');

    try {
        const response = await fetch('model_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        models = await response.json();
    } catch (error) {
        console.error('Error loading model data:', error);
        container.innerHTML = '<p class="prints-error">Could not load model data. Please check model_data.json.</p>';
        return;
    }

    window.addEventListener('hashchange', route);
    route();
}

// The hash (#model-slug) decides which view is shown, so models are linkable
// and the browser back button returns to the gallery.
function route() {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    const model = models.find(m => slugify(m.name) === slug);
    if (model) {
        renderDetailView(model);
    } else {
        renderBannerView();
    }
}

// ---------- Gallery (banner) view ----------

function renderBannerView() {
    disposeViewer();
    container.innerHTML = '';

    const banners = document.createElement('div');
    banners.className = 'photo-banners-container';

    models.forEach(model => {
        const banner = document.createElement('a');
        banner.className = 'photo-banner print-banner';
        banner.href = `#${slugify(model.name)}`;

        const overlay = document.createElement('div');
        overlay.className = 'photo-banner-overlay';

        const text = document.createElement('h2');
        text.className = 'photo-banner-text';
        text.textContent = model.name;

        banner.appendChild(overlay);
        banner.appendChild(text);
        banners.appendChild(banner);
    });

    container.appendChild(banners);
}

// ---------- Detail (viewer) view ----------

function renderDetailView(model) {
    disposeViewer();
    container.innerHTML = '';
    window.scrollTo(0, 0);

    const header = document.createElement('div');
    header.className = 'grid-header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Prints';
    backButton.onclick = () => { window.location.hash = ''; };

    const title = document.createElement('h1');
    title.className = 'grid-title';
    title.textContent = model.name;

    header.appendChild(backButton);
    header.appendChild(title);

    const detail = document.createElement('div');
    detail.className = 'print-detail';

    // Viewer panel
    const viewerPanel = document.createElement('div');
    viewerPanel.className = 'print-viewer';

    const status = document.createElement('div');
    status.className = 'print-viewer-status';
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading model…';

    const resetButton = document.createElement('button');
    resetButton.className = 'print-reset-button';
    resetButton.title = 'Reset view';
    resetButton.innerHTML = '<i class="fas fa-rotate-left"></i>';

    const hint = document.createElement('div');
    hint.className = 'print-viewer-hint';
    hint.innerHTML = '<i class="fas fa-hand-pointer"></i> Drag to rotate · Scroll to zoom · Right-drag to pan';

    viewerPanel.appendChild(status);
    viewerPanel.appendChild(resetButton);
    viewerPanel.appendChild(hint);

    // Info panel
    const info = document.createElement('aside');
    info.className = 'print-info content-box';
    info.appendChild(infoField('Purpose', model.purpose));
    info.appendChild(infoField('Description', model.description));
    if (model.name_origin) info.appendChild(infoField('Name Origin', model.name_origin));
    if (model.improvements) info.appendChild(infoField('Improvements', model.improvements));
    info.appendChild(infoField('Print Date', model.print_date));

    const download = document.createElement('a');
    download.className = 'back-button print-download';
    download.href = encodeURI(model.path);
    download.download = model.path.split('/').pop();
    download.innerHTML = '<i class="fas fa-download"></i> Download Model';
    info.appendChild(download);

    detail.appendChild(viewerPanel);
    detail.appendChild(info);

    container.appendChild(header);
    container.appendChild(detail);

    const viewer = createViewer(viewerPanel);
    activeViewer = viewer;
    resetButton.onclick = () => viewer.resetView();

    loadModel(model.path)
        .then(object => {
            if (activeViewer !== viewer) return; // navigated away while loading
            viewer.setModel(object);
            status.remove();
        })
        .catch(error => {
            console.error(`Failed to load model: ${model.path}`, error);
            status.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Could not load this model.';
            status.classList.add('error');
        });
}

function infoField(label, value) {
    const section = document.createElement('div');
    section.className = 'print-info-field';

    const heading = document.createElement('h3');
    heading.textContent = label;

    // Fields may contain HTML (links, <em>, <br>) written in model_data.json
    const body = document.createElement('p');
    body.innerHTML = value || '—';
    body.querySelectorAll('a').forEach(link => {
        link.target = '_blank';
        link.rel = 'noopener';
    });

    section.appendChild(heading);
    section.appendChild(body);
    return section;
}

async function loadModel(path) {
    const ext = path.split('.').pop().toLowerCase();
    const loaderInfo = LOADERS[ext];
    if (!loaderInfo) throw new Error(`Unsupported model format: .${ext}`);

    const module = await import(loaderInfo.module);
    const loader = new module[loaderInfo.name]();
    const result = await loader.loadAsync(encodeURI(path));

    let object;
    if (result.isBufferGeometry) {
        // STL gives bare geometry
        object = new THREE.Mesh(result, new THREE.MeshStandardMaterial({
            color: MODEL_COLOR, roughness: 0.55, metalness: 0.05,
        }));
    } else {
        object = result.scene || result;
        if (ext === 'obj') {
            object.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: MODEL_COLOR, roughness: 0.55 });
                }
            });
        }
    }

    if (loaderInfo.zUp) object.rotation.x = -Math.PI / 2;

    const wrapper = new THREE.Group();
    wrapper.add(object);
    return wrapper;
}

function createViewer(panel) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    panel.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(1, 2, 1.5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-1.5, 0.5, -1);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    let model = null;
    let grid = null;
    let homePosition = new THREE.Vector3(1, 1, 1);

    function resize() {
        const { clientWidth, clientHeight } = panel;
        if (!clientWidth || !clientHeight) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(panel);
    resize();

    let frameId = null;
    function animate() {
        frameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    function setModel(object) {
        model = object;

        // Center the model on the origin so it orbits around its middle
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object.position.sub(center);
        scene.add(object);

        // Fit the bounding sphere within whichever field of view (vertical or horizontal) is narrower
        const radius = size.length() / 2 || 1;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const distance = radius / Math.sin(Math.min(vFov, hFov) / 2) * 1.1;

        // A faint print bed under the model
        const gridSize = Math.max(size.x, size.z) * 2.5;
        grid = new THREE.GridHelper(gridSize, 20, 0x0A2342, 0x9aa3b2);
        grid.material.transparent = true;
        grid.material.opacity = 0.35;
        grid.position.y = -size.y / 2;
        scene.add(grid);

        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.minDistance = radius * 0.3;
        controls.maxDistance = distance * 5;

        homePosition = new THREE.Vector3(1, 0.7, 1).normalize().multiplyScalar(distance);
        resetView();
    }

    function resetView() {
        camera.position.copy(homePosition);
        controls.target.set(0, 0, 0);
        controls.autoRotate = true;
        controls.update();
    }

    function dispose() {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        controls.dispose();
        scene.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
            }
        });
        renderer.dispose();
        renderer.forceContextLoss();
    }

    return { setModel, resetView, dispose };
}

function disposeViewer() {
    if (activeViewer) {
        activeViewer.dispose();
        activeViewer = null;
    }
}

init();

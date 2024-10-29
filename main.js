import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import planetsData from "./planetsData.json"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Paramétrage de la caméra
const controls = new OrbitControls(camera, renderer.domElement)
controls.update()
controls.minDistance = 100
controls.maxDistance = 500
camera.position.set(0, 200, 400)
camera.lookAt(0, 0, 0)

// Création des lumières pour le soleil
const ambient = new THREE.AmbientLight(0x333333)
scene.add(ambient)
const light = new THREE.PointLight( 0xffffff, 25000, 0 )
light.position.set(0,0,0)
scene.add(light);


// Création des étoiles avec BufferGeometry
const starGeo = new THREE.BufferGeometry()
const starVertices = []

for (let i = 0; i < 6000; i++) {
  const x = Math.random() * 1600 - 800
  const y = Math.random() * 1600 - 800
  const z = Math.random() * 1600 - 800
  starVertices.push(x, y, z)
}

// Assigner les vertices des étoiles à la BufferGeometry
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

// Chargement de la texture des étoiles
const starTexture = new THREE.TextureLoader().load("./assets/star.png")
const starMaterial = new THREE.PointsMaterial({
  color: 0xaaaaaa,
  size: 0.2,
  map: starTexture,
  transparent: true
})

const stars = new THREE.Points(starGeo, starMaterial)
scene.add(stars)

// Création soleil
const sunGeo = new THREE.SphereGeometry(15, 64, 32)
const sunTexture = new THREE.TextureLoader().load("./assets/sun.jpeg")
const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture
})
const sun = new THREE.Mesh(sunGeo, sunMaterial)
scene.add(sun)

// Fonction de création des planètes
function createPlanet({name, radius, assets, distance_from_sun, orbital_velocity_km_s, rotation_speed_kmh, orbital_period_days, rotation_period_hours}) {
  const planetGeo = new THREE.SphereGeometry((radius), 64, 32)
  const planetTexture = new THREE.TextureLoader().load(assets)
  const planetMaterial = new THREE.MeshStandardMaterial({
    map: planetTexture
  })
  const planet = new THREE.Mesh(planetGeo, planetMaterial)
  scene.add(planet)

  // Création de l'orbit
  const planetOrbit = new THREE.Group()
  scene.add(planetOrbit)
  planetOrbit.add(planet)
  planet.position.set(distance_from_sun, 0, 0)
  planetOrbit.rotation.y = Math.floor(Math.random() * (7))

  // Création des anneaux pour montrer le trajet d'une planète
  const ringOrbit = new THREE.RingGeometry(distance_from_sun -
    0.25, distance_from_sun + 0.25, 256);
  const ringMaterial = new THREE.MeshBasicMaterial( { color: 0x444444, side: THREE.DoubleSide} );
  const ringMesh = new THREE.Mesh( ringOrbit, ringMaterial );
  scene.add(ringMesh);
  ringMesh.rotation.x = Math.PI / 2

  // Calcul de la vitesse angulaire pour l'orbite
  const angularSpeedOrbit = 2 * Math.PI / (orbital_period_days * 24 * 3600) // radians par seconde
  // Calcul de la vitesse angulaire pour la rotation sur l'axe
  const angularSpeedRotation = 2 * Math.PI / (rotation_period_hours * 3600) // radians par seconde

  return { planet, planetOrbit, orbital_velocity_km_s, rotation_speed_kmh, name, angularSpeedOrbit, angularSpeedRotation}
}

const planetsProcessed = planetsData.map(planet => createPlanet(planet))
console.log(planetsProcessed)

const timeScale = {
  realTime: 1,                 // Temps réel
  oneDay: 24 * 3600,           // 1s = 1 jour
  oneWeek: 7 * 24 * 3600,      // 1s = 7 jours
  oneMonth: 30 * 24 * 3600,    // 1s = 1 mois (approximé à 30 jours)
  threeMonths: 90 * 24 * 3600, // 1s = 3 mois (approximé à 90 jours)
  sixMonths: 182.5 * 24 * 3600,// 1s = 6 mois (approximé à 182.5 jours)
  oneYear: 365.25 * 24 * 3600  // 1s = 1 an
}

function animate() {
  renderer.render(scene, camera)
  // sun.rotation.y += (7200 / 200000)
  planetsProcessed.forEach(planet => {
    // Rotation autour du soleil de chaque planète (temps/année)
    // planet.planetOrbit.rotation.y += (planet.orbital_velocity_km_s / 2000)

    // Rotation sur leur axe (temps/jour)
    // planet.planet.rotation.y += (planet.rotation_speed_kmh / 200000)

    // Rotation autour du soleil de chaque planète
    planet.planetOrbit.rotation.y += planet.angularSpeedOrbit * (1 / 60) * timeScale[timeScaleBtnClicked] // Ajuster selon le frame rate

    // Rotation sur leur axe
    planet.planet.rotation.y += planet.angularSpeedRotation * (1 / 60) * timeScale[timeScaleBtnClicked] // Ajuster selon le frame rate
  }
  )
}
renderer.setAnimationLoop(animate)

const timeScaleBtn = document.querySelectorAll(".time-scale-navbar__button")
timeScaleBtn.forEach(timeBtn => timeBtn.addEventListener("click", handleTimeScale))

let timeScaleBtnClicked = "oneMonth"

function handleTimeScale(e) {
  timeScaleBtnClicked = e.target.dataset.scale
}

const planetLink = document.querySelectorAll(".planet-name-navbar__planet-name")
planetLink.forEach(link => link.addEventListener("mouseover", handlePlanetHover))

function handlePlanetHover(e) {
  const planetHover = e.target.dataset.planet
  // Changer le matériau de la planète hover pour un `MeshBasicMaterial` (sans lumière)
  planetsProcessed.forEach(planet => {
    if(planet.name.toLowerCase() === planetHover){
      // Ajoute une brillance blanche
      planet.planet.material.emissive = new THREE.Color(0xc0c0c0)
      // Contrôle l'intensité de la brillance
      planet.planet.material.emissiveIntensity = 1
    }
    else {
      planet.planet.material.emissive = new THREE.Color(0x000000);  // Retirer l'émission
    }
  })
}

planetLink.forEach(link => link.addEventListener("mouseout", () => deleteHoverPlanet(link)))

function deleteHoverPlanet(link) {
  planetsProcessed.forEach(planet => planet.planet.material.emissive = new THREE.Color(0x000000))
}

// Redimensionner la scène quand la fenêtre change de taille
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})